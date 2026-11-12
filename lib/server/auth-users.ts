import "server-only";

/**
 * Server-only helpers for Supabase Auth user lookups.
 * `auth.admin.listUsers()` is paginated (50 per page by default), so a single call
 * silently misses users once the project grows. These helpers walk every page.
 */
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

const PER_PAGE = 200;
const MAX_PAGES = 50; // 10,000 users — plenty of headroom

export async function listAllAuthUsers(): Promise<any[]> {
  const all: any[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error || !data?.users) break;
    all.push(...data.users);
    if (data.users.length < PER_PAGE) break;
  }
  return all;
}

export async function findAuthUserByEmail(email: string): Promise<any | null> {
  const target = email.trim().toLowerCase();
  if (!target) return null;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error || !data?.users) return null;
    const match = data.users.find((u: any) => u.email?.toLowerCase() === target);
    if (match) return match;
    if (data.users.length < PER_PAGE) return null;
  }
  return null;
}

export function isDuplicateUserError(message: string | undefined | null): boolean {
  const m = (message || "").toLowerCase();
  return m.includes("already registered") || m.includes("already been registered") || m.includes("duplicate");
}

/** Strong one-off password for accounts an admin creates without choosing one. */
export function generateTempPassword(): string {
  return `Snm-${crypto.randomBytes(9).toString("base64url")}`;
}

export function isValidEmail(email: string | undefined | null): boolean {
  return !!email && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}
