"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getAdminAccess,
  getProfileRole,
  getSessionUser,
  isArtistProfile,
  isRootAdmin,
  isUuid,
  type SessionUser,
} from "@/lib/server/auth";
import {
  readDelegations,
  writeDelegations,
  type DelegatedManager as DelegatedManagerRecord,
  type ManagerType as ManagerTypeValue,
} from "@/lib/server/delegations";
import { findAuthUserByEmail, isValidEmail, listAllAuthUsers } from "@/lib/server/auth-users";

export type DelegatedManager = DelegatedManagerRecord;
export type ManagerType = ManagerTypeValue;

export interface PlatformUserOption {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  tier?: string;
  isPartner?: boolean;
  type: "member" | "guest" | "partner" | "artist" | "admin";
}

const ROOT_DELEGATOR_ID = "admin_root";

/**
 * Works out who the caller is allowed to delegate on behalf of.
 * - sub_admin delegations: root admins only (delegator is always the platform root).
 * - artist/partner managers: the artist/partner themselves, or a root admin acting for them.
 */
async function resolveDelegator(
  type: ManagerType,
  requestedDelegatorId: string
): Promise<{ ok: true; user: SessionUser; delegatorId: string } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not authenticated. Please sign in again." };

  const profile = await getProfileRole(user.userId);
  const root = await isRootAdmin(user, profile);

  if (type === "sub_admin") {
    if (!root) return { ok: false, error: "Only the platform admin can manage sub-admins." };
    return { ok: true, user, delegatorId: ROOT_DELEGATOR_ID };
  }

  if (root) {
    return { ok: true, user, delegatorId: requestedDelegatorId || user.userId };
  }

  const eligible = type === "partner_manager" ? !!profile?.is_partner : isArtistProfile(profile) || !!profile?.is_partner;
  if (!eligible) {
    return { ok: false, error: "Only verified artists and partners can manage a gate team." };
  }
  // Non-admins can only ever delegate on their own behalf.
  return { ok: true, user, delegatorId: user.userId };
}

/** Can the caller modify this existing delegation record? */
async function canModifyDelegation(record: DelegatedManager): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not authenticated. Please sign in again." };
  if (await isRootAdmin(user)) return { ok: true };
  if (record.type !== "sub_admin" && record.delegator_id === user.userId) return { ok: true };
  return { ok: false, error: "Unauthorized. You cannot manage this team member." };
}

function sanitizePermissions(permissions: unknown): string[] {
  if (!Array.isArray(permissions)) return [];
  return Array.from(
    new Set(permissions.filter((p): p is string => typeof p === "string" && /^[a-z_]+\.[a-z_]+$/.test(p)))
  ).slice(0, 40);
}

/**
 * Server Action: Get delegated team members filtered by type or delegator.
 * Admins see everything; everyone else only sees the team they delegated themselves.
 */
export async function getTeamDelegationsAction(filter?: {
  type?: ManagerType;
  delegatorId?: string;
}): Promise<DelegatedManager[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const admin = await getAdminAccess();
  const records = await readDelegations();

  return records.filter((r) => {
    if (filter?.type && r.type !== filter.type) return false;
    if (admin.ok) {
      // Sub-admins may look at the roster but only the root admin sees other sub-admins.
      if (r.type === "sub_admin" && !admin.isRoot) return false;
      if (filter?.delegatorId && r.delegator_id !== filter.delegatorId) return false;
      return true;
    }
    return r.type !== "sub_admin" && r.delegator_id === user.userId;
  });
}

/**
 * Server Action: Get all platform users for the Admin selection dropdown (root admin only).
 */
