import React from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import EventsManagerClient from "./EventsManagerClient";

export const revalidate = 0; // Disable static caching to allow real-time changes

export default async function AdminEventsPage() {
  // Fetch all official events ordered by scheduled time (latest first)
  const { data: events } = await (supabaseAdmin
    .from("official_events") as any)
    .select("*")
    .order("scheduled_at", { ascending: false });

  return <EventsManagerClient initialEvents={events || []} />;
}
