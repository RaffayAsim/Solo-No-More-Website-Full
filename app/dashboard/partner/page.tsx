import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import PartnerDashboardClient from "./PartnerDashboardClient";
import type { Beacon } from "@/lib/supabase/types";

export const metadata = {
  title: "Partner command center — Solo-No-More",
  description: "Configure your business info and manage partner promotional broadcasts.",
};

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

export default async function PartnerDashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch the partner's profile
  const { data: profile } = await (supabaseAdmin
    .from("profiles") as any)
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_partner) {
    redirect("/dashboard");
  }

  // Fetch partner offers hosted by this user
  const { data: beacons } = await (supabaseAdmin
    .from("beacons") as any)
    .select("*")
    .eq("host_id", user.id)
    .order("created_at", { ascending: false });

  const partnerOffers: Beacon[] = beacons || [];

  return (
    <PartnerDashboardClient
      profile={profile}
      initialOffers={partnerOffers}
    />
  );
}
