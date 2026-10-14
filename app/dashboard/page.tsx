import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AccountStatus, OfficialEvent, Profile } from "@/lib/supabase/types";
import SignOutButton from "./SignOutButton";
import ApprovedScreen from "./ApprovedScreen";
import { writeLazyTimeAlerts } from "@/app/actions/notifications";
import { autoExpireStaleBeacons } from "@/app/actions/beacons";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import { parseEventDescription } from "@/lib/event-metadata";

export const metadata = {
  title: "Dashboard — Solo-No-More",
  description: "Your Solo-No-More membership dashboard.",
};

// ─── Helper to read the Supabase session from cookies ───────────────────────
async function getSessionUser() {
  const result = await getSessionUserSecurely();
  if ("error" in result) return null;
  return { id: result.userId, email: result.email, user_metadata: result.user_metadata };
}

// ─── UI States ───────────────────────────────────────────────────────────────

function PendingVettingScreen({ name }: { name: string }) {
  const firstName = name ? name.split(" ")[0].toUpperCase() : "MEMBER";
  const steps = [
    { label: "APPLIED", done: true, icon: "✓" },
    { label: "VETTING", done: false, active: true, icon: "▌" },
    { label: "APPROVED", done: false, icon: "○" },
  ];
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div className="nokia-panel" style={{ padding: 0 }}>
          {/* Title bar */}
          <div style={{ background: "var(--accent-warning)", color: "#111", padding: "8px 16px", borderBottom: "2px solid var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="font-pixel" style={{ fontSize: "8px", letterSpacing: "0.1em" }}>⧖ APPLICATION REVIEW</span>
            <span className="font-lcd" style={{ fontSize: "14px" }}>▌▌</span>
          </div>

          <div style={{ padding: "20px" }}>
            {/* LCD name display */}
            <div className="nokia-lcd" style={{ width: "100%", textAlign: "center", fontSize: "16px", marginBottom: "16px" }}>
              HEY {firstName}!
            </div>

            <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.5", marginBottom: "16px", textAlign: "center" }}>
              Your application is under review. Our team is verifying your vibe. We&apos;ll notify you once approved.
            </p>

            {/* Nokia step progress */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px", marginBottom: "16px" }}>
              {steps.map(({ label, done, active, icon }) => (
                <div
                  key={label}
                  className="nokia-panel-sunken"
                  style={{
                    padding: "10px 6px",
                    textAlign: "center",
                    borderColor: done ? "var(--accent-success)" : active ? "var(--accent-warning)" : undefined,
                  }}
                >
                  <div className="font-lcd" style={{ fontSize: "20px", color: done ? "var(--accent-success)" : active ? "var(--accent-warning)" : "var(--text-muted)" }}>
                    {icon}
                  </div>
                  <div className="font-pixel" style={{ fontSize: "6px", color: "var(--text-muted)", marginTop: "4px" }}>{label}</div>
                </div>
              ))}
            </div>

            <div className="nokia-divider" />
            <SignOutButton />
          </div>
        </div>
      </div>
    </main>
  );
}

function SuspendedScreen() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div className="nokia-panel" style={{ padding: 0 }}>
          <div style={{ background: "var(--accent-danger)", color: "white", padding: "8px 16px", borderBottom: "2px solid var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="font-pixel" style={{ fontSize: "8px", letterSpacing: "0.1em" }}>✕ ACCOUNT SUSPENDED</span>
            <span className="font-lcd" style={{ fontSize: "14px" }}>■</span>
          </div>
          <div style={{ padding: "20px" }}>
            <div className="nokia-lcd" style={{ width: "100%", textAlign: "center", fontSize: "14px", marginBottom: "16px", borderColor: "var(--accent-danger)", color: "var(--accent-danger)" }}>
              ACCESS DENIED
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.5", marginBottom: "16px", textAlign: "center" }}>
              Your account has been suspended due to a violation of our community standards. If you believe this is a mistake, please contact support.
            </p>
            <a
              href="mailto:support@solo-no-more.com"
              className="nokia-btn"
              style={{ display: "flex", width: "100%", fontSize: "8px", marginBottom: "8px", textDecoration: "none", justifyContent: "center" }}
            >
              ✉ CONTACT SUPPORT
            </a>
            <div className="nokia-divider" />
            <SignOutButton />
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Main Dashboard Server Component ─────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ city?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // 1. Verify session
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
    return null;
  }

  // 2. Fetch full profile and status
  const { data: profile } = (await (supabaseAdmin
    .from("profiles") as any)
    .select("id, full_name, phone, bio, social_link, city, avatar_icon, subscription_tier, account_status, is_partner, vibe_tags, is_active_seeker")
    .eq("id", user.id)
    .maybeSingle()) as { data: Profile | null; error: unknown };

  const status = (profile?.account_status ?? "pending_vetting") as AccountStatus;
  const fullName = profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? "";
  const selectedCity = params.city || profile?.city || "Karachi";

  // 3. Render based on account_status
  if (status === "approved") {
    // Parallel fetch: friendships, user applications with beacon info, official events, user tickets, and user's hosted beacons
    const [friendshipsRes, userAppsRes, officialEventsRes, userTicketsRes, userHostedBeaconsRes] = await Promise.all([
      (supabaseAdmin.from("friends") as any)
        .select("user_id_1, user_id_2")
        .eq("status", "accepted")
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`),
      (supabaseAdmin.from("beacon_applications") as any)
        .select(`
          id,
          beacon_id,
          applicant_id,
          status,
          created_at,
          updated_at,
          beacons:beacon_id (
            id,
            title,
            description,
            category,
            location_name,
            scheduled_at,
            status,
            filled_slots,
            total_slots,
            google_maps_url,
            visibility_mode,
            created_at,
            host_id,
            profiles:host_id (
              id,
              full_name,
              avatar_icon
            )
          )
        `)
        .eq("applicant_id", user.id)
        .order("created_at", { ascending: false }),
      (supabaseAdmin.from("official_events") as any)
        .select("*")
        .order("scheduled_at", { ascending: true }),
      (supabaseAdmin.from("event_tickets") as any)
        .select(`
          id,
          event_id,
          ticket_status,
          created_at,
          official_events (
            id,
            title,
            description,
            venue_name,
            scheduled_at,
            price,
            event_type
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      (supabaseAdmin.from("beacons") as any)
        .select(`
          id,
          title,
          description,
          category,
          location_name,
          scheduled_at,
          status,
          filled_slots,
          total_slots,
          google_maps_url,
          visibility_mode,
          created_at
        `)
        .eq("host_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    const friendships = friendshipsRes.data || [];
    const userApps = userAppsRes.data || [];
    const allOfficialEvents: OfficialEvent[] = officialEventsRes.data || [];
    // Only verified & published events are showcased to members on the dashboard
    const officialEvents: OfficialEvent[] = allOfficialEvents.filter((ev) => {
      try {
        const { metadata } = parseEventDescription(ev.description);
        return metadata.status !== "pending_review" && metadata.status !== "draft";
      } catch {
        return true;
      }
    });
    const userTickets = userTicketsRes.data || [];
    const userHostedBeacons = userHostedBeaconsRes.data || [];

    const friendIds = friendships.map((f: any) =>
      f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1
    );

    // Fetch live hangout beacons
    const filterString = `visibility_mode.eq.stranger,host_id.eq.${user.id}${
      friendIds.length > 0 ? `,host_id.in.(${friendIds.join(",")})` : ""
    }`;

    const { data: dbBeacons } = await (supabaseAdmin
      .from("beacons") as any)
      .select(`
        *,
        profiles:host_id (
          full_name,
          avatar_icon
        )
      `)
      .eq("status", "active")
      .eq("city", selectedCity)
      .or(filterString)
      .order("is_partner_offer", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    const appsMap = new Map(userApps.map((app: any) => [app.beacon_id, app.status]));

    const activeBeacons = (dbBeacons || [])
      .filter((beacon: any) => {
        if (!beacon.scheduled_at) return true;
        const scheduledTime = new Date(beacon.scheduled_at).getTime();
        const cutoffTime = Date.now() - 15 * 60 * 1000;
        return scheduledTime >= cutoffTime;
      })
      .map((beacon: any) => ({
        ...beacon,
        application_status: appsMap.get(beacon.id) || "none",
      }))
      .sort((a: any, b: any) => {
        // Partner/Restaurant promo offers are always pinned to the top of the city's beacons
        const aPartner = a.is_partner_offer ? 1 : 0;
        const bPartner = b.is_partner_offer ? 1 : 0;
        if (aPartner !== bPartner) return bPartner - aPartner;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

    // Fire lazy time-based alerts & auto-expire stale beacons (non-blocking)
    writeLazyTimeAlerts(user.id).catch(() => {});
    autoExpireStaleBeacons().catch(() => {});

    return (
      <ApprovedScreen
        name={fullName}
        currentUserId={user.id}
        initialBeacons={activeBeacons}
        selectedCity={selectedCity}
        isPartner={profile?.is_partner || false}
        profile={profile}
        userEmail={user.email || ""}
        officialEvents={officialEvents}
        userTickets={userTickets}
        userApplications={userApps}
        userHostedBeacons={userHostedBeacons}
      />
    );
  }

  if (status === "suspended") {
    return <SuspendedScreen />;
  }

  // Default: pending_vetting
  return <PendingVettingScreen name={fullName} />;
}
