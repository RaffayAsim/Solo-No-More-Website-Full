import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

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
  supabase.auth.onAuthStateChange((event, session) => {
    const cookieName = "sb-dmmgzpiskyocdsxamrgf-auth-token";
    if (session) {
      // Serialize as base64-encoded JSON array containing [access_token, refresh_token]
      const sessionData = [session.access_token, session.refresh_token];
      const rawValue = JSON.stringify(sessionData);
      const base64Value = btoa(rawValue);
      const cookieValue = `base64-${base64Value}`;
      
      // Set the cookie with a max-age of 1 week (matching standard Supabase sessions)
      document.cookie = `${cookieName}=${encodeURIComponent(cookieValue)}; path=/; max-age=${3600 * 24 * 7}; SameSite=Lax; Secure`;
    } else {
      // Clear the cookie when signed out
      document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax; Secure`;
    }
  });
}
