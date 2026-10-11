"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

// ─── TYPES & MOCK DATA ────────────────────────────────────────────────────────

type MockBeacon = {
  id: string;
  title: string;
  locationName: string;
  category: "sports" | "casual" | "nightlife";
  filledSlots: number;
  totalSlots: number;
  hostName: string;
  hostAvatar: string;
  x: number;
  y: number;
  details: string;
  timeStr: string;
  image?: string;
  tag?: string;
};

const FEATURED_PARTIES = [
  {
    id: "fp1",
    title: "Sunset Rooftop Chai & Sound",
    location: "DHA Phase 6, Karachi",
    time: "Tonight · 7:30 PM",
    category: "casual",
    image: "/images/hero-rooftop.jpg",
    host: "Hamza R.",
    hostAvatar: "⚡",
    spotsLeft: 2,
    totalSpots: 8,
    tag: "Chai & Vinyl",
    vibe: "Cozy conversations, cold breeze, fresh parathas & lo-fi playlist.",
  },
  {
    id: "fp2",
    title: "Midnight Blue Court Padel Match",
    location: "Velocity Padel, Clifton",
    time: "Tomorrow · 10:00 PM",
    category: "sports",
    image: "/images/padel-squad.jpg",
    host: "Aisha M.",
    hostAvatar: "🎾",
    spotsLeft: 1,
    totalSpots: 4,
    tag: "Athletic & Fun",
    vibe: "Friendly doubles match under stadium floodlights. Racquets provided!",
  },
  {
    id: "fp3",
    title: "Boardgames, Catan & Karak Chai",
    location: "Deli, E-Street, Clifton",
    time: "Saturday · 8:00 PM",
    category: "nightlife",
    image: "/images/chai-cafe.jpg",
    host: "Zain K.",
    hostAvatar: "☕",
    spotsLeft: 3,
    totalSpots: 6,
    tag: "Strategy & Chill",
    vibe: "Settlers of Catan, Secret Hitler & iced Spanish lattes with new friends.",
  },
];

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
      timeStr: "11:00 PM",
      details: "Chilling, talking about startups, and playing FIFA on PS5. First cup is on me!",
      tag: "Nightlife",
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
      timeStr: "5:30 PM",
      details: "Casual match at Clifton. Look for the neon net near the food stalls!",
      tag: "Sports",
    },
    {
      id: "k3",
      title: "Boardgames & Coffee",
      locationName: "Deli, E-Street",
      category: "casual",
      filledSlots: 4,
      totalSlots: 6,
      hostName: "Zain",
      hostAvatar: "☕",
      x: 50,
      y: 25,
      timeStr: "8:00 PM",
      details: "Settlers of Catan & Secret Hitler. Friendly newbies welcome!",
      tag: "Casual",
    },
    {
      id: "k4",
      title: "Electronic Music Jam",
      locationName: "District 19, Korangi Rd",
      category: "nightlife",
      filledSlots: 18,
      totalSlots: 25,
      hostName: "DJ Rumi",
      hostAvatar: "🪩",
      x: 62,
      y: 75,
      timeStr: "10:30 PM",
      details: "Underground deep house set with live synths. Ticket pass confirmed via Raast.",
      tag: "Gig / Rave",
    },
  ],
  Lahore: [
    {
      id: "l1",
      title: "Futsal Under the Floodlights",
      locationName: "Kickoff Arena, Johar Town",
      category: "sports",
      filledSlots: 9,
      totalSlots: 12,
      hostName: "Ali",
      hostAvatar: "⚽",
      x: 25,
      y: 55,
      timeStr: "9:00 PM",
      details: "Friendly 6v6 match. Bring non-marking turf shoes!",
      tag: "Sports",
    },
    {
      id: "l2",
      title: "Chai & Poetry Reading",
      locationName: "Pak Tea House, Anarkali",
      category: "casual",
      filledSlots: 4,
      totalSlots: 8,
      hostName: "Mariam",
      hostAvatar: "✍️",
      x: 60,
      y: 35,
      timeStr: "6:00 PM",
      details: "Sharing favorite lines, venting about life, and sipping elaichi chai.",
      tag: "Casual",
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
      timeStr: "10:00 PM",
      details: "Late night cosmic bowling. Let's see who hits the most strikes!",
      tag: "Nightlife",
    },
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
      timeStr: "6:30 AM",
      details: "Morning hike up to the viewpoint. Bringing extra water and snacks.",
      tag: "Outdoor",
    },
    {
      id: "i2",
      title: "Acoustic Jam Session",
      locationName: "F-6 Markaz Café",
      category: "nightlife",
      filledSlots: 4,
      totalSlots: 5,
      hostName: "Sana",
      hostAvatar: "🎸",
      x: 65,
      y: 45,
      timeStr: "8:30 PM",
      details: "Unplugged cover session. Guitars, cajon, and soft vocals.",
      tag: "Live Music",
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
      timeStr: "4:00 PM",
      details: "Casual talk about software, AI, and freelancing in Pakistan.",
      tag: "Casual",
    },
  ],
};

