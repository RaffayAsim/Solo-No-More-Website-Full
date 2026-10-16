"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles, ArrowRight } from "lucide-react";
import SignUpDropdown from "./SignUpDropdown";

interface SubpageNavbarProps {
  activePage?: string;
}

const NAV_LINKS = [
  { href: "/events", label: "Browse Events" },
  { href: "/how-it-works", label: "How Beacon Works" },
  { href: "/memberships", label: "Memberships" },
  { href: "/partners", label: "Partners" },
  { href: "/sell-tickets", label: "Sell Tickets" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function SubpageNavbar({ activePage }: SubpageNavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      style={{
        position: "relative",
        zIndex: 50,
        width: "100%",
        background: "rgba(6, 4, 8, 0.85)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{
          maxWidth: "1560px",
          margin: "0 auto",
          padding: "16px clamp(20px, 3.5vw, 56px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
        }}
      >
        {/* Brand Logo */}
        <Link
          href="/"
          style={{
            textDecoration: "none",
          }}
          className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 group cursor-pointer"
        >
          <svg
            className="w-5 h-5 sm:w-7 sm:h-7"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: "drop-shadow(0 2px 8px rgba(255, 90, 31, 0.45))" }}
          >
            <path
              d="M14 3C8.477 3 4 7.477 4 13C4 16.866 6.189 20.216 9.4 21.895L7.8 25L13.5 24.2C13.666 24.215 13.832 24.223 14 24.223C19.523 24.223 24 19.746 24 14.223C24 8.7 19.523 3 14 3Z"
              fill="white"
            />
            <circle cx="14" cy="13" r="4.2" fill="#FF5A1F" />
          </svg>
          <span
            style={{
              fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
              letterSpacing: "-0.04em",
              color: "#FFFFFF",
            }}
            className="text-[17px] sm:text-[23px] font-black whitespace-nowrap"
          >
            solo-no-more
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden xl:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || activePage === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: isActive ? "#FF8A3D" : "rgba(255, 255, 255, 0.8)",
                  fontWeight: isActive ? 800 : 600,
                  fontSize: "13.5px",
                  textDecoration: "none",
                  padding: "7px 13px",
                  borderRadius: "8px",
                  background: isActive ? "rgba(255, 90, 31, 0.12)" : "transparent",
                  border: "1px solid " + (isActive ? "rgba(255, 90, 31, 0.3)" : "transparent"),
                  transition: "all 0.15s ease",
                  letterSpacing: "-0.01em",
                }}
                className="hover:text-white hover:bg-white/5 transition-all"
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <Link
            href="/login"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              color: "#FFFFFF",
              fontWeight: 800,
              textDecoration: "none",
              borderRadius: "8px",
              transition: "all 0.15s ease",
            }}
            className="hover:bg-white/15 active:scale-95 inline-flex items-center text-xs sm:text-[13px] px-2.5 py-1.5 sm:px-4 sm:py-2 whitespace-nowrap shrink-0"
          >
            Sign In
          </Link>
          <SignUpDropdown />

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#FFFFFF",
              padding: "8px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
            className="xl:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            background: "#08060C",
            borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
            padding: "20px 24px",
            animation: "fadeIn 0.2s ease-in-out",
          }}
          className="xl:hidden"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    color: isActive ? "#FF8A3D" : "rgba(255, 255, 255, 0.85)",
                    fontSize: "14.5px",
                    fontWeight: 700,
                    textDecoration: "none",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: isActive ? "rgba(255, 90, 31, 0.12)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{link.label}</span>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                </Link>
              );
            })}
            <div style={{ paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#fff",
                    padding: "10px",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "13px",
                    textDecoration: "none",
                  }}
                >
                  Login
                </Link>
                <Link
                  href="/apply?type=guest"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    background: "rgba(255, 90, 31, 0.2)",
                    border: "1px solid rgba(255, 90, 31, 0.4)",
                    color: "#FFA05C",
                    padding: "10px",
                    borderRadius: "8px",
                    fontWeight: 800,
                    fontSize: "13px",
                    textDecoration: "none",
                  }}
                >
                  Sign Up (Guest)
                </Link>
              </div>
              <Link
                href="/apply?type=member"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  width: "100%",
                  textAlign: "center",
                  background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)",
                  color: "#fff",
                  padding: "11px",
                  borderRadius: "8px",
                  fontWeight: 900,
                  fontSize: "13.5px",
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(255, 90, 31, 0.4)",
                }}
              >
                Apply as Member (Vetted)
              </Link>
              <Link
                href="/apply?type=partner"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  width: "100%",
                  textAlign: "center",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.85)",
                  padding: "10px",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "12.5px",
                  textDecoration: "none",
                }}
              >
                Register as Partner / Venue
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
