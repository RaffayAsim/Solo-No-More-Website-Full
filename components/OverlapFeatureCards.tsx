"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, MessageSquare, Mic } from "lucide-react";

export default function OverlapFeatureCards() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (rafId.current !== null) return;
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        if (!sectionRef.current) return;
        const rect = sectionRef.current.getBoundingClientRect();
        const windowH = window.innerHeight;
        // Total scrollable distance of the sticky cards track
        const totalDist = rect.height - windowH;
        if (totalDist <= 0) return;
        // Pinned sticky begins when rect.top reaches ~65px
        const stickyTop = 65;
        const currentDist = -(rect.top - stickyTop);
        const progress = Math.min(Math.max(currentDist / totalDist, 0), 1);
        setScrollProgress(progress);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Card 2 animation: starts at 0.10, completes at 0.48
  const c2Raw = Math.min(Math.max((scrollProgress - 0.10) / 0.38, 0), 1);
  const c2Ease = c2Raw < 0.5 ? 2 * c2Raw * c2Raw : 1 - Math.pow(-2 * c2Raw + 2, 2) / 2;
  // Card 2 glides up smoothly and rests at +22px offset so Card 1's top tab stays visible
  const card2YPercent = (1 - c2Ease) * 105;
  const card2YOffset = c2Ease * 22;

  // Card 3 animation: starts at 0.52, completes at 0.90
  const c3Raw = Math.min(Math.max((scrollProgress - 0.52) / 0.38, 0), 1);
  const c3Ease = c3Raw < 0.5 ? 2 * c3Raw * c3Raw : 1 - Math.pow(-2 * c3Raw + 2, 2) / 2;
  // Card 3 glides up smoothly and rests at +44px offset so Card 2's top tab stays visible
  const card3YPercent = (1 - c3Ease) * 105;
  const card3YOffset = c3Ease * 44;

  return (
    <section
      id="features-section"
      ref={sectionRef}
      style={{
        background: "#060408",
        color: "#FFFFFF",
        width: "100%",
        position: "relative",
        height: "280vh",
        overflow: "visible",
        paddingTop: "70px",
      }}
    >
      {/* Subtle Geometric Dotted Texture Overlay on Main Black Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.18) 1.25px, transparent 1.25px)",
          backgroundSize: "22px 22px",
          backgroundPosition: "center",
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.85,
        }}
        aria-hidden="true"
      />

      {/* Section Header (In normal document flow: scrolls naturally above sticky cards so cards have 100% full viewport space) */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          maxWidth: "680px",
          margin: "0 auto 50px",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(255, 90, 31, 0.14)",
            border: "1px solid rgba(255, 90, 31, 0.35)",
            padding: "6px 16px",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: 800,
            color: "#FF8A3D",
            letterSpacing: "0.08em",
            marginBottom: "14px",
          }}
        >
          PURPOSE-BUILT FOR REAL GATHERINGS
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display), system-ui, sans-serif",
            fontSize: "clamp(34px, 4.8vw, 54px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "#FFFFFF",
            margin: "0 0 12px",
            lineHeight: 1.1,
          }}
        >
          We&apos;re not like other invites
        </h2>
        <p style={{ fontSize: "17px", color: "#A39EAC", margin: "0 auto", lineHeight: 1.55 }}>
          Everything you need to host without awkward group chats, flaky guestlists, or cash confusion.
        </p>
      </div>

      {/* Sticky Frame: Pins at top so cards stack right in front of user with 100% full visibility */}
      <div
        className="sticky top-[60px] md:top-[70px] w-full"
        style={{
          zIndex: 10,
          maxWidth: "1180px",
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ════ STACKING CARDS VIEWPORT (CSS GRID: SAME FRAME FOR ALL 3 FULL-SIZE CARDS) ════ */}
        <div
          style={{
            position: "relative",
            width: "100%",
            display: "grid",
            gridTemplateColumns: "1fr",
            gridTemplateRows: "1fr",
          }}
        >
          {/* ════ CARD 1: "New! Sell tickets for your event 🎟️" (Grand Full-Size Orange Card, Stays Still) ════ */}
          <div
            className="p-6 sm:p-9 md:p-12"
            style={{
              gridArea: "1 / 1 / 2 / 2",
              zIndex: 10,
              transform: "translate3d(0, 0px, 0)",
              width: "100%",
              minHeight: "520px",
              background:
                "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 40%, #E6450A 75%, #BD3000 100%)",
              border: "1.5px solid rgba(0, 0, 0, 0.35)",
              borderRadius: "32px",
              boxShadow:
                "0 28px 75px rgba(0, 0, 0, 0.8), 0 0 45px rgba(255, 90, 31, 0.35)",
              position: "relative",
              overflow: "hidden",
              pointerEvents: c2Raw < 0.8 ? "auto" : "none",
            }}
          >
            {/* Subtle Geometric Dotted Texture Overlay Inside Card */}
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

            {/* Card Top Indicator / Header Tab */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "28px",
                paddingBottom: "16px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.22)",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    background: "#000000",
                    color: "#FFFFFF",
                    fontSize: "11px",
                    fontWeight: 900,
                    padding: "4px 12px",
                    borderRadius: "999px",
                    letterSpacing: "0.08em",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
                  }}
                >
                  01
                </span>
                <span
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 800,
                    color: "#FFFFFF",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    textShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  TICKETING
                </span>
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(0, 0, 0, 0.22)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  padding: "5px 14px",
                  borderRadius: "999px",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  letterSpacing: "0.03em",
                }}
              >
                <span style={{ fontSize: "11px" }}>🎟️</span>
                <span>Built-in Payments</span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
                gap: "40px",
                alignItems: "center",
                position: "relative",
                zIndex: 1,
              }}
            >
              {/* Left Column: Text & CTA */}
              <div style={{ maxWidth: "520px" }}>
                <h3
                  style={{
                    fontFamily: "var(--font-display), system-ui, sans-serif",
                    fontSize: "clamp(28px, 3.6vw, 42px)",
                    fontWeight: 800,
                    color: "#FFFFFF",
                    letterSpacing: "-0.03em",
                    margin: "0 0 14px",
                    lineHeight: 1.15,
                    textShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  New! Sell tickets for your event 🎟️
                </h3>
                <p
                  style={{
                    fontSize: "clamp(15px, 1.8vw, 18px)",
                    color: "#FFFFFF",
                    lineHeight: 1.5,
                    margin: "0 0 26px",
                    fontWeight: 500,
                    textShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  Add ticket tiers, use QR code check-in, and track sales — all in one place.
                </p>
                <Link
                  href="/apply"
                  style={{
                    background: "#000000",
                    color: "#FFFFFF",
                    fontSize: "14.5px",
                    fontWeight: 800,
                    padding: "13px 30px",
                    borderRadius: "999px",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
                    transition: "transform 0.15s ease, background 0.15s ease",
                  }}
                  className="hover:bg-neutral-900 hover:scale-105 active:scale-95 cursor-pointer group"
                >
                  <span>Get started</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Right Column: Two Grand Angled Tickets Close & Overlapping (Full-Size 430px) */}
              <div
                style={{
                  position: "relative",
                  minHeight: "410px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Ticket 1: Ultra Deep Onyx Night Pass (Tilted Left) */}
                <div
                  style={{
                    width: "235px",
                    height: "415px",
                    borderRadius: "18px",
                    background: "linear-gradient(155deg, #1C1220 0%, #0E0713 55%, #050208 100%)",
                    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(255, 90, 31, 0.25)",
                    transform: "rotate(-7deg)",
                    position: "relative",
                    padding: "16px 14px 26px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    flexShrink: 0,
                    zIndex: 1,
                    marginRight: "-75px",
                    transition: "transform 0.3s ease",
                    border: "1.5px solid rgba(255, 90, 31, 0.35)",
                  }}
                >
                  {/* Top Notch Cutout */}
                  <div
                    style={{
                      position: "absolute",
                      top: "-1px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "32px",
                      height: "11px",
                      background: "#FF5A1F",
                      borderBottomLeftRadius: "12px",
                      borderBottomRightRadius: "12px",
                    }}
                  />

                  {/* QR Box in Crisp White */}
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      borderRadius: "14px",
                      background: "#FFFFFF",
                      padding: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      boxShadow: "0 6px 18px rgba(0, 0, 0, 0.5)",
                    }}
                  >
                    <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", display: "block" }}>
                      <rect x="10" y="10" width="24" height="24" fill="#000000" rx="3" />
                      <rect x="15" y="15" width="14" height="14" fill="#FFFFFF" rx="2" />
                      <rect x="19" y="19" width="6" height="6" fill="#000000" />

                      <rect x="66" y="10" width="24" height="24" fill="#000000" rx="3" />
                      <rect x="71" y="15" width="14" height="14" fill="#FFFFFF" rx="2" />
                      <rect x="75" y="19" width="6" height="6" fill="#000000" />

                      <rect x="10" y="66" width="24" height="24" fill="#000000" rx="3" />
                      <rect x="15" y="71" width="14" height="14" fill="#FFFFFF" rx="2" />
                      <rect x="19" y="75" width="6" height="6" fill="#000000" />

                      <rect x="42" y="12" width="6" height="6" fill="#000000" />
                      <rect x="52" y="12" width="6" height="6" fill="#000000" />
                      <rect x="42" y="24" width="6" height="6" fill="#000000" />
                      <rect x="46" y="38" width="6" height="6" fill="#000000" />
                      <rect x="56" y="38" width="6" height="6" fill="#000000" />
                      <rect x="66" y="46" width="6" height="6" fill="#000000" />
                      <rect x="42" y="56" width="6" height="6" fill="#000000" />
                      <rect x="54" y="66" width="6" height="6" fill="#000000" />
                      <rect x="66" y="74" width="6" height="6" fill="#000000" />
                      <rect x="78" y="66" width="6" height="6" fill="#000000" />
                    </svg>

                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "#F4F4F6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.25)",
                        fontSize: "11px",
                        fontWeight: 900,
                        color: "#FF5A1F",
                      }}
                    >
                      ?
                    </div>
                  </div>

                  {/* Perforation Line */}
                  <div
                    style={{
                      height: "1px",
                      width: "100%",
                      backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.2) 50%, transparent 50%)",
                      backgroundSize: "6px 1px",
                      margin: "10px 0",
                    }}
                  />

                  {/* Ticket Details */}
                  <div style={{ color: "#FFFFFF", textAlign: "left", paddingLeft: "4px", paddingBottom: "10px", position: "relative" }}>
                    <div style={{ fontSize: "12px", color: "#FF8A3D", fontWeight: 600, marginBottom: "6px" }}>General Admission</div>
                    <div style={{ fontSize: "12.5px", fontWeight: 800, color: "#FFFFFF", marginBottom: "4px" }}>October 2</div>
                    <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.8)", fontWeight: 600 }}>11:00 PM EST</div>
                    <span style={{ position: "absolute", right: "4px", bottom: "8px", fontSize: "11px", color: "#FFA05C", fontWeight: 700 }}>★</span>
                  </div>

                  {/* Bottom Notch */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-1px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "32px",
                      height: "11px",
                      background: "#FF5A1F",
                      borderTopLeftRadius: "12px",
                      borderTopRightRadius: "12px",
                    }}
                  />
                </div>

                {/* Ticket 2: Ultra Deep Onyx Night Pass */}
                <div
                  style={{
                    width: "235px",
                    height: "415px",
                    borderRadius: "18px",
                    background: "linear-gradient(155deg, #1C1220 0%, #0E0713 55%, #050208 100%)",
                    boxShadow: "0 28px 65px rgba(0, 0, 0, 0.9), 0 0 40px rgba(255, 90, 31, 0.25)",
                    transform: "rotate(7deg)",
                    position: "relative",
                    padding: "16px 14px 26px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    flexShrink: 0,
                    zIndex: 2,
                    border: "1.5px solid rgba(255, 90, 31, 0.35)",
                  }}
                >
                  {/* Top Notch */}
                  <div
                    style={{
                      position: "absolute",
                      top: "-1px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "32px",
                      height: "11px",
                      background: "#FF5A1F",
                      borderBottomLeftRadius: "12px",
                      borderBottomRightRadius: "12px",
                    }}
                  />

                  {/* QR Box in Crisp White */}
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      borderRadius: "14px",
                      background: "#FFFFFF",
                      padding: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      boxShadow: "0 6px 18px rgba(0, 0, 0, 0.5)",
                    }}
                  >
                    <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", display: "block" }}>
                      <rect x="10" y="10" width="24" height="24" fill="#000000" rx="3" />
                      <rect x="15" y="15" width="14" height="14" fill="#FFFFFF" rx="2" />
                      <rect x="19" y="19" width="6" height="6" fill="#000000" />

                      <rect x="66" y="10" width="24" height="24" fill="#000000" rx="3" />
                      <rect x="71" y="15" width="14" height="14" fill="#FFFFFF" rx="2" />
                      <rect x="75" y="19" width="6" height="6" fill="#000000" />

                      <rect x="10" y="66" width="24" height="24" fill="#000000" rx="3" />
                      <rect x="15" y="71" width="14" height="14" fill="#FFFFFF" rx="2" />
                      <rect x="19" y="75" width="6" height="6" fill="#000000" />

                      <rect x="42" y="12" width="6" height="6" fill="#000000" />
                      <rect x="52" y="12" width="6" height="6" fill="#000000" />
                      <rect x="42" y="24" width="6" height="6" fill="#000000" />
                      <rect x="46" y="38" width="6" height="6" fill="#000000" />
                      <rect x="56" y="38" width="6" height="6" fill="#000000" />
                      <rect x="66" y="46" width="6" height="6" fill="#000000" />
                      <rect x="42" y="56" width="6" height="6" fill="#000000" />
                      <rect x="54" y="66" width="6" height="6" fill="#000000" />
                      <rect x="66" y="74" width="6" height="6" fill="#000000" />
                      <rect x="78" y="66" width="6" height="6" fill="#000000" />
                    </svg>

                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "#F4F4F6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.25)",
                        fontSize: "11px",
                        fontWeight: 900,
                        color: "#FF5A1F",
                      }}
                    >
                      ?
                    </div>
                  </div>

                  <div
                    style={{
                      height: "1px",
                      width: "100%",
                      backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.2) 50%, transparent 50%)",
                      backgroundSize: "6px 1px",
                      margin: "10px 0",
                    }}
                  />

                  <div style={{ color: "#FFFFFF", textAlign: "left", paddingLeft: "4px", paddingBottom: "10px", position: "relative" }}>
                    <div style={{ fontSize: "12px", color: "#FF8A3D", fontWeight: 600, marginBottom: "6px" }}>General Admission</div>
                    <div style={{ fontSize: "12.5px", fontWeight: 800, color: "#FFFFFF", marginBottom: "4px" }}>December 14</div>
                    <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.8)", fontWeight: 600 }}>11:00 AM EST</div>
                    <span style={{ position: "absolute", right: "4px", bottom: "8px", fontSize: "11px", color: "#FFA05C", fontWeight: 700 }}>?</span>
                  </div>

                  <div
                    style={{
                      position: "absolute",
                      bottom: "-1px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "32px",
                      height: "11px",
                      background: "#FF5A1F",
                      borderTopLeftRadius: "12px",
                      borderTopRightRadius: "12px",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ════ CARD 2: "See who's going 👀" (Grand Full-Size Orange Card, Slides UP on Scroll & Overlaps Card 1) ════ */}
          <div
            className="p-6 sm:p-9 md:p-12"
            style={{
              gridArea: "1 / 1 / 2 / 2",
              zIndex: 20,
              transform: `translate3d(0, calc(${card2YPercent}% + ${card2YOffset}px), 0)`,
              opacity: c2Raw === 0 ? 0 : 1,
              visibility: c2Raw === 0 ? "hidden" : "visible",
              willChange: "transform, opacity",
              width: "100%",
              minHeight: "520px",
              background:
                "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 40%, #E6450A 75%, #BD3000 100%)",
              border: "1.5px solid rgba(0, 0, 0, 0.35)",
              borderRadius: "32px",
              boxShadow:
                "0 -22px 65px rgba(0, 0, 0, 0.9), 0 35px 90px rgba(0, 0, 0, 0.9), 0 0 50px rgba(255, 90, 31, 0.4)",
              position: "relative",
              overflow: "hidden",
              pointerEvents: c2Raw >= 0.8 && c3Raw < 0.8 ? "auto" : "none",
            }}
          >
            {/* Subtle Geometric Dotted Texture Overlay Inside Card */}
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

            {/* Card Top Indicator / Header Tab */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "28px",
                paddingBottom: "16px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.22)",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    background: "#000000",
                    color: "#FFFFFF",
                    fontSize: "11px",
                    fontWeight: 900,
                    padding: "4px 12px",
                    borderRadius: "999px",
                    letterSpacing: "0.08em",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
                  }}
                >
                  02
                </span>
                <span
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 800,
                    color: "#FFFFFF",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    textShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  SOCIAL RSVP &amp; GUESTLIST
                </span>
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(0, 0, 0, 0.22)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  padding: "5px 14px",
                  borderRadius: "999px",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  letterSpacing: "0.03em",
                }}
              >
                <span style={{ fontSize: "11px" }}>👀</span>
                <span>Live RSVPs &amp; Chat</span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
                gap: "40px",
                alignItems: "center",
                position: "relative",
                zIndex: 1,
              }}
            >
              {/* Left Column: Overlapping RSVP Card (Frosted Obsidian) & Chat Card (Light) */}
              <div
                style={{
                  position: "relative",
                  minHeight: "410px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Card A: Upgraded Frosted Obsidian RSVP Card */}
                <div
                  style={{
                    width: "260px",
                    borderRadius: "22px",
                    background: "linear-gradient(145deg, rgba(28, 20, 36, 0.96) 0%, rgba(18, 14, 24, 0.98) 100%)",
                    border: "1.5px solid rgba(255, 90, 31, 0.28)",
                    boxShadow: "0 24px 55px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 90, 31, 0.15)",
                    transform: "rotate(-6deg)",
                    padding: "18px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    flexShrink: 0,
                    zIndex: 1,
                    marginRight: "-65px",
                    transition: "transform 0.3s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: 800, color: "#FFA05C", letterSpacing: "0.08em" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#27C93F", boxShadow: "0 0 8px #27C93F", display: "inline-block" }} />
                      LIVE GUESTLIST
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: 800, color: "rgba(255, 255, 255, 0.5)", background: "rgba(255, 255, 255, 0.08)", padding: "2px 6px", borderRadius: "4px" }}>
                      32 GOING
                    </span>
                  </div>

                  {/* RSVP Row 1: Joy */}
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                      alt="Joy"
                      style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #FF5A1F" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#FFFFFF", marginBottom: "4px" }}>
                        Joy +1 <span style={{ fontWeight: 500, color: "rgba(255, 255, 255, 0.85)" }}>rsvped Going</span> 👍
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            background: "rgba(255, 90, 31, 0.22)",
                            border: "1px solid rgba(255, 90, 31, 0.4)",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            fontSize: "10.5px",
                            fontWeight: 800,
                            color: "#FFA05C",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          🎉 2
                        </span>
                        <MessageSquare className="w-3.5 h-3.5 text-orange-300" />
                        <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.6)", fontWeight: 600 }}>Reply</span>
                      </div>
                    </div>
                  </div>

                  {/* RSVP Row 2: Jojo */}
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                      alt="Jojo"
                      style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid rgba(255, 255, 255, 0.25)" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#FFFFFF", marginBottom: "4px" }}>
                        Jojo <span style={{ fontWeight: 500, color: "rgba(255, 255, 255, 0.85)" }}>rsvped Maybe</span> 🤔
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            background: "rgba(255, 255, 255, 0.08)",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            fontSize: "10.5px",
                            fontWeight: 800,
                            color: "rgba(255, 255, 255, 0.7)",
                          }}
                        >
                          👀 1
                        </span>
                        <MessageSquare className="w-3.5 h-3.5 text-orange-300" />
                        <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.6)", fontWeight: 600 }}>Reply</span>
                      </div>
                    </div>
                  </div>

                  {/* RSVP Row 3: Matt */}
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <img
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
                      alt="Matt"
                      style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #FFA05C" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#FFFFFF", marginBottom: "4px" }}>
                        Matt <span style={{ fontWeight: 500, color: "rgba(255, 255, 255, 0.85)" }}>rsvped Going</span> 🔥
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            background: "rgba(255, 90, 31, 0.22)",
                            border: "1px solid rgba(255, 90, 31, 0.4)",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            fontSize: "10.5px",
                            fontWeight: 800,
                            color: "#FFA05C",
                          }}
                        >
                          🙌 4
                        </span>
                        <MessageSquare className="w-3.5 h-3.5 text-orange-300" />
                        <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.6)", fontWeight: 600 }}>Reply</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card B: Light Chat Card */}
                <div
                  style={{
                    width: "260px",
                    borderRadius: "22px",
                    background: "#FFFFFF",
                    boxShadow: "0 26px 60px rgba(0, 0, 0, 0.55), 0 0 30px rgba(255, 90, 31, 0.2)",
                    transform: "rotate(6deg)",
                    padding: "18px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    flexShrink: 0,
                    zIndex: 2,
                    border: "1.5px solid rgba(255, 90, 31, 0.35)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #F3F4F6" }}>
                    <div style={{ fontSize: "10px", fontWeight: 800, color: "#FF5A1F", letterSpacing: "0.08em" }}>
                      PARTY ACTIVITY
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#6B7280" }}>Just now</span>
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                      alt="User"
                      style={{ width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "12px", fontWeight: 800, color: "#111827", marginBottom: "2px" }}>Amina K.</div>
                      <div style={{ fontSize: "11.5px", color: "#1F2937", lineHeight: 1.35, marginBottom: "5px" }}>
                        Bringing iced matcha latte &amp; polaroid film! 📸🍵
                      </div>
                      <span style={{ background: "#F3F4F6", padding: "3px 8px", borderRadius: "999px", fontSize: "10px", color: "#374151", fontWeight: 700 }}>
                        ❤️ 5
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <img
                      src="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80"
                      alt="User"
                      style={{ width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "12px", fontWeight: 800, color: "#111827", marginBottom: "2px" }}>Hamza R.</div>
                      <div style={{ fontSize: "11.5px", color: "#1F2937", lineHeight: 1.35, marginBottom: "5px" }}>
                        Can anyone carpool from Clifton Block 4? 🚗
                      </div>
                      <span style={{ background: "#F3F4F6", padding: "3px 8px", borderRadius: "999px", fontSize: "10px", color: "#374151", fontWeight: 700 }}>
                        🙋 2 replies
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Text & CTA */}
              <div style={{ maxWidth: "520px" }}>
                <h3
                  style={{
                    fontFamily: "var(--font-display), system-ui, sans-serif",
                    fontSize: "clamp(28px, 3.6vw, 42px)",
                    fontWeight: 800,
                    color: "#FFFFFF",
                    letterSpacing: "-0.03em",
                    margin: "0 0 14px",
                    lineHeight: 1.15,
                    textShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  See who&apos;s going 👀
                </h3>
                <p
                  style={{
                    fontSize: "clamp(15px, 1.8vw, 18px)",
                    color: "#FFFFFF",
                    lineHeight: 1.5,
                    margin: "0 0 26px",
                    fontWeight: 500,
                    textShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  Check out guest list bios, friends in common, questionnaire responses, and party activity.
                </p>
                <Link
                  href="/apply"
                  style={{
                    background: "#000000",
                    color: "#FFFFFF",
                    fontSize: "14.5px",
                    fontWeight: 800,
                    padding: "13px 30px",
                    borderRadius: "999px",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
                    transition: "transform 0.15s ease, background 0.15s ease",
                  }}
                  className="hover:bg-neutral-900 hover:scale-105 active:scale-95 cursor-pointer group"
                >
                  <span>Explore guestlists</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* ════ CARD 3: "Text Blast your guests 📣" (Grand Full-Size Orange Card, Slides UP on Scroll & Overlaps Card 2) ════ */}
          <div
            className="p-6 sm:p-9 md:p-12"
            style={{
              gridArea: "1 / 1 / 2 / 2",
              zIndex: 30,
              transform: `translate3d(0, calc(${card3YPercent}% + ${card3YOffset}px), 0)`,
              opacity: c3Raw === 0 ? 0 : 1,
              visibility: c3Raw === 0 ? "hidden" : "visible",
              willChange: "transform, opacity",
              width: "100%",
              minHeight: "520px",
              background:
                "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 40%, #E6450A 75%, #BD3000 100%)",
              border: "1.5px solid rgba(0, 0, 0, 0.35)",
              borderRadius: "32px",
              boxShadow:
                "0 -22px 65px rgba(0, 0, 0, 0.9), 0 35px 90px rgba(0, 0, 0, 0.9), 0 0 50px rgba(255, 90, 31, 0.4)",
              position: "relative",
              overflow: "hidden",
              pointerEvents: c3Raw >= 0.8 ? "auto" : "none",
            }}
          >
            {/* Subtle Geometric Dotted Texture Overlay Inside Card */}
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

            {/* Card Top Indicator / Header Tab */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "28px",
                paddingBottom: "16px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.22)",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    background: "#000000",
                    color: "#FFFFFF",
                    fontSize: "11px",
                    fontWeight: 900,
                    padding: "4px 12px",
                    borderRadius: "999px",
                    letterSpacing: "0.08em",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
                  }}
                >
                  03
                </span>
                <span
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 800,
                    color: "#FFFFFF",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    textShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  INSTANT BLASTS
                </span>
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(0, 0, 0, 0.22)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  padding: "5px 14px",
                  borderRadius: "999px",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  letterSpacing: "0.03em",
                }}
              >
                <span style={{ fontSize: "11px" }}>📣</span>
                <span>Instant Host Blasts</span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
                gap: "40px",
                alignItems: "center",
                position: "relative",
                zIndex: 1,
              }}
            >
              {/* Left Column: Text & CTA */}
              <div style={{ maxWidth: "520px" }}>
                <h3
                  style={{
                    fontFamily: "var(--font-display), system-ui, sans-serif",
                    fontSize: "clamp(28px, 3.6vw, 42px)",
                    fontWeight: 800,
                    color: "#FFFFFF",
                    letterSpacing: "-0.03em",
                    margin: "0 0 14px",
                    lineHeight: 1.15,
                    textShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  Text Blast your guests 📣
                </h3>
                <p
                  style={{
                    fontSize: "clamp(15px, 1.8vw, 18px)",
                    color: "#FFFFFF",
                    lineHeight: 1.5,
                    margin: "0 0 26px",
                    fontWeight: 500,
                    textShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  Running late, need more drinks, 10 people texting you asking how to get in? Send updates to everyone at once.
                </p>
                <Link
                  href="/apply"
                  style={{
                    background: "#000000",
                    color: "#FFFFFF",
                    fontSize: "14.5px",
                    fontWeight: 800,
                    padding: "13px 30px",
                    borderRadius: "999px",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
                    transition: "transform 0.15s ease, background 0.15s ease",
                  }}
                  className="hover:bg-neutral-900 hover:scale-105 active:scale-95 cursor-pointer group"
                >
                  <span>Create event</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Right Column: Grand iOS iMessage Mockup (Full-Size 410px) */}
              <div
                style={{
                  maxWidth: "390px",
                  width: "100%",
                  margin: "0 auto",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    background: "#FFFFFF",
                    borderRadius: "24px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 28px 70px rgba(0, 0, 0, 0.75), 0 0 40px rgba(255, 90, 31, 0.18)",
                    overflow: "visible",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      background: "linear-gradient(135deg, #FF6B35 0%, #FF5A1F 60%, #E64A19 100%)",
                      height: "85px",
                      borderTopLeftRadius: "23px",
                      borderTopRightRadius: "23px",
                      position: "relative",
                    }}
                  />

                  {/* Popout Host Avatar with Megaphone */}
                  <div
                    style={{
                      position: "absolute",
                      top: "28px",
                      left: "20px",
                      zIndex: 10,
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <img
                        src="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=160&auto=format&fit=crop&q=80"
                        alt="Host"
                        style={{
                          width: "66px",
                          height: "66px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "3.5px solid #FF5A1F",
                          boxShadow: "0 8px 22px rgba(0, 0, 0, 0.35)",
                          display: "block",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          bottom: "-2px",
                          right: "-12px",
                          fontSize: "24px",
                          transform: "rotate(-12deg)",
                          filter: "drop-shadow(0 4px 10px rgba(255, 90, 31, 0.4))",
                        }}
                      >
                        📣
                      </div>
                      <svg
                        viewBox="0 0 50 50"
                        style={{
                          position: "absolute",
                          left: "60px",
                          top: "14px",
                          width: "38px",
                          height: "38px",
                          pointerEvents: "none",
                          overflow: "visible",
                        }}
                      >
                        <path d="M4 14 L-4 12" stroke="#FFA05C" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M12 8 L8 -2" stroke="#FFA05C" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M22 6 L24 -4" stroke="#FFA05C" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M28 12 L38 4" stroke="#FFA05C" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>

                  {/* iMessage Chat Body */}
                  <div
                    style={{
                      padding: "40px 18px 18px",
                      background: "#FFFFFF",
                      borderBottomLeftRadius: "23px",
                      borderBottomRightRadius: "23px",
                    }}
                  >
                    <div
                      style={{
                        textAlign: "center",
                        color: "#8E8E93",
                        fontSize: "11px",
                        fontWeight: 500,
                        marginBottom: "14px",
                      }}
                    >
                      Today 6:00 PM
                    </div>
                    <div
                      style={{
                        background: "#E9E9EB",
                        borderRadius: "18px",
                        padding: "12px 16px",
                        color: "#000000",
                        fontSize: "13.5px",
                        lineHeight: 1.4,
                        marginBottom: "10px",
                        maxWidth: "88%",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      }}
                    >
                      The host of Birthday Bash sent you a Text Blast 📣
                    </div>
                    <div
                      style={{
                        background: "#E9E9EB",
                        borderRadius: "18px",
                        padding: "12px 16px",
                        color: "#000000",
                        fontSize: "13.5px",
                        lineHeight: 1.4,
                        marginBottom: "14px",
                        maxWidth: "88%",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      }}
                    >
                      Hey!! Buzz #2 when you arrive 🥳 Can&apos;t wait to celebrate!
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          background: "#E5E5EA",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#8E8E93",
                          fontSize: "18px",
                          fontWeight: 300,
                          cursor: "default",
                        }}
                      >
                        +
                      </div>
                      <div
                        style={{
                          flex: 1,
                          height: "35px",
                          borderRadius: "999px",
                          border: "1px solid #D1D1D6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0 14px",
                          background: "#FFFFFF",
                        }}
                      >
                        <span style={{ color: "#8E8E93", fontSize: "13.5px" }}>iMessage</span>
                        <Mic className="w-4 h-4 text-[#8E8E93]" />
                      </div>
                    </div>
                    <div
                      style={{
                        width: "125px",
                        height: "5px",
                        background: "#000000",
                        borderRadius: "999px",
                        margin: "0 auto",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
