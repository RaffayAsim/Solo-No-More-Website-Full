"use server";

import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import { checkProfileCompleteness } from "@/lib/profile-completeness";
import { writeNotification } from "@/lib/server/notify";
import { parseEventDescription } from "@/lib/event-metadata";
import { findAuthUserByEmail, isValidEmail } from "@/lib/server/auth-users";
import { PAYMENT_PROOFS_BUCKET, parseImageDataUrl, storeImageDataUrl } from "@/lib/server/storage";
import { buildWhatsAppProofLink } from "@/lib/payment-config";
import { notifyAdminByEmail } from "@/lib/server/email";
import { getSiteUrl } from "@/lib/server/site-url";

export interface BookEventTicketInput {
  eventId: string;
  tierId?: string;
  tierName?: string;
  /** Ignored — the price is always taken from the event on the server. */
  tierPrice?: number;
  isCoupleBooking?: boolean;
  partnerType?: "existing" | "new";
  partnerName?: string;
  partnerEmail?: string;
  partnerPhone?: string;
  partnerCnic?: string;
  existingPartnerId?: string;
}

export type BookEventTicketResult =
  | {
      success: true;
      /** Reference the customer quotes when paying. Also identifies the booking for proof upload. */
      bookingRef: string;
      pairCode: string;
      totalAmountPkr: number;
      ticketCount: number;
      tierName: string;
      isFree: boolean;
      /** True when an earlier unpaid booking for this event was picked up again. */
      resumed?: boolean;
    }
  | {
      success: false;
      error: string;
      code?: "PROFILE_INCOMPLETE" | "MEMBERS_ONLY" | "ERROR";
      missingFields?: any[];
    };

/** How long an unpaid reservation (no proof uploaded yet) holds its seats. */
const UNPAID_HOLD_MS = 24 * 60 * 60 * 1000;

