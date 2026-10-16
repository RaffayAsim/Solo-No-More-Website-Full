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
        // Pinned sticky begins when rect.top reaches ~60px
        const stickyTop = 60;
        const currentDist = -(rect.top - stickyTop);
        const progress = Math.min(Math.max(currentDist / totalDist, 0), 1);
        setScrollProgress(progress);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("touchmove", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchmove", handleScroll);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Card 2 animation: starts at 0.06, completes at 0.46
  const c2Raw = Math.min(Math.max((scrollProgress - 0.06) / 0.40, 0), 1);
  const c2Ease = c2Raw < 0.5 ? 2 * c2Raw * c2Raw : 1 - Math.pow(-2 * c2Raw + 2, 2) / 2;
  // Card 2 glides up smoothly and rests at +22px offset so Card 1's top tab stays visible
  const card2YPercent = (1 - c2Ease) * 105;
  const card2YOffset = c2Ease * 22;

  // Card 3 animation: starts at 0.50, completes at 0.90
  const c3Raw = Math.min(Math.max((scrollProgress - 0.50) / 0.40, 0), 1);
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
        className="relative z-[2] text-center max-w-[680px] mx-auto mb-6 sm:mb-10 md:mb-12 px-4 sm:px-6"
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
            fontSize: "clamp(28px, 4.8vw, 54px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "#FFFFFF",
            margin: "0 0 10px",
            lineHeight: 1.1,
          }}
        >
          We&apos;re not like other invites
        </h2>
        <p className="text-sm sm:text-base md:text-[17px] text-[#A39EAC] max-w-xl mx-auto leading-relaxed">
          Everything you need to host without awkward group chats, flaky guestlists, or cash confusion.
        </p>
      </div>

      {/* Sticky Frame: Pins at top so cards stack right in front of user with 100% full visibility */}
      <div
        className="w-full px-3 sm:px-6"
        style={{
          position: "sticky",
          top: "60px",
          zIndex: 10,
          maxWidth: "1180px",
          margin: "0 auto",
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
            className="p-4 sm:p-8 md:p-12 rounded-[24px] sm:rounded-[32px] w-full min-h-[440px] sm:min-h-[480px] md:min-h-[520px]"
            style={{
              gridArea: "1 / 1 / 2 / 2",
              zIndex: 10,
              transform: "translate3d(0, 0px, 0)",
              background:
                "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 40%, #E6450A 75%, #BD3000 100%)",
              border: "1.5px solid rgba(0, 0, 0, 0.35)",
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
              className="mb-3 sm:mb-6 md:mb-7 pb-2.5 sm:pb-4 border-b border-white/20 flex items-center justify-between relative z-10"
            >
              <div className="inline-flex items-center gap-2 sm:gap-2.5">
                <span
                  className="bg-black text-white text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full tracking-wider shadow-sm"
                >
                  01
                </span>
                <span
                  className="text-[11px] sm:text-[12.5px] font-extrabold text-white tracking-wider uppercase drop-shadow-sm"
                >
                  TICKETING
                </span>
              </div>
              <div
                className="inline-flex items-center gap-1.5 bg-black/25 backdrop-blur-md border border-white/25 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10.5px] sm:text-[11.5px] font-bold text-white tracking-wide"
              >
                <span className="text-[10px] sm:text-xs">🎟️</span>
                <span>Built-in Payments</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-10 items-center relative z-10">
              {/* Left Column: Text & CTA */}
              <div className="max-w-[520px]">
                <h3
                  style={{
                    fontFamily: "var(--font-display), system-ui, sans-serif",
                    letterSpacing: "-0.03em",
                    lineHeight: 1.15,
                    textShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                  }}
                  className="text-[20px] sm:text-3xl md:text-[40px] font-extrabold text-white mb-2 sm:mb-3.5"
                >
                  New! Sell tickets for your event 🎟️
                </h3>
                <p
                  style={{
                    lineHeight: 1.45,
                    textShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
                  }}
                  className="text-xs sm:text-base md:text-[17px] text-white/95 mb-3.5 sm:mb-6 font-medium"
                >
                  Add ticket tiers, use QR code check-in, and track sales — all in one place.
                </p>
                <Link
                  href="/apply"
                  className="bg-black text-white text-xs sm:text-[14.5px] font-extrabold px-4 py-2 sm:px-7 sm:py-3 rounded-full inline-flex items-center gap-2 shadow-lg hover:bg-neutral-900 hover:scale-105 active:scale-95 cursor-pointer group transition-transform"
                >
                  <span>Get started</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Right Column: Two Grand Angled Tickets Close & Overlapping */}
              <div className="relative min-h-[220px] sm:min-h-[300px] md:min-h-[410px] flex items-center justify-center my-1 sm:my-0">
                {/* Ticket 1: Ultra Deep Onyx Night Pass (Tilted Left) */}
                <div
                  className="w-[140px] h-[230px] sm:w-[185px] sm:h-[320px] md:w-[235px] md:h-[415px] rounded-[14px] sm:rounded-[18px] p-2.5 sm:p-3 md:p-4 pb-3 sm:pb-4 md:pb-6 flex flex-col justify-between shrink-0 relative z-[1] -mr-12 sm:-mr-16 md:-mr-[75px] transition-transform border border-[#FF5A1F]/35 shadow-[0_20px_50px_rgba(0,0,0,0.85)]"
                  style={{
                    background: "linear-gradient(155deg, #1C1220 0%, #0E0713 55%, #050208 100%)",
                    transform: "rotate(-7deg)",
                  }}
                >
                  {/* Top Notch Cutout */}
                  <div
                    className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-6 sm:w-8 h-2 sm:h-2.5 bg-[#FF5A1F] rounded-b-md sm:rounded-b-lg"
                  />

                  {/* QR Box in Crisp White */}
                  <div
                    className="w-full aspect-square rounded-[10px] sm:rounded-[14px] bg-white p-2 sm:p-3 flex items-center justify-center relative shadow-md"
                  >
                    <svg viewBox="0 0 100 100" className="w-full h-full block">
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
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-[#F4F4F6] flex items-center justify-center shadow text-[9px] sm:text-xs font-black text-[#FF5A1F]"
                    >
                      ⚡
                    </div>
                  </div>

                  {/* Perforation Line */}
                  <div
                    style={{
                      height: "1px",
                      width: "100%",
                      backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.2) 50%, transparent 50%)",
                      backgroundSize: "6px 1px",
                      margin: "6px 0",
                    }}
                  />

                  {/* Ticket Details */}
                  <div className="text-white text-left pl-1 pb-1 sm:pb-2 relative">
                    <div className="text-[9.5px] sm:text-xs text-[#FF8A3D] font-semibold mb-0.5 sm:mb-1">General Admission</div>
                    <div className="text-[10.5px] sm:text-[12.5px] font-extrabold text-white mb-0.5">October 2</div>
                    <div className="text-[8.5px] sm:text-[11px] text-white/80 font-semibold">11:00 PM EST</div>
                    <span className="absolute right-1 bottom-1 text-[10px] sm:text-xs text-[#FFA05C] font-bold">★</span>
                  </div>

                  {/* Bottom Notch */}
                  <div
                    className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-6 sm:w-8 h-2 sm:h-2.5 bg-[#FF5A1F] rounded-t-md sm:rounded-t-lg"
                  />
                </div>

                {/* Ticket 2: Ultra Deep Onyx Night Pass */}
                <div
                  className="w-[140px] h-[230px] sm:w-[185px] sm:h-[320px] md:w-[235px] md:h-[415px] rounded-[14px] sm:rounded-[18px] p-2.5 sm:p-3 md:p-4 pb-3 sm:pb-4 md:pb-6 flex flex-col justify-between shrink-0 relative z-[2] border border-[#FF5A1F]/35 shadow-[0_22px_55px_rgba(0,0,0,0.9)]"
                  style={{
                    background: "linear-gradient(155deg, #1C1220 0%, #0E0713 55%, #050208 100%)",
                    transform: "rotate(7deg)",
                  }}
                >
                  {/* Top Notch */}
                  <div
                    className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-6 sm:w-8 h-2 sm:h-2.5 bg-[#FF5A1F] rounded-b-md sm:rounded-b-lg"
                  />

                  {/* QR Box in Crisp White */}
                  <div
                    className="w-full aspect-square rounded-[10px] sm:rounded-[14px] bg-white p-2 sm:p-3 flex items-center justify-center relative shadow-md"
                  >
                    <svg viewBox="0 0 100 100" className="w-full h-full block">
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
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-[#F4F4F6] flex items-center justify-center shadow text-[9px] sm:text-xs font-black text-[#FF5A1F]"
                    >
                      ⚡
                    </div>
                  </div>

                  {/* Perforation Line */}
                  <div
                    style={{
                      height: "1px",
                      width: "100%",
                      backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.2) 50%, transparent 50%)",
                      backgroundSize: "6px 1px",
                      margin: "6px 0",
                    }}
                  />

                  <div className="text-white text-left pl-1 pb-1 sm:pb-2 relative">
                    <div className="text-[9.5px] sm:text-xs text-[#FF8A3D] font-semibold mb-0.5 sm:mb-1">General Admission</div>
                    <div className="text-[10.5px] sm:text-[12.5px] font-extrabold text-white mb-0.5">December 14</div>
                    <div className="text-[8.5px] sm:text-[11px] text-white/80 font-semibold">11:00 AM EST</div>
                    <span className="absolute right-1 bottom-1 text-[10px] sm:text-xs text-[#FFA05C] font-bold">★</span>
                  </div>

                  {/* Bottom Notch */}
                  <div
                    className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-6 sm:w-8 h-2 sm:h-2.5 bg-[#FF5A1F] rounded-t-md sm:rounded-t-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ════ CARD 2: "See who's going 👀" (Grand Full-Size Orange Card, Slides UP on Scroll & Overlaps Card 1) ════ */}
          <div
            className="p-4 sm:p-8 md:p-12 rounded-[24px] sm:rounded-[32px] w-full min-h-[440px] sm:min-h-[480px] md:min-h-[520px]"
            style={{
              gridArea: "1 / 1 / 2 / 2",
              zIndex: 20,
              transform: `translate3d(0, calc(${card2YPercent}% + ${card2YOffset}px), 0)`,
              opacity: c2Raw < 0.01 ? 0 : 1,
              visibility: c2Raw < 0.01 ? "hidden" : "visible",
              willChange: "transform, opacity",
              background:
                "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 40%, #E6450A 75%, #BD3000 100%)",
              border: "1.5px solid rgba(0, 0, 0, 0.35)",
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
              className="mb-3 sm:mb-6 md:mb-7 pb-2.5 sm:pb-4 border-b border-white/20 flex items-center justify-between relative z-10"
            >
              <div className="inline-flex items-center gap-2 sm:gap-2.5">
                <span
                  className="bg-black text-white text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full tracking-wider shadow-sm"
                >
                  02
                </span>
                <span
                  className="text-[11px] sm:text-[12.5px] font-extrabold text-white tracking-wider uppercase drop-shadow-sm"
                >
                  SOCIAL RSVP &amp; GUESTLIST
                </span>
              </div>
              <div
                className="inline-flex items-center gap-1.5 bg-black/25 backdrop-blur-md border border-white/25 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10.5px] sm:text-[11.5px] font-bold text-white tracking-wide"
              >
                <span className="text-[10px] sm:text-xs">👀</span>
                <span>Live RSVPs &amp; Chat</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-10 items-center relative z-10">
              {/* Order on mobile: Text first, then graphic */}
              <div className="order-1 md:order-2 max-w-[520px]">
                <h3
                  style={{
                    fontFamily: "var(--font-display), system-ui, sans-serif",
                    letterSpacing: "-0.03em",
                    lineHeight: 1.15,
                    textShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                  }}
                  className="text-[20px] sm:text-3xl md:text-[40px] font-extrabold text-white mb-2 sm:mb-3.5"
                >
                  See who&apos;s going 👀
                </h3>
                <p
                  style={{
                    lineHeight: 1.45,
                    textShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
                  }}
                  className="text-xs sm:text-base md:text-[17px] text-white/95 mb-3.5 sm:mb-6 font-medium"
                >
                  Check out guest list bios, friends in common, questionnaire responses, and party activity.
                </p>
                <Link
                  href="/apply"
                  className="bg-black text-white text-xs sm:text-[14.5px] font-extrabold px-4 py-2 sm:px-7 sm:py-3 rounded-full inline-flex items-center gap-2 shadow-lg hover:bg-neutral-900 hover:scale-105 active:scale-95 cursor-pointer group transition-transform"
                >
                  <span>Explore guestlists</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Graphic Column: Overlapping RSVP Card (Frosted Obsidian) & Chat Card (Light) */}
              <div className="order-2 md:order-1 relative min-h-[200px] sm:min-h-[290px] md:min-h-[410px] flex items-center justify-center my-1 sm:my-0">
                {/* Card A: Upgraded Frosted Obsidian RSVP Card */}
                <div
                  className="w-[155px] sm:w-[205px] md:w-[260px] rounded-[16px] sm:rounded-[22px] p-2.5 sm:p-3.5 md:p-4 flex flex-col gap-2 sm:gap-3 shrink-0 relative z-[1] -mr-10 sm:-mr-14 md:-mr-[65px] transition-transform border border-[#FF5A1F]/30 shadow-[0_20px_50px_rgba(0,0,0,0.7)]"
                  style={{
                    background: "linear-gradient(145deg, rgba(28, 20, 36, 0.96) 0%, rgba(18, 14, 24, 0.98) 100%)",
                    transform: "rotate(-6deg)",
                  }}
                >
                  <div className="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-white/10">
                    <div className="inline-flex items-center gap-1.5 text-[8.5px] sm:text-[10px] font-extrabold text-[#FFA05C] tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#27C93F] shadow-[0_0_8px_#27C93F] inline-block" />
                      LIVE GUESTLIST
                    </div>
                    <span className="text-[8.5px] sm:text-[10px] font-extrabold text-white/50 bg-white/10 px-1.5 py-0.5 rounded">
                      32 GOING
                    </span>
                  </div>

                  {/* RSVP Row 1: Joy */}
                  <div className="flex gap-2 sm:gap-2.5 items-start">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                      alt="Joy"
                      className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full object-cover shrink-0 border-2 border-[#FF5A1F]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10.5px] sm:text-[12.5px] font-bold text-white mb-0.5 truncate">
                        Joy +1 <span className="font-normal text-white/80">Going</span> 👍
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="bg-[#FF5A1F]/20 border border-[#FF5A1F]/40 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10.5px] font-extrabold text-[#FFA05C]">
                          🎉 2
                        </span>
                        <MessageSquare className="w-3 h-3 text-orange-300" />
                        <span className="text-[9.5px] sm:text-[11px] text-white/60 font-semibold">Reply</span>
                      </div>
                    </div>
                  </div>

                  {/* RSVP Row 2: Jojo */}
                  <div className="flex gap-2 sm:gap-2.5 items-start">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                      alt="Jojo"
                      className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full object-cover shrink-0 border-2 border-white/25"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10.5px] sm:text-[12.5px] font-bold text-white mb-0.5 truncate">
                        Jojo <span className="font-normal text-white/80">Maybe</span> 🤔
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="bg-white/10 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10.5px] font-extrabold text-white/70">
                          👀 1
                        </span>
                        <MessageSquare className="w-3 h-3 text-orange-300" />
                        <span className="text-[9.5px] sm:text-[11px] text-white/60 font-semibold">Reply</span>
                      </div>
                    </div>
                  </div>

                  {/* RSVP Row 3: Matt */}
                  <div className="flex gap-2 sm:gap-2.5 items-start">
                    <img
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
                      alt="Matt"
                      className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full object-cover shrink-0 border-2 border-[#FFA05C]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10.5px] sm:text-[12.5px] font-bold text-white mb-0.5 truncate">
                        Matt <span className="font-normal text-white/80">Going</span> 🔥
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="bg-[#FF5A1F]/20 border border-[#FF5A1F]/40 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10.5px] font-extrabold text-[#FFA05C]">
                          🙌 4
                        </span>
                        <MessageSquare className="w-3 h-3 text-orange-300" />
                        <span className="text-[9.5px] sm:text-[11px] text-white/60 font-semibold">Reply</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card B: Light Chat Card */}
                <div
                  className="w-[155px] sm:w-[205px] md:w-[260px] rounded-[16px] sm:rounded-[22px] bg-white p-2.5 sm:p-3.5 md:p-4 flex flex-col gap-2 sm:gap-3 shrink-0 relative z-[2] border border-[#FF5A1F]/35 shadow-[0_22px_55px_rgba(0,0,0,0.55)]"
                  style={{
                    transform: "rotate(6deg)",
                  }}
                >
                  <div className="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-gray-100">
                    <div className="text-[8.5px] sm:text-[10px] font-extrabold text-[#FF5A1F] tracking-wider">
                      PARTY ACTIVITY
                    </div>
                    <span className="text-[8.5px] sm:text-[10px] font-bold text-gray-500">Just now</span>
                  </div>

                  <div className="flex gap-2 sm:gap-2.5 items-start">
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                      alt="User"
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] sm:text-xs font-extrabold text-gray-900 mb-0.5 truncate">Amina K.</div>
                      <div className="text-[9.5px] sm:text-[11.5px] text-gray-800 leading-snug mb-1 line-clamp-2">
                        Bringing matcha &amp; polaroids! 📸
                      </div>
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded-full text-[8.5px] sm:text-[10px] text-gray-700 font-bold">
                        ❤️ 5
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 sm:gap-2.5 items-start">
                    <img
                      src="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80"
                      alt="User"
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] sm:text-xs font-extrabold text-gray-900 mb-0.5 truncate">Hamza R.</div>
                      <div className="text-[9.5px] sm:text-[11.5px] text-gray-800 leading-snug mb-1 line-clamp-2">
                        Anyone carpool Clifton Block 4? 🚗
                      </div>
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded-full text-[8.5px] sm:text-[10px] text-gray-700 font-bold">
                        🙋 2
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ════ CARD 3: "Text Blast your guests 📣" (Grand Full-Size Orange Card, Slides UP on Scroll & Overlaps Card 2) ════ */}
          <div
            className="p-4 sm:p-8 md:p-12 rounded-[24px] sm:rounded-[32px] w-full min-h-[440px] sm:min-h-[480px] md:min-h-[520px]"
            style={{
              gridArea: "1 / 1 / 2 / 2",
              zIndex: 30,
              transform: `translate3d(0, calc(${card3YPercent}% + ${card3YOffset}px), 0)`,
              opacity: c3Raw < 0.01 ? 0 : 1,
              visibility: c3Raw < 0.01 ? "hidden" : "visible",
              willChange: "transform, opacity",
              background:
                "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 40%, #E6450A 75%, #BD3000 100%)",
              border: "1.5px solid rgba(0, 0, 0, 0.35)",
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
              className="mb-3 sm:mb-6 md:mb-7 pb-2.5 sm:pb-4 border-b border-white/20 flex items-center justify-between relative z-10"
            >
              <div className="inline-flex items-center gap-2 sm:gap-2.5">
                <span
                  className="bg-black text-white text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full tracking-wider shadow-sm"
                >
                  03
                </span>
                <span
                  className="text-[11px] sm:text-[12.5px] font-extrabold text-white tracking-wider uppercase drop-shadow-sm"
                >
                  INSTANT BLASTS
                </span>
              </div>
              <div
                className="inline-flex items-center gap-1.5 bg-black/25 backdrop-blur-md border border-white/25 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10.5px] sm:text-[11.5px] font-bold text-white tracking-wide"
              >
                <span className="text-[10px] sm:text-xs">📣</span>
                <span>Instant Host Blasts</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-10 items-center relative z-10">
              {/* Left Column: Text & CTA */}
              <div className="max-w-[520px]">
                <h3
                  style={{
                    fontFamily: "var(--font-display), system-ui, sans-serif",
                    letterSpacing: "-0.03em",
                    lineHeight: 1.15,
                    textShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                  }}
                  className="text-[20px] sm:text-3xl md:text-[40px] font-extrabold text-white mb-2 sm:mb-3.5"
                >
                  Text Blast your guests 📣
                </h3>
                <p
                  style={{
                    lineHeight: 1.45,
                    textShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
                  }}
                  className="text-xs sm:text-base md:text-[17px] text-white/95 mb-3.5 sm:mb-6 font-medium"
                >
                  Running late, need more drinks, 10 people texting you asking how to get in? Send updates to everyone at once.
                </p>
                <Link
                  href="/apply"
                  className="bg-black text-white text-xs sm:text-[14.5px] font-extrabold px-4 py-2 sm:px-7 sm:py-3 rounded-full inline-flex items-center gap-2 shadow-lg hover:bg-neutral-900 hover:scale-105 active:scale-95 cursor-pointer group transition-transform"
                >
                  <span>Create event</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Right Column: Grand iOS iMessage Mockup */}
              <div className="max-w-[280px] sm:max-w-[340px] md:max-w-[390px] w-full mx-auto relative my-1 sm:my-0">
                <div
                  className="bg-white rounded-[20px] sm:rounded-[24px] border border-white/20 shadow-[0_24px_60px_rgba(0,0,0,0.75)] overflow-visible relative"
                >
                  <div
                    className="h-[55px] sm:h-[70px] md:h-[85px] rounded-t-[19px] sm:rounded-t-[23px] relative"
                    style={{
                      background: "linear-gradient(135deg, #FF6B35 0%, #FF5A1F 60%, #E64A19 100%)",
                    }}
                  />

                  {/* Popout Host Avatar with Megaphone */}
                  <div className="absolute top-4 sm:top-5 md:top-7 left-3.5 sm:left-4 md:left-5 z-10">
                    <div className="relative">
                      <img
                        src="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=160&auto=format&fit=crop&q=80"
                        alt="Host"
                        className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full object-cover border-2 sm:border-[3.5px] border-[#FF5A1F] shadow-md block"
                      />
                      <div className="absolute -bottom-1 -right-2 text-base sm:text-xl md:text-2xl -rotate-12 drop-shadow">
                        📣
                      </div>
                    </div>
                  </div>

                  {/* iMessage Chat Body */}
                  <div className="pt-7 sm:pt-9 md:pt-10 px-3 sm:px-4 md:px-5 pb-3 sm:pb-4 bg-white rounded-b-[19px] sm:rounded-b-[23px]">
                    <div className="text-center text-gray-400 text-[9.5px] sm:text-[11px] font-medium mb-2 sm:mb-3">
                      Today 6:00 PM
                    </div>
                    <div className="bg-[#E9E9EB] rounded-2xl p-2 sm:p-3 text-black text-xs sm:text-[13.5px] leading-snug mb-1.5 sm:mb-2.5 max-w-[90%] shadow-sm">
                      The host of Birthday Bash sent you a Text Blast 📣
                    </div>
                    <div className="bg-[#E9E9EB] rounded-2xl p-2 sm:p-3 text-black text-xs sm:text-[13.5px] leading-snug mb-2 sm:mb-3 max-w-[90%] shadow-sm">
                      Hey!! Buzz #2 when you arrive 🥳 Can&apos;t wait to celebrate!
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#E5E5EA] flex items-center justify-center text-gray-500 text-sm font-light">
                        +
                      </div>
                      <div className="flex-1 h-7 sm:h-8 rounded-full border border-[#D1D1D6] flex items-center justify-between px-3 bg-white">
                        <span className="text-gray-400 text-xs sm:text-[13.5px]">iMessage</span>
                        <Mic className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                    </div>
                    <div className="w-20 sm:w-28 h-1 bg-black rounded-full mx-auto" />
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
