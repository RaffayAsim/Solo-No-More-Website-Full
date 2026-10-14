import { redirect } from "next/navigation";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import ChatsDashboardClient from "./ChatsDashboardClient";

export const metadata = {
  title: "Squad Chats — Solo-No-More",
  description: "Direct group coordination chats for all your joined and hosted beacons.",
};

interface PageProps {
  searchParams: Promise<{ beaconId?: string }>;
}

export default async function SquadChatsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const auth = await getSessionUserSecurely();

  if ("error" in auth) {
    redirect("/login");
  }

  const userId = auth.userId;

  // 1. Fetch current profile
  const { data: profile } = await (supabaseAdmin
    .from("profiles") as any)
    .select("id, full_name, avatar_icon, city")
    .eq("id", userId)
    .maybeSingle();

  // 2. Fetch beacons hosted by user
  const { data: hostedBeacons } = await (supabaseAdmin
    .from("beacons") as any)
    .select(`
      id,
      title,
      description,
      category,
      location_name,
      scheduled_at,
      status,
      filled_slots,
      total_slots,
      google_maps_url,
      visibility_mode,
      created_at,
      host_id,
      profiles:host_id (
        id,
        full_name,
        avatar_icon
      )
    `)
    .eq("host_id", userId)
    .in("status", ["active", "completed"])
    .order("created_at", { ascending: false });

  // 3. Fetch beacons where user is an approved attendee
  const { data: approvedApps } = await (supabaseAdmin
    .from("beacon_applications") as any)
    .select(`
      beacon_id,
      status,
      beacons:beacon_id (
        id,
        title,
        description,
        category,
        location_name,
        scheduled_at,
        status,
        filled_slots,
        total_slots,
        google_maps_url,
        visibility_mode,
        created_at,
        host_id,
        profiles:host_id (
          id,
          full_name,
          avatar_icon
        )
      )
    `)
    .eq("applicant_id", userId)
    .eq("status", "approved");

  // 4. Merge and deduplicate
  const allBeaconsMap = new Map<string, any>();

  (hostedBeacons || []).forEach((b: any) => {
    allBeaconsMap.set(b.id, {
      ...b,
      isHost: true,
      hostName: b.profiles?.full_name || "Host",
      hostAvatar: b.profiles?.avatar_icon || "🔥",
    });
  });

  (approvedApps || []).forEach((app: any) => {
    const b = app.beacons;
    if (b && !allBeaconsMap.has(b.id)) {
      allBeaconsMap.set(b.id, {
        ...b,
        isHost: false,
        hostName: b.profiles?.full_name || "Host",
        hostAvatar: b.profiles?.avatar_icon || "🔥",
      });
    }
  });

  const chatBeacons = Array.from(allBeaconsMap.values());

  // 5. Fetch applications for hosted beacons (to select squad, approve/decline, and view applicant vibe data)
  const hostedBeaconIds = (hostedBeacons || []).map((b: any) => b.id);
  let hostedApplications: any[] = [];
  let attendanceCountMap: Record<string, number> = {};
  const friendsSet = new Set<string>();

  if (hostedBeaconIds.length > 0) {
    const { data: apps } = await (supabaseAdmin
      .from("beacon_applications") as any)
      .select(`
        id,
        beacon_id,
        applicant_id,
        status,
        created_at,
        flagged_ghost,
        profiles:applicant_id (
          id,
          full_name,
          bio,
          city,
          avatar_icon,
          vibe_tags,
          created_at
        )
      `)
      .in("beacon_id", hostedBeaconIds)
      .order("created_at", { ascending: false });

    hostedApplications = (apps || []).map((app: any) => ({
      ...app,
      profiles: Array.isArray(app.profiles) ? app.profiles[0] : app.profiles,
    }));

    // Fetch friend relationships for current host
    const { data: friendsList } = await (supabaseAdmin
      .from("friends") as any)
      .select("user_id_1, user_id_2")
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
      .eq("status", "accepted");

    (friendsList || []).forEach((f: any) => {
      friendsSet.add(f.user_id_1 === userId ? f.user_id_2 : f.user_id_1);
    });

    // Fetch attendance stats for applicant members
    const applicantIds = Array.from(
      new Set(hostedApplications.map((a: any) => a.applicant_id).filter(Boolean))
    );
    if (applicantIds.length > 0) {
      const { data: attendedData } = await (supabaseAdmin
        .from("beacon_applications") as any)
        .select("applicant_id")
        .eq("status", "approved")
        .in("applicant_id", applicantIds);

      (attendedData || []).forEach((row: any) => {
        attendanceCountMap[row.applicant_id] = (attendanceCountMap[row.applicant_id] || 0) + 1;
      });
    }
  }

  // 6. Fetch latest message snippets
  const beaconIds = chatBeacons.map((b) => b.id);
  const recentMessagesMap: Record<string, any> = {};

  if (beaconIds.length > 0) {
    const { data: recentMsgs } = await (supabaseAdmin
      .from("beacon_messages") as any)
      .select("id, beacon_id, content, created_at, user_id")
      .in("beacon_id", beaconIds)
      .order("created_at", { ascending: false });

    (recentMsgs || []).forEach((m: any) => {
      if (!recentMessagesMap[m.beacon_id]) {
        recentMessagesMap[m.beacon_id] = m;
      }
    });
  }

  return (
    <ChatsDashboardClient
      currentUserId={userId}
      currentUserProfile={profile}
      chatBeacons={chatBeacons}
      recentMessagesMap={recentMessagesMap}
      initialSelectedBeaconId={params.beaconId || (chatBeacons[0]?.id ?? null)}
      hostedApplications={hostedApplications}
      attendanceCountMap={attendanceCountMap}
      friendIds={Array.from(friendsSet)}
    />
  );
}
