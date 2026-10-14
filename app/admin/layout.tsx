import React from "react";
import { verifyAdminStatus } from "@/app/actions/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import AdminSidebarClient from "./AdminSidebarClient";
import DashboardFooter from "@/components/DashboardFooter";

export const revalidate = 0; // Fresh stats on every admin view

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guard the entire /admin route group at the server layer
  await verifyAdminStatus();

  // Fetch real platform totals for header figures (Total Users, Total Events, Total Bookings)
  const [profilesCountRes, eventsCountRes, bookingsCountRes] = await Promise.all([
    (supabaseAdmin.from("profiles") as any).select("*", { count: "exact", head: true }),
    (supabaseAdmin.from("official_events") as any).select("*", { count: "exact", head: true }),
    (supabaseAdmin.from("event_tickets") as any).select("*", { count: "exact", head: true }),
  ]);

  const totalUsers = profilesCountRes.count ?? 0;
  const totalEvents = eventsCountRes.count ?? 0;
  const totalBookings = bookingsCountRes.count ?? 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#060408",
        color: "#FFFFFF",
        position: "relative",
      }}
    >
      {/* Background Radial Atmosphere matching Membership Dashboard */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "1200px",
          height: "600px",
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255, 90, 31, 0.16) 0%, rgba(255, 90, 31, 0.02) 60%, transparent 80%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      {/* Dotted Texture Background across main canvas */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.12) 1.25px, transparent 1.25px)",
          backgroundSize: "22px 22px",
          pointerEvents: "none",
          opacity: 0.6,
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      {/* Non-sticky top navbar + Admin Panel stats header + Image 1 style horizontal tabs */}
      <AdminSidebarClient
        totalUsers={totalUsers}
        totalEvents={totalEvents}
        totalBookings={totalBookings}
      />

      {/* Main command content pane - expansive full-width canvas */}
      <main
        style={{
          flex: 1,
          width: "100%",
          padding: "16px clamp(16px, 2.5vw, 40px) 40px",
          position: "relative",
          zIndex: 40,
        }}
      >
        {children}
      </main>

      {/* Luxury Full-Width Dashboard Footer */}
      <DashboardFooter />
    </div>
  );
}
