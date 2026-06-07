"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "@/app/dashboard/SignOutButton";

export default function AdminSidebarClient() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "OVERVIEW",
      href: "/admin",
      icon: "▣",
    },
    {
      label: "USER VETTING",
      href: "/admin/users",
      icon: "◈",
    },
    {
      label: "OFFICIAL EVENTS",
      href: "/admin/events",
      icon: "★",
    },
    {
      label: "SYSTEM LOGS",
      href: "/admin/logs",
      icon: "▌",
    },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside 
        className="hidden md:flex w-64 flex-col justify-between p-6 shrink-0 relative z-30"
        style={{
          backgroundColor: "var(--bg-base)",
          borderRight: "2px solid var(--border-strong)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Brand Header */}
          <div className="nokia-panel-sunken" style={{ padding: "12px", textAlign: "center" }}>
            <span className="font-pixel text-accent" style={{ fontSize: "9px", display: "block" }}>
              ◈ TEAM PANEL
            </span>
            <span className="font-lcd text-accent" style={{ fontSize: "16px", display: "block", marginTop: "2px" }}>
              {"<< SYSTEM ADMIN >>"}
            </span>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {navItems.map(({ label, href, icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="font-pixel"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    fontSize: "8px",
                    textDecoration: "none",
                    border: "2px solid",
                    borderColor: isActive ? "var(--accent-primary)" : "transparent",
                    background: isActive ? "var(--accent-glow)" : "transparent",
                    color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                    borderRadius: "2px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: "12px" }}>{icon}</span>
                  <span>{label}</span>
                  {isActive && <span style={{ marginLeft: "auto" }}>◀</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Panel Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "20px", borderTop: "2px solid var(--border-light)" }}>
          <Link
            href="/dashboard"
            className="nokia-btn font-pixel"
            style={{
              width: "100%",
              fontSize: "7px",
              padding: "8px",
              backgroundColor: "transparent",
              color: "var(--accent-primary)",
              borderColor: "var(--accent-primary)",
              boxShadow: "none",
            }}
          >
            ◀ LOBBY FEED
          </Link>
          <SignOutButton />
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 py-2 flex items-center justify-around"
        style={{
          backgroundColor: "var(--bg-base)",
          borderTop: "2px solid var(--border-strong)",
        }}
      >
        {navItems.map(({ label, href, icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="font-pixel"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                padding: "6px",
                textDecoration: "none",
                color: isActive ? "var(--accent-primary)" : "var(--text-muted)",
                fontSize: "7px",
              }}
            >
              <span style={{ fontSize: "16px", lineHeight: 1 }}>{icon}</span>
              <span>{label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
