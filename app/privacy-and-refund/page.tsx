"use client";

import { useState } from "react";
import Link from "next/link";
import SubpageNavbar from "@/components/SubpageNavbar";
import SubpageFooter from "@/components/SubpageFooter";
import { Shield, RefreshCw, Lock, Eye, CheckCircle2, Clock, CreditCard, AlertCircle, Sparkles, ArrowRight } from "lucide-react";

export default function PrivacyAndRefundPage() {
  const [tab, setTab] = useState<"privacy" | "refund">("privacy");

  return (
    <div style={{ background: "#060408", minHeight: "100vh", color: "#FFFFFF", position: "relative", overflowX: "hidden" }}>
      <SubpageNavbar activePage="/privacy-and-refund" />

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
          <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 40px" }}>
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
              <Shield className="w-3.5 h-3.5" /> TRUST, PRIVACY &amp; FAIR PLAY
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
              Privacy &amp; Refund Policies
            </h1>
            <p style={{ fontSize: "17.5px", color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.6, margin: 0 }}>
              Full transparency on how we safeguard your personal data and protect your event payments.
            </p>
          </div>

          {/* Dual-Topic Tab Switcher */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "48px" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: "16px",
                padding: "5px",
                display: "inline-flex",
                gap: "6px",
              }}
            >
              <button
                type="button"
                onClick={() => setTab("privacy")}
                style={{
                  padding: "10px 24px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                  background: tab === "privacy" ? "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)" : "transparent",
                  color: tab === "privacy" ? "#fff" : "rgba(255,255,255,0.7)",
                  boxShadow: tab === "privacy" ? "0 4px 18px rgba(255,90,31,0.4)" : "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.15s ease",
                }}
              >
                <Lock className="w-4 h-4" /> Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setTab("refund")}
                style={{
                  padding: "10px 24px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                  background: tab === "refund" ? "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)" : "transparent",
                  color: tab === "refund" ? "#fff" : "rgba(255,255,255,0.7)",
                  boxShadow: tab === "refund" ? "0 4px 18px rgba(255,90,31,0.4)" : "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.15s ease",
                }}
              >
                <RefreshCw className="w-4 h-4" /> Refund &amp; Cancellation Policy
              </button>
            </div>
          </div>

          {/* TAB 1: PRIVACY POLICY */}
          {tab === "privacy" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "28px", marginBottom: "80px" }}>
              <div
                style={{
                  background: "linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                  border: "1.5px solid rgba(255,255,255,0.12)",
                  borderRadius: "26px",
                  padding: "clamp(26px, 4vw, 42px)",
                  backdropFilter: "blur(14px)",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(255,90,31,0.18)", border: "1px solid rgba(255,90,31,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Eye className="w-4 h-4 text-[#FF5A1F]" />
                  </div>
                  <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>1. Radar Telemetry &amp; Location Privacy</h2>
                </div>
                <p style={{ fontSize: "15px", lineHeight: 1.7, color: "rgba(255,255,255,0.75)" }}>
                  Solo-No-More utilizes approximate location telemetry to discover nearby squads and beacons across your city. We <strong>never</strong> broadcast or expose your exact GPS coordinates or personal residential address. When your beacon is live on the public radar, only your chosen venue name and general neighborhood appear to other vetted members.
                </p>
              </div>

              <div
                style={{
                  background: "linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                  border: "1.5px solid rgba(255,255,255,0.12)",
                  borderRadius: "26px",
                  padding: "clamp(26px, 4vw, 42px)",
                  backdropFilter: "blur(14px)",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(39,201,63,0.18)", border: "1px solid rgba(39,201,63,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Lock className="w-4 h-4 text-[#27C93F]" />
                  </div>
                  <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>2. Identity Verification &amp; Data Safeguards</h2>
                </div>
                <p style={{ fontSize: "15px", lineHeight: 1.7, color: "rgba(255,255,255,0.75)" }}>
                  All members provide verified contact information to keep our community safe. Any ID or social media verification documents submitted during onboarding are encrypted at rest with AES-256 standard and stored on isolated private storage. We never share or sell personal member information to third-party ad brokers or marketing aggregators.
                </p>
              </div>

              <div
                style={{
                  background: "linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                  border: "1.5px solid rgba(255,255,255,0.12)",
                  borderRadius: "26px",
                  padding: "clamp(26px, 4vw, 42px)",
                  backdropFilter: "blur(14px)",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>3. Temporary Squad Chat Disappearance</h2>
                </div>
                <p style={{ fontSize: "15px", lineHeight: 1.7, color: "rgba(255,255,255,0.75)" }}>
                  Squad chats are designed as temporary coordination lobbies for the event. 48 hours after an event has concluded, active chat lobbies are automatically archived to protect participants&apos; communications and contact boundaries.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: REFUND POLICY */}
          {tab === "refund" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "28px", marginBottom: "80px" }}>
              <div
                style={{
                  background: "linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                  border: "1.5px solid rgba(255,255,255,0.12)",
                  borderRadius: "26px",
                  padding: "clamp(26px, 4vw, 42px)",
                  backdropFilter: "blur(14px)",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(39,201,63,0.18)", border: "1px solid rgba(39,201,63,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckCircle2 className="w-4 h-4 text-[#27C93F]" />
                  </div>
                  <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>1. Full Refund Guarantee (Host Cancellations)</h2>
                </div>
                <p style={{ fontSize: "15px", lineHeight: 1.7, color: "rgba(255,255,255,0.75)" }}>
                  If an organizer or host cancels an event or significantly reschedules the date/time, all ticket holders are entitled to a <strong>100% full refund</strong> immediately credited back to their original payment method (Bank Transfer, Raast, JazzCash, or Card) within 48 to 72 business hours.
                </p>
              </div>

              <div
                style={{
                  background: "linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                  border: "1.5px solid rgba(255,255,255,0.12)",
                  borderRadius: "26px",
                  padding: "clamp(26px, 4vw, 42px)",
                  backdropFilter: "blur(14px)",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(255,90,31,0.18)", border: "1px solid rgba(255,90,31,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Clock className="w-4 h-4 text-[#FF5A1F]" />
                  </div>
                  <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>2. Attendee Cancellation Windows</h2>
                </div>
                <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "15px", lineHeight: 1.7, color: "rgba(255,255,255,0.75)" }}>
                  <li><strong>Notice greater than 24 hours prior to event start:</strong> 90% refund issued (10% retained for payment gateway transaction costs).</li>
                  <li><strong>Notice less than 24 hours prior:</strong> Non-refundable. Because squad slots and partner venue bookings (like padel court rentals or private dining tables) are locked in advance, last-minute cancellations forfeit tickets to protect the host.</li>
                  <li><strong>Verified Emergency / Illness:</strong> Contact support at <a href="mailto:thesolonomore@gmail.com" style={{ color: "#FF8A3D" }}>thesolonomore@gmail.com</a> with event reference code for review.</li>
                </ul>
              </div>

              <div
                style={{
                  background: "linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                  border: "1.5px solid rgba(255,255,255,0.12)",
                  borderRadius: "26px",
                  padding: "clamp(26px, 4vw, 42px)",
                  backdropFilter: "blur(14px)",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>3. How to Request a Refund</h2>
                </div>
                <p style={{ fontSize: "15px", lineHeight: 1.7, color: "rgba(255,255,255,0.75)" }}>
                  You can initiate an automated cancellation directly from your member dashboard under <em>My Squad Passes</em> or by sending an email with your booking ID and mobile number to <a href="mailto:thesolonomore@gmail.com" style={{ color: "#FF8A3D" }}>thesolonomore@gmail.com</a>.
                </p>
              </div>
            </div>
          )}

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
            <Shield className="w-3.5 h-3.5" /> DEDICATED SQUAD SUPPORT
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
            Have a Specific Billing or Verification Question?
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
            Our support team is available around the clock to assist with pass refunds, identity checks, and ticket verifications.
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
              href="/contact"
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
              <span>Contact Member Concierge</span>
              <ArrowRight className="w-4 h-4 text-[#FF8A3D]" />
            </Link>
            <Link
              href="/memberships"
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
              <span>View Membership Passes</span>
              <ArrowRight className="w-4 h-4 text-[#FF5A1F]" />
            </Link>
          </div>
        </div>
      </section>

      <SubpageFooter />
    </div>
  );
}
