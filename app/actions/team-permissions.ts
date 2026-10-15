"use server";

import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUserSecurely } from "@/lib/supabase/session";

export type ManagerType = "sub_admin" | "artist_manager" | "partner_manager";

export interface DelegatedManager {
  id: string;
  type: ManagerType;
  delegator_id: string; // The parent Admin, Artist, or Partner ID
  delegator_name: string;
  manager_user_id: string;
  manager_name: string;
  manager_email: string;
  manager_phone?: string;
  permissions: string[]; // Granular GitHub-token style scope keys
  status: "active" | "suspended";
  created_at: string;
  updated_at: string;
}

export interface PlatformUserOption {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  tier?: string;
  isPartner?: boolean;
  type: "member" | "guest" | "partner" | "artist" | "admin";
}

const DATA_DIR = path.join(process.cwd(), "data");
const DELEGATIONS_FILE = path.join(DATA_DIR, "team_delegations.json");

// Initial Seed with realistic baseline records
const INITIAL_DELEGATIONS: DelegatedManager[] = [
  {
    id: "del_subadmin_01",
    type: "sub_admin",
    delegator_id: "admin_root",
    delegator_name: "Super Admin",
    manager_user_id: "usr_hamza_sub",
    manager_name: "Hamza Tariq",
    manager_email: "hamza.ops@solonomore.com",
    manager_phone: "0300-8271923",
    permissions: [
      "events.view",
      "events.door_scanner",
      "bookings.view",
      "bookings.approve",
      "members.view",
      "payments.view",
    ],
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function ensureDelegationsFile(): DelegatedManager[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DELEGATIONS_FILE)) {
      fs.writeFileSync(
        DELEGATIONS_FILE,
        JSON.stringify(INITIAL_DELEGATIONS, null, 2),
        "utf-8"
      );
      return INITIAL_DELEGATIONS;
    }
    const raw = fs.readFileSync(DELEGATIONS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return INITIAL_DELEGATIONS;
  } catch {
    return INITIAL_DELEGATIONS;
  }
}

function writeDelegationsFile(records: DelegatedManager[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DELEGATIONS_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write team_delegations.json:", err);
  }
}

/**
 * Server Action: Get delegated team members filtered by type or delegator.
 */
export async function getTeamDelegationsAction(filter?: {
  type?: ManagerType;
  delegatorId?: string;
}): Promise<DelegatedManager[]> {
  const records = ensureDelegationsFile();
  return records.filter((r) => {
    if (filter?.type && r.type !== filter.type) return false;
    if (filter?.delegatorId && r.delegator_id !== filter.delegatorId) return false;
    return true;
  });
}

/**
 * Server Action: Get all platform users and guests for Admin selection dropdown.
 */
export async function getAllPlatformUsersForAdminAction(): Promise<PlatformUserOption[]> {
  const results: PlatformUserOption[] = [];
  const seenIds = new Set<string>();

  // 1. Fetch from Supabase auth users
  try {
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });
    if (authData?.users) {
      for (const u of authData.users) {
        seenIds.add(u.id);
        const meta = u.user_metadata || {};
        results.push({
          id: u.id,
          email: u.email || "",
          fullName: meta.full_name || u.email?.split("@")[0] || "User",
          phone: meta.phone || u.phone || "",
          tier: meta.role || "member",
          type:
            meta.role === "admin"
              ? "admin"
              : meta.role === "artist"
              ? "artist"
              : meta.role === "partner"
              ? "partner"
              : "member",
        });
      }
    }
  } catch {}

  // 2. Fetch profiles
  try {
    const { data: profiles } = await (supabaseAdmin.from("profiles") as any)
      .select("id, full_name, phone, subscription_tier, is_partner, business_name")
      .limit(100);

    if (profiles) {
      for (const p of profiles) {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          results.push({
            id: p.id,
            email: `${p.full_name?.toLowerCase().replace(/\s+/g, ".") || "member"}@user.solonomore.com`,
            fullName: p.business_name || p.full_name || "Verified Member",
            phone: p.phone || "",
            tier: p.subscription_tier || "member",
            isPartner: p.is_partner,
            type: p.is_partner
              ? "partner"
              : p.subscription_tier === "artist"
              ? "artist"
              : p.subscription_tier === "admin"
              ? "admin"
              : "member",
          });
        }
      }
    }
  } catch {}

  // 3. Fetch from guest_users.json
  try {
    const guestFile = path.join(DATA_DIR, "guest_users.json");
    if (fs.existsSync(guestFile)) {
      const raw = fs.readFileSync(guestFile, "utf-8");
      const guests = JSON.parse(raw);
      if (Array.isArray(guests)) {
        for (const g of guests) {
          if (!seenIds.has(g.id)) {
            seenIds.add(g.id);
            results.push({
              id: g.id,
              email: g.email || "",
              fullName: g.name || "Guest Attendee",
              phone: g.phone || "",
              type: "guest",
            });
          }
        }
      }
    }
  } catch {}

  return results;
}

/**
 * Server Action: Search a member by exact email.
 * Used by Artists and Partners to safely select an existing member without leaking entire user lists.
 */
