"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUserSecurely } from "@/lib/supabase/session";

export type BillingActionResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Helper to securely get current logged-in user ID via Server Session cookie.
 */
async function getUserIdSecurely(): Promise<{ userId: string } | { error: string }> {
  const result = await getSessionUserSecurely();
  if ("error" in result) {
    return { error: result.error };
  }
  return { userId: result.userId };
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

export interface SubmitPaymentInput {
  tierRequested: "member" | "family";
  amountPkr: number;
  paymentMethod: "raast" | "sadapay" | "bank_transfer" | "safepay";
  transactionRef: string;
  proofImageUrl?: string;
}

/**
 * Server Action: Submit payment verification details (Raast / SadaPay / Bank Transfer).
 */
export async function submitPaymentProof(
  input: SubmitPaymentInput
): Promise<BillingActionResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }
  const userId = authCheck.userId;

  if (!input.transactionRef || !input.transactionRef.trim()) {
    return { success: false, error: "Transaction Reference ID / TID is required." };
  }

  // Insert payment submission into database
  const { error: insertError } = await (supabaseAdmin
    .from("payment_submissions") as any)
    .insert({
      user_id: userId,
      amount_pkr: input.amountPkr,
      tier_requested: input.tierRequested,
      payment_method: input.paymentMethod,
      transaction_ref: input.transactionRef.trim(),
      proof_image_url: input.proofImageUrl || null,
      status: "pending",
    });

  if (insertError) {
    console.error("[submitPaymentProof] DB insert error:", insertError);
    if (!insertError.message?.includes("schema cache") && !insertError.message?.includes("does not exist")) {
      return { success: false, error: "Failed to submit payment proof. Please try again." };
    }
  }

  // Notify user in-app
  try {
    const { writeNotification } = await import("@/app/actions/notifications");
    await writeNotification(
      userId,
      "spot_available" as any,
      "💳 PAYMENT PROOF RECEIVED",
      `Your transaction (${input.transactionRef.trim()}) for ${input.tierRequested.toUpperCase()} tier is queued for verification.`
    );
  } catch {}

  return { success: true };
}

/**
 * Server Action: Get all payment submissions for Admin review.
 */
export async function getPaymentSubmissionsAction(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const { verifyAdminStatus } = await import("@/app/actions/admin");
    await verifyAdminStatus();
  } catch {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const { data, error } = await (supabaseAdmin
    .from("payment_submissions") as any)
    .select(`
      *,
      profiles:user_id (
        full_name,
        city,
        avatar_icon
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message?.includes("schema cache") || error.message?.includes("does not exist")) {
      return { success: true, data: [] };
    }
    return { success: false, error: error.message };
  }

  return { success: true, data: data || [] };
}

/**
 * Server Action: Admin reviews and activates or rejects payment.
 */
export async function reviewPaymentSubmissionAction(
  submissionId: string,
  decision: "approved" | "rejected",
  adminNotes?: string
): Promise<BillingActionResult> {
  try {
    const { verifyAdminStatus } = await import("@/app/actions/admin");
    await verifyAdminStatus();
  } catch {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  // 1. Fetch submission details
  const { data: submission, error: fetchErr } = await (supabaseAdmin
    .from("payment_submissions") as any)
    .select("*")
    .eq("id", submissionId)
    .single();

  if (fetchErr || !submission) {
    return { success: false, error: "Payment submission not found." };
  }

  // 2. Update payment submission
  const { error: updateErr } = await (supabaseAdmin
    .from("payment_submissions") as any)
    .update({
      status: decision,
      admin_notes: adminNotes || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (updateErr) {
    return { success: false, error: "Failed to update payment submission." };
  }

  // 3. If approved, upgrade profile tier
  const { writeNotification } = await import("@/app/actions/notifications");
  if (decision === "approved") {
    await (supabaseAdmin
      .from("profiles") as any)
      .update({ subscription_tier: submission.tier_requested })
      .eq("id", submission.user_id);

    try {
      await writeNotification(
        submission.user_id,
        "spot_available" as any,
        "✓ PAYMENT VERIFIED & TIER ACTIVATED",
        `Your payment has been verified! Welcome to the ${submission.tier_requested.toUpperCase()} circle.`
      );
    } catch {}
  } else {
    try {
      await writeNotification(
        submission.user_id,
        "spot_available" as any,
        "✕ PAYMENT VERIFICATION FAILED",
        `Payment could not be verified. ${adminNotes ? "Reason: " + adminNotes : "Please contact support."}`
      );
    } catch {}
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

