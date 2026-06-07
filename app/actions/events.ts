"use server";

import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type EventClaimResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Helper to securely get current logged-in user ID via Server Session cookie.
 */
async function getUserIdSecurely(): Promise<{ userId: string } | { error: string }> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("sb-dmmgzpiskyocdsxamrgf-auth-token");

  if (!sessionCookie?.value) {
    return { error: "Not authenticated. Please sign in again." };
  }

  let accessToken: string;
  try {
    let raw = sessionCookie.value;
    if (raw.startsWith("base64-")) {
      raw = Buffer.from(raw.slice(7), "base64").toString("utf-8");
    }
    const parsed = JSON.parse(raw);
    accessToken = Array.isArray(parsed) ? parsed[0] : parsed.access_token;
  } catch {
    return { error: "Invalid session format." };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) {
    return { error: "Session expired. Please sign in again." };
  }

  return { userId: data.user.id };
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
