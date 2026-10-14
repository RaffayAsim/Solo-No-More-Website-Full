"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdminStatus } from "@/app/actions/admin";
import { isRedirectError } from "next/dist/client/components/redirect-error";

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
    await verifyAdminStatus();
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { partners: [], approvedMembers: [] };
  }

  // 1. Fetch profiles
  const { data: profiles } = await (supabaseAdmin
    .from("profiles") as any)
    .select("*")
    .order("created_at", { ascending: false });

  // 2. Fetch auth users
  let authUsers: any[] = [];
  try {
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
    if (authData && authData.users) {
      authUsers = authData.users;
    }
  } catch (err) {
    console.error("Error loading auth users:", err);
  }

  const authMap = new Map(authUsers.map((u) => [u.id, u]));

  // 3. Extract real partners
  const partnerMap = new Map<string, PartnerRecord>();
  const approvedMembers: ApprovedMemberOption[] = [];

  (profiles || []).forEach((p: any) => {
    const authUser = authMap.get(p.id);
    const email = authUser?.email || p.email || "";
    if (!email) return;

    // Filter out dedicated artists from business partners
    const isArtist =
      email.toLowerCase().includes("artist") ||
      (p.business_name && /dj|music|synapse|beats|touring/i.test(p.business_name)) ||
      (p.full_name && /dj/i.test(p.full_name));

    const isPartner =
      p.is_partner === true ||
      p.subscription_tier === "partner" ||
      Boolean(p.business_name) ||
      email.toLowerCase().includes("partner");

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
    } else if (p.account_status === "approved" || p.subscription_tier === "member") {
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
    await verifyAdminStatus();

    const dbAccountStatus =
      newStatus === "approved"
        ? "approved"
        : newStatus === "suspended"
        ? "suspended"
        : "pending_vetting";

    const { error } = await (supabaseAdmin.from("profiles") as any)
      .update({
        account_status: dbAccountStatus,
        is_partner: newStatus === "approved" ? true : false,
      })
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
    await verifyAdminStatus();
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  if (!memberId) {
    return { success: false, error: "Please select an approved member." };
  }

  try {
    await (supabaseAdmin.from("profiles") as any)
      .update({
        is_partner: true,
        subscription_tier: "partner",
        account_status: "approved",
      })
      .eq("id", memberId);

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
    await verifyAdminStatus();
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  if (!params.fullName?.trim() || !params.email?.trim()) {
    return { success: false, error: "Full Name and Email are required." };
  }

  const generatedPassword =
    params.password && params.password.length >= 6
      ? params.password
      : "PartnerAccess2026!";

  // Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: params.email.trim(),
    password: generatedPassword,
    email_confirm: true,
    user_metadata: {
      full_name: params.fullName.trim(),
      phone: params.phone.trim(),
      cnic: params.cnic?.trim() || "",
      is_partner: true,
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
        (u) => u.email?.toLowerCase() === params.email.trim().toLowerCase()
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
      full_name: params.fullName.trim(),
      phone: params.phone?.trim() || null,
      is_partner: true,
      subscription_tier: "partner",
      account_status: "approved",
    });
  }

  return { success: true, partnerId: userId || undefined };
}
