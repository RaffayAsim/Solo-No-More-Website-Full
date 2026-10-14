import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import ArtistDashboardClient from "./ArtistDashboardClient";
import type { OfficialEvent } from "@/lib/supabase/types";
import { parseEventDescription } from "@/lib/event-metadata";

export const metadata = {
  title: "Artist & Performer Hub — Solo-No-More",
  description: "Publish your gigs, sell digital ticket passes via platform Raast/Bank processing, manage door check-ins, and curate your EPK.",
};

interface PageProps {
  searchParams?: Promise<{ tab?: string }>;
}

export default async function ArtistDashboardPage({ searchParams }: PageProps) {
  const sessionResult = await getSessionUserSecurely();
  if ("error" in sessionResult || !sessionResult.userId) {
    redirect("/login");
  }
  const userId = sessionResult.userId;
  const params = searchParams ? await searchParams : {};
  const currentTab = params?.tab || "overview";

  // 1. Fetch user profile and auth user metadata
  const [{ data: profile }, { data: userRecord }] = await Promise.all([
    (supabaseAdmin
      .from("profiles") as any)
      .select("id, full_name, phone, subscription_tier, is_partner, business_name, vibe_tags, bio, social_link, city")
      .eq("id", userId)
      .single(),
    supabaseAdmin.auth.admin.getUserById(userId),
  ]);

  const userMeta = userRecord?.user?.user_metadata || {};

  // 2. Fetch all events
  const { data: events } = await (supabaseAdmin
    .from("official_events") as any)
    .select("*")
    .order("scheduled_at", { ascending: false });

  const allEvents: OfficialEvent[] = events || [];

  // Filter strictly for this artist's events (Data Isolation)
  const artistEvents = allEvents.filter((ev) => {
    try {
      const { metadata: meta } = parseEventDescription(ev.description);
      if (meta.creator_id === userId) return true;
      if (meta.creator_name && (meta.creator_name === profile?.full_name || meta.creator_name === profile?.business_name)) return true;
      if (meta.organizer?.name && (meta.organizer.name === profile?.business_name || meta.organizer.name === profile?.full_name)) return true;
      return false;
    } catch {
      return false;
    }
  });

  const artistEventIds = new Set(artistEvents.map((e) => e.id));

  // 3. Fetch tickets strictly for this artist's events
  const { data: tickets } = await (supabaseAdmin
    .from("event_tickets") as any)
    .select(`
      id,
      event_id,
      user_id,
      ticket_status,
      created_at,
      profiles (
        full_name,
        city
      )
    `);

  const allTickets = tickets || [];
  const artistTickets = allTickets.filter((t: any) => artistEventIds.has(t.event_id));

  return (
    <ArtistDashboardClient
      profile={profile}
      initialEvents={artistEvents}
      initialTickets={artistTickets}
      initialUserMeta={userMeta}
      initialTab={currentTab}
    />
  );
}
