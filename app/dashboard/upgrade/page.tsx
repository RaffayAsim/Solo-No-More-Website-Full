import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import UpgradeHubClient from "./UpgradeHubClient";

export const dynamic = "force-dynamic";

export default async function UpgradePage() {
  const auth = await getSessionUserSecurely();
  if ("error" in auth) {
    redirect("/login");
  }

  // Fetch subscription tier
  const { data: profile } = await (supabaseAdmin
    .from("profiles") as any)
    .select("subscription_tier")
    .eq("id", auth.userId)
    .maybeSingle();

  const currentTier = profile?.subscription_tier || "none";

  return <UpgradeHubClient currentTier={currentTier} />;
}
