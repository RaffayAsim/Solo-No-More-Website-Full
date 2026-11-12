import "server-only";

/**
 * Server-only authorization helpers.
 *
 * This file is deliberately NOT a "use server" module: nothing exported here is
 * reachable from the browser. Import it only from Server Actions, Route Handlers
 * and Server Components.
 */
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import { parseEventDescription, type EventRichMetadata } from "@/lib/event-metadata";
import { readDelegations, type DelegatedManager } from "@/lib/server/delegations";

export interface SessionUser {
  userId: string;
  email: string | undefined;
}

/**
 * Root admin emails come from the environment only (ADMIN_EMAILS, comma separated,
 * plus the legacy single ADMIN_EMAIL). Nothing is hardcoded, so an address can never
 * be "claimed" by signing up with it.
 */
export function getAdminEmails(): string[] {
  const raw = [process.env.ADMIN_EMAILS || "", process.env.ADMIN_EMAIL || ""].join(",");
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const result = await getSessionUserSecurely();
  if ("error" in result) return null;
  return { userId: result.userId, email: result.email };
}

export interface ProfileRole {
  subscription_tier: string | null;
  is_partner: boolean;
  business_name: string | null;
  full_name: string | null;
  account_status: string | null;
  role: string | null;
}

export async function getProfileRole(userId: string): Promise<ProfileRole | null> {
  const { data } = await (supabaseAdmin.from("profiles") as any)
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return null;
  return {
    subscription_tier: data.subscription_tier ?? null,
    is_partner: !!data.is_partner,
    business_name: data.business_name ?? null,
    full_name: data.full_name ?? null,
    account_status: data.account_status ?? null,
    role: data.role ?? null,
  };
}

export function isArtistProfile(profile: { subscription_tier?: string | null; role?: string | null } | null | undefined) {
  return profile?.subscription_tier === "artist" || profile?.role === "artist";
}

/** Root admin: listed in ADMIN_EMAILS or holding the `admin` tier on their profile. */
export async function isRootAdmin(user: SessionUser, profile?: ProfileRole | null): Promise<boolean> {
  if (isAdminEmail(user.email)) return true;
  const p = profile === undefined ? await getProfileRole(user.userId) : profile;
  return p?.subscription_tier === "admin";
}

/** Active sub-admin delegation for this user (matched by user id only, never by email). */
export async function getSubAdminDelegation(user: SessionUser): Promise<DelegatedManager | null> {
  const records = await readDelegations();
  return (
    records.find(
      (r) => r.type === "sub_admin" && r.status === "active" && r.manager_user_id === user.userId
    ) || null
  );
}

export type AdminAccess =
  | { ok: true; user: SessionUser; isRoot: boolean; permissions: string[] }
  | { ok: false; reason: "unauthenticated" | "forbidden" };

/**
 * Resolves admin access for the current session.
 * - Root admins pass every check.
 * - Sub-admins pass only when they hold `permission` (if one is requested).
 */
export async function getAdminAccess(permission?: string): Promise<AdminAccess> {
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  if (await isRootAdmin(user)) {
    return { ok: true, user, isRoot: true, permissions: ["*"] };
  }

  const delegation = await getSubAdminDelegation(user);
  if (!delegation) return { ok: false, reason: "forbidden" };

  const permissions = Array.isArray(delegation.permissions) ? delegation.permissions : [];
  if (permission && !permissions.includes(permission)) {
    return { ok: false, reason: "forbidden" };
  }
  return { ok: true, user, isRoot: false, permissions };
}

export interface EventAccess {
  ok: boolean;
  error?: string;
  user?: SessionUser;
  event?: any;
  metadata?: EventRichMetadata;
  isAdmin?: boolean;
  isOwner?: boolean;
}

/**
 * Can the current user manage (edit, approve bookings, run the door for) this event?
 * Allowed: admins, the event's creator, and managers the creator delegated `scope` to.
 */
export async function getEventAccess(eventId: string, scope?: string): Promise<EventAccess> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not authenticated. Please sign in again." };

  const { data: event } = await (supabaseAdmin.from("official_events") as any)
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) return { ok: false, error: "Event not found.", user };

  const { metadata } = parseEventDescription(event.description || "");

  const admin = await getAdminAccess(scope);
  if (admin.ok) return { ok: true, user, event, metadata, isAdmin: true, isOwner: false };

  if (metadata?.creator_id && metadata.creator_id === user.userId) {
    return { ok: true, user, event, metadata, isAdmin: false, isOwner: true };
  }

  if (metadata?.creator_id) {
    const records = await readDelegations();
    const delegated = records.some(
      (r) =>
        r.status === "active" &&
        r.manager_user_id === user.userId &&
        r.delegator_id === metadata.creator_id &&
        (!scope || (Array.isArray(r.permissions) && r.permissions.includes(scope)))
    );
    if (delegated) return { ok: true, user, event, metadata, isAdmin: false, isOwner: false };
  }

  return { ok: false, error: "Unauthorized: you do not manage this event.", user, event, metadata };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}
