import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type SessionUserResult =
  | { userId: string; email: string | undefined; user_metadata?: any }
  | { error: string };

/**
 * Shared server helper to retrieve user ID and email securely from cookie.
 * Transparently refreshes expired sessions using the cookie-stored refresh_token.
 */
export async function getSessionUserSecurely(): Promise<SessionUserResult> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("sb-dmmgzpiskyocdsxamrgf-auth-token");

  if (!sessionCookie?.value) {
    return { error: "Not authenticated. Please sign in again." };
  }

  let accessToken: string;
  let refreshToken: string | undefined;
  try {
    let raw = sessionCookie.value;
    if (raw.startsWith("base64-")) {
      raw = Buffer.from(raw.slice(7), "base64").toString("utf-8");
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      accessToken = parsed[0];
      refreshToken = parsed[1];
    } else {
      accessToken = parsed.access_token;
      refreshToken = parsed.refresh_token;
    }
  } catch {
    return { error: "Invalid session format." };
  }

  // Attempt token verification
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  
  if (error || !data.user) {
    // Access token verification failed. Try refresh_token if present
    if (refreshToken) {
      const { data: refreshData, error: refreshError } = await supabaseAdmin.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (refreshError || !refreshData.user || !refreshData.session) {
        // Clear invalid tokens from browser cookie
        try {
          cookieStore.set("sb-dmmgzpiskyocdsxamrgf-auth-token", "", {
            path: "/",
            maxAge: 0,
            sameSite: "lax",
            secure: true,
          });
        } catch {}
        return { error: "Session expired. Please sign in again." };
      }

      // Update cookie with fresh tokens
      const sessionData = [refreshData.session.access_token, refreshData.session.refresh_token];
      const rawValue = JSON.stringify(sessionData);
      const base64Value = Buffer.from(rawValue).toString("base64");
      const cookieValue = `base64-${base64Value}`;

      try {
        cookieStore.set("sb-dmmgzpiskyocdsxamrgf-auth-token", cookieValue, {
          path: "/",
          maxAge: 3600 * 24 * 7,
          sameSite: "lax",
          secure: true,
        });
      } catch {}

      return {
        userId: refreshData.user.id,
        email: refreshData.user.email,
        user_metadata: refreshData.user.user_metadata,
      };
    }

    return { error: "Session expired. Please sign in again." };
  }

  return {
    userId: data.user.id,
    email: data.user.email,
    user_metadata: data.user.user_metadata,
  };
}
