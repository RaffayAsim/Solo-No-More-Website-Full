"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type AdminActionResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Helper to securely get current logged-in user and email via Server Session cookie.
 */
async function getUserIdSecurelyWithEmail(): Promise<{ userId: string; email: string | undefined } | { error: string }> {
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

  return { userId: data.user.id, email: data.user.email };
}

/**
 * Server-side Authorization Guard to verify if the user is an authorized admin.
 * Throws or redirects if not authorized.
 */
export async function verifyAdminStatus(): Promise<{ userId: string; email: string | undefined }> {
  const authCheck = await getUserIdSecurelyWithEmail();
  if ("error" in authCheck) {
    redirect("/login");
  }

  const adminEmail = process.env.ADMIN_EMAIL || "vibe.tester@solonomore.com";
  const isEmailAdmin = authCheck.email?.toLowerCase() === adminEmail.toLowerCase();

  if (isEmailAdmin) {
    return { userId: authCheck.userId, email: authCheck.email };
  }

  // Fallback to checking active DB profile subscription_tier
  const { data: profile } = await (supabaseAdmin
    .from("profiles") as any)
    .select("subscription_tier")
    .eq("id", authCheck.userId)
    .single();

  if (profile?.subscription_tier === "admin") {
    return { userId: authCheck.userId, email: authCheck.email };
  }

  // Unauthorized users get redirected to standard dashboard
  redirect("/dashboard");
}

/**
 * Server Action: Approve a user's account vetting status.
 */
export async function approveUserAction(profileId: string): Promise<AdminActionResult> {
  try {
    await verifyAdminStatus();
  } catch {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const { error } = await (supabaseAdmin
    .from("profiles") as any)
    .update({ account_status: "approved" })
    .eq("id", profileId);

  if (error) {
    return { success: false, error: "Failed to approve user profile." };
  }

  return { success: true };
}

/**
 * Server Action: Suspend a user's account.
 */
export async function suspendUserAction(profileId: string): Promise<AdminActionResult> {
  try {
    await verifyAdminStatus();
  } catch {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const { error } = await (supabaseAdmin
    .from("profiles") as any)
    .update({ account_status: "suspended" })
    .eq("id", profileId);

  if (error) {
    return { success: false, error: "Failed to suspend user profile." };
  }

  return { success: true };
}

/**
 * Server Action: Reset strikes count on a user's profile and restore status.
 */
export async function resetStrikesAction(profileId: string): Promise<AdminActionResult> {
  try {
    await verifyAdminStatus();
  } catch {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  // Resets no_show_strikes to 0, and updates account_status back to 'approved' if suspended/rejected
  const { error } = await (supabaseAdmin
    .from("profiles") as any)
    .update({ 
      no_show_strikes: 0,
      account_status: "approved"
    })
    .eq("id", profileId);

  if (error) {
    return { success: false, error: "Failed to reset warnings on profile." };
  }

  return { success: true };
}

export interface OfficialEventPayload {
  title: string;
  description: string;
  venue_name: string;
  event_type: "artist_split" | "platform_owned";
  price: number;
  max_capacity: number;
  scheduled_at: string;
}

/**
 * Server Action: Create a new partner/official event.
 */
export async function createEventAction(payload: OfficialEventPayload): Promise<AdminActionResult> {
  try {
    await verifyAdminStatus();
  } catch {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  if (!payload.title || !payload.scheduled_at) {
    return { success: false, error: "Title and Scheduled Date/Time are required." };
  }

  const { error } = await (supabaseAdmin
    .from("official_events") as any)
    .insert({
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      venue_name: payload.venue_name?.trim() || null,
      event_type: payload.event_type,
      price: Number(payload.price) || 0,
      max_capacity: Number(payload.max_capacity) || 100,
      scheduled_at: payload.scheduled_at,
    });

  if (error) {
    return { success: false, error: error.message || "Failed to create official event." };
  }

  return { success: true };
}

/**
 * Server Action: Update an existing official event.
 */
export async function updateEventAction(
  eventId: string,
  payload: Partial<OfficialEventPayload>
): Promise<AdminActionResult> {
  try {
    await verifyAdminStatus();
  } catch {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const updateData: any = {};
  if (payload.title !== undefined) updateData.title = payload.title.trim();
  if (payload.description !== undefined) updateData.description = payload.description?.trim() || null;
  if (payload.venue_name !== undefined) updateData.venue_name = payload.venue_name?.trim() || null;
  if (payload.event_type !== undefined) updateData.event_type = payload.event_type;
  if (payload.price !== undefined) updateData.price = Number(payload.price) || 0;
  if (payload.max_capacity !== undefined) updateData.max_capacity = Number(payload.max_capacity) || 100;
  if (payload.scheduled_at !== undefined) updateData.scheduled_at = payload.scheduled_at;

  const { error } = await (supabaseAdmin
    .from("official_events") as any)
    .update(updateData)
    .eq("id", eventId);

  if (error) {
    return { success: false, error: error.message || "Failed to update official event." };
  }

  return { success: true };
}

/**
 * Server Action: Delete an official event.
 */
export async function deleteEventAction(eventId: string): Promise<AdminActionResult> {
  try {
    await verifyAdminStatus();
  } catch {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  // To prevent constraint violations, delete any registered tickets first.
  const { error: ticketErr } = await (supabaseAdmin
    .from("event_tickets") as any)
    .delete()
    .eq("event_id", eventId);

  if (ticketErr) {
    console.error("Warning: tickets deletion returned error:", ticketErr);
  }

  const { error } = await (supabaseAdmin
    .from("official_events") as any)
    .delete()
    .eq("id", eventId);

  if (error) {
    return { success: false, error: error.message || "Failed to delete official event." };
  }

  return { success: true };
}

/**
 * Server Action: Upgrade user profile to Partner.
 */
export async function upgradeToPartnerAction(
  profileId: string,
  businessName: string
): Promise<AdminActionResult> {
  try {
    await verifyAdminStatus();
  } catch {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  if (!businessName || !businessName.trim()) {
    return { success: false, error: "Business name is required." };
  }

  const { error } = await (supabaseAdmin
    .from("profiles") as any)
    .update({
      is_partner: true,
      business_name: businessName.trim(),
    })
    .eq("id", profileId);

  if (error) {
    console.error("[upgradeToPartnerAction] DB error:", error);
    return { success: false, error: "Failed to upgrade profile to partner." };
  }

  return { success: true };
}
