"use server";

import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type ChatActionResult<T = any> =
  | { success: true; data?: T }
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
 * Verifies if a user is authorized to participate in a beacon's chat.
 * (Host or Approved Guest).
 */
async function isAuthorizedForBeacon(beaconId: string, userId: string): Promise<boolean> {
  // 1. Check if user is the host
  const { data: beacon } = await (supabaseAdmin
    .from("beacons") as any)
    .select("host_id")
    .eq("id", beaconId)
    .single();

  if (beacon && beacon.host_id === userId) {
    return true;
  }

  // 2. Check if user is an approved guest
  const { data: app } = await (supabaseAdmin
    .from("beacon_applications") as any)
    .select("id")
    .eq("beacon_id", beaconId)
    .eq("applicant_id", userId)
    .eq("status", "approved")
    .maybeSingle();

  if (app) {
    return true;
  }

  return false;
}

/**
 * Server Action: Retrieve chat messages for a specific Beacon.
 */
export async function getBeaconMessages(beaconId: string): Promise<ChatActionResult<any[]>> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }
  const userId = authCheck.userId;

  // Verify access authorization
  const authorized = await isAuthorizedForBeacon(beaconId, userId);
  if (!authorized) {
    return { success: false, error: "Access denied. You must be an approved squad member to view coordination chat." };
  }

  // Fetch messages ordered by created_at ascending
  const { data: messages, error } = await (supabaseAdmin
    .from("beacon_messages") as any)
    .select(`
      id,
      beacon_id,
      user_id,
      content,
      created_at,
      profiles:user_id (
        full_name
      )
    `)
    .eq("beacon_id", beaconId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getBeaconMessages] Error fetching messages:", error);
    return { success: false, error: "Failed to load messages." };
  }

  return { success: true, data: messages || [] };
}

/**
 * Server Action: Post a new message to the Beacon's Coordination Chat.
 */
export async function sendBeaconMessage(beaconId: string, content: string): Promise<ChatActionResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }
  const userId = authCheck.userId;

  const cleanContent = content.trim();
  if (!cleanContent) {
    return { success: false, error: "Message content cannot be empty." };
  }

  if (cleanContent.length > 500) {
    return { success: false, error: "Message is too long (maximum 500 characters)." };
  }

  // Verify access authorization
  const authorized = await isAuthorizedForBeacon(beaconId, userId);
  if (!authorized) {
    return { success: false, error: "Access denied. You must be an approved squad member to send messages." };
  }

  // Insert chat message
  const { error } = await (supabaseAdmin
    .from("beacon_messages") as any)
    .insert({
      beacon_id: beaconId,
      user_id: userId,
      content: cleanContent,
    });

  if (error) {
    console.error("[sendBeaconMessage] Insert error:", error);
    return { success: false, error: "Failed to send message. Please try again." };
  }

  return { success: true };
}

/**
 * Server Action: Retrieve dynamic beacon plans, current user status, and attendees list.
 */
export async function getBeaconDetailsForChat(beaconId: string): Promise<ChatActionResult<any>> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }
  const userId = authCheck.userId;

  const { data: beacon, error } = await (supabaseAdmin
    .from("beacons") as any)
    .select("id, host_id, title, location_name, scheduled_at, google_maps_url, status")
    .eq("id", beaconId)
    .single();

  if (error || !beacon) {
    return { success: false, error: "Beacon not found." };
  }

  // Verify access authorization
  const authorized = await isAuthorizedForBeacon(beaconId, userId);
  if (!authorized) {
    return { success: false, error: "Access denied. You must be an approved squad member." };
  }

  // Fetch approved attendees list
  const { data: applications } = await (supabaseAdmin
    .from("beacon_applications") as any)
    .select(`
      applicant_id,
      profiles:applicant_id (
        id,
        full_name,
        avatar_icon
      )
    `)
    .eq("beacon_id", beaconId)
    .eq("status", "approved");

  // Fetch host details
  const { data: hostProfile } = await (supabaseAdmin
    .from("profiles") as any)
    .select("id, full_name, avatar_icon")
    .eq("id", beacon.host_id)
    .single();

  const participants = [
    ...(hostProfile ? [{ id: hostProfile.id, full_name: hostProfile.full_name, avatar_icon: hostProfile.avatar_icon, isHost: true }] : []),
    ...(applications || []).map((app: any) => ({
      id: app.profiles.id,
      full_name: app.profiles.full_name,
      avatar_icon: app.profiles.avatar_icon,
      isHost: false
    }))
  ];

  // Fetch endorsements already sent by this user for this beacon
  const { data: myEndorsements } = await (supabaseAdmin
    .from("squad_endorsements") as any)
    .select("recipient_id")
    .eq("beacon_id", beaconId)
    .eq("endorser_id", userId);

  const endorsedIds = (myEndorsements || []).map((e: any) => e.recipient_id);

  // Fetch sent friend requests or friendships involving this user to check phonebook status
  const { data: friendships } = await (supabaseAdmin
    .from("friends") as any)
    .select("user_id_1, user_id_2, status")
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

  const contactsMap = new Map();
  (friendships || []).forEach((f: any) => {
    const peerId = f.user_id_1 === userId ? f.user_id_2 : f.user_id_1;
    contactsMap.set(peerId, f.status);
  });

  return {
    success: true,
    data: {
      beacon,
      currentUserId: userId,
      participants,
      endorsedIds,
      contactsMap: Object.fromEntries(contactsMap.entries())
    }
  };
}

/**
 * Server Action: Register a post-event peer-to-peer vibe check endorsement.
 */
export async function endorseSquadMember(beaconId: string, recipientId: string): Promise<ChatActionResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) return { success: false, error: authCheck.error };
  const userId = authCheck.userId;

  if (userId === recipientId) return { success: false, error: "You cannot endorse yourself." };

  // Verify access authorization
  const authorized = await isAuthorizedForBeacon(beaconId, userId);
  if (!authorized) return { success: false, error: "Access denied." };

  const { error } = await (supabaseAdmin
    .from("squad_endorsements") as any)
    .insert({
      beacon_id: beaconId,
      endorser_id: userId,
      recipient_id: recipientId
    });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "You have already endorsed this member for this event." };
    }
    return { success: false, error: "Failed to submit endorsement." };
  }

  return { success: true };
}
