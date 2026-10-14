"use client";

import { useState } from "react";
import Link from "next/link";
import SubpageNavbar from "@/components/SubpageNavbar";
import SubpageFooter from "@/components/SubpageFooter";
import { MapPin, Users, Calendar, Clock, Ticket, Search, Sparkles, Filter, Check, ArrowRight, ShieldCheck } from "lucide-react";

interface EventItem {
  id: string;
  title: string;
  category: "sports" | "casual" | "nightlife" | "dining" | "arts";
  city: "Karachi" | "Lahore" | "Islamabad";
  location: string;
  neighborhood: string;
  date: string;
  time: string;
  joined: number;
  capacity: number;
  price: string;
  hostName: string;
  hostRole: string;
  tag: string;
}

const EVENTS_DATA: EventItem[] = [
  {
    id: "e1",
    title: "Late Night Chai & FIFA Rivals",
    category: "casual",
    city: "Karachi",
    location: "Chai Shai, Phase 6",
    neighborhood: "DHA Karachi",
    date: "Tonight",
    time: "10:30 PM",
    joined: 5,
    capacity: 6,
    price: "Free RSVP · Split Chai",
    hostName: "Zainab R.",
    hostRole: "Verified Member",
    tag: "1 SPOT LEFT",
  },
  {
    id: "e2",
    title: "Sunset Beach Volleyball & Bonfire",
    category: "sports",
    city: "Karachi",
    location: "Clifton Beach Arena",
    neighborhood: "Clifton, Karachi",
    date: "Tomorrow",
    time: "5:30 PM",
    joined: 8,
    capacity: 12,
    price: "PKR 800",
    hostName: "Hamza K.",
    hostRole: "Sports Curator",
    tag: "FILLING FAST",
  },
  {
    id: "e3",
    title: "Walled City Food Walk & Chai",
    category: "dining",
    city: "Lahore",
    location: "Delhi Gate",
    neighborhood: "Old City, Lahore",
    date: "Saturday",
    time: "7:00 PM",
    joined: 9,
    capacity: 14,
    price: "PKR 1,500",
    hostName: "Bilal S.",
    hostRole: "Heritage Host",
    tag: "FEATURED",
  },
  {
    id: "e4",
    title: "Acoustic Rooftop Sessions & Indie Jams",
    category: "nightlife",
    city: "Karachi",
    location: "Cafe Flo Rooftop",
    neighborhood: "Old Clifton, Karachi",
    date: "Friday",
    time: "9:00 PM",
    joined: 16,
    capacity: 25,
    price: "PKR 2,000",
    hostName: "Ayesha N.",
    hostRole: "Indie Musician",
    tag: "SELLING FAST",
  },
  {
    id: "e5",
    title: "Gulberg Padel Doubles Clash",
    category: "sports",
    city: "Lahore",
    location: "Smash Arena",
    neighborhood: "Gulberg III, Lahore",
    date: "Tonight",
    time: "9:00 PM",
    joined: 3,
    capacity: 4,
    price: "PKR 1,200",
    hostName: "Mustafa Q.",
    hostRole: "Padel Club Leader",
    tag: "MATCH POINT",
  },
  {
    id: "e6",
    title: "Margalla Sunrise Trail 3 Hike",
    category: "sports",
    city: "Islamabad",
    location: "Trail 3 Parking",
    neighborhood: "Sector F-6, Islamabad",
    date: "Sunday",
    time: "6:00 AM",
    joined: 6,
    capacity: 10,
    price: "Free RSVP",
    hostName: "Danial M.",
    hostRole: "Outdoors Host",
    tag: "FREE RSVP",
  },
  {
    id: "e7",
    title: "Boardgames, Catan & Specialty Coffee",
    category: "casual",
    city: "Karachi",
    location: "Dali Cafe, Zamzama",
    neighborhood: "Defence Phase V, Karachi",
    date: "Saturday",
    time: "4:00 PM",
    joined: 7,
    capacity: 8,
    price: "Free RSVP",
    hostName: "Sara T.",
    hostRole: "Boardgame Enthusiast",
    tag: "1 SPOT LEFT",
  },
  {
    id: "e8",
    title: "Tech Founders & Builders Mixer",
    category: "arts",
    city: "Karachi",
    location: "District 19, Korangi",
    neighborhood: "Karachi Creative Hub",
    date: "Thursday",
    time: "6:30 PM",
    joined: 22,
    capacity: 30,
    price: "PKR 1,000",
    hostName: "Raffay A.",
    hostRole: "Founder @ SNM",
    tag: "POPULAR",
  },
];