const QUIZ_QUESTIONS = [
  {
    question: "What is your peak Friday night energy in Karachi?",
    options: [
      { text: "Sweating it out (Padel doubles, Futsal, Beach Run)", value: "sports", icon: "🎾" },
      { text: "Late night deep talks over Elaichi Chai & Karak Parathas", value: "casual", icon: "☕" },
      { text: "Underground DJ set, rooftop rave or neon bowling", value: "nightlife", icon: "🪩" },
    ],
  },
  {
    question: "What group size feels most natural to you?",
    options: [
      { text: "Intimate squad (3 to 6 creative minds)", value: "medium", icon: "👥" },
      { text: "Dynamic crowd (10 to 25 people dancing / playing)", value: "high", icon: "🎉" },
      { text: "Low-key 1-on-1 coffee chat or city walk", value: "low", icon: "☕" },
    ],
  },
  {
    question: "Pick your ideal spot to hang out:",
    options: [
      { text: "Breezy Clifton beach, padel court, or outdoor park", value: "outdoor", icon: "🌊" },
      { text: "Aesthetic cafe in E-Street or cozy DHA rooftop", value: "indoor", icon: "🪴" },
      { text: "Buzzing Chai dhaba with string lights and music", value: "neon", icon: "✨" },
    ],
  },
];

