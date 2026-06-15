"use server";

import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type BillingActionResult =
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
 * Server Action: Upgrade user's subscription tier.
 */
export async function upgradeTier(tier: "member" | "family"): Promise<BillingActionResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }
  const userId = authCheck.userId;

  // Update subscription_tier in profiles table
  const { error: updateError } = await (supabaseAdmin
    .from("profiles") as any)
    .update({ subscription_tier: tier })
    .eq("id", userId);

  if (updateError) {
    return { success: false, error: "Failed to process billing upgrade. Please try again." };
  }

  return { success: true };
}

export interface ProfileUpdatePayload {
  full_name?: string;
  bio?: string;
  social_link?: string;
  city?: string;
  avatar_icon?: string;
  business_name?: string;
  vibe_tags?: string[];
  is_active_seeker?: boolean;
}

/**
 * Server Action: Update user's profile info (full_name, bio, social_link, city, avatar_icon, business_name, vibe_tags, is_active_seeker).
 */
export async function updateProfile(payload: ProfileUpdatePayload): Promise<BillingActionResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }
  const userId = authCheck.userId;

  // Let's validate the inputs to make sure they are within reasonable lengths
  if (payload.full_name && payload.full_name.trim().length > 50) {
    return { success: false, error: "Name must be 50 characters or less." };
  }
  if (payload.bio && payload.bio.length > 160) {
    return { success: false, error: "Bio must be 160 characters or less." };
  }
  if (payload.social_link && payload.social_link.length > 255) {
    return { success: false, error: "Social link must be 255 characters or less." };
  }
  if (payload.city && !["Karachi", "Lahore", "Islamabad"].includes(payload.city)) {
    return { success: false, error: "Invalid city chosen." };
  }
  if (payload.business_name && payload.business_name.trim().length > 100) {
    return { success: false, error: "Business name must be 100 characters or less." };
  }
  if (payload.vibe_tags !== undefined) {
    if (!Array.isArray(payload.vibe_tags)) {
      return { success: false, error: "Vibe tags must be an array." };
    }
    if (payload.vibe_tags.length > 5) {
      return { success: false, error: "You can select at most 5 vibe tags." };
    }
    const validTags = [
      "🏃 ACTIVE", "🎵 MUSIC", "☕ COFFEE", "🌙 NIGHTS", "📚 CULTURE",
      "🎮 GAMING", "🌊 OUTDOORS", "🍕 FOODIE", "📸 CREATIVE", "💬 SOCIAL"
    ];
    for (const t of payload.vibe_tags) {
      if (!validTags.includes(t)) {
        return { success: false, error: `Invalid tag selected: ${t}` };
      }
    }
  }

  // Update profile
  const updateData: any = {};
  if (payload.full_name !== undefined) updateData.full_name = payload.full_name ? payload.full_name.trim() : null;
  if (payload.bio !== undefined) updateData.bio = payload.bio ? payload.bio.trim() : null;
  if (payload.social_link !== undefined) updateData.social_link = payload.social_link ? payload.social_link.trim() : null;
  if (payload.city !== undefined) updateData.city = payload.city;
  if (payload.avatar_icon !== undefined) updateData.avatar_icon = payload.avatar_icon;
  if (payload.business_name !== undefined) updateData.business_name = payload.business_name ? payload.business_name.trim() : null;
  if (payload.vibe_tags !== undefined) updateData.vibe_tags = payload.vibe_tags;
  if (payload.is_active_seeker !== undefined) {
    updateData.is_active_seeker = payload.is_active_seeker;
    updateData.seeker_updated_at = new Date().toISOString();
  }

  const { error: updateError } = await (supabaseAdmin
    .from("profiles") as any)
    .update(updateData)
    .eq("id", userId);

  if (updateError) {
    return { success: false, error: "Failed to update profile. Please try again." };
  }

  return { success: true };
}

