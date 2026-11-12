"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getAdminAccess } from "@/lib/server/auth";
import { sendEmail } from "@/lib/server/email";
import {
  MEMBER_UPLOADS_BUCKET,
  PUBLIC_MEDIA_BUCKET,
  isImageDataUrl,
  isSignedStorageUrl,
  storeImageDataUrl,
  storePublicImageDataUrl,
} from "@/lib/server/storage";
import {
  findAuthUserByEmail,
  generateTempPassword,
  isDuplicateUserError,
  isValidEmail,
} from "@/lib/server/auth-users";

export type AdminActionResult =
  | { success: true; tempPassword?: string }
  | { success: false; error: string };

/**
 * Server-side Authorization Guard.
 *
 * - Not signed in            → redirect to /login
 * - Signed in, not an admin  → redirect to /dashboard
 * - Sub-admin without the requested `permission` → throws (callers turn this into an
 *   "Unauthorized" result). Root admins hold every permission. Pass "root" for
 *   operations only the platform owner may perform.
 */
export async function verifyAdminStatus(
  permission?: string
): Promise<{ userId: string; email: string | undefined; isRoot: boolean }> {
  const access = await getAdminAccess();
  if (!access.ok) {
    redirect(access.reason === "unauthenticated" ? "/login" : "/dashboard");
  }
  if (permission && !access.isRoot && !access.permissions.includes(permission)) {
    throw new Error("Your sub-admin role does not include this permission.");
  }
  return { userId: access.user.userId, email: access.user.email, isRoot: access.isRoot };
}

/**
 * Server Action: Approve a user's account vetting status.
 */