export async function getAllPlatformUsersForAdminAction(): Promise<PlatformUserOption[]> {
  const admin = await getAdminAccess();
  if (!admin.ok || !admin.isRoot) return [];

  const results: PlatformUserOption[] = [];

  const [authUsers, profilesRes] = await Promise.all([
    listAllAuthUsers().catch(() => [] as any[]),
    (supabaseAdmin.from("profiles") as any).select(
      "id, full_name, phone, subscription_tier, is_partner, business_name"
    ),
  ]);
  const profileMap = new Map<string, any>((profilesRes?.data || []).map((p: any) => [p.id, p]));

  for (const u of authUsers) {
    const p = profileMap.get(u.id);
    const meta = u.user_metadata || {};
    const tier = p?.subscription_tier || "none";
    results.push({
      id: u.id,
      email: u.email || "",
      fullName: p?.business_name || p?.full_name || meta.full_name || u.email?.split("@")[0] || "User",
      phone: p?.phone || meta.phone || u.phone || "",
      tier,
      isPartner: !!p?.is_partner,
      type: tier === "admin" ? "admin" : tier === "artist" ? "artist" : p?.is_partner ? "partner" : "member",
    });
  }

  return results;
}

/**
 * Server Action: Search a member by exact email.
 * Used by Admins, Artists and Partners to pick an existing member without exposing the user list.
 */
