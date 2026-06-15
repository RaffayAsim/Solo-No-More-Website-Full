import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import NetworkHubClient from "./NetworkHubClient";

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

export default async function NetworkPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch all relationships involving current user, joining both user_1 and user_2 profiles
  const { data: friendships, error } = await (supabaseAdmin
    .from("friends") as any)
    .select(`
      id,
      user_id_1,
      user_id_2,
      status,
      created_at,
      user_1_profile:profiles!friends_user_id_1_fkey(id, full_name, subscription_tier),
      user_2_profile:profiles!friends_user_id_2_fkey(id, full_name, subscription_tier)
    `)
    .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

  const initialRelations = friendships || [];

  return (
    <NetworkHubClient
      initialRelations={initialRelations}
      currentUserId={user.id}
    />
  );
}
