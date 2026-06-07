import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import VibeProfileView from "./VibeProfileView";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

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

export default async function ProfileIdPage({ params }: ProfilePageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const { id: profileId } = await params;

  // Fetch target profile using admin client (bypasses select RLS restriction)
  const { data: profile } = await (supabaseAdmin
    .from("profiles") as any)
    .select("id, full_name, bio, social_link, subscription_tier, account_status, no_show_strikes, city, avatar_icon, is_partner, business_name, vibe_tags, is_active_seeker, seeker_updated_at, created_at")
    .eq("id", profileId)
    .maybeSingle();

  if (!profile) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ maxWidth: "400px", width: "100%" }}>
          <div className="nokia-panel" style={{ padding: 0 }}>
            <div style={{ background: "var(--accent-danger)", color: "white", padding: "8px 16px", borderBottom: "2px solid var(--border-strong)" }}>
              <span className="font-pixel" style={{ fontSize: "8px" }}>✕ PROFILE NOT FOUND</span>
            </div>
            <div style={{ padding: "20px", textAlign: "center" }}>
              <div className="nokia-lcd" style={{ fontSize: "32px", marginBottom: "12px", display: "inline-block" }}>???</div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px", lineHeight: "1.5" }}>
                This profile does not exist or has been deactivated.
              </p>
              <a href="/dashboard" className="nokia-btn nokia-btn-primary" style={{ display: "inline-flex", textDecoration: "none", fontSize: "8px" }}>
                ◀ BACK TO LOBBY
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Fetch current friendship status if any between user and profile
  const { data: friendship } = await (supabaseAdmin
    .from("friends") as any)
    .select("id, user_id_1, user_id_2, status")
    .or(`and(user_id_1.eq.${user.id},user_id_2.eq.${profileId}),and(user_id_1.eq.${profileId},user_id_2.eq.${user.id})`)
    .maybeSingle();

  // 1. Fetch hosted beacons
  const { data: hostedBeacons } = await (supabaseAdmin
    .from("beacons") as any)
    .select("id, title, category, status, scheduled_at, created_at, host_id, total_slots, filled_slots")
    .eq("host_id", profileId)
    .order("created_at", { ascending: false });

  // 2. Fetch guest beacon applications
  const { data: joinedApplications } = await (supabaseAdmin
    .from("beacon_applications") as any)
    .select(`
      id,
      status,
      created_at,
      beacons ( id, title, category, status, scheduled_at, host_id, total_slots, filled_slots )
    `)
    .eq("applicant_id", profileId)
    .order("created_at", { ascending: false });

  // 3. Fetch event feedback ratings received by this user (where they were host)
  const hostedBeaconIds = (hostedBeacons || []).map((b: any) => b.id);
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

  // 3b. Fetch peer squad endorsements received by this user and count as vibe_matched
  const { data: endorsements } = await (supabaseAdmin
    .from("squad_endorsements") as any)
    .select("id")
    .eq("recipient_id", profileId);
  if (endorsements && endorsements.length > 0) {
    ratings = [...ratings, ...endorsements.map(() => "vibe_matched")];
  }

  // 4. Mutual friends computation
  let mutualFriendsProfiles: any[] = [];
  let mutualFriendsCount = 0;

  if (user.id !== profileId) {
    const { data: viewerFriends } = await (supabaseAdmin
      .from("friends") as any)
      .select("user_id_1, user_id_2")
      .eq("status", "accepted")
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

    const { data: ownerFriends } = await (supabaseAdmin
      .from("friends") as any)
      .select("user_id_1, user_id_2")
      .eq("status", "accepted")
      .or(`user_id_1.eq.${profileId},user_id_2.eq.${profileId}`);

    const getFriendIds = (list: any[], selfId: string) => {
      return (list || []).map((f) => f.user_id_1 === selfId ? f.user_id_2 : f.user_id_1);
    };

    const viewerFriendIds = getFriendIds(viewerFriends || [], user.id);
    const ownerFriendIds = getFriendIds(ownerFriends || [], profileId);

    const mutualIds = viewerFriendIds.filter(id => ownerFriendIds.includes(id));
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
      currentUserId={user.id}
      initialFriendship={friendship}
      hostedBeacons={hostedBeacons || []}
      joinedApplications={joinedApplications || []}
      ratings={ratings}
      mutualFriendsCount={mutualFriendsCount}
      mutualFriends={mutualFriendsProfiles}
    />
  );
}
