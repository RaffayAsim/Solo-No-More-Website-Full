import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import EventsBoardClient from "./EventsBoardClient";
import type { OfficialEvent } from "@/lib/supabase/types";

/**
 * Securely get the logged in user ID via server cookie
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

export default async function EventsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  // 1. Fetch user subscription tier
  const { data: profile } = await (supabaseAdmin
    .from("profiles") as any)
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  const currentTier = profile?.subscription_tier || "none";

  // 2. Fetch all official events ordered by date
  const { data: events } = await (supabaseAdmin
    .from("official_events") as any)
    .select("*")
    .order("scheduled_at", { ascending: true });

  const officialEvents: OfficialEvent[] = events || [];

  // 3. Fetch claimed tickets for this user
  const { data: tickets } = await (supabaseAdmin
    .from("event_tickets") as any)
    .select("event_id")
    .eq("user_id", user.id)
    .eq("ticket_status", "active");

  const claimedEventIds = (tickets || []).map((t: any) => t.event_id as string);

  return (
    <EventsBoardClient
      events={officialEvents}
      currentTier={currentTier}
      claimedEventIds={claimedEventIds}
    />
  );
}
