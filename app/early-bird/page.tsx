"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Flame,
  Clock,
  Heart,
  Share2,
  Copy,
  Check,
  Ticket,
  Users,
  Compass,
  AlertCircle,
  Coffee,
  Car,
  Music,
  Utensils,
  Palette,
  Laptop,
  Radio,
  ChevronDown,
} from "lucide-react";

const CITIES_LIST = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Peshawar",
  "Faisalabad",
  "Multan",
  "Quetta",
  "Sialkot",
  "Gujranwala",
  "Hyderabad",
  "Abbottabad",
  "Other",
];

const VIBE_OPTIONS = [
  { id: "chai", label: "Midnight Chai & Paratha", icon: Coffee },
  { id: "padel", label: "Padel Smash & Active Sports", icon: Zap },
  { id: "drive", label: "Midnight Long Drives", icon: Car },
  { id: "rooftop", label: "Acoustic Rooftop Baithaks", icon: Music },
  { id: "food", label: "Late Night Food Crawls", icon: Utensils },
  { id: "creative", label: "Art, Cinema & Creative Meets", icon: Palette },
  { id: "work", label: "Cozy Cafe Work Sessions", icon: Laptop },
  { id: "beacons", label: "Spontaneous Squad Drops", icon: Radio },
];

export default function EarlyBirdPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [otherCity, setOtherCity] = useState("");
  const [area, setArea] = useState("");
  const [selectedVibes, setSelectedVibes] = useState<string[]>([
    "Midnight Chai & Paratha",
    "Spontaneous Squad Drops",
  ]);
  const [customVibe, setCustomVibe] = useState("");
  const [whyJoin, setWhyJoin] = useState("");

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [ticketNumber, setTicketNumber] = useState("0482");
  const [copiedLink, setCopiedLink] = useState(false);

  const toggleVibe = (label: string) => {
    setSelectedVibes((prev) =>
      prev.includes(label) ? prev.filter((v) => v !== label) : [...prev, label]
    );
  };

  const handleAddCustomVibe = () => {
    const trimmed = customVibe.trim();
    if (trimmed && !selectedVibes.includes(trimmed)) {
      setSelectedVibes((prev) => [...prev, trimmed]);
      setCustomVibe("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !whyJoin.trim()) {
      setErrorMessage("Please fill in your name, email, phone, and why you want to join.");
      setStatus("error");
      return;
    }

    if (!city) {
      setErrorMessage("Please select your city.");
      setStatus("error");
      return;
    }

    if (city === "Other" && !otherCity.trim()) {
      setErrorMessage("Please specify your city name.");
      setStatus("error");
      return;
    }

    if (!area.trim()) {
      setErrorMessage("Please enter your area or neighborhood.");
      setStatus("error");
      return;
    }

    const finalCity = city === "Other" ? otherCity.trim() : city;
    const finalLocation = `${area.trim()}, ${finalCity}`;
    const generatedTicket = Math.floor(1000 + Math.random() * 9000).toString();
    setTicketNumber(generatedTicket);

    setStatus("submitting");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("access_key", "2d4b8d82-4e42-4fd4-a7ee-b7e9ff59e275");
      formData.append("subject", `🔥 New Early Bird VIP Signup: ${name} (${finalLocation})`);
      formData.append("from_name", "Solo-No-More Early Birds");
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      formData.append("phone", phone.trim());
      formData.append("city", finalCity);
      formData.append("area", area.trim());
      formData.append("location", finalLocation);
      formData.append("vibes", selectedVibes.join(", ") || "General Hangouts");
      formData.append("why_join_platform", whyJoin.trim());
      formData.append("ticket_number", `#SNM-EB-${generatedTicket}`);
      formData.append("botcheck", ""); // honeypot

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
      } else {
        setErrorMessage(data.message || "Failed to submit form. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMessage("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  };

  const shareText = encodeURIComponent(
    `I just claimed my Early Bird VIP Pass for Solo-No-More! Never go out alone again — find your IRL vibe squad here: https://solonomore.com/early-bird`
  );

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const displayCity = city === "Other" ? (otherCity.trim() || "Other City") : city;
  const activeLocationDisplay = displayCity
    ? area.trim()
      ? `${area.trim()}, ${displayCity}`
      : displayCity
    : area.trim()
    ? area.trim()
    : "Your City & Area";

  return (
    <div
      style={{
        background: "#060408",
        minHeight: "100vh",
        color: "#FFFFFF",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Standalone Minimal Early Bird Header */}
      <header
        style={{
          width: "100%",
          padding: "18px clamp(20px, 4vw, 48px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(6, 4, 8, 0.82)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Brand Logo without external navigation */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <img
              src="/images/logo.png"
              alt="Solo-No-More"
              style={{ height: "30px", width: "auto", objectFit: "contain" }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/logo.png";
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "999px",
              background: "rgba(255, 111, 38, 0.12)",
              border: "1px solid rgba(255, 111, 38, 0.35)",
              fontSize: "11px",
              fontWeight: 800,
              color: "#FFA05C",
              letterSpacing: "0.04em",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-[#3DDC97] animate-pulse" />
            <span>EARLY BIRD PASS · WAVE 1</span>
          </div>
        </div>
      </header>

      {/* Atmospheric Orange Ambient Glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "1200px",
          height: "650px",
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255, 90, 31, 0.32) 0%, rgba(255, 90, 31, 0.05) 60%, transparent 80%)",
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
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.15) 1.25px, transparent 1.25px)",
          backgroundSize: "22px 22px",
          pointerEvents: "none",
          opacity: 0.5,
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      <main style={{ position: "relative", zIndex: 1, padding: "50px 0 100px" }}>
        <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "0 clamp(20px, 3.5vw, 56px)" }}>
          {/* Top Hero Pill & Headline */}
          <div style={{ textAlign: "center", maxWidth: "820px", margin: "0 auto 50px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "linear-gradient(135deg, rgba(255, 90, 31, 0.22) 0%, rgba(255, 90, 31, 0.06) 100%)",
                border: "1px solid rgba(255, 90, 31, 0.45)",
                padding: "7px 18px",
                borderRadius: "999px",
                fontSize: "12.5px",
                fontWeight: 800,
                color: "#FFA05C",
                marginBottom: "18px",
                letterSpacing: "0.05em",
                boxShadow: "0 0 25px rgba(255, 90, 31, 0.25)",
              }}
            >
              <span className="w-2 h-2 rounded-full bg-[#3DDC97] animate-pulse" style={{ boxShadow: "0 0 10px #3DDC97" }} />
              <span>PRE-LAUNCH WAITLIST · BATCH 01 EARLY BIRD PASS</span>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
                fontSize: "clamp(32px, 5.2vw, 62px)",
                fontWeight: 900,
                letterSpacing: "-0.035em",
                margin: "0 0 16px",
                lineHeight: 1.12,
              }}
            >
              <span>Never Go Out Alone Again. </span>
              <span
                style={{
                  background: "linear-gradient(135deg, #FF9447 0%, #FF5A1F 55%, #E6450A 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Claim Your Early Bird Spot.
              </span>
            </h1>

            <p
              style={{
                fontSize: "clamp(15px, 1.8vw, 19px)",
                color: "rgba(255, 255, 255, 0.75)",
                lineHeight: 1.6,
                margin: 0,
                maxWidth: "680px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              We’re opening Solo-No-More to our first wave of members. Sign up below to get early platform access,
              founding status, and priority invitations to curated chai runs, padel matches, and rooftop gigs.
            </p>
          </div>

          {/* Main 2-Column Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "40px",
              alignItems: "start",
            }}
          >
            {/* ── LEFT COLUMN: Interactive VIP Pass & Founding Perks ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {/* Live Interactive VIP Pass Ticket */}
              <div
                style={{
                  position: "relative",
                  borderRadius: "24px",
                  background: "linear-gradient(135deg, #160D20 0%, #0E0715 100%)",
                  border: "1.5px solid rgba(255, 90, 31, 0.35)",
                  padding: "28px",
                  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 35px rgba(255, 90, 31, 0.15)",
                  overflow: "hidden",
                }}
              >
                {/* Holographic Subtle Top Sheen */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "200px",
                    height: "200px",
                    background: "radial-gradient(circle at 100% 0%, rgba(255, 90, 31, 0.3) 0%, transparent 70%)",
                    pointerEvents: "none",
                  }}
                />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: "rgba(255, 90, 31, 0.15)",
                        border: "1px solid rgba(255, 90, 31, 0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ticket className="w-5 h-5 text-[#FF8A3D]" />
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 900, color: "#FFA05C", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        FOUNDING MEMBER PASS
                      </span>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#FFFFFF" }}>
                        Solo-No-More IRL Club
                      </h3>
                    </div>
                  </div>

                  <span
                    style={{
                      background: "rgba(200, 255, 0, 0.12)",
                      border: "1px solid rgba(200, 255, 0, 0.3)",
                      color: "#C8FF00",
                      fontSize: "11px",
                      fontWeight: 800,
                      padding: "4px 10px",
                      borderRadius: "999px",
                      letterSpacing: "0.04em",
                    }}
                  >
                    VIP TICKET #{ticketNumber}
                  </span>
                </div>

                {/* Ticket Details Box */}
                <div
                  style={{
                    background: "rgba(0, 0, 0, 0.4)",
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    padding: "18px",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ marginBottom: "14px" }}>
                    <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                      PASS HOLDER
                    </span>
                    <div style={{ fontSize: "20px", fontWeight: 900, color: "#FFFFFF", marginTop: "2px" }}>
                      {name.trim() ? name : "Your Name Here"}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", paddingTop: "12px", borderTop: "1px dashed rgba(255, 255, 255, 0.12)" }}>
                    <div>
                      <span style={{ fontSize: "10.5px", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                        PRIMARY ZONE
                      </span>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#FF9447", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{activeLocationDisplay}</span>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: "10.5px", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                        STATUS
                      </span>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#3DDC97", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Pre-Launch Vetted</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selected Vibes Tags Preview */}
                <div>
                  <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                    SELECTED VIBES & INTERESTS
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                    {selectedVibes.length > 0 ? (
                      selectedVibes.map((vibe) => (
                        <span
                          key={vibe}
                          style={{
                            background: "rgba(255, 90, 31, 0.14)",
                            border: "1px solid rgba(255, 90, 31, 0.3)",
                            color: "#FFA05C",
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "3px 9px",
                            borderRadius: "6px",
                          }}
                        >
                          {vibe}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.4)", fontStyle: "italic" }}>
                        Select vibes below to add them to your pass...
                      </span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "20px",
                    paddingTop: "14px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                    fontSize: "11px",
                    color: "rgba(255, 255, 255, 0.4)",
                  }}
                >
                  <span>LIVE PASS PREVIEW · OFFICIAL INVITATION</span>
                  <span style={{ fontFamily: "monospace", letterSpacing: "0.1em" }}>SNM-2026-VIP</span>
                </div>
              </div>

              {/* Early Bird Perks */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "20px",
                  padding: "24px",
                }}
              >
                <h4 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 800, color: "#FFFFFF", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles className="w-4 h-4 text-[#FF8A3D]" />
                  What Early Birds Receive:
                </h4>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: "rgba(255, 90, 31, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Zap className="w-4 h-4 text-[#FF8A3D]" />
                    </div>
                    <div>
                      <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#FFFFFF" }}>
                        Priority Beacon Broadcast Rights
                      </div>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", lineHeight: 1.45 }}>
                        Drop hangouts anytime and invite nearby verified squads before the general public.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: "rgba(200, 255, 0, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#C8FF00]" />
                    </div>
                    <div>
                      <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#FFFFFF" }}>
                        Founding Member Profile Badge
                      </div>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", lineHeight: 1.45 }}>
                        Permanent gold founder badge on your public Solo-No-More member card.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: "rgba(255, 90, 31, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Heart className="w-4 h-4 text-[#FF8A3D]" />
                    </div>
                    <div>
                      <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#FFFFFF" }}>
                        Zero Awkward Flakes
                      </div>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", lineHeight: 1.45 }}>
                        Every signup is personally vetted to ensure everyone showing up is genuine, respectful, and friendly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: The Web3Forms Signup Form ── */}
            <div
              style={{
                borderRadius: "24px",
                background: "rgba(14, 7, 20, 0.85)",
                border: "1.5px solid rgba(255, 90, 31, 0.35)",
                padding: "clamp(24px, 4vw, 36px)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: "0 25px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(255, 90, 31, 0.12)",
              }}
            >
              {status === "success" ? (
                /* ── SUCCESS STATE ── */
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, rgba(39, 201, 63, 0.25) 0%, rgba(39, 201, 63, 0.08) 100%)",
                      border: "2px solid #27C93F",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 20px",
                      boxShadow: "0 0 30px rgba(39, 201, 63, 0.35)",
                    }}
                  >
                    <Check className="w-8 h-8 text-[#27C93F]" />
                  </div>

                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 800,
                      color: "#C8FF00",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      background: "rgba(200, 255, 0, 0.12)",
                      padding: "4px 12px",
                      borderRadius: "999px",
                      border: "1px solid rgba(200, 255, 0, 0.3)",
                      display: "inline-block",
                      marginBottom: "12px",
                    }}
                  >
                    FOUNDER PASS RESERVED
                  </span>

                  <h2
                    style={{
                      fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
                      fontSize: "clamp(26px, 4vw, 36px)",
                      fontWeight: 900,
                      margin: "0 0 12px",
                      color: "#FFFFFF",
                    }}
                  >
                    You’re On The VIP List, {name.split(" ")[0]}! 🎉
                  </h2>

                  <p
                    style={{
                      fontSize: "15px",
                      color: "rgba(255, 255, 255, 0.75)",
                      lineHeight: 1.6,
                      maxWidth: "460px",
                      margin: "0 auto 24px",
                    }}
                  >
                    Your submission has been received and your VIP pass <strong>#{ticketNumber}</strong> has been saved.
                    We’ll contact you via WhatsApp and email as soon as squad beta drops in {activeLocationDisplay}!
                  </p>

                  {/* Share Box */}
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "16px",
                      padding: "20px",
                      marginBottom: "24px",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#FFA05C", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      SPREAD THE WORD & SKIP THE LINE
                    </span>
                    <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.65)", margin: "4px 0 16px", lineHeight: 1.45 }}>
                      Friends who join with your link get seated in your same initial squad match.
                    </p>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <a
                        href={`https://wa.me/?text=${shareText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1,
                          minWidth: "160px",
                          background: "#25D366",
                          color: "#FFFFFF",
                          fontWeight: 800,
                          fontSize: "13.5px",
                          padding: "12px 18px",
                          borderRadius: "12px",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          boxShadow: "0 4px 18px rgba(37, 211, 102, 0.35)",
                          transition: "transform 0.15s ease",
                        }}
                        className="hover:scale-105 active:scale-95"
                      >
                        <Share2 className="w-4 h-4" /> Share on WhatsApp
                      </a>

                      <button
                        type="button"
                        onClick={handleCopyLink}
                        style={{
                          background: "rgba(255, 255, 255, 0.08)",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          color: "#FFFFFF",
                          fontWeight: 700,
                          fontSize: "13.5px",
                          padding: "12px 18px",
                          borderRadius: "12px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                        className="hover:bg-white/15"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-4 h-4 text-[#27C93F]" /> Link Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" /> Copy Link
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <Link
                    href="/"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#FFA05C",
                      fontSize: "14px",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                    className="hover:underline"
                  >
                    Back to Solo-No-More Homepage <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                /* ── FORM STATE ── */
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#FFA05C", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      STEP 1 OF 1 · EARLY BIRD APPLICATION
                    </span>
                    <h2
                      style={{
                        fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
                        fontSize: "24px",
                        fontWeight: 900,
                        margin: "4px 0 6px",
                        color: "#FFFFFF",
                      }}
                    >
                      Reserve Your Spot
                    </h2>
                    <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)", margin: 0 }}>
                      Takes less than 60 seconds. Early access spots are allocated on a first-come basis.
                    </p>
                  </div>

                  {status === "error" && errorMessage && (
                    <div
                      style={{
                        background: "rgba(255, 77, 77, 0.12)",
                        border: "1px solid rgba(255, 77, 77, 0.35)",
                        borderRadius: "12px",
                        padding: "12px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        color: "#FF8E8E",
                        fontSize: "13px",
                      }}
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* 1. Name */}
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: "rgba(255, 255, 255, 0.9)" }}>
                      Full Name <span style={{ color: "#FF5A1F" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <User
                        className="w-4 h-4 text-white/40"
                        style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
                      />
                      <input
                        type="text"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ayesha Khan"
                        required
                        style={{
                          width: "100%",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.14)",
                          borderRadius: "12px",
                          padding: "13px 14px 13px 42px",
                          color: "#FFFFFF",
                          fontSize: "14px",
                          outline: "none",
                          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                        }}
                        className="focus:border-[#FF5A1F] focus:shadow-[0_0_15px_rgba(255,90,31,0.25)]"
                      />
                    </div>
                  </div>

                  {/* 2. Email & Phone in 2 Columns */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: "rgba(255, 255, 255, 0.9)" }}>
                        Email Address <span style={{ color: "#FF5A1F" }}>*</span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <Mail
                          className="w-4 h-4 text-white/40"
                          style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
                        />
                        <input
                          type="email"
                          name="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="ayesha@example.com"
                          required
                          style={{
                            width: "100%",
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.14)",
                            borderRadius: "12px",
                            padding: "13px 14px 13px 42px",
                            color: "#FFFFFF",
                            fontSize: "14px",
                            outline: "none",
                          }}
                          className="focus:border-[#FF5A1F] focus:shadow-[0_0_15px_rgba(255,90,31,0.25)]"
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: "rgba(255, 255, 255, 0.9)" }}>
                        WhatsApp / Phone <span style={{ color: "#FF5A1F" }}>*</span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <Phone
                          className="w-4 h-4 text-white/40"
                          style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
                        />
                        <input
                          type="tel"
                          name="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+92 300 1234567"
                          required
                          style={{
                            width: "100%",
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.14)",
                            borderRadius: "12px",
                            padding: "13px 14px 13px 42px",
                            color: "#FFFFFF",
                            fontSize: "14px",
                            outline: "none",
                          }}
                          className="focus:border-[#FF5A1F] focus:shadow-[0_0_15px_rgba(255,90,31,0.25)]"
                        />
                      </div>
                      <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)", marginTop: "4px", display: "block" }}>
                        For squad drop invites & verification code. No spam ever.
                      </span>
                    </div>
                  </div>

                  {/* 3. Location: City Dropdown & Area Input */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                    {/* City Dropdown */}
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: "rgba(255, 255, 255, 0.9)" }}>
                        City <span style={{ color: "#FF5A1F" }}>*</span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <MapPin
                          className="w-4 h-4 text-white/40 pointer-events-none"
                          style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
                        />
                        <select
                          name="city"
                          value={city}
                          onChange={(e) => {
                            setCity(e.target.value);
                            if (e.target.value !== "Other") {
                              setOtherCity("");
                            }
                          }}
                          required
                          style={{
                            width: "100%",
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.14)",
                            borderRadius: "12px",
                            padding: "13px 38px 13px 42px",
                            color: city ? "#FFFFFF" : "rgba(255, 255, 255, 0.45)",
                            fontSize: "14px",
                            outline: "none",
                            appearance: "none",
                            cursor: "pointer",
                          }}
                          className="focus:border-[#FF5A1F] focus:shadow-[0_0_15px_rgba(255,90,31,0.25)]"
                        >
                          <option value="" disabled style={{ background: "#0E0714", color: "rgba(255, 255, 255, 0.5)" }}>
                            Select your city...
                          </option>
                          {CITIES_LIST.map((c) => (
                            <option key={c} value={c} style={{ background: "#0E0714", color: "#FFFFFF" }}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className="w-4 h-4 text-white/40 pointer-events-none"
                          style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)" }}
                        />
                      </div>
                    </div>

                    {/* Area Input (Never autofilled) */}
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: "rgba(255, 255, 255, 0.9)" }}>
                        Area / Neighborhood <span style={{ color: "#FF5A1F" }}>*</span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <Compass
                          className="w-4 h-4 text-white/40"
                          style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
                        />
                        <input
                          type="text"
                          name="area"
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          placeholder="e.g. Clifton, DHA, Gulberg, F-7..."
                          required
                          style={{
                            width: "100%",
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.14)",
                            borderRadius: "12px",
                            padding: "13px 14px 13px 42px",
                            color: "#FFFFFF",
                            fontSize: "14px",
                            outline: "none",
                          }}
                          className="focus:border-[#FF5A1F] focus:shadow-[0_0_15px_rgba(255,90,31,0.25)]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Conditional Other City Input */}
                  {city === "Other" && (
                    <div style={{ marginTop: "-6px" }}>
                      <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, marginBottom: "6px", color: "rgba(255, 255, 255, 0.85)" }}>
                        Specify Your City <span style={{ color: "#FF5A1F" }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={otherCity}
                        onChange={(e) => setOtherCity(e.target.value)}
                        placeholder="Enter your city name (e.g. Sukkur, Sargodha, Overseas)..."
                        required
                        style={{
                          width: "100%",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.14)",
                          borderRadius: "12px",
                          padding: "12px 14px",
                          color: "#FFFFFF",
                          fontSize: "13.5px",
                          outline: "none",
                        }}
                        className="focus:border-[#FF5A1F]"
                      />
                    </div>
                  )}

                  {/* 4. Vibes Selector */}
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: "rgba(255, 255, 255, 0.9)" }}>
                      What Vibes Are You Looking For? <span style={{ color: "#FF5A1F" }}>*</span>
                    </label>
                    <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.55)", margin: "-4px 0 10px" }}>
                      Tap all that match your energy. We will curate matching squad drops for you.
                    </p>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {VIBE_OPTIONS.map((vibe) => {
                        const Icon = vibe.icon;
                        const isSelected = selectedVibes.includes(vibe.label);
                        return (
                          <button
                            key={vibe.id}
                            type="button"
                            onClick={() => toggleVibe(vibe.label)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "7px",
                              background: isSelected ? "rgba(255, 90, 31, 0.22)" : "rgba(255, 255, 255, 0.04)",
                              border: isSelected ? "1.5px solid #FF5A1F" : "1px solid rgba(255, 255, 255, 0.12)",
                              color: isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.75)",
                              fontSize: "12px",
                              fontWeight: isSelected ? 800 : 500,
                              padding: "8px 12px",
                              borderRadius: "10px",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            className="hover:border-[#FF5A1F]"
                          >
                            <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-[#FFA05C]" : "text-white/50"}`} />
                            <span>{vibe.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Add Custom Vibe */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                      <input
                        type="text"
                        value={customVibe}
                        onChange={(e) => setCustomVibe(e.target.value)}
                        placeholder="Add another vibe (e.g. Board games, Hiking)..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomVibe();
                          }
                        }}
                        style={{
                          flex: 1,
                          background: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "10px",
                          padding: "8px 12px",
                          color: "#FFFFFF",
                          fontSize: "12.5px",
                          outline: "none",
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomVibe}
                        style={{
                          background: "rgba(255, 90, 31, 0.2)",
                          border: "1px solid rgba(255, 90, 31, 0.4)",
                          color: "#FFA05C",
                          fontSize: "12px",
                          fontWeight: 700,
                          padding: "8px 14px",
                          borderRadius: "10px",
                          cursor: "pointer",
                        }}
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {/* 5. Why Join Platform */}
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: "rgba(255, 255, 255, 0.9)" }}>
                      Why Do You Want To Join Solo-No-More? <span style={{ color: "#FF5A1F" }}>*</span>
                    </label>
                    <textarea
                      name="why_join"
                      value={whyJoin}
                      onChange={(e) => setWhyJoin(e.target.value)}
                      placeholder="Tell us what you're hoping to find on Solo-No-More! (e.g. Moved to a new area, tired of flaky group chats, want padel/chai partners, looking to expand my circle...)"
                      required
                      rows={3}
                      style={{
                        width: "100%",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.14)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        color: "#FFFFFF",
                        fontSize: "13.5px",
                        lineHeight: 1.55,
                        outline: "none",
                        resize: "vertical",
                      }}
                      className="focus:border-[#FF5A1F] focus:shadow-[0_0_15px_rgba(255,90,31,0.25)]"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    style={{
                      background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 45%, #E6450A 100%)",
                      color: "#FFFFFF",
                      fontSize: "15px",
                      fontWeight: 800,
                      padding: "16px 24px",
                      borderRadius: "14px",
                      border: "none",
                      cursor: status === "submitting" ? "not-allowed" : "pointer",
                      boxShadow: "0 8px 30px rgba(255, 90, 31, 0.45)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      transition: "transform 0.15s ease, box-shadow 0.15s ease",
                      opacity: status === "submitting" ? 0.75 : 1,
                      marginTop: "4px",
                    }}
                    className="hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {status === "submitting" ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Securing Your Early Bird Spot...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Claim Your Early Bird Spot Now</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11.5px", color: "rgba(255, 255, 255, 0.5)" }}>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#3DDC97]" />
                    <span>Free Early Bird Pass · Zero Spam Guarantee · Curated Humans Only</span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Standalone Minimal Early Bird Footer */}
      <footer
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "32px 24px",
          textAlign: "center",
          background: "#040306",
          color: "rgba(255, 255, 255, 0.5)",
          fontSize: "12px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.01em" }}>Solo-No-More</span>
            <span>·</span>
            <span>Vetted IRL Hangouts in Karachi</span>
          </div>
          <p style={{ margin: 0, fontSize: "11.5px", color: "rgba(255, 255, 255, 0.4)" }}>
            © {new Date().getFullYear()} Solo-No-More. Early access pass registration is free. Your information is strictly confidential.
          </p>
        </div>
      </footer>
    </div>
  );
}
