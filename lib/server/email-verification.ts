import "server-only";

import crypto from "crypto";
import { promises as dns } from "dns";

/**
 * Email ownership check without a database table:
 *  1. issueEmailChallenge() makes a 6-digit code + a signed "challenge" (email, code hash, expiry).
 *  2. The code is emailed; the browser keeps only the challenge.
 *  3. redeemEmailChallenge() checks the typed code against the challenge and returns a signed
 *     "verified" token for that email, valid for a few hours.
 *  4. Signup actions call isEmailVerified(email, token) before creating anything.
 *
 * Tokens are signed with a key derived from SUPABASE_SERVICE_ROLE_KEY, so they cannot be forged
 * and stop working if that key is rotated. An optional EMAIL_VERIFY_SECRET overrides it.
 */

const CODE_TTL_MS = 15 * 60 * 1000;
const VERIFIED_TTL_MS = 3 * 60 * 60 * 1000;

function key(): Buffer {
  const base = process.env.EMAIL_VERIFY_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!base) throw new Error("Email verification is not configured.");
  return crypto.createHash("sha256").update(`snm-email-verify:${base}`).digest();
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", key()).update(payload).digest("base64url");
}

function pack(parts: string[]): string {
  const body = Buffer.from(parts.join("|")).toString("base64url");
  return `${body}.${sign(body)}`;
}

function unpack(token: string): string[] | null {
  const [body, mac] = String(token || "").split(".");
  if (!body || !mac) return null;
  const expected = sign(body);
  if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  return Buffer.from(body, "base64url").toString().split("|");
}

const norm = (email: string) => String(email || "").trim().toLowerCase();

export function issueEmailChallenge(email: string): { code: string; challenge: string } {
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  const expires = Date.now() + CODE_TTL_MS;
  const codeHash = sign(`${norm(email)}:${code}`);
  return { code, challenge: pack(["c", norm(email), codeHash, String(expires)]) };
}

export function redeemEmailChallenge(
  email: string,
  code: string,
  challenge: string
): { ok: true; verifiedToken: string } | { ok: false; error: string } {
  const parts = unpack(challenge);
  if (!parts || parts[0] !== "c" || parts[1] !== norm(email)) return { ok: false, error: "Please request a new code." };
  if (Date.now() > Number(parts[3])) return { ok: false, error: "This code has expired. Please request a new one." };
  const cleanCode = String(code || "").replace(/\D/g, "");
  const expected = sign(`${norm(email)}:${cleanCode}`);
  if (cleanCode.length !== 6 || expected !== parts[2]) return { ok: false, error: "That code is not correct." };
  return { ok: true, verifiedToken: pack(["v", norm(email), String(Date.now() + VERIFIED_TTL_MS)]) };
}

export function isEmailVerified(email: string, verifiedToken: string | undefined | null): boolean {
  const parts = unpack(verifiedToken || "");
  return !!parts && parts[0] === "v" && parts[1] === norm(email) && Date.now() <= Number(parts[2]);
}

/**
 * True when the email's domain can receive mail (has MX or A records). DNS outages
 * count as "yes" so a network hiccup never blocks a real person.
 */
export async function emailDomainAcceptsMail(email: string): Promise<boolean> {
  const domain = norm(email).split("@")[1];
  if (!domain) return false;
  const withTimeout = <T,>(p: Promise<T>) =>
    Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(Object.assign(new Error("timeout"), { code: "ETIMEOUT" })), 4000))]);
  try {
    const mx = await withTimeout(dns.resolveMx(domain));
    if (mx.length > 0) return true;
  } catch (err: any) {
    if (err?.code !== "ENOTFOUND" && err?.code !== "ENODATA") return true;
  }
  try {
    const a = await withTimeout(dns.resolve4(domain));
    return a.length > 0;
  } catch (err: any) {
    return err?.code !== "ENOTFOUND" && err?.code !== "ENODATA";
  }
}

// Best-effort resend limit per server instance (one code per email per 45 seconds).
const lastSent = new Map<string, number>();
export function canSendCodeNow(email: string): boolean {
  const k = norm(email);
  const now = Date.now();
  if (now - (lastSent.get(k) || 0) < 45_000) return false;
  lastSent.set(k, now);
  if (lastSent.size > 5000) lastSent.clear();
  return true;
}
