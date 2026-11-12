import crypto from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "sb-dmmgzpiskyocdsxamrgf-auth-token";

export type SessionUserResult =
  | { userId: string; email: string | undefined; user_metadata?: any }
  | { error: string };

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
// Optional: only needed while old HS256-signed sessions are still in circulation.
const LEGACY_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || "";

interface Jwk {
  kid?: string;
  kty: string;
  alg?: string;
  [key: string]: unknown;
}

let jwksCache: { keys: Jwk[]; fetchedAt: number } | null = null;
const JWKS_TTL_MS = 10 * 60 * 1000;

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

async function getJwks(forceRefresh = false): Promise<Jwk[]> {
  if (!forceRefresh && jwksCache && Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.keys;
  }
  try {
    const res = await fetchWithTimeout(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`, {}, 4000);
    if (res.ok) {
      const body = await res.json();
      if (Array.isArray(body?.keys)) {
        jwksCache = { keys: body.keys, fetchedAt: Date.now() };
        return body.keys;
      }
    }
  } catch {}
  return jwksCache?.keys || [];
}

function b64urlToBuffer(input: string): Buffer {
  let b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return Buffer.from(b64, "base64");
}

function verifyWithJwk(alg: string, jwk: Jwk, signingInput: string, signature: Buffer): boolean {
  try {
    const key = crypto.createPublicKey({ key: jwk as any, format: "jwk" });
    const data = Buffer.from(signingInput);
    if (alg === "ES256") {
      return crypto.verify("sha256", data, { key, dsaEncoding: "ieee-p1363" }, signature);
    }
    if (alg === "RS256") {
      return crypto.verify("sha256", data, key, signature);
    }
    if (alg === "EdDSA") {
      return crypto.verify(null, data, key, signature);
    }
  } catch {}
  return false;
}

/**
 * Asks Supabase Auth to validate a token. Used only for tokens we cannot verify
 * locally (legacy HS256 sessions when SUPABASE_JWT_SECRET is not configured).
 */
async function verifyRemotely(accessToken: string): Promise<any | null> {
  try {
    const res = await fetchWithTimeout(
      `${SUPABASE_URL}/auth/v1/user`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` } },
      4000
    );
    if (!res.ok) return null;
    const user = await res.json();
    if (!user?.id) return null;
    return { sub: user.id, email: user.email, user_metadata: user.user_metadata };
  } catch {
    return null;
  }
}

/**
 * Verifies the signature, expiry and audience of a Supabase access token.
 * Returns the verified claims, or null if the token cannot be trusted.
 */
export async function verifyAccessToken(accessToken: string): Promise<any | null> {
  if (!accessToken || typeof accessToken !== "string") return null;
  const parts = accessToken.split(".");
  if (parts.length !== 3) return null;

  let header: any;
  let payload: any;
  try {
    header = JSON.parse(b64urlToBuffer(parts[0]).toString("utf-8"));
    payload = JSON.parse(b64urlToBuffer(parts[1]).toString("utf-8"));
  } catch {
    return null;
  }

  // Cheap rejections first — never trust anything from the payload before the signature check passes.
  const now = Math.floor(Date.now() / 1000);
  if (!payload?.sub || typeof payload.exp !== "number" || payload.exp <= now) return null;

  const signingInput = `${parts[0]}.${parts[1]}`;
  const signature = b64urlToBuffer(parts[2]);
  const alg = String(header?.alg || "");
  let verified = false;

  if (alg === "HS256") {
    if (LEGACY_JWT_SECRET) {
      const expected = crypto.createHmac("sha256", LEGACY_JWT_SECRET).update(signingInput).digest();
      verified = expected.length === signature.length && crypto.timingSafeEqual(expected, signature);
    } else {
      const remote = await verifyRemotely(accessToken);
      if (!remote) return null;
      return { ...payload, sub: remote.sub, email: remote.email, user_metadata: remote.user_metadata };
    }
  } else if (alg === "ES256" || alg === "RS256" || alg === "EdDSA") {
    let keys = await getJwks();
    let jwk = keys.find((k) => k.kid && k.kid === header.kid);
    if (!jwk) {
      // Signing key may have rotated since we cached the key set.
      keys = await getJwks(true);
      jwk = keys.find((k) => k.kid && k.kid === header.kid);
    }
    if (jwk) verified = verifyWithJwk(alg, jwk, signingInput, signature);
  }

  if (!verified) return null;
  if (payload.role && payload.role !== "authenticated") return null;
  if (SUPABASE_URL && payload.iss && !String(payload.iss).startsWith(SUPABASE_URL)) return null;
  return payload;
}

/**
 * Shared server helper: returns the signed-in user from the session cookie.
 *
 * The access token's signature is verified against the project's signing keys, and
 * expired tokens are rejected. The browser client keeps the cookie fresh (see
 * lib/supabase/client.ts); when it has lapsed the user is sent back through /login,
 * which silently restores the session.
 */
export async function getSessionUserSecurely(): Promise<SessionUserResult> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return { error: "Not authenticated. Please sign in again." };
  }

  let accessToken: string | undefined;
  try {
    let raw = sessionCookie.value;
    try {
      raw = decodeURIComponent(raw);
    } catch {}
    if (raw.startsWith("base64-")) {
      raw = Buffer.from(raw.slice(7), "base64").toString("utf-8");
    }
    const parsed = JSON.parse(raw);
    accessToken = Array.isArray(parsed) ? parsed[0] : parsed?.access_token;
  } catch {
    return { error: "Invalid session format." };
  }

  const claims = await verifyAccessToken(accessToken || "");
  if (!claims) {
    return { error: "Session expired. Please sign in again." };
  }

  return {
    userId: String(claims.sub),
    email: typeof claims.email === "string" ? claims.email : undefined,
    user_metadata: claims.user_metadata,
  };
}