export default function BrowseEventsPage() {
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [joinedEvent, setJoinedEvent] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "All Vibes" },
    { id: "sports", label: "Padel & Sports 🏐" },
    { id: "casual", label: "Chai & Hangouts ☕" },
    { id: "nightlife", label: "Gigs & Rooftops 🌙" },
    { id: "dining", label: "Food Walks & Dinners 🍕" },
    { id: "arts", label: "Mixers & Creatives 🎨" },
  ];

  const filteredEvents = EVENTS_DATA.filter((e) => {
    const matchCity = selectedCity === "All" || e.city === selectedCity;
    const matchCategory = selectedCategory === "all" || e.category === selectedCategory;
    const matchSearch =
      searchQuery === "" ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.neighborhood.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCity && matchCategory && matchSearch;
  });

  return (
    <div style={{ background: "#060408", minHeight: "100vh", color: "#FFFFFF", position: "relative" }}>
      <SubpageNavbar activePage="/events" />

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

      <main style={{ position: "relative", zIndex: 1, padding: "70px 0 120px" }}>
        <div style={{ maxWidth: "1560px", margin: "0 auto", padding: "0 clamp(20px, 3.5vw, 56px)" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "24px", marginBottom: "40px" }}>
            <div>
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
                  marginBottom: "12px",
                  letterSpacing: "0.06em",
                }}
              >
                <Sparkles className="w-3.5 h-3.5" /> LIVE RADAR FEED · REAL PEOPLE IRL
              </div>
              <h1
                style={{
                  fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
                  fontSize: "clamp(32px, 5vw, 54px)",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  margin: "0 0 10px",
                  lineHeight: 1.15,
                }}
              >
                Browse Active Squads &amp; Events
              </h1>
              <p style={{ fontSize: "16px", color: "rgba(255, 255, 255, 0.65)", margin: 0, maxWidth: "600px" }}>
                Filter by vibe or neighborhood across Karachi, Lahore, Islamabad, and nationwide hubs. Join any verified squad with one tap.
              </p>
            </div>

            <Link
              href="/sell-tickets"
              style={{
                background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 45%, #E6450A 100%)",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 900,
                padding: "13px 26px",
                borderRadius: "12px",
                textDecoration: "none",
                boxShadow: "0 6px 24px rgba(255, 90, 31, 0.4)",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Ticket className="w-4 h-4" /> Host an Event / Sell Tickets
            </Link>
          </div>

          {/* Search & Filter Toolbar */}
          <div
            style={{
              background: "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "20px",
              padding: "18px 22px",
              backdropFilter: "blur(12px)",
              marginBottom: "40px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Top row: Search input + City chips */}
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              {/* Search Bar */}
              <div
                style={{
                  position: "relative",
                  flex: "1 1 300px",
                  maxWidth: "460px",
                }}
              >
                <Search className="w-4 h-4 text-white/50" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by spot (e.g. DHA Phase 6, Padel, Flo)..."
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.5)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    borderRadius: "12px",
                    padding: "10px 14px 10px 38px",
                    color: "#fff",
                    fontSize: "13.5px",
                    outline: "none",
                  }}
                />
              </div>

              {/* City Filter Pills */}
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginRight: "4px" }}>
                  City:
                </span>
                {["All", "Karachi", "Lahore", "Islamabad"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCity(c)}
                    style={{
                      padding: "7px 14px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: 800,
                      border: "1px solid " + (selectedCity === c ? "#FF5A1F" : "rgba(255,255,255,0.12)"),
                      background: selectedCity === c ? "rgba(255,90,31,0.2)" : "rgba(0,0,0,0.35)",
                      color: selectedCity === c ? "#fff" : "rgba(255,255,255,0.7)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom row: Category Pills */}
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "2px" }}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "12px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    border: "1px solid " + (selectedCategory === cat.id ? "transparent" : "rgba(255,255,255,0.12)"),
                    background: selectedCategory === cat.id ? "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)" : "rgba(0,0,0,0.35)",
                    color: "#fff",
                    cursor: "pointer",
                    boxShadow: selectedCategory === cat.id ? "0 4px 14px rgba(255,90,31,0.35)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 20px",
                background: "rgba(255,255,255,0.03)",
                border: "1px dashed rgba(255,255,255,0.15)",
                borderRadius: "24px",
              }}
            >
              <Users className="w-12 h-12 text-[#FF5A1F] mx-auto mb-3 opacity-60" />
              <h3 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 6px" }}>No Beacons Found in this Filter</h3>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", margin: "0 0 20px" }}>
                Be the first to drop a beacon for this vibe or location.
              </p>
              <Link
                href="/sell-tickets"
                style={{
                  background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)",
                  color: "#fff",
                  padding: "10px 22px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                Host This Vibe Instead
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: "28px",
              }}
            >
              {filteredEvents.map((event) => {
                const fillPct = Math.min(100, Math.round((event.joined / event.capacity) * 100));
                const isJoined = joinedEvent === event.id;

                return (
                  <div
                    key={event.id}
                    style={{
                      background: "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "24px",
                      padding: "24px",
                      backdropFilter: "blur(12px)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "0 18px 45px rgba(0,0,0,0.5)",
                      transition: "transform 0.2s ease, border-color 0.2s ease",
                    }}
                    className="hover:translate-y-[-4px] hover:border-[#FF5A1F]/50 group"
                  >
                    <div>
                      {/* Top Pill Row */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 900,
                            letterSpacing: "0.08em",
                            padding: "3px 8px",
                            borderRadius: "999px",
                            background: "rgba(255, 90, 31, 0.15)",
                            color: "#FF8A3D",
                            border: "1px solid rgba(255, 90, 31, 0.3)",
                            textTransform: "uppercase",
                          }}
                        >
                          {event.category.toUpperCase()}
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 900,
                            letterSpacing: "0.06em",
                            padding: "3px 8px",
                            borderRadius: "999px",
                            background: "rgba(39, 201, 63, 0.15)",
                            color: "#27C93F",
                            border: "1px solid rgba(39, 201, 63, 0.3)",
                          }}
                        >
                          {event.tag}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 style={{ fontSize: "19px", fontWeight: 800, margin: "0 0 10px", color: "#FFFFFF", lineHeight: 1.3 }}>
                        {event.title}
                      </h3>

                      {/* Location & Neighborhood */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "rgba(255,255,255,0.75)", marginBottom: "6px" }}>
                        <MapPin className="w-3.5 h-3.5 text-[#FF5A1F] flex-shrink-0" />
                        <span>{event.location}</span>
                        <span style={{ color: "rgba(255,255,255,0.4)" }}>· {event.neighborhood}</span>
                      </div>

                      {/* Date & Time */}
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "12.5px", color: "rgba(255,255,255,0.6)", marginBottom: "16px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Calendar className="w-3.5 h-3.5 text-white/50" /> {event.date}
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Clock className="w-3.5 h-3.5 text-white/50" /> {event.time}
                        </span>
                      </div>

                      {/* Capacity Bar */}
                      <div style={{ marginBottom: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.7)", marginBottom: "6px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <Users className="w-3 h-3 text-[#FF5A1F]" /> {event.joined}/{event.capacity} Joined Squad
                          </span>
                          <span>{fillPct}% Full</span>
                        </div>
                        <div style={{ height: "6px", borderRadius: "999px", background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
                          <div style={{ width: `${fillPct}%`, height: "100%", background: "linear-gradient(90deg, #FF6F26, #FF5A1F)", transition: "width 0.4s ease" }} />
                        </div>
                      </div>

                      {/* Host Info */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "rgba(255,255,255,0.55)", marginBottom: "18px" }}>
                        <ShieldCheck className="w-4 h-4 text-[#27C93F]" />
                        <span>Hosted by <strong>{event.hostName}</strong> ({event.hostRole})</span>
                      </div>
                    </div>

                    {/* Bottom Row: Price & Action */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase" }}>Pass</div>
                        <div style={{ fontSize: "14.5px", fontWeight: 800, color: "#fff" }}>{event.price}</div>
                      </div>

                      {isJoined ? (
                        <button
                          type="button"
                          onClick={() => setJoinedEvent(null)}
                          style={{
                            background: "rgba(39, 201, 63, 0.18)",
                            border: "1px solid rgba(39, 201, 63, 0.45)",
                            color: "#27C93F",
                            fontSize: "12.5px",
                            fontWeight: 800,
                            padding: "9px 16px",
                            borderRadius: "10px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Check className="w-3.5 h-3.5" /> RSVP Confirmed
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setJoinedEvent(event.id)}
                          style={{
                            background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)",
                            border: "none",
                            color: "#fff",
                            fontSize: "12.5px",
                            fontWeight: 900,
                            padding: "9px 18px",
                            borderRadius: "10px",
                            cursor: "pointer",
                            boxShadow: "0 4px 14px rgba(255,90,31,0.35)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          Join Squad <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
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
            <Sparkles className="w-3.5 h-3.5" /> CAN&apos;T FIND YOUR EXACT VIBE?
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
            Host Your Own Squad Meetup Tonight
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
            Whether it&apos;s a 4-player padel clash, late-night chai debate, or an acoustic rooftop jam, Solo-No-More gives you instant RSVP tracking, attendee telemetry, and verified member screening.
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
              href="/sell-tickets"
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
              <span>Host an Event / Sell Passes</span>
              <ArrowRight className="w-4 h-4 text-[#FF8A3D]" />
            </Link>
            <Link
              href="/apply"
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
              <span>Join Solo-No-More Pass</span>
              <ArrowRight className="w-4 h-4 text-[#FF5A1F]" />
            </Link>
          </div>
        </div>
      </section>

      <SubpageFooter />
    </div>
  );
}
