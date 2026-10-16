"use client";

import Link from "next/link";
import { ShieldCheck, Heart, Sparkles } from "lucide-react";

export default function DashboardFooter() {
  return (
    <footer
      style={{
        width: "100%",
        marginTop: "60px",
        padding: "36px clamp(16px, 3vw, 48px) 32px",
        borderTop: "1px solid rgba(255, 90, 31, 0.25)",
        background: "linear-gradient(180deg, rgba(14, 8, 22, 0.8) 0%, rgba(6, 4, 8, 0.98) 100%)",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        color: "rgba(255, 255, 255, 0.65)",
        fontSize: "12.5px",
        fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        {/* Brand & Mission */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #FF6F26, #FF5A1F)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <span style={{ fontWeight: 800, color: "#FFFFFF", fontSize: "13px" }}>
              solo-no-more
            </span>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginLeft: "8px" }}>
              Curated nightlife &amp; verified meetups nationwide
            </span>
          </div>
        </div>

        {/* Protection Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(39, 201, 63, 0.08)",
            border: "1px solid rgba(39, 201, 63, 0.25)",
            padding: "4px 10px",
            borderRadius: "8px",
            fontSize: "11px",
            fontWeight: 800,
            color: "#27C93F",
          }}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Anti-Ghosting Protected Community</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          paddingTop: "14px",
          borderTop: "1px solid rgba(255, 255, 255, 0.04)",
          fontSize: "11px",
          color: "rgba(255, 255, 255, 0.45)",
        }}
      >
        <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
          <Link href="/how-it-works" className="hover:text-white transition-colors" style={{ textDecoration: "none", color: "inherit" }}>
            How It Works
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors" style={{ textDecoration: "none", color: "inherit" }}>
            Safety Standards
          </Link>
          <Link href="/contact" className="hover:text-white transition-colors" style={{ textDecoration: "none", color: "inherit" }}>
            Help &amp; Support
          </Link>
          <Link href="/sell-tickets" className="hover:text-white transition-colors" style={{ textDecoration: "none", color: "inherit" }}>
            Host Official Events
          </Link>
        </div>

        <div>
          &copy; {new Date().getFullYear()} Solo-No-More Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