export async function searchMemberByExactEmailAction(
  email: string
): Promise<{ success: boolean; user?: PlatformUserOption; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not authenticated. Please sign in again." };

  const profile = await getProfileRole(user.userId);
  const allowed = (await isRootAdmin(user, profile)) || !!profile?.is_partner || isArtistProfile(profile);
  if (!allowed) return { success: false, error: "Unauthorized." };

  const cleanEmail = (email || "").trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  try {
    const matchedAuth = await findAuthUserByEmail(cleanEmail);
    if (!matchedAuth) {
      return {
        success: false,
        error: `No registered account found matching "${cleanEmail}". You can invite them by creating a new manager profile below.`,
      };
    }

    const { data: p } = await (supabaseAdmin.from("profiles") as any)
      .select("full_name, phone, subscription_tier")
      .eq("id", matchedAuth.id)
      .maybeSingle();

    return {
      success: true,
      user: {
        id: matchedAuth.id,
        email: matchedAuth.email || cleanEmail,
        fullName: p?.full_name || matchedAuth.user_metadata?.full_name || cleanEmail.split("@")[0],
        phone: p?.phone || "",
        tier: p?.subscription_tier || "member",
        type: "member",
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to search member." };
  }
}

/**
 * Server Action: Assign an existing user as Sub-Admin, Artist Manager, or Partner Manager.
 */
export async function assignExistingUserAsManagerAction({
  delegatorId,
  delegatorName,
  type,
  targetUserId,
  managerName,
  managerEmail,
  managerPhone,
  permissions,
}: {
  delegatorId: string;
  delegatorName: string;
  type: ManagerType;
  targetUserId: string;
  managerName: string;
  managerEmail: string;
  managerPhone?: string;
  permissions: string[];
}): Promise<{ success: boolean; delegation?: DelegatedManager; error?: string }> {
  const who = await resolveDelegator(type, delegatorId);
  if (!who.ok) return { success: false, error: who.error };

  if (!isUuid(targetUserId)) {
    return { success: false, error: "Please select a registered user account." };
  }
  if (targetUserId === who.user.userId && type !== "sub_admin") {
    return { success: false, error: "You already have full access to your own events." };
  }

  try {
    // Trust the database for the target's identity, not the values sent by the browser.
    const { data: targetAuth } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
    if (!targetAuth?.user) return { success: false, error: "User account not found." };
    const { data: targetProfile } = await (supabaseAdmin.from("profiles") as any)
      .select("full_name, phone")
      .eq("id", targetUserId)
      .maybeSingle();

    const cleanPermissions = sanitizePermissions(permissions);
    const records = await readDelegations();
    const existingIdx = records.findIndex(
      (r) => r.type === type && r.delegator_id === who.delegatorId && r.manager_user_id === targetUserId
    );

    const now = new Date().toISOString();
    let updatedRecord: DelegatedManager;

    if (existingIdx >= 0) {
      records[existingIdx].permissions = cleanPermissions;
      records[existingIdx].status = "active";
      records[existingIdx].updated_at = now;
      updatedRecord = records[existingIdx];
    } else {
      updatedRecord = {
        id: `del_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
        type,
        delegator_id: who.delegatorId,
        delegator_name: (delegatorName || "").slice(0, 120),
        manager_user_id: targetUserId,
        manager_name: targetProfile?.full_name || (managerName || "").slice(0, 120) || "Team Member",
        manager_email: targetAuth.user.email || (managerEmail || "").trim().toLowerCase(),
        manager_phone: targetProfile?.phone || managerPhone,
        permissions: cleanPermissions,
        status: "active",
        created_at: now,
        updated_at: now,
      };
      records.unshift(updatedRecord);
    }

    const saved = await writeDelegations(records);
    if (!saved.success) return { success: false, error: saved.error };

    return { success: true, delegation: updatedRecord };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to assign manager." };
  }
}

/**
 * Server Action: Create a brand-new user account and assign it as a manager.
 */
export async function createNewManagerProfileAction({
  delegatorId,
  delegatorName,
  type,
  email,
  password,
  fullName,
  phone,
  permissions,
}: {
  delegatorId: string;
  delegatorName: string;
  type: ManagerType;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  permissions: string[];
}): Promise<{ success: boolean; delegation?: DelegatedManager; error?: string }> {
  const who = await resolveDelegator(type, delegatorId);
  if (!who.ok) return { success: false, error: who.error };

  const cleanEmail = (email || "").trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) {
    return { success: false, error: "Please enter a valid email address." };
  }
  if (!password || password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }
  if (!fullName?.trim()) {
    return { success: false, error: "Full name is required." };
  }

  try {
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName.trim(),
        phone: phone || "",
      },
    });

    if (createError || !newUser?.user) {
      return { success: false, error: createError?.message || "Failed to create user account." };
    }

    const userId = newUser.user.id;

    // Managers are ordinary approved accounts. Their extra powers come only from the
    // delegation record, so revoking the delegation fully revokes access.
    await (supabaseAdmin.from("profiles") as any).upsert({
      id: userId,
      full_name: fullName.trim(),
      phone: phone || null,
      city: "Karachi",
      subscription_tier: "member",
      is_partner: false,
      account_status: "approved",
    });

    const now = new Date().toISOString();
    const newDelegation: DelegatedManager = {
      id: `del_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      type,
      delegator_id: who.delegatorId,
      delegator_name: (delegatorName || "").slice(0, 120),
      manager_user_id: userId,
      manager_name: fullName.trim(),
      manager_email: cleanEmail,
      manager_phone: phone,
      permissions: sanitizePermissions(permissions),
      status: "active",
      created_at: now,
      updated_at: now,
    };

    const records = await readDelegations();
    records.unshift(newDelegation);
    const saved = await writeDelegations(records);
    if (!saved.success) return { success: false, error: saved.error };

    return { success: true, delegation: newDelegation };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create manager." };
  }
}

/**
 * Server Action: Update permissions or status for a manager.
 */
export async function updateManagerPermissionsAction({
  delegationId,
  permissions,
  status,
}: {
  delegationId: string;
  permissions?: string[];
  status?: "active" | "suspended";
}): Promise<{ success: boolean; error?: string }> {
  try {
    const records = await readDelegations();
    const idx = records.findIndex((r) => r.id === delegationId);
    if (idx === -1) {
      return { success: false, error: "Manager record not found." };
    }

    const allowed = await canModifyDelegation(records[idx]);
    if (!allowed.ok) return { success: false, error: allowed.error };

    if (permissions !== undefined) records[idx].permissions = sanitizePermissions(permissions);
    if (status === "active" || status === "suspended") records[idx].status = status;
    records[idx].updated_at = new Date().toISOString();

    const saved = await writeDelegations(records);
    if (!saved.success) return { success: false, error: saved.error };

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update permissions." };
  }
}

/**
 * Server Action: Revoke and remove a manager.
 */
export async function removeManagerDelegationAction(
  delegationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const records = await readDelegations();
    const target = records.find((r) => r.id === delegationId);
    if (!target) return { success: true };

    const allowed = await canModifyDelegation(target);
    if (!allowed.ok) return { success: false, error: allowed.error };

    const saved = await writeDelegations(records.filter((r) => r.id !== delegationId));
    if (!saved.success) return { success: false, error: saved.error };

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to remove manager." };
  }
}
