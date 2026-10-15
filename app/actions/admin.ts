"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export type AdminActionResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Helper to securely get current logged-in user and email via Server Session cookie.
 */
async function getUserIdSecurelyWithEmail(): Promise<{ userId: string; email: string | undefined } | { error: string }> {
  return getSessionUserSecurely();
}

/**
 * Server-side Authorization Guard to verify if the user is an authorized admin.
 * Throws or redirects if not authorized.
 */
export async function verifyAdminStatus(): Promise<{ userId: string; email: string | undefined }> {
  const authCheck = await getUserIdSecurelyWithEmail();
  if ("error" in authCheck) {
    redirect("/login");
  }

  const authorizedEmails = [
    (process.env.ADMIN_EMAIL || "").toLowerCase(),
    "raffay.asim6@gmail.com",
    "admin@solonomore.com",
    "vibe.tester@solonomore.com",
  ].filter(Boolean);

  const isEmailAdmin = authorizedEmails.includes(authCheck.email?.toLowerCase() || "");

  if (isEmailAdmin) {
    return { userId: authCheck.userId, email: authCheck.email };
  }

  // Fallback to checking active DB profile subscription_tier
  const { data: profile } = await (supabaseAdmin
    .from("profiles") as any)
    .select("subscription_tier")
    .eq("id", authCheck.userId)
    .single();

  if (profile?.subscription_tier === "admin") {
    return { userId: authCheck.userId, email: authCheck.email };
  }

  // Check if authorized active Sub-Admin
  try {
    const { getTeamDelegationsAction } = await import("@/app/actions/team-permissions");
    const subAdmins = await getTeamDelegationsAction({ type: "sub_admin" });
    const isSubAdmin = subAdmins.some(
      (s) =>
        s.status === "active" &&
        (s.manager_user_id === authCheck.userId ||
          (authCheck.email && s.manager_email.toLowerCase() === authCheck.email.toLowerCase()))
    );
    if (isSubAdmin) {
      return { userId: authCheck.userId, email: authCheck.email };
    }
  } catch {}

  // Unauthorized users get redirected to standard dashboard
  redirect("/dashboard");
}

/**
 * Server Action: Approve a user's account vetting status.
 */
export async function approveUserAction(profileId: string): Promise<AdminActionResult> {
  try {
    await verifyAdminStatus();
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
    const { writeNotification } = await import("@/app/actions/notifications");
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
    await verifyAdminStatus();
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
    await verifyAdminStatus();
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
    await verifyAdminStatus();
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
    await verifyAdminStatus();
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
    await verifyAdminStatus();
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
    await verifyAdminStatus();
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
    await verifyAdminStatus();
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
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
    await verifyAdminStatus();
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
    await verifyAdminStatus();
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  if (!data.fullName || !data.email) {
    return { success: false, error: "Full Name and Email are required." };
  }

  const generatedPassword = data.password && data.password.length >= 6 ? data.password : "SoloNoMore2026!";

  // 1. Create or lookup Supabase Auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email.trim(),
    password: generatedPassword,
    email_confirm: true,
    user_metadata: {
      full_name: data.fullName.trim(),
      phone: data.phone?.trim() || "",
      city: data.city?.trim() || "Karachi",
    },
  });

  let userId = authData?.user?.id;

  if (authError) {
    if (
      authError.message.toLowerCase().includes("already registered") ||
      authError.message.toLowerCase().includes("duplicate")
    ) {
      const { data: userLookup } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = userLookup.users.find(
        (u) => u.email?.toLowerCase() === data.email.trim().toLowerCase()
      );
      if (existingUser) {
        userId = existingUser.id;
      } else {
        return { success: false, error: authError.message };
      }
    } else {
      return { success: false, error: authError.message };
    }
  }

  if (userId) {
    await (supabaseAdmin.from("profiles") as any).upsert({
      id: userId,
      full_name: data.fullName.trim(),
      phone: data.phone?.trim() || null,
      city: data.city?.trim() || "Karachi",
      subscription_tier: data.tier || "member",
      account_status: "approved",
      bio: "Officially onboarded by Ops Admin",
    });
  }

  return { success: true };
}

/**
 * Server Action: Quick update user status from dropdown in the Member User tab
 */
export async function adminUpdateUserStatusAction(
  userIdOrAppId: string,
  newStatus: "approved" | "pending" | "payment_pending" | "suspended" | "rejected"
): Promise<AdminActionResult> {
  try {
    await verifyAdminStatus();
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

  // 1. Update in profiles table if it exists
  await (supabaseAdmin.from("profiles") as any)
    .update({ account_status: profileStatusMap[newStatus] || newStatus })
    .eq("id", userIdOrAppId);

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
      await (supabaseAdmin.from("membership_applications") as any)
        .update({ status: newStatus })
        .eq("id", userIdOrAppId);
    }
  } catch {}

  return { success: true };
}

export interface SaveUserDetailsInput {
  id: string;
  applicationId?: string;
  firstName: string;
  lastName: string;
  displayName: string;
  username: string;
  email: string;
  role: string;
  status: string;
  phone?: string;
  cnic?: string;
  city?: string;
  address?: string;
  bio?: string;
  profilePictureUrl?: string;
  cnicPictureUrl?: string;
  instagramScreenshots?: string[];
}

/**
 * Server Action: Save all edited fields from User Details & Edit modal
 */
export async function adminSaveUserDetailsAction(
  input: SaveUserDetailsInput
): Promise<AdminActionResult> {
  try {
    await verifyAdminStatus();
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`.trim() || input.displayName.trim();
  const isPartner = input.role.toLowerCase().includes("partner");
  const subscriptionTier = input.role.toLowerCase().includes("admin")
    ? "admin"
    : isPartner
    ? "family"
    : "member";

  const profileStatusMap: Record<string, string> = {
    approved: "approved",
    pending: "pending_vetting",
    payment_pending: "pending_vetting",
    suspended: "suspended",
    rejected: "rejected",
  };

  // 1. Update Profile record
  const updatePayload: any = {
    full_name: fullName,
    phone: input.phone || null,
    city: input.city || "Karachi",
    bio: input.bio || null,
    is_partner: isPartner,
    subscription_tier: subscriptionTier,
    account_status: profileStatusMap[input.status] || input.status,
  };

  if (input.profilePictureUrl) {
    updatePayload.avatar_icon = input.profilePictureUrl;
  }

  await (supabaseAdmin.from("profiles") as any)
    .update(updatePayload)
    .eq("id", input.id);

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
        status: input.status === "pending" ? "pending_admin_approval" : input.status,
        photo_url: input.profilePictureUrl || undefined,
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
  const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();
  return adminCreateMemberAction({
    fullName,
    email: data.email,
    password: data.password,
    phone: data.phone,
    city: data.city,
    tier: data.packageTier,
  });
}



