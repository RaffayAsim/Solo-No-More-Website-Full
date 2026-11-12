import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import ArtistDashboardClient from "./ArtistDashboardClient";
import type { OfficialEvent } from "@/lib/supabase/types";
import { parseEventDescription } from "@/lib/event-metadata";
import { readDelegations } from "@/lib/server/delegations";
import { isAdminEmail, isArtistProfile } from "@/lib/server/auth";
import { withDoorStatus } from "@/lib/ticket-status";

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

  // Payout details live in server-controlled app_metadata (older saves were in user_metadata).
  const userMeta = {
    ...(userRecord?.user?.user_metadata || {}),
    ...((userRecord?.user?.app_metadata as any)?.payout || {}),
  };

  // 2. Fetch all events
  const { data: events } = await (supabaseAdmin
    .from("official_events") as any)
    .select("*")
    .order("scheduled_at", { ascending: false });

  const allEvents: OfficialEvent[] = events || [];

  // Only artists, admins and gate managers an artist has delegated may open this hub.
  const delegations = (await readDelegations()).filter(
    (d) => d.status === "active" && d.manager_user_id === userId && d.type === "artist_manager"
  );
  const delegatorIds = new Set(delegations.map((d) => d.delegator_id));
  const isAdminUser = profile?.subscription_tier === "admin" || isAdminEmail(sessionResult.email);
  if (!isArtistProfile(profile) && !isAdminUser && delegatorIds.size === 0) {
    redirect("/dashboard");
  }

  // Strict data isolation: events this account created, plus events of artists who
  // delegated gate access to it. Ownership is decided by account id, never by name.
  const artistEvents = allEvents.filter((ev) => {
    try {
      const { metadata: meta } = parseEventDescription(ev.description);
      if (!meta.creator_id || !(ev.description || "").includes("SNM_EVENT_META")) return false;
      return meta.creator_id === userId || delegatorIds.has(meta.creator_id);
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
      payment_status,
      user_name,
      created_at,
      profiles (
        full_name,
        city
      )
    `);

  const allTickets = withDoorStatus(tickets as any[]);
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
