import React from "react";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  Users,
  ClipboardList,
  Clock,
  CreditCard,
  Radio,
  Calendar,
  Compass,
  DollarSign,
  Ticket,
  ArrowRight,
  Activity,
  Sparkles,
  Award,
  AlertTriangle,
} from "lucide-react";
import AdminOverviewClient, { ActivityItem } from "./AdminOverviewClient";

export const revalidate = 0; // Fresh stats on every admin view

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "recently";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default async function AdminDashboardPage() {
  // 1. Fetch user profiles
  const { data: profiles } = await (supabaseAdmin
    .from("profiles") as any)
    .select("id, full_name, account_status, no_show_strikes, subscription_tier, created_at");

  // 2. Fetch beacons stats & recent broadcasts
  const [{ count: totalBeacons }, { data: recentBeaconsRaw }] = await Promise.all([
    (supabaseAdmin.from("beacons") as any).select("*", { count: "exact", head: true }),
    (supabaseAdmin.from("beacons") as any)
      .select("id, title, status, created_at, host_id, profiles:host_id(full_name)")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  // 3. Fetch official events count
  const { count: totalEvents } = await (supabaseAdmin
    .from("official_events") as any)
    .select("*", { count: "exact", head: true });

  // 4. Fetch payment submissions & calculate Total Revenue
  let pendingPayments = 0;
  let totalRevenue = 0;
  let recentPaymentsRaw: any[] = [];
  try {
    const [pendingRes, approvedRes, recentPayRes] = await Promise.all([
      (supabaseAdmin.from("payment_submissions") as any)
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      (supabaseAdmin.from("payment_submissions") as any)
        .select("amount_pkr")
        .eq("status", "approved"),
      (supabaseAdmin.from("payment_submissions") as any)
        .select("id, user_id, amount_pkr, tier_requested, payment_method, status, created_at, profiles:user_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);
    pendingPayments = pendingRes.count || 0;
    totalRevenue = (approvedRes.data || []).reduce(
      (sum: number, p: any) => sum + (Number(p.amount_pkr) || 0),
      0
    );
    recentPaymentsRaw = recentPayRes.data || [];
  } catch {}

  // 5. Fetch Total Bookings (event_tickets) & recent ticket claims
  const [{ count: totalBookings }, { data: recentBookingsRaw }] = await Promise.all([
    (supabaseAdmin.from("event_tickets") as any).select("*", { count: "exact", head: true }),
    (supabaseAdmin.from("event_tickets") as any)
      .select("id, ticket_status, created_at, profiles:user_id(full_name), official_events:event_id(title)")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  // 6. Fetch pending member/partner applications count & recent applications
  let pendingApplications = 0;
  let recentApplicationsRaw: any[] = [];
  try {
    const { getAllApplicationsAction } = await import("@/app/actions/member-applications");
    const apps = await getAllApplicationsAction();
    pendingApplications = apps.filter(
      (a) => a.status === "pending_admin_approval" || a.status === "payment_submitted"
    ).length;
    recentApplicationsRaw = apps.slice(0, 6);
  } catch {}

  // Derive counts from profiles
  const totalProfiles = profiles || [];
  const activeMembers = totalProfiles.filter((p: any) => p.account_status === "approved").length;
  const pendingVetting = totalProfiles.filter((p: any) => p.account_status === "pending_vetting").length;
  // Active Explorer (Guest User) = users with none, guest, or free tier
  const activeExplorers = totalProfiles.filter(
    (p: any) => !p.subscription_tier || p.subscription_tier === "none" || p.subscription_tier === "guest" || p.subscription_tier === "free"
  ).length;

  const hasUrgentAction = pendingApplications > 0 || pendingPayments > 0 || pendingVetting > 0;

  // ── Construct Unified Recent Activity Stream ──────────────────────────
  const activityList: ActivityItem[] = [];

  // Beacon activities
  (recentBeaconsRaw || []).forEach((b: any) => {
    activityList.push({
      id: `beacon-${b.id}`,
      type: "beacon",
      title: `Beacon Broadcast: "${b.title}"`,
      subtitle: `Hangout beacon status: ${b.status}`,
      userName: b.profiles?.full_name || "Community Member",
      status: b.status || "active",
      timestamp: formatRelativeTime(b.created_at),
      href: "/admin/beacons",
    });
  });

  // Payment activities
  (recentPaymentsRaw || []).forEach((p: any) => {
    activityList.push({
      id: `pay-${p.id}`,
      type: "payment",
      title: `Payment Receipt: PKR ${Number(p.amount_pkr || 0).toLocaleString()} (${p.tier_requested?.toUpperCase() || "SUB"})`,
      subtitle: `via ${p.payment_method?.toUpperCase() || "RAAST"}`,
      userName: p.profiles?.full_name || "Member Applicant",
      status: p.status || "pending",
      timestamp: formatRelativeTime(p.created_at),
      href: "/admin/payments",
    });
  });

  // Application activities
  (recentApplicationsRaw || []).forEach((a: any) => {
    activityList.push({
      id: `app-${a.id}`,
      type: "application",
      title: `Application: ${a.type === "partner" ? "Partner Hub" : "Member Vetting"} (${a.city || "Pakistan"})`,
      subtitle: `Package: ${a.package || "Solo Vibe"}`,
      userName: a.fullName || a.email || "Applicant",
      status: a.status || "pending",
      timestamp: formatRelativeTime(a.createdAt),
      href: "/admin/applications",
    });
  });

  // Booking activities
  (recentBookingsRaw || []).forEach((t: any) => {
    activityList.push({
      id: `booking-${t.id}`,
      type: "booking",
      title: `Ticket Booked: "${t.official_events?.title || "Community Event"}"`,
      subtitle: `Ticket status: ${t.ticket_status}`,
      userName: t.profiles?.full_name || "Guest / Member",
      status: t.ticket_status || "confirmed",
      timestamp: formatRelativeTime(t.created_at),
      href: "/admin/events",
    });
  });

  // Sort activities chronologically (newest first)
  activityList.sort((a, b) => (a.timestamp.includes("now") ? -1 : 1));

  // ── Stat Cards Configuration (Including User's Requested 5 Cards) ──────
  const primaryStats = [
    {
      title: "Total Beacon",
      value: totalBeacons || 0,
      desc: "Live & historical meetup broadcasts",
      icon: Radio,
      href: "/admin/beacons",
      highlight: true,
      color: "#FF6F26",
    },
    {
      title: "Total Revenue",
      value: `PKR ${totalRevenue.toLocaleString()}`,
      desc: "Approved Raast & membership receipts",
      icon: DollarSign,
      href: "/admin/payments",
      highlight: true,
      color: "#27C93F",
    },
    {
      title: "Total Bookings",
      value: totalBookings || 0,
      desc: "Official event & hangout passes",
      icon: Ticket,
      href: "/admin/bookings",
      highlight: true,
      color: "#FFA05C",
    },
    {
      title: "Active Explorer (Guest)",
      value: activeExplorers,
      desc: "Guest users exploring community radar",
      icon: Compass,
      href: "/admin/users?filter=guest",
      highlight: true,
      color: "#38BDF8",
    },
    {
      title: "Pending Applications",
      value: pendingApplications,
      desc: "Awaiting vetting & payment approval",
      icon: ClipboardList,
      href: "/admin/applications",
      actionNeeded: pendingApplications > 0,
      highlight: true,
      color: "#FF9500",
    },
    {
      title: "Active Members",
      value: activeMembers,
      desc: "Approved members with full lobby access",
      icon: Users,
      href: "/admin/users",
      color: "#FF8A3D",
    },
    {
      title: "Pending Payments",
      value: pendingPayments,
      desc: "Raast / SadaPay receipts to clear",
      icon: CreditCard,
      href: "/admin/payments",
      actionNeeded: pendingPayments > 0,
      color: "#FF9500",
    },
    {
      title: "Official Events",
      value: totalEvents || 0,
      desc: "Platform gigs & partner gatherings",
      icon: Calendar,
      href: "/admin/events",
      color: "#27C93F",
    },
  ];

  return (
    <div style={{ maxWidth: "1600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* ── Subtitle Context Bar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 900, color: "#FFFFFF", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            Operational Overview &amp; Telemetry
          </h2>
          <p style={{ fontSize: "12.5px", color: "rgba(255, 255, 255, 0.6)", margin: 0 }}>
            Live platform vitals, key financial counters, and active community telemetry
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(39, 201, 63, 0.12)",
              border: "1px solid rgba(39, 201, 63, 0.28)",
              color: "#27C93F",
              padding: "4px 12px",
              borderRadius: "8px",
              fontWeight: 800,
              fontSize: "11px",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#27C93F] animate-pulse" />
            LIVE TELEMETRY
          </span>
        </div>
      </div>

      {/* ── Urgent Operations Action Banner ── */}
      {hasUrgentAction && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(255, 149, 0, 0.12) 0%, rgba(255, 90, 31, 0.08) 100%)",
            border: "1px solid rgba(255, 149, 0, 0.35)",
            borderRadius: "20px",
            padding: "18px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            boxShadow: "0 8px 30px rgba(255, 149, 0, 0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #FF9500, #FF5A1F)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 14px rgba(255, 149, 0, 0.4)",
              }}
            >
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF", marginBottom: "2px" }}>
                Priority Action Queue Awaiting Attention
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.75)" }}>
                {pendingApplications > 0 && `${pendingApplications} new application(s) in review`}
                {pendingApplications > 0 && pendingPayments > 0 && " · "}
                {pendingPayments > 0 && `${pendingPayments} payment receipt(s) to verify`}
                {(pendingApplications > 0 || pendingPayments > 0) && pendingVetting > 0 && " · "}
                {pendingVetting > 0 && `${pendingVetting} user(s) pending vetting`}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {pendingApplications > 0 && (
              <Link
                href="/admin/applications"
                style={{
                  background: "linear-gradient(135deg, #FF6F26, #FF5A1F)",
                  color: "#FFFFFF",
                  fontSize: "12px",
                  fontWeight: 800,
                  padding: "8px 16px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 14px rgba(255, 90, 31, 0.4)",
                }}
                className="hover:scale-105 transition-transform"
              >
                <span>Review Applications</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
            {pendingPayments > 0 && (
              <Link
                href="/admin/payments"
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#FFFFFF",
                  fontSize: "12px",
                  fontWeight: 800,
                  padding: "8px 16px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                className="hover:bg-white/15 transition-colors"
              >
                <span>Verify Payments</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Key Metrics Grid (Featuring User's 5 Stats: Total Beacon, Revenue, Bookings, Active Explorer, Pending Apps) ── */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
        {primaryStats.map(({ title, value, desc, icon: Icon, href, actionNeeded, highlight, color }) => (
          <Link
            key={title}
            href={href}
            style={{
              background: highlight
                ? "linear-gradient(160deg, rgba(255, 111, 38, 0.12) 0%, rgba(18, 11, 26, 0.88) 100%)"
                : "linear-gradient(160deg, rgba(18, 11, 26, 0.8) 0%, rgba(8, 4, 12, 0.9) 100%)",
              border: highlight
                ? "1px solid rgba(255, 111, 38, 0.4)"
                : actionNeeded
                ? "1px solid rgba(255, 149, 0, 0.4)"
                : "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "20px",
              padding: "20px",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "14px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
              transition: "all 0.15s ease",
            }}
            className="hover:border-white/25 hover:translate-y-[-2px]"
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255, 255, 255, 0.7)" }}>
                {title}
              </span>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: highlight
                    ? "linear-gradient(135deg, #FF6F26, #FF4400)"
                    : "rgba(255, 255, 255, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  boxShadow: highlight ? "0 4px 14px rgba(255, 111, 38, 0.4)" : "none",
                }}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "4px" }}>
                <span
                  style={{
                    fontSize: typeof value === "string" && value.length > 8 ? "24px" : "32px",
                    fontWeight: 900,
                    color: color || "#FFFFFF",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {value}
                </span>
                {actionNeeded && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      background: "rgba(255, 149, 0, 0.2)",
                      border: "1px solid rgba(255, 149, 0, 0.4)",
                      color: "#FF9500",
                      padding: "2px 7px",
                      borderRadius: "6px",
                    }}
                  >
                    Action Needed
                  </span>
                )}
              </div>
              <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.55)", margin: 0, lineHeight: 1.4 }}>
                {desc}
              </p>
            </div>

            <div
              style={{
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                paddingTop: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "11px",
                fontWeight: 700,
                color: "#FF8A3D",
              }}
            >
              <span>Inspect Department</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </section>

      {/* ── Quick Actions Bar + Recent Activity Feed (Replacing Guardrails Section) ── */}
      <AdminOverviewClient recentActivities={activityList} />
    </div>
  );
}
