import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import type { Beacon, BeaconApplication } from "@/lib/supabase/types";
import ManageHostDashboard from "./ManageHostDashboard";

export const metadata = {
  title: "Host Management — Solo-No-More",
  description: "Manage your hosted Beacons and connection requests.",
};

export default async function ManagePage() {
  // 1. Verify user authentication with ultra-fast local JWT decoding
  const sessionResult = await getSessionUserSecurely();
  if ("error" in sessionResult || !sessionResult.userId) {
    redirect("/login");
  }
  const userId = sessionResult.userId;

  // 2. Fetch profile, hosted beacons, and joined beacons in parallel
  const [profileRes, beaconsRes, guestAppsRes] = await Promise.all([
    (supabaseAdmin
      .from("profiles")
      .select("account_status")
      .eq("id", userId)
      .single() as any),
    (supabaseAdmin
      .from("beacons")
      .select("*")
      .eq("host_id", userId)
      .order("created_at", { ascending: false }) as any),
    (supabaseAdmin
      .from("beacon_applications")
      .select(`
        beacon_id,
        beacons:beacon_id (
          id,
          host_id,
          title,
          description,
          category,
          visibility_mode,
          total_slots,
          filled_slots,
          location_name,
          scheduled_at,
          status,
          created_at,
          profiles:host_id (
            full_name
          )
        )
      `)
      .eq("applicant_id", userId)
      .eq("status", "approved") as any),
  ]);

  const profile = profileRes.data;
  if (!profile || profile.account_status !== "approved") {
    redirect("/dashboard");
  }

  const hostedBeacons: Beacon[] = beaconsRes.data || [];

  // 3. Fetch applications for hosted beacons if any exist
  let applicationsList: any[] = [];
  if (hostedBeacons.length > 0) {
    const beaconIds = hostedBeacons.map((b) => b.id);
    const { data: apps } = await (supabaseAdmin
      .from("beacon_applications")
      .select(`
        id,
        beacon_id,
        applicant_id,
        status,
        created_at,
        flagged_ghost,
        profiles (
          id,
          full_name,
          bio,
          phone,
          city,
          avatar_icon
        )
      `)
      .in("beacon_id", beaconIds)
      .order("created_at", { ascending: false }) as any);
      
    applicationsList = apps || [];
  }

  const joinedBeacons = (guestAppsRes.data || [])
    .map((ga: any) => ga.beacons)
    .filter(Boolean);

  return (
    <ManageHostDashboard
      beacons={hostedBeacons}
      initialApplications={applicationsList}
      joinedBeacons={joinedBeacons}
      currentUserId={userId}
    />
  );
}

