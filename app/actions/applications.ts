"use server";

import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { writeNotification } from "@/app/actions/notifications";

export type ApplicationActionResult =
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
 * Server Action: Apply to join a Beacon.
 */
export async function applyToBeacon(beaconId: string): Promise<ApplicationActionResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }
  const userId = authCheck.userId;

  // 1. Verify beacon is active and user is not the host
  const { data: beacon, error: fetchError } = await (supabaseAdmin
    .from("beacons") as any)
    .select("host_id, status, filled_slots, total_slots")
    .eq("id", beaconId)
    .single();

  if (fetchError || !beacon) {
    return { success: false, error: "Beacon not found." };
  }

  if (beacon.status !== "active") {
    return { success: false, error: "This Beacon is no longer active." };
  }

  if (beacon.host_id === userId) {
    return { success: false, error: "You cannot join your own Beacon." };
  }

  if (beacon.filled_slots >= beacon.total_slots) {
    return { success: false, error: "This Beacon is already full." };
  }

  // 2. Insert application row
  const { error: insertError } = await (supabaseAdmin
    .from("beacon_applications") as any)
    .insert({
      beacon_id: beaconId,
      applicant_id: userId,
      status: "pending",
    });

  if (insertError) {
    if (insertError.message?.toLowerCase().includes("duplicate") || 
        insertError.message?.toLowerCase().includes("unique")) {
      return { success: false, error: "You have already requested to join this Beacon." };
    }
    return { success: false, error: "Failed to submit request. Please try again." };
  }

  // Notify the host of a new join request
  await writeNotification(
    beacon.host_id,
    "new_request_pending",
    "▶ NEW JOIN REQUEST",
    `Someone wants to join your beacon. Review them in your dashboard.`,
    beaconId
  );

  return { success: true };
}

/**
 * Server Action: Approve a Beacon application request (Host only).
 */
export async function approveApplicant(applicationId: string): Promise<ApplicationActionResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }
  const userId = authCheck.userId;

  // 1. Fetch application and related beacon to verify host
  const { data: appData, error: appError } = await (supabaseAdmin
    .from("beacon_applications") as any)
    .select("beacon_id, status")
    .eq("id", applicationId)
    .single();

  if (appError || !appData) {
    return { success: false, error: "Application not found." };
  }

  if (appData.status === "approved") {
    return { success: false, error: "Application is already approved." };
  }

  const { data: beacon, error: beaconError } = await (supabaseAdmin
    .from("beacons") as any)
    .select("host_id, filled_slots, total_slots")
    .eq("id", appData.beacon_id)
    .single();

  if (beaconError || !beacon) {
    return { success: false, error: "Associated Beacon not found." };
  }

  // 2. Host Authorization Guard
  if (beacon.host_id !== userId) {
    return { success: false, error: "Unauthorized. You are not hosting this Beacon." };
  }

  if (beacon.filled_slots >= beacon.total_slots) {
    return { success: false, error: "Cannot approve. This Beacon is already full." };
  }

  // 3. Update application status (trigger auto-increments slots)
  const { error: updateError } = await (supabaseAdmin
    .from("beacon_applications") as any)
    .update({ status: "approved" })
    .eq("id", applicationId);

  if (updateError) {
    return { success: false, error: "Failed to approve applicant. Please try again." };
  }

  // Fetch applicant_id for notification
  const { data: fullApp } = await (supabaseAdmin
    .from("beacon_applications") as any)
    .select("applicant_id")
    .eq("id", applicationId)
    .single();

  if (fullApp?.applicant_id) {
    // Notify the guest they were approved
    await writeNotification(
      fullApp.applicant_id,
      "application_approved",
      "✓ YOU'RE IN THE SQUAD!",
      `Your request to join has been approved. Open squad chat to coordinate!`,
      appData.beacon_id
    );
  }

  // Check if beacon is now full → notify host
  const newFilled = beacon.filled_slots + 1;
  if (newFilled >= beacon.total_slots) {
    await writeNotification(
      userId,
      "beacon_full",
      "🎉 SQUAD COMPLETE!",
      `All ${beacon.total_slots} slots for your beacon are now filled. Time to coordinate!`,
      appData.beacon_id
    );
  }

  return { success: true };
}

/**
 * Server Action: Decline a Beacon application request (Host only).
 */
export async function declineApplicant(applicationId: string): Promise<ApplicationActionResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }
  const userId = authCheck.userId;

  // 1. Fetch application to verify host
  const { data: appData, error: appError } = await (supabaseAdmin
    .from("beacon_applications") as any)
    .select("beacon_id")
    .eq("id", applicationId)
    .single();

  if (appError || !appData) {
    return { success: false, error: "Application not found." };
  }

  const { data: beacon, error: beaconError } = await (supabaseAdmin
    .from("beacons") as any)
    .select("host_id")
    .eq("id", appData.beacon_id)
    .single();

  if (beaconError || !beacon) {
    return { success: false, error: "Associated Beacon not found." };
  }

  // 2. Host Authorization Guard
  if (beacon.host_id !== userId) {
    return { success: false, error: "Unauthorized. You are not hosting this Beacon." };
  }

  // 3. Update application status to declined
  const { error: updateError } = await (supabaseAdmin
    .from("beacon_applications") as any)
    .update({ status: "declined" })
    .eq("id", applicationId);

  if (updateError) {
    return { success: false, error: "Failed to decline applicant. Please try again." };
  }

  // Notify the guest they were declined
  const { data: fullApp } = await (supabaseAdmin
    .from("beacon_applications") as any)
    .select("applicant_id")
    .eq("id", applicationId)
    .single();

  if (fullApp?.applicant_id) {
    await writeNotification(
      fullApp.applicant_id,
      "application_declined",
      "✕ REQUEST DECLINED",
      `Your join request was not accepted this time. Keep exploring other beacons!`,
      appData.beacon_id
    );
  }

  return { success: true };
}

