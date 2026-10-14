import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import EventsBoardClient from "./EventsBoardClient";
import type { OfficialEvent } from "@/lib/supabase/types";

import { parseEventDescription } from "@/lib/event-metadata";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const auth = await getSessionUserSecurely();
  if ("error" in auth) {
    redirect("/login");
  }

  // Parallel fetch: user tier, all events, and user's claimed tickets
  const [profileRes, eventsRes, ticketsRes] = await Promise.all([
    (supabaseAdmin
      .from("profiles") as any)
      .select("subscription_tier, is_partner")
      .eq("id", auth.userId)
      .maybeSingle(),
    (supabaseAdmin
      .from("official_events") as any)
      .select("*")
      .order("scheduled_at", { ascending: true }),
    (supabaseAdmin
      .from("event_tickets") as any)
      .select("event_id")
      .eq("user_id", auth.userId),
  ]);

  const currentTier = profileRes?.data?.subscription_tier || "none";
  const userEmail = auth.email || "";
  const isPartner = Boolean(profileRes?.data?.is_partner || profileRes?.data?.subscription_tier === "partner");
  const isAdmin = profileRes?.data?.subscription_tier === "admin" || userEmail.toLowerCase() === "admin@solonomore.com" || userEmail.toLowerCase() === "raffay@solonomore.com";
  const isArtist = profileRes?.data?.subscription_tier === "artist" || userEmail.toLowerCase().includes("artist") || userEmail.toLowerCase().includes("dj");
  const isRestrictedRole = isPartner || isAdmin || isArtist;
  const roleLabel = isPartner ? "Partner" : isAdmin ? "Admin" : isArtist ? "Artist" : "";

  const rawEvents: OfficialEvent[] = eventsRes?.data || [];
  // Only verified & published events are showcased to members
  const officialEvents: OfficialEvent[] = rawEvents.filter((ev) => {
    try {
      const { metadata } = parseEventDescription(ev.description);
      return metadata.status !== "pending_review" && metadata.status !== "draft";
    } catch {
      return true;
    }
  });
  const claimedEventIds: string[] = (ticketsRes?.data || []).map((t: any) => t.event_id);

  return (
    <EventsBoardClient
      events={officialEvents}
      currentTier={currentTier}
      claimedEventIds={claimedEventIds}
      isRestrictedRole={isRestrictedRole}
      roleLabel={roleLabel}
    />
  );
}
