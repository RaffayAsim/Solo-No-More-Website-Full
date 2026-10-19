"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Sparkles, User, ChevronDown, Store, Crown, ArrowRight } from "lucide-react";

interface SignUpDropdownProps {
  className?: string;
}

export default function SignUpDropdown({ className = "" }: SignUpDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }} className={className}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 45%, #E6450A 100%)",
          color: "#FFFFFF",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 18px rgba(255, 90, 31, 0.4)",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          letterSpacing: "-0.01em",
        }}
        className="hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0 text-xs sm:text-[13px] font-extrabold px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg"
        aria-expanded={isOpen}
      >
        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        <span>Join Squad</span>
        <ChevronDown
          className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "min(310px, calc(100vw - 24px))",
            maxWidth: "calc(100vw - 24px)",
            background: "#0E0714",
            border: "1.5px solid rgba(255, 90, 31, 0.4)",
            borderRadius: "16px",
            padding: "8px",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 90, 31, 0.25)",
            zIndex: 100,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {/* Header */}
          <div style={{ padding: "8px 12px 6px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              SELECT APPLICATION PATH
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "6px" }}>
            {/* 0. Early Bird VIP Pass */}
            <Link
              href="/early-bird"
              onClick={() => setIsOpen(false)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "12px",
                textDecoration: "none",
                color: "#FFFFFF",
                background: "linear-gradient(135deg, rgba(255, 90, 31, 0.22) 0%, rgba(255, 90, 31, 0.08) 100%)",
                border: "1px solid rgba(255, 90, 31, 0.4)",
                transition: "background 0.15s ease",
              }}
              className="hover:bg-[rgba(255,90,31,0.28)] group cursor-pointer"
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(255, 90, 31, 0.25)",
                  border: "1px solid rgba(255, 90, 31, 0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Sparkles className="w-4 h-4 text-[#FFA05C]" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#FFA05C" }}>
                    Early Bird VIP Pass
                  </span>
                  <span style={{ fontSize: "9.5px", fontWeight: 900, background: "rgba(200, 255, 0, 0.2)", color: "#C8FF00", padding: "2px 6px", borderRadius: "999px" }}>
                    Pre-Launch
                  </span>
                </div>
                <p style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.7)", margin: "3px 0 0", lineHeight: 1.4 }}>
                  Claim founding member status & priority squad drops.
                </p>
              </div>
            </Link>

            {/* 1. Guest Signup */}
            <Link
              href="/apply?type=guest"
              onClick={() => setIsOpen(false)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "12px",
                textDecoration: "none",
                color: "#FFFFFF",
                transition: "background 0.15s ease",
              }}
              className="hover:bg-white/10 group cursor-pointer"
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <User className="w-4 h-4 text-[#FFA05C]" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#FFFFFF" }}>
                    Sign up as Guest
                  </span>
                  <span style={{ fontSize: "9.5px", fontWeight: 900, background: "rgba(39, 201, 63, 0.2)", color: "#27C93F", padding: "2px 6px", borderRadius: "999px" }}>
                    Instant
                  </span>
                </div>
                <p style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.6)", margin: "3px 0 0", lineHeight: 1.4 }}>
                  Fast direct registration for open community meetups.
                </p>
              </div>
            </Link>

            {/* 2. Member Application */}
            <Link
              href="/apply?type=member"
              onClick={() => setIsOpen(false)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "12px",
                textDecoration: "none",
                color: "#FFFFFF",
                background: "rgba(255, 90, 31, 0.12)",
                border: "1px solid rgba(255, 90, 31, 0.3)",
                transition: "background 0.15s ease",
              }}
              className="hover:bg-[rgba(255,90,31,0.22)] group cursor-pointer"
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 2px 10px rgba(255, 90, 31, 0.4)",
                }}
              >
                <Crown className="w-4 h-4 text-white" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13.5px", fontWeight: 900, color: "#FFFFFF" }}>
                    Apply as Member
                  </span>
                  <span style={{ fontSize: "9.5px", fontWeight: 900, background: "rgba(255, 90, 31, 0.3)", color: "#FFA05C", padding: "2px 6px", borderRadius: "999px" }}>
                    Vetted Multi-Step
                  </span>
                </div>
                <p style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.75)", margin: "3px 0 0", lineHeight: 1.4 }}>
                  Vetted pass for secret gatherings, padel, &amp; VIP perks.
                </p>
              </div>
            </Link>

            {/* 3. Partner Registration */}
            <Link
              href="/apply?type=partner"
              onClick={() => setIsOpen(false)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "12px",
                textDecoration: "none",
                color: "#FFFFFF",
                transition: "background 0.15s ease",
              }}
              className="hover:bg-white/10 group cursor-pointer"
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Store className="w-4 h-4 text-[#FFA05C]" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#FFFFFF" }}>
                    Sign up as Partner
                  </span>
                  <span style={{ fontSize: "9.5px", fontWeight: 900, background: "rgba(255, 255, 255, 0.15)", color: "rgba(255, 255, 255, 0.8)", padding: "2px 6px", borderRadius: "999px" }}>
                    Hosts &amp; Venues
                  </span>
                </div>
                <p style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.6)", margin: "3px 0 0", lineHeight: 1.4 }}>
                  List your venue, stage, or ticketed event experiences.
                </p>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
