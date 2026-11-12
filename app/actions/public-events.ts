"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { parseEventDescription } from "@/lib/event-metadata";

export interface PublicEventSummary {
  id: string;
  title: string;
  venue_name: string | null;
  address: string | null;
  scheduled_at: string;
  price: number;
  max_capacity: number;
  description: string;
  flyer_image_url: string | null;
  joined_count: number;
  members_only: boolean;
}

/**
 * Server Action: Upcoming, published events for the public /events page.
 *
 * Only what a visitor should see is returned — drafts, events awaiting review,
 * past events and the internal metadata blob are all left out. "joined_count" is
 * the real number of confirmed passes.
 */
export async function getPublicEventsAction(): Promise<PublicEventSummary[]> {
  try {
    const { data: events } = await (supabaseAdmin.from("official_events") as any)
      .select("id, title, description, venue_name, scheduled_at, price, max_capacity")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(60);

    const visible = (events || []).filter((ev: any) => {
      if (!(ev.description || "").includes("SNM_EVENT_META")) return true;
      const status = parseEventDescription(ev.description).metadata?.status;
      return status !== "draft" && status !== "pending_review";
    });
    if (visible.length === 0) return [];

    const counts = new Map<string, number>();
    const { data: tickets } = await (supabaseAdmin.from("event_tickets") as any)
      .select("event_id, ticket_status")
      .in("event_id", visible.map((ev: any) => ev.id))
      .in("ticket_status", ["active", "scanned"]);
    for (const t of tickets || []) counts.set(t.event_id, (counts.get(t.event_id) || 0) + 1);

    return visible.slice(0, 30).map((ev: any) => {
      const hasRichMeta = (ev.description || "").includes("SNM_EVENT_META");
      const parsed = parseEventDescription(ev.description || "");
      const meta = hasRichMeta ? parsed.metadata : null;
      const image = meta?.feature_image || "";
      return {
        id: ev.id,
        title: ev.title,
        venue_name: ev.venue_name || null,
        address: meta?.full_address || null,
        scheduled_at: ev.scheduled_at,
        price: Number(ev.price) || 0,
        max_capacity: Number(ev.max_capacity) || 0,
        description: parsed.cleanDescription.slice(0, 600),
        // Never ship inline base64 artwork to the public listing
        flyer_image_url: image && !image.startsWith("data:") ? image : null,
        joined_count: counts.get(ev.id) || 0,
        members_only: meta ? meta.visibility === "members_only" : false,
      };
    });
  } catch (err) {
    console.error("[getPublicEventsAction] Failed:", err);
    return [];
  }
}
