"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { CreateBeaconInput, BeaconCategory } from "@/lib/supabase/types";
import { writeNotification } from "@/app/actions/notifications";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import { checkProfileCompleteness } from "@/lib/profile-completeness";

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
  const authCheck = await getSessionUserSecurely();
  if ("error" in authCheck) return { success: false, error: authCheck.error };
  const userId = authCheck.userId;

  const { data: profile } = await (supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single() as any);

  if (!profile || profile.account_status !== "approved") {
    return { success: false, error: "Your account must be approved to post Beacons." };
  }

  // Profile Completeness Gate for regular member hangouts
  if (!data.is_partner_offer) {
    const completeness = checkProfileCompleteness(profile);
    if (!completeness.isComplete) {
      const missingLabels = completeness.missingFields.map((f) => f.label).join(", ");
      return {
        success: false,
        error: `PROFILE_INCOMPLETE: Please complete your verified safety profile before hosting hangouts (Missing: ${missingLabels}).`,
      };
    }
  }

  const isPartner = !!profile.is_partner;
  const isAdmin = profile.subscription_tier === "admin";
  const isArtist = profile.subscription_tier === "artist";

  // Partners, Admins, and Artists cannot create regular member hangouts
  if (!data.is_partner_offer) {
    if (isPartner || isAdmin || isArtist) {
      return {
        success: false,
        error: "Partner, artist, and admin accounts cannot create personal member beacons. Partners can broadcast promo deals through the Partner Command Center.",
      };
    }
  } else {
    if (!isPartner) {
      return {
        success: false,
        error: "Only verified partner accounts can broadcast promotional venue offers.",
      };
    }
  }

  const { title, category, visibility_mode, total_slots } = data;
  if (!title.trim()) return { success: false, error: "Title is required." };
  if (total_slots < 1 || total_slots > 10) return { success: false, error: "Slots must be between 1 and 10." };

  const isPartnerPromo = data.is_partner_offer && isPartner ? true : false;
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

export interface CancelBeaconResult {
  success: boolean;
  error?: string;
  downgraded?: boolean;
}

/**
 * Server Action: Cancel / Delete a Beacon.
 * If filled_slots > 0 (audience has joined), requires acceptDowngrade confirmation and lowers host trust score.
 * If filled_slots === 0 (no audience joined), cancelled with ZERO penalty.
 */
export async function cancelBeacon(
  beaconId: string,
  acceptDowngrade: boolean = false
): Promise<CancelBeaconResult> {
  const authCheck = await getSessionUserSecurely();
  if ("error" in authCheck) return { success: false, error: authCheck.error };
  const userId = authCheck.userId;

  const { data: beacon, error: fetchError } = await (supabaseAdmin
    .from("beacons") as any)
    .select("host_id, filled_slots, title, status, scheduled_at")
    .eq("id", beaconId)
    .single();

  if (fetchError || !beacon) return { success: false, error: "Beacon not found." };
  if (beacon.host_id !== userId) return { success: false, error: "Unauthorized. You are not hosting this Beacon." };
  if (beacon.status === "cancelled") return { success: false, error: "Beacon is already cancelled." };

  const hasAudience = (beacon.filled_slots || 0) > 0;

  if (hasAudience && !acceptDowngrade) {
    return {
      success: false,
      error: `AUDIENCE_CONFIRMATION_REQUIRED:${beacon.filled_slots}`,
    };
  }

  // 1. Cancel the beacon
  const { error: updateError } = await (supabaseAdmin
    .from("beacons") as any)
    .update({ status: "cancelled" })
    .eq("id", beaconId);

  if (updateError) return { success: false, error: "Failed to cancel beacon." };

  // 2. If had audience, apply downgrade consequence & notify members
  if (hasAudience) {
    // Record cancellation strike to host profile
    const { data: profile } = await (supabaseAdmin
      .from("profiles") as any)
      .select("no_show_strikes")
      .eq("id", userId)
      .single();

    const currentStrikes = profile?.no_show_strikes || 0;
    await (supabaseAdmin.from("profiles") as any)
      .update({ no_show_strikes: currentStrikes + 1 })
      .eq("id", userId);

    // Notify all approved members
    const { data: approvedApps } = await (supabaseAdmin
      .from("beacon_applications") as any)
      .select("applicant_id")
      .eq("beacon_id", beaconId)
      .eq("status", "approved");

    for (const app of approvedApps || []) {
      await writeNotification(
        app.applicant_id,
        "beacon_cancelled",
        "⚠️ SQUAD MEETUP CANCELLED BY HOST",
        `The host had to cancel "${beacon.title}". We apologize for the inconvenience!`,
        beaconId
      );
    }

    return { success: true, downgraded: true };
  }

  return { success: true, downgraded: false };
}

