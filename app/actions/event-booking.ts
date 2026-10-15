"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import { checkProfileCompleteness } from "@/lib/profile-completeness";
import { initSafepayCheckout } from "@/lib/safepay";
import { writeNotification } from "@/app/actions/notifications";
import { parseEventDescription } from "@/lib/event-metadata";

export interface BookEventTicketInput {
  eventId: string;
  tierId?: string;
  tierName?: string;
  tierPrice?: number;
  isCoupleBooking?: boolean;
  partnerType?: "existing" | "new";
  partnerName?: string;
  partnerEmail?: string;
  partnerPhone?: string;
  partnerCnic?: string;
  existingPartnerId?: string;
  redirectUrl?: string;
  cancelUrl?: string;
}

export type BookEventTicketResult =
  | {
      success: true;
      pairCode: string;
      checkoutUrl: string;
      trackerToken: string;
      totalAmountPkr: number;
      isFree?: boolean;
    }
  | {
      success: false;
      error: string;
      code?: "PROFILE_INCOMPLETE" | "MEMBERS_ONLY" | "ERROR";
      missingFields?: any[];
    };

export async function bookEventTicketAction(
  input: BookEventTicketInput
): Promise<BookEventTicketResult> {
  const auth = await getSessionUserSecurely();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }
  const userId = auth.userId;

  // 1. Fetch user profile & enforce completeness gate
  const { data: profile } = await (supabaseAdmin.from("profiles") as any)
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) {
    return { success: false, error: "Profile not found." };
  }

  const completeness = checkProfileCompleteness(profile);
  if (!completeness.isComplete) {
    return {
      success: false,
      error: "PROFILE_INCOMPLETE",
      code: "PROFILE_INCOMPLETE",
      missingFields: completeness.missingFields,
    };
  }

  // 2. Fetch event details
  const { data: event, error: eventErr } = await (supabaseAdmin.from("official_events") as any)
    .select("*")
    .eq("id", input.eventId)
    .single();

  if (eventErr || !event) {
    return { success: false, error: "Event not found." };
  }

  // Check Members Only gate
  const { metadata } = parseEventDescription(event.description || "");
  const isMembersOnly =
    event.category?.toLowerCase().includes("member") ||
    metadata?.visibility === "members_only" ||
    metadata?.event_category === "community_event" ||
    metadata?.is_members_only === true ||
    metadata?.access_type === "members_only";

  if (isMembersOnly && (profile.is_guest || profile.account_status !== "approved")) {
    return {
      success: false,
      code: "MEMBERS_ONLY",
      error: "This experience is reserved for verified Members only. Please apply for vetted membership to unlock.",
    };
  }

  // 3. Pricing & Tier determination
  let singlePrice = event.price || 0;
  let selectedTierName = "General Admission";

  if (metadata?.tier_packages && metadata.tier_packages.length > 0) {
    const matched = metadata.tier_packages.find((t: any) => t.id === input.tierId || t.name === input.tierName);
    if (matched) {
      singlePrice = Number(matched.price) || 0;
      selectedTierName = matched.name;
    }
  }

  const isCouple = !!input.isCoupleBooking;
  const ticketCount = isCouple ? 2 : 1;
  const totalAmountPkr = singlePrice * ticketCount;
  const pairCode = isCouple ? `PAIR_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}` : "";

  // 4. Generate unique QR identifiers for door scanner
  const hostQrId = `TKTPASS-${event.id.substring(0, 5)}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const companionQrId = isCouple ? `TKTPASS-${event.id.substring(0, 5)}-${Math.random().toString(36).substring(2, 9).toUpperCase()}` : null;

  // 5. If event is free, confirm immediately
  if (totalAmountPkr === 0) {
    // Insert host ticket
    await (supabaseAdmin.from("event_tickets") as any).insert({
      event_id: event.id,
      user_id: userId,
      ticket_status: "active",
      pair_code: pairCode || null,
      is_couple_booking: isCouple,
      is_guest_entry: false,
      tier_id: input.tierId || null,
      tier_name: selectedTierName,
      amount_paid_pkr: 0,
      payment_method: "safepay",
      payment_status: "paid",
      user_name: profile.full_name,
      user_email: profile.email || "member@solonomore.com",
      user_phone: profile.phone,
      qr_id: hostQrId,
    });

    if (isCouple) {
      // Insert companion ticket
      await (supabaseAdmin.from("event_tickets") as any).insert({
        event_id: event.id,
        user_id: input.existingPartnerId || userId,
        ticket_status: "active",
        pair_code: pairCode,
        is_couple_booking: true,
        is_guest_entry: true,
        invited_by_email: profile.email || "member@solonomore.com",
        invited_by_name: profile.full_name,
        tier_id: input.tierId || null,
        tier_name: selectedTierName,
        amount_paid_pkr: 0,
        payment_method: "safepay",
        payment_status: "paid",
        user_name: input.partnerName || "Partner Guest",
        user_email: input.partnerEmail || null,
        user_phone: input.partnerPhone || null,
        qr_id: companionQrId,
      });
    }

    return {
      success: true,
      pairCode,
      checkoutUrl: "/dashboard?booking_confirmed=true",
      trackerToken: "FREE_RSVP",
      totalAmountPkr: 0,
      isFree: true,
    };
  }

  // 6. Paid event: Initialize Safepay Merchant Checkout Session
  const orderId = `EVT-${event.id.substring(0, 6)}-${Date.now()}`;
  const redirectUrl =
    input.redirectUrl ||
    `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard?payment_success=true&order_id=${orderId}&pair_code=${pairCode || "single"}`;
  const cancelUrl =
    input.cancelUrl ||
    `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/events/${event.id}?cancelled=true`;

  const safepaySession = await initSafepayCheckout({
    amountPkr: totalAmountPkr,
    orderId,
    customerEmail: profile.email || "user@solonomore.com",
    customerPhone: profile.phone || "03001234567",
    redirectUrl,
    cancelUrl,
  });

  if (!safepaySession.success || !safepaySession.token || !safepaySession.checkoutUrl) {
    return {
      success: false,
      error: safepaySession.error || "Failed to initiate Safepay payment.",
    };
  }

  // 7. Store pending reservation in database
  // Host Row
  await (supabaseAdmin.from("event_tickets") as any).insert({
    event_id: event.id,
    user_id: userId,
    ticket_status: "active", // active once verified or pending
    pair_code: pairCode || null,
    is_couple_booking: isCouple,
    is_guest_entry: false,
    tier_id: input.tierId || null,
    tier_name: selectedTierName,
    amount_paid_pkr: totalAmountPkr,
    payment_method: "safepay",
    payment_reference: safepaySession.token,
    payment_status: "pending",
    user_name: profile.full_name,
    user_email: profile.email || "user@solonomore.com",
    user_phone: profile.phone,
    qr_id: hostQrId,
  });

  if (isCouple) {
    // Companion Row
    await (supabaseAdmin.from("event_tickets") as any).insert({
      event_id: event.id,
      user_id: input.existingPartnerId || userId,
      ticket_status: "active",
      pair_code: pairCode,
      is_couple_booking: true,
      is_guest_entry: true,
      invited_by_email: profile.email || "user@solonomore.com",
      invited_by_name: profile.full_name,
      tier_id: input.tierId || null,
      tier_name: selectedTierName,
      amount_paid_pkr: 0,
      payment_method: "safepay",
      payment_reference: safepaySession.token,
      payment_status: "pending",
      user_name: input.partnerName || "Partner Guest",
      user_email: input.partnerEmail || null,
      user_phone: input.partnerPhone || null,
      qr_id: companionQrId,
    });
  }

  return {
    success: true,
    pairCode,
    checkoutUrl: safepaySession.checkoutUrl,
    trackerToken: safepaySession.token,
    totalAmountPkr,
    isFree: false,
  };
}

/**
 * Server Action: Confirm Safepay Payment and activate ticket passes.
 */
export async function confirmSafepayPaymentAction(
  trackerToken: string,
  pairCode?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const query = supabaseAdmin
      .from("event_tickets") as any;

    let updateQuery;
    if (pairCode && pairCode !== "single") {
      updateQuery = query.update({
        payment_status: "paid",
        ticket_status: "active",
        updated_at: new Date().toISOString(),
      }).eq("pair_code", pairCode);
    } else {
      updateQuery = query.update({
        payment_status: "paid",
        ticket_status: "active",
        updated_at: new Date().toISOString(),
      }).eq("payment_reference", trackerToken);
    }

    const { error } = await updateQuery;
    if (error) {
      console.error("[confirmSafepayPaymentAction] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Confirmation failed" };
  }
}
