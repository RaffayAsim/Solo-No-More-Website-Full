import React from "react";
import { verifyAdminStatus } from "@/app/actions/admin";
import AdminSidebarClient from "./AdminSidebarClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guard the entire /admin route group at the server layer
  await verifyAdminStatus();

  return (
    <div 
      className="relative min-h-screen flex flex-col md:flex-row overflow-hidden font-mono nokia-scanlines"
      style={{
        backgroundColor: "var(--bg-base)",
        color: "var(--text-primary)",
      }}
    >
      {/* Tactical Team sidebar menu */}
      <AdminSidebarClient />

      {/* Main command content pane */}
      <div 
        className="flex-1 min-h-screen relative flex flex-col overflow-y-auto pb-20 md:pb-0"
        style={{
          borderLeft: "2px solid var(--border-strong)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
