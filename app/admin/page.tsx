import React from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const revalidate = 0; // Disable static caching so admin stats load fresh on every view

export default async function AdminDashboardPage() {
  // Fetch profiles stats securely
  const { data: profiles } = await (supabaseAdmin
    .from("profiles") as any)
    .select("account_status, no_show_strikes");

  // Fetch beacons stats securely
  const { count: activeBeacons } = await (supabaseAdmin
    .from("beacons") as any)
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const totalProfiles = profiles || [];
  const activeUsers = totalProfiles.filter((p: any) => p.account_status === "approved").length;
  const pendingVetting = totalProfiles.filter((p: any) => p.account_status === "pending_vetting").length;
  const ghostStrikesSum = totalProfiles.reduce((sum: number, p: any) => sum + (p.no_show_strikes || 0), 0);

  const stats = [
    {
      title: "ACTIVE USERS",
      value: activeUsers,
      desc: "Vetted members with platform access.",
      glyph: "👤",
    },
    {
      title: "PENDING VETTING",
      value: pendingVetting,
      desc: "Applicants awaiting manual review.",
      glyph: "⏳",
    },
    {
      title: "ACTIVE BROADCASTS",
      value: activeBeacons || 0,
      desc: "Live matching beacons broadcasted.",
      glyph: "📡",
    },
    {
      title: "GHOST STRIKES",
      value: ghostStrikesSum,
      desc: "Flake warnings recorded globally.",
      glyph: "👻",
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {/* Overview page header */}
      <div className="nokia-panel-sunken" style={{ padding: "16px", marginBottom: "24px" }}>
        <h1 className="font-pixel text-accent" style={{ fontSize: "14px", margin: 0, letterSpacing: "0.08em" }}>
          ▣ MODERATION COMMAND SYSTEM v1.0
        </h1>
        <p className="font-mono text-muted" style={{ fontSize: "11px", margin: "4px 0 0 0" }}>
          High-level operations overview and system telemetry for the Solo-No-More platform.
        </p>
      </div>

      {/* Grid of stats cards */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {stats.map(({ title, value, desc, glyph }) => (
          <div
            key={title}
            className="nokia-panel"
            style={{
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
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
          </div>
        ))}
      </section>

      {/* Operational guidelines */}
      <section className="nokia-panel-sunken" style={{ padding: "16px" }}>
        <h3 className="font-pixel text-accent" style={{ fontSize: "9px", margin: "0 0 8px 0" }}>
          ▶ VETTING & MODERATION MANUAL
        </h3>
        <p className="font-mono text-muted" style={{ fontSize: "11px", margin: 0, lineHeight: "1.5" }}>
          Use the User Vetting pane to evaluate applicant details. Approved users immediately receive Lobby access. 
          When evaluating ghost warnings, users with 1 strike render as "Flake Risks". Users with 2 strikes are automatically 
          suspended and locked out. You can reset strikes using the admin control actions in the vetting control board.
        </p>
      </section>
    </div>
  );
}