export async function approveUserAction(profileId: string): Promise<AdminActionResult> {
  try {
    await verifyAdminStatus("members.manage");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const { error } = await (supabaseAdmin
    .from("profiles") as any)
    .update({ account_status: "approved" })
    .eq("id", profileId);

  if (error) {
    return { success: false, error: "Failed to approve user profile." };
  }

  // Notify the user in-app
  try {
    const { writeNotification } = await import("@/lib/server/notify");
    await writeNotification(
      profileId,
      "application_approved" as any,
      "✓ MEMBERSHIP APPROVED",
      "Welcome to Solo-No-More! Your vibe application has been approved. You now have full lobby radar access."
    );
  } catch {}

  return { success: true };
}

/**
 * Server Action: Suspend a user's account.
 */
export async function suspendUserAction(profileId: string): Promise<AdminActionResult> {
  try {
    await verifyAdminStatus("members.manage");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const { error } = await (supabaseAdmin
    .from("profiles") as any)
    .update({ account_status: "suspended" })
    .eq("id", profileId);

  if (error) {
    return { success: false, error: "Failed to suspend user profile." };
  }

  return { success: true };
}

/**
 * Server Action: Reset strikes count on a user's profile and restore status.
 */
export async function resetStrikesAction(profileId: string): Promise<AdminActionResult> {
  try {
    await verifyAdminStatus("members.manage");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  // Resets no_show_strikes to 0, and updates account_status back to 'approved' if suspended/rejected
  const { error } = await (supabaseAdmin
    .from("profiles") as any)
    .update({ 
      no_show_strikes: 0,
      account_status: "approved"
    })
    .eq("id", profileId);

  if (error) {
    return { success: false, error: "Failed to reset warnings on profile." };
  }

  return { success: true };
}

export interface OfficialEventPayload {
  title: string;
  description: string;
  venue_name: string;
  event_type: "artist_split" | "platform_owned";
  price: number;
  max_capacity: number;
  scheduled_at: string;
}

/**
 * Server Action: Create a new partner/official event.
 */
export async function createEventAction(payload: OfficialEventPayload): Promise<AdminActionResult> {
  try {
    await verifyAdminStatus("events.manage");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  if (!payload.title || !payload.scheduled_at) {
    return { success: false, error: "Title and Scheduled Date/Time are required." };
  }

  const { error } = await (supabaseAdmin
    .from("official_events") as any)
    .insert({
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      venue_name: payload.venue_name?.trim() || null,
      event_type: payload.event_type,
      price: Number(payload.price) || 0,
      max_capacity: Number(payload.max_capacity) || 100,
      scheduled_at: payload.scheduled_at,
    });

  if (error) {
    return { success: false, error: error.message || "Failed to create official event." };
  }

  return { success: true };
}

/**
 * Server Action: Update an existing official event.
 */
export async function updateEventAction(
  eventId: string,
  payload: Partial<OfficialEventPayload>
): Promise<AdminActionResult> {
  try {
    await verifyAdminStatus("events.manage");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const updateData: any = {};
  if (payload.title !== undefined) updateData.title = payload.title.trim();
  if (payload.description !== undefined) updateData.description = payload.description?.trim() || null;
  if (payload.venue_name !== undefined) updateData.venue_name = payload.venue_name?.trim() || null;
  if (payload.event_type !== undefined) updateData.event_type = payload.event_type;
  if (payload.price !== undefined) updateData.price = Number(payload.price) || 0;
  if (payload.max_capacity !== undefined) updateData.max_capacity = Number(payload.max_capacity) || 100;
  if (payload.scheduled_at !== undefined) updateData.scheduled_at = payload.scheduled_at;

  const { error } = await (supabaseAdmin
    .from("official_events") as any)
    .update(updateData)
    .eq("id", eventId);

  if (error) {
    return { success: false, error: error.message || "Failed to update official event." };
  }

  return { success: true };
}

/**
 * Server Action: Delete an official event.
 */
export async function deleteEventAction(eventId: string): Promise<AdminActionResult> {
  try {
    await verifyAdminStatus("events.manage");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  // To prevent constraint violations, delete any registered tickets first.
  const { error: ticketErr } = await (supabaseAdmin
    .from("event_tickets") as any)
    .delete()
    .eq("event_id", eventId);

  if (ticketErr) {
    console.error("Warning: tickets deletion returned error:", ticketErr);
  }

  const { error } = await (supabaseAdmin
    .from("official_events") as any)
    .delete()
    .eq("id", eventId);

  if (error) {
    return { success: false, error: error.message || "Failed to delete official event." };
  }

  return { success: true };
}

/**
 * Server Action: Upgrade user profile to Partner.
 */
export async function upgradeToPartnerAction(
  profileId: string,
  businessName: string
): Promise<AdminActionResult> {
  try {
    await verifyAdminStatus("partners.manage");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  if (!businessName || !businessName.trim()) {
    return { success: false, error: "Business name is required." };
  }

  const { error } = await (supabaseAdmin
    .from("profiles") as any)
    .update({
      is_partner: true,
      business_name: businessName.trim(),
    })
    .eq("id", profileId);

  if (error) {
    console.error("[upgradeToPartnerAction] DB error:", error);
    return { success: false, error: "Failed to upgrade profile to partner." };
  }

  return { success: true };
}

/**
 * Server Action: Change user subscription tier directly (Admin only).
 */
export async function changeUserTierAction(
  profileId: string,
  tier: "none" | "member" | "family" | "admin"
): Promise<AdminActionResult> {
  try {
    await verifyAdminStatus(tier === "admin" ? "root" : "members.manage");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  if (!["none", "member", "family", "admin"].includes(tier)) {
    return { success: false, error: "Invalid tier." };
  }

  // Only the platform owner may change an existing admin's tier.
  const { data: target } = await (supabaseAdmin.from("profiles") as any)
    .select("subscription_tier")
    .eq("id", profileId)
    .maybeSingle();
  if (target?.subscription_tier === "admin" && tier !== "admin") {
    try {
      await verifyAdminStatus("root");
    } catch (err) {
      if (isRedirectError(err)) throw err;
      return { success: false, error: "Only the platform owner can change an admin account." };
    }
  }

  const { error } = await (supabaseAdmin
    .from("profiles") as any)
    .update({ subscription_tier: tier })
    .eq("id", profileId);

  if (error) {
    return { success: false, error: "Failed to update subscription tier." };
  }

  return { success: true };
}

/**
 * Server Action: Get all beacons across the platform for admin command center.
 */
export async function getAllBeaconsForAdminAction(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    await verifyAdminStatus();
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const { data, error } = await (supabaseAdmin
    .from("beacons") as any)
    .select(`
      *,
      host:host_id (
        id,
        full_name,
        phone,
        city,
        avatar_icon
      ),
      applications:beacon_applications (
        id,
        status,
        created_at,
        flagged_ghost,
        applicant:applicant_id (
          id,
          full_name,
          phone,
          city,
          avatar_icon
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data || [] };
}

/**
 * Server Action: Force cancel a beacon from admin command center.
 */
export async function adminCancelBeaconAction(beaconId: string, reason?: string): Promise<AdminActionResult> {
  try {
    await verifyAdminStatus("events.manage");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const { error } = await (supabaseAdmin
    .from("beacons") as any)
    .update({ status: "cancelled" })
    .eq("id", beaconId);

  if (error) {
    return { success: false, error: "Failed to cancel beacon." };
  }

  return { success: true };
}

/**
 * Server Action: Quick add and approve a new member directly from Admin Overview.
 */
export async function adminCreateMemberAction(data: {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  city?: string;
  tier: "none" | "member" | "family";
}): Promise<AdminActionResult> {
  try {
    await verifyAdminStatus("members.manage");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  if (!data.fullName || !data.email) {
    return { success: false, error: "Full Name and Email are required." };
  }

  if (!isValidEmail(data.email)) {
    return { success: false, error: "Please enter a valid email address." };
  }
  if (data.password && data.password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }
  if (!["none", "member", "family"].includes(data.tier || "member")) {
    return { success: false, error: "Invalid membership tier." };
  }

  // No shared default password: if the admin did not choose one, a unique one-off
  // password is generated and returned so it can be passed on to the member.
  const tempPassword = data.password ? undefined : generateTempPassword();
  const password = data.password || tempPassword!;

  // 1. Create or lookup Supabase Auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email.trim(),
    password,
    email_confirm: true,
    user_metadata: {
      full_name: data.fullName.trim(),
      phone: data.phone?.trim() || "",
      city: data.city?.trim() || "Karachi",
    },
  });

  let userId = authData?.user?.id;
  let createdNew = !!userId;

  if (authError) {
    if (isDuplicateUserError(authError.message)) {
      const existingUser = await findAuthUserByEmail(data.email);
      if (existingUser) {
        userId = existingUser.id;
        createdNew = false;
      } else {
        return { success: false, error: authError.message };
      }
    } else {
      return { success: false, error: authError.message };
    }
  }

  if (userId) {
    if (!createdNew) {
      const { data: existingProfile } = await (supabaseAdmin.from("profiles") as any)
        .select("subscription_tier")
        .eq("id", userId)
        .maybeSingle();
      if (existingProfile?.subscription_tier === "admin") {
        return { success: false, error: "This email belongs to an admin account and cannot be modified here." };
      }
    }
    await (supabaseAdmin.from("profiles") as any).upsert({
      id: userId,
      full_name: data.fullName.trim(),
      phone: data.phone?.trim() || null,
      city: ["Karachi", "Lahore", "Islamabad"].includes(data.city?.trim() || "") ? data.city!.trim() : "Karachi",
      subscription_tier: data.tier || "member",
      account_status: "approved",
      bio: "Officially onboarded by Ops Admin",
    });
  }

  return createdNew && tempPassword ? { success: true, tempPassword } : { success: true };
}

/**
 * Server Action: Quick update user status from dropdown in the Member User tab
 */
export async function adminUpdateUserStatusAction(
  userIdOrAppId: string,
  newStatus: "approved" | "pending" | "payment_pending" | "suspended" | "rejected"
): Promise<AdminActionResult> {
  try {
    await verifyAdminStatus("members.manage");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const profileStatusMap: Record<string, string> = {
    approved: "approved",
    pending: "pending_vetting",
    payment_pending: "pending_vetting",
    suspended: "suspended",
    rejected: "rejected",
  };

  if (!profileStatusMap[newStatus]) {
    return { success: false, error: "Invalid status." };
  }

  // 1. Update in profiles table when the id is a real user id
  if (isUuidLike(userIdOrAppId)) {
    await (supabaseAdmin.from("profiles") as any)
      .update({ account_status: profileStatusMap[newStatus] })
      .eq("id", userIdOrAppId);
  }

  // 2. Also update in membership_applications / local applications store
  try {
    const { adminApproveApplicationAction, adminVerifyPaymentAndIssueInviteAction } = await import(
      "@/app/actions/member-applications"
    );
    if (newStatus === "payment_pending") {
      await adminApproveApplicationAction(userIdOrAppId);
    } else if (newStatus === "approved") {
      await adminVerifyPaymentAndIssueInviteAction(userIdOrAppId);
    } else {
      // membership_applications only knows these statuses
      const appStatus =
        newStatus === "rejected" ? "rejected" : newStatus === "pending" ? "pending_admin_approval" : null;
      if (appStatus) {
        const { data: updatedApps } = await (supabaseAdmin.from("membership_applications") as any)
          .update({ status: appStatus, updated_at: new Date().toISOString() })
          .eq("id", userIdOrAppId)
          .neq("status", appStatus)
          .select("email, full_name");
        const applicant = updatedApps?.[0];
        if (appStatus === "rejected" && applicant?.email) {
          await sendEmail({
            to: applicant.email,
            subject: "Update on your Solo-No-More application",
            heading: "About your application",
            paragraphs: [
              `Hi ${(applicant.full_name || "").split(" ")[0] || "there"},`,
              "Thank you for your interest in Solo-No-More. After reviewing your application we are not able to approve it at this time.",
              "You are welcome to apply again in the future. If you think this was a mistake, just reply to this email.",
            ],
          });
        }
      }
    }
  } catch {}

  return { success: true };
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value || "");
}

export interface SaveUserDetailsInput {
  id: string;
  applicationId?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  fullName?: string;
  username: string;
  email: string;
  role: string;
  status: string;
  phone?: string;
  cnic?: string;
  city?: string;
  address?: string;
  gender?: string;
  dateOfBirth?: string;
  date_of_birth?: string;
  emergencyContactName?: string;
  emergency_contact_name?: string;
  emergencyContactPhone?: string;
  emergency_contact_phone?: string;
  instagramUsername?: string;
  instagram_username?: string;
  bio?: string;
  profilePictureUrl?: string;
  photo_url?: string;
  cnicPictureUrl?: string;
  cnic_picture_url?: string;
  instagramScreenshotUrl?: string;
  instagram_screenshot_url?: string;
  vibeTags?: string[];
  vibe_tags?: string[];
  instagramScreenshots?: string[];
}

/**
 * Server Action: Save all edited fields from User Details & Edit modal
 */
export async function adminSaveUserDetailsAction(
  input: SaveUserDetailsInput
): Promise<AdminActionResult> {
  try {
    await verifyAdminStatus("members.manage");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const computedFirstLast = `${(input.firstName || "").trim()} ${(input.lastName || "").trim()}`.trim();
  const fullName = input.fullName?.trim() || computedFirstLast || input.displayName?.trim() || "Member User";
  const roleLower = (input.role || "").toLowerCase();
  const isPartner = roleLower.includes("partner");
  const wantsAdmin = roleLower.includes("admin");

  // Keep the member's current paid tier. The role dropdown only decides partner/admin
  // flags — it must never silently downgrade (or upgrade) a membership.
  const { data: existingProfile } = await (supabaseAdmin.from("profiles") as any)
    .select("subscription_tier")
    .eq("id", input.id)
    .maybeSingle();
  const currentTier: string = existingProfile?.subscription_tier || "member";

  if (wantsAdmin !== (currentTier === "admin")) {
    // Granting or removing admin is reserved for the platform owner.
    try {
      await verifyAdminStatus("root");
    } catch (err) {
      if (isRedirectError(err)) throw err;
      return { success: false, error: "Only the platform owner can grant or remove admin access." };
    }
  }
  const subscriptionTier = wantsAdmin ? "admin" : currentTier === "admin" ? "member" : currentTier;

  const profileStatusMap: Record<string, string> = {
    approved: "approved",
    pending: "pending_vetting",
    payment_pending: "pending_vetting",
    suspended: "suspended",
    rejected: "rejected",
  };

  // Newly uploaded images go to storage. A temporary view link echoed back by the form
  // means "unchanged" and is ignored so the stored reference is kept.
  const normalizeImage = async (value: string | undefined, kind: "public" | "private", folder: string) => {
    if (!value || isSignedStorageUrl(value)) return undefined;
    if (!isImageDataUrl(value)) return value;
    const stored =
      kind === "public"
        ? await storePublicImageDataUrl(PUBLIC_MEDIA_BUCKET, folder, value)
        : await storeImageDataUrl(MEMBER_UPLOADS_BUCKET, folder, value);
    return stored || undefined;
  };

  const photo = await normalizeImage(input.photo_url || input.profilePictureUrl, "public", `avatars/${input.id}`);
  const cnicPic = await normalizeImage(input.cnic_picture_url || input.cnicPictureUrl, "private", `cnic/${input.id}`);
  const igScreenshot = await normalizeImage(
    input.instagram_screenshot_url || input.instagramScreenshotUrl || (input.instagramScreenshots && input.instagramScreenshots[0]),
    "private",
    `instagram/${input.id}`
  );
  const dob = input.date_of_birth || input.dateOfBirth;
  const emergName = input.emergency_contact_name || input.emergencyContactName;
  const emergPhone = input.emergency_contact_phone || input.emergencyContactPhone;
  const insta = (input.instagram_username || input.instagramUsername || "").replace(/^@/, "");
  const vibes = input.vibe_tags || input.vibeTags;

  // 1. Update Profile record with all verified fields
  const updatePayload: any = {
    full_name: fullName,
    phone: input.phone || null,
    city: input.city || "Karachi",
    bio: input.bio || null,
    is_partner: isPartner,
    subscription_tier: subscriptionTier,
    account_status: profileStatusMap[input.status] || "pending_vetting",
  };

  if (input.firstName) updatePayload.first_name = input.firstName.trim();
  if (input.lastName) updatePayload.last_name = input.lastName.trim();
  if (input.gender) updatePayload.gender = input.gender;
  if (dob) updatePayload.date_of_birth = dob;
  if (input.cnic) updatePayload.cnic = input.cnic.trim();
  if (emergName) updatePayload.emergency_contact_name = emergName.trim();
  if (emergPhone) updatePayload.emergency_contact_phone = emergPhone.trim();
  if (insta) updatePayload.instagram_username = insta.trim();
  if (photo) updatePayload.photo_url = photo;
  if (cnicPic) updatePayload.cnic_picture_url = cnicPic;
  if (igScreenshot) {
    updatePayload.instagram_screenshot_url = igScreenshot;
  }
  if (vibes && vibes.length > 0) updatePayload.vibe_tags = vibes;

  // Resilient update with schema cache retry
  let currentPayload = { ...updatePayload };
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await (supabaseAdmin.from("profiles") as any)
      .update(currentPayload)
      .eq("id", input.id);

    if (!error) break;

    const match = error.message?.match(/Could not find the '([^']+)' column of 'profiles' in the schema cache/i);
    if (match && match[1]) {
      delete currentPayload[match[1]];
      continue;
    }
    console.error("[adminSaveUserDetailsAction] Profile update error:", error);
    break;
  }

  // 2. Also update membership application if applicable
  const targetAppId = input.applicationId || input.id;
  try {
    await (supabaseAdmin.from("membership_applications") as any)
      .update({
        full_name: fullName,
        username: input.username,
        email: input.email,
        phone: input.phone,
        city: input.city,
        cnic: input.cnic,
        vibe: input.bio,
        photo_url: photo || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetAppId);
  } catch {}

  return { success: true };
}

/**
 * Server Action: Full member creation by Admin
 */
export async function adminCreateMemberFullAction(data: {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone?: string;
  city?: string;
  cnic?: string;
  packageTier: "none" | "member" | "family";
  role: "member" | "partner" | "admin";
  password?: string;
}): Promise<AdminActionResult> {
  const fullName = `${(data.firstName || "").trim()} ${(data.lastName || "").trim()}`.trim();
  const result = await adminCreateMemberAction({
    fullName,
    email: data.email,
    password: data.password,
    phone: data.phone,
    city: data.city,
    tier: data.packageTier,
  });
  if (!result.success) return result;

  // Apply the extra fields the full form collects (role, CNIC, username).
  try {
    const user = await findAuthUserByEmail(data.email);
    if (user) {
      const extra: any = {};
      if (data.cnic?.trim()) extra.cnic = data.cnic.trim();
      if (data.username?.trim()) extra.instagram_username = data.username.trim().replace(/^@/, "");
      if (data.role === "partner") extra.is_partner = true;
      if (data.role === "admin") {
        const admin = await verifyAdminStatus();
        if (admin.isRoot) extra.subscription_tier = "admin";
      }
      if (Object.keys(extra).length > 0) {
        await (supabaseAdmin.from("profiles") as any).update(extra).eq("id", user.id);
      }
    }
  } catch (err) {
    if (isRedirectError(err)) throw err;
  }
  return result;
}



