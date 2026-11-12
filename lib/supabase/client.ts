import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SESSION_COOKIE = "sb-dmmgzpiskyocdsxamrgf-auth-token";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn(
    "Warning: Missing Supabase public environment variables. If this is a build server, remember to set them in your dashboard."
  );
}

/**
 * Browser-side Supabase client (uses the anon key).
 * Safe to import in Client Components and Server Components.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Sync session to cookie for middleware & server-side rendering
if (typeof window !== "undefined") {
  // Gracefully suppress stale refresh token error overlays in Next.js development
  window.addEventListener("unhandledrejection", (event) => {
    const msg = event?.reason?.message || "";
    const name = event?.reason?.name || "";
    if (
      msg.toLowerCase().includes("refresh token") ||
      msg.toLowerCase().includes("invalid refresh token") ||
      name === "AuthApiError"
    ) {
      event.preventDefault(); // Suppresses the red Turbopack dev error modal
      console.warn("[Supabase Auth] Expired refresh token intercepted. Clearing stale session.");
      const cookieName = "sb-dmmgzpiskyocdsxamrgf-auth-token";
      document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax; Secure`;
      try {
        localStorage.removeItem(cookieName);
      } catch {}
      supabase.auth.signOut({ scope: "local" }).catch(() => {});
    }
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    syncSessionCookie(session);
  });
}


/**
 * Mirrors the browser session into the cookie the server reads.
 * Serialized as base64-encoded JSON: [access_token, refresh_token].
 */
export function syncSessionCookie(
  session: { access_token: string; refresh_token: string } | null | undefined
) {
  if (typeof document === "undefined") return;
  if (session) {
    const cookieValue = `base64-${btoa(JSON.stringify([session.access_token, session.refresh_token]))}`;
    document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(cookieValue)}; path=/; max-age=${3600 * 24 * 7}; SameSite=Lax; Secure`;
  } else {
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax; Secure`;
    try {
      localStorage.removeItem(SESSION_COOKIE);
    } catch {}
  }
}
