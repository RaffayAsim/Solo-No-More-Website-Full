"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "./SignOutButton";
import NotificationBell from "@/components/NotificationBell";
import { supabase } from "@/lib/supabase/client";
import DashboardFooter from "@/components/DashboardFooter";
import {
  Compass,
  Radio,
  Users,
  User,
  Crown,
  Briefcase,
  MessageSquare,
  BarChart3,
  Tag,
  Calendar,
  Building2,
  Store,
  Sparkles,
  Mic2,
  Ticket,
  Headphones,
  Wallet,
  Shield,
  Plus,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Lobby Radar & Events", short: "Radar", icon: Compass, href: "/dashboard" },
  { label: "My Hosting", short: "Host", icon: Radio, href: "/dashboard/manage" },
  { label: "Squad Chats", short: "Chats", icon: MessageSquare, href: "/dashboard/chats" },
  { label: "Squad Network", short: "Network", icon: Users, href: "/dashboard/network" },
  { label: "My Profile", short: "Profile", icon: User, href: "/dashboard/profile" },
  { label: "Upgrade Hub", short: "Upgrade", icon: Crown, href: "/dashboard/upgrade" },
];

const PARTNER_NAV_ITEMS = [
  { label: "Command Center", short: "Overview", icon: BarChart3, href: "/dashboard/partner" },
  { label: "Promos & Offers", short: "Promos", icon: Tag, href: "/dashboard/partner?tab=offers" },
  { label: "Brand Events", short: "Events", icon: Calendar, href: "/dashboard/partner?tab=events" },
  { label: "Venue Profile", short: "Venue", icon: Building2, href: "/dashboard/partner?tab=store" },
  { label: "Venue Managers", short: "Managers", icon: Users, href: "/dashboard/partner?tab=team" },
];

