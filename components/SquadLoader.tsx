"use client";

import { useEffect, useState } from "react";

/**
 * Playful loading screen: four little "squad" blocks hop in one by one and line up
 * (solo → no more), a confetti pop, and a bouncing wordmark. Brand colours only,
 * square corners, pure CSS. Calmer for visitors who prefer reduced motion.
 */
const LINES = [
  "Rounding up your squad…",
  "Pouring the chai…",
  "Booking the padel court…",
  "Saving you a seat…",
  "Never going out alone again…",
];

const SQUAD = [
  { color: "#FF5A1F" },
  { color: "#FFA05C" },
  { color: "#C8FF00" },
  { color: "#FFFFFF" },
];

const CONFETTI = [
  { x: -70, y: -46, c: "#FF5A1F", r: 25 },
  { x: -34, y: -70, c: "#C8FF00", r: -30 },
  { x: 8, y: -78, c: "#FFA05C", r: 60 },
  { x: 46, y: -64, c: "#FFFFFF", r: -15 },
  { x: 76, y: -38, c: "#FF5A1F", r: 40 },
  { x: -84, y: -12, c: "#FFA05C", r: -50 },
  { x: 88, y: -6, c: "#C8FF00", r: 15 },
];

export default function SquadLoader({ fullScreen = true }: { fullScreen?: boolean }) {
  const [line, setLine] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setLine((i) => (i + 1) % LINES.length), 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="snm-loader"
      style={{
        minHeight: fullScreen ? "100vh" : "82vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "28px",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
        background: fullScreen ? "#060408" : "transparent",
        userSelect: "none",
      }}
    >
      {/* Warm glow + dotted floor */}
      <div aria-hidden className="snm-glow" />

      {/* The squad */}
      <div aria-hidden style={{ position: "relative", height: "96px", width: "220px" }}>
        <div className="snm-confetti">
          {CONFETTI.map((p, i) => (
            <span
              key={i}
              style={{ background: p.c, ["--x" as any]: `${p.x}px`, ["--y" as any]: `${p.y}px`, ["--r" as any]: `${p.r}deg`, animationDelay: `${0.9 + i * 0.03}s` }}
            />
          ))}
        </div>
        <div style={{ position: "absolute", bottom: "8px", left: 0, right: 0, display: "flex", justifyContent: "center", gap: "10px" }}>
          {SQUAD.map((m, i) => (
            <div key={i} className="snm-buddy" style={{ ["--c" as any]: m.color, ["--from" as any]: `${(i - 1.5) * 48}px` }}>
              <span className="snm-eye" style={{ left: "9px" }} />
              <span className="snm-eye" style={{ right: "9px" }} />
              <span className="snm-mouth" />
            </div>
          ))}
        </div>
        <div className="snm-floor" />
      </div>

      {/* Bouncing wordmark */}
      <div aria-hidden style={{ display: "flex", fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace", fontWeight: 700, fontSize: "clamp(22px, 5vw, 30px)", letterSpacing: "0.02em" }}>
        {"solo-no-more".split("").map((ch, i) => (
          <span
            key={i}
            className="snm-letter"
            style={{ animationDelay: `${i * 0.06}s`, color: i < 4 ? "#FF6F26" : ch === "-" ? "rgba(255,255,255,0.45)" : "#FFFFFF" }}
          >
            {ch}
          </span>
        ))}
      </div>

      <p key={line} className="snm-line" style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "rgba(255,255,255,0.75)", minHeight: "20px" }}>
        {LINES[line]}
      </p>

      <style>{`
        .snm-loader * { box-sizing: border-box; }
        .snm-glow {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 45% 35% at 50% 48%, rgba(255, 90, 31, 0.22), transparent 70%),
            radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px);
          background-size: auto, 22px 22px;
        }
        .snm-buddy {
          position: relative; width: 40px; height: 46px; background: var(--c);
          box-shadow: 0 6px 0 rgba(0,0,0,0.35), 0 0 22px color-mix(in srgb, var(--c) 45%, transparent);
          animation: snm-arrive 0.7s cubic-bezier(.3,1.6,.5,1) both, snm-hop 1.2s ease-in-out 0.9s infinite;
        }
        .snm-buddy:nth-child(2) { animation-delay: 0.18s, 1.05s; }
        .snm-buddy:nth-child(3) { animation-delay: 0.36s, 1.2s; }
        .snm-buddy:nth-child(4) { animation-delay: 0.54s, 1.35s; }
        .snm-eye { position: absolute; top: 14px; width: 6px; height: 8px; background: #060408; animation: snm-blink 3.2s infinite; }
        .snm-mouth { position: absolute; left: 50%; bottom: 9px; width: 16px; height: 7px; transform: translateX(-50%); border: 3px solid #060408; border-top: none; }
        .snm-floor { position: absolute; left: 10px; right: 10px; bottom: 0; height: 3px; background: linear-gradient(90deg, transparent, #FF5A1F, transparent); }
        .snm-confetti { position: absolute; left: 50%; top: 58%; }
        .snm-confetti span {
          position: absolute; width: 8px; height: 8px; opacity: 0;
          animation: snm-pop 2.4s ease-out infinite;
        }
        .snm-letter { display: inline-block; animation: snm-wave 1.6s ease-in-out infinite; }
        .snm-line { animation: snm-fade 0.4s ease-out both; }

        @keyframes snm-arrive {
          0% { transform: translate(var(--from), -60px) rotate(-25deg) scale(0.4); opacity: 0; }
          70% { transform: translate(0, 4px) rotate(6deg) scale(1.05); opacity: 1; }
          100% { transform: translate(0, 0) rotate(0) scale(1); opacity: 1; }
        }
        @keyframes snm-hop {
          0%, 100% { transform: translateY(0) scaleY(1); }
          15% { transform: translateY(2px) scaleY(0.88) scaleX(1.08); }
          45% { transform: translateY(-22px) scaleY(1.06) rotate(-4deg); }
          70% { transform: translateY(0) scaleY(0.92); }
        }
        @keyframes snm-blink { 0%, 92%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
        @keyframes snm-pop {
          0%, 30% { opacity: 0; transform: translate(0, 0) rotate(0) scale(0.4); }
          40% { opacity: 1; }
          75% { opacity: 1; transform: translate(var(--x), var(--y)) rotate(var(--r)) scale(1); }
          100% { opacity: 0; transform: translate(calc(var(--x) * 1.15), calc(var(--y) + 30px)) rotate(calc(var(--r) * 2)) scale(0.8); }
        }
        @keyframes snm-wave { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-8px); } }
        @keyframes snm-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

        @media (prefers-reduced-motion: reduce) {
          .snm-buddy, .snm-letter, .snm-confetti span, .snm-eye { animation: none !important; opacity: 1; }
          .snm-confetti { display: none; }
        }
      `}</style>
    </div>
  );
}
