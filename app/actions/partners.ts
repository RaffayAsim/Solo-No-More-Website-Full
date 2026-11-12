"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdminStatus } from "@/app/actions/admin";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { findAuthUserByEmail, isDuplicateUserError, isValidEmail, listAllAuthUsers } from "@/lib/server/auth-users";

export interface PartnerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "approved" | "pending" | "active" | "suspended";
  registered: string;
  avatar_url?: string;
  cnic?: string;
  business_name?: string;
}

export interface ApprovedMemberOption {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

/**
 * Fetch all REAL partners and approved members from Supabase database
 */
export async function getAdminPartnersDataAction(): Promise<{
  partners: PartnerRecord[];
  approvedMembers: ApprovedMemberOption[];
}> {
  try {
    await verifyAdminStatus("partners.manage");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { partners: [], approvedMembers: [] };
  }

  // 1. Fetch profiles
  const { data: profiles } = await (supabaseAdmin
    .from("profiles") as any)
    .select("*")
    .order("created_at", { ascending: false });

  // 2. Fetch auth users (all pages)
  const authUsers: any[] = await listAllAuthUsers().catch(() => []);

  const authMap = new Map(authUsers.map((u) => [u.id, u]));

  // 3. Extract real partners
  const partnerMap = new Map<string, PartnerRecord>();
  const approvedMembers: ApprovedMemberOption[] = [];

  (profiles || []).forEach((p: any) => {
    const authUser = authMap.get(p.id);
    const email = authUser?.email || p.email || "";
    if (!email) return;

    // Roles come from the account itself — nothing is guessed from names or emails.
    const isArtist = p.subscription_tier === "artist" || p.role === "artist";
    const isPartner = p.is_partner === true || p.subscription_tier === "partner";

    if (isPartner && !isArtist) {
      const regDate = p.created_at
        ? new Date(p.created_at).toLocaleString("en-US")
        : "Recent";

      const currentStatus =
        p.account_status === "approved"
          ? "approved"
          : p.account_status === "suspended"
          ? "suspended"
          : "pending";

      partnerMap.set(p.id, {
        id: p.id,
        name: p.full_name || p.business_name || email.split("@")[0] || "Partner",
        email,
        phone: p.phone || authUser?.user_metadata?.phone || "—",
        status: currentStatus,
        registered: regDate,
        avatar_url: p.avatar_icon || undefined,
        business_name: p.business_name || undefined,
      });
    } else if (!isArtist && p.account_status === "approved" && p.subscription_tier !== "admin") {
      approvedMembers.push({
        id: p.id,
        name: p.full_name || email.split("@")[0] || "Approved Member",
        email,
        phone: p.phone || "",
      });
    }
  });

  const partners = Array.from(partnerMap.values());
  return { partners, approvedMembers };
}

/**
 * Update partner account approval status live in database
 */
export async function updatePartnerStatusAction(
  partnerId: string,
  newStatus: "approved" | "pending" | "suspended"
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdminStatus("partners.manage");

    const dbAccountStatus =
      newStatus === "approved"
        ? "approved"
        : newStatus === "suspended"
        ? "suspended"
        : "pending_vetting";

    const { error } = await (supabaseAdmin.from("profiles") as any)
      // Suspending or re-queuing a partner changes their access, not who they are:
      // the partner flag stays so they remain listed here and can be re-approved.
      .update({ account_status: dbAccountStatus })
      .eq("id", partnerId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update partner status." };
  }
}

/**
 * Grant partner access to an existing approved member
 */
export async function grantPartnerAccessAction(
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdminStatus("partners.manage");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  if (!memberId) {
    return { success: false, error: "Please select an approved member." };
  }

  try {
    const { error } = await (supabaseAdmin.from("profiles") as any)
      .update({
        is_partner: true,
        subscription_tier: "partner",
        account_status: "approved",
      })
      .eq("id", memberId)
      .neq("subscription_tier", "admin");

    if (error) return { success: false, error: "Failed to grant partner access." };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to grant partner access." };
  }
}

/**
 * Create a new partner account with fresh credentials
 */
export async function createNewPartnerAccountAction(params: {
  fullName: string;
  email: string;
  phone: string;
  cnic?: string;
  password?: string;
}): Promise<{ success: boolean; error?: string; partnerId?: string }> {
  try {
    await verifyAdminStatus("partners.manage");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  if (!params.fullName?.trim() || !params.email?.trim()) {
    return { success: false, error: "Full Name and Email are required." };
  }

  if (!isValidEmail(params.email)) {
    return { success: false, error: "Please enter a valid email address." };
  }
  if (!params.password || params.password.length < 8) {
    return { success: false, error: "Set a password of at least 8 characters for the partner's login." };
  }

  // Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: params.email.trim(),
    password: params.password,
    email_confirm: true,
    user_metadata: {
      full_name: params.fullName.trim(),
      phone: (params.phone || "").trim(),
    },
  });

  let userId = authData?.user?.id;

  if (authError) {
    if (isDuplicateUserError(authError.message)) {
      const existingUser = await findAuthUserByEmail(params.email);
      if (!existingUser) return { success: false, error: authError.message };
      const { data: existingProfile } = await (supabaseAdmin.from("profiles") as any)
        .select("subscription_tier")
        .eq("id", existingUser.id)
        .maybeSingle();
      if (existingProfile?.subscription_tier === "admin") {
        return { success: false, error: "This email belongs to an admin account." };
      }
      userId = existingUser.id;
    } else {
      return { success: false, error: authError.message };
    }
  }

  if (userId) {
    await (supabaseAdmin.from("profiles") as any).upsert({
      id: userId,
      full_name: params.fullName.trim(),
      phone: params.phone?.trim() || null,
      ...(params.cnic?.trim() ? { cnic: params.cnic.trim() } : {}),
      is_partner: true,
      subscription_tier: "partner",
      account_status: "approved",
    });
  }

  return { success: true, partnerId: userId || undefined };
}