const ARTIST_NAV_ITEMS = [
  { label: "Gigs Overview", short: "Overview", icon: Calendar, href: "/dashboard/artist" },
  { label: "Door Scanner", short: "Scanner", icon: Ticket, href: "/dashboard/artist?tab=gigs" },
  { label: "List New Gig", short: "List Gig", icon: Plus, href: "/dashboard/artist?tab=create" },
  { label: "Gate Managers", short: "Managers", icon: Users, href: "/dashboard/artist?tab=team" },
  { label: "Sound EPK", short: "EPK", icon: Headphones, href: "/dashboard/artist?tab=profile" },
  { label: "Settlement", short: "Payouts", icon: Wallet, href: "/dashboard/artist?tab=settlement" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<"member" | "partner" | "artist" | "admin">("member");

  const isPartnerRoute = pathname.startsWith("/dashboard/partner");
  const isArtistRoute = pathname.startsWith("/dashboard/artist");

  useEffect(() => {
    // Read cached role for instantaneous flicker-free rendering
    const cachedRole = sessionStorage.getItem("snm_user_role");
    if (cachedRole === "artist" || cachedRole === "partner" || cachedRole === "admin" || cachedRole === "member") {
      setUserRole(cachedRole as any);
    }

    async function checkRoles() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          if (error.message?.toLowerCase().includes("refresh token")) {
            await supabase.auth.signOut({ scope: "local" }).catch(() => {});
            if (typeof window !== "undefined") {
              const cookieName = "sb-dmmgzpiskyocdsxamrgf-auth-token";
              document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax; Secure`;
              try {
                localStorage.removeItem(cookieName);
              } catch {}
            }
          }
          return;
        }

        const session = data?.session;
        if (session?.user) {
          const userEmail = session.user.email?.toLowerCase() || "";
          const metaRole = session.user.user_metadata?.role;
          const { data: profile } = await (supabase
            .from("profiles") as any)
            .select("is_partner, subscription_tier")
            .eq("id", session.user.id)
            .maybeSingle();

          const tier = profile?.subscription_tier;

          // 1. ADMIN CHECK (Highest Priority)
          if (
            tier === "admin" ||
            userEmail === "admin@solonomore.com" ||
            userEmail === "raffay@solonomore.com" ||
            metaRole === "admin"
          ) {
            setUserRole("admin");
            sessionStorage.setItem("snm_user_role", "admin");
            sessionStorage.removeItem("snm_is_partner");
            return;
          }

          // 2. ARTIST CHECK (Artists must NEVER see Partner Hub)
          if (
            tier === "artist" ||
            metaRole === "artist" ||
            userEmail.includes("artist") ||
            userEmail.includes("dj")
          ) {
            setUserRole("artist");
            sessionStorage.setItem("snm_user_role", "artist");
            sessionStorage.removeItem("snm_is_partner");
            return;
          }

          // 3. PARTNER CHECK (Only actual partners, never artists or admins)
          if (profile?.is_partner === true || tier === "partner" || metaRole === "partner") {
            setUserRole("partner");
            sessionStorage.setItem("snm_user_role", "partner");
            return;
          }

          // 4. REGULAR MEMBER (Only sees their member options)
          setUserRole("member");
          sessionStorage.setItem("snm_user_role", "member");
          sessionStorage.removeItem("snm_is_partner");
        }
      } catch {}
    }
    checkRoles();
  }, []);

  const dynamicMemberNavItems =
    userRole === "partner"
      ? [
          { label: "Lobby Radar & Events", short: "Radar", icon: Compass, href: "/dashboard" },
          { label: "My Hosting", short: "Host", icon: Radio, href: "/dashboard/manage" },
          { label: "Squad Chats", short: "Chats", icon: MessageSquare, href: "/dashboard/chats" },
          { label: "Squad Network", short: "Network", icon: Users, href: "/dashboard/network" },
          { label: "My Profile", short: "Profile", icon: User, href: "/dashboard/profile" },
          { label: "Partner Hub", short: "Partner", icon: Briefcase, href: "/dashboard/partner" },
        ]
      : userRole === "artist"
      ? [
          { label: "Lobby Radar & Events", short: "Radar", icon: Compass, href: "/dashboard" },
          { label: "My Hosting", short: "Host", icon: Radio, href: "/dashboard/manage" },
          { label: "Squad Chats", short: "Chats", icon: MessageSquare, href: "/dashboard/chats" },
          { label: "Squad Network", short: "Network", icon: Users, href: "/dashboard/network" },
          { label: "My Profile", short: "Profile", icon: User, href: "/dashboard/profile" },
          { label: "Artist Hub", short: "Artist", icon: Mic2, href: "/dashboard/artist" },
        ]
      : userRole === "admin"
      ? [
          { label: "Lobby Radar & Events", short: "Radar", icon: Compass, href: "/dashboard" },
          { label: "My Hosting", short: "Host", icon: Radio, href: "/dashboard/manage" },
          { label: "Squad Chats", short: "Chats", icon: MessageSquare, href: "/dashboard/chats" },
          { label: "Squad Network", short: "Network", icon: Users, href: "/dashboard/network" },
          { label: "My Profile", short: "Profile", icon: User, href: "/dashboard/profile" },
          { label: "Admin Panel", short: "Admin", icon: Shield, href: "/admin" },
        ]
      : NAV_ITEMS;

  const currentNavItems = isPartnerRoute
    ? PARTNER_NAV_ITEMS
    : isArtistRoute
    ? ARTIST_NAV_ITEMS
    : dynamicMemberNavItems;

  const mobileNavItems = isPartnerRoute
    ? [
        ...PARTNER_NAV_ITEMS,
        { label: "Member Radar", short: "Lobby", icon: Compass, href: "/dashboard" },
      ]
    : isArtistRoute
    ? [
        ...ARTIST_NAV_ITEMS,
        { label: "Member Radar", short: "Lobby", icon: Compass, href: "/dashboard" },
      ]
    : dynamicMemberNavItems;

  const [mountedSearch, setMountedSearch] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setMountedSearch(window.location.search);
    }
  }, [pathname]);

  const isActive = (href: string) => {
    if (isPartnerRoute) {
      const full = pathname + mountedSearch;
      if (href === "/dashboard/partner") {
        return !mountedSearch || mountedSearch === "?tab=overview";
      }
      return full === href;
    }
    if (isArtistRoute) {
      const full = pathname + mountedSearch;
      if (href === "/dashboard/artist") {
        return !mountedSearch || mountedSearch === "?tab=overview";
      }
      return full === href;
    }
    return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#060408",
        color: "#FFFFFF",
        position: "relative",
      }}
    >
      {/* Background Radial Atmosphere */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "1200px",
          height: "600px",
          background: isPartnerRoute
            ? "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255, 111, 38, 0.22) 0%, rgba(255, 111, 38, 0.03) 60%, transparent 80%)"
            : "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255, 90, 31, 0.16) 0%, rgba(255, 90, 31, 0.02) 60%, transparent 80%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      {/* Dotted Texture Background across main canvas */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.12) 1.25px, transparent 1.25px)",
          backgroundSize: "22px 22px",
          pointerEvents: "none",
          opacity: 0.6,
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      {/* ── FLOATING CENTERED CURVED LUXURY DOCK (TOP ISLAND) ─────────────── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          width: "100%",
          paddingTop: "10px",
          paddingBottom: "8px",
          background: "linear-gradient(180deg, rgba(6, 4, 8, 0.95) 0%, rgba(6, 4, 8, 0.85) 60%, rgba(6, 4, 8, 0) 100%)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <header
          id="floating-top-dock"
          style={{
            position: "relative",
            width: "calc(100% - clamp(20px, 3vw, 48px))",
            maxWidth: "1600px",
            margin: "0 auto",
            background: "rgba(10, 6, 16, 0.94)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: isPartnerRoute ? "1px solid rgba(255, 111, 38, 0.45)" : "1px solid rgba(255, 90, 31, 0.35)",
            borderRadius: "26px",
            padding: "8px 18px",
            boxShadow: isPartnerRoute
              ? "0 16px 40px rgba(0, 0, 0, 0.7), 0 0 32px rgba(255, 111, 38, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)"
              : "0 16px 40px rgba(0, 0, 0, 0.65), 0 0 28px rgba(255, 90, 31, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
        {/* Left: Brand + Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <Link
            href={isPartnerRoute ? "/dashboard/partner" : isArtistRoute ? "/dashboard/artist" : "/"}
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "9px",
            }}
            className="group cursor-pointer"
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(255, 90, 31, 0.45)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              {isPartnerRoute ? (
                <Store className="w-5 h-5 text-white" />
              ) : isArtistRoute ? (
                <Mic2 className="w-5 h-5 text-white" />
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 28 28"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14 3C8.477 3 4 7.477 4 13C4 16.866 6.189 20.216 9.4 21.895L7.8 25L13.5 24.2C13.666 24.215 13.832 24.223 14 24.223C19.523 24.223 24 19.746 24 14.223C24 8.7 19.523 3 14 3Z"
                    fill="white"
                  />
                  <circle cx="14" cy="13" r="4.2" fill="#FF5A1F" />
                </svg>
              )}
            </div>

            <div>
              <span
                style={{
                  fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
                  fontSize: "16px",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  color: "#FFFFFF",
                  display: "block",
                  lineHeight: 1.1,
                }}
              >
                solo-no-more
              </span>
              <span
                style={{
                  fontSize: "9.5px",
                  fontWeight: 800,
                  color: isPartnerRoute || isArtistRoute ? "#FFA05C" : "rgba(255, 255, 255, 0.7)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {isPartnerRoute ? "Partner Portal" : isArtistRoute ? "Artist & Performer Studio" : "Live Radar"}
              </span>
            </div>
          </Link>

          <div
            id="status-live-badge"
            style={{
              display: "none",
              alignItems: "center",
              gap: "6px",
              background: isPartnerRoute || isArtistRoute ? "rgba(255, 111, 38, 0.12)" : "rgba(255, 255, 255, 0.05)",
              border: isPartnerRoute || isArtistRoute ? "1px solid rgba(255, 111, 38, 0.35)" : "1px solid rgba(255, 255, 255, 0.12)",
              padding: "3px 8px",
              borderRadius: "8px",
              fontSize: "10px",
              fontWeight: 800,
              color: "#FFA05C",
              letterSpacing: "0.04em",
            }}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPartnerRoute || isArtistRoute ? "bg-[#FF6F26] animate-pulse" : "bg-emerald-400 animate-pulse"
              }`}
            />
            <span>{isPartnerRoute ? "VERIFIED VENUE" : isArtistRoute ? "VERIFIED CREATOR" : "RADAR ACTIVE"}</span>
          </div>
        </div>

        {/* Center: Curved Segmented Tabs (Desktop) */}
        <nav
          id="desktop-island-nav"
          style={{
            display: "none",
            alignItems: "center",
            gap: "3px",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "18px",
            padding: "3px 4px",
          }}
        >
          {currentNavItems.map(({ label, icon: Icon, href }) => {
            const active = isActive(href);
            const handleNavClick = (e: React.MouseEvent) => {
              if (isPartnerRoute && href.startsWith("/dashboard/partner")) {
                e.preventDefault();
                window.history.pushState(null, "", href);
                setMountedSearch(window.location.search);
                window.dispatchEvent(new Event("snm-tab-change"));
              }
              if (isArtistRoute && href.startsWith("/dashboard/artist")) {
                e.preventDefault();
                window.history.pushState(null, "", href);
                setMountedSearch(window.location.search);
                window.dispatchEvent(new Event("snm-artist-tab-change"));
              }
            };
            return (
              <Link
                key={href}
                href={href}
                onClick={handleNavClick}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "7px 14px",
                  borderRadius: "13px",
                  fontSize: "12.5px",
                  fontWeight: active ? 800 : 600,
                  textDecoration: "none",
                  color: active ? "#FFFFFF" : "rgba(255, 255, 255, 0.7)",
                  background: active
                    ? "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)"
                    : "transparent",
                  boxShadow: active ? "0 4px 16px rgba(255, 90, 31, 0.45)" : "none",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
                className={active ? "" : "hover:text-white hover:bg-white/[0.06]"}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-white" : "text-white/50"}`} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Partner/Artist Exit / Member Lobby Link + Notification Bell + Sign Out */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {(isPartnerRoute || isArtistRoute) && (
            <Link
              href="/dashboard"
              title="Return to Member Feed & Radar (View Only)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all hover:border-[#FF6F26]/40"
            >
              <Compass className="w-3.5 h-3.5 text-[#FF6F26]" />
              <span className="hidden sm:inline">Member Feed</span>
            </Link>
          )}
          <NotificationBell />
          <SignOutButton />
        </div>
      </header>
    </div>

      {/* ── EXPANSIVE FULL-WIDTH MAIN DASHBOARD CANVAS ─────────────────────── */}
      <main
        style={{
          flex: 1,
          width: "100%",
          padding: "16px clamp(16px, 2.5vw, 40px) 40px",
        }}
      >
        {children}
      </main>

      {/* ── LUXURY FULL-WIDTH DASHBOARD FOOTER ───────────────────────────────── */}
      <DashboardFooter />

      {/* ── Mobile Floating Bottom Navigation ────────────────────────── */}
      <nav
        id="mobile-bottom-nav"
        style={{
          position: "fixed",
          bottom: "12px",
          left: "12px",
          right: "12px",
          zIndex: 40,
          background: "rgba(18, 12, 24, 0.94)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: isPartnerRoute || isArtistRoute ? "1px solid rgba(255, 111, 38, 0.45)" : "1px solid rgba(255, 90, 31, 0.35)",
          borderRadius: "20px",
          display: "grid",
          gridTemplateColumns: `repeat(${mobileNavItems.length}, 1fr)`,
          padding: "6px 4px",
          boxShadow: isPartnerRoute || isArtistRoute
            ? "0 8px 30px rgba(0, 0, 0, 0.75), 0 0 25px rgba(255, 111, 38, 0.25)"
            : "0 8px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(255, 90, 31, 0.2)",
        }}
      >
        {mobileNavItems.map(({ short, icon: Icon, href }) => {
          const active = isActive(href);
          const handleMobileNavClick = (e: React.MouseEvent) => {
            if (isPartnerRoute && href.startsWith("/dashboard/partner")) {
              e.preventDefault();
              window.history.pushState(null, "", href);
              setMountedSearch(window.location.search);
              window.dispatchEvent(new Event("snm-tab-change"));
            }
            if (isArtistRoute && href.startsWith("/dashboard/artist")) {
              e.preventDefault();
              window.history.pushState(null, "", href);
              setMountedSearch(window.location.search);
              window.dispatchEvent(new Event("snm-artist-tab-change"));
            }
          };
          return (
            <Link
              key={href}
              href={href}
              onClick={handleMobileNavClick}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                padding: "6px 2px",
                textDecoration: "none",
                color: active ? "#FFA05C" : "rgba(255, 255, 255, 0.7)",
                fontSize: "10px",
                fontWeight: active ? 800 : 600,
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: active
                    ? "linear-gradient(135deg, #FF6F26, #FF5A1F)"
                    : "transparent",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: active ? "0 2px 8px rgba(255, 90, 31, 0.4)" : "none",
                }}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="truncate max-w-[55px] text-center">{short}</span>
            </Link>
          );
        })}
      </nav>

      {/* Responsive Display Toggle */}
      <style>{`
        @media (min-width: 900px) {
          #desktop-island-nav { display: inline-flex !important; }
          #status-live-badge { display: inline-flex !important; }
          #mobile-bottom-nav { display: none !important; }
          main { padding-bottom: 32px !important; }
        }
      `}</style>
    </div>
  );
}
