"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { verifyAdminStatus } from "@/app/actions/admin";
import { writeNotification } from "@/lib/server/notify";
import { MEMBERSHIP_PLANS, getMembershipAmountPkr } from "@/lib/payment-config";
import { notifyAdminByEmail, sendEmail } from "@/lib/server/email";
import { getSiteUrl } from "@/lib/server/site-url";
import { activateSubscription } from "@/lib/server/subscriptions";
import { formatPkt } from "@/lib/time";
import {
  PAYMENT_PROOFS_BUCKET,
  parseImageDataUrl,
  resolveStoredImage,
  storeImageDataUrl,
} from "@/lib/server/storage";

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

export interface SubmitPaymentInput {
  tierRequested: "member" | "family" | "partner";
  /** Ignored — the amount is always taken from the server-side price table. */
  amountPkr?: number;
  paymentMethod: "raast" | "sadapay" | "bank_transfer" | "safepay";
  transactionRef?: string;
  /** Compressed image data URL of the transfer receipt. */
  proofImageUrl?: string;
  billingCycle?: "monthly" | "annual";
}

/**
 * Server Action: Submit bank-transfer proof for a membership upgrade.
 * The tier is only activated after an admin approves it in Admin → Payments.
 */
export async function submitPaymentProof(
  input: SubmitPaymentInput
): Promise<BillingActionResult> {
  const authCheck = await getSessionUserSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }
  const userId = authCheck.userId;

  const tier = input.tierRequested;
  if (tier !== "member" && tier !== "family" && tier !== "partner") {
    return { success: false, error: "Invalid membership tier." };
  }
  if (!parseImageDataUrl(input.proofImageUrl)) {
    return { success: false, error: "Please upload a screenshot of your payment (JPG or PNG, under 3 MB)." };
  }
  const transactionRef = (input.transactionRef || "").trim().slice(0, 64);
  const paymentMethod = ["raast", "sadapay", "bank_transfer"].includes(input.paymentMethod)
    ? input.paymentMethod
    : "bank_transfer";

  const billingCycle: "monthly" | "annual" =
    input.billingCycle === "annual" && MEMBERSHIP_PLANS[tier].annualTotal ? "annual" : "monthly";

  const { data: profile } = await (supabaseAdmin.from("profiles") as any)
    .select("full_name, phone, subscription_tier")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) {
    return { success: false, error: "Profile not found." };
  }
  if (profile.subscription_tier === "admin") {
    return { success: false, error: "Admin accounts do not need a membership upgrade." };
  }

  // One open request at a time keeps the admin queue clean.
  const { data: open } = await (supabaseAdmin.from("payment_submissions") as any)
    .select("id")
    .eq("user_id", userId)
    .eq("purpose", "membership_upgrade")
    .eq("status", "pending")
    .limit(1);
  if (open && open.length > 0) {
    return { success: false, error: "You already have a payment awaiting verification." };
  }

  const proofRef = await storeImageDataUrl(PAYMENT_PROOFS_BUCKET, `membership/${userId}`, input.proofImageUrl);
  if (!proofRef) {
    return { success: false, error: "The screenshot could not be read. Please upload it again." };
  }

  const { error: insertError } = await (supabaseAdmin.from("payment_submissions") as any).insert({
    user_id: userId,
    purpose: "membership_upgrade",
    amount_pkr: getMembershipAmountPkr(tier, billingCycle),
    tier_requested: tier,
    payment_method: paymentMethod,
    transaction_ref: transactionRef || "N/A",
    proof_image_url: proofRef,
    payer_name: profile.full_name,
    payer_email: authCheck.email || null,
    payer_phone: profile.phone,
    item_label: `${MEMBERSHIP_PLANS[tier].name} membership — ${billingCycle === "annual" ? "annual" : "monthly"}`,
    status: "pending",
  });

  if (insertError) {
    console.error("[submitPaymentProof] DB insert error:", insertError);
    return {
      success: false,
      error: "Could not record your payment proof. Please try again in a moment or contact support on WhatsApp.",
    };
  }

  await writeNotification(
    userId,
    "spot_available" as any,
    "💳 PAYMENT PROOF RECEIVED",
    `Your payment for ${MEMBERSHIP_PLANS[tier].name} is queued for verification.`
  );

  const siteUrl = await getSiteUrl();
  if (authCheck.email) {
    await sendEmail({
      to: authCheck.email,
      subject: "We received your payment proof",
      heading: "Payment proof received",
      paragraphs: [
        `Hi ${(profile.full_name || "").split(" ")[0] || "there"},`,
        `We have your payment screenshot for ${MEMBERSHIP_PLANS[tier].name} (${billingCycle}). You will get an email as soon as an admin has verified it.`,
      ],
    });
  }
  await notifyAdminByEmail(
    "Membership payment proof to verify",
    [`${profile.full_name || "A member"} uploaded proof for ${MEMBERSHIP_PLANS[tier].name} (${billingCycle}) — PKR ${getMembershipAmountPkr(tier, billingCycle).toLocaleString("en-US")}.`],
    { label: "Open payments queue", url: `${siteUrl}/admin/payments` }
  );

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
    await verifyAdminStatus("payments.view");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const { data, error } = await (supabaseAdmin
    .from("payment_submissions") as any)
    .select(`
      *,
      profiles:user_id (
        full_name,
        city,
        avatar_icon,
        phone
      ),
      official_events:event_id (
        title,
        scheduled_at
      )
    `)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    if (error.message?.includes("schema cache") || error.message?.includes("does not exist")) {
      return { success: true, data: [] };
    }
    return { success: false, error: error.message };
  }

  // Proof screenshots live in a private bucket — hand the admin short-lived links.
  const rows = await Promise.all(
    (data || []).map(async (row: any) => ({
      ...row,
      proof_image_url: await resolveStoredImage(row.proof_image_url),
    }))
  );

  return { success: true, data: rows };
}

