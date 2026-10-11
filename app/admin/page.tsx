import React from "react";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const revalidate = 0; // Disable static caching so admin stats load fresh on every view

export default async function AdminDashboardPage() {
  // Fetch profiles stats securely
  const { data: profiles } = await (supabaseAdmin
    .from("profiles") as any)
    .select("account_status, no_show_strikes, subscription_tier");

  // Fetch beacons stats securely
  const { count: activeBeacons } = await (supabaseAdmin
    .from("beacons") as any)
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // Fetch official events count
  const { count: totalEvents } = await (supabaseAdmin
    .from("official_events") as any)
    .select("*", { count: "exact", head: true });

  // Fetch payment submissions count
  let pendingPayments = 0;
  try {
    const { count } = await (supabaseAdmin
      .from("payment_submissions") as any)
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    pendingPayments = count || 0;
  } catch {}

  const totalProfiles = profiles || [];
  const activeUsers = totalProfiles.filter((p: any) => p.account_status === "approved").length;
  const pendingVetting = totalProfiles.filter((p: any) => p.account_status === "pending_vetting").length;
  const ghostStrikesSum = totalProfiles.reduce((sum: number, p: any) => sum + (p.no_show_strikes || 0), 0);
  const paidMembers = totalProfiles.filter((p: any) => p.subscription_tier === "member" || p.subscription_tier === "family").length;

  const stats = [
    {
      title: "ACTIVE MEMBERS",
      value: activeUsers,
      desc: "Vetted members with platform access.",
      glyph: "👤",
      href: "/admin/users",
    },
    {
      title: "PENDING VETTING",
      value: pendingVetting,
      desc: "Applicants awaiting manual review.",
      glyph: "⏳",
      href: "/admin/users",
      badge: pendingVetting > 0 ? "ACTION REQ" : undefined,
    },
    {
      title: "PENDING PAYMENTS",
      value: pendingPayments,
      desc: "Raast/SadaPay verification requests.",
      glyph: "💳",
      href: "/admin/payments",
      badge: pendingPayments > 0 ? "ACTION REQ" : undefined,
    },
    {
      title: "PAID MEMBERS",
      value: paidMembers,
      desc: "Active Member & Family subscribers.",
      glyph: "★",
      href: "/admin/payments",
    },
    {
      title: "ACTIVE BEACONS",
      value: activeBeacons || 0,
      desc: "Live matching beacons broadcasted.",
      glyph: "📡",
      href: "/admin/beacons",
    },
    {
      title: "OFFICIAL EVENTS",
      value: totalEvents || 0,
      desc: "Curated community & rave events.",
      glyph: "🎟",
      href: "/admin/events",
    },
    {
      title: "GHOST STRIKES",
      value: ghostStrikesSum,
      desc: "Flake warnings recorded globally.",
      glyph: "👻",
      href: "/admin/logs",
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {/* Overview page header */}
      <div className="nokia-panel-sunken" style={{ padding: "16px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h1 className="font-pixel text-accent" style={{ fontSize: "14px", margin: 0, letterSpacing: "0.08em" }}>
              ▣ SOLO-NO-MORE MASTER COMMAND CENTER
            </h1>
            <p className="font-mono text-muted" style={{ fontSize: "11px", margin: "4px 0 0 0" }}>
              Operations, vetting, payments, and platform telemetry across Karachi, Lahore & Islamabad.
            </p>
          </div>
          <div className="nokia-badge nokia-badge-primary" style={{ fontSize: "9px" }}>
            ONLINE & CONNECTED
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <section style={{ marginBottom: "24px" }}>
        <h3 className="font-pixel text-muted" style={{ fontSize: "8px", marginBottom: "10px" }}>
          QUICK ACCESS DEPARTMENTS
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
          {[
            { label: "◈ USER VETTING", href: "/admin/users", count: pendingVetting, primary: true },
            { label: "💳 PAYMENTS", href: "/admin/payments", count: pendingPayments, warning: true },
            { label: "📡 BEACONS", href: "/admin/beacons", count: activeBeacons || 0 },
            { label: "🎟 EVENTS", href: "/admin/events", count: totalEvents || 0 },
            { label: "📋 AUDIT LOGS", href: "/admin/logs" },
          ].map((btn) => (
            <Link
              key={btn.href}
              href={btn.href}
              className={`nokia-btn font-pixel ${btn.primary ? "nokia-btn-primary" : btn.warning ? "nokia-btn-warning" : ""}`}
              style={{
                padding: "12px 10px",
                fontSize: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                textDecoration: "none",
              }}
            >
              <span>{btn.label}</span>
              {btn.count !== undefined && (
                <span className="font-lcd" style={{ fontSize: "14px" }}>{btn.count}</span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Grid of stats cards */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {stats.map(({ title, value, desc, glyph, href, badge }) => (
          <Link
            key={title}
            href={href}
            className="nokia-panel"
            style={{
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              textDecoration: "none",
              color: "inherit",
              border: badge ? "2px solid var(--accent-warning)" : undefined,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="font-pixel text-muted" style={{ fontSize: "7px" }}>{title}</span>
              <span style={{ fontSize: "16px" }}>{glyph}</span>
            </div>
            
            {/* Telemetry LCD display */}
            <div className="nokia-panel-sunken text-accent font-lcd" style={{ fontSize: "28px", padding: "4px 10px", display: "inline-block", alignSelf: "flex-start", lineHeight: 1 }}>
              {value}
            </div>
            
            <p className="font-mono text-muted" style={{ fontSize: "10px", margin: "4px 0 0 0" }}>
              {desc}
            </p>
          </Link>
        ))}
      </section>

      {/* Operational guidelines */}
      <section className="nokia-panel-sunken" style={{ padding: "16px" }}>
        <h3 className="font-pixel text-accent" style={{ fontSize: "9px", margin: "0 0 8px 0" }}>
          ▶ COMMAND CENTER PROTOCOLS
        </h3>
        <p className="font-mono text-muted" style={{ fontSize: "11px", margin: 0, lineHeight: "1.6" }}>
          1. <strong>User Vetting:</strong> Evaluate applicants before approving. Approved members gain immediate access.<br />
          2. <strong>Payments:</strong> Match submitted Transaction IDs against your Raast/Meezan/SadaPay app notifications and click approve to activate their tier.<br />
          3. <strong>Beacons:</strong> Past hangouts auto-expire 3 hours after scheduled time. You can force-cancel inappropriate hangouts with one click.
        </p>
      </section>
    </div>
  );
}
