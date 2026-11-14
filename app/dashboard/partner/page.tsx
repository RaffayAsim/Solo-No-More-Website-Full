import { Suspense } from "react";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import PartnerDashboardClient from "./PartnerDashboardClient";
import type { Beacon, OfficialEvent } from "@/lib/supabase/types";
import { parseEventDescription } from "@/lib/event-metadata";
import { readDelegations } from "@/lib/server/delegations";
import { withDoorStatus } from "@/lib/ticket-status";

export const metadata = {
  title: "Partner Command Center — Solo-No-More",
  description: "Promote your venue, launch verified promo offers, and host brand events for solo squads.",
};

export default async function PartnerDashboardPage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const sessionResult = await getSessionUserSecurely();
  if ("error" in sessionResult || !sessionResult.userId) {
    redirect("/portal?type=partner&mode=signin");
  }
  const userId = sessionResult.userId;

  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const initialTab = searchParams?.tab || "overview";

  // Parallel query execution for maximum speed
  const [profileRes, beaconsRes, eventsRes] = await Promise.all([
    (supabaseAdmin.from("profiles") as any)
      .select("*")
      .eq("id", userId)
      .single(),
    (supabaseAdmin.from("beacons") as any)
      .select("*")
      .eq("host_id", userId)
      .order("created_at", { ascending: false }),
    (supabaseAdmin.from("official_events") as any)
      .select("*")
      .order("scheduled_at", { ascending: false }),
  ]);

  const profile = profileRes.data;
  // Partners, plus gate managers a partner has delegated access to.
  const delegations = (await readDelegations()).filter(
    (d) => d.status === "active" && d.manager_user_id === userId && d.type === "partner_manager"
  );
  const delegatorIds = new Set(delegations.map((d) => d.delegator_id));
  if (!profile || (!profile.is_partner && delegatorIds.size === 0)) {
    redirect("/dashboard");
  }

  const partnerOffers: Beacon[] = beaconsRes.data || [];
  const allEventsData = eventsRes.data || [];

  const partnerEvents: OfficialEvent[] = (allEventsData || []).filter((ev: any) => {
    try {
      const { metadata } = parseEventDescription(ev.description);
      if (!(ev.description || "").includes("SNM_EVENT_META")) return false;
      const isCreator =
        !!metadata.creator_id && (metadata.creator_id === userId || delegatorIds.has(metadata.creator_id));
      // Collaborations are matched on the exact business name, never a partial match.
      const isPartnerCollab =
        !!profile.is_partner &&
        (metadata.partner_id === userId ||
          (!!profile.business_name &&
            !!metadata.partner_name &&
            metadata.partner_name.trim().toLowerCase() === String(profile.business_name).trim().toLowerCase()));
      return isCreator || isPartnerCollab;
    } catch {
      return false;
    }
  });

  // 4. Fetch ticket telemetry for these partner events
  const eventIds = partnerEvents.map((e) => e.id);
  let partnerTickets: any[] = [];
  if (eventIds.length > 0) {
    const { data: ticketsData } = await (supabaseAdmin
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
      `)
      .in("event_id", eventIds);
    partnerTickets = withDoorStatus(ticketsData as any[]);
  }

  // 5. Fetch squad member applications for partner promo offers
  const offerIds = partnerOffers.map((o) => o.id);
  let partnerApplications: any[] = [];
  if (offerIds.length > 0) {
    const { data: appsData } = await (supabaseAdmin
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
          city,
          avatar_icon,
          vibe_tags
        )
      `)
      .in("beacon_id", offerIds);
    partnerApplications = appsData || [];
  }

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-zinc-400">
          <div className="w-8 h-8 rounded-full border-2 border-[#FF6F26] border-t-transparent animate-spin mx-auto mb-3" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Initializing Partner Command Center...
          </span>
        </div>
      }
    >
      <PartnerDashboardClient
        profile={profile}
        initialOffers={partnerOffers}
        initialEvents={partnerEvents}
        initialTickets={partnerTickets}
        initialOfferApplications={partnerApplications}
        initialTab={initialTab}
      />
    </Suspense>
  );
}
