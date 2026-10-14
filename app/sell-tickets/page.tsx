"use client";

import { useState } from "react";
import Link from "next/link";
import SubpageNavbar from "@/components/SubpageNavbar";
import SubpageFooter from "@/components/SubpageFooter";
import { Ticket, QrCode, Smartphone, Zap, ShieldCheck, Check, DollarSign, Users, Sparkles, Send, ArrowRight, BarChart3 } from "lucide-react";

export default function SellYourTicketPage() {
  const [ticketPrice, setTicketPrice] = useState(1500);
  const [attendees, setAttendees] = useState(30);

  // Form State
  const [hostName, setHostName] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState("music");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const [capacity, setCapacity] = useState("40");
  const [priceInput, setPriceInput] = useState("1500");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Calculations
  const grossRevenue = ticketPrice * attendees;
  const platformFee = Math.round(grossRevenue * 0.05); // 5% flat fee
  const hostPayout = grossRevenue - platformFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 700);
  };

  const perks = [
    {
      icon: Ticket,
      title: "Online Ticketing Portal",
      desc: "Create beautiful, high-converting event pages with integrated payments via Raast, JazzCash, NayaPay, and Credit/Debit Cards. Zero hassle setup.",
    },
    {
      icon: QrCode,
      title: "Instant QR Scanning System",
      desc: "Use our built-in mobile scanning portal to scan digital attendee passes at the door in under 0.2 seconds. Detects duplicates and fraud instantly, even offline.",
    },
    {
      icon: Users,
      title: "Built-In Squad Discovery",
      desc: "Tap into our nationwide network of over 12,000+ vetted youth actively looking for plans. Your event automatically pulses onto the live city radar feed.",
    },
    {
      icon: BarChart3,
      title: "Live Attendee CRM & Analytics",
      desc: "Track real-time ticket velocity, check-in percentages, and communicate with ticket holders through a private temporary squad announcement lobby.",
    },
  ];

  return (
    <div style={{ background: "#060408", minHeight: "100vh", color: "#FFFFFF", position: "relative" }}>
      <SubpageNavbar activePage="/sell-tickets" />

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
              <Ticket className="w-3.5 h-3.5" /> FOR ARTISTS, ORGANIZERS &amp; SQUAD CURATORS
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
              Sell Your Event Tickets with Solo-No-More
            </h1>
            <p style={{ fontSize: "18px", color: "rgba(255, 255, 255, 0.65)", lineHeight: 1.6, margin: 0 }}>
              Complete ticketing suite with online payments, instant door QR scanning, and automated payouts for concerts, padel tournaments, food walks, and parties.
            </p>
          </div>

          {/* 4 Core Perks Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "28px",
              marginBottom: "70px",
            }}
          >
            {perks.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div
                  key={idx}
                  style={{
                    background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 40%, #E6450A 75%, #BD3000 100%)",
                    border: "1.5px solid rgba(255,255,255,0.25)",
                    borderRadius: "24px",
                    padding: "32px 26px",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.45), 0 0 35px rgba(255,90,31,0.25)",
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
                      zIndex: 0,
                      opacity: 0.85,
                    }}
                    aria-hidden="true"
                  />

                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "14px",
                        background: "#0E0714",
                        border: "1.5px solid rgba(255, 255, 255, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "18px",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
                      }}
                    >
                      <Icon className="w-6 h-6 text-[#FF8A3D]" />
                    </div>
                    <h3 style={{ fontSize: "19px", fontWeight: 800, margin: "0 0 10px", color: "#FFFFFF", textShadow: "0 2px 10px rgba(0,0,0,0.2)" }}>
                      {p.title}
                    </h3>
                    <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.95)", lineHeight: 1.6, margin: 0, textShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
                      {p.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Payout Calculator */}
          <div
            style={{
              background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 40%, #E6450A 75%, #BD3000 100%)",
              border: "1.5px solid rgba(255,255,255,0.3)",
              borderRadius: "32px",
              padding: "clamp(30px, 4.5vw, 50px)",
              marginBottom: "80px",
              boxShadow: "0 30px 80px rgba(255,90,31,0.4)",
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
                zIndex: 0,
                opacity: 0.85,
              }}
              aria-hidden="true"
            />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 36px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 900,
                    color: "#FFFFFF",
                    background: "#0E0714",
                    border: "1px solid rgba(255,255,255,0.3)",
                    padding: "4px 14px",
                    borderRadius: "999px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
                  }}
                >
                  TRANSPARENT 5% COMMISION ONLY
                </span>
                <h2
                  style={{
                    fontFamily: "var(--font-display), system-ui, sans-serif",
                    fontSize: "clamp(26px, 4vw, 36px)",
                    fontWeight: 900,
                    margin: "14px 0 8px",
                    color: "#FFFFFF",
                    textShadow: "0 2px 14px rgba(0,0,0,0.22)",
                  }}
                >
                  Interactive Host Earnings Calculator
                </h2>
                <p style={{ fontSize: "14.5px", color: "rgba(255,255,255,0.95)", margin: 0 }}>
                  Adjust your ticket price and expected squad size to see your estimated net payout.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "36px", alignItems: "center" }}>
                {/* Sliders */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF" }}>Ticket Price (PKR)</span>
                      <span style={{ fontSize: "16px", fontWeight: 900, color: "#FFFFFF", background: "rgba(0,0,0,0.35)", padding: "3px 10px", borderRadius: "8px" }}>
                        PKR {ticketPrice.toLocaleString()}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="10000"
                      step="250"
                      value={ticketPrice}
                      onChange={(e) => setTicketPrice(Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#0E0714", cursor: "pointer" }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "rgba(255,255,255,0.8)", marginTop: "4px" }}>
                      <span>PKR 500</span>
                      <span>PKR 10,000</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF" }}>Squad Size / Attendees</span>
                      <span style={{ fontSize: "16px", fontWeight: 900, color: "#FFFFFF", background: "rgba(0,0,0,0.35)", padding: "3px 10px", borderRadius: "8px" }}>
                        {attendees} Guests
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="150"
                      step="5"
                      value={attendees}
                      onChange={(e) => setAttendees(Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#0E0714", cursor: "pointer" }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "rgba(255,255,255,0.8)", marginTop: "4px" }}>
                      <span>5 Guests</span>
                      <span>150 Guests</span>
                    </div>
                  </div>
                </div>

                {/* Result Payout Card */}
                <div
                  style={{
                    background: "#0E0714",
                    border: "1.5px solid rgba(255,255,255,0.25)",
                    borderRadius: "24px",
                    padding: "28px",
                    textAlign: "center",
                    boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Estimated Net Host Payout
                  </div>
                  <div style={{ fontSize: "clamp(34px, 5vw, 44px)", fontWeight: 900, color: "#27C93F", margin: "8px 0" }}>
                    PKR {hostPayout.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.7)", display: "flex", justifyContent: "center", gap: "16px" }}>
                    <span>Gross: PKR {grossRevenue.toLocaleString()}</span>
                    <span>Fee (5%): PKR {platformFee.toLocaleString()}</span>
                  </div>
                  <div style={{ marginTop: "16px", fontSize: "11.5px", color: "#FFA05C", background: "rgba(255,90,31,0.18)", border: "1px solid rgba(255,90,31,0.3)", padding: "6px 12px", borderRadius: "999px" }}>
                    ⚡ Automated bank settlement within 24 hours of event completion
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Event Listing Kickoff Form */}
          <div
            id="list-event-form"
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
                <Sparkles className="w-3.5 h-3.5" /> START TICKETING
              </div>
              <h2 style={{ fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 900, margin: "0 0 10px", color: "#fff" }}>
                Submit Your Event for Listing
              </h2>
              <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", margin: 0 }}>
                Get your custom ticketing page, QR scanner access, and radar push notification.
              </p>
            </div>

            {submitted ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <ShieldCheck className="w-16 h-16 text-[#27C93F] mx-auto mb-4" />
                <h3 style={{ fontSize: "24px", fontWeight: 900, margin: "0 0 8px" }}>Event Submitted for Review!</h3>
                <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.7)", maxWidth: "520px", margin: "0 auto 24px" }}>
                  Thank you <strong>{hostName}</strong>. Your event <strong>&ldquo;{eventTitle}&rdquo;</strong> is being prepared. We will send your ticketing link and door QR scanner login to WhatsApp ({phone}) shortly.
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
                  List Another Event
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                      Host / Organizer Name
                    </label>
                    <input
                      required
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      placeholder="e.g. Ayesha &amp; Hamza"
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
                      WhatsApp Phone Number
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

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                    Event Title
                  </label>
                  <input
                    required
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="e.g. Sunset Acoustic Rooftop Jam"
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

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                      Venue &amp; Neighborhood
                    </label>
                    <input
                      required
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="e.g. District 19 or Chai Shai DHA"
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
                      Target Date &amp; Time
                    </label>
                    <input
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      placeholder="e.g. Friday, 9:00 PM"
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
                      Ticket Price (PKR)
                    </label>
                    <input
                      required
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      placeholder="e.g. 1500 (or Free)"
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
                      Capacity Limit
                    </label>
                    <input
                      required
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      placeholder="e.g. 25 spots"
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
                  {loading ? "CREATING EVENT LISTING…" : "LIST MY EVENT &amp; GET QR SCANNER"}
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
            <Sparkles className="w-3.5 h-3.5" /> EFFORTLESS EVENT PRODUCTION
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
            Launch Your Next Sold-Out Event
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
            Whether you are an independent artist hosting an intimate rooftop set or an organizer running a 300-person tournament, get frictionless digital sales and instant door verification.
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
              href="#list-event-form"
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
              <span>Create Event Listing Above</span>
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
              <span>Contact Host Concierge</span>
              <ArrowRight className="w-4 h-4 text-[#FF5A1F]" />
            </Link>
          </div>
        </div>
      </section>

      <SubpageFooter />
    </div>
  );
}
