"use client";

import Link from "next/link";
import SubpageNavbar from "@/components/SubpageNavbar";
import SubpageFooter from "@/components/SubpageFooter";
import { Radio, Zap, Users, MapPin, Check, Sparkles, Shield, ArrowRight, Smartphone, Bell, HeartHandshake } from "lucide-react";

export default function HowItWorksPage() {
  const steps = [
    {
      num: "01",
      badge: "STEP 1 · INITIATE SIGNAL",
      title: "Drop a Beacon in Under 30 Seconds",
      desc: "Got an impromptu craving for chai, need a fourth player for padel, or heading to a live acoustic night? Pick your vibe, set your spot, choose your squad limit (3 to 20 people), and tap Broadcast.",
      details: ["Choose vibe: Casual, Sports, or Nightlife", "Specify your favorite cafe, court or lounge", "Set max squad size so it stays intimate and real"],
      icon: Radio,
    },
    {
      num: "02",
      badge: "STEP 2 · TELEMETRY SPREAD",
      title: "Your Signal Lights Up the Live Radar",
      desc: "Instantly, your beacon illuminates on the live city radar map. Verified members in your vicinity receive a subtle telemetry notification that a new squad is forming nearby right now.",
      details: ["Real-time radar disc pulses", "Neighborhood-level privacy preserved", "Members see spots ticking down live"],
      icon: Bell,
    },
    {
      num: "03",
      badge: "STEP 3 · THE VIBE CHECK",
      title: "Review & Curate Join Requests",
      desc: "Watch requests arrive in your telemetry feed. Tap member cards to check their verified social profiles, past meetup reviews, and mutual interests. You have 100% control over who gets accepted into your squad.",
      details: ["One-tap Accept or Decline", "Instant private Squad Lobby chat unlocks", "Coordinate meetup specifics without giving out your personal number"],
      icon: Users,
    },
    {
      num: "04",
      badge: "STEP 4 · IRL CONVERGENCE",
      title: "Show Up, Meet IRL & Never Go Solo Again",
      desc: "Arrive at the verified partner venue. Show your digital squad pass, enjoy exclusive Solo-No-More member discounts, meet authentic people who share your wavelength, and give thumbs up to build squad reputation.",
      details: ["Exclusive perks & reserved tables at partner venues", "Anti-ghosting tracking ensures everyone shows up", "Build your inner circle across your city"],
      icon: HeartHandshake,
    },
  ];

  return (
    <div style={{ background: "#060408", minHeight: "100vh", color: "#FFFFFF", position: "relative", overflowX: "hidden" }}>
      <SubpageNavbar activePage="/how-it-works" />

      {/* Atmospheric Top Orange Glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "1100px",
          height: "650px",
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255, 90, 31, 0.3) 0%, rgba(255, 90, 31, 0.05) 55%, transparent 80%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      {/* Background Dotted Texture */}
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
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 clamp(20px, 3.5vw, 56px)" }}>
          {/* Header */}
          <div style={{ textAlign: "center", maxWidth: "820px", margin: "0 auto 70px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                background: "linear-gradient(135deg, rgba(255, 90, 31, 0.22) 0%, rgba(255, 90, 31, 0.06) 100%)",
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
              <Zap className="w-3.5 h-3.5" /> BEACON TELEMETRY SYSTEM · EXPLAINED
            </div>

            <h1
              style={{
                fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
                fontSize: "clamp(34px, 5.5vw, 58px)",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                margin: "0 0 16px",
                lineHeight: 1.15,
                background: "linear-gradient(180deg, #FFFFFF 40%, rgba(255, 255, 255, 0.75) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              How the Beacon Protocol Works
            </h1>
            <p style={{ fontSize: "18px", color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.6, margin: 0 }}>
              From an impromptu craving to an IRL table with cool people in under an hour. Here is the exact mechanics of Solo-No-More.
            </p>
          </div>

          {/* 4 Step Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "36px", marginBottom: "40px" }}>
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.num}
                  style={{
                    background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 40%, #E6450A 75%, #BD3000 100%)",
                    border: "1.5px solid rgba(255, 255, 255, 0.25)",
                    borderRadius: "32px",
                    padding: "clamp(26px, 4vw, 48px)",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "36px",
                    alignItems: "center",
                    boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(255,90,31,0.35)",
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
                      zIndex: 0,
                      opacity: 0.85,
                    }}
                    aria-hidden="true"
                  />

                  {/* Left Column: Number + Content */}
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono), monospace",
                          fontSize: "22px",
                          fontWeight: 900,
                          color: "#FFFFFF",
                          background: "#0E0714",
                          border: "1px solid rgba(255, 255, 255, 0.3)",
                          padding: "4px 12px",
                          borderRadius: "10px",
                          boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
                        }}
                      >
                        {s.num}
                      </span>
                      <span style={{ fontSize: "11.5px", fontWeight: 800, color: "rgba(255,255,255,0.95)", letterSpacing: "0.08em" }}>
                        {s.badge}
                      </span>
                    </div>

                    <h2
                      style={{
                        fontFamily: "var(--font-display), system-ui, sans-serif",
                        fontSize: "clamp(24px, 3.5vw, 32px)",
                        fontWeight: 900,
                        letterSpacing: "-0.02em",
                        margin: "0 0 14px",
                        color: "#FFFFFF",
                        lineHeight: 1.2,
                        textShadow: "0 2px 12px rgba(0,0,0,0.2)",
                      }}
                    >
                      {s.title}
                    </h2>

                    <p style={{ fontSize: "15.5px", color: "rgba(255,255,255,0.95)", lineHeight: 1.65, margin: "0 0 24px", textShadow: "0 1px 6px rgba(0,0,0,0.15)" }}>
                      {s.desc}
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {s.details.map((d, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#FFFFFF", fontWeight: 600 }}>
                          <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#0E0714", border: "1px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Check className="w-3.5 h-3.5 text-[#27C93F]" />
                          </div>
                          <span>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Visual Box */}
                  <div
                    style={{
                      background: "rgba(0, 0, 0, 0.28)",
                      border: "1.5px solid rgba(255, 255, 255, 0.25)",
                      borderRadius: "26px",
                      padding: "44px 30px",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: "260px",
                      boxShadow: "0 14px 40px rgba(0,0,0,0.25)",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: "84px",
                        height: "84px",
                        borderRadius: "24px",
                        background: "#0E0714",
                        border: "1.5px solid rgba(255, 255, 255, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
                        marginBottom: "18px",
                      }}
                    >
                      <Icon className="w-10 h-10 text-[#FF8A3D]" />
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: 900, color: "#FFFFFF", marginBottom: "4px" }}>
                      Protocol Phase {s.num}
                    </div>
                    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)" }}>
                      Live Automated Telemetry Across Your City
                    </div>
                  </div>
                </div>
              );
            })}
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
            <Sparkles className="w-3.5 h-3.5" /> READY TO EXPERIENCE IT?
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
            Never Dine, Play Padel, or Party Alone Again
          </h2>
          <p
            style={{
              fontSize: "clamp(16px, 2vw, 19px)",
              color: "rgba(255, 255, 255, 0.95)",
              fontWeight: 500,
              lineHeight: 1.55,
              maxWidth: "620px",
              margin: "0 auto 36px",
              textShadow: "0 2px 10px rgba(0, 0, 0, 0.15)",
            }}
          >
            Join thousands of youth making genuine friends through verified real-world meetups.
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
              href="/events"
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
              <span>Browse Live Events</span>
              <ArrowRight className="w-4 h-4 text-[#FF5A1F]" />
            </Link>
          </div>
        </div>
      </section>

      <SubpageFooter />
    </div>
  );
}
