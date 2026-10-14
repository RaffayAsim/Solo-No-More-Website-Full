import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import VibeProfileView from "./VibeProfileView";
import { getSessionUserSecurely } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfileIdPage({ params }: ProfilePageProps) {
  const auth = await getSessionUserSecurely();
  if ("error" in auth) {
    redirect("/login");
  }

  const { id: profileId } = await params;
  const currentUserId = auth.userId;

  if (profileId === currentUserId) {
    redirect("/dashboard/profile");
  }

  // Parallel fetch: profile, friendship, hosted beacons, joined applications, endorsements
  const [profileRes, friendshipRes, hostedRes, joinedRes, endorsementsRes] = await Promise.all([
    (supabaseAdmin
      .from("profiles") as any)
      .select("id, full_name, bio, social_link, subscription_tier, account_status, no_show_strikes, city, avatar_icon, is_partner, business_name, vibe_tags, is_active_seeker, seeker_updated_at, created_at")
      .eq("id", profileId)
      .maybeSingle(),
    (supabaseAdmin
      .from("friends") as any)
      .select("id, user_id_1, user_id_2, status")
      .or(`and(user_id_1.eq.${currentUserId},user_id_2.eq.${profileId}),and(user_id_1.eq.${profileId},user_id_2.eq.${currentUserId})`)
      .maybeSingle(),
    (supabaseAdmin
      .from("beacons") as any)
      .select("id, title, category, status, scheduled_at, created_at, host_id, total_slots, filled_slots")
      .eq("host_id", profileId)
      .order("created_at", { ascending: false }),
    (supabaseAdmin
      .from("beacon_applications") as any)
      .select(`
        id,
        status,
        created_at,
        beacons ( id, title, category, status, scheduled_at, host_id, total_slots, filled_slots )
      `)
      .eq("applicant_id", profileId)
      .order("created_at", { ascending: false }),
    (supabaseAdmin
      .from("squad_endorsements") as any)
      .select("id")
      .eq("recipient_id", profileId),
  ]);

  const profile = profileRes?.data;

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#060408] flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full text-center p-8 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
          <div className="text-3xl mb-4 font-bold text-[#FF6F26]">Profile Not Found</div>
          <p className="text-sm text-neutral-400 mb-6">
            This profile does not exist or has been deactivated.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-lg shadow-[#FF6F26]/20 hover:brightness-110"
          >
            Return to Lobby
          </a>
        </div>
      </main>
    );
  }

  const friendship = friendshipRes?.data || null;
  const hostedBeacons = hostedRes?.data || [];
  const joinedApplications = joinedRes?.data || [];

  // Ratings calculation
  const hostedBeaconIds = hostedBeacons.map((b: any) => b.id);
  let ratings: string[] = [];

  if (hostedBeaconIds.length > 0) {
    const { data: feedback } = await (supabaseAdmin
      .from("event_feedback") as any)
      .select("rating")
      .in("beacon_id", hostedBeaconIds);
    if (feedback) {
      ratings = feedback.map((f: any) => f.rating);
    }
  }

  if (endorsementsRes?.data && endorsementsRes.data.length > 0) {
    ratings = [...ratings, ...endorsementsRes.data.map(() => "vibe_matched")];
  }

  // Mutual friends computation (only if looking at someone else)
  let mutualFriendsProfiles: any[] = [];
  let mutualFriendsCount = 0;

  if (currentUserId !== profileId) {
    const [viewerFriendsRes, ownerFriendsRes] = await Promise.all([
      (supabaseAdmin
        .from("friends") as any)
        .select("user_id_1, user_id_2")
        .eq("status", "accepted")
        .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`),
      (supabaseAdmin
        .from("friends") as any)
        .select("user_id_1, user_id_2")
        .eq("status", "accepted")
        .or(`user_id_1.eq.${profileId},user_id_2.eq.${profileId}`),
    ]);

    const getFriendIds = (list: any[], selfId: string) => {
      return (list || []).map((f) => (f.user_id_1 === selfId ? f.user_id_2 : f.user_id_1));
    };

    const viewerFriendIds = getFriendIds(viewerFriendsRes?.data || [], currentUserId);
    const ownerFriendIds = getFriendIds(ownerFriendsRes?.data || [], profileId);

    const mutualIds = viewerFriendIds.filter((id) => ownerFriendIds.includes(id));
    mutualFriendsCount = mutualIds.length;

    if (mutualIds.length > 0) {
      const { data: mutualProfiles } = await (supabaseAdmin
        .from("profiles") as any)
        .select("id, full_name, avatar_icon")
        .in("id", mutualIds)
        .limit(3);
      mutualFriendsProfiles = mutualProfiles || [];
    }
  }

  return (
    <VibeProfileView
      profile={profile}
      currentUserId={currentUserId}
      initialFriendship={friendship}
      hostedBeacons={hostedBeacons}
      joinedApplications={joinedApplications}
      ratings={ratings}
      mutualFriendsCount={mutualFriendsCount}
      mutualFriends={mutualFriendsProfiles}
    />
  );
}
