"use client";

import { useState } from "react";
import Link from "next/link";
import SubpageNavbar from "@/components/SubpageNavbar";
import SubpageFooter from "@/components/SubpageFooter";
import { Handshake, Store, Music, Sparkles, Check, ArrowRight, ShieldCheck, TrendingUp, Users, Send } from "lucide-react";

export default function PartnerRegistrationPage() {
  const [partnerType, setPartnerType] = useState<"venue" | "artist" | "sports">("venue");
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [instagram, setInstagram] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 700);
  };

  const partnerTiers = [
    {
      title: "Cafe & Venue Partners",
      subtitle: "For Cafes, Rooftops & Casual Eateries",
      badge: "ZERO UPFRONT COST",
      pricing: "Free to Join · Perk-Based",
      pricingDesc: "Offer 10–15% discount or welcome drink to verified squads",
      icon: Store,
      perks: [
        "Guaranteed squad footfall on slow weekday nights (Mon–Thu)",
        "Direct radar map blip with partner venue verification badge",
        "Average squad spend: PKR 4,500 – PKR 12,000 per table",
        "Hosts book tables through Solo-No-More with 2-hour advance notice",
        "Zero setup cost or proprietary hardware needed",
      ],
      optionalUpgrade: "Featured Radar Spotlight: PKR 15,000/mo (Top pinned placement)",
    },
    {
      title: "Artist & Musician Residency",
      subtitle: "For Indie Artists, Bands, Standup Comedians & DJs",
      badge: "90% TICKET PAYOUT",
      pricing: "10% Platform Commission",
      pricingDesc: "Keep 90% of every ticket sold · Automated 24h bank payout",
      icon: Music,
      perks: [
        "Sell tickets directly to our network of engaged youth looking for plans",
        "Venue Matching: We pair artists with acoustic cafes & rooftop hosts",
        "Built-in mobile QR ticket scanner for door security",
        "Live attendee telemetry & member squad chat lobby",
        "Protection against ticket fraud and duplicate passes",
      ],
      optionalUpgrade: "Artist Spotlight & Press Push: Included for Verified Artists",
    },
    {
      title: "Sports Arena & Padel Courts",
      subtitle: "For Padel Courts, Futsal Turf & Badminton Arenas",
      badge: "FILL EMPTY SLOTS",
      pricing: "5% Slot Booking Fee",
      pricingDesc: "Fill off-peak court slots with ready-to-play squads",
      icon: TrendingUp,
      perks: [
        "Solo players combine into 4-player padel doubles effortlessly",
        "Turn unbooked midday and late-night hours into revenue",
        "Direct court link embedded inside the Beacon Broadcaster",
        "Automated upfront court fee collection so no one bails",
        "Direct integration with WhatsApp booking confirmation",
      ],
      optionalUpgrade: "Dedicated Weekly Tournament Hosting: Custom arrangement",
    },
  ];

  return (
    <div style={{ background: "#060408", minHeight: "100vh", color: "#FFFFFF", position: "relative" }}>
      <SubpageNavbar activePage="/partners" />

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
              <Handshake className="w-3.5 h-3.5" /> VENUE, CAFE &amp; ARTIST PARTNERSHIPS
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
              Partner Registration &amp; Pricing Structure
            </h1>
            <p style={{ fontSize: "18px", color: "rgba(255, 255, 255, 0.65)", lineHeight: 1.6, margin: 0 }}>
              Connect your venue, court, or creative performance to thousands of active verified members across cities nationwide.
            </p>
          </div>

          {/* Pricing & Structure Cards Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
              gap: "32px",
              alignItems: "stretch",
              marginBottom: "80px",
            }}
          >
            {partnerTiers.map((tier, idx) => {
              const Icon = tier.icon;
              const isHighlight = tier.title.includes("Artist & Musician");
              return (
                <div
                  key={idx}
                  style={{
                    background: isHighlight
                      ? "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 40%, #E6450A 75%, #BD3000 100%)"
                      : "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                    border: isHighlight ? "2px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "28px",
                    padding: "36px 30px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    backdropFilter: "blur(12px)",
                    boxShadow: isHighlight ? "0 30px 80px rgba(255,90,31,0.45)" : "0 24px 60px rgba(0,0,0,0.5)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {isHighlight && (
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
                  )}

                  <div style={{ position: "relative", zIndex: 1 }}>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "14px",
                          background: isHighlight ? "#0E0714" : "rgba(255, 90, 31, 0.15)",
                          border: isHighlight ? "1.5px solid rgba(255,255,255,0.3)" : "1px solid rgba(255, 90, 31, 0.35)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon className={"w-6 h-6 " + (isHighlight ? "text-[#FF8A3D]" : "text-[#FF5A1F]")} />
                      </div>
                      <span
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 900,
                          color: isHighlight ? "#FFFFFF" : "#27C93F",
                          background: isHighlight ? "#0E0714" : "rgba(39,201,63,0.15)",
                          border: isHighlight ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(39,201,63,0.3)",
                          padding: "4px 10px",
                          borderRadius: "999px",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {tier.badge}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "22px", fontWeight: 900, margin: "0 0 4px", color: "#FFFFFF" }}>
                      {tier.title}
                    </h3>
                    <p style={{ fontSize: "13px", color: isHighlight ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.55)", margin: "0 0 20px" }}>
                      {tier.subtitle}
                    </p>

                    {/* Pricing Box */}
                    <div
                      style={{
                        background: isHighlight ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.4)",
                        border: isHighlight ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "16px",
                        padding: "16px",
                        marginBottom: "24px",
                      }}
                    >
                      <div style={{ fontSize: "18px", fontWeight: 900, color: isHighlight ? "#FFFFFF" : "#FF8A3D" }}>{tier.pricing}</div>
                      <div style={{ fontSize: "12.5px", color: isHighlight ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.6)", marginTop: "4px" }}>{tier.pricingDesc}</div>
                    </div>

                    {/* Perks List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 800, color: isHighlight ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        What You Get:
                      </span>
                      {tier.perks.map((p, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13.5px", color: isHighlight ? "#FFFFFF" : "rgba(255,255,255,0.85)", fontWeight: isHighlight ? 600 : 400 }}>
                          <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: isHighlight ? "#0E0714" : "rgba(39,201,63,0.18)", border: isHighlight ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(39,201,63,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                            <Check className="w-3 h-3 text-[#27C93F]" />
                          </div>
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Optional add-on note */}
                  <div style={{ position: "relative", zIndex: 1, paddingTop: "16px", borderTop: isHighlight ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.08)", fontSize: "12px", color: isHighlight ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.5)" }}>
                    ✨ {tier.optionalUpgrade}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Partner Registration Form Section */}
          <div
            id="register-form"
            style={{
              background: "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "32px",
              padding: "clamp(30px, 4.5vw, 56px)",
              backdropFilter: "blur(14px)",
              maxWidth: "880px",
              margin: "0 auto",
              boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "36px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,90,31,0.15)", color: "#FF5A1F", padding: "4px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: 800, marginBottom: "12px" }}>
                <Sparkles className="w-3.5 h-3.5" /> INSTANT ONBOARDING
              </div>
              <h2 style={{ fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 900, margin: "0 0 10px", color: "#fff" }}>
                Submit Your Partner Application
              </h2>
              <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", margin: 0 }}>
                Our partnerships team will review your application and activate your listing within 24 hours.
              </p>
            </div>

            {submitted ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <ShieldCheck className="w-16 h-16 text-[#27C93F] mx-auto mb-4" />
                <h3 style={{ fontSize: "24px", fontWeight: 900, margin: "0 0 8px" }}>Application Received!</h3>
                <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.7)", maxWidth: "520px", margin: "0 auto 24px" }}>
                  Thank you <strong>{contactName}</strong> from <strong>{businessName}</strong>. Our partnerships lead will connect with you via WhatsApp ({phone}) within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "none",
                    color: "#fff",
                    padding: "10px 24px",
                    borderRadius: "10px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Submit Another Venue
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Partner Category Selector */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                    Select Your Category:
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
                    {[
                      { id: "venue", label: "Cafe / Restaurant ☕" },
                      { id: "artist", label: "Artist / Musician 🎸" },
                      { id: "sports", label: "Padel / Sports Court 🏐" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setPartnerType(t.id as any)}
                        style={{
                          padding: "11px 14px",
                          borderRadius: "12px",
                          fontSize: "13px",
                          fontWeight: 800,
                          border: "1px solid " + (partnerType === t.id ? "#FF5A1F" : "rgba(255,255,255,0.14)"),
                          background: partnerType === t.id ? "rgba(255,90,31,0.2)" : "rgba(0,0,0,0.4)",
                          color: partnerType === t.id ? "#fff" : "rgba(255,255,255,0.7)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                      Venue / Artist Name
                    </label>
                    <input
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Smash Arena, Dali Cafe"
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.5)",
                        border: "1px solid rgba(255,255,255,0.14)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        color: "#fff",
                        fontSize: "14px",
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                      Contact Person
                    </label>
                    <input
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Daniyal Khan"
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.5)",
                        border: "1px solid rgba(255,255,255,0.14)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        color: "#fff",
                        fontSize: "14px",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                      Email Address
                    </label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contact@business.com"
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.5)",
                        border: "1px solid rgba(255,255,255,0.14)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        color: "#fff",
                        fontSize: "14px",
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                      WhatsApp Number
                    </label>
                    <input
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0300 1234567"
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.5)",
                        border: "1px solid rgba(255,255,255,0.14)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        color: "#fff",
                        fontSize: "14px",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                      Location / Neighborhood
                    </label>
                    <input
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Zamzama DHA Phase V, Karachi"
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.5)",
                        border: "1px solid rgba(255,255,255,0.14)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        color: "#fff",
                        fontSize: "14px",
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                      Instagram Handle / Website
                    </label>
                    <input
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@handle"
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.5)",
                        border: "1px solid rgba(255,255,255,0.14)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        color: "#fff",
                        fontSize: "14px",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: "8px",
                    background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 45%, #E6450A 100%)",
                    border: "none",
                    borderRadius: "14px",
                    padding: "15px",
                    color: "#fff",
                    fontSize: "14.5px",
                    fontWeight: 900,
                    letterSpacing: "0.03em",
                    cursor: "pointer",
                    boxShadow: "0 10px 28px rgba(255, 90, 31, 0.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    opacity: loading ? 0.75 : 1,
                  }}
                >
                  <Send className="w-4 h-4" />
                  {loading ? "SUBMITTING REGISTRATION…" : "REGISTER AS PARTNER"}
                </button>
              </form>
            )}
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
            <Sparkles className="w-3.5 h-3.5" /> BESPOKE COLLABORATIONS
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
            Have a Unique Space or Residency Concept?
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
            Whether you run a specialty coffee bar, an underground music warehouse, or a padel facility, our partnership curators will help tailor the perfect squad integration.
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
            <a
              href="#register-form"
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
              <span>Register Your Venue / Collective</span>
              <ArrowRight className="w-4 h-4 text-[#FF8A3D]" />
            </a>
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
              <span>Talk with Concierge</span>
              <ArrowRight className="w-4 h-4 text-[#FF5A1F]" />
            </Link>
          </div>
        </div>
      </section>

      <SubpageFooter />
    </div>
  );
}
