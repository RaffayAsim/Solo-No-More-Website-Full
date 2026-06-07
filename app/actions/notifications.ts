"use server";

import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Notification, NotificationType } from "@/lib/supabase/types";

export type NotificationResult<T = any> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ── Auth Helper ───────────────────────────────────────────────────────────────
async function getUserIdSecurely(): Promise<{ userId: string } | { error: string }> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("sb-dmmgzpiskyocdsxamrgf-auth-token");
  if (!sessionCookie?.value) return { error: "Not authenticated." };
  let accessToken: string;
  try {
    let raw = sessionCookie.value;
    if (raw.startsWith("base64-")) raw = Buffer.from(raw.slice(7), "base64").toString("utf-8");
    const parsed = JSON.parse(raw);
    accessToken = Array.isArray(parsed) ? parsed[0] : parsed.access_token;
  } catch {
    return { error: "Invalid session format." };
  }
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) return { error: "Session expired." };
  return { userId: data.user.id };
}

// ── Internal helper: write a single notification ──────────────────────────────
export async function writeNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  relatedBeaconId?: string | null
): Promise<void> {
  try {
    await (supabaseAdmin.from("notifications") as any).insert({
      user_id: userId,
      type,
      title,
      body,
      related_beacon_id: relatedBeaconId ?? null,
      is_read: false,
    });
    // Ignore duplicate key errors (unique index on dedup types) — that's expected behaviour
  } catch {
    // Silently swallow — notifications are best-effort
  }
}

// ── Get unread count (lightweight poll) ───────────────────────────────────────
export async function getUnreadCount(): Promise<NotificationResult<number>> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) return { success: false, error: authCheck.error };

  const { count, error } = await (supabaseAdmin
    .from("notifications") as any)
    .select("id", { count: "exact", head: true })
    .eq("user_id", authCheck.userId)
    .eq("is_read", false);

  if (error) return { success: false, error: "Failed to fetch count." };
  return { success: true, data: count ?? 0 };
}

// ── Get all notifications (latest 30) ────────────────────────────────────────
export async function getNotifications(): Promise<NotificationResult<Notification[]>> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) return { success: false, error: authCheck.error };

  const { data, error } = await (supabaseAdmin
    .from("notifications") as any)
    .select("*")
    .eq("user_id", authCheck.userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return { success: false, error: "Failed to fetch notifications." };
  return { success: true, data: data ?? [] };
}

// ── Mark all as read ──────────────────────────────────────────────────────────
export async function markAllRead(): Promise<NotificationResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) return { success: false, error: authCheck.error };

  const { error } = await (supabaseAdmin
    .from("notifications") as any)
    .update({ is_read: true })
    .eq("user_id", authCheck.userId)
    .eq("is_read", false);

  if (error) return { success: false, error: "Failed to mark notifications as read." };
  return { success: true };
}

// ── Mark one as read ──────────────────────────────────────────────────────────
export async function markOneRead(notificationId: string): Promise<NotificationResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) return { success: false, error: authCheck.error };

  const { error } = await (supabaseAdmin
    .from("notifications") as any)
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", authCheck.userId);

  if (error) return { success: false, error: "Failed to mark as read." };
  return { success: true };
}

// ── Submit vibe feedback ──────────────────────────────────────────────────────
export async function submitVibeFeedback(
  beaconId: string,
  rating: "vibe_matched" | "meh" | "no_show_zone"
): Promise<NotificationResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) return { success: false, error: authCheck.error };

  const { error } = await (supabaseAdmin
    .from("event_feedback") as any)
    .upsert({
      beacon_id: beaconId,
      rater_id: authCheck.userId,
      rating,
    }, { onConflict: "beacon_id,rater_id" });

  if (error) return { success: false, error: "Failed to submit rating." };
  return { success: true };
}

// ── LAZY TIME ALERTS — Called server-side on dashboard load ──────────────────
/**
 * Generates all time-based and engagement-based notifications lazily.
 * Idempotent — the unique DB index prevents duplicate alerts per (user, type, beacon).
 * Also auto-completes stale expired beacons.
 */