/**
 * Server Action: Partner Cancels / Archives an Offer (Zero penalty, clean removal).
 */
export async function cancelPartnerOfferAction(offerId: string): Promise<BeaconActionResult> {
  const authCheck = await getSessionUserSecurely();
  if ("error" in authCheck) return { success: false, error: authCheck.error };
  const userId = authCheck.userId;

  const { data: beacon, error: fetchError } = await (supabaseAdmin
    .from("beacons") as any)
    .select("host_id, is_partner_offer, status")
    .eq("id", offerId)
    .single();

  if (fetchError || !beacon) return { success: false, error: "Offer not found." };
  if (beacon.host_id !== userId) return { success: false, error: "Unauthorized. You do not own this offer." };

  const { error: updateError } = await (supabaseAdmin
    .from("beacons") as any)
    .update({ status: "cancelled" })
    .eq("id", offerId);

  if (updateError) return { success: false, error: "Failed to remove offer." };
  return { success: true };
}

/**
 * Server Action: Check if an empty beacon has reached/approached time, sending host auto-cancel alert with 0 penalty.
 */
export async function checkEmptyBeaconTimeAlert(beaconId: string): Promise<BeaconActionResult> {
  const { data: beacon } = await (supabaseAdmin
    .from("beacons") as any)
    .select("host_id, filled_slots, status, scheduled_at, title")
    .eq("id", beaconId)
    .single();

  if (!beacon || beacon.status !== "active" || (beacon.filled_slots || 0) > 0 || !beacon.scheduled_at) {
    return { success: true };
  }

  const scheduledTime = new Date(beacon.scheduled_at).getTime();
  const now = Date.now();
  const hoursUntil = (scheduledTime - now) / (1000 * 60 * 60);

  // If within 2 hours or time already passed
  if (hoursUntil <= 2) {
    await writeNotification(
      beacon.host_id,
      "beacon_no_attendees",
      "🕐 0 AUDIENCE JOINED YET",
      `Your meetup "${beacon.title}" currently has 0 attendees. You can safely auto-cancel with zero penalty to your host score.`,
      beaconId
    );
  }

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
  const authCheck = await getSessionUserSecurely();
  if ("error" in authCheck) return { success: false, error: authCheck.error };
  const userId = authCheck.userId;

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
  const authCheck = await getSessionUserSecurely();
  if ("error" in authCheck) return { success: false, error: authCheck.error };
  const userId = authCheck.userId;

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

export interface UpdateFullBeaconInput {
  title?: string;
  description?: string | null;
  category?: BeaconCategory;
  location_name?: string | null;
  scheduled_at?: string | null;
  google_maps_url?: string | null;
  total_slots?: number;
}

/**
 * Server Action: Update full beacon parameters (Host only).
 */
export async function updateFullBeacon(
  beaconId: string,
  data: UpdateFullBeaconInput
): Promise<BeaconActionResult> {
  const authCheck = await getSessionUserSecurely();
  if ("error" in authCheck) return { success: false, error: authCheck.error };
  const userId = authCheck.userId;

  const { data: beacon, error: fetchError } = await (supabaseAdmin
    .from("beacons") as any)
    .select("host_id, title, status, filled_slots, total_slots")
    .eq("id", beaconId)
    .single();

  if (fetchError || !beacon) return { success: false, error: "Beacon not found." };
  if (beacon.host_id !== userId) return { success: false, error: "Unauthorized. Only the host can edit this beacon." };
  if (beacon.status === "cancelled") return { success: false, error: "Cannot modify a cancelled beacon." };

  const updates: any = {};
  if (data.title && data.title.trim()) updates.title = data.title.trim();
  if (data.description !== undefined) updates.description = data.description ? data.description.trim() : null;
  if (data.category) updates.category = data.category;
  if (data.location_name !== undefined) updates.location_name = data.location_name ? data.location_name.trim() : null;
  if (data.scheduled_at !== undefined) updates.scheduled_at = data.scheduled_at || null;
  if (data.google_maps_url !== undefined) updates.google_maps_url = data.google_maps_url ? data.google_maps_url.trim() : null;
  if (data.total_slots !== undefined) {
    if (data.total_slots < beacon.filled_slots) {
      return { success: false, error: `Capacity cannot be lower than current squad count (${beacon.filled_slots}).` };
    }
    updates.total_slots = data.total_slots;
  }

  const { error: updateError } = await (supabaseAdmin
    .from("beacons") as any)
    .update(updates)
    .eq("id", beaconId);

  if (updateError) {
    console.error("[updateFullBeacon] Error:", updateError);
    return { success: false, error: "Failed to update beacon plans." };
  }

  // Notify approved attendees of plan changes
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
          `Host updated "${updates.title || beacon.title}" plans. Check the Squad Hub for latest details.`,
          beaconId
        );
      }
    }
  }

  return { success: true };
}