/**
 * Server Action: Admin approves or rejects a payment.
 * Approval activates the membership tier or the event passes it paid for.
 */
export async function reviewPaymentSubmissionAction(
  submissionId: string,
  decision: "approved" | "rejected",
  adminNotes?: string
): Promise<BillingActionResult> {
  let admin: { userId: string };
  try {
    admin = await verifyAdminStatus("payments.verify");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Payment verification permission required." };
  }

  if (decision !== "approved" && decision !== "rejected") {
    return { success: false, error: "Invalid decision." };
  }
  const notes = (adminNotes || "").trim().slice(0, 500) || null;

  // Claim the submission atomically: only a still-pending row can be reviewed, so two
  // admins (or a double click) can never process the same payment twice.
  const { data: claimed, error: claimErr } = await (supabaseAdmin
    .from("payment_submissions") as any)
    .update({
      status: decision,
      admin_notes: notes,
      reviewed_by: admin.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId)
    .eq("status", "pending")
    .select("*");

  if (claimErr) {
    return { success: false, error: "Failed to update payment submission." };
  }
  const submission = claimed?.[0];
  if (!submission) {
    return { success: false, error: "This payment was already reviewed or no longer exists." };
  }

  const isTicketPayment =
    submission.purpose === "event_ticket" || String(submission.tier_requested || "").startsWith("event_ticket:");

  if (isTicketPayment) {
    const eventId = submission.event_id || String(submission.tier_requested || "").replace("event_ticket:", "");
    const { data: eventData } = await (supabaseAdmin.from("official_events") as any)
      .select("title")
      .eq("id", eventId)
      .maybeSingle();
    const eventTitle = eventData?.title || "your event";

    if (submission.booking_ref) {
      const ticketUpdate =
        decision === "approved"
          ? { ticket_status: "active", payment_status: "paid" }
          : { ticket_status: "cancelled", payment_status: "rejected" };
      const { error: ticketErr } = await (supabaseAdmin.from("event_tickets") as any)
        .update(ticketUpdate)
        .eq("payment_reference", submission.booking_ref)
        .eq("ticket_status", "pending");
      if (ticketErr) {
        console.error("[reviewPaymentSubmissionAction] Ticket update failed:", ticketErr);
        // Put the submission back so the admin can retry instead of losing the payment.
        await (supabaseAdmin.from("payment_submissions") as any)
          .update({ status: "pending", reviewed_at: null, reviewed_by: null })
          .eq("id", submissionId);
        return { success: false, error: "Could not update the passes. Nothing was changed — please try again." };
      }
    }

    if (submission.payer_email) {
      const siteUrl = await getSiteUrl();
      await sendEmail({
        to: submission.payer_email,
        subject: decision === "approved" ? `Your pass for ${eventTitle} is confirmed` : `Payment not verified for ${eventTitle}`,
        heading: decision === "approved" ? "Your pass is confirmed" : "We could not verify your payment",
        paragraphs:
          decision === "approved"
            ? [
                `Hi ${(submission.payer_name || "").split(" ")[0] || "there"},`,
                `Your payment for "${eventTitle}" has been verified and your pass is active. Open your dashboard and show the QR code at the door.`,
              ]
            : [
                `Hi ${(submission.payer_name || "").split(" ")[0] || "there"},`,
                `We could not match your payment for "${eventTitle}" (booking ${submission.booking_ref || ""}).${notes ? " Reason: " + notes : ""}`,
                "If you did pay, reply to this email or message us on WhatsApp with your bank receipt and we will sort it out.",
              ],
        button: decision === "approved" ? { label: "View my pass", url: `${siteUrl}/dashboard` } : undefined,
      });
    }

    if (submission.user_id) {
      await writeNotification(
        submission.user_id,
        "spot_available" as any,
        decision === "approved" ? "🎟 EVENT PASS CONFIRMED" : "✕ PAYMENT NOT VERIFIED",
        decision === "approved"
          ? `Payment verified! Your pass for "${eventTitle}" is active. Show your QR code at the door.`
          : `We could not verify your payment for "${eventTitle}". ${notes ? "Reason: " + notes : "Please contact support on WhatsApp."}`
      );
    }
    return { success: true };
  }

  // Membership upgrade
  const tier = String(submission.tier_requested || "");
  let activatedUntil: string | null = null;
  if (decision === "approved") {
    if (!["member", "family", "partner"].includes(tier)) {
      await (supabaseAdmin.from("payment_submissions") as any)
        .update({ status: "pending", reviewed_at: null, reviewed_by: null })
        .eq("id", submissionId);
      return { success: false, error: `Unknown tier "${tier}" on this submission.` };
    }
    const paidTier = tier as "member" | "family" | "partner";
    // The amount recorded at submission tells us which billing cycle was bought.
    const cycle =
      MEMBERSHIP_PLANS[paidTier].annualTotal && Number(submission.amount_pkr) === MEMBERSHIP_PLANS[paidTier].annualTotal
        ? "annual"
        : "monthly";

    const activated = await activateSubscription(submission.user_id, paidTier, cycle);
    if (!activated.success) {
      await (supabaseAdmin.from("payment_submissions") as any)
        .update({ status: "pending", reviewed_at: null, reviewed_by: null })
        .eq("id", submissionId);
      return { success: false, error: `Could not activate the tier (${activated.error}). Nothing was changed — please try again.` };
    }
    activatedUntil = activated.expiresAt;
  }

  if (submission.user_id) {
    await writeNotification(
      submission.user_id,
      "spot_available" as any,
      decision === "approved" ? "✓ PAYMENT VERIFIED & TIER ACTIVATED" : "✕ PAYMENT VERIFICATION FAILED",
      decision === "approved"
        ? `Your payment has been verified! ${(MEMBERSHIP_PLANS as any)[tier]?.name || tier.toUpperCase()} is active${activatedUntil ? " until " + formatPkt(activatedUntil, { day: "numeric", month: "long", year: "numeric" }) : ""}.`
        : `Payment could not be verified. ${notes ? "Reason: " + notes : "Please contact support on WhatsApp."}`
    );
  }

  if (submission.payer_email) {
    const siteUrl = await getSiteUrl();
    const planLabel = (MEMBERSHIP_PLANS as any)[tier]?.name || `${tier.toUpperCase()} membership`;
    await sendEmail({
      to: submission.payer_email,
      subject: decision === "approved" ? `${planLabel} is now active` : "We could not verify your membership payment",
      heading: decision === "approved" ? "Your membership is active" : "We could not verify your payment",
      paragraphs:
        decision === "approved"
          ? [
              `Hi ${(submission.payer_name || "").split(" ")[0] || "there"},`,
              `Your payment has been verified and ${planLabel} is active${activatedUntil ? " until " + formatPkt(activatedUntil, { day: "numeric", month: "long", year: "numeric" }) : ""}. We will remind you a few days before it is due for renewal.`,
            ]
          : [
              `Hi ${(submission.payer_name || "").split(" ")[0] || "there"},`,
              `We could not match your payment for ${planLabel}.${notes ? " Reason: " + notes : ""}`,
              "If you did pay, reply to this email or message us on WhatsApp with your bank receipt and we will sort it out.",
            ],
      button: decision === "approved" ? { label: "Open my dashboard", url: `${siteUrl}/dashboard` } : undefined,
    });
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

