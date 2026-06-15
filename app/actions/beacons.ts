"use server";

import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { CreateBeaconInput } from "@/lib/supabase/types";
import { writeNotification } from "@/app/actions/notifications";

export type CreateBeaconResult =
  | { success: true; beaconId: string }
  | { success: false; error: string };

export type BeaconActionResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Server Action: Create a new Beacon.
 */
export async function createBeacon(
  data: CreateBeaconInput
): Promise<CreateBeaconResult> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("sb-dmmgzpiskyocdsxamrgf-auth-token");
  if (!sessionCookie?.value) return { success: false, error: "Not authenticated." };

  let accessToken: string;
  try {
    let raw = sessionCookie.value;
    if (raw.startsWith("base64-")) raw = Buffer.from(raw.slice(7), "base64").toString("utf-8");
    const parsed = JSON.parse(raw);
    accessToken = Array.isArray(parsed) ? parsed[0] : parsed.access_token;
  } catch {
    return { success: false, error: "Invalid session." };
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
  if (authError || !authData.user) return { success: false, error: "Session expired. Please sign in again." };
  const userId = authData.user.id;

  const { data: profile } = await (supabaseAdmin
    .from("profiles")
    .select("account_status, city, is_partner")
    .eq("id", userId)
    .single() as any);

  if (!profile || profile.account_status !== "approved") {
    return { success: false, error: "Your account must be approved to post Beacons." };
  }

  const { title, category, visibility_mode, total_slots } = data;
  if (!title.trim()) return { success: false, error: "Title is required." };
  if (total_slots < 1 || total_slots > 10) return { success: false, error: "Slots must be between 1 and 10." };

  const isPartnerPromo = data.is_partner_offer && profile.is_partner ? true : false;
  const beaconCity = data.city || profile.city || "Karachi";

  const { data: beacon, error: insertError } = await ((supabaseAdmin
    .from("beacons") as any)
    .insert({
      host_id: userId,
      title: title.trim(),
      description: data.description?.trim() || null,
      category,
      visibility_mode,
      total_slots,
      location_name: data.location_name?.trim() || null,
      scheduled_at: data.scheduled_at || null,
      google_maps_url: data.google_maps_url || null,
      status: "active",
      city: beaconCity,
      image_url: data.image_url || null,
      is_partner_offer: isPartnerPromo,
    })
    .select("id")
    .single() as any);

  if (insertError) {
    console.error("[createBeacon] Insert error:", insertError);
    return { success: false, error: "Failed to create Beacon. Please try again." };
  }

  return { success: true, beaconId: beacon.id };
}

/**
 * Server Action: Cancel a Beacon.
 * Only allowed if filled_slots === 0 (no approved attendees).
 */
export async function cancelBeacon(beaconId: string): Promise<BeaconActionResult> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("sb-dmmgzpiskyocdsxamrgf-auth-token");
  if (!sessionCookie?.value) return { success: false, error: "Not authenticated." };

  let accessToken: string;
  try {
    let raw = sessionCookie.value;
    if (raw.startsWith("base64-")) raw = Buffer.from(raw.slice(7), "base64").toString("utf-8");
    const parsed = JSON.parse(raw);
    accessToken = Array.isArray(parsed) ? parsed[0] : parsed.access_token;
  } catch {
    return { success: false, error: "Invalid session." };
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
  if (authError || !authData.user) return { success: false, error: "Session expired." };
  const userId = authData.user.id;

  const { data: beacon, error: fetchError } = await (supabaseAdmin
    .from("beacons") as any)
    .select("host_id, filled_slots, title, status")
    .eq("id", beaconId)
    .single();

  if (fetchError || !beacon) return { success: false, error: "Beacon not found." };
  if (beacon.host_id !== userId) return { success: false, error: "Unauthorized." };
  if (beacon.status === "cancelled") return { success: false, error: "Beacon is already cancelled." };
  if (beacon.filled_slots > 0) {
    return {
      success: false,
      error: `Cannot cancel — ${beacon.filled_slots} approved attendee(s) have joined. Let the event complete or have attendees withdraw first.`,
    };
  }

  const { error: updateError } = await (supabaseAdmin
    .from("beacons") as any)
    .update({ status: "cancelled" })
    .eq("id", beaconId);

  if (updateError) return { success: false, error: "Failed to cancel beacon." };
  return { success: true };
}

/**
 * Server Action: Update beacon capacity (total_slots).
 * Cannot reduce below current filled_slots.
 * Notifies all approved guests of the change.
 */
