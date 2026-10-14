import { notFound, redirect } from "next/navigation";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import BeaconSquadHubClient from "./BeaconSquadHubClient";
import type { Beacon } from "@/lib/supabase/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BeaconSquadHubPage({ params }: PageProps) {
  const { id: beaconId } = await params;
  const auth = await getSessionUserSecurely();

  if ("error" in auth) {
    redirect("/login");
  }

  // 1. Fetch the specific Beacon
  const { data: beacon, error: beaconError } = await (supabaseAdmin
    .from("beacons") as any)
    .select("*")
    .eq("id", beaconId)
    .maybeSingle();

  if (beaconError || !beacon) {
    notFound();
  }

  // 2. Fetch audience applications with applicant profiles
  const { data: rawApps } = await (supabaseAdmin
    .from("beacon_applications") as any)
    .select(`
      id,
      beacon_id,
      applicant_id,
      status,
      created_at,
      profiles:applicant_id (
        id,
        full_name,
        bio,
        phone,
        city,
        avatar_icon
      )
    `)
    .eq("beacon_id", beaconId)
    .order("created_at", { ascending: false });

  const applications = (rawApps || []).map((app: any) => ({
    id: app.id,
    beacon_id: app.beacon_id,
    applicant_id: app.applicant_id,
    status: app.status,
    created_at: app.created_at,
    profiles: Array.isArray(app.profiles) ? app.profiles[0] : app.profiles,
  }));

  // 3. Fetch Host Profile
  const { data: hostProfile } = await (supabaseAdmin
    .from("profiles") as any)
    .select("id, full_name, bio, avatar_icon, city")
    .eq("id", beacon.host_id)
    .maybeSingle();

  // 4. Verify access: If user is the Host, route them directly to the Squad Chat & Host Command Center
  const isHost = auth.userId === beacon.host_id;
  if (isHost) {
    redirect(`/dashboard/chats?beaconId=${beaconId}`);
  }

  const userApplication = applications.find((a: any) => a.applicant_id === auth.userId);

  return (
    <BeaconSquadHubClient
      beacon={beacon as Beacon}
      initialApplications={applications}
      currentUserId={auth.userId}
      isHost={isHost}
      userApplicationStatus={userApplication?.status || null}
      hostProfile={hostProfile}
    />
  );
}
