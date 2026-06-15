"use server";

import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { BeaconMemory } from "@/lib/supabase/types";

export type MemoryActionResult =
  | { success: true; memory?: BeaconMemory }
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
 * Check if a friendship exists between two users.
 */
async function checkIsFriend(userIdA: string, userIdB: string): Promise<boolean> {
  if (userIdA === userIdB) return true;
  const { data, error } = await (supabaseAdmin
    .from("friends") as any)
    .select("status")
    .or(`and(user_id_1.eq.${userIdA},user_id_2.eq.${userIdB}),and(user_id_1.eq.${userIdB},user_id_2.eq.${userIdA})`)
    .eq("status", "accepted")
    .maybeSingle();

  if (error || !data) return false;
  return true;
}

/**
 * Upload a new memory for a beacon.
 * @param beaconId The ID of the beacon
 * @param base64Image The canvas-compressed base64 data-url image
 * @param caption Optional text caption
 * @param isPublic Whether this memory is showcase-public
 */
export async function uploadMemory(
  beaconId: string,
  base64Image: string,
  caption: string | null,
  isPublic: boolean
): Promise<MemoryActionResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }
  const userId = authCheck.userId;

  // 1. Verify beacon completion and user participation
  const { data: beacon, error: beaconError } = await (supabaseAdmin
    .from("beacons") as any)
    .select("id, host_id, status")
    .eq("id", beaconId)
    .single();

  if (beaconError || !beacon) {
    return { success: false, error: "Beacon not found." };
  }

  // Allow active or completed beacons (since user might submit memory as soon as event starts/finishes)
  if (beacon.status === "cancelled") {
    return { success: false, error: "Cannot post memories for a cancelled beacon." };
  }

  // Verify participation: is host OR approved applicant
  const isHost = beacon.host_id === userId;
  let isParticipant = isHost;

  if (!isHost) {
    const { data: app, error: appError } = await (supabaseAdmin
      .from("beacon_applications") as any)
      .select("status")
      .eq("beacon_id", beaconId)
      .eq("applicant_id", userId)
      .eq("status", "approved")
      .maybeSingle();
      
    if (app) isParticipant = true;
  }

  if (!isParticipant) {
    return { success: false, error: "You must be an approved participant or host of this beacon to post a memory." };
  }

  // 2. Format and decode base64 image
  let imageBuffer: Buffer;
  let mimeType = "image/png";
  try {
    const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      // Direct raw base64 fallback
      imageBuffer = Buffer.from(base64Image, "base64");
    } else {
      mimeType = matches[1];
      imageBuffer = Buffer.from(matches[2], "base64");
    }
  } catch (err) {
    return { success: false, error: "Invalid image format." };
  }

  // 3. Create Storage bucket dynamically if missing
  try {
    await supabaseAdmin.storage.createBucket("beacon-memories", {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
    });
  } catch (e) {
    // Already exists
  }

  // 4. Upload binary file to Storage
  const filename = `${beaconId}/${userId}_${Date.now()}.png`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from("beacon-memories")
    .upload(filename, imageBuffer, {
      contentType: mimeType,
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return { success: false, error: "Failed to upload image. Please try again." };
  }

  // Get public URL
  const { data: publicUrlData } = supabaseAdmin.storage
    .from("beacon-memories")
    .getPublicUrl(filename);

  const imageUrl = publicUrlData.publicUrl;

  // 5. Insert memory record into DB
  const { data: memory, error: insertError } = await (supabaseAdmin
    .from("beacon_memories") as any)
    .insert({
      beacon_id: beaconId,
      user_id: userId,
      image_url: imageUrl,
      caption: caption && caption.trim() ? caption.trim() : null,
      is_public: isPublic,
    })
    .select()
    .single();

  if (insertError) {
    console.error("DB insert memory error:", insertError);
    // Cleanup orphaned file
    await supabaseAdmin.storage.from("beacon-memories").remove([filename]);
    return { success: false, error: "Failed to save memory details in database." };
  }

  return { success: true, memory: memory as BeaconMemory };
}

/**
 * Fetch memories for a profile, respecting privacy logic.
 * Friends and self see all memories. Non-friends see only public memories.
 */
export async function getMemoriesForProfile(
  profileId: string
): Promise<{ success: true; memories: (BeaconMemory & { beacon_title?: string })[] } | { success: false; error: string }> {
  let viewerId: string | null = null;
  const authCheck = await getUserIdSecurely();
  if (!("error" in authCheck)) {
    viewerId = authCheck.userId;
  }

  // Determine if viewer is friend or self
  const hasFullAccess = viewerId ? (viewerId === profileId || await checkIsFriend(viewerId, profileId)) : false;

  // Query memories
  let query = (supabaseAdmin
    .from("beacon_memories") as any)
    .select(`
      id,
      beacon_id,
      user_id,
      image_url,
      caption,
      is_public,
      created_at,
      beacons ( title )
    `)
    .eq("user_id", profileId);

  // If not full access, filter public only
  if (!hasFullAccess) {
    query = query.eq("is_public", true);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: "Failed to fetch memories." };
  }

  const memories = (data || []).map((m: any) => ({
    id: m.id,
    beacon_id: m.beacon_id,
    user_id: m.user_id,
    image_url: m.image_url,
    caption: m.caption,
    is_public: m.is_public,
    created_at: m.created_at,
    beacon_title: m.beacons?.title || "Completed Beacon",
  }));

  return { success: true, memories };
}

/**
 * Toggle the privacy status of a memory.
 */
export async function toggleMemoryPrivacy(
  memoryId: string,
  isPublic: boolean
): Promise<MemoryActionResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }
  const userId = authCheck.userId;

  const { data, error } = await (supabaseAdmin
    .from("beacon_memories") as any)
    .update({ is_public: isPublic })
    .eq("id", memoryId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    return { success: false, error: "Failed to update memory privacy setting." };
  }

  return { success: true, memory: data as BeaconMemory };
}

/**
 * Delete a memory.
 */
export async function deleteMemory(memoryId: string): Promise<MemoryActionResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }
  const userId = authCheck.userId;

  // Retrieve filename to clean up storage
  const { data: memory, error: fetchError } = await (supabaseAdmin
    .from("beacon_memories") as any)
    .select("image_url")
    .eq("id", memoryId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !memory) {
    return { success: false, error: "Memory not found or unauthorized." };
  }

  // Extract storage path from public URL
  // publicUrl format: .../storage/v1/object/public/beacon-memories/filename
  let storagePath = "";
  try {
    const parts = memory.image_url.split("/beacon-memories/");
    if (parts.length === 2) storagePath = parts[1];
  } catch (err) {}

  // Delete DB row
  const { error: deleteError } = await (supabaseAdmin
    .from("beacon_memories") as any)
    .delete()
    .eq("id", memoryId)
    .eq("user_id", userId);

  if (deleteError) {
    return { success: false, error: "Failed to delete memory." };
  }

  // Cleanup Storage file asynchronously
  if (storagePath) {
    supabaseAdmin.storage.from("beacon-memories").remove([storagePath]).catch(() => {});
  }

  return { success: true };
}