export async function searchMemberByExactEmailAction(
  email: string
): Promise<{ success: boolean; user?: PlatformUserOption; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: "Please enter a valid email address." };
  }

  try {
    // 1. Try finding in Supabase Auth
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    const matchedAuth = authData?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    if (matchedAuth) {
      const meta = matchedAuth.user_metadata || {};
      return {
        success: true,
        user: {
          id: matchedAuth.id,
          email: matchedAuth.email || cleanEmail,
          fullName: meta.full_name || matchedAuth.email?.split("@")[0] || "User",
          phone: meta.phone || "",
          tier: meta.role || "member",
          type: "member",
        },
      };
    }

    // 2. Try guest users store
    const guestFile = path.join(DATA_DIR, "guest_users.json");
    if (fs.existsSync(guestFile)) {
      const raw = fs.readFileSync(guestFile, "utf-8");
      const guests = JSON.parse(raw);
      if (Array.isArray(guests)) {
        const matchedGuest = guests.find(
          (g: any) => (g.email || "").toLowerCase() === cleanEmail
        );
        if (matchedGuest) {
          return {
            success: true,
            user: {
              id: matchedGuest.id,
              email: matchedGuest.email,
              fullName: matchedGuest.name,
              phone: matchedGuest.phone,
              type: "guest",
            },
          };
        }
      }
    }

    return {
      success: false,
      error: `No registered account found matching "${cleanEmail}". You can invite them by creating a new manager profile below.`,
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
  try {
    const records = ensureDelegationsFile();

    // Check if delegation already exists for this pair
    const existingIdx = records.findIndex(
      (r) =>
        r.delegator_id === delegatorId &&
        (r.manager_user_id === targetUserId ||
          r.manager_email.toLowerCase() === managerEmail.toLowerCase())
    );

    const now = new Date().toISOString();
    let updatedRecord: DelegatedManager;

    if (existingIdx >= 0) {
      records[existingIdx].permissions = permissions;
      records[existingIdx].status = "active";
      records[existingIdx].updated_at = now;
      updatedRecord = records[existingIdx];
    } else {
      updatedRecord = {
        id: `del_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        type,
        delegator_id: delegatorId,
        delegator_name: delegatorName,
        manager_user_id: targetUserId,
        manager_name: managerName,
        manager_email: managerEmail,
        manager_phone: managerPhone,
        permissions,
        status: "active",
        created_at: now,
        updated_at: now,
      };
      records.unshift(updatedRecord);
    }

    writeDelegationsFile(records);

    // Sync role flag into user metadata
    try {
      await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        user_metadata: {
          role: type,
          delegator_id: delegatorId,
          permissions,
        },
      });
    } catch {}

    return { success: true, delegation: updatedRecord };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to assign manager." };
  }
}

/**
 * Server Action: Create brand-new user profile directly and assign as manager.
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
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password || password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  try {
    // 1. Create auth user with auto-confirmed email
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: phone || "",
        role: type,
        delegator_id: delegatorId,
        permissions,
      },
    });

    if (createError || !newUser?.user) {
      return { success: false, error: createError?.message || "Failed to create user account." };
    }

    const userId = newUser.user.id;

    // 2. Ensure profile exists in profiles table
    try {
      await (supabaseAdmin.from("profiles") as any).upsert({
        id: userId,
        full_name: fullName,
        phone: phone || "",
        city: "Karachi",
        avatar_icon: "User",
        subscription_tier: type === "sub_admin" ? "admin" : "member",
        is_partner: type === "partner_manager",
        vibe_tags: ["Verified Manager"],
        account_status: "approved",
      });
    } catch {}

    // 3. Store delegation record
    const records = ensureDelegationsFile();
    const now = new Date().toISOString();
    const newDelegation: DelegatedManager = {
      id: `del_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type,
      delegator_id: delegatorId,
      delegator_name: delegatorName,
      manager_user_id: userId,
      manager_name: fullName,
      manager_email: cleanEmail,
      manager_phone: phone,
      permissions,
      status: "active",
      created_at: now,
      updated_at: now,
    };

    records.unshift(newDelegation);
    writeDelegationsFile(records);

    return { success: true, delegation: newDelegation };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create manager." };
  }
}

/**
 * Server Action: Update granular token-style permissions for a manager.
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
    const records = ensureDelegationsFile();
    const idx = records.findIndex((r) => r.id === delegationId);
    if (idx === -1) {
      return { success: false, error: "Manager record not found." };
    }

    if (permissions !== undefined) records[idx].permissions = permissions;
    if (status !== undefined) records[idx].status = status;
    records[idx].updated_at = new Date().toISOString();

    writeDelegationsFile(records);

    // Sync to user_metadata
    try {
      await supabaseAdmin.auth.admin.updateUserById(records[idx].manager_user_id, {
        user_metadata: {
          permissions: records[idx].permissions,
          delegation_status: records[idx].status,
        },
      });
    } catch {}

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
    const records = ensureDelegationsFile();
    const target = records.find((r) => r.id === delegationId);
    const filtered = records.filter((r) => r.id !== delegationId);
    writeDelegationsFile(filtered);

    if (target?.manager_user_id) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(target.manager_user_id, {
          user_metadata: {
            role: "member",
            delegator_id: null,
            permissions: [],
          },
        });
      } catch {}
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to remove manager." };
  }
}