let lastExpireCheck = 0;
const EXPIRE_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown

/**
 * Auto-expires past beacons by updating status from "active" to "completed"
 * if their scheduled time was more than 3 hours ago.
 */
export async function autoExpireStaleBeacons(): Promise<void> {
  if (Date.now() - lastExpireCheck < EXPIRE_COOLDOWN_MS) {
    return;
  }
  lastExpireCheck = Date.now();

  try {
    const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    await (supabaseAdmin
      .from("beacons") as any)
      .update({ status: "completed" })
      .eq("status", "active")
      .not("scheduled_at", "is", null)
      .lt("scheduled_at", cutoff);
  } catch {
    // Best-effort cleanup
  }
}

/**
 * Server Action: Host marks a Beacon as Completed / Concluded.
 * Locks standard chat and unlocks Post-Hangout Memories sharing.
 */
export async function completeBeaconAction(beaconId: string): Promise<BeaconActionResult> {
  const authCheck = await getSessionUserSecurely();
  if ("error" in authCheck) return { success: false, error: authCheck.error };
  const userId = authCheck.userId;

  const { data: beacon, error: fetchError } = await (supabaseAdmin
    .from("beacons") as any)
    .select("host_id, status, title")
    .eq("id", beaconId)
    .single();

  if (fetchError || !beacon) return { success: false, error: "Beacon not found." };
  if (beacon.host_id !== userId) return { success: false, error: "Only the host can conclude this meetup." };
  if (beacon.status === "completed") return { success: true };

  const { error: updateError } = await (supabaseAdmin
    .from("beacons") as any)
    .update({ status: "completed" })
    .eq("id", beaconId);

  if (updateError) return { success: false, error: "Failed to mark beacon as completed." };

  // Notify approved attendees
  const { data: approvedApps } = await (supabaseAdmin
    .from("beacon_applications") as any)
    .select("applicant_id")
    .eq("beacon_id", beaconId)
    .eq("status", "approved");

  if (approvedApps) {
    for (const app of approvedApps) {
      await writeNotification(
        app.applicant_id,
        "post_event_vibe_check",
        "📸 MEETUP CONCLUDED · SHARE PHOTOS",
        `"${beacon.title}" has concluded! Drop your squad photos in the chat and tag @solonomore on Instagram!`,
        beaconId
      );
    }
  }

  return { success: true };
}

