"use client";

import { useState } from "react";
import Link from "next/link";
import SubpageNavbar from "@/components/SubpageNavbar";
import SubpageFooter from "@/components/SubpageFooter";
import { Mail, Smartphone, MapPin, Send, MessageCircle, Clock, CheckCircle2, Sparkles, ArrowRight, HelpCircle } from "lucide-react";

export default function ContactPage() {
  const [topic, setTopic] = useState("general");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 700);
  };

  return (
    <div style={{ background: "#060408", minHeight: "100vh", color: "#FFFFFF", position: "relative", overflowX: "hidden" }}>
      <SubpageNavbar activePage="/contact" />

      {/* Atmospheric Orange Ambient Glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "1000px",
          height: "600px",
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
          opacity: 0.65,
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      <main style={{ position: "relative", zIndex: 1, padding: "70px 0 100px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 clamp(20px, 3.5vw, 56px)" }}>
          {/* Header */}
          <div style={{ textAlign: "center", maxWidth: "760px", margin: "0 auto 60px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                background: "linear-gradient(135deg, rgba(255, 90, 31, 0.2) 0%, rgba(255, 90, 31, 0.05) 100%)",
                border: "1px solid rgba(255, 90, 31, 0.4)",
                padding: "6px 16px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 800,
                color: "#FF8A3D",
                marginBottom: "16px",
                letterSpacing: "0.06em",
                boxShadow: "0 0 20px rgba(255, 90, 31, 0.2)",
              }}
            >
              <MessageCircle className="w-3.5 h-3.5" /> REACH OUT · WE DON&apos;T BITE
            </div>

            <h1
              style={{
                fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
                fontSize: "clamp(34px, 5.5vw, 58px)",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                margin: "0 0 16px",
                lineHeight: 1.15,
                background: "linear-gradient(180deg, #FFFFFF 40%, rgba(255, 255, 255, 0.75) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Get in Touch with Solo-No-More
            </h1>
            <p style={{ fontSize: "18px", color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.6, margin: 0 }}>
              Need help with a beacon? Want to list your cafe or venue? Or just want to say hi? Drop us a signal below.
            </p>
          </div>

          {/* 2-Column Grid: Form & Info */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
              gap: "36px",
              alignItems: "start",
              marginBottom: "80px",
            }}
          >
            {/* Contact Form Card */}
            <div
              style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                border: "1.5px solid rgba(255,255,255,0.12)",
                borderRadius: "28px",
                padding: "clamp(26px, 3.5vw, 42px)",
                backdropFilter: "blur(14px)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(255,90,31,0.08)",
              }}
            >
              <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 8px" }}>Send a Message</h2>
              <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.55)", margin: "0 0 24px" }}>
                Our community team responds within 2 hours during active evening meetup hours.
              </p>

              {submitted ? (
                <div
                  style={{
                    background: "rgba(39, 201, 63, 0.12)",
                    border: "1px solid rgba(39, 201, 63, 0.35)",
                    borderRadius: "20px",
                    padding: "36px 24px",
                    textAlign: "center",
                  }}
                >
                  <CheckCircle2 className="w-12 h-12 text-[#27C93F] mx-auto mb-4" />
                  <h3 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 8px" }}>Signal Transmitted!</h3>
                  <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", margin: "0 0 20px" }}>
                    Thank you {name}. We&apos;ve received your message and will reach out to {email} shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setName("");
                      setEmail("");
                      setMessage("");
                    }}
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      border: "none",
                      color: "#fff",
                      padding: "10px 20px",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Send Another Signal
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  {/* Topic Select */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                      What&apos;s this regarding?
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px" }}>
                      {[
                        { id: "general", label: "General Chat" },
                        { id: "partner", label: "Partnership / Cafe" },
                        { id: "host", label: "Host / Event Query" },
                        { id: "support", label: "Squad Help" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTopic(t.id)}
                          style={{
                            padding: "9px 12px",
                            borderRadius: "10px",
                            fontSize: "12.5px",
                            fontWeight: 700,
                            border: "1px solid " + (topic === t.id ? "#FF5A1F" : "rgba(255,255,255,0.12)"),
                            background: topic === t.id ? "rgba(255,90,31,0.22)" : "rgba(0,0,0,0.35)",
                            color: topic === t.id ? "#fff" : "rgba(255,255,255,0.75)",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name Input */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                      Your Full Name
                    </label>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Zainab Asad"
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.45)",
                        border: "1px solid rgba(255,255,255,0.14)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        color: "#fff",
                        fontSize: "14px",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Email Input */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                      Email Address
                    </label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.45)",
                        border: "1px solid rgba(255,255,255,0.14)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        color: "#fff",
                        fontSize: "14px",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Message Input */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                      Message
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what you have in mind..."
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.45)",
                        border: "1px solid rgba(255,255,255,0.14)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        color: "#fff",
                        fontSize: "14px",
                        outline: "none",
                        resize: "vertical",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      marginTop: "6px",
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
                      transition: "transform 0.15s ease",
                      opacity: loading ? 0.75 : 1,
                    }}
                  >
                    <Send className="w-4 h-4" />
                    {loading ? "TRANSMITTING SIGNAL…" : "TRANSMIT MESSAGE"}
                  </button>
                </form>
              )}
            </div>

            {/* Direct Channels */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Channel 1: WhatsApp Hotline */}
              <div
                style={{
                  background: "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "24px",
                  padding: "26px",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(39, 201, 63, 0.15)", border: "1px solid rgba(39, 201, 63, 0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Smartphone className="w-5 h-5 text-[#27C93F]" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>Direct Phone &amp; WhatsApp</h3>
                    <span style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.5)" }}>Fastest for meetup coordination</span>
                  </div>
                </div>
                <div style={{ fontSize: "18px", fontWeight: 900, color: "#fff", marginBottom: "4px" }}>+92 300 1234567</div>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", margin: 0 }}>
                  Active daily 12:00 PM – 2:00 AM for live squad events and assistance.
                </p>
              </div>

              {/* Channel 2: Email */}
              <div
                style={{
                  background: "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "24px",
                  padding: "26px",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(255, 90, 31, 0.15)", border: "1px solid rgba(255, 90, 31, 0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Mail className="w-5 h-5 text-[#FF5A1F]" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>Official Inquiries</h3>
                    <span style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.5)" }}>Partnerships, sponsors &amp; press</span>
                  </div>
                </div>
                <a href="mailto:hello.solonomore@gmail.com" style={{ fontSize: "16px", fontWeight: 800, color: "#FF8A3D", textDecoration: "none" }}>
                  hello.solonomore@gmail.com
                </a>
              </div>

              {/* Channel 3: Hubs */}
              <div
                style={{
                  background: "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "24px",
                  padding: "26px",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(255, 255, 255, 0.1)", border: "1px solid rgba(255, 255, 255, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>Community Studio</h3>
                    <span style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.5)" }}>Zamzama Commercial Area</span>
                  </div>
                </div>
                <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.75)", lineHeight: 1.6, margin: 0 }}>
                  Zamzama Commercial Area, Defence Phase V · Active community across all major urban hubs.
                </p>
              </div>
            </div>
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
            <Sparkles className="w-3.5 h-3.5" /> LOOKING FOR TONIGHT&apos;S PLANS?
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
            Don&apos;t Wait On An Email — Discover Active Squads Now
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
            There are live meetups broadcasting right now. Tap into the city radar and join a table.
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
              href="/events"
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
              <span>Browse Live Events</span>
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
              <span>Join the Club</span>
              <ArrowRight className="w-4 h-4 text-[#FF5A1F]" />
            </Link>
          </div>
        </div>
      </section>

      <SubpageFooter />
    </div>
  );
}
