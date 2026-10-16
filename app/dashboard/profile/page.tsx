import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import ProfileDashboardClient from "./ProfileDashboardClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Profile — Solo-No-More",
  description: "View and manage your personal Solo-No-More member vibe profile.",
};

export default async function DashboardProfilePage() {
  const sessionResult = await getSessionUserSecurely();
  if ("error" in sessionResult || !sessionResult.userId) {
    redirect("/login");
  }
  const userId = sessionResult.userId;

  // Parallel fetch: profile, hosted beacons, joined beacons, friends count
  const [profileRes, hostedRes, joinedRes, friendsRes] = await Promise.all([
    (supabaseAdmin
      .from("profiles") as any)
      .select("*")
      .eq("id", userId)
      .maybeSingle(),
    (supabaseAdmin
      .from("beacons") as any)
      .select("id, title, category, status, scheduled_at, created_at, host_id, total_slots, filled_slots, location_name")
      .eq("host_id", userId)
      .order("created_at", { ascending: false }),
    (supabaseAdmin
      .from("beacon_applications") as any)
      .select(`
        id,
        status,
        created_at,
        beacons:beacon_id (
          id,
          title,
          category,
          status,
          scheduled_at,
          total_slots,
          filled_slots,
          location_name,
          host_id,
          profiles:host_id (
            full_name,
            avatar_icon
          )
        )
      `)
      .eq("applicant_id", userId)
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
    (supabaseAdmin
      .from("friends") as any)
      .select("id", { count: "exact" })
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
      .eq("status", "accepted"),
  ]);

  const profile = profileRes?.data;
  if (!profile) {
    redirect("/dashboard");
  }

  const hostedBeacons = hostedRes?.data || [];
  const joinedApplications = (joinedRes?.data || []).map((app: any) => ({
    id: app.id,
    status: app.status,
    created_at: app.created_at,
    beacon: app.beacons,
  }));
  const friendsCount = friendsRes?.count || 0;

  return (
    <ProfileDashboardClient
      profile={profile}
      hostedBeacons={hostedBeacons}
      joinedApplications={joinedApplications}
      friendsCount={friendsCount}
    />
  );
}
