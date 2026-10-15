import React from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import EventsManagerClient from "./EventsManagerClient";

import { redirect } from "next/navigation";

export const revalidate = 0; // Disable static caching to allow real-time changes

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  if (tab === "manual") {
    redirect("/admin/manual-ticketing");
  }

  // Fetch all official events ordered by scheduled time (latest first)
  const [{ data: events }, { data: tickets }] = await Promise.all([
    (supabaseAdmin.from("official_events") as any)
      .select("*")
      .order("scheduled_at", { ascending: false }),
    (supabaseAdmin.from("event_tickets") as any)
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
      `),
  ]);

  return (
    <EventsManagerClient
      initialEvents={events || []}
      initialTickets={tickets || []}
    />
  );
}