export default function LandingPageClient() {
  const [activeCity, setActiveCity] = useState("Karachi");
  const [selectedBeacon, setSelectedBeacon] = useState<MockBeacon | null>(null);

  // Simulated RSVPs for the interactive party cards
  const [rsvps, setRsvps] = useState<Record<string, boolean>>({});

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
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [quizVibeType, setQuizVibeType] = useState("");

  const waveContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cityBeacons = MOCK_DATA[activeCity];
    if (cityBeacons && cityBeacons.length > 0) {
      setSelectedBeacon(cityBeacons[0]);
    }
  }, [activeCity]);

  const handleRsvpToggle = (id: string) => {
    setRsvps((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleBroadcast = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!sandboxTitle.trim() || !sandboxLocation.trim()) return;

    if (waveContainerRef.current) {
      const rect = waveContainerRef.current.getBoundingClientRect();
      setWaveCoords({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }

    setShowWave(true);
    setIsBroadcasting(true);

    setTimeout(() => {
      setShowWave(false);
      setIsBroadcasting(false);

      const newBeacon: MockBeacon = {
        id: "sandbox-" + Date.now(),
        title: sandboxTitle.trim(),
        locationName: sandboxLocation.trim(),
        category: sandboxVibe,
        filledSlots: 1,
        totalSlots: 5,
        hostName: "You (Host)",
        hostAvatar: "👑",
        x: 50,
        y: 50,
        timeStr: "In 45 mins",
        details: "Live squad hangout broadcasted from your browser preview!",
        tag: "My Broadcast",
      };

      setSandboxBeacons([newBeacon]);
      setSelectedBeacon(newBeacon);

      setSandboxSubscribers([`📡 "${newBeacon.title}" is live on the ${activeCity} radar!`]);

      setTimeout(() => {
        setSandboxSubscribers((prev) => [...prev, "⚡ Zain (Clifton) requested to join your squad."]);
      }, 900);

      setTimeout(() => {
        setSandboxSubscribers((prev) => [...prev, "⚡ Mariam (DHA Phase 5) requested to join your squad."]);
      }, 1800);

      setTimeout(() => {
        setSandboxSubscribers((prev) => [
          ...prev,
          "🎉 2 requests pending! Open squad chat to coordinate location & timing.",
        ]);
      }, 2700);
    }, 900);
  };

  const handleResetSandbox = () => {
    setSandboxBeacons([]);
    setSandboxSubscribers([]);
    setSandboxTitle("");
    setSandboxLocation("");
    const cityBeacons = MOCK_DATA[activeCity];
    if (cityBeacons && cityBeacons.length > 0) {
      setSelectedBeacon(cityBeacons[0]);
    }
  };

  const handleQuizAnswer = (value: string) => {
    const nextAnswers = [...quizAnswers, value];
    setQuizAnswers(nextAnswers);

    if (quizStep < 3) {
      setQuizStep(quizStep + 1);
    } else {
      let topVibe = "casual";
      const counts: Record<string, number> = {};
      nextAnswers.forEach((ans) => {
        counts[ans] = (counts[ans] || 0) + 1;
      });

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
      if (topVibe === "outdoor") vibeName = "COASTAL & MARGALLA TRAILBLAZER";

      setQuizVibeType(vibeName);
      setQuizStep(4);
    }
  };

  const resetQuiz = () => {
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizVibeType("");
  };

  const displayedBeacons = [...sandboxBeacons, ...MOCK_DATA[activeCity]];

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>

      {/* ── TOP FLOATING NAV (PARTIFUL STYLE) ──────────────────────────────── */}
      <header
        style={{
          position: "sticky",
          top: "12px",
          zIndex: 60,
          maxWidth: "1200px",
          margin: "0 auto",
          width: "calc(100% - 24px)",
          padding: "8px 16px",
          borderRadius: "999px",
          background: "rgba(26, 20, 35, 0.75)",
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          border: "1px solid var(--border-strong)",
          boxShadow: "0 16px 40px -12px rgba(0, 0, 0, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        {/* Brand */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #FF8A3D 0%, #FF5A5F 50%, #FF4FA3 100%)",
              display: "grid",
              placeItems: "center",
              fontSize: "16px",
              boxShadow: "0 0 16px rgba(255, 106, 77, 0.5)",
            }}
          >
            🎉
          </span>
          <span
            className="font-pixel"
            style={{
              fontSize: "16px",
              background: "linear-gradient(135deg, #FFF7F0 0%, #FF8A6E 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              letterSpacing: "-0.01em",
            }}
          >
            SOLO-NO-MORE
          </span>
        </Link>

        {/* Center Links (Desktop) */}
        <nav
          className="hidden md:flex items-center"
          style={{ gap: "20px", fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)" }}
        >
          <a href="#parties-section" style={{ color: "inherit", textDecoration: "none" }} className="hover:text-white transition-colors">
            🔥 Live Squads
          </a>
          <a href="#radar-section" style={{ color: "inherit", textDecoration: "none" }} className="hover:text-white transition-colors">
            📡 City Radar
          </a>
          <a href="#ecosystem-section" style={{ color: "inherit", textDecoration: "none" }} className="hover:text-white transition-colors">
            ✨ Ecosystem
          </a>
          <a href="#pricing-section" style={{ color: "inherit", textDecoration: "none" }} className="hover:text-white transition-colors">
            ⚡ Membership
          </a>
        </nav>

        {/* Right Actions: Skin Switcher + Auth Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ThemeToggle />
          <Link
            href="/login"
            className="nokia-btn"
            style={{
              padding: "7px 16px",
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            Log in
          </Link>
          <Link
            href="/apply"
            className="nokia-btn nokia-btn-primary"
            style={{
              padding: "7px 18px",
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            Host / Join Squad ✨
          </Link>
        </div>
      </header>

      {/* ── HERO SECTION: HIGH-ENERGY PARTY AESTHETIC ─────────────────────── */}
      <section
        style={{
          padding: "72px 20px 48px",
          textAlign: "center",
          maxWidth: "1050px",
          margin: "0 auto",
          width: "100%",
          position: "relative",
        }}
      >
        {/* Live Community Pulse Banner */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 18px",
            borderRadius: "999px",
            background: "rgba(255, 106, 77, 0.12)",
            border: "1px solid rgba(255, 106, 77, 0.35)",
            boxShadow: "0 0 20px rgba(255, 106, 77, 0.2)",
            marginBottom: "24px",
          }}
        >
          <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#3DDC97", boxShadow: "0 0 8px #3DDC97" }} />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#FFA48F", letterSpacing: "0.01em" }}>
            14 SQUADS HANGING OUT TONIGHT IN KARACHI · DHA · CLIFTON · GULSHAN
          </span>
        </div>

        {/* Big Playful Headline */}
        <h1
          className="font-pixel"
          style={{
            fontSize: "clamp(34px, 7vw, 68px)",
            lineHeight: 1.08,
            letterSpacing: "-0.025em",
            color: "var(--text-primary)",
            margin: "0 auto 20px",
            maxWidth: "920px",
          }}
        >
          Never go out alone again.{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #FF8A3D 0%, #FF5A5F 50%, #FF4FA3 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            The party starts before the party.
          </span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "clamp(16px, 2.2vw, 19px)",
            lineHeight: 1.6,
            color: "var(--text-secondary)",
            maxWidth: "700px",
            margin: "0 auto 36px",
          }}
        >
          Join vetted squads for late-night chai, midnight padel, rooftop raves, and beach sunsets across Karachi — or host your own in 10 seconds. No ghosting. No endless texting. Just real people showing up.
        </p>

        {/* Primary CTAs */}
        <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap", marginBottom: "40px" }}>
          <Link
            href="/apply"
            className="nokia-btn nokia-btn-primary"
            style={{
              fontSize: "15px",
              padding: "16px 36px",
              textDecoration: "none",
              borderRadius: "999px",
              boxShadow: "0 12px 36px -8px rgba(255, 90, 95, 0.7)",
            }}
          >
            🎉 Join Solo-No-More · Free Trial
          </Link>
          <a
            href="#parties-section"
            className="nokia-btn"
            style={{
              fontSize: "15px",
              padding: "16px 32px",
              textDecoration: "none",
              borderRadius: "999px",
            }}
          >
            🔥 View Today&apos;s Squad Invites
          </a>
        </div>

        {/* Trust Badges */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "28px",
            flexWrap: "wrap",
            fontSize: "13px",
            color: "var(--text-muted)",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#FFC53D" }}>★ ★ ★ ★ ★</span> 4.9 Community Rating
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🤝</span> 100% Manually Vetted Members
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span>⚡</span> 2-Strike No-Flake Covenant
          </span>
        </div>
      </section>

      {/* ── PHOTO FEATURED CARDS (PARTIFUL INVITE CARDS) ─────────────────── */}
      <section
        id="parties-section"
        style={{
          padding: "24px 20px 60px",
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <span className="nokia-badge nokia-badge-primary" style={{ marginBottom: "8px", display: "inline-block" }}>
              LIVE KARACHI INVITES
            </span>
            <h2 className="font-pixel" style={{ fontSize: "28px", margin: 0 }}>
              Trending Squads Right Now
            </h2>
          </div>
          <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
            ⚡ Real meetups organized by members. Tap RSVP to reserve your spot!
          </span>
        </div>

        {/* 3 Partiful-Style Real Photo Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          {FEATURED_PARTIES.map((party) => {
            const isRsvpd = !!rsvps[party.id];
            const displaySpotsLeft = isRsvpd ? Math.max(0, party.spotsLeft - 1) : party.spotsLeft;

            return (
              <div
                key={party.id}
                className="nokia-panel nokia-panel-interactive"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: "24px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-strong)",
                  boxShadow: "0 18px 40px -14px rgba(0, 0, 0, 0.6)",
                }}
              >
                {/* Photo Header with Badges */}
                <div style={{ position: "relative", height: "240px", width: "100%", overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={party.image}
                    alt={party.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.4s ease",
                    }}
                    className="hover:scale-105"
                  />
                  {/* Overlay Gradient */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to top, rgba(26, 20, 35, 0.95) 0%, rgba(26, 20, 35, 0.2) 60%, transparent 100%)",
                    }}
                  />

                  {/* Top Floating Pill Tags */}
                  <div style={{ position: "absolute", top: "14px", left: "14px", display: "flex", gap: "8px" }}>
                    <span
                      style={{
                        padding: "5px 12px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: "rgba(0, 0, 0, 0.65)",
                        backdropFilter: "blur(8px)",
                        color: "#fff",
                      }}
                    >
                      {party.tag}
                    </span>
                    <span
                      style={{
                        padding: "5px 12px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: displaySpotsLeft <= 1 ? "rgba(255, 84, 112, 0.85)" : "rgba(61, 220, 151, 0.85)",
                        color: "#000",
                      }}
                    >
                      {displaySpotsLeft === 0 ? "SQUAD FULL" : `⚡ ${displaySpotsLeft} SPOTS LEFT`}
                    </span>
                  </div>

                  {/* Time Stamp */}
                  <div style={{ position: "absolute", bottom: "14px", left: "14px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#FFA48F", background: "rgba(0,0,0,0.6)", padding: "4px 10px", borderRadius: "8px" }}>
                      📅 {party.time}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", flexGrow: 1 }}>
                  <div>
                    <h3 className="font-pixel" style={{ fontSize: "19px", margin: "0 0 6px", color: "var(--text-primary)" }}>
                      {party.title}
                    </h3>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>📍</span> {party.location}
                    </div>
                  </div>

                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                    {party.vibe}
                  </p>

                  {/* Host info & Attendees Avatars */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "12px",
                      borderTop: "1px solid var(--border-light)",
                      marginTop: "auto",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--bg-sunken)", display: "grid", placeItems: "center", fontSize: "14px" }}>
                        {party.hostAvatar}
                      </span>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>{party.host}</div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Verified Host</div>
                      </div>
                    </div>

                    {/* Interactive RSVP Button */}
                    <button
                      type="button"
                      onClick={() => handleRsvpToggle(party.id)}
                      className={`nokia-btn ${isRsvpd ? "nokia-btn-success" : "nokia-btn-primary"}`}
                      style={{
                        padding: "8px 18px",
                        fontSize: "12px",
                        borderRadius: "999px",
                      }}
                    >
                      {isRsvpd ? "✓ RSVP&apos;D (GOING)" : "RSVP TO JOIN 🎟"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 4 ECOSYSTEM PILLARS: COVERING EVERY ASPECT ─────────────────────── */}
      <section
        id="ecosystem-section"
        style={{
          padding: "60px 20px",
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "44px" }}>
          <span className="nokia-badge nokia-badge-primary" style={{ marginBottom: "8px", display: "inline-block" }}>
            HOW SOLO-NO-MORE POWERS KARACHI
          </span>
          <h2 className="font-pixel" style={{ fontSize: "32px", margin: "4px 0 12px" }}>
            Everything You Need to Connect IRL
          </h2>
          <p style={{ fontSize: "16px", color: "var(--text-secondary)", maxWidth: "650px", margin: "0 auto" }}>
            From casual coffee runs to secret electronic shows, here is how Solo-No-More turns strangers into squads.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
          
          {/* Pillar 1: Squad Beacons */}
          <div className="nokia-panel" style={{ padding: "26px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <span style={{ fontSize: "32px", width: "52px", height: "52px", borderRadius: "16px", background: "rgba(255, 106, 77, 0.15)", display: "grid", placeItems: "center" }}>
              ⚡
            </span>
            <h3 className="font-pixel" style={{ fontSize: "17px", margin: 0 }}>
              1. SQUAD BEACONS
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
              Have an idea right now? Drop a beacon on the map: <em>“Late night chai at Koyla”</em> or <em>“Padel at 10 PM”</em>. Members see it, request to join, and once approved, an encrypted squad chat opens.
            </p>
            <div style={{ marginTop: "auto", fontSize: "12px", color: "var(--accent-text)", fontWeight: 700 }}>
              Cap 4-8 slots · Anti-crowd · 100% IRL
            </div>
          </div>

          {/* Pillar 2: Indie Events & Ticketing Partner */}
          <div className="nokia-panel" style={{ padding: "26px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <span style={{ fontSize: "32px", width: "52px", height: "52px", borderRadius: "16px", background: "rgba(155, 123, 255, 0.15)", display: "grid", placeItems: "center" }}>
              🎟
            </span>
            <h3 className="font-pixel" style={{ fontSize: "17px", margin: 0 }}>
              2. CURATED TICKETING & GIGS
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
              Discover underground DJ nights, stand-up comedy, and acoustic sessions. Pay directly in <strong>PKR via Raast or SadaPay</strong> with zero credit card fees. Your digital pass generates instantly.
            </p>
            <div style={{ marginTop: "auto", fontSize: "12px", color: "var(--accent-violet)", fontWeight: 700 }}>
              Zero scam passes · Raast gateway · Door QR pass
            </div>
          </div>

          {/* Pillar 3: Verified Partner Venues */}
          <div className="nokia-panel" style={{ padding: "26px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <span style={{ fontSize: "32px", width: "52px", height: "52px", borderRadius: "16px", background: "rgba(61, 220, 151, 0.15)", display: "grid", placeItems: "center" }}>
              💼
            </span>
            <h3 className="font-pixel" style={{ fontSize: "17px", margin: 0 }}>
              3. VERIFIED PARTNER VENUES
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
              Cafes, padel courts, and lounges get dedicated B2B partner accounts (PKR 3,500/mo). They broadcast exclusive 15–20% squad promos directly on the live radar feed, driving immediate foot traffic.
            </p>
            <div style={{ marginTop: "auto", fontSize: "12px", color: "var(--accent-success)", fontWeight: 700 }}>
              Emerald venue badge · Track squad visits
            </div>
          </div>

          {/* Pillar 4: Artist & Creator Portal */}
          <div className="nokia-panel" style={{ padding: "26px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <span style={{ fontSize: "32px", width: "52px", height: "52px", borderRadius: "16px", background: "rgba(255, 197, 61, 0.15)", display: "grid", placeItems: "center" }}>
              🎤
            </span>
            <h3 className="font-pixel" style={{ fontSize: "17px", margin: 0 }}>
              4. ARTIST & PROMOTER PORTAL
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
              Are you an indie artist or DJ? List your gig in under 3 minutes. Solo-No-More handles ticket collection, digital guestlists, and door check-in scanners. Net proceeds (92%) wired directly to your bank.
            </p>
            <div style={{ marginTop: "auto", fontSize: "12px", color: "var(--accent-warning)", fontWeight: 700 }}>
              Door scanner app · 24-48h Raast payout
            </div>
          </div>

        </div>
      </section>

      {/* ── MAIN INTERACTIVE AREA: LIVE RADAR + PLAYABLE SANDBOX ──────────── */}
      <section
        id="radar-section"
        style={{
          padding: "40px 20px 60px",
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <span className="nokia-badge nokia-badge-primary" style={{ marginBottom: "8px", display: "inline-block" }}>
            INTERACTIVE MAP & PREVIEW
          </span>
          <h2 className="font-pixel" style={{ fontSize: "28px", margin: "4px 0" }}>
            Explore Live Vibe Radars
          </h2>
          <p style={{ fontSize: "15px", color: "var(--text-muted)" }}>
            Select a city, click a radar signal, or test-drive hosting a hangout right now!
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          {/* COLUMN 1: LIVE RADAR WIDGET */}
          <div className="nokia-panel" style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <h3 className="font-pixel" style={{ fontSize: "15px", margin: 0 }}>📡 LIVE CITY RADAR</h3>
              <div style={{ display: "flex", gap: "6px" }}>
                {["Karachi", "Lahore", "Islamabad"].map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setActiveCity(city);
                      handleResetSandbox();
                    }}
                    className={activeCity === city ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
                    style={{ fontSize: "12px", padding: "6px 12px" }}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
              Hover or tap any glowing beacon in <strong>{activeCity}</strong> to intercept details!
            </p>

            {/* RADAR CANVAS */}
            <div style={{ padding: "10px 0", display: "flex", justifyContent: "center" }}>
              <div className="radar-container" style={{ maxWidth: "280px", width: "100%" }}>
                <div className="radar-grid" />
                <div className="radar-sweep" />

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

            {/* Intercept Details Box */}
            <div className="nokia-panel-sunken" style={{ padding: "16px", minHeight: "130px" }}>
              {selectedBeacon ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span className="nokia-badge nokia-badge-primary" style={{ fontSize: "11px" }}>
                      {selectedBeacon.category.toUpperCase()}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--accent-primary)", fontWeight: 700 }}>
                      ⚡ {selectedBeacon.filledSlots}/{selectedBeacon.totalSlots} SPOTS FILLED
                    </span>
                  </div>
                  <h4 className="font-pixel" style={{ fontSize: "15px", margin: "4px 0", color: "var(--text-primary)" }}>
                    {selectedBeacon.title}
                  </h4>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "2px 0 6px" }}>
                    📍 {selectedBeacon.locationName} · 🕒 {selectedBeacon.timeStr}
                  </p>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, fontStyle: "italic" }}>
                    &ldquo;{selectedBeacon.details}&rdquo;
                  </p>
                  <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "16px" }}>{selectedBeacon.hostAvatar}</span>
                    <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>Host: <strong>{selectedBeacon.hostName}</strong></span>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", flexDirection: "column", color: "var(--text-muted)" }}>
                  <span style={{ fontSize: "13px" }}>Tap any radar point above</span>
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: PLAYABLE SQUAD SANDBOX */}
          <div className="nokia-panel" style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 className="font-pixel" style={{ fontSize: "15px", margin: 0 }}>⚡ BROADCAST YOUR SQUAD (SIMULATOR)</h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
              Test drive the platform right now. Create a mock meetup and watch nearby members request to join live!
            </p>

            <form style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "6px" }}>1. What&apos;s the squad plan?</label>
                <input
                  type="text"
                  value={sandboxTitle}
                  onChange={(e) => setSandboxTitle(e.target.value)}
                  placeholder="e.g. Chai at Koyla, Padel doubles, FIFA session"
                  className="nokia-input"
                  disabled={isBroadcasting || sandboxBeacons.length > 0}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "6px" }}>2. Where are you meeting?</label>
                <input
                  type="text"
                  value={sandboxLocation}
                  onChange={(e) => setSandboxLocation(e.target.value)}
                  placeholder="e.g. DHA Phase 6, E-Street Cafe, Johar Arena"
                  className="nokia-input"
                  disabled={isBroadcasting || sandboxBeacons.length > 0}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "6px" }}>3. Select the vibe category</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                  {(["casual", "sports", "nightlife"] as const).map((vibe) => (
                    <button
                      type="button"
                      key={vibe}
                      onClick={() => setSandboxVibe(vibe)}
                      className={sandboxVibe === vibe ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
                      style={{ fontSize: "12px", padding: "8px 6px" }}
                      disabled={isBroadcasting || sandboxBeacons.length > 0}
                    >
                      {vibe === "casual" ? "☕ Casual" : vibe === "sports" ? "🎾 Sports" : "🪩 Nightlife"}
                    </button>
                  ))}
                </div>
              </div>

              {sandboxBeacons.length === 0 ? (
                <div ref={waveContainerRef} className="signal-wave-container" style={{ marginTop: "6px" }}>
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
                    style={{ width: "100%", fontSize: "14px", padding: "12px", borderRadius: "999px" }}
                  >
                    {isBroadcasting ? "🛰 Broadcasting signal..." : "🚀 Broadcast Squad Signal"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleResetSandbox}
                  className="nokia-btn nokia-btn-warning"
                  style={{ width: "100%", fontSize: "13px", padding: "12px", marginTop: "6px", borderRadius: "999px" }}
                >
                  ↻ Clear Sandbox & Broadcast Another
                </button>
              )}
            </form>

            {/* Sandbox Activity Telemetry Feed */}
            <div className="nokia-panel-sunken" style={{ padding: "14px", flex: 1, minHeight: "120px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-text)", display: "block", marginBottom: "6px" }}>
                ⚡ LIVE INTERCEPTION LOGS:
              </span>
              {sandboxSubscribers.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {sandboxSubscribers.map((log, idx) => (
                    <div
                      key={idx}
                      className="quiz-slide-enter"
                      style={{
                        fontSize: "13px",
                        color: idx === sandboxSubscribers.length - 1 ? "var(--accent-success)" : "var(--text-secondary)",
                        fontWeight: idx === sandboxSubscribers.length - 1 ? 700 : 400,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span>⚡</span> {log}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", height: "80%", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "13px", textAlign: "center" }}>
                  Hit broadcast to watch mock members detect and request to join your hangout live!
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3: PHONE APP SIMULATOR */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div className="phone-mockup">
              <div className="phone-screen">
                <div className="nokia-statusbar" style={{ borderTop: "none", fontSize: "12px", minHeight: "36px", padding: "6px 12px" }}>
                  <span>SOLO PREVIEW</span>
                  <span>9:41 PM</span>
                </div>

                <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="font-pixel" style={{ fontSize: "12px" }}>🏙 {activeCity.toUpperCase()} FEED</span>
                    <span className="nokia-badge nokia-badge-success" style={{ fontSize: "10px" }}>ONLINE</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                    {displayedBeacons.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBeacon(b)}
                        className={`nokia-panel cursor-pointer ${selectedBeacon?.id === b.id ? "border-accent" : ""}`}
                        style={{
                          padding: "10px",
                          borderRadius: "14px",
                          cursor: "pointer",
                          border: selectedBeacon?.id === b.id ? "1px solid var(--accent-primary)" : "1px solid var(--border-light)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ fontSize: "10px", padding: "2px 8px" }} className="nokia-badge">
                            {b.category.toUpperCase()}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--accent-primary)", fontWeight: 700 }}>
                            {b.filledSlots}/{b.totalSlots} JOINED
                          </span>
                        </div>
                        <div className="font-pixel" style={{ fontSize: "12px", margin: "2px 0", color: "var(--text-primary)" }}>
                          {b.title}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <span>📍</span> {b.locationName.split(",")[0]} · 🕒 {b.timeStr}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="nokia-panel-sunken" style={{ padding: "8px", fontSize: "11px", textAlign: "center" }}>
                    📱 Real interface when logged in!
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── MEMBERSHIP PRICING SECTION: SIMPLE & TRANSPARENT ──────────────── */}
      <section
        id="pricing-section"
        style={{
          padding: "60px 20px",
          maxWidth: "1050px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span className="nokia-badge nokia-badge-primary" style={{ marginBottom: "8px", display: "inline-block" }}>
            MEMBERSHIP PLANS (PKR)
          </span>
          <h2 className="font-pixel" style={{ fontSize: "32px", margin: "4px 0" }}>
            Zero Hidden Fees. Straightforward & Fair.
          </h2>
          <p style={{ fontSize: "16px", color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
            Start completely free with 3 hangouts. Upgrade when you want unlimited hosting across Karachi.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          
          {/* Plan 1: Explorer */}
          <div className="nokia-panel" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "16px", borderRadius: "24px" }}>
            <div>
              <span className="nokia-badge" style={{ fontSize: "11px" }}>STARTER PASS</span>
              <h3 className="font-pixel" style={{ fontSize: "18px", margin: "8px 0 4px" }}>Explorer</h3>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>Try before committing. Perfect for newcomers.</p>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span className="font-pixel" style={{ fontSize: "36px", color: "var(--text-primary)" }}>Rs. 0</span>
              <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>/ free forever</span>
            </div>

            <hr className="nokia-divider" />

            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px", color: "var(--text-secondary)" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><span>✓</span> 3 Free Approved Hangouts</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><span>✓</span> Explore all Karachi city radars</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><span>✓</span> Access to squad chat upon acceptance</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><span>✓</span> Pay-as-you-go available after 3 passes</li>
            </ul>

            <Link href="/apply" className="nokia-btn" style={{ width: "100%", padding: "12px", textAlign: "center", textDecoration: "none", marginTop: "auto", borderRadius: "999px" }}>
              Start for Free
            </Link>
          </div>

          {/* Plan 2: Member (Highlighted) */}
          <div
            className="nokia-panel"
            style={{
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              borderRadius: "24px",
              border: "2px solid var(--accent-primary)",
              boxShadow: "0 20px 50px -15px rgba(255, 90, 95, 0.4)",
              position: "relative",
            }}
          >
            <div style={{ position: "absolute", top: "-12px", right: "20px" }}>
              <span className="nokia-badge nokia-badge-primary" style={{ padding: "5px 14px", fontSize: "11px" }}>
                MOST POPULAR
              </span>
            </div>

            <div>
              <span className="nokia-badge nokia-badge-primary" style={{ fontSize: "11px" }}>ALL-ACCESS</span>
              <h3 className="font-pixel" style={{ fontSize: "18px", margin: "8px 0 4px" }}>Full Member</h3>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>For solo adventurers & squad organizers.</p>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span className="font-pixel" style={{ fontSize: "36px", color: "var(--accent-text)" }}>Rs. 2,000</span>
              <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>/ month</span>
            </div>

            <hr className="nokia-divider" />

            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px", color: "var(--text-primary)" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ color: "var(--accent-success)" }}>✓</span> <strong>UNLIMITED Beacon Hosting</strong></li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ color: "var(--accent-success)" }}>✓</span> Up to 15 Hangout entries per month</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ color: "var(--accent-success)" }}>✓</span> 15–20% discount on official events</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ color: "var(--accent-success)" }}>✓</span> Verified Member glow badge on profile</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ color: "var(--accent-success)" }}>✓</span> Zero transaction fee via Raast & SadaPay</li>
            </ul>

            <Link href="/dashboard/upgrade" className="nokia-btn nokia-btn-primary" style={{ width: "100%", padding: "12px", textAlign: "center", textDecoration: "none", marginTop: "auto", borderRadius: "999px" }}>
              Upgrade to Member
            </Link>
          </div>

          {/* Plan 3: Partner Hub */}
          <div className="nokia-panel" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "16px", borderRadius: "24px" }}>
            <div>
              <span className="nokia-badge nokia-badge-success" style={{ fontSize: "11px" }}>BUSINESS VENUES</span>
              <h3 className="font-pixel" style={{ fontSize: "18px", margin: "8px 0 4px" }}>Partner Hub</h3>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>For cafes, padel courts, and arenas.</p>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span className="font-pixel" style={{ fontSize: "36px", color: "var(--accent-success)" }}>Rs. 3,500</span>
              <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>/ month</span>
            </div>

            <hr className="nokia-divider" />

            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px", color: "var(--text-secondary)" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><span>✓</span> Post daily promo vouchers & discounts</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><span>✓</span> Auto-promoted emerald card on map</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><span>✓</span> Dedicated Partner command center</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><span>✓</span> Track foot-traffic and squad check-ins</li>
            </ul>

            <Link href="/dashboard/partner" className="nokia-btn nokia-btn-success" style={{ width: "100%", padding: "12px", textAlign: "center", textDecoration: "none", marginTop: "auto", borderRadius: "999px" }}>
              Open Partner Portal
            </Link>
          </div>

        </div>
      </section>

      {/* ── INTERACTIVE VIBE MATCHING QUIZ ─────────────────────────────────── */}
      <section
        style={{
          padding: "60px 20px",
          background: "rgba(255, 255, 255, 0.02)",
          borderTop: "1px solid var(--border-light)",
          borderBottom: "1px solid var(--border-light)",
          width: "100%",
        }}
      >
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          
          <div className="nokia-panel" style={{ padding: "32px", borderRadius: "24px" }}>
            
            {quizStep === 0 && (
              <div style={{ textAlign: "center" }}>
                <span className="nokia-badge nokia-badge-primary" style={{ marginBottom: "12px", display: "inline-block" }}>
                  15-SECOND SOCIAL QUIZ
                </span>
                <h3 className="font-pixel" style={{ fontSize: "22px", margin: "8px 0 14px" }}>
                  What is Your Karachi Vibe Type?
                </h3>
                <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "24px" }}>
                  Answer 3 quick visual questions to map your frequency and find your crowd in Karachi.
                </p>
                <button
                  type="button"
                  onClick={() => setQuizStep(1)}
                  className="nokia-btn nokia-btn-primary"
                  style={{ fontSize: "14px", padding: "12px 28px", borderRadius: "999px" }}
                >
                  Start Quiz ✨
                </button>
              </div>
            )}

            {quizStep > 0 && quizStep < 4 && (
              <div className="quiz-slide-enter">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>
                    QUESTION {quizStep} OF 3
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--accent-text)", fontWeight: 700 }}>
                    {quizStep === 1 ? "● ○ ○" : quizStep === 2 ? "● ● ○" : "● ● ●"}
                  </span>
                </div>

                <h3 className="font-pixel" style={{ fontSize: "18px", marginBottom: "20px", color: "var(--text-primary)" }}>
                  {QUIZ_QUESTIONS[quizStep - 1].question}
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {QUIZ_QUESTIONS[quizStep - 1].options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuizAnswer(opt.value)}
                      className="nokia-btn"
                      style={{
                        width: "100%",
                        fontSize: "14px",
                        padding: "14px 18px",
                        textAlign: "left",
                        justifyContent: "flex-start",
                        whiteSpace: "normal",
                        borderRadius: "14px",
                      }}
                    >
                      <span style={{ fontSize: "18px", marginRight: "6px" }}>{opt.icon}</span>
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {quizStep === 4 && (
              <div className="quiz-slide-enter" style={{ textAlign: "center" }}>
                <span className="nokia-badge nokia-badge-success" style={{ marginBottom: "12px" }}>
                  🎉 VIBE PROFILE MATCHED
                </span>

                <h3 className="font-pixel text-gradient" style={{ fontSize: "24px", margin: "8px 0 16px" }}>
                  {quizVibeType}
                </h3>

                <div className="nokia-panel-sunken" style={{ padding: "18px", textAlign: "left", marginBottom: "24px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, display: "block", color: "var(--accent-text)", marginBottom: "8px" }}>
                    RECOMMENDED CIRCLES IN KARACHI:
                  </span>
                  <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "14px", display: "flex", flexDirection: "column", gap: "8px", color: "var(--text-primary)" }}>
                    <li>🔥 <strong>Teahouse Chai Crawls</strong> (14 active hosts in DHA & Clifton)</li>
                    <li>🎾 <strong>Midnight Padel Sessions</strong> (8 active doubles circles)</li>
                    <li>☕ <strong>Sunset Coffee & FIFA</strong> (21 vetted members)</li>
                  </ul>
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                  <Link href="/apply" className="nokia-btn nokia-btn-primary" style={{ fontSize: "14px", padding: "12px 24px", borderRadius: "999px", textDecoration: "none" }}>
                    Join These Squads Now ✨
                  </Link>
                  <button
                    type="button"
                    onClick={resetQuiz}
                    className="nokia-btn"
                    style={{ fontSize: "14px", padding: "12px 20px", borderRadius: "999px" }}
                  >
                    ↻ Retake
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* ── FOOTER (MODERN & RICH) ────────────────────────────────────────── */}
      <footer
        style={{
          marginTop: "auto",
          padding: "48px 24px 28px",
          borderTop: "1px solid var(--border-light)",
          background: "rgba(15, 11, 21, 0.95)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "32px",
            marginBottom: "40px",
          }}
        >
          {/* Brand Col */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ fontSize: "20px" }}>🎉</span>
              <span className="font-pixel" style={{ fontSize: "16px", color: "var(--text-primary)" }}>
                SOLO-NO-MORE
              </span>
            </div>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6 }}>
              The IRL community in Karachi for people who want genuine connection. Padel, chai, gigs, and spontaneous meetups.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              MEMBERSHIP
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", color: "var(--text-muted)" }}>
              <Link href="/apply" style={{ color: "inherit", textDecoration: "none" }} className="hover:text-white">
                Apply for Membership
              </Link>
              <Link href="/login" style={{ color: "inherit", textDecoration: "none" }} className="hover:text-white">
                Member Sign In
              </Link>
              <Link href="/dashboard/upgrade" style={{ color: "inherit", textDecoration: "none" }} className="hover:text-white">
                Membership Hub (Rs. 2,000/mo)
              </Link>
            </div>
          </div>

          {/* Portals */}
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              ECOSYSTEM PORTALS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", color: "var(--text-muted)" }}>
              <Link href="/dashboard/artist" style={{ color: "inherit", textDecoration: "none" }} className="hover:text-white">
                🎤 Artist & Ticketing Portal
              </Link>
              <Link href="/dashboard/partner" style={{ color: "inherit", textDecoration: "none" }} className="hover:text-white">
                💼 Partner Venue Hub (Cafes/Arenas)
              </Link>
              <Link href="/dashboard/events" style={{ color: "inherit", textDecoration: "none" }} className="hover:text-white">
                🎟 Official Events & Raves
              </Link>
            </div>
          </div>

          {/* Localized */}
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              ACTIVE HUBS
            </div>
            <div style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6 }}>
              <div>📍 <strong>Karachi</strong> (DHA, Clifton, Gulshan)</div>
              <div>📍 <strong>Lahore</strong> (Gulberg, DHA, Johar Town)</div>
              <div>📍 <strong>Islamabad</strong> (F-6, F-7, F-11)</div>
            </div>
          </div>
        </div>

        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            paddingTop: "20px",
            borderTop: "1px solid var(--border-light)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            fontSize: "12px",
            color: "var(--text-muted)",
          }}
        >
          <div>© 2026 Solo-No-More. All rights reserved. Zero-algorithm IRL connection.</div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span>Skin Switcher:</span>
            <ThemeToggle />
          </div>
        </div>
      </footer>

    </main>
  );
}
