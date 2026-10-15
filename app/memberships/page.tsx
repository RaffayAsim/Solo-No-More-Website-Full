"use client";

import { useState } from "react";
import Link from "next/link";
import SubpageNavbar from "@/components/SubpageNavbar";
import SubpageFooter from "@/components/SubpageFooter";
import { Crown, Check, Sparkles, Zap, Shield, ArrowRight, Star, HelpCircle } from "lucide-react";

export default function MembershipsPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const plans = [
    {
      id: "explorer",
      name: "Community Explorer",
      badge: "FREE FOREVER",
      priceMonthly: "PKR 0",
      priceAnnual: "PKR 0",
      period: "forever",
      desc: "For newcomers exploring real-world squads and occasional weekend meetups.",
      features: [
        "Access to Live Vibe Radar across all cities",
        "Join up to 3 public squads per month",
        "Standard member verification badge",
        "Access to public cafe & padel meetups",
        "Standard squad chat lobby",
      ],
      notIncluded: [
        "Cannot broadcast personal beacons",
        "No access to secret Members-Only events",
        "No partner venue discounts",
      ],
      cta: "Join as Explorer",
      ctaHref: "/apply?plan=explorer",
      isPopular: false,
    },
    {
      id: "pro",
      name: "Solo Pass Pro",
      badge: "MOST POPULAR · RECOMMENDED",
      priceMonthly: "PKR 1,999",
      priceAnnual: "PKR 1,650",
      annualBilled: "PKR 19,800 billed yearly (Save 18%)",
      period: "per month",
      desc: "The full Solo-No-More experience. Create your own squads, broadcast anytime, and unlock secret events.",
      features: [
        "Unlimited squad joining across all cities",
        "Broadcast unlimited personal beacons",
        "Access to Secret Members-Only events & rooftop gigs",
        "15% off at all partner cafes & restaurants across your city",
        "Verified Pro Badge with glowing beacon ring",
        "Priority RSVP pass for capped squads",
        "Skip the guest waitlist",
      ],
      cta: "Get Solo Pass Pro",
      ctaHref: "/apply?plan=pro",
      isPopular: true,
    },
    {
      id: "vip",
      name: "Founder Circle VIP",
      badge: "EXCLUSIVE SYNDICATE",
      priceMonthly: "PKR 4,999",
      priceAnnual: "PKR 4,100",
      annualBilled: "PKR 49,200 billed yearly (Save 18%)",
      period: "per month",
      desc: "For active hosts, cultural curators, and tastemakers who want concierge access and guest perks.",
      features: [
        "All Solo Pass Pro perks included",
        "Free admission + 1 guest pass to monthly flagship concerts",
        "Host ticketing tools with 0% platform fee",
        "Concierge table reservations at top partner venues",
        "Direct priority access to Core Team Concierge on WhatsApp",
        "Gold Founder Badge on profile",
        "Host up to 50-person private beacons",
      ],
      cta: "Apply for Founder VIP",
      ctaHref: "/apply?plan=vip",
      isPopular: false,
    },
  ];

  return (
    <div style={{ background: "#060408", minHeight: "100vh", color: "#FFFFFF", position: "relative" }}>
      <SubpageNavbar activePage="/memberships" />

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
          {/* Header */}
          <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 40px" }}>
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
              <Crown className="w-3.5 h-3.5" /> MEMBERSHIP PACKAGES &amp; CLUB TIERS
            </div>

            <h1
              style={{
                fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
                fontSize: "clamp(34px, 5.5vw, 56px)",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                margin: "0 0 16px",
                lineHeight: 1.15,
              }}
            >
              Choose Your Squad Access Pass
            </h1>
            <p style={{ fontSize: "18px", color: "rgba(255, 255, 255, 0.65)", lineHeight: 1.6, margin: 0 }}>
              Whether you want to drop spontaneous chai meetups or unlock curated rooftop dinners, we have a membership package tailored for you.
            </p>
          </div>

          {/* Billing Cycle Switcher */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginBottom: "60px" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: "14px",
                padding: "4px",
                display: "inline-flex",
                gap: "4px",
              }}
            >
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                style={{
                  padding: "9px 20px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                  background: billingCycle === "monthly" ? "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)" : "transparent",
                  color: billingCycle === "monthly" ? "#fff" : "rgba(255,255,255,0.7)",
                  transition: "all 0.15s ease",
                }}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                style={{
                  padding: "9px 20px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                  background: billingCycle === "annual" ? "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)" : "transparent",
                  color: billingCycle === "annual" ? "#fff" : "rgba(255,255,255,0.7)",
                  transition: "all 0.15s ease",
                }}
              >
                Annual Billing (Save 18% 🎉)
              </button>
            </div>
          </div>

          {/* 3 Pricing Cards Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
              gap: "32px",
              alignItems: "stretch",
              marginBottom: "80px",
            }}
          >
            {plans.map((p) => {
              const price = billingCycle === "monthly" ? p.priceMonthly : p.priceAnnual;

              return (
                  <div
                    key={p.id}
                    style={{
                      background: p.isPopular
                        ? "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 40%, #E6450A 75%, #BD3000 100%)"
                        : "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                      border: p.isPopular ? "2px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "28px",
                      padding: "36px 30px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      backdropFilter: "blur(12px)",
                      boxShadow: p.isPopular ? "0 30px 80px rgba(255,90,31,0.45)" : "0 24px 60px rgba(0,0,0,0.5)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {p.isPopular && (
                      <>
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
                      </>
                    )}

                    <div style={{ position: "relative", zIndex: 1 }}>
                      {/* Header */}
                      <div style={{ marginBottom: "20px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: p.isPopular ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.5)", letterSpacing: "0.08em" }}>
                          {p.badge}
                        </span>
                        <h3 style={{ fontSize: "24px", fontWeight: 900, margin: "6px 0 10px", color: "#FFFFFF" }}>
                          {p.name}
                        </h3>
                        <p style={{ fontSize: "14px", color: p.isPopular ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.65)", lineHeight: 1.5, margin: 0 }}>
                          {p.desc}
                        </p>
                      </div>

                      {/* Price */}
                      <div style={{ padding: "20px 0", borderTop: p.isPopular ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.08)", borderBottom: p.isPopular ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.08)", marginBottom: "24px" }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                          <span style={{ fontSize: "38px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.03em" }}>{price}</span>
                          <span style={{ fontSize: "13px", color: p.isPopular ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)", fontWeight: 700 }}>/{p.period}</span>
                        </div>
                        {billingCycle === "annual" && p.annualBilled && (
                          <div style={{ fontSize: "12px", color: p.isPopular ? "#FFFFFF" : "#27C93F", fontWeight: 800, marginTop: "6px", background: p.isPopular ? "rgba(0,0,0,0.3)" : "transparent", display: "inline-block", padding: p.isPopular ? "2px 8px" : 0, borderRadius: "6px" }}>
                            {p.annualBilled}
                          </div>
                        )}
                      </div>

                      {/* Features list */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: p.isPopular ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          Included In Package:
                        </span>
                        {p.features.map((f, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13.5px", color: p.isPopular ? "#FFFFFF" : "rgba(255,255,255,0.85)", fontWeight: p.isPopular ? 600 : 400 }}>
                            <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: p.isPopular ? "#0E0714" : "rgba(39,201,63,0.18)", border: p.isPopular ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(39,201,63,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                              <Check className="w-3 h-3 text-[#27C93F]" />
                            </div>
                            <span>{f}</span>
                          </div>
                        ))}
                        {p.notIncluded?.map((nf, j) => (
                          <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: p.isPopular ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.4)" }}>
                            <span style={{ fontSize: "14px", lineHeight: 1, paddingLeft: "3px" }}>✕</span>
                            <span>{nf}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <Link
                        href={p.ctaHref}
                        style={{
                          width: "100%",
                          padding: "14px",
                          borderRadius: "14px",
                          fontSize: "14px",
                          fontWeight: 900,
                          letterSpacing: "0.03em",
                          textAlign: "center",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          transition: "transform 0.15s ease",
                          background: p.isPopular
                            ? "#0E0714"
                            : "rgba(255,255,255,0.1)",
                          color: "#fff",
                          boxShadow: p.isPopular ? "0 8px 24px rgba(0,0,0,0.4)" : "none",
                          border: p.isPopular ? "1.5px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.14)",
                        }}
                        className="hover:scale-[1.02]"
                      >
                        <span>{p.cta}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Guarantee Box */}
            <div
              style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "24px",
                padding: "36px",
                textAlign: "center",
                maxWidth: "800px",
                margin: "0 auto 40px",
              }}
            >
              <Shield className="w-8 h-8 text-[#27C93F] mx-auto mb-3" />
              <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 8px" }}>Zero Lock-in · Cancel Any Time</h3>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", margin: 0, lineHeight: 1.6 }}>
                We believe in delivering real-world value. If you don&apos;t meet genuine squad mates within your first month, cancel your pass with one tap in your account settings—no awkward questions asked.
              </p>
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
              <Sparkles className="w-3.5 h-3.5" /> BE PART OF THE INNER CIRCLE
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
              Ready to Upgrade Your Social Life?
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
              Whether you start with our free Community Explorer pass or get unlimited beacon privileges on Solo Pass Pro, unlock real connections without fake social rituals.
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
                href="/apply?plan=pro"
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
                <span>Claim Your Membership Pass</span>
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
                <span>Browse Active Meetups First</span>
                <ArrowRight className="w-4 h-4 text-[#FF5A1F]" />
              </Link>
            </div>
          </div>
        </section>

      <SubpageFooter />
    </div>
  );
}
