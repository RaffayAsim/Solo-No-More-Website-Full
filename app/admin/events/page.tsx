import React from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import EventsManagerClient from "./EventsManagerClient";
import { withDoorStatus } from "@/lib/ticket-status";
import { verifyAdminStatus } from "@/app/actions/admin";

import { redirect } from "next/navigation";

export const revalidate = 0; // Disable static caching to allow real-time changes

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  // Pages check access themselves — the layout guard alone is not re-run on every navigation.
  await verifyAdminStatus();

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
        payment_status,
        user_name,
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
      initialTickets={withDoorStatus(tickets as any[])}
    />
  );
}