/**
 * Server Action: Flag an approved applicant as a No-Show (Host only).
 * Increments strikes, and suspends if strikes >= 2.
 */
export async function flagNoShow(applicationId: string): Promise<ApplicationActionResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }
  const userId = authCheck.userId;

  // 1. Fetch application to verify host
  const { data: appData, error: appError } = await (supabaseAdmin
    .from("beacon_applications") as any)
    .select("beacon_id, applicant_id, status, flagged_ghost")
    .eq("id", applicationId)
    .single();

  if (appError || !appData) {
    return { success: false, error: "Application not found." };
  }

  if (appData.status !== "approved") {
    return { success: false, error: "Only approved applicants can be flagged as no-show." };
  }

  if (appData.flagged_ghost) {
    return { success: false, error: "This applicant has already been flagged as a no-show for this event." };
  }

  // 2. Fetch beacon to check host
  const { data: beacon, error: beaconError } = await (supabaseAdmin
    .from("beacons") as any)
    .select("host_id")
    .eq("id", appData.beacon_id)
    .single();

  if (beaconError || !beacon) {
    return { success: false, error: "Associated Beacon not found." };
  }

  if (beacon.host_id !== userId) {
    return { success: false, error: "Unauthorized. You are not hosting this Beacon." };
  }

  // 3. Mark application as flagged_ghost = true
  const { error: markError } = await (supabaseAdmin
    .from("beacon_applications") as any)
    .update({ flagged_ghost: true })
    .eq("id", applicationId);

  if (markError) {
    return { success: false, error: "Failed to flag applicant. Please try again." };
  }

  // 4. Fetch applicant's current strikes count from profiles
  const { data: profile, error: profileError } = await (supabaseAdmin
    .from("profiles") as any)
    .select("no_show_strikes")
    .eq("id", appData.applicant_id)
    .single();

  if (profileError || !profile) {
    return { success: false, error: "Applicant profile not found." };
  }

  const newStrikesCount = (profile.no_show_strikes || 0) + 1;
  const isSuspended = newStrikesCount >= 2;

  // 5. Update strikes and drop account_status to suspended if strikes >= 2
  const updatePayload: any = { no_show_strikes: newStrikesCount };
  if (isSuspended) {
    updatePayload.account_status = "suspended";
  }

  const { error: strikeError } = await (supabaseAdmin
    .from("profiles") as any)
    .update(updatePayload)
    .eq("id", appData.applicant_id);

  if (strikeError) {
    return { success: false, error: "Failed to record ghost warning strike on applicant profile." };
  }

  return { success: true };
}

/**
 * Server Action: Withdraw from an approved beacon.
 * Reverts approved application to 'withdrawn', decrements filled_slots,
 * notifies the host, and fires a spot-available alert to the top declined applicant.
 */
export async function withdrawFromBeacon(beaconId: string): Promise<ApplicationActionResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) return { success: false, error: authCheck.error };
  const userId = authCheck.userId;

  // 1. Find this user's approved application for this beacon
  const { data: app, error: appError } = await (supabaseAdmin
    .from("beacon_applications") as any)
    .select("id, beacon_id")
    .eq("beacon_id", beaconId)
    .eq("applicant_id", userId)
    .eq("status", "approved")
    .maybeSingle();

  if (appError || !app) {
    return { success: false, error: "No approved application found for this beacon." };
  }

  // 2. Fetch beacon meta
  const { data: beacon, error: beaconError } = await (supabaseAdmin
    .from("beacons") as any)
    .select("host_id, filled_slots, title, scheduled_at")
    .eq("id", beaconId)
    .single();

  if (beaconError || !beacon) return { success: false, error: "Beacon not found." };

  // 3. Mark application as withdrawn
  const { error: updateError } = await (supabaseAdmin
    .from("beacon_applications") as any)
    .update({ status: "withdrawn" })
    .eq("id", app.id);

  if (updateError) return { success: false, error: "Failed to withdraw. Please try again." };

  // 4. Decrement filled_slots on beacon (floor at 0)
  const newFilled = Math.max(0, (beacon.filled_slots ?? 1) - 1);
  await (supabaseAdmin.from("beacons") as any)
    .update({ filled_slots: newFilled })
    .eq("id", beaconId);

  // 5. Notify the host
  await writeNotification(
    beacon.host_id,
    "guest_withdrew",
    "⊠ SQUAD MEMBER WITHDREW",
    `A member withdrew from your beacon "${beacon.title}". A slot is now open.`,
    beaconId
  );

  // 6. Spot freed-up alert — notify the most recently declined applicant
  const { data: declinedApps } = await (supabaseAdmin
    .from("beacon_applications") as any)
    .select("applicant_id")
    .eq("beacon_id", beaconId)
    .eq("status", "declined")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (declinedApps && declinedApps.length > 0) {
    await writeNotification(
      declinedApps[0].applicant_id,
      "spot_available",
      "🔔 A SPOT JUST OPENED UP!",
      `A squad member withdrew from "${beacon.title}" — a slot is available again. Apply now!`,
      beaconId
    );
  }

  return { success: true };
}
