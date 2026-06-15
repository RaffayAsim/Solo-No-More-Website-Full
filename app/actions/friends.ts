"use server";

import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type FriendActionResult =
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
 * Send a friend request to another user.
 */
export async function sendFriendRequest(targetUserId: string): Promise<FriendActionResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }
  const currentUserId = authCheck.userId;

  if (currentUserId === targetUserId) {
    return { success: false, error: "You cannot add yourself as a friend." };
  }

  // Check if a friendship record already exists in either direction
  const { data: existing, error: fetchError } = await (supabaseAdmin
    .from("friends") as any)
    .select("id, user_id_1, user_id_2, status")
    .or(`and(user_id_1.eq.${currentUserId},user_id_2.eq.${targetUserId}),and(user_id_1.eq.${targetUserId},user_id_2.eq.${currentUserId})`)
    .maybeSingle();

  if (fetchError) {
    return { success: false, error: "Failed to verify connection status." };
  }

  if (existing) {
    if (existing.status === "accepted") {
      return { success: false, error: "You are already friends with this member." };
    }
    if (existing.status === "pending") {
      if (existing.user_id_1 === currentUserId) {
        return { success: false, error: "Friend request is already pending." };
      } else {
        return { success: false, error: "This member has already sent you a request. Check your Network Hub!" };
      }
    }
    if (existing.status === "blocked") {
      return { success: false, error: "Unable to add this member." };
    }
  }

  // Insert friendship row. user_id_1 is sender, user_id_2 is receiver.
  const { error: insertError } = await (supabaseAdmin
    .from("friends") as any)
    .insert({
      user_id_1: currentUserId,
      user_id_2: targetUserId,
      status: "pending",
    });

  if (insertError) {
    return { success: false, error: "Failed to send friend request. Please try again." };
  }

  return { success: true };
}

/**
 * Accept a friend request.
 */
export async function acceptFriendRequest(friendshipId: string): Promise<FriendActionResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }
  const currentUserId = authCheck.userId;

  // Retrieve friendship details
  const { data: friendship, error: fetchError } = await (supabaseAdmin
    .from("friends") as any)
    .select("user_id_2, status")
    .eq("id", friendshipId)
    .single();

  if (fetchError || !friendship) {
    return { success: false, error: "Friendship request not found." };
  }

  // Safety: Verify current user is the recipient (user_id_2) of the request
  if (friendship.user_id_2 !== currentUserId) {
    return { success: false, error: "Unauthorized. Only the recipient can accept a friend request." };
  }

  if (friendship.status === "accepted") {
    return { success: false, error: "Friend request has already been accepted." };
  }

  // Update status to accepted
  const { error: updateError } = await (supabaseAdmin
    .from("friends") as any)
    .update({ status: "accepted" })
    .eq("id", friendshipId);

  if (updateError) {
    return { success: false, error: "Failed to accept friend request. Please try again." };
  }

  return { success: true };
}

/**
 * Remove a friend or decline a friend request.
 */
export async function removeFriend(friendshipId: string): Promise<FriendActionResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }
  const currentUserId = authCheck.userId;

  // Retrieve friendship details
  const { data: friendship, error: fetchError } = await (supabaseAdmin
    .from("friends") as any)
    .select("user_id_1, user_id_2")
    .eq("id", friendshipId)
    .single();

  if (fetchError || !friendship) {
    return { success: false, error: "Friendship record not found." };
  }

  // Safety: Verify current user is involved in the relationship
  if (friendship.user_id_1 !== currentUserId && friendship.user_id_2 !== currentUserId) {
    return { success: false, error: "Unauthorized. You are not part of this friendship." };
  }

  // Delete the row
  const { error: deleteError } = await (supabaseAdmin
    .from("friends") as any)
    .delete()
    .eq("id", friendshipId);

  if (deleteError) {
    return { success: false, error: "Failed to update connection. Please try again." };
  }

  return { success: true };
}