function makeQrId(eventId: string): string {
  return `TKT-${eventId.substring(0, 5).toUpperCase()}-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

function makeBookingRef(): string {
  return `BK-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

/** Seats currently taken or held for an event (optionally for a single tier). */
async function countHeldSeats(eventId: string, tierId?: string | null): Promise<number> {
  const { data } = await (supabaseAdmin.from("event_tickets") as any)
    .select("ticket_status, payment_status, created_at, tier_id")
    .eq("event_id", eventId)
    .neq("ticket_status", "cancelled");

  const cutoff = Date.now() - UNPAID_HOLD_MS;
  return (data || []).filter((t: any) => {
    if (tierId && t.tier_id !== tierId) return false;
    if (t.ticket_status !== "pending") return true; // active or scanned
    if (t.payment_status === "submitted") return true; // proof uploaded, awaiting admin
    return new Date(t.created_at).getTime() > cutoff; // recent unpaid hold
  }).length;
}

/**
 * Server Action: Reserve event passes.
 *
 * Free events are confirmed immediately. Paid events create a PENDING reservation;
 * the customer then pays by bank transfer and uploads proof with
 * `submitTicketPaymentProofAction`. Passes only become valid at the door after an
 * admin approves the payment.
 */
export async function bookEventTicketAction(
  input: BookEventTicketInput
): Promise<BookEventTicketResult> {
  const auth = await getSessionUserSecurely();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }
  const userId = auth.userId;

  // 1. Profile & completeness gate
  const { data: profile } = await (supabaseAdmin.from("profiles") as any)
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) {
    return { success: false, error: "Profile not found." };
  }
  if (profile.account_status === "suspended" || profile.account_status === "rejected") {
    return { success: false, error: "Your account is not allowed to book events. Please contact support." };
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

  // 2. Event must exist, be published and be in the future
  const { data: event, error: eventErr } = await (supabaseAdmin.from("official_events") as any)
    .select("*")
    .eq("id", input.eventId)
    .single();

  if (eventErr || !event) {
    return { success: false, error: "Event not found." };
  }

  const { metadata } = parseEventDescription(event.description || "");

  if (metadata?.status === "draft" || metadata?.status === "pending_review") {
    return { success: false, error: "This event is not open for booking yet." };
  }
  if (new Date(event.scheduled_at).getTime() < Date.now()) {
    return { success: false, error: "This event has already taken place. Bookings are closed." };
  }

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

  // 3. Price & tier — always from the event record, never from the browser
  const hasRichMeta = (event.description || "").includes("SNM_EVENT_META");
  const tiers = hasRichMeta && Array.isArray(metadata?.tier_packages) ? metadata.tier_packages : [];

  let singlePrice = Number(event.price) || 0;
  let selectedTierName = "General Admission";
  let selectedTierId: string | null = null;
  let tierSpots: number | null = null;

  if (tiers.length > 0) {
    const matched = input.tierId
      ? tiers.find((t: any) => t.id === input.tierId)
      : input.tierName
      ? tiers.find((t: any) => t.name === input.tierName)
      : tiers[0];
    if (!matched) {
      return { success: false, error: "That pass type is no longer available. Please reselect." };
    }
    singlePrice = Number(matched.price) || 0;
    selectedTierName = matched.name || selectedTierName;
    selectedTierId = matched.id || null;
    tierSpots = Number(matched.spots) > 0 ? Number(matched.spots) : null;
  }
  if (singlePrice < 0) singlePrice = 0;

  const isCouple = !!input.isCoupleBooking;
  const ticketCount = isCouple ? 2 : 1;
  const totalAmountPkr = singlePrice * ticketCount;

  // 4. Companion details (couple bookings)
  let companionUserId: string | null = null;
  let companionName = (input.partnerName || "").trim().slice(0, 120);
  let companionEmail = (input.partnerEmail || "").trim().toLowerCase().slice(0, 200);
  const companionPhone = (input.partnerPhone || "").trim().slice(0, 30);

  if (isCouple) {
    if (input.partnerType === "existing") {
      if (!isValidEmail(companionEmail)) {
        return { success: false, error: "Enter your companion's registered email address." };
      }
      const partnerAuth = await findAuthUserByEmail(companionEmail);
      if (!partnerAuth || partnerAuth.id === userId) {
        return {
          success: false,
          error: "No other member account was found with that email. Add them as a new guest instead.",
        };
      }
      const { data: partnerProfile } = await (supabaseAdmin.from("profiles") as any)
        .select("full_name")
        .eq("id", partnerAuth.id)
        .maybeSingle();
      const { data: partnerTickets } = await (supabaseAdmin.from("event_tickets") as any)
        .select("id")
        .eq("event_id", event.id)
        .eq("user_id", partnerAuth.id)
        .neq("ticket_status", "cancelled")
        .limit(1);
      if (partnerTickets && partnerTickets.length > 0) {
        return { success: false, error: "Your companion already has a pass for this event." };
      }
      companionUserId = partnerAuth.id;
      companionName = partnerProfile?.full_name || companionName || "Member Guest";
    } else if (!companionName) {
      return { success: false, error: "Please enter your companion's name." };
    }
  }

  // 5. An existing booking for this event?
  const { data: existingRows } = await (supabaseAdmin.from("event_tickets") as any)
    .select("id, ticket_status, payment_status, payment_reference, pair_code, is_couple_booking, is_guest_entry, tier_id")
    .eq("event_id", event.id)
    .eq("user_id", userId)
    .neq("ticket_status", "cancelled");

  // Someone else already added this member as the companion on their booking.
  if ((existingRows || []).some((t: any) => t.is_guest_entry)) {
    return {
      success: false,
      error: "You are already included as a companion on another member's booking for this event.",
    };
  }

  const mine = (existingRows || []).filter((t: any) => t.ticket_status !== "cancelled" && !t.is_guest_entry);
  const confirmed = mine.find((t: any) => t.ticket_status === "active" || t.ticket_status === "scanned");
  if (confirmed) {
    return { success: false, error: "You already hold a pass for this event. Find it under My Passes." };
  }
  const awaitingReview = mine.find((t: any) => t.payment_status === "submitted");
  if (awaitingReview) {
    return {
      success: false,
      error: "Your payment proof for this event is already awaiting admin verification.",
    };
  }
  // Unpaid leftovers from an abandoned attempt are released and replaced.
  const stale = mine.filter((t: any) => t.ticket_status === "pending");
  for (const row of stale) {
    if (row.payment_reference) {
      await (supabaseAdmin.from("event_tickets") as any)
        .delete()
        .eq("event_id", event.id)
        .eq("payment_reference", row.payment_reference)
        .eq("ticket_status", "pending");
    } else {
      await (supabaseAdmin.from("event_tickets") as any).delete().eq("id", row.id);
    }
  }

  // 6. Capacity (event-wide, and per tier when the tier has a seat limit)
  const held = await countHeldSeats(event.id);
  if (held + ticketCount > Number(event.max_capacity || 0)) {
    return { success: false, error: "Sorry, this event is fully booked." };
  }
  if (tierSpots && selectedTierId) {
    const tierHeld = await countHeldSeats(event.id, selectedTierId);
    if (tierHeld + ticketCount > tierSpots) {
      return { success: false, error: `Sorry, "${selectedTierName}" passes are sold out.` };
    }
  }

  // 7. Create the reservation rows
  const isFree = totalAmountPkr === 0;
  const bookingRef = makeBookingRef();
  const pairCode = isCouple ? `PAIR_${bookingRef}` : "";
  const buyerEmail = auth.email || null;

  const baseRow = {
    event_id: event.id,
    ticket_status: isFree ? "active" : "pending",
    payment_status: isFree ? "paid" : "pending",
    payment_method: isFree ? "free" : "bank_transfer",
    payment_reference: bookingRef,
    pair_code: pairCode || null,
    is_couple_booking: isCouple,
    tier_id: selectedTierId,
    tier_name: selectedTierName,
  };

  const { error: hostErr } = await (supabaseAdmin.from("event_tickets") as any).insert({
    ...baseRow,
    user_id: userId,
    is_guest_entry: false,
    amount_paid_pkr: totalAmountPkr,
    user_name: profile.full_name,
    user_email: buyerEmail,
    user_phone: profile.phone,
    qr_id: makeQrId(event.id),
  });

  if (hostErr) {
    console.error("[bookEventTicketAction] Ticket insert failed:", hostErr);
    return { success: false, error: "Could not reserve your pass. Please try again." };
  }

  if (isCouple) {
    const { error: companionErr } = await (supabaseAdmin.from("event_tickets") as any).insert({
      ...baseRow,
      user_id: companionUserId,
      is_guest_entry: true,
      invited_by_email: buyerEmail,
      invited_by_name: profile.full_name,
      amount_paid_pkr: 0,
      user_name: companionName || "Partner Guest",
      user_email: companionEmail || null,
      user_phone: companionPhone || null,
      qr_id: makeQrId(event.id),
    });

    if (companionErr) {
      console.error("[bookEventTicketAction] Companion insert failed:", companionErr);
      // Roll the booking back so the customer is never charged for a pass that does not exist.
      await (supabaseAdmin.from("event_tickets") as any)
        .delete()
        .eq("event_id", event.id)
        .eq("payment_reference", bookingRef);
      const duplicate = /duplicate|unique/i.test(companionErr.message || "");
      return {
        success: false,
        error: duplicate
          ? "Your companion already has a pass for this event."
          : "Could not reserve the companion pass. Please run the latest database migration or try again.",
      };
    }
  }

  if (isFree) {
    await writeNotification(
      userId,
      "spot_available" as any,
      "🎟 PASS CONFIRMED",
      `Your free pass for "${event.title}" is confirmed. Show the QR code at the door.`
    );
  }

  return {
    success: true,
    bookingRef,
    pairCode,
    totalAmountPkr,
    ticketCount,
    tierName: selectedTierName,
    isFree,
  };
}

