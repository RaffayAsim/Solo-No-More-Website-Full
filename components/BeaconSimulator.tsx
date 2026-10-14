"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Radio, Send, Users, Check, Zap, Sparkles, Smartphone } from "lucide-react";

type City = "Karachi" | "Lahore" | "Islamabad";
type Vibe = "casual" | "sports" | "nightlife";
type Phase = "idle" | "sending" | "live";

interface Blip {
  id: string;
  title: string;
  place: string;
  vibe: Vibe;
  joined: number;
  slots: number;
  x: number; // % within radar
  y: number;
}

interface FeedItem {
  id: number;
  kind: "log" | "request" | "joined";
  text: string;
  name?: string;
}

const CITIES: City[] = ["Karachi", "Lahore", "Islamabad"];

const BLIPS: Record<City, Blip[]> = {
  Karachi: [
    { id: "k1", title: "Late Night Chai & FIFA", place: "Chai Shai, DHA", vibe: "casual", joined: 3, slots: 4, x: 66, y: 30 },
    { id: "k2", title: "Sunset Beach Volleyball", place: "Clifton Beach", vibe: "sports", joined: 7, slots: 10, x: 28, y: 62 },
    { id: "k3", title: "Boardgames & Coffee", place: "Dali Cafe, Zamzama", vibe: "casual", joined: 2, slots: 6, x: 72, y: 70 },
  ],
  Lahore: [
    { id: "l1", title: "Gulberg Padel Doubles", place: "Smash Arena, Gulberg", vibe: "sports", joined: 3, slots: 4, x: 34, y: 28 },
    { id: "l2", title: "Walled City Food Walk", place: "Delhi Gate", vibe: "casual", joined: 8, slots: 12, x: 70, y: 46 },
    { id: "l3", title: "Rooftop Acoustic Night", place: "MM Alam Road", vibe: "nightlife", joined: 11, slots: 20, x: 40, y: 72 },
  ],
  Islamabad: [
    { id: "i1", title: "Margalla Sunrise Hike", place: "Trail 3, F-6", vibe: "sports", joined: 5, slots: 8, x: 62, y: 26 },
    { id: "i2", title: "Chai at Kohsar", place: "Kohsar Market", vibe: "casual", joined: 2, slots: 5, x: 30, y: 52 },
    { id: "i3", title: "Board Game Takeover", place: "F-7 Markaz", vibe: "casual", joined: 4, slots: 8, x: 68, y: 74 },
  ],
};

const VIBES: { id: Vibe; label: string; emoji: string }[] = [
  { id: "casual", label: "Casual", emoji: "☕" },
  { id: "sports", label: "Sports", emoji: "🏐" },
  { id: "nightlife", label: "Nightlife", emoji: "🌙" },
];

const TIMES = ["Tonight · 9:00 PM", "Tonight · 11:00 PM", "Tomorrow · 6:00 PM"];

const MEMBERS = ["Aisha", "Zain", "Hamza", "Sana", "Bilal", "Maryam"];

const ORANGE = "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 45%, #E6450A 100%)";

const panel: React.CSSProperties = {
  background: "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "24px",
  padding: "22px",
  textAlign: "left",
  backdropFilter: "blur(10px)",
  boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
  display: "flex",
  flexDirection: "column",
  height: "100%",
  boxSizing: "border-box",
};

const panelTitle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "12px",
  fontWeight: 900,
  letterSpacing: "0.1em",
  color: "#FF8A3D",
  textTransform: "uppercase",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(0,0,0,0.45)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: "12px",
  padding: "11px 14px",
  color: "#fff",
  fontSize: "14px",
  fontWeight: 600,
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "0.08em",
  color: "rgba(255,255,255,0.55)",
  textTransform: "uppercase",
  margin: "14px 0 7px",
};

