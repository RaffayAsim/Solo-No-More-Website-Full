import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AccountStatus } from "@/lib/supabase/types";
import SignOutButton from "./SignOutButton";
import ApprovedScreen from "./ApprovedScreen";
import { writeLazyTimeAlerts } from "@/app/actions/notifications";

export const metadata = {
  title: "Dashboard — Solo-No-More",
  description: "Your Solo-No-More membership dashboard.",
};

// ─── Helper to read the Supabase session from cookies ───────────────────────
async function getSessionUser() {
  const cookieStore = await cookies();

  // Supabase stores its session JWT in this cookie
  const sessionCookie = cookieStore.get(
    "sb-dmmgzpiskyocdsxamrgf-auth-token"
  );

  if (!sessionCookie?.value) return null;

  try {
    // The cookie value is a base64url-encoded JSON array: [access_token, ...]
    // We decode it to get the access_token for getUser()
    let raw = sessionCookie.value;

    // Supabase cookie may be URL-encoded
    if (raw.startsWith("base64-")) {
      raw = Buffer.from(raw.slice(7), "base64").toString("utf-8");
    }

    const parsed = JSON.parse(raw);
    const accessToken: string =
      Array.isArray(parsed) ? parsed[0] : parsed.access_token;

    if (!accessToken) return null;

    // Verify the JWT and get the user — uses service role client
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !data.user) return null;

    return data.user;
  } catch {
    return null;
  }
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

  // 1. Verify session (double-check beyond proxy optimistic check)
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
    return null; // TypeScript control-flow narrowing
  }

  // 2. Fetch profile from the database using service role (bypasses RLS)
  type ProfileRow = { full_name: string | null; account_status: string | null; city: string | null; is_partner: boolean | null };
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, account_status, city, is_partner")
    .eq("id", user.id)
    .maybeSingle() as { data: ProfileRow | null; error: unknown };

  const status = (profile?.account_status ?? "pending_vetting") as AccountStatus;
  const fullName = profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? "";
  const selectedCity = params.city || profile?.city || "Karachi";

  // 3. Render based on account_status
  if (status === "approved") {
    // Secure "Friend Mode" Beacons filter
    // 1. Fetch accepted friends
    const { data: friendships } = await (supabaseAdmin
      .from("friends") as any)
      .select("user_id_1, user_id_2")
      .eq("status", "accepted")
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

    const friendIds = (friendships || []).map((f: any) =>
      f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1
    );

    // 2. Fetch beacons using Postgres RLS bypass client securely
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
      .order("created_at", { ascending: false });

    // Fetch user's applications for these beacons
    const { data: userApps } = await (supabaseAdmin
      .from("beacon_applications") as any)
      .select("beacon_id, status")
      .eq("applicant_id", user.id);

    const appsMap = new Map((userApps || []).map((app: any) => [app.beacon_id, app.status]));

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
      }));

    // Fire lazy time-based alerts (non-blocking — best-effort)
    writeLazyTimeAlerts(user.id).catch(() => {});

    return (
      <ApprovedScreen
        name={fullName}
        currentUserId={user.id}
        initialBeacons={activeBeacons}
        selectedCity={selectedCity}
        isPartner={profile?.is_partner || false}
      />
    );
  }

  if (status === "suspended") {
    return <SuspendedScreen />;
  }

  // Default: pending_vetting (also handles 'rejected' gracefully)
  return <PendingVettingScreen name={fullName} />;
}

