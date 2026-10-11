import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import ArtistDashboardClient from "./ArtistDashboardClient";
import type { OfficialEvent } from "@/lib/supabase/types";

/**
 * Securely get the logged-in user via server cookie
 */
async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("sb-dmmgzpiskyocdsxamrgf-auth-token");

  if (!sessionCookie?.value) return null;

  try {
    let raw = sessionCookie.value;
    if (raw.startsWith("base64-")) {
      raw = Buffer.from(raw.slice(7), "base64").toString("utf-8");
    }
    const parsed = JSON.parse(raw);
    const accessToken = Array.isArray(parsed) ? parsed[0] : parsed.access_token;
    if (!accessToken) return null;

    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !data.user) return null;

    return data.user;
  } catch {
    return null;
  }
}

export const metadata = {
  title: "Artist & Ticketing Portal — Solo-No-More",
  description: "Publish your gigs, sell digital ticket passes via Raast in PKR, and manage door check-ins.",
};

export default async function ArtistDashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  // 1. Fetch user profile
  const { data: profile } = await (supabaseAdmin
    .from("profiles") as any)
    .select("id, full_name, subscription_tier, is_partner, business_name")
    .eq("id", user.id)
    .single();

  // 2. Fetch all events
  const { data: events } = await (supabaseAdmin
    .from("official_events") as any)
    .select("*")
    .order("scheduled_at", { ascending: false });

  const allEvents: OfficialEvent[] = events || [];

  // 3. Fetch all active tickets with attendee profiles
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

  return (
    <ArtistDashboardClient
      profile={profile}
      initialEvents={allEvents}
      initialTickets={allTickets}
    />
  );
}
