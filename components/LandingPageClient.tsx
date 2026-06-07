"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

// ─── TYPES & DATA ────────────────────────────────────────────────────────────

type MockBeacon = {
  id: string;
  title: string;
  locationName: string;
  category: "sports" | "casual" | "nightlife";
  filledSlots: number;
  totalSlots: number;
  hostName: string;
  hostAvatar: string;
  x: number; // percentage from left of radar
  y: number; // percentage from top of radar
  details: string;
};

const MOCK_DATA: Record<string, MockBeacon[]> = {
  Karachi: [
    {
      id: "k1",
      title: "Late Night Chai & FIFA",
      locationName: "Chai Shai, DHA Phase 6",
      category: "nightlife",
      filledSlots: 3,
      totalSlots: 4,
      hostName: "Hamza",
      hostAvatar: "⚡",
      x: 35,
      y: 45,
      details: "Chilling, talking about startups, and playing FIFA. First cup is on me!"
    },
    {
      id: "k2",
      title: "Sunset Beach Volleyball",
      locationName: "Clifton Beach",
      category: "sports",
      filledSlots: 7,
      totalSlots: 10,
      hostName: "Aisha",
      hostAvatar: "☀️",
      x: 70,
      y: 60,
      details: "Casual match at Clifton. Look for the neon net near the food stalls!"
    },
    {
      id: "k3",
      title: "Boardgames & Coffee",
      locationName: "Deli, E-Street",
      category: "casual",
      filledSlots: 2,
      totalSlots: 6,
      hostName: "Zain",
      hostAvatar: "☕",
      x: 50,
      y: 25,
      details: "Settlers of Catan & Secret Hitler. Newbies welcome!"
    }
  ],
  Lahore: [
    {
      id: "l1",
      title: "Futsal Under the Lights",
      locationName: "Kickoff Arena, Johar Town",
      category: "sports",
      filledSlots: 9,
      totalSlots: 12,
      hostName: "Ali",
      hostAvatar: "⚽",
      x: 25,
      y: 55,
      details: "Friendly 6v6 match. Bring non-marking shoes!"
    },
    {
      id: "l2",
      title: "Chai & Poetry Reading",
      locationName: "Pak Tea House",
      category: "casual",
      filledSlots: 4,
      totalSlots: 8,
      hostName: "Mariam",
      hostAvatar: "✍️",
      x: 60,
      y: 35,
      details: "Sharing favorite lines, venting about exams, and drinking elaichi chai."
    },
    {
      id: "l3",
      title: "Neon Bowling Night",
      locationName: "Uptown Bowling, DHA",
      category: "nightlife",
      filledSlots: 5,
      totalSlots: 6,
      hostName: "Saad",
      hostAvatar: "🎳",
      x: 45,
      y: 75,
      details: "Late night cosmic bowling. Let's see who gets the most strikes!"
    }
  ],
  Islamabad: [
    {
      id: "i1",
      title: "Margalla Hills Hiking",
      locationName: "Trail 3, Margalla",
      category: "sports",
      filledSlots: 5,
      totalSlots: 8,
      hostName: "Bilal",
      hostAvatar: "🥾",
      x: 40,
      y: 20,
      details: "Early morning hike up to the viewpoint. Bringing extra water bottles."
    },
    {
      id: "i2",
      title: "Acoustic Jam Session",
      locationName: "F-6 Markaz Café",
      category: "nightlife",
      filledSlots: 3,
      totalSlots: 5,
      hostName: "Sana",
      hostAvatar: "🎸",
      x: 65,
      y: 45,
      details: "Unplugged cover session. Guitars, cajons, and soft vocals."
    },
    {
      id: "i3",
      title: "Startup Coffee Meetup",
      locationName: "Burning Brownie, F-11",
      category: "casual",
      filledSlots: 3,
      totalSlots: 6,
      hostName: "Omar",
      hostAvatar: "💼",
      x: 30,
      y: 65,
      details: "Casual talk about SaaS, web development, and AI tools."
    }
  ]
};