export interface SubmitTicketPaymentProofInput {
  bookingRef: string;
  /** Compressed image data URL of the transfer receipt. */
  proofImage: string;
  transactionRef?: string;
  paymentMethod?: "bank_transfer" | "raast" | "sadapay";
}

export type SubmitTicketPaymentProofResult =
  | { success: true; whatsappUrl: string }
  | { success: false; error: string };

/**
 * Server Action: Attach bank-transfer proof to a pending booking and queue it for
 * admin verification. Everything the admin needs (payer, event, amount, screenshot,
 * transaction ID) lands in the Admin → Payments queue.
 */
export async function submitTicketPaymentProofAction(
  input: SubmitTicketPaymentProofInput
): Promise<SubmitTicketPaymentProofResult> {
  const auth = await getSessionUserSecurely();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }
  const userId = auth.userId;

  const bookingRef = (input.bookingRef || "").trim();
  if (!/^BK-[0-9A-F]{8}$/.test(bookingRef)) {
    return { success: false, error: "Invalid booking reference." };
  }
  if (!parseImageDataUrl(input.proofImage)) {
    return { success: false, error: "Please upload a screenshot of your payment (JPG or PNG, under 3 MB)." };
  }
  const transactionRef = (input.transactionRef || "").trim().slice(0, 64);
  const paymentMethod = ["bank_transfer", "raast", "sadapay"].includes(input.paymentMethod || "")
    ? (input.paymentMethod as string)
    : "bank_transfer";

  const { data: tickets } = await (supabaseAdmin.from("event_tickets") as any)
    .select("id, event_id, user_id, ticket_status, payment_status, amount_paid_pkr, user_name, user_email, user_phone, tier_name")
    .eq("payment_reference", bookingRef);

  const rows = tickets || [];
  const hostRow = rows.find((t: any) => t.user_id === userId && Number(t.amount_paid_pkr) > 0) ||
    rows.find((t: any) => t.user_id === userId);
  if (!hostRow) {
    return { success: false, error: "Booking not found. Please start the booking again." };
  }
  if (hostRow.ticket_status !== "pending") {
    return { success: false, error: "This booking is no longer awaiting payment." };
  }
  if (hostRow.payment_status === "submitted") {
    return { success: false, error: "Payment proof was already submitted for this booking." };
  }

  const { data: event } = await (supabaseAdmin.from("official_events") as any)
    .select("id, title")
    .eq("id", hostRow.event_id)
    .maybeSingle();

  const amountPkr = rows.reduce((sum: number, t: any) => sum + (Number(t.amount_paid_pkr) || 0), 0);

  const proofRef = await storeImageDataUrl(PAYMENT_PROOFS_BUCKET, `tickets/${userId}`, input.proofImage);
  if (!proofRef) {
    return { success: false, error: "The screenshot could not be read. Please upload it again." };
  }

  const { error: insertError } = await (supabaseAdmin.from("payment_submissions") as any).insert({
    user_id: userId,
    purpose: "event_ticket",
    tier_requested: `event_ticket:${hostRow.event_id}`,
    event_id: hostRow.event_id,
    booking_ref: bookingRef,
    ticket_count: rows.length,
    amount_pkr: amountPkr,
    payment_method: paymentMethod,
    transaction_ref: transactionRef || "N/A",
    proof_image_url: proofRef,
    payer_name: hostRow.user_name,
    payer_email: hostRow.user_email || auth.email || null,
    payer_phone: hostRow.user_phone,
    item_label: `${event?.title || "Event"} — ${hostRow.tier_name || "Pass"} × ${rows.length}`,
    status: "pending",
  });

  if (insertError) {
    console.error("[submitTicketPaymentProofAction] Insert failed:", insertError);
    return {
      success: false,
      error: "Could not record your payment proof. Please try again in a moment or contact support on WhatsApp.",
    };
  }

  await (supabaseAdmin.from("event_tickets") as any)
    .update({ payment_status: "submitted", payment_method: paymentMethod })
    .eq("payment_reference", bookingRef)
    .eq("ticket_status", "pending");

  await writeNotification(
    userId,
    "spot_available" as any,
    "💳 PAYMENT PROOF RECEIVED",
    `We received your payment proof for "${event?.title || "your event"}" (${bookingRef}). Your pass will activate once an admin verifies it.`
  );

  await notifyAdminByEmail(
    "Event pass payment proof to verify",
    [
      `${hostRow.user_name || "A member"} uploaded proof for "${event?.title || "an event"}" — ${rows.length} pass(es), PKR ${amountPkr.toLocaleString("en-US")}, booking ${bookingRef}.`,
    ],
    { label: "Open payments queue", url: `${await getSiteUrl()}/admin/payments` }
  );

  return {
    success: true,
    whatsappUrl: buildWhatsAppProofLink({
      purpose: `Event pass — ${event?.title || "Event"}`,
      amountPkr,
      reference: bookingRef,
      transactionRef: transactionRef || undefined,
      payerName: hostRow.user_name || undefined,
    }),
  };
}

/**
 * Server Action: Cancel the caller's own unpaid reservation (frees the seats).
 */
export async function cancelPendingBookingAction(
  bookingRef: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await getSessionUserSecurely();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }
  const ref = (bookingRef || "").trim();
  if (!/^BK-[0-9A-F]{8}$/.test(ref)) return { success: false, error: "Invalid booking reference." };

  const { data: own } = await (supabaseAdmin.from("event_tickets") as any)
    .select("id, payment_status")
    .eq("payment_reference", ref)
    .eq("user_id", auth.userId)
    .eq("ticket_status", "pending")
    .limit(1);

  if (!own || own.length === 0) return { success: true };
  if (own[0].payment_status === "submitted") {
    return { success: false, error: "This booking is already under verification and cannot be cancelled here." };
  }

  await (supabaseAdmin.from("event_tickets") as any)
    .delete()
    .eq("payment_reference", ref)
    .eq("ticket_status", "pending");

  return { success: true };
}
