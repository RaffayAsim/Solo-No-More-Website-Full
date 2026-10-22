"use client";

import Link from "next/link";
import { Mail, Smartphone, MapPin, ArrowRight, Ticket, Crown, Shield, Sparkles } from "lucide-react";

export default function SubpageFooter() {
  return (
    <footer
      style={{
        background: "#030205",
        position: "relative",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        padding: "80px 0 36px",
        color: "rgba(255, 255, 255, 0.7)",
      }}
    >
      {/* Background Dotted Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.12) 1.25px, transparent 1.25px)",
          backgroundSize: "22px 22px",
          backgroundPosition: "center",
          pointerEvents: "none",
          opacity: 0.5,
        }}
        aria-hidden="true"
      />

      <div
        style={{
          maxWidth: "1560px",
          margin: "0 auto",
          padding: "0 clamp(20px, 3.5vw, 56px)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Top 4-Column Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "48px 32px",
            marginBottom: "60px",
          }}
        >
          {/* Column 1: Brand Info */}
          <div>
            <Link
              href="/"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                marginBottom: "16px",
              }}
              className="group cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="solo-no-more"
                className="h-10 sm:h-12 md:h-14 w-auto object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-[0_2px_12px_rgba(255,90,31,0.35)]"
              />
            </Link>
            <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255, 255, 255, 0.6)", marginBottom: "20px" }}>
              Never go out alone again. Verified IRL squads for padel, chai runs, live gigs, and rooftop hangs across your city.
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(39, 201, 63, 0.12)", border: "1px solid rgba(39, 201, 63, 0.3)", padding: "4px 12px", borderRadius: "999px", fontSize: "11px", fontWeight: 800, color: "#27C93F" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#27C93F" }} /> LIVE RADAR ACTIVE IN YOUR CITY
            </div>
          </div>

          {/* Column 2: Explore & Experience */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: "20px",
              }}
            >
              <Ticket className="w-4 h-4 text-[#FF5A1F]" />
              <span>Explore</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
              <Link href="/events" className="hover:text-[#FF8A3D] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Browse Events</Link>
              <Link href="/how-it-works" className="hover:text-[#FF8A3D] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>How Beacon Works</Link>
              <Link href="/memberships" className="hover:text-[#FF8A3D] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Memberships &amp; Pricing</Link>
              <Link href="/about" className="hover:text-[#FF8A3D] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>About Our Mission</Link>
              <Link href="/contact" className="hover:text-[#FF8A3D] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Contact Us</Link>
            </div>
          </div>

          {/* Column 3: Partners & Hosts */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: "20px",
              }}
            >
              <Crown className="w-4 h-4 text-[#FF5A1F]" />
              <span>Partners &amp; Hosts</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
              <Link href="/partners" className="hover:text-[#FF8A3D] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Partner Registration</Link>
              <Link href="/sell-tickets" className="hover:text-[#FF8A3D] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Sell Your Tickets &amp; Host</Link>
              <Link href="/terms" className="hover:text-[#FF8A3D] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Terms of Service</Link>
              <Link href="/privacy-and-refund" className="hover:text-[#FF8A3D] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Privacy &amp; Refund Policy</Link>
            </div>
          </div>

          {/* Column 4: Karachi HQ */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: "20px",
              }}
            >
              <Sparkles className="w-4 h-4 text-[#FF5A1F]" />
              <span>Get in Touch</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13.5px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Mail className="w-4 h-4 text-[#FF5A1F] shrink-0" />
                <a href="mailto:thesolonomore@gmail.com" style={{ color: "inherit", textDecoration: "none" }} className="hover:text-[#FF8A3D] transition-colors">
                  thesolonomore@gmail.com
                </a>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Smartphone className="w-4 h-4 text-[#FF5A1F] shrink-0" />
                <a href="tel:03332877852" style={{ color: "inherit", textDecoration: "none" }} className="hover:text-[#FF8A3D] transition-colors">
                  03332877852
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            paddingTop: "24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "18px",
            fontSize: "13px",
            color: "rgba(255, 255, 255, 0.5)",
          }}
        >
          <div>© {new Date().getFullYear()} Solo-No-More. All rights reserved. Find Your People IRL.</div>

        </div>
      </div>
    </footer>
  );
}
