"use client";

import { useState } from "react";
import Link from "next/link";
import SubpageNavbar from "@/components/SubpageNavbar";
import SubpageFooter from "@/components/SubpageFooter";
import { Shield, FileText, CheckCircle, AlertTriangle, Users, Lock, ChevronRight, Sparkles, ArrowRight } from "lucide-react";

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState("conduct");

  const sections = [
    {
      id: "conduct",
      title: "1. Community Conduct & IRL Meetup Etiquette",
      icon: Users,
      content: (
        <>
          <p>Solo-No-More is built on real trust, authentic connections, and safety. By participating in any beacon or squad meetup across any city, you agree to:</p>
          <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
            <li><strong>Respect Fellow Members:</strong> Harassment, discrimination, non-consensual photography, or predatory behavior will result in an immediate, permanent ban.</li>
            <li><strong>Honor RSVP Commitments:</strong> When you join a squad, people are reserving slots and waiting for you. If you cannot attend, notify the squad chat at least 2 hours prior.</li>
            <li><strong>Public Third Spaces Only:</strong> All public beacons must take place at established commercial venues (cafes, sports arenas, restaurants, galleries). Private residential meetups are restricted to Verified Squad tiers.</li>
          </ul>
        </>
      ),
    },
    {
      id: "safety",
      title: "2. Safety Protocols & Anti-Ghosting Policy",
      icon: AlertTriangle,
      content: (
        <>
          <p>We take squad reliability seriously. Empty chairs ruin meetups for everyone:</p>
          <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
            <li><strong>The 2-Strike No-Show Rule:</strong> Accumulating two unexcused no-shows will temporarily lock your ability to broadcast or join beacons for 14 days.</li>
            <li><strong>Emergency Reporting:</strong> Members have access to in-app SOS reporting if any host or guest breaches community boundaries during an event.</li>
            <li><strong>Local Law Compliance:</strong> All events must strictly observe applicable local laws and venue regulations.</li>
          </ul>
        </>
      ),
    },
    {
      id: "ticketing",
      title: "3. Ticket Purchases, Host Responsibilities & Fees",
      icon: FileText,
      content: (
        <>
          <p>For ticketed meetups, padel bookings, concerts, and workshops:</p>
          <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
            <li><strong>Accurate Descriptions:</strong> Hosts must accurately state event times, venue location, ticket inclusions, and slot capacity.</li>
            <li><strong>Entry Verification:</strong> Organizers are provided with QR scanning tools on the Solo-No-More portal to authenticate attendees at the door.</li>
            <li><strong>Platform Processing:</strong> Solo-No-More applies a transparent processing fee on paid ticket transactions to cover gateway costs and squad protection.</li>
          </ul>
        </>
      ),
    },
    {
      id: "privacy",
      title: "4. Account Verification & Identity Safeguards",
      icon: Lock,
      content: (
        <>
          <p>To ensure high signal-to-noise across our member network:</p>
          <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
            <li>Every profile requires SMS phone verification and verified social link or ID proof.</li>
            <li>We do not sell your personal telemetry data to third-party ad brokers.</li>
            <li>Your live radar telemetry only transmits approximate neighborhood proximity, never your exact home address.</li>
          </ul>
        </>
      ),
    },
    {
      id: "liability",
      title: "5. Limitation of Liability & Third-Party Venues",
      icon: Shield,
      content: (
        <>
          <p>
            Solo-No-More facilitates discovery and coordination between members and partner venues. While we curate verified communities and implement strict safety measures, members attend in-person meetups at their own discretion. Solo-No-More is not liable for personal property lost at third-party commercial venues or actions undertaken outside of designated squad meetups.
          </p>
        </>
      ),
    },
  ];

  return (
    <div style={{ background: "#060408", minHeight: "100vh", color: "#FFFFFF", position: "relative", overflowX: "hidden" }}>
      <SubpageNavbar activePage="/terms" />

      {/* Atmospheric Top Orange Glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "1000px",
          height: "600px",
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255, 90, 31, 0.28) 0%, rgba(255, 90, 31, 0.04) 55%, transparent 80%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      {/* Dotted Texture Background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.16) 1.25px, transparent 1.25px)",
          backgroundSize: "22px 22px",
          pointerEvents: "none",
          opacity: 0.65,
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      <main style={{ position: "relative", zIndex: 1, padding: "70px 0 100px" }}>
        <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "0 clamp(20px, 3.5vw, 56px)" }}>
          {/* Header */}
          <div style={{ textAlign: "center", maxWidth: "780px", margin: "0 auto 60px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                background: "linear-gradient(135deg, rgba(255, 90, 31, 0.2) 0%, rgba(255, 90, 31, 0.05) 100%)",
                border: "1px solid rgba(255, 90, 31, 0.4)",
                padding: "6px 16px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 800,
                color: "#FF8A3D",
                marginBottom: "16px",
                letterSpacing: "0.06em",
                boxShadow: "0 0 20px rgba(255, 90, 31, 0.2)",
              }}
            >
              <Shield className="w-3.5 h-3.5" /> LEGAL AGREEMENT · EFFECTIVE 2026
            </div>

            <h1
              style={{
                fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
                fontSize: "clamp(34px, 5.5vw, 56px)",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                margin: "0 0 16px",
                lineHeight: 1.15,
                background: "linear-gradient(180deg, #FFFFFF 40%, rgba(255, 255, 255, 0.75) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Terms of Service &amp; Squad Protocols
            </h1>
            <p style={{ fontSize: "17.5px", color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.6, margin: 0 }}>
              The clear rules and shared respect that keep our IRL community safe, exciting, and high-vibe across every city.
            </p>
          </div>

          {/* Grid Layout: Sidebar TOC + Content */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
              gap: "36px",
              alignItems: "start",
              marginBottom: "80px",
            }}
          >
            {/* Table of Contents Sticky */}
            <div
              style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "24px",
                padding: "24px",
                backdropFilter: "blur(14px)",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.08em", color: "#FF8A3D", textTransform: "uppercase", marginBottom: "14px" }}>
                Document Outline
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {sections.map((s) => {
                  const Icon = s.icon;
                  const isCur = activeSection === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setActiveSection(s.id);
                        document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: "12px",
                        background: isCur ? "rgba(255, 90, 31, 0.2)" : "transparent",
                        border: "1px solid " + (isCur ? "#FF5A1F" : "transparent"),
                        color: isCur ? "#fff" : "rgba(255,255,255,0.7)",
                        fontSize: "13px",
                        fontWeight: isCur ? 800 : 600,
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Icon className="w-4 h-4 text-[#FF5A1F]" />
                        <span>{s.title.split(". ")[1]}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                Questions about these terms? Email <a href="mailto:hello.solonomore@gmail.com" style={{ color: "#FF8A3D" }}>hello.solonomore@gmail.com</a>
              </div>
            </div>

            {/* Content Sections */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.id}
                    id={s.id}
                    style={{
                      background: "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "24px",
                      padding: "clamp(24px, 3vw, 36px)",
                      backdropFilter: "blur(12px)",
                      scrollMarginTop: "120px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,90,31,0.15)", border: "1px solid rgba(255,90,31,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon className="w-4 h-4 text-[#FF5A1F]" />
                      </div>
                      <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "#fff" }}>
                        {s.title}
                      </h2>
                    </div>
                    <div style={{ fontSize: "15px", lineHeight: 1.7, color: "rgba(255,255,255,0.75)" }}>
                      {s.content}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>

      {/* ── SPICY HIGH-ENERGY ORANGE CTA SECTION (MATCHING HOME PAGE) ── */}
      <section
        style={{
          width: "100%",
          borderRadius: "clamp(32px, 4vw, 56px) clamp(32px, 4vw, 56px) 0 0",
          background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 40%, #E6450A 75%, #BD3000 100%)",
          padding: "90px min(4vw, 48px) 80px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle Geometric Dotted Texture Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.24) 1.25px, transparent 1.25px)",
            backgroundSize: "22px 22px",
            backgroundPosition: "center",
            pointerEvents: "none",
            zIndex: 1,
            opacity: 0.85,
          }}
          aria-hidden="true"
        />

        <div style={{ maxWidth: "820px", margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(0, 0, 0, 0.25)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              padding: "5px 14px",
              borderRadius: "999px",
              fontSize: "11.5px",
              fontWeight: 800,
              color: "#FFFFFF",
              marginBottom: "16px",
              letterSpacing: "0.06em",
            }}
          >
            <Shield className="w-3.5 h-3.5" /> BUILT ON SHARED RESPECT
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display), system-ui, sans-serif",
              fontSize: "clamp(34px, 5vw, 54px)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: "#FFFFFF",
              lineHeight: 1.1,
              margin: "0 0 16px",
              textShadow: "0 3px 25px rgba(0, 0, 0, 0.22)",
            }}
          >
            Ready to Step into a High-Trust IRL Community?
          </h2>
          <p
            style={{
              fontSize: "clamp(16px, 2vw, 19px)",
              color: "rgba(255, 255, 255, 0.95)",
              fontWeight: 500,
              lineHeight: 1.55,
              maxWidth: "640px",
              margin: "0 auto 36px",
              textShadow: "0 2px 10px rgba(0, 0, 0, 0.15)",
            }}
          >
            Apply for membership to unlock verified meetups, padel doubles, and secret gatherings across your city.
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "18px",
            }}
          >
            <Link
              href="/apply"
              style={{
                background: "#0E0714",
                color: "#FFFFFF",
                fontSize: "15px",
                fontWeight: 800,
                padding: "15px 36px",
                borderRadius: "999px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                letterSpacing: "-0.01em",
                boxShadow: "0 14px 40px rgba(0, 0, 0, 0.45)",
                transition: "all 0.25s ease",
              }}
              className="hover:scale-105 hover:bg-[#1A0E24] cursor-pointer"
            >
              <span>Apply for Membership</span>
              <ArrowRight className="w-4 h-4 text-[#FF8A3D]" />
            </Link>
            <Link
              href="/contact"
              style={{
                background: "rgba(255, 255, 255, 0.96)",
                color: "#0E0714",
                fontSize: "15px",
                fontWeight: 800,
                padding: "15px 36px",
                borderRadius: "999px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                letterSpacing: "-0.01em",
                boxShadow: "0 14px 35px rgba(0, 0, 0, 0.18)",
                transition: "all 0.25s ease",
              }}
              className="hover:scale-105 hover:bg-white cursor-pointer"
            >
              <span>Ask a Legal Question</span>
              <ArrowRight className="w-4 h-4 text-[#FF5A1F]" />
            </Link>
          </div>
        </div>
      </section>

      <SubpageFooter />
    </div>
  );
}
