import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Beacon, BeaconApplication } from "@/lib/supabase/types";
import ManageHostDashboard from "./ManageHostDashboard";

export const metadata = {
  title: "Host Management — Solo-No-More",
  description: "Manage your hosted Beacons and connection requests.",
};

// ─── Secure Session Fetcher ──────────────────────────────────────────────────
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

export default async function ManagePage() {
  // 1. Verify user authentication
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  // 2. Fetch profile and verify approved status
  const { data: profile } = await (supabaseAdmin
    .from("profiles")
    .select("account_status")
    .eq("id", user.id)
    .single() as any);

  if (!profile || profile.account_status !== "approved") {
    redirect("/dashboard");
  }

  // 3. Fetch Beacons hosted by this user
  const { data: beacons } = await (supabaseAdmin
    .from("beacons")
    .select("*")
    .eq("host_id", user.id)
    .order("created_at", { ascending: false }) as any);

  const hostedBeacons: Beacon[] = beacons || [];

  // 4. Fetch all applications for hosted beacons, joining with applicant profiles
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
          full_name,
          bio
        )
      `)
      .in("beacon_id", beaconIds)
      .order("created_at", { ascending: false }) as any);
      
    applicationsList = apps || [];
  }

  // 5. Fetch Beacons that this user has successfully joined and been approved for
  const { data: guestApps } = await (supabaseAdmin
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
    .eq("applicant_id", user.id)
    .eq("status", "approved") as any);

  const joinedBeacons = (guestApps || [])
    .map((ga: any) => ga.beacons)
    .filter(Boolean);

  return (
    <ManageHostDashboard
      beacons={hostedBeacons}
      initialApplications={applicationsList}
      joinedBeacons={joinedBeacons}
    />
  );
}