export async function updateBeaconCapacity(
  beaconId: string,
  newTotal: number
): Promise<BeaconActionResult> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("sb-dmmgzpiskyocdsxamrgf-auth-token");
  if (!sessionCookie?.value) return { success: false, error: "Not authenticated." };

  let accessToken: string;
  try {
    let raw = sessionCookie.value;
    if (raw.startsWith("base64-")) raw = Buffer.from(raw.slice(7), "base64").toString("utf-8");
    const parsed = JSON.parse(raw);
    accessToken = Array.isArray(parsed) ? parsed[0] : parsed.access_token;
  } catch {
    return { success: false, error: "Invalid session." };
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
  if (authError || !authData.user) return { success: false, error: "Session expired." };
  const userId = authData.user.id;

  if (newTotal < 1 || newTotal > 10) return { success: false, error: "Capacity must be between 1 and 10." };

  const { data: beacon, error: fetchError } = await (supabaseAdmin
    .from("beacons") as any)
    .select("host_id, filled_slots, total_slots, title, status")
    .eq("id", beaconId)
    .single();

  if (fetchError || !beacon) return { success: false, error: "Beacon not found." };
  if (beacon.host_id !== userId) return { success: false, error: "Unauthorized." };
  if (beacon.status !== "active") return { success: false, error: "Can only edit active beacons." };
  if (newTotal < beacon.filled_slots) {
    return {
      success: false,
      error: `Cannot reduce below ${beacon.filled_slots} — that many members are already approved.`,
    };
  }
  if (newTotal === beacon.total_slots) return { success: true };

  const { error: updateError } = await (supabaseAdmin
    .from("beacons") as any)
    .update({ total_slots: newTotal })
    .eq("id", beaconId);

  if (updateError) return { success: false, error: "Failed to update capacity." };

  // Notify approved guests
  if (beacon.filled_slots > 0) {
    const { data: approvedApps } = await (supabaseAdmin
      .from("beacon_applications") as any)
      .select("applicant_id")
      .eq("beacon_id", beaconId)
      .eq("status", "approved");

    if (approvedApps) {
      const direction = newTotal > beacon.total_slots ? "increased" : "decreased";
      for (const app of approvedApps) {
        await writeNotification(
          app.applicant_id,
          "capacity_changed",
          "◉ SQUAD CAPACITY UPDATED",
          `Host updated "${beacon.title}" capacity: ${beacon.total_slots} → ${newTotal} slots (${direction}).`,
          beaconId
        );
      }
    }
  }

  return { success: true };
}

/**
 * Server Action: Update live beacon location, time, and maps link.
 */
export async function updateLiveBeacon(
  beaconId: string,
  newLocation: string,
  newTime: string,
  newGoogleMapsUrl: string | null
): Promise<BeaconActionResult> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("sb-dmmgzpiskyocdsxamrgf-auth-token");
  if (!sessionCookie?.value) return { success: false, error: "Not authenticated." };

  let accessToken: string;
  try {
    let raw = sessionCookie.value;
    if (raw.startsWith("base64-")) raw = Buffer.from(raw.slice(7), "base64").toString("utf-8");
    const parsed = JSON.parse(raw);
    accessToken = Array.isArray(parsed) ? parsed[0] : parsed.access_token;
  } catch {
    return { success: false, error: "Invalid session." };
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
  if (authError || !authData.user) return { success: false, error: "Session expired." };
  const userId = authData.user.id;

  const { data: beacon, error: fetchError } = await (supabaseAdmin
    .from("beacons") as any)
    .select("host_id, title, status, location_name, scheduled_at, filled_slots")
    .eq("id", beaconId)
    .single();

  if (fetchError || !beacon) return { success: false, error: "Beacon not found." };
  if (beacon.host_id !== userId) return { success: false, error: "Unauthorized. Only the host can reschedule this event." };
  if (beacon.status === "cancelled") return { success: false, error: "Cannot modify a cancelled beacon." };

  const { error: updateError } = await (supabaseAdmin
    .from("beacons") as any)
    .update({
      location_name: newLocation.trim() || null,
      scheduled_at: newTime || null,
      google_maps_url: newGoogleMapsUrl ? newGoogleMapsUrl.trim() : null
    })
    .eq("id", beaconId);

  if (updateError) return { success: false, error: "Failed to reschedule beacon plans." };

  const formatScheduledAtDate = (iso: string | null): string => {
    if (!iso) return "TBD";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
    });
  };

  // Notify approved guests about the plan updates
  if (beacon.filled_slots > 0) {
    const { data: approvedApps } = await (supabaseAdmin
      .from("beacon_applications") as any)
      .select("applicant_id")
      .eq("beacon_id", beaconId)
      .eq("status", "approved");

    if (approvedApps) {
      for (const app of approvedApps) {
        await writeNotification(
          app.applicant_id,
          "capacity_changed",
          "🕐 SQUAD PLAN UPDATED",
          `Host updated "${beacon.title}" plans: ${newLocation.trim() || "TBD"} at ${formatScheduledAtDate(newTime)}.`,
          beaconId
        );
      }
    }
  }

  return { success: true };
}
