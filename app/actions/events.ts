"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUserSecurely } from "@/lib/supabase/session";

export type EventClaimResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Helper to securely get current logged-in user ID via Server Session cookie.
 */
async function getUserIdSecurely(): Promise<{ userId: string } | { error: string }> {
  const result = await getSessionUserSecurely();
  if ("error" in result) {
    return { error: result.error };
  }
  return { userId: result.userId };
}

/**
 * Server Action: Claim a free VIP ticket to an Official Event (Family Tier only).
 */
export async function claimTicket(eventId: string): Promise<EventClaimResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }
  const userId = authCheck.userId;

  // 1. Fetch user subscription tier to enforce authorization
  const { data: profile, error: profileError } = await (supabaseAdmin
    .from("profiles") as any)
    .select("subscription_tier")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return { success: false, error: "Profile not found." };
  }

  if (profile.subscription_tier !== "family") {
    return {
      success: false,
      error: "Official VIP ticket claims are exclusive to the Family Tier. Please upgrade to claim your free pass.",
    };
  }

  // 2. Fetch event to verify capacity
  const { data: event, error: eventError } = await (supabaseAdmin
    .from("official_events") as any)
    .select("max_capacity")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return { success: false, error: "Official event not found." };
  }

  // 3. Count currently claimed active tickets
  const { count, error: countError } = await (supabaseAdmin
    .from("event_tickets") as any)
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("ticket_status", "active");

  if (countError) {
    return { success: false, error: "Failed to verify event capacity." };
  }

  if (count !== null && count >= event.max_capacity) {
    return { success: false, error: "This event is fully booked." };
  }

  // 4. Insert ticket record. Enforces unique constraint (event_id, user_id)
  const { error: insertError } = await (supabaseAdmin
    .from("event_tickets") as any)
    .insert({
      event_id: eventId,
      user_id: userId,
      ticket_status: "active",
    });

  if (insertError) {
    if (insertError.message?.toLowerCase().includes("duplicate") ||
        insertError.message?.toLowerCase().includes("unique")) {
      return { success: false, error: "You have already claimed a VIP ticket for this event." };
    }
    return { success: false, error: "Failed to claim ticket. Please try again." };
  }

  return { success: true };
}

export interface SubmitEventTicketPaymentInput {
  eventId: string;
  amountPkr: number;
  paymentMethod: "raast" | "sadapay" | "bank_transfer";
  transactionRef: string;
}

/**
 * Server Action: Submit Raast / SadaPay / Bank Transfer payment proof for Event Ticket purchase.
 */
export async function submitEventTicketPaymentAction(
  input: SubmitEventTicketPaymentInput
): Promise<EventClaimResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }
  const userId = authCheck.userId;

  if (!input.transactionRef || !input.transactionRef.trim()) {
    return { success: false, error: "Transaction Reference / TID is required." };
  }

  // 1. Fetch event to verify capacity and title
  const { data: event, error: eventError } = await (supabaseAdmin
    .from("official_events") as any)
    .select("title, max_capacity")
    .eq("id", input.eventId)
    .single();

  if (eventError || !event) {
    return { success: false, error: "Official event not found." };
  }

  // 2. Count active tickets
  const { count } = await (supabaseAdmin
    .from("event_tickets") as any)
    .select("*", { count: "exact", head: true })
    .eq("event_id", input.eventId)
    .eq("ticket_status", "active");

  if (count !== null && count >= event.max_capacity) {
    return { success: false, error: "This event is already fully booked." };
  }

  // 3. Record payment submission
  const { error: insertError } = await (supabaseAdmin
    .from("payment_submissions") as any)
    .insert({
      user_id: userId,
      amount_pkr: input.amountPkr,
      tier_requested: `event_ticket:${input.eventId}`,
      payment_method: input.paymentMethod,
      transaction_ref: input.transactionRef.trim(),
      status: "pending",
    });

  if (insertError) {
    if (!insertError.message?.includes("schema cache") && !insertError.message?.includes("does not exist")) {
      return { success: false, error: "Failed to record payment proof. Please try again." };
    }
  }

  // 4. Notify user
  try {
    const { writeNotification } = await import("@/app/actions/notifications");
    await writeNotification(
      userId,
      "spot_available" as any,
      "🎟 TICKET PROOF RECEIVED",
      `Your transaction TID (${input.transactionRef.trim()}) for "${event.title}" is queued for verification.`
    );
  } catch {}

  return { success: true };
}

/**
 * Developer Testing Action: Simulate instant ticket booking.
 */
export async function buyTicketDevInstantAction(eventId: string): Promise<EventClaimResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }
  const userId = authCheck.userId;

  const { error } = await (supabaseAdmin
    .from("event_tickets") as any)
    .upsert({
      event_id: eventId,
      user_id: userId,
      ticket_status: "active",
    }, { onConflict: "event_id,user_id" });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export interface CreateArtistEventInput {
  title: string;
  description?: string;
  venue_name: string;
  price: number;
  max_capacity: number;
  scheduled_at: string;
}

/**
 * Server Action: Create an artist / promoter ticketed event (artist_split).
 */
export async function createArtistEventAction(
  input: CreateArtistEventInput
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }

  if (!input.title?.trim()) {
    return { success: false, error: "Event title is required." };
  }

  const { data, error } = await (supabaseAdmin
    .from("official_events") as any)
    .insert({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      venue_name: input.venue_name?.trim() || "Karachi Venue",
      event_type: "artist_split",
      price: Number(input.price) || 0,
      max_capacity: Number(input.max_capacity) || 100,
      scheduled_at: input.scheduled_at,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message || "Failed to list artist event." };
  }

  return { success: true, eventId: data?.id };
}

/**
 * Server Action: Check in / admit a ticket holder at the event gate.
 */
export async function checkInAttendeeAction(
  ticketId: string
): Promise<{ success: boolean; error?: string }> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }

  const { error } = await (supabaseAdmin
    .from("event_tickets") as any)
    .update({ ticket_status: "admitted" })
    .eq("id", ticketId);

  if (error) {
    return { success: false, error: "Failed to admit attendee." };
  }

  return { success: true };
}


