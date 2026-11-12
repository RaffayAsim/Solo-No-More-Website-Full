"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Notification, NotificationType } from "@/lib/supabase/types";
import { getSessionUserSecurely } from "@/lib/supabase/session";

export type NotificationResult<T = any> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ── Auth Helper ───────────────────────────────────────────────────────────────
async function getUserIdSecurely(): Promise<{ userId: string } | { error: string }> {
  const result = await getSessionUserSecurely();
  if ("error" in result) {
    return { error: result.error };
  }
  return { userId: result.userId };
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

  if (error) {
    if (error.message?.includes("schema cache") || error.message?.includes("does not exist")) {
      return { success: true, data: 0 };
    }
    return { success: false, error: "Failed to fetch count." };
  }
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

  if (error) {
    if (error.message?.includes("schema cache") || error.message?.includes("does not exist")) {
      return { success: true, data: [] };
    }
    return { success: false, error: "Failed to fetch notifications." };
  }
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
