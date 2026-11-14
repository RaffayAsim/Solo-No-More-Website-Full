"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import SignUpDropdown from "./SignUpDropdown";

/** Public website links — the same set on the home page and every public subpage. */
export const SITE_NAV_LINKS = [
  { href: "/events", label: "Browse Events" },
  { href: "/how-it-works", label: "How Beacon Works" },
  { href: "/memberships", label: "Memberships" },
  { href: "/partners", label: "Partners" },
  { href: "/sell-tickets", label: "Sell Tickets" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

/**
 * The one navbar for the public website (home + subpages). The dashboard, admin
 * and Early Bird pages keep their own headers.
 */
export default function SiteNavbar({ activePage }: { activePage?: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (href: string) => pathname === href || activePage === href || pathname?.startsWith(href + "/");

  return (
    <header className="w-full relative z-[60]" style={{ background: "transparent" }}>
      <div className="px-3 py-3 sm:px-6 sm:py-5 md:px-10 w-full flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand logo */}
        <Link href="/" style={{ textDecoration: "none" }} className="flex items-center shrink-0 cursor-pointer group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="solo-no-more"
            className="h-9 sm:h-11 md:h-12 lg:h-[52px] w-auto object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-[0_2px_14px_rgba(255,90,31,0.4)]"
          />
        </Link>

        {/* Desktop links */}
        <nav className="hidden xl:flex items-center gap-1">
          {SITE_NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              style={{
                color: isActive(item.href) ? "#FF8A3D" : "#FFFFFF",
                fontWeight: 700,
                fontSize: "13.5px",
                textShadow: "0 1px 4px rgba(0, 0, 0, 0.95)",
                textDecoration: "none",
                padding: "8px 13px",
                borderRadius: "8px",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
              className="hover:bg-white/10 hover:text-[#FF8A3D] active:scale-95 cursor-pointer"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <Link
            href="/login"
            style={{
              background: "rgba(18, 18, 24, 0.78)",
              border: "1px solid rgba(255, 255, 255, 0.22)",
              color: "#FFFFFF",
              fontWeight: 800,
              textDecoration: "none",
              borderRadius: "8px",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.3)",
              transition: "background 0.15s ease, transform 0.15s ease",
            }}
            className="hover:bg-white/20 active:scale-95 cursor-pointer inline-flex items-center text-xs sm:text-[13.5px] px-2.5 py-1.5 sm:px-4 sm:py-2 whitespace-nowrap shrink-0"
          >
            Sign In
          </Link>
          <SignUpDropdown />
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="inline-flex xl:hidden items-center justify-center rounded-full-icon"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            style={{
              background: "rgba(18, 18, 24, 0.78)",
              border: "1px solid rgba(255, 255, 255, 0.22)",
              color: "#FFFFFF",
              width: "36px",
              height: "36px",
              padding: 0,
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="xl:hidden absolute left-0 right-0 top-full px-4 pb-4"
          style={{ background: "#08060C", borderBottom: "1px solid rgba(255, 255, 255, 0.12)" }}
        >
          <nav style={{ display: "flex", flexDirection: "column", gap: "4px", paddingTop: "8px" }}>
            {[{ href: "/", label: "Home" }, ...SITE_NAV_LINKS].map((item) => {
              const active = item.href === "/" ? pathname === "/" : isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    color: active ? "#FF8A3D" : "rgba(255, 255, 255, 0.88)",
                    fontSize: "14.5px",
                    fontWeight: 700,
                    textDecoration: "none",
                    padding: "11px 14px",
                    borderRadius: "10px",
                    background: active ? "rgba(255, 90, 31, 0.12)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{item.label}</span>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
