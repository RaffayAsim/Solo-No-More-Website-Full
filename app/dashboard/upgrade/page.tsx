import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import UpgradeHubClient from "./UpgradeHubClient";

/**
 * Securely get the logged in user ID via server cookie
 */
async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("sb-dmmgzpiskyocdsxamrgf-auth-token");

  if (!sessionCookie?.value) return null;

  try {
    let raw = sessionCookie.value;
    if (raw.startsWith("base64-")) {
      raw = Buffer.from(raw.slice(7), "base64").toString("utf-8");
    }
    const parsed = JSON.parse(raw);
    const accessToken = Array.isArray(parsed) ? parsed[0] : parsed.access_token;
    if (!accessToken) return null;

    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !data.user) return null;

    return data.user;
  } catch {
    return null;
  }
}

export default async function UpgradePage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch subscription tier
  const { data: profile } = await (supabaseAdmin
    .from("profiles") as any)
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  const currentTier = profile?.subscription_tier || "none";

  return <UpgradeHubClient currentTier={currentTier} />;
}
