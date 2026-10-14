import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import NetworkHubClient from "./NetworkHubClient";

export default async function NetworkPage() {
  const sessionResult = await getSessionUserSecurely();
  if ("error" in sessionResult || !sessionResult.userId) {
    redirect("/login");
  }
  const userId = sessionResult.userId;


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
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

  const initialRelations = friendships || [];

  return (
    <NetworkHubClient
      initialRelations={initialRelations}
      currentUserId={userId}
    />
  );
}