const QUIZ_QUESTIONS = [
  {
    question: "What is your peak Friday night energy?",
    options: [
      { text: "Sweating it out (Futsal, Tennis, Run)", value: "sports" },
      { text: "Deep talk & laughing over Elaichi Chai", value: "casual" },
      { text: "Late night Neon Bowling / Arcade hunt", value: "nightlife" }
    ]
  },
  {
    question: "What is your social battery level on weekends?",
    options: [
      { text: "Fully Charged: Bring on the new crowds", value: "high" },
      { text: "Vibey Group: 4-6 creative minds", value: "medium" },
      { text: "Low-Key: 1-on-1 coffee/walk talk", value: "low" }
    ]
  },
  {
    question: "Pick your ideal spot in the city:",
    options: [
      { text: "Active park / beach / concrete arena", value: "outdoor" },
      { text: "Cozy café corner or quiet rooftop", value: "indoor" },
      { text: "Glowing commercial streets or dhaba hubs", value: "neon" }
    ]
  }
];

export default function LandingPageClient() {
  const [activeCity, setActiveCity] = useState("Karachi");
  const [selectedBeacon, setSelectedBeacon] = useState<MockBeacon | null>(null);
  
  // Sandbox State
  const [sandboxTitle, setSandboxTitle] = useState("");
  const [sandboxVibe, setSandboxVibe] = useState<"sports" | "casual" | "nightlife">("casual");
  const [sandboxLocation, setSandboxLocation] = useState("");
  const [sandboxBeacons, setSandboxBeacons] = useState<MockBeacon[]>([]);
  const [sandboxSubscribers, setSandboxSubscribers] = useState<string[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [showWave, setShowWave] = useState(false);
  const [waveCoords, setWaveCoords] = useState({ x: 0, y: 0 });

  // Quiz State
  const [quizStep, setQuizStep] = useState(0); // 0 = not started, 1, 2, 3 = steps, 4 = outcome
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [quizVibeType, setQuizVibeType] = useState("");

  const waveContainerRef = useRef<HTMLDivElement>(null);

  // Set default selected beacon on city change
  useEffect(() => {
    const cityBeacons = MOCK_DATA[activeCity];
    if (cityBeacons && cityBeacons.length > 0) {
      setSelectedBeacon(cityBeacons[0]);
    }
  }, [activeCity]);

  // Handle Sandbox broadcast simulation
  const handleBroadcast = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!sandboxTitle.trim() || !sandboxLocation.trim()) return;

    // Get click coordinates for wave animation
    if (waveContainerRef.current) {
      const rect = waveContainerRef.current.getBoundingClientRect();
      setWaveCoords({
        x: rect.width / 2,
        y: rect.height / 2
      });
    }

    setIsBroadcasting(true);
    setShowWave(true);

    // Mock beacon details
    const newBeacon: MockBeacon = {
      id: "sandbox-" + Date.now(),
      title: sandboxTitle,
      locationName: sandboxLocation,
      category: sandboxVibe,
      filledSlots: 1,
      totalSlots: 4,
      hostName: "YOU (Host)",
      hostAvatar: "⭐",
      x: 50,
      y: 50,
      details: "Your sandbox broadcast! Simulating real-time neighborhood vibe checking."
    };

    // Reset animations & append beacon
    setTimeout(() => {
      setShowWave(false);
      setSandboxBeacons((prev) => [newBeacon, ...prev]);
      setSelectedBeacon(newBeacon);
      
      // Simulate real-time applicants joining
      setTimeout(() => {
        setSandboxSubscribers((prev) => [...prev, "Zain apply requested"]);
        setSandboxBeacons((prev) =>
          prev.map((b) => b.id === newBeacon.id ? { ...b, filledSlots: 2 } : b)
        );
      }, 1500);

      setTimeout(() => {
        setSandboxSubscribers((prev) => [...prev, "Aisha joined the squad"]);
        setSandboxBeacons((prev) =>
          prev.map((b) => b.id === newBeacon.id ? { ...b, filledSlots: 3 } : b)
        );
      }, 3000);

      setTimeout(() => {
        setSandboxSubscribers((prev) => [...prev, "Saad is heading over"]);
        setSandboxBeacons((prev) =>
          prev.map((b) => b.id === newBeacon.id ? { ...b, filledSlots: 4 } : b)
        );
        setIsBroadcasting(false);
      }, 4500);

    }, 1200);
  };

  // Reset sandbox broadcaster
  const handleResetSandbox = () => {
    setSandboxTitle("");
    setSandboxLocation("");
    setSandboxBeacons([]);
    setSandboxSubscribers([]);
    setIsBroadcasting(false);
    const cityBeacons = MOCK_DATA[activeCity];
    if (cityBeacons && cityBeacons.length > 0) {
      setSelectedBeacon(cityBeacons[0]);
    }
  };

  // Handle Quiz Answers
  const handleQuizAnswer = (value: string) => {
    const nextAnswers = [...quizAnswers, value];
    setQuizAnswers(nextAnswers);

    if (quizStep < 3) {
      setQuizStep(quizStep + 1);
    } else {
      // Calculate Outcome
      const counts = nextAnswers.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Determine highest frequency vibe
      let topVibe = nextAnswers[0];
      let maxCount = 0;
      Object.entries(counts).forEach(([k, v]) => {
        if (v > maxCount) {
          maxCount = v;
          topVibe = k;
        }
      });

      let vibeName = "MIDNIGHT CHAI EXPLORER";
      if (topVibe === "sports") vibeName = "OFFLINE ATHLEISURE CHAMP";
      if (topVibe === "nightlife") vibeName = "NEON STREET RADAR SQUAD";
      if (topVibe === "outdoor") vibeName = "EXPLORATIVE MARGALLA TRAILBLAZER";

      setQuizVibeType(vibeName);
      setQuizStep(4);
    }
  };

  const resetQuiz = () => {
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizVibeType("");
  };

  // Combined list of active beacons in current city + active sandbox beacons
  const displayedBeacons = [...sandboxBeacons, ...MOCK_DATA[activeCity]];

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>

      {/* ── Status Bar ─────────────────────────────────────────────────────── */}
      <header className="nokia-statusbar">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="font-pixel" style={{ fontSize: "7px" }}>SOLO-NO-MORE // V2.0</span>
          <span className="pixel-blink" style={{ color: "var(--accent-primary)", fontSize: "8px" }}>● RADAR ONLINE</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ThemeToggle />
          <span className="font-lcd" style={{ fontSize: "13px" }}>
            {"▮▮▮"}
          </span>
        </div>
      </header>

      {/* ── Nav Bar ────────────────────────────────────────────────────────── */}
      <nav className="nokia-panel" style={{
        borderLeft: "none",
        borderRight: "none",
        borderTop: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 24px",
        borderRadius: 0,
        boxShadow: "none",
        borderBottom: "2px solid var(--border-strong)",
        background: "var(--bg-surface)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="font-pixel text-accent phosphor text-glow-blue" style={{ fontSize: "12px" }}>
            ◈ SOLO-NO-MORE
          </span>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href="/login" id="nav-login-btn" className="nokia-btn" style={{ fontSize: "8px", padding: "6px 14px", textDecoration: "none" }}>
            ► LOGIN
          </Link>
          <Link href="/apply" id="nav-apply-btn" className="nokia-btn nokia-btn-primary" style={{ fontSize: "8px", padding: "6px 14px", textDecoration: "none" }}>
            ✦ APPLY FOR MEMBERSHIP
          </Link>
        </div>
      </nav>

      {/* ── Hero Headline Section ──────────────────────────────────────────── */}
      <section style={{ padding: "48px 20px 28px", textAlign: "center", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
        <div className="nokia-badge nokia-badge-warning" style={{ marginBottom: "20px", display: "inline-block" }}>
          ► INVITE-ONLY COMMUNITY — APPLICATIONS ACTIVE FOR 2026
        </div>

        <h1 className="font-pixel text-glow-green" style={{
          fontSize: "clamp(26px, 5.5vw, 56px)",
          letterSpacing: "0.02em",
          lineHeight: "1.2",
          color: "var(--text-primary)",
          marginBottom: "16px"
        }}>
          FIND YOUR VIBE <span className="text-accent" style={{ color: "var(--accent-primary)" }}>IRL</span>
        </h1>

        <p style={{
          fontSize: "14px",
          fontFamily: "var(--font-mono)",
          lineHeight: "1.8",
          color: "var(--text-secondary)",
          maxWidth: "600px",
          margin: "0 auto 28px"
        }}>
          No infinite scrolling algorithms. No performing for feeds. Real Gen-Z members in Pakistan hosting casual meetups happening offline, right now.
        </p>

        {/* Quick CTA row */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/apply" className="nokia-btn nokia-btn-primary" style={{ fontSize: "10px", padding: "14px 28px", textDecoration: "none" }}>
            ✦ APPLY TO JOIN THE COHORT
          </Link>
          <a href="#radar-section" className="nokia-btn" style={{ fontSize: "10px", padding: "14px 28px", textDecoration: "none" }}>
            ⚡ EXPLORE LIVE RADAR
          </a>
        </div>
      </section>

      {/* ── MAIN INTERACTIVE AREA ──────────────────────────────────────────── */}
      <section id="radar-section" style={{
        padding: "20px",
        maxWidth: "1200px",
        margin: "0 auto 40px",
        width: "100%",
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "24px"
      }}>
        {/* Responsive layout: 3 columns on large desktop, 1/2 columns on tablet/mobile */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px"
        }}>

          {/* COLUMN 1: INTERACTIVE LIVE RADAR WIDGET */}
          <div className="nokia-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className="font-pixel" style={{ fontSize: "10px", margin: 0 }}>📡 LIVE VIBE RADAR</h2>
              <div style={{ display: "flex", gap: "4px" }}>
                {["Karachi", "Lahore", "Islamabad"].map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setActiveCity(city);
                      handleResetSandbox();
                    }}
                    className={activeCity === city ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
                    style={{ fontSize: "6px", padding: "4px 8px" }}
                  >
                    {city.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
              Hover or click the green glowing coordinate blips to intercept live events broadcasting in **{activeCity}**!
            </p>

            {/* RADAR CANVAS */}
            <div style={{ padding: "10px 0", display: "flex", justifyContent: "center" }}>
              <div className="radar-container" style={{ maxWidth: "300px", width: "100%" }}>
                <div className="radar-grid" />
                <div className="radar-sweep" />

                {/* Hotspot blips for standard data */}
                {MOCK_DATA[activeCity].map((beacon) => (
                  <div
                    key={beacon.id}
                    className="radar-blip"
                    style={{ left: `${beacon.x}%`, top: `${beacon.y}%` }}
                    onClick={() => setSelectedBeacon(beacon)}
                  >
                    <div className="radar-blip-pulse" />
                  </div>
                ))}

                {/* Sandbox custom beacon blip */}
                {sandboxBeacons.map((beacon) => (
                  <div
                    key={beacon.id}
                    className="radar-blip animate-pulse"
                    style={{ left: "50%", top: "50%", backgroundColor: "var(--accent-primary)", boxShadow: "0 0 16px var(--accent-primary)" }}
                    onClick={() => setSelectedBeacon(beacon)}
                  >
                    <div className="radar-blip-pulse" style={{ backgroundColor: "var(--accent-glow)" }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Intercept details */}
            <div className="nokia-panel-sunken" style={{ padding: "12px", minHeight: "140px" }}>
              {selectedBeacon ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span className="nokia-badge nokia-badge-primary" style={{ fontSize: "6px" }}>
                      {selectedBeacon.category.toUpperCase()}
                    </span>
                    <span className="font-pixel text-accent" style={{ fontSize: "8px" }}>
                      ⚡ {selectedBeacon.filledSlots}/{selectedBeacon.totalSlots} SPOTS
                    </span>
                  </div>
                  <h4 className="font-pixel" style={{ fontSize: "10px", margin: "4px 0", color: "var(--text-primary)" }}>
                    {selectedBeacon.title}
                  </h4>
                  <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "2px 0 6px" }}>
                    📍 {selectedBeacon.locationName}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, fontStyle: "italic" }}>
                    &ldquo;{selectedBeacon.details}&rdquo;
                  </p>
                  <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "14px" }}>{selectedBeacon.hostAvatar}</span>
                    <span style={{ fontSize: "10px", color: "var(--text-primary)" }}>Host: <strong>{selectedBeacon.hostName}</strong></span>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", flexDirection: "column", color: "var(--text-muted)" }}>
                  <span className="font-pixel pixel-blink" style={{ fontSize: "8px" }}>NO SIGNAL</span>
                  <span style={{ fontSize: "11px" }}>Select a blip to intercept signal</span>
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: PLAYABLE SANDBOX BROADCASTER */}
          <div className="nokia-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h2 className="font-pixel" style={{ fontSize: "10px", margin: 0 }}>⚡ BEACON SANDBOX BROADCASTER</h2>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
              Test drive the app right now. Create a mock meetup and see the local community intercept and apply instantly!
            </p>

            <form style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label className="font-pixel" style={{ fontSize: "6px", display: "block", marginBottom: "4px" }}>1. WHAT IS THE PLAN?</label>
                <input
                  type="text"
                  value={sandboxTitle}
                  onChange={(e) => setSandboxTitle(e.target.value)}
                  placeholder="e.g., FIFA & Chai, Sunset Run, Boardgames"
                  className="nokia-input"
                  disabled={isBroadcasting || sandboxBeacons.length > 0}
                  required
                />
              </div>

              <div>
                <label className="font-pixel" style={{ fontSize: "6px", display: "block", marginBottom: "4px" }}>2. WHERE ARE YOU MEETING?</label>
                <input
                  type="text"
                  value={sandboxLocation}
                  onChange={(e) => setSandboxLocation(e.target.value)}
                  placeholder="e.g., DHA Phase 6, Gulberg Cafe, Trail 5"
                  className="nokia-input"
                  disabled={isBroadcasting || sandboxBeacons.length > 0}
                  required
                />
              </div>

              <div>
                <label className="font-pixel" style={{ fontSize: "6px", display: "block", marginBottom: "4px" }}>3. SELECT THE PLAN VIBE</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px" }}>
                  {(["casual", "sports", "nightlife"] as const).map((vibe) => (
                    <button
                      type="button"
                      key={vibe}
                      onClick={() => setSandboxVibe(vibe)}
                      className={sandboxVibe === vibe ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
                      style={{ fontSize: "6px", padding: "6px 2px" }}
                      disabled={isBroadcasting || sandboxBeacons.length > 0}
                    >
                      {vibe.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {sandboxBeacons.length === 0 ? (
                <div ref={waveContainerRef} className="signal-wave-container" style={{ marginTop: "8px" }}>
                  {showWave && (
                    <div
                      className="signal-wave"
                      style={{ left: `${waveCoords.x}px`, top: `${waveCoords.y}px` }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleBroadcast}
                    disabled={!sandboxTitle.trim() || !sandboxLocation.trim() || isBroadcasting}
                    className="nokia-btn nokia-btn-primary"
                    style={{ width: "100%", fontSize: "9px", padding: "12px" }}
                  >
                    {isBroadcasting ? "🛰 SIGNAL BROADCASTING..." : "🛰 BROADCAST SIGNAL"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleResetSandbox}
                  className="nokia-btn nokia-btn-warning"
                  style={{ width: "100%", fontSize: "9px", padding: "12px", marginTop: "8px" }}
                >
                  ↻ CLEAR SANDBOX & BROADCAST AGAIN
                </button>
              )}
            </form>

            {/* Sandbox Activity Feed */}
            <div className="nokia-panel-sunken" style={{ padding: "12px", flex: 1, minHeight: "130px" }}>
              <span className="font-pixel text-accent text-glow-green" style={{ fontSize: "7px", display: "block", marginBottom: "6px" }}>
                🛰 REAL-TIME TELEMETRY FEED:
              </span>
              {sandboxSubscribers.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {sandboxSubscribers.map((log, idx) => (
                    <div
                      key={idx}
                      className="quiz-slide-enter"
                      style={{
                        fontSize: "11px",
                        color: idx === sandboxSubscribers.length - 1 ? "var(--accent-success)" : "var(--text-secondary)",
                        fontWeight: idx === sandboxSubscribers.length - 1 ? "bold" : "normal",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <span>⚡</span> {log}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", height: "80%", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "11px", textAlign: "center" }}>
                  Broadcast your sandbox signal to watch mock members detect and request to join your squad live!
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3: SYNCHRONIZED APP SIMULATOR */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div className="phone-mockup">
              <div className="phone-screen">
                
                {/* Nokia app status */}
                <div className="nokia-statusbar" style={{ borderTop: "none" }}>
                  <span>SOLO PREVIEW</span>
                  <span>9:41 AM</span>
                </div>

                {/* Interactive mobile emulator feed */}
                <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="font-pixel" style={{ fontSize: "8px" }}>🏙 {activeCity.toUpperCase()} RADAR</span>
                    <span className="nokia-badge nokia-badge-success" style={{ fontSize: "5px" }}>LIVE</span>
                  </div>

                  {/* Simulator Beacon Cards List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                    {displayedBeacons.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBeacon(b)}
                        className={`nokia-panel ${selectedBeacon?.id === b.id ? 'glow-primary' : ''}`}
                        style={{
                          padding: "8px",
                          cursor: "pointer",
                          borderColor: selectedBeacon?.id === b.id ? "var(--accent-primary)" : "var(--border-strong)",
                          background: selectedBeacon?.id === b.id ? "var(--bg-raised)" : "var(--bg-surface)",
                          transition: "all 0.2s"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ fontSize: "5px", padding: "1px 4px" }} className="nokia-badge font-pixel">
                            {b.category.toUpperCase()}
                          </span>
                          <span className="font-pixel" style={{ fontSize: "6px", color: "var(--accent-primary)" }}>
                            {b.filledSlots}/{b.totalSlots} JOINED
                          </span>
                        </div>
                        <div className="font-pixel" style={{ fontSize: "7px", margin: "2px 0", color: "var(--text-primary)" }}>
                          {b.title}
                        </div>
                        <div style={{ fontSize: "9px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <span>📍</span> {b.locationName.split(",")[0]}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mobile mockup static instruction */}
                  <div className="nokia-panel-sunken" style={{ padding: "8px", fontSize: "9px", textAlign: "center", background: "rgba(0,0,0,0.1)" }}>
                    📱 This mimics your actual membership dashboard once approved!
                  </div>
                </div>

                {/* Mock Phone Tab Bar */}
                <div style={{
                  marginTop: "auto",
                  borderTop: "2px solid var(--border-strong)",
                  background: "var(--bg-surface)",
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  padding: "4px 0"
                }}>
                  <div style={{ textAlign: "center", fontSize: "16px", color: "var(--accent-primary)" }}>◈</div>
                  <div style={{ textAlign: "center", fontSize: "16px", opacity: 0.4 }}>★</div>
                  <div style={{ textAlign: "center", fontSize: "16px", opacity: 0.4 }}>👤</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── INTERACTIVE VIBE MATCHING QUIZ SECTION ─────────────────────────── */}
      <section style={{
        padding: "40px 20px",
        background: "var(--bg-surface)",
        borderTop: "2px solid var(--border-strong)",
        borderBottom: "2px solid var(--border-strong)",
        width: "100%"
      }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          
          <div className="nokia-panel" style={{ padding: "24px", minHeight: "300px", display: "flex", flexDirection: "column" }}>
            
            {/* QUIZ STEP 0: START */}
            {quizStep === 0 && (
              <div style={{ textAlign: "center" }}>
                <h3 className="font-pixel text-accent text-glow-blue" style={{ fontSize: "12px", marginBottom: "12px" }}>
                  ⚡ TEST YOUR IRL CONNECTION VIBE
                </h3>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "20px" }}>
                  Take a quick 15-second visual battery test to map your energy and instantly find matching social groups/meetups happening in Karachi, Lahore, and Islamabad.
                </p>
                <button
                  onClick={() => setQuizStep(1)}
                  className="nokia-btn nokia-btn-primary"
                  style={{ fontSize: "9px", padding: "12px 24px" }}
                >
                  ► START INTERACTIVE MATCHING
                </button>
              </div>
            )}

            {/* QUIZ STEPS 1, 2, 3 */}
            {quizStep > 0 && quizStep < 4 && (
              <div className="quiz-slide-enter">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                  <span className="font-pixel text-muted" style={{ fontSize: "6px" }}>
                    QUESTION {quizStep} OF 3
                  </span>
                  <span className="font-lcd text-accent" style={{ fontSize: "12px" }}>
                    {"▮".repeat(quizStep) + "▯".repeat(3 - quizStep)}
                  </span>
                </div>

                <h3 className="font-pixel" style={{ fontSize: "10px", marginBottom: "16px", color: "var(--text-primary)" }}>
                  {QUIZ_QUESTIONS[quizStep - 1].question}
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {QUIZ_QUESTIONS[quizStep - 1].options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuizAnswer(opt.value)}
                      className="nokia-btn"
                      style={{
                        width: "100%",
                        fontSize: "8px",
                        padding: "12px",
                        textAlign: "left",
                        justifyContent: "flex-start",
                        whiteSpace: "normal"
                      }}
                    >
                      {idx + 1}. {opt.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* QUIZ STEP 4: OUTCOME */}
            {quizStep === 4 && (
              <div className="quiz-slide-enter" style={{ textAlign: "center" }}>
                <span className="nokia-badge nokia-badge-success" style={{ marginBottom: "12px" }}>
                  ● RADAR PROFILE GENERATED
                </span>
                
                <h3 className="font-pixel text-accent text-glow-green" style={{ fontSize: "14px", margin: "8px 0 16px" }}>
                  VIBE MATCH: {quizVibeType}
                </h3>

                <div className="nokia-panel-sunken" style={{ padding: "14px", textAlign: "left", marginBottom: "20px", background: "rgba(0,0,0,0.05)" }}>
                  <span className="font-pixel" style={{ fontSize: "6px", display: "block", color: "var(--accent-warning)", marginBottom: "8px" }}>
                    MATCHING CIRCLES ACTIVE IN YOUR AREA:
                  </span>
                  <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "6px", color: "var(--text-primary)" }}>
                    <li>🔥 <strong>Teahouse Chai Crawls</strong> (14 active hosts)</li>
                    <li>🔥 <strong>Late-Night Futsal & Turf</strong> (8 active circles)</li>
                    <li>🔥 <strong>Sunset FIFA & Coffee Cohorts</strong> (21 vetted members)</li>
                  </ul>
                </div>

                <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                  <Link href="/apply" className="nokia-btn nokia-btn-primary" style={{ fontSize: "8px", padding: "12px 20px", textDecoration: "none" }}>
                    ✦ APPLY FOR ACCESS TO THESE GROUPS
                  </Link>
                  <button
                    onClick={resetQuiz}
                    className="nokia-btn"
                    style={{ fontSize: "8px", padding: "12px 20px" }}
                  >
                    ↻ RETAKE
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* ── CORE PILLARS SECTION ──────────────────────────────────────────── */}
      <section style={{ padding: "40px 20px", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
        <div className="font-pixel" style={{
          fontSize: "8px",
          letterSpacing: "0.1em",
          color: "var(--text-muted)",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border-mid)" }} />
          THE SOLO-NO-MORE COVENANT
          <div style={{ flex: 1, height: "1px", background: "var(--border-mid)" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
          
          <div className="nokia-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <span className="font-lcd text-accent" style={{ fontSize: "24px" }}>◈</span>
              <span className="font-pixel" style={{ fontSize: "8px", color: "var(--text-primary)" }}>100% VETTED MEMBERS</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              Zero algorithms. Zero fake profiles or endless doomscroll reels. Every applicant is manually vetted by our committee to ensure real, respectful, and awesome humans.
            </p>
          </div>

          <div className="nokia-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <span className="font-lcd text-accent" style={{ fontSize: "24px" }}>◉</span>
              <span className="font-pixel" style={{ fontSize: "8px", color: "var(--text-primary)" }}>REAL-WORLD MEETUPS</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              We facilitate real-life meetups. Connection happens offline at dhaba joints, sports fields, coffee bars, and gaming circles, not in an online messaging graveyard.
            </p>
          </div>

          <div className="nokia-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <span className="font-lcd text-accent" style={{ fontSize: "24px" }}>★</span>
              <span className="font-pixel" style={{ fontSize: "8px", color: "var(--text-primary)" }}>ZERO GHOSTING COVENANT</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              Our strict community standards ensure that members show up. Confirmed beacon slots that result in deliberate ghosting lead to permanent account suspensions.
            </p>
          </div>

        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="nokia-statusbar" style={{ marginTop: "auto", borderTop: "2px solid var(--border-strong)", borderBottom: "none" }}>
        <span className="font-pixel" style={{ fontSize: "6px" }}>
          © 2026 SOLO-NO-MORE — POWERED BY CAPACITOR AND SUPABASE. VETTED COMMUNITY FOR IRL GENERATION.
        </span>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link href="/apply" style={{ color: "var(--statusbar-text)", fontSize: "6px", fontFamily: "var(--font-pixel)", textDecoration: "none", opacity: 0.7 }}>
            APPLY
          </Link>
          <Link href="/login" style={{ color: "var(--statusbar-text)", fontSize: "6px", fontFamily: "var(--font-pixel)", textDecoration: "none", opacity: 0.7 }}>
            LOGIN
          </Link>
        </div>
      </footer>
    </main>
  );
}
