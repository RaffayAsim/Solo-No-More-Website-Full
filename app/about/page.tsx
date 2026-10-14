"use client";

import Link from "next/link";
import SubpageNavbar from "@/components/SubpageNavbar";
import SubpageFooter from "@/components/SubpageFooter";
import { Sparkles, Heart, Shield, Users, MapPin, Zap, ArrowRight, Award, Coffee } from "lucide-react";

export default function AboutUsPage() {
  const stats = [
    { value: "12,000+", label: "Verified Members", note: "Across Karachi, Lahore & Islamabad" },
    { value: "1,450+", label: "IRL Meetups Hosted", note: "From chai runs to padel tournaments" },
    { value: "96%", label: "Show-Up Reliability", note: "Protected by anti-ghosting telemetry" },
    { value: "45+", label: "Partner Cafes & Venues", note: "Exclusive member table perks" },
  ];

  const pillars = [
    {
      icon: Coffee,
      title: "Real Life > Screen Time",
      desc: "We don't measure success by endless app engagement or doom-scrolling. Our only metric is the number of empty chai cups, shared laughs, and genuine friendships formed in the real world.",
    },
    {
      icon: Shield,
      title: "Radical Safety & High Signal",
      desc: "Every profile undergoes multi-factor SMS and social identity verification. Predatory behavior is met with a permanent, immediate ban. Women feel completely safe meeting new squads in public venues.",
    },
    {
      icon: Users,
      title: "Zero Social Friction",
      desc: "No more waiting on unresponsive group chats that never leave WhatsApp. When you want to go out, drop a beacon and connect with people who are ready to meet right now.",
    },
    {
      icon: MapPin,
      title: "Championing Third Spaces",
      desc: "We support local indie cafes, rooftop acoustic spaces, and sports arenas by filling empty tables and off-peak courts with lively, respectful squads.",
    },
  ];

  return (
    <div style={{ background: "#060408", minHeight: "100vh", color: "#FFFFFF", position: "relative" }}>
      <SubpageNavbar activePage="/about" />

      {/* Ambient Top Orange Glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "650px",
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
          opacity: 0.7,
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      <main style={{ position: "relative", zIndex: 1, padding: "80px 0 120px" }}>
        <div style={{ maxWidth: "1480px", margin: "0 auto", padding: "0 clamp(20px, 3.5vw, 56px)" }}>
          {/* Hero Header */}
          <div style={{ textAlign: "center", maxWidth: "840px", margin: "0 auto 60px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                background: "rgba(255, 90, 31, 0.12)",
                border: "1px solid rgba(255, 90, 31, 0.3)",
                padding: "6px 16px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 800,
                color: "#FF5A1F",
                marginBottom: "16px",
                letterSpacing: "0.06em",
              }}
            >
              <Heart className="w-3.5 h-3.5" /> OUR ORIGIN &amp; MISSION
            </div>

            <h1
              style={{
                fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
                fontSize: "clamp(34px, 5.5vw, 58px)",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                margin: "0 0 16px",
                lineHeight: 1.15,
              }}
            >
              The Antidote to Urban Loneliness
            </h1>
            <p style={{ fontSize: "18px", color: "rgba(255, 255, 255, 0.65)", lineHeight: 1.6, margin: 0 }}>
              Solo-No-More was born out of a simple observation: our cities have 20 million people, yet finding someone to grab chai with on a Tuesday evening shouldn&apos;t feel impossible.
            </p>
          </div>

          {/* Stats Bar */}
          <div
            style={{
              background: "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "28px",
              padding: "clamp(24px, 3vw, 40px)",
              backdropFilter: "blur(12px)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "28px",
              marginBottom: "80px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            }}
          >
            {stats.map((s, idx) => (
              <div key={idx} style={{ textAlign: "center", borderRight: idx !== stats.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                <div style={{ fontSize: "clamp(32px, 4vw, 46px)", fontWeight: 900, color: "#FF8A3D", letterSpacing: "-0.03em", marginBottom: "4px" }}>
                  {s.value}
                </div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>
                  {s.label}
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                  {s.note}
                </div>
              </div>
            ))}
          </div>

          {/* Story Narrative Section */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "48px",
              alignItems: "center",
              marginBottom: "80px",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", fontWeight: 900, color: "#FF8A3D", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                THE WHY BEHIND SOLO-NO-MORE
              </span>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, margin: "10px 0 18px", color: "#fff", lineHeight: 1.2 }}>
                We replaced flaky plans with real-world momentum.
              </h2>
              <div style={{ fontSize: "15.5px", lineHeight: 1.7, color: "rgba(255,255,255,0.7)", display: "flex", flexDirection: "column", gap: "16px" }}>
                <p>
                  How many times have you wanted to try that new specialty coffee bar on Zamzama, play a quick padel match, or attend a rooftop indie gig, only to end up staying home because your usual friend group was busy or flaked out at the last second?
                </p>
                <p>
                  We built Solo-No-More because friendship in your twenties and thirties shouldn&apos;t depend on endless scheduling logistics. With our live Beacon Radar protocol, anyone in Karachi can broadcast a signal and gather a squad of vetted, like-minded people in under an hour.
                </p>
                <p>
                  No dating app awkwardness. No stiff corporate networking. Just authentic young people doing things they love together in safe, vibrant third spaces.
                </p>
              </div>
            </div>

            <div
              style={{
                background: "linear-gradient(160deg, rgba(255,90,31,0.15) 0%, rgba(18,12,22,0.95) 100%)",
                border: "1.5px solid rgba(255,90,31,0.35)",
                borderRadius: "32px",
                padding: "44px 36px",
                boxShadow: "0 30px 80px rgba(255,90,31,0.18)",
              }}
            >
              <div style={{ width: "56px", height: "56px", borderRadius: "18px", background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "22px" }}>
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 style={{ fontSize: "22px", fontWeight: 900, margin: "0 0 12px", color: "#fff" }}>
                The Karachi Community Pledge
              </h3>
              <p style={{ fontSize: "14.5px", color: "rgba(255,255,255,0.7)", lineHeight: 1.65, margin: "0 0 24px" }}>
                &ldquo;Every table has room for one more. We check our egos at the door, welcome newcomers with warmth, and leave every meetup with higher energy than when we arrived.&rdquo;
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#FF5A1F", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "15px" }}>
                  SNM
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>Karachi Core Team</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Solo-No-More HQ, Zamzama</div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Core Pillars Grid */}
          <div style={{ marginBottom: "80px" }}>
            <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 40px" }}>
              <span style={{ fontSize: "11px", fontWeight: 900, color: "#FFA05C", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                OUR OPERATING PRINCIPLES
              </span>
              <h2 style={{ fontSize: "32px", fontWeight: 900, margin: "8px 0 0" }}>What We Stand For</h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "28px" }}>
              {pillars.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <div
                    key={idx}
                    style={{
                      background: "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "24px",
                      padding: "32px 26px",
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(255,90,31,0.15)", border: "1px solid rgba(255,90,31,0.35)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                      <Icon className="w-5 h-5 text-[#FF5A1F]" />
                    </div>
                    <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 10px", color: "#fff" }}>
                      {p.title}
                    </h3>
                    <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", lineHeight: 1.6, margin: 0 }}>
                      {p.desc}
                    </p>
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
            <Sparkles className="w-3.5 h-3.5" /> BE PART OF THE MOVEMENT
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
            Ready to Find Your People IRL?
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
            It only takes 60 seconds to verify your profile and start dropping beacons across your city. Zero ghosting, pure human connection.
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
              <span>Explore Active Events</span>
              <ArrowRight className="w-4 h-4 text-[#FF5A1F]" />
            </Link>
          </div>
        </div>
      </section>

      <SubpageFooter />
    </div>
  );
}