export async function writeLazyTimeAlerts(userId: string): Promise<void> {
  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);

  try {
    // ─── Fetch all active beacons hosted by this user ──────────────────────
    const { data: myBeacons } = await (supabaseAdmin
      .from("beacons") as any)
      .select("id, title, filled_slots, total_slots, scheduled_at, created_at, status")
      .eq("host_id", userId)
      .in("status", ["active", "completed"]);

    if (!myBeacons || myBeacons.length === 0) return;

    for (const beacon of myBeacons) {
      const scheduledAt = beacon.scheduled_at ? new Date(beacon.scheduled_at) : null;
      const createdAt = new Date(beacon.created_at);

      // 1. Auto-complete stale beacons (scheduled_at passed > 3h ago and still active)
      if (beacon.status === "active" && scheduledAt && scheduledAt < threeHoursAgo) {
        await (supabaseAdmin.from("beacons") as any)
          .update({ status: "completed" })
          .eq("id", beacon.id);
        continue; // skip further alerts for this beacon
      }

      if (beacon.status !== "active") continue;

      // 2. Beacon near start (≤ 2h away)
      if (scheduledAt && scheduledAt > now && scheduledAt <= twoHoursFromNow) {
        // 2a. No attendees at all → can cancel
        if (beacon.filled_slots === 0) {
          await writeNotification(
            userId,
            "beacon_no_attendees",
            "⚠ ZERO SQUAD — EVENT NEAR",
            `Your beacon "${beacon.title}" starts soon and has no attendees. You can cancel it now.`,
            beacon.id
          );
        }
        // 2b. Partially filled
        else if (beacon.filled_slots < beacon.total_slots) {
          await writeNotification(
            userId,
            "beacon_not_full",
            "◉ SQUAD INCOMPLETE",
            `"${beacon.title}" starts soon. ${beacon.filled_slots}/${beacon.total_slots} slots filled.`,
            beacon.id
          );
        }
        // 2c. General near-start reminder (always)
        await writeNotification(
          userId,
          "beacon_near_start",
          "📶 BEACON STARTING SOON",
          `Your beacon "${beacon.title}" is starting in under 2 hours. Open squad chat to coordinate.`,
          beacon.id
        );
      }

      // 3. 24h before event — attendance reminder for approved guests
      if (scheduledAt && scheduledAt > twoHoursFromNow && scheduledAt <= twentyFourHoursFromNow) {
        // Fetch approved guests and notify them
        const { data: approvedApps } = await (supabaseAdmin
          .from("beacon_applications") as any)
          .select("applicant_id")
          .eq("beacon_id", beacon.id)
          .eq("status", "approved");

        if (approvedApps && approvedApps.length > 0) {
          for (const app of approvedApps) {
            await writeNotification(
              app.applicant_id,
              "attendance_reminder",
              "📅 SQUAD MEETS TOMORROW",
              `Your squad for "${beacon.title}" meets in less than 24 hours. See you there!`,
              beacon.id
            );
          }
        }
      }

      // 4. Post-event vibe check (1h after event ended)
      if (scheduledAt && scheduledAt < oneHourAgo && scheduledAt > threeHoursAgo) {
        // Notify host
        await writeNotification(
          userId,
          "post_event_vibe_check",
          "⭐ HOW WAS THE VIBE?",
          `"${beacon.title}" has ended. Rate how the squad vibe went!`,
          beacon.id
        );
        // Notify approved guests
        const { data: approvedApps } = await (supabaseAdmin
          .from("beacon_applications") as any)
          .select("applicant_id")
          .eq("beacon_id", beacon.id)
          .eq("status", "approved");

        if (approvedApps) {
          for (const app of approvedApps) {
            await writeNotification(
              app.applicant_id,
              "post_event_vibe_check",
              "⭐ HOW WAS THE VIBE?",
              `Rate the squad vibe for "${beacon.title}"!`,
              beacon.id
            );
          }
        }
      }

      // 5. Empty beacon for 48h with 0 interest
      if (createdAt < fortyEightHoursAgo && beacon.filled_slots === 0) {
        await writeNotification(
          userId,
          "beacon_no_interest",
          "😶 NO INTEREST YET",
          `"${beacon.title}" has been live for 2+ days with no applicants. Try editing the time or location.`,
          beacon.id
        );
      }

      // 6. Pending request reminder (applications > 4h old with no response)
      const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
      const { data: stalePending } = await (supabaseAdmin
        .from("beacon_applications") as any)
        .select("id")
        .eq("beacon_id", beacon.id)
        .eq("status", "pending")
        .lt("created_at", fourHoursAgo.toISOString())
        .limit(1);

      if (stalePending && stalePending.length > 0) {
        await writeNotification(
          userId,
          "pending_request_reminder",
          "⏱ PENDING REQUESTS WAITING",
          `You have unanswered join requests for "${beacon.title}" waiting over 4 hours. Review them now!`,
          beacon.id
        );
      }
    }
  } catch (err) {
    // Best-effort — never crash the page load
    console.error("[writeLazyTimeAlerts] Error:", err);
  }
}
