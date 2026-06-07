"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "./SignOutButton";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

const navItems = [
  { label: "LOBBY",   short: "LOBBY",   icon: "◈", href: "/dashboard" },
  { label: "HOSTING", short: "HOST",    icon: "◉", href: "/dashboard/manage" },
  { label: "EVENTS",  short: "EVNTS",   icon: "★", href: "/dashboard/events" },
  { label: "NETWORK", short: "NET",     icon: "▣", href: "/dashboard/network" },
  { label: "MY VIBE", short: "VIBE",    icon: "♦", href: "/profile/me" },
  { label: "UPGRADE", short: "UPG",     icon: "▲", href: "/dashboard/upgrade" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isPartner, setIsPartner] = useState(false);

  useEffect(() => {
    async function checkPartnerStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await (supabase
          .from("profiles") as any)
          .select("is_partner")
          .eq("id", user.id)
          .maybeSingle();
        
        if (profile?.is_partner) {
          setIsPartner(true);
        }
      }
    }
    checkPartnerStatus();
  }, []);

  const dynamicNavItems = isPartner
    ? [
        { label: "LOBBY",   short: "LOBBY",   icon: "◈", href: "/dashboard" },
        { label: "HOSTING", short: "HOST",    icon: "◉", href: "/dashboard/manage" },
        { label: "EVENTS",  short: "EVNTS",   icon: "★", href: "/dashboard/events" },
        { label: "NETWORK", short: "NET",     icon: "▣", href: "/dashboard/network" },
        { label: "MY VIBE", short: "VIBE",    icon: "♦", href: "/profile/me" },
        { label: "PARTNER", short: "PARTN",   icon: "▤", href: "/dashboard/partner" },
      ]
    : navItems;

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-base)" }}>

      {/* ── Top Status Bar ──────────────────────────────────────────────────── */}
      <div className="nokia-statusbar" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="font-pixel" style={{ fontSize: "8px", color: "var(--statusbar-text)" }}>◈ SNM</span>
          <span style={{ fontSize: "8px", opacity: 0.6 }}>VIBE LOBBY</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <NotificationBell />
          <ThemeToggle />
          <SignOutButton variant="statusbar" />
          <span className="font-lcd" style={{ fontSize: "14px", letterSpacing: "0.06em", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            📶 ▰▰▰▰▱  [▰▰▰▰]
          </span>
        </div>
      </div>

      {/* ── Desktop + Content ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── Desktop Sidebar ───────────────────────────────────────────────── */}
        <aside
          className="nokia-panel"
          style={{
            display: "none",
            width: "200px",
            flexShrink: 0,
            flexDirection: "column",
            justifyContent: "space-between",
            borderTop: "none",
            borderLeft: "none",
            borderBottom: "none",
            borderRadius: 0,
            boxShadow: "inset -2px 0 0 var(--bevel-dark), 3px 0 0 var(--bevel-darkest)",
          }}
          id="desktop-sidebar"
        >
          {/* Brand */}
          <div>
            <div className="nokia-panel-sunken" style={{
              margin: "12px",
              padding: "10px 12px",
              textAlign: "center",
            }}>
              <div className="font-pixel" style={{ fontSize: "9px", color: "var(--accent-primary)", letterSpacing: "0.08em" }}>
                SOLO-NO-MORE
              </div>
              <div className="font-lcd" style={{ fontSize: "16px", color: "var(--accent-primary)", marginTop: "2px" }}>
                {">> ONLINE <<"}
              </div>
            </div>

            {/* Nav items */}
            <nav>
              {dynamicNavItems.map(({ label, icon, href }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className="nokia-menu-item"
                    style={{
                      background: active ? "var(--accent-primary)" : undefined,
                      color: active ? "white" : undefined,
                      fontFamily: "var(--font-pixel)",
                      fontSize: "7px",
                      letterSpacing: "0.06em",
                      textDecoration: "none",
                    }}
                  >
                    <span style={{ fontSize: "12px" }}>{icon}</span>
                    {label}
                    {active && <span style={{ marginLeft: "auto", fontSize: "10px" }}>◄</span>}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom status */}
          <div style={{ padding: "12px" }}>
            <div className="nokia-badge nokia-badge-success" style={{ width: "100%", textAlign: "center", marginBottom: "8px", display: "block" }}>
              ● VERIFIED
            </div>
            <SignOutButton />
          </div>
        </aside>

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        <main style={{ flex: 1, overflowY: "auto", paddingBottom: "80px" }}>
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation — Nokia Icon Grid style ─────────────── */}
      <nav
        className="nokia-panel"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          display: "grid",
          gridTemplateColumns: `repeat(${dynamicNavItems.length}, 1fr)`,
          gap: "0",
          borderLeft: "none",
          borderRight: "none",
          borderBottom: "none",
          borderRadius: 0,
          boxShadow: "inset 0 2px 0 var(--bevel-light), 0 -3px 0 var(--bevel-darkest)",
          padding: "4px",
        }}
      >
        {dynamicNavItems.map(({ short, icon, href }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className="nokia-icon-cell"
              style={{
                background: active ? "var(--accent-primary)" : undefined,
                color: active ? "white" : undefined,
                borderColor: active ? "var(--border-strong)" : "transparent",
                boxShadow: active
                  ? "inset 1px 1px 0 rgba(255,255,255,0.2), inset -1px -1px 0 rgba(0,0,0,0.3), 1px 1px 0 var(--bevel-darkest)"
                  : "none",
                border: active ? "2px solid var(--border-strong)" : "2px solid transparent",
                textDecoration: "none",
                padding: "8px 2px",
              }}
            >
              <span style={{ fontSize: "16px" }}>{icon}</span>
              <span>{short}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Inline style to show sidebar on desktop ────────────────────────── */}
      <style>{`
        @media (min-width: 768px) {
          #desktop-sidebar { display: flex !important; }
          main { padding-bottom: 0 !important; }
        }
      `}</style>
    </div>
  );
}
