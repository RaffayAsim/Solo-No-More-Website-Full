"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "@/app/dashboard/SignOutButton";
import {
  ShieldCheck,
  ArrowLeft,
  Users,
  Calendar,
  Ticket,
} from "lucide-react";

interface AdminNavProps {
  totalUsers?: number;
  totalEvents?: number;
  totalBookings?: number;
}

export default function AdminSidebarClient({
  totalUsers = 0,
  totalEvents = 0,
  totalBookings = 0,
}: AdminNavProps) {
  const pathname = usePathname();

  // Navigation tabs matching Image 1 style
  const navTabs = [
    { label: "Overview", href: "/admin", isExact: true },
    { label: "Events", href: "/admin/events" },
    { label: "Member Users", href: "/admin/users" },
    { label: "Member's Bookings", href: "/admin/bookings" },
    { label: "Guest Users", href: "/admin/guests" },
    { label: "Guest Bookings", href: "/admin/guest-bookings" },
    { label: "Manual Ticketing", href: "/admin/manual-ticketing" },
    { label: "Beacons Control", href: "/admin/beacons" },
    { label: "Partners", href: "/admin/partners" },
    { label: "Artist", href: "/admin/artists" },
    { label: "Review Wall", href: "/admin/review-wall" },
  ];

  const isActive = (tab: (typeof navTabs)[0]) => {
    if (tab.isExact) return pathname === "/admin";
    const baseHref = tab.href.split("?")[0];
    if (pathname === baseHref) return true;
    return pathname.startsWith(baseHref + "/");
  };

  return (
    <div style={{ width: "100%", position: "relative", zIndex: 30 }}>
      {/* ── 1. SIMPLE NON-STICKY TOP NAVBAR ───────────────────────────── */}
      <header
        id="admin-top-navbar"
        style={{
          width: "100%",
          maxWidth: "1600px",
          margin: "0 auto",
          padding: "16px clamp(16px, 2.5vw, 40px) 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          position: "relative",
        }}
      >
        {/* Left: Brand logo + Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href="/admin"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "9px",
            }}
            className="group cursor-pointer"
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(255, 90, 31, 0.45)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>

            <div>
              <span
                style={{
                  fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
                  fontSize: "16px",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  color: "#FFFFFF",
                  display: "block",
                  lineHeight: 1.1,
                }}
              >
                solo-no-more
              </span>
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 800,
                  color: "rgba(255, 255, 255, 0.65)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Ops Command Center
              </span>
            </div>
          </Link>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: "rgba(39, 201, 63, 0.12)",
              border: "1px solid rgba(39, 201, 63, 0.3)",
              color: "#27C93F",
              padding: "2px 8px",
              borderRadius: "6px",
              fontSize: "10px",
              fontWeight: 800,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#27C93F] animate-pulse" />
            <span>OPS ACTIVE</span>
          </span>
        </div>

        {/* Right: Member Dashboard Switcher + Sign Out */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              color: "#FFFFFF",
              fontSize: "11.5px",
              fontWeight: 800,
              textDecoration: "none",
              transition: "all 0.15s ease",
            }}
            className="hover:bg-white/15 hover:border-white/30"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#FF8A3D]" />
            <span className="hidden sm:inline">Member Dashboard</span>
            <span className="sm:hidden">Lobby</span>
          </Link>
          <SignOutButton />
        </div>
      </header>

      {/* ── 2. MAIN HEADING WITH FIGURES STATS ───────────────────────── */}
      <div
        id="admin-header-stats-strip"
        style={{
          width: "100%",
          maxWidth: "1600px",
          margin: "0 auto",
          padding: "20px clamp(16px, 2.5vw, 40px) 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: "clamp(24px, 3.5vw, 32px)",
              fontWeight: 900,
              margin: "0 0 4px",
              color: "#FFFFFF",
              letterSpacing: "-0.03em",
            }}
          >
            Admin Panel
          </h1>
          <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", margin: 0 }}>
            Master controls, verified member vetting, ticketing clearance &amp; platform audit
          </p>
        </div>

        {/* Figures Stats (Total Users, Total Events, Total Bookings) */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Total Users */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "14px",
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(255, 111, 38, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FF8A3D",
              }}
            >
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div style={{ fontSize: "17px", fontWeight: 900, color: "#FFFFFF", lineHeight: 1 }}>
                {totalUsers}
              </div>
              <div style={{ fontSize: "9.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.6)", letterSpacing: "0.04em", textTransform: "uppercase", marginTop: "2px" }}>
                Total Users
              </div>
            </div>
          </div>

          {/* Total Events */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "14px",
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(39, 201, 63, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#27C93F",
              }}
            >
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div style={{ fontSize: "17px", fontWeight: 900, color: "#FFFFFF", lineHeight: 1 }}>
                {totalEvents}
              </div>
              <div style={{ fontSize: "9.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.6)", letterSpacing: "0.04em", textTransform: "uppercase", marginTop: "2px" }}>
                Total Events
              </div>
            </div>
          </div>

          {/* Total Bookings */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "14px",
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(255, 149, 0, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FF9500",
              }}
            >
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <div style={{ fontSize: "17px", fontWeight: 900, color: "#FFA05C", lineHeight: 1 }}>
                {totalBookings}
              </div>
              <div style={{ fontSize: "9.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.6)", letterSpacing: "0.04em", textTransform: "uppercase", marginTop: "2px" }}>
                Total Bookings
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. IMAGE 1 STYLE HORIZONTAL TABS BAR ──────────────────────── */}
      <div
        id="admin-image1-tabs-container"
        style={{
          width: "100%",
          maxWidth: "1600px",
          margin: "0 auto",
          padding: "0 clamp(16px, 2.5vw, 40px) 16px",
        }}
      >
        <div
          style={{
            background: "rgba(18, 12, 24, 0.92)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "16px",
            padding: "8px 10px 10px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.45)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              overflowX: "auto",
              paddingBottom: "6px",
            }}
            className="custom-tabs-scrollbar"
          >
            {navTabs.map((tab) => {
              const active = isActive(tab);
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px 20px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: active ? 800 : 700,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    color: active ? "#FFFFFF" : "rgba(255, 255, 255, 0.72)",
                    background: active
                      ? "linear-gradient(135deg, #FF6F26 0%, #FF4400 100%)"
                      : "transparent",
                    boxShadow: active
                      ? "0 4px 18px rgba(255, 90, 31, 0.55)"
                      : "none",
                    transition: "all 0.15s ease",
                  }}
                  className={active ? "" : "hover:text-white hover:bg-white/[0.08]"}
                >
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