export default function BeaconSimulator() {
  const [city, setCity] = useState<City>("Karachi");
  const [selected, setSelected] = useState<Blip | null>(null);

  const [title, setTitle] = useState("Late Night Chai & FIFA");
  const [place, setPlace] = useState("Chai Shai, DHA Phase 6");
  const [vibe, setVibe] = useState<Vibe>("casual");
  const [slots, setSlots] = useState(6);
  const [time, setTime] = useState(TIMES[1]);

  const [phase, setPhase] = useState<Phase>("idle");
  const [joined, setJoined] = useState(1);
  const [feed, setFeed] = useState<FeedItem[]>([]);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const idRef = useRef(0);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  const push = (item: Omit<FeedItem, "id">) => {
    idRef.current += 1;
    const id = idRef.current;
    setFeed((prev) => [{ ...item, id }, ...prev].slice(0, 5));
  };

  const later = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const handleBroadcast = () => {
    if (!title.trim() || !place.trim()) return;

    if (phase === "live") {
      push({ kind: "log", text: `Beacon updated → "${title}" · ${time}` });
      return;
    }

    clearTimers();
    setFeed([]);
    setJoined(1);
    setPhase("sending");
    push({ kind: "log", text: `Transmitting signal across ${city}…` });

    later(1100, () => {
      setPhase("live");
      push({ kind: "log", text: `Beacon is LIVE · 14 members nearby notified` });
    });

    const order = [...MEMBERS].sort(() => Math.random() - 0.5);
    later(2400, () => push({ kind: "log", text: `${order[0]} detected your signal 📡` }));
    later(3600, () => push({ kind: "request", name: order[0], text: `${order[0]} wants to join your squad` }));
    later(5200, () => push({ kind: "request", name: order[1], text: `${order[1]} wants to join your squad` }));
    later(7000, () => push({ kind: "request", name: order[2], text: `${order[2]} wants to join your squad` }));
  };

  const approve = (item: FeedItem) => {
    if (joined >= slots) {
      push({ kind: "log", text: "Squad is full — raise slots to accept more" });
      return;
    }
    setFeed((prev) => prev.map((f) => (f.id === item.id ? { ...f, kind: "joined", text: `${item.name} joined the squad ✓` } : f)));
    setJoined((j) => j + 1);
  };

  const reset = () => {
    clearTimers();
    setPhase("idle");
    setFeed([]);
    setJoined(1);
  };

  const vibeInfo = VIBES.find((v) => v.id === vibe)!;
  const fillPct = Math.min(100, Math.round((joined / Math.max(slots, 1)) * 100));
  const canSend = title.trim().length > 0 && place.trim().length > 0;

  const otherBlips = BLIPS[city];

  return (
    <section
      id="events-section"
      style={{
        padding: "90px 0 100px",
        width: "100%",
        textAlign: "center",
        background: "#060408",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes bsSweep { to { transform: rotate(360deg); } }
        @keyframes bsPing { 0% { transform: translate(-50%,-50%) scale(.6); opacity: .9; } 100% { transform: translate(-50%,-50%) scale(3.2); opacity: 0; } }
        @keyframes bsSlideIn { from { opacity: 0; transform: translateY(-14px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes bsBlink { 50% { opacity: .35; } }
        .bs-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(18px, 2vw, 28px); align-items: stretch; }
        @media (max-width: 1080px) { .bs-grid { grid-template-columns: 1fr; max-width: 560px; margin: 0 auto; } }
        .bs-chip { transition: all .16s ease; cursor: pointer; }
        .bs-chip:hover { transform: translateY(-1px); border-color: rgba(255,90,31,.6) !important; }
        .bs-input:focus { border-color: #FF5A1F !important; box-shadow: 0 0 0 3px rgba(255,90,31,.18); }
      `}</style>

      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.18) 1.25px, transparent 1.25px)",
          backgroundSize: "22px 22px",
          backgroundPosition: "center",
          pointerEvents: "none",
          opacity: 0.85,
        }}
        aria-hidden="true"
      />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "1560px", margin: "0 auto", padding: "0 clamp(20px, 3.5vw, 56px)" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            background: "rgba(255, 90, 31, 0.12)",
            border: "1px solid rgba(255, 90, 31, 0.3)",
            padding: "5px 14px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 800,
            color: "#FF5A1F",
            marginBottom: "16px",
            letterSpacing: "0.04em",
          }}
        >
          <Sparkles className="w-3.5 h-3.5" /> TRY IT LIVE · NO SIGN-UP
        </div>

        <h2
          style={{
            fontFamily: "var(--font-display), system-ui, sans-serif",
            fontSize: "clamp(32px, 5vw, 54px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            margin: "0 0 14px",
            color: "#FFFFFF",
            lineHeight: 1.15,
          }}
        >
          Drop a Beacon. Meet in Real Life.
        </h2>
        <p style={{ fontSize: "17.5px", color: "rgba(255,255,255,0.65)", margin: "0 auto 44px", maxWidth: "620px", fontWeight: 500 }}>
          Create a mock meetup below and watch it hit the radar, show up in the member app, and pull in join requests — in real time.
        </p>

        <div className="bs-grid">
          {/* ───────── 1. LIVE VIBE RADAR ───────── */}
          <div style={panel}>
            <div style={panelTitle}>
              <Radio className="w-4 h-4" /> Live Vibe Radar
            </div>
            <div style={{ display: "flex", gap: "6px", margin: "8px 0 14px", flexWrap: "wrap" }}>
              {CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="bs-chip"
                  onClick={() => {
                    setCity(c);
                    setSelected(null);
                  }}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "999px",
                    fontSize: "11.5px",
                    fontWeight: 800,
                    border: "1px solid " + (city === c ? "transparent" : "rgba(255,255,255,0.16)"),
                    background: city === c ? ORANGE : "rgba(0,0,0,0.35)",
                    color: "#fff",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Radar disc */}
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "240px",
                margin: "0 auto",
                aspectRatio: "1",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(255,90,31,0.10) 0%, rgba(255,90,31,0.03) 55%, rgba(0,0,0,0.55) 100%)",
                border: "1px solid rgba(255,90,31,0.35)",
                overflow: "hidden",
              }}
            >
              {[34, 66, 94].map((r) => (
                <div
                  key={r}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: `${r}%`,
                    height: `${r}%`,
                    transform: "translate(-50%,-50%)",
                    border: "1px dashed rgba(255,255,255,0.12)",
                    borderRadius: "50%",
                  }}
                />
              ))}
              <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: "1px", background: "rgba(255,255,255,0.08)" }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: "1px", background: "rgba(255,255,255,0.08)" }} />

              {/* sweep */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "conic-gradient(from 0deg, rgba(255,90,31,0.45) 0deg, rgba(255,90,31,0) 70deg, transparent 360deg)",
                  animation: "bsSweep 4s linear infinite",
                  borderRadius: "50%",
                }}
              />

              {/* you */}
              <div style={{ position: "absolute", top: "50%", left: "50%", width: "10px", height: "10px", background: "#fff", borderRadius: "50%", transform: "translate(-50%,-50%)", boxShadow: "0 0 10px #fff" }} />

              {otherBlips.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  aria-label={b.title}
                  onClick={() => setSelected(b)}
                  style={{
                    position: "absolute",
                    left: `${b.x}%`,
                    top: `${b.y}%`,
                    width: "16px",
                    height: "16px",
                    transform: "translate(-50%,-50%)",
                    borderRadius: "50%",
                    border: "2px solid #0B0912",
                    background: selected?.id === b.id ? "#FFFFFF" : "#27C93F",
                    boxShadow: "0 0 14px rgba(39,201,63,0.9)",
                    cursor: "pointer",
                    padding: 0,
                  }}
                />
              ))}

              {/* user's live beacon */}
              {phase !== "idle" && (
                <div style={{ position: "absolute", left: "50%", top: "22%" }}>
                  <div style={{ position: "absolute", width: "18px", height: "18px", borderRadius: "50%", border: "2px solid #FF5A1F", animation: "bsPing 1.8s ease-out infinite" }} />
                  <div style={{ position: "absolute", width: "14px", height: "14px", borderRadius: "50%", background: "#FF5A1F", transform: "translate(-50%,-50%)", boxShadow: "0 0 16px #FF5A1F" }} />
                </div>
              )}
            </div>

            <div style={{ marginTop: "12px", minHeight: "68px" }}>
              {selected ? (
                <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(39,201,63,0.35)", borderRadius: "14px", padding: "10px 14px", animation: "bsSlideIn .25s ease" }}>
                  <div style={{ fontSize: "10px", fontWeight: 900, color: "#27C93F", letterSpacing: "0.1em" }}>
                    {selected.vibe.toUpperCase()} · {selected.joined}/{selected.slots} JOINED
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#fff", margin: "3px 0" }}>{selected.title}</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: "5px" }}>
                    <MapPin className="w-3 h-3" style={{ color: "#FF5A1F" }} /> {selected.place}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.5 }}>
                  Tap a glowing green blip to intercept a live event broadcasting in <strong style={{ color: "#fff" }}>{city}</strong>.
                </p>
              )}
            </div>
          
            {/* telemetry */}
            <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "14px" }}>
              <div style={{ ...panelTitle, color: "rgba(255,255,255,0.55)", marginBottom: "8px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: phase === "idle" ? "#555" : "#27C93F", animation: phase === "idle" ? "none" : "bsBlink 1.2s infinite" }} />
                Real-time telemetry feed
              </div>
              {feed.length === 0 ? (
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.45 }}>
                  Broadcast your signal to watch members detect it and request to join.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "170px", overflowY: "auto", paddingRight: "2px" }}>
                  {feed.map((f) => (
                    <div
                      key={f.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        fontSize: "12px",
                        fontWeight: 600,
                        padding: "7px 10px",
                        borderRadius: "10px",
                        background: f.kind === "request" ? "rgba(255,90,31,0.14)" : f.kind === "joined" ? "rgba(39,201,63,0.14)" : "rgba(255,255,255,0.05)",
                        border: "1px solid " + (f.kind === "request" ? "rgba(255,90,31,0.4)" : f.kind === "joined" ? "rgba(39,201,63,0.4)" : "rgba(255,255,255,0.08)"),
                        color: "rgba(255,255,255,0.88)",
                        animation: "bsSlideIn .3s ease",
                      }}
                    >
                      <span>{f.text}</span>
                      {f.kind === "request" && (
                        <button
                          type="button"
                          onClick={() => approve(f)}
                          style={{ background: ORANGE, border: "none", color: "#fff", fontSize: "11px", fontWeight: 900, padding: "5px 11px", borderRadius: "999px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", flexShrink: 0 }}
                        >
                          <Check className="w-3 h-3" /> Accept
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ───────── 2. BEACON BROADCASTER ───────── */}
          <div style={panel}>
            <div style={panelTitle}>
              <Zap className="w-4 h-4" /> Beacon Broadcaster
            </div>
            <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.6)", margin: "2px 0 8px", lineHeight: 1.4 }}>
              {phase === "live"
                ? "You're live! Edit anything — the phone preview updates instantly."
                : "Fill it in, hit broadcast, and watch your plan go live."}
            </p>

            <label style={{ ...labelStyle, margin: "10px 0 5px" }}>1 · What is the plan?</label>
            <input className="bs-input" style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., FIFA & Chai, Sunset Run" maxLength={42} />

            <label style={{ ...labelStyle, margin: "10px 0 5px" }}>2 · Where are you meeting?</label>
            <input className="bs-input" style={inputStyle} value={place} onChange={(e) => setPlace(e.target.value)} placeholder="e.g., DHA Phase 6, Gulberg" maxLength={40} />

            <label style={{ ...labelStyle, margin: "10px 0 5px" }}>3 · Pick the vibe</label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {VIBES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className="bs-chip"
                  onClick={() => setVibe(v.id)}
                  style={{
                    flex: 1,
                    minWidth: "75px",
                    padding: "8px 6px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 800,
                    color: "#fff",
                    border: "1px solid " + (vibe === v.id ? "transparent" : "rgba(255,255,255,0.14)"),
                    background: vibe === v.id ? ORANGE : "rgba(0,0,0,0.4)",
                    boxShadow: vibe === v.id ? "0 6px 18px rgba(255,90,31,0.4)" : "none",
                  }}
                >
                  {v.emoji} {v.label}
                </button>
              ))}
            </div>

            <label style={{ ...labelStyle, margin: "10px 0 5px" }}>4 · When &amp; how many?</label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
              {TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="bs-chip"
                  onClick={() => setTime(t)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: time === t ? "#fff" : "rgba(255,255,255,0.7)",
                    border: "1px solid " + (time === t ? "#FF5A1F" : "rgba(255,255,255,0.14)"),
                    background: time === t ? "rgba(255,90,31,0.2)" : "rgba(0,0,0,0.4)",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "10px", padding: "7px 11px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.8)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Users className="w-4 h-4" style={{ color: "#FF8A3D" }} /> Squad size
              </span>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                <button type="button" aria-label="fewer" onClick={() => setSlots((s) => Math.max(2, s - 1))} style={stepBtn}>
                  <span style={{ fontSize: "16px", lineHeight: 1, fontWeight: 800 }}>−</span>
                </button>
                <span style={{ minWidth: "20px", textAlign: "center", fontWeight: 900, color: "#fff" }}>{slots}</span>
                <button type="button" aria-label="more" onClick={() => setSlots((s) => Math.min(30, s + 1))} style={stepBtn}>
                  <span style={{ fontSize: "16px", lineHeight: 1, fontWeight: 800 }}>+</span>
                </button>
              </div>
            </div>

            <div style={{ marginTop: "auto", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={handleBroadcast}
                disabled={!canSend || phase === "sending"}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: "12px",
                  border: "none",
                  fontSize: "13.5px",
                  fontWeight: 900,
                  letterSpacing: "0.04em",
                  color: "#fff",
                  cursor: canSend ? "pointer" : "not-allowed",
                  background: canSend ? ORANGE : "rgba(255,255,255,0.1)",
                  boxShadow: canSend ? "0 10px 28px rgba(255,90,31,0.45)" : "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  opacity: phase === "sending" ? 0.75 : 1,
                }}
              >
                <Send className="w-4 h-4" />
                {phase === "sending" ? "BROADCASTING…" : phase === "live" ? "UPDATE BEACON" : "BROADCAST SIGNAL"}
              </button>
              {phase === "live" && (
                <button type="button" onClick={reset} style={{ width: "100%", marginTop: "8px", background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                  Reset demo
                </button>
              )}
            </div>
          </div>

          {/* ───────── 3. MEMBER APP PREVIEW ───────── */}
          <div style={panel}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2px" }}>
              <div style={panelTitle}>
                <Smartphone className="w-4 h-4" /> Member App Preview
              </div>
              <span style={{ fontSize: "9.5px", fontWeight: 900, color: "#27C93F", display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(39,201,63,0.12)", border: "1px solid rgba(39,201,63,0.3)", padding: "2px 8px", borderRadius: "999px" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#27C93F", animation: "bsBlink 1.2s infinite" }} /> LIVE FEED
              </span>
            </div>
            <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.6)", margin: "2px 0 12px", lineHeight: 1.4 }}>
              Live preview of how your meetup appears in members&apos; phones.
            </p>

            {/* Phone device mockup */}
            <div
              style={{
                flex: 1,
                width: "100%",
                maxWidth: "340px",
                margin: "0 auto",
                borderRadius: "28px",
                padding: "8px",
                background: "linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                border: "1px solid rgba(255,255,255,0.16)",
                boxShadow: "0 18px 45px rgba(0,0,0,0.6), 0 0 30px rgba(255,90,31,0.12)",
                display: "flex",
                flexDirection: "column",
                minHeight: "420px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  background: "#0B0912",
                  borderRadius: "22px",
                  overflow: "hidden",
                  position: "relative",
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                }}
              >
                {/* Notch */}
                <div style={{ width: "76px", height: "16px", background: "#000", borderRadius: "0 0 12px 12px", margin: "0 auto", flexShrink: 0 }} />

                {/* Header inside phone */}
                <div style={{ padding: "8px 14px 6px", flexShrink: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#FF5A1F", fontWeight: 900, fontSize: "13.5px", letterSpacing: "-0.03em" }}>solo-no-more</span>
                    <span style={{ fontSize: "8.5px", fontWeight: 900, color: "#27C93F", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#27C93F", animation: "bsBlink 1.2s infinite" }} /> LIVE
                    </span>
                  </div>
                  <div style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.5)", fontWeight: 700, marginTop: "6px", letterSpacing: "0.08em" }}>
                    {city.toUpperCase()} RADAR
                  </div>
                </div>

                {/* Cards feed */}
                <div style={{ padding: "0 10px 48px", display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto", flex: 1 }}>
                  {phase !== "idle" && (
                    <div
                      key={phase === "sending" ? "s" : "l"}
                      style={{
                        borderRadius: "14px",
                        padding: "10px 11px",
                        background: "linear-gradient(145deg, rgba(255,111,38,0.22), rgba(230,69,10,0.1))",
                        border: "1.5px solid #FF5A1F",
                        boxShadow: "0 8px 20px rgba(255,90,31,0.25)",
                        animation: "bsSlideIn .4s ease",
                        opacity: phase === "sending" ? 0.6 : 1,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", fontWeight: 900, letterSpacing: "0.08em" }}>
                        <span style={{ color: "#FFA05C" }}>{vibeInfo.emoji} {vibeInfo.label.toUpperCase()}</span>
                        <span style={{ background: "#FF5A1F", color: "#fff", padding: "2px 6px", borderRadius: "999px" }}>NEW · YOURS</span>
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff", margin: "4px 0 2px", lineHeight: 1.25 }}>{title || "Your plan title"}</div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin className="w-3 h-3" style={{ color: "#FF5A1F" }} /> {place || "Pick a spot"}
                      </div>
                      <div style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.55)", margin: "2px 0 6px" }}>{time}</div>
                      <div style={{ height: "5px", borderRadius: "999px", background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
                        <div style={{ width: `${fillPct}%`, height: "100%", background: ORANGE, transition: "width .5s ease" }} />
                      </div>
                      <div style={{ fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.75)", marginTop: "4px", textAlign: "right" }}>
                        {joined}/{slots} JOINED
                      </div>
                    </div>
                  )}

                  {phase === "idle" && (
                    <div style={{ border: "1.5px dashed rgba(255,90,31,0.4)", borderRadius: "14px", padding: "14px 10px", textAlign: "center", color: "rgba(255,255,255,0.55)", fontSize: "11px", fontWeight: 600, lineHeight: 1.45 }}>
                      Your beacon will appear here the second you broadcast it. 🔥
                    </div>
                  )}

                  {BLIPS[city].slice(0, phase === "idle" ? 3 : 2).map((b) => (
                    <div key={b.id} style={{ borderRadius: "12px", padding: "9px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8.5px", fontWeight: 800, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em" }}>
                        <span>{b.vibe.toUpperCase()}</span>
                        <span>{b.joined}/{b.slots} JOINED</span>
                      </div>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", margin: "3px 0 2px" }}>{b.title}</div>
                      <div style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin className="w-3 h-3" style={{ color: "#FF5A1F" }} /> {b.place}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dock */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-around", padding: "9px 0 11px", borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(11,9,18,0.96)", fontSize: "9px", fontWeight: 800, color: "rgba(255,255,255,0.45)" }}>
                  <span style={{ color: "#FF5A1F" }}>◉ RADAR</span>
                  <span>★ SAVED</span>
                  <span>● YOU</span>
                </div>
              </div>
            </div>

            {/* Caption */}
            <p style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.45)", margin: "10px 0 0", textAlign: "center", lineHeight: 1.4 }}>
              This mimics your actual membership dashboard once you&apos;re approved.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const stepBtn: React.CSSProperties = {
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};
