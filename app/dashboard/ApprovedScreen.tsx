"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Beacon, OfficialEvent, Profile } from "@/lib/supabase/types";
import dynamic from "next/dynamic";
import BeaconCard from "./BeaconCard";
import DashboardFooter from "@/components/DashboardFooter";
import { buyTicketDevInstantAction } from "@/app/actions/events";
import { parseEventDescription } from "@/lib/event-metadata";

const CreateBeaconModal = dynamic(() => import("./CreateBeaconModal"), { ssr: false });
const VipTicketPassModal = dynamic(() => import("@/components/VipTicketPassModal"), { ssr: false });
import {
  Compass,
  Radio,
  Search,
  Plus,
  Sparkles,
  MapPin,
  Shield,
  Zap,
  Flame,
  Trophy,
  Coffee,
  Moon,
  Calendar,
  Ticket,
  User,
  Clock,
  ArrowRight,
  CheckCircle2,
  Users,
  Award,
  TrendingUp,
  Activity,
  MessageSquare,
} from "lucide-react";

interface ApprovedScreenProps {
  name: string;
  currentUserId: string;
  initialBeacons: Beacon[];
  selectedCity: string;
  isPartner: boolean;
  profile?: Profile | null;
  userEmail?: string;
  officialEvents?: OfficialEvent[];
  userTickets?: any[];
  userApplications?: any[];
  userHostedBeacons?: any[];
}

const FILTER_TABS = [
  { id: "all", label: "All Hangouts", icon: Flame },
  { id: "sports", label: "Sports & Padel", icon: Trophy },
  { id: "casual", label: "Chai & Casual", icon: Coffee },
  { id: "nightlife", label: "Nightlife & Raves", icon: Moon },
];

const EVENT_CATEGORY_FILTERS = [
  { id: "all", label: "All Events" },
  { id: "nightlife", label: "Nightlife & Raves" },
  { id: "concert", label: "Live Gigs & Festivals" },
  { id: "exclusive", label: "Members Only" },
];

// Curated high-res festival & nightlife poster imagery
const EVENT_COVERS: Record<string, string> = {
  default_1: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop",
  default_2: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop",
  default_3: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop",
  default_4: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop",
  default_5: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=1200&auto=format&fit=crop",
  default_6: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200&auto=format&fit=crop",
};

export default function ApprovedScreen({
  name,
  currentUserId,
  initialBeacons,
  selectedCity,
  isPartner,
  profile,
  userEmail = "member@solonomore.com",
  officialEvents = [],
  userTickets: initialUserTickets = [],
  userApplications: initialUserApps = [],
  userHostedBeacons: initialHostedBeacons = [],
}: ApprovedScreenProps) {
  const router = useRouter();
  const [beacons, setBeacons] = useState<Beacon[]>(initialBeacons);
  const [tickets, setTickets] = useState<any[]>(initialUserTickets);
  const [userApps, setUserApps] = useState<any[]>(initialUserApps);
  const [hostedBeacons, setHostedBeacons] = useState<any[]>(initialHostedBeacons);
  const [isBeaconModalOpen, setIsBeaconModalOpen] = useState(false);
  const [selectedTicketForModal, setSelectedTicketForModal] = useState<any | null>(null);

  // Filter States
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [eventCategoryFilter, setEventCategoryFilter] = useState("all");
  const [activityTab, setActivityTab] = useState<"all" | "applications" | "tickets" | "hosted">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLateNightRadar, setIsLateNightRadar] = useState(false);
  const [bookingLoadingId, setBookingLoadingId] = useState<string | null>(null);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  // Identify restricted role accounts (Partners, Admins, Artists) who can browse feed in View Only mode
  const isPartnerAccount = Boolean(isPartner || profile?.is_partner || (profile?.subscription_tier as string) === "partner");
  const isAdminAccount = profile?.subscription_tier === "admin" || userEmail.toLowerCase() === "admin@solonomore.com" || userEmail.toLowerCase() === "raffay@solonomore.com";
  const isArtistAccount = (profile?.subscription_tier as string) === "artist" || userEmail.toLowerCase().includes("artist") || userEmail.toLowerCase().includes("dj");
  const isRestrictedRole = isPartnerAccount || isAdminAccount || isArtistAccount;
  const roleLabel = isPartnerAccount ? "Partner" : isAdminAccount ? "Admin" : isArtistAccount ? "Artist" : "";
  const portalUrl = isPartnerAccount ? "/dashboard/partner" : isAdminAccount ? "/admin" : isArtistAccount ? "/dashboard/artist" : "";

  useEffect(() => {
    setBeacons(initialBeacons);
  }, [initialBeacons]);

  useEffect(() => {
    setTickets(initialUserTickets);
  }, [initialUserTickets]);

  useEffect(() => {
    setUserApps(initialUserApps);
  }, [initialUserApps]);

  useEffect(() => {
    setHostedBeacons(initialHostedBeacons);
  }, [initialHostedBeacons]);

  const handleApply = (beaconId: string) => {
    setBeacons((prev) =>
      prev.map((b) => {
        if (b.id === beaconId && b.filled_slots < b.total_slots) {
          const updatedFilled = b.filled_slots + 1;
          return {
            ...b,
            filled_slots: updatedFilled,
            status: updatedFilled >= b.total_slots ? "completed" : "active",
          };
        }
        return b;
      })
    );
  };

  const handleBeaconCreated = () => {
    router.refresh();
  };

  const handleBookEvent = async (event: OfficialEvent) => {
    if (isRestrictedRole) {
      alert(`${roleLabel || "Restricted"} accounts cannot book attendee event passes. Ticket purchasing is reserved for personal member accounts.`);
      return;
    }
    setBookingLoadingId(event.id);
    try {
      const res = await buyTicketDevInstantAction(event.id);
      if (res.success) {
        setBookingSuccessMsg(`Pass confirmed for "${event.title}"! Ticket added to your Booking Requests.`);
        // Optimistically add to tickets list
        const newTicket = {
          id: `tkt-${Date.now()}`,
          event_id: event.id,
          ticket_status: "active",
          created_at: new Date().toISOString(),
          official_events: event,
        };
        setTickets((prev) => [newTicket, ...prev]);
        setTimeout(() => setBookingSuccessMsg(null), 4000);
      }
    } catch {
      // Ignored
    } finally {
      setBookingLoadingId(null);
    }
  };

  const filteredBeacons = beacons
    .filter((b) => {
      const matchesCategory = categoryFilter === "all" || b.category === categoryFilter;
      const matchesSearch =
        searchQuery.trim() === "" ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.location_name?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      const matchesLateNight = isLateNightRadar ? b.category === "nightlife" : true;
      return matchesCategory && matchesSearch && matchesLateNight;
    })
    .sort((a, b) => {
      // Partner/Restaurant promo offers always showcase at the top
      const aPartner = a.is_partner_offer ? 1 : 0;
      const bPartner = b.is_partner_offer ? 1 : 0;
      if (aPartner !== bPartner) return bPartner - aPartner;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const filteredEvents = officialEvents.filter((ev) => {
    try {
      const { metadata } = parseEventDescription(ev.description);
      if (metadata.status === "pending_review" || metadata.status === "draft") return false;
    } catch {
      // Ignored
    }
    if (eventCategoryFilter === "all") return true;
    if (eventCategoryFilter === "nightlife") return ev.title.toLowerCase().includes("rave") || ev.title.toLowerCase().includes("night") || ev.title.toLowerCase().includes("fest");
    if (eventCategoryFilter === "concert") return ev.event_type === "artist_split";
    if (eventCategoryFilter === "exclusive") return ev.event_type === "platform_owned";
    return true;
  });

  const firstName = name ? name.split(" ")[0] : "Member";

  // Provide curated sample official events if database is empty so it looks full & rich like Image 2
  const displayEvents: OfficialEvent[] =
    officialEvents.length > 0
      ? filteredEvents
      : [
          {
            id: "ev-1",
            title: "Safari Tourist Train",
            description: "Scenic private heritage railway journey through Rawalpindi to Attock Khurd with curated acoustic soundscapes.",
            venue_name: "Safari Tourist Train, Rawalpindi",
            event_type: "platform_owned",
            price: 4500,
            max_capacity: 100,
            scheduled_at: new Date(Date.now() + 86400000 * 3).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "ev-2",
            title: "Drift Fest Karachi",
            description: "High-octane asphalt show with premier underground drifters, DJ sets, and VIP pit-lane access.",
            venue_name: "Grand Karting Circuit",
            event_type: "artist_split",
            price: 1500,
            max_capacity: 250,
            scheduled_at: new Date(Date.now() + 86400000 * 5).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "ev-3",
            title: "VibeFest 2.0 Headline Night",
            description: "Young Stunners x Hassan Raheem live arena set with immersive visual lasers and exclusive lounge hospitality.",
            venue_name: "Defence Authority Creek Club, Phase 8",
            event_type: "artist_split",
            price: 2500,
            max_capacity: 400,
            scheduled_at: new Date(Date.now() + 86400000 * 7).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "ev-4",
            title: "Hand Raat by BnC Offline",
            description: "Underground pre-dawn electronic set with analog synths and private rooftop chai garden.",
            venue_name: "Third Culture Coffee Rooftop",
            event_type: "artist_split",
            price: 3500,
            max_capacity: 120,
            scheduled_at: new Date(Date.now() + 86400000 * 10).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "ev-5",
            title: "Scene 92 - Desi Cultural Soirée",
            description: "BLUK, Catalyst and touring DJ lineup bringing high-energy eastern rhythm fusion.",
            venue_name: "Studio 1, Arts Council Karachi",
            event_type: "artist_split",
            price: 4000,
            max_capacity: 180,
            scheduled_at: new Date(Date.now() + 86400000 * 14).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "ev-6",
            title: "VIP Padel Tournament & Espresso Match",
            description: "Doubles tournament with exclusive merchandise, professional coaches, and unlimited complimentary espresso bar.",
            venue_name: "Padel Arena Pro Center, Clifton",
            event_type: "platform_owned",
            price: 2000,
            max_capacity: 64,
            scheduled_at: new Date(Date.now() + 86400000 * 18).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* ── Welcome Banner Card (Matching Image 2 Header) ──────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(255,90,31,0.18) 0%, rgba(14, 7, 20, 0.95) 60%)",
          border: "1.5px solid rgba(255, 90, 31, 0.35)",
          borderRadius: "24px",
          padding: "clamp(22px, 3vw, 32px)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255,90,31,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              padding: "4px 10px",
              borderRadius: "8px",
              fontSize: "10.5px",
              fontWeight: 800,
              letterSpacing: "0.06em",
              color: "#FFA05C",
              marginBottom: "12px",
            }}
          >
            <Sparkles className="w-3 h-3 text-[#FF5A1F]" /> WELCOME BACK TO THE SCENE
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: "clamp(26px, 4vw, 36px)",
              fontWeight: 900,
              margin: "0 0 10px",
              color: "#FFFFFF",
              letterSpacing: "-0.03em",
            }}
          >
            Hey {firstName}! What&apos;s the move today?
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "12px" }}>
            {isRestrictedRole ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(255, 111, 38, 0.15)",
                  border: "1px solid rgba(255, 111, 38, 0.35)",
                  color: "#FFA05C",
                  padding: "3px 10px",
                  borderRadius: "8px",
                  fontWeight: 800,
                  fontSize: "11px",
                  letterSpacing: "0.03em",
                }}
              >
                <Shield className="w-3 h-3 text-[#FF8A3D]" /> {roleLabel.toUpperCase()} ACCOUNT (VIEW ONLY)
              </span>
            ) : (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(39, 201, 63, 0.12)",
                  border: "1px solid rgba(39, 201, 63, 0.28)",
                  color: "#27C93F",
                  padding: "3px 10px",
                  borderRadius: "8px",
                  fontWeight: 800,
                  fontSize: "11px",
                  letterSpacing: "0.03em",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#27C93F] animate-pulse" /> VETTED MEMBER
              </span>
            )}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "rgba(255, 255, 255, 0.85)",
                padding: "3px 10px",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "11px",
                letterSpacing: "0.03em",
              }}
            >
              <MapPin className="w-3 h-3 text-[#FF8A3D]" /> {selectedCity.toUpperCase()} RADAR
            </span>
          </div>
        </div>

        {/* Quick Stats & Primary Action Buttons (Matching Image 2) */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
          {/* XP Badge */}
          <div
            style={{
              background: "rgba(0, 0, 0, 0.45)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: "14px",
              padding: "10px 16px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#FF8A3D", lineHeight: 1 }}>
              1.2K
            </div>
            <div style={{ fontSize: "9.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>
              TOTAL XP
            </div>
          </div>

          {/* Bookings Counter */}
          <div
            style={{
              background: "rgba(0, 0, 0, 0.45)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: "14px",
              padding: "10px 16px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#FFA05C", lineHeight: 1 }}>
              {tickets.length}
            </div>
            <div style={{ fontSize: "9.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>
              PASSES
            </div>
          </div>

          {/* My Profile Button (Redirects to /dashboard/profile) */}
          <Link
            href="/dashboard/profile"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              color: "#FFFFFF",
              border: "1px solid rgba(255, 90, 31, 0.4)",
              padding: "12px 18px",
              borderRadius: "14px",
              fontSize: "13px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4), inset 0 0 14px rgba(255, 90, 31, 0.15)",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
            className="hover:scale-105 active:scale-95 transition-transform hover:border-[#FF5A1F]"
          >
            <User className="w-4 h-4 text-[#FF8A3D]" />
            <span>My Profile</span>
          </Link>

          {/* Broadcast Beacon or Portal Link Button */}
          {isRestrictedRole ? (
            <Link
              href={portalUrl}
              style={{
                background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 45%, #E6450A 100%)",
                color: "#FFFFFF",
                border: "none",
                padding: "12px 20px",
                borderRadius: "14px",
                fontSize: "13px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(255, 90, 31, 0.45)",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
              }}
              className="hover:scale-105 active:scale-95 transition-transform"
            >
              <Shield className="w-4 h-4" />
              <span>{roleLabel} Hub ➔</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setIsBeaconModalOpen(true)}
              style={{
                background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 45%, #E6450A 100%)",
                color: "#FFFFFF",
                border: "none",
                padding: "12px 20px",
                borderRadius: "14px",
                fontSize: "13px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(255, 90, 31, 0.45)",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
              className="hover:scale-105 active:scale-95 transition-transform"
            >
              <Radio className="w-4 h-4" />
              <span>Broadcast Beacon</span>
            </button>
          )}
        </div>
      </div>

      {/* View-Only Mode Banner for Partners / Admins / Artists */}
      {isRestrictedRole && (
        <div
          style={{
            background: "rgba(255, 111, 38, 0.08)",
            border: "1px solid rgba(255, 111, 38, 0.28)",
            borderRadius: "16px",
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Shield className="w-4 h-4 text-[#FF8A3D] flex-shrink-0" />
            <span style={{ fontSize: "12.5px", color: "rgba(255, 255, 255, 0.8)", lineHeight: 1.4 }}>
              <strong style={{ color: "#FFA05C" }}>{roleLabel} View-Only Mode:</strong> You can explore live community radar hangouts and curated events. Joining hangouts, booking attendee passes, and creating personal beacons are reserved for member accounts.
            </span>
          </div>
          <Link
            href={portalUrl}
            style={{
              fontSize: "12px",
              fontWeight: 800,
              color: "#FF8A3D",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
            className="hover:underline"
          >
            Manage via {roleLabel} Hub ➔
          </Link>
        </div>
      )}

      {/* ── Quick Anchor Navigation Pills ──────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
          padding: "4px 0",
        }}
      >
        <a
          href="#radar-section"
          style={{
            background: "rgba(255, 90, 31, 0.12)",
            border: "1px solid rgba(255, 90, 31, 0.35)",
            borderRadius: "12px",
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: 800,
            color: "#FFA05C",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
          }}
          className="hover:bg-[#FF5A1F]/25 transition-colors"
        >
          <Radio className="w-3.5 h-3.5 text-[#FF5A1F]" />
          <span>Live Radar Hangouts ({filteredBeacons.length})</span>
        </a>

        <a
          href="#events-section"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "12px",
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: 700,
            color: "rgba(255, 255, 255, 0.8)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
          }}
          className="hover:text-white hover:border-white/30 transition-colors"
        >
          <Calendar className="w-3.5 h-3.5 text-[#FF8A3D]" />
          <span>Curated Events ({displayEvents.length})</span>
        </a>

        <a
          href="#bookings-section"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "12px",
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: 700,
            color: "rgba(255, 255, 255, 0.8)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
          }}
          className="hover:text-white hover:border-white/30 transition-colors"
        >
          <Ticket className="w-3.5 h-3.5 text-[#FF8A3D]" />
          <span>My Passes &amp; Requests ({tickets.length})</span>
        </a>
      </div>

      {/* Booking Feedback Toast */}
      {bookingSuccessMsg && (
        <div
          style={{
            background: "rgba(39, 201, 63, 0.15)",
            border: "1px solid rgba(39, 201, 63, 0.4)",
            borderRadius: "14px",
            padding: "14px 20px",
            color: "#27C93F",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13.5px",
            fontWeight: 700,
          }}
        >
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{bookingSuccessMsg}</span>
        </div>
      )}

      {/* ── SECTION 1: LIVE HANGOUTS RADAR (BEACONS FIRST) ────── */}
      <section id="radar-section">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Radio className="w-5 h-5 text-[#FF5A1F]" />
              <h2 style={{ fontSize: "22px", fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
                Live Community Radar
              </h2>
            </div>
            <p style={{ fontSize: "12.5px", color: "rgba(255, 255, 255, 0.6)", margin: "4px 0 0" }}>
              Spontaneous member meetups ignited across {selectedCity}
            </p>
          </div>
        </div>

        {/* Search Bar + Late Night Toggle */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ flex: "1 1 280px", position: "relative" }}>
            <Search className="w-4 h-4 text-white/50 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hangouts by title, venue, or activity..."
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "14px",
                padding: "12px 14px 12px 42px",
                color: "#fff",
                fontSize: "13.5px",
                outline: "none",
              }}
              className="focus:border-[#FF5A1F] transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsLateNightRadar(!isLateNightRadar)}
            style={{
              background: isLateNightRadar ? "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)" : "rgba(255,255,255,0.04)",
              border: isLateNightRadar ? "1px solid #FF5A1F" : "1px solid rgba(255,255,255,0.12)",
              color: isLateNightRadar ? "#fff" : "rgba(255,255,255,0.75)",
              padding: "12px 18px",
              borderRadius: "14px",
              fontSize: "13px",
              fontWeight: 800,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.15s ease",
            }}
          >
            <Moon className={`w-4 h-4 ${isLateNightRadar ? "text-white" : "text-[#FF8A3D]"}`} />
            <span>{isLateNightRadar ? "Late Night Radar ON" : "Late Night Radar"}</span>
          </button>
        </div>

        {/* Luxury Architectural Segmented Control */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "4px",
            display: "inline-flex",
            gap: "4px",
            overflowX: "auto",
            maxWidth: "100%",
            backdropFilter: "blur(14px)",
            marginBottom: "20px",
          }}
        >
          {FILTER_TABS.map(({ id, label, icon: Icon }) => {
            const isCur = categoryFilter === id;
            const count = id === "all" ? beacons.length : beacons.filter((b) => b.category === id).length;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setCategoryFilter(id)}
                style={{
                  background: isCur
                    ? "linear-gradient(135deg, rgba(255, 111, 38, 0.25) 0%, rgba(255, 90, 31, 0.12) 100%)"
                    : "transparent",
                  border: isCur
                    ? "1px solid rgba(255, 111, 38, 0.45)"
                    : "1px solid transparent",
                  color: isCur ? "#FFFFFF" : "rgba(255, 255, 255, 0.65)",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  fontSize: "12.5px",
                  fontWeight: isCur ? 800 : 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  boxShadow: isCur ? "0 4px 16px rgba(255, 90, 31, 0.2)" : "none",
                }}
                className={isCur ? "" : "hover:text-white hover:bg-white/[0.04]"}
              >
                <Icon className={`w-3.5 h-3.5 ${isCur ? "text-[#FF8A3D]" : "text-white/40"}`} />
                <span>{label}</span>
                <span
                  style={{
                    background: isCur ? "rgba(255, 111, 38, 0.25)" : "rgba(255, 255, 255, 0.08)",
                    color: isCur ? "#FFA05C" : "rgba(255, 255, 255, 0.5)",
                    padding: "1px 6px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 800,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Beacons Cards Grid */}
        {filteredBeacons.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "20px",
            }}
          >
            {filteredBeacons.map((beacon) => (
              <BeaconCard
                key={beacon.id}
                beacon={beacon}
                onApply={handleApply}
                isLateNightRadar={isLateNightRadar}
                currentUserId={currentUserId}
                isRestrictedRole={isRestrictedRole}
                roleLabel={roleLabel}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px dashed rgba(255, 255, 255, 0.16)",
              borderRadius: "24px",
              padding: "50px 20px",
              textAlign: "center",
            }}
          >
            <Radio className="w-12 h-12 text-[#FF5A1F] mx-auto mb-3 opacity-60 animate-pulse" />
            <h3 style={{ fontSize: "19px", fontWeight: 800, margin: "0 0 6px" }}>
              No Active Beacons in this Category
            </h3>
            <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.6)", margin: "0 0 18px" }}>
              Be the first to ignite the signal and gather a squad today.
            </p>
            {isRestrictedRole ? (
              <Link
                href={portalUrl}
                style={{
                  background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)",
                  color: "#fff",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  fontSize: "13.5px",
                  fontWeight: 800,
                  cursor: "pointer",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Go to {roleLabel} Hub ➔
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setIsBeaconModalOpen(true)}
                style={{
                  background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)",
                  color: "#fff",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  fontSize: "13.5px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                + Broadcast First Beacon
              </button>
            )}
          </div>
        )}
      </section>

      {/* ── SECTION 2: CURATED OFFICIAL EVENTS (AFTER BEACONS) ──────────── */}
      <section id="events-section">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar className="w-5 h-5 text-[#FF5A1F]" />
              <h2 style={{ fontSize: "22px", fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
                Curated Official Events
              </h2>
            </div>
            <p style={{ fontSize: "12.5px", color: "rgba(255, 255, 255, 0.6)", margin: "4px 0 0" }}>
              Headliner parties, private festivals &amp; verified venue showcases
            </p>
          </div>

          {/* Event Category Filters */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "14px",
              padding: "4px",
              display: "inline-flex",
              gap: "4px",
              overflowX: "auto",
            }}
          >
            {EVENT_CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setEventCategoryFilter(cat.id)}
                style={{
                  background: eventCategoryFilter === cat.id ? "rgba(255, 90, 31, 0.22)" : "transparent",
                  border: eventCategoryFilter === cat.id ? "1px solid rgba(255, 90, 31, 0.45)" : "1px solid transparent",
                  color: eventCategoryFilter === cat.id ? "#FFA05C" : "rgba(255, 255, 255, 0.65)",
                  padding: "6px 14px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Official Events Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          {displayEvents.map((event, idx) => {
            const coverImg =
              EVENT_COVERS[`default_${(idx % 6) + 1}`] || EVENT_COVERS.default_1;
            const isBookingThis = bookingLoadingId === event.id;
            const hasTicket = tickets.some((t) => t.event_id === event.id);

            return (
              <div
                key={event.id}
                style={{
                  background: "linear-gradient(160deg, rgba(22, 14, 30, 0.9) 0%, rgba(10, 6, 16, 0.95) 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "22px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 14px 40px rgba(0, 0, 0, 0.5)",
                  transition: "transform 0.2s ease, border-color 0.2s ease",
                  position: "relative",
                }}
                className="hover:-translate-y-1 hover:border-[#FF5A1F]/50"
              >
                {/* Event Image Cover */}
                <div style={{ height: "160px", position: "relative", overflow: "hidden" }}>
                  <img
                    src={coverImg}
                    alt={event.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to top, rgba(10, 6, 16, 1) 0%, rgba(10, 6, 16, 0.2) 60%, transparent 100%)",
                    }}
                  />
                  {/* Category Chip on Cover */}
                  <div
                    style={{
                      position: "absolute",
                      top: "12px",
                      left: "12px",
                      background: "rgba(0, 0, 0, 0.65)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      fontSize: "10.5px",
                      fontWeight: 800,
                      color: "#FFA05C",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {event.event_type === "artist_split" ? "Headliner Gig" : "Official Party"}
                  </div>

                  {/* Price Chip */}
                  <div
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      background: "linear-gradient(135deg, #FF6F26, #FF5A1F)",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontWeight: 900,
                      color: "#FFFFFF",
                      boxShadow: "0 4px 12px rgba(255, 90, 31, 0.4)",
                    }}
                  >
                    Rs {event.price > 0 ? event.price.toLocaleString() : "Free VIP"}
                  </div>
                </div>

                {/* Event Details Body */}
                <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                  <h3 style={{ fontSize: "17px", fontWeight: 800, margin: 0, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
                    {event.title}
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "rgba(255, 255, 255, 0.7)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Calendar className="w-3.5 h-3.5 text-[#FF8A3D]" />
                      <span>
                        {new Date(event.scheduled_at).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <MapPin className="w-3.5 h-3.5 text-[#FF8A3D]" />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {event.venue_name || "Secret Venue"}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.55)", margin: "4px 0 0", lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {event.description || "Exclusive verified social circle hangout. Complimentary entry for verified members."}
                  </p>
                </div>

                {/* Footer Action */}
                <div
                  style={{
                    padding: "14px 18px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "rgba(0, 0, 0, 0.25)",
                  }}
                >
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255, 255, 255, 0.6)" }}>
                    <span style={{ color: "#27C93F", fontWeight: 800 }}>● Live</span> · {event.max_capacity} Max Spots
                  </div>

                  {isRestrictedRole ? (
                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        color: "rgba(255, 255, 255, 0.45)",
                        padding: "8px 14px",
                        borderRadius: "10px",
                        fontSize: "11px",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "not-allowed",
                      }}
                      title={`${roleLabel} accounts cannot book attendee passes (View Only mode)`}
                    >
                      <Shield className="w-3.5 h-3.5 text-white/40" />
                      <span>View Only ({roleLabel})</span>
                    </div>
                  ) : hasTicket ? (
                    <button
                      type="button"
                      disabled
                      style={{
                        background: "rgba(39, 201, 63, 0.15)",
                        border: "1px solid rgba(39, 201, 63, 0.35)",
                        color: "#27C93F",
                        padding: "8px 16px",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontWeight: 800,
                        cursor: "default",
                      }}
                    >
                      ✓ PASS CLAIMED
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isBookingThis}
                      onClick={() => handleBookEvent(event)}
                      style={{
                        background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        color: "#FFFFFF",
                        padding: "8px 18px",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontWeight: 800,
                        cursor: isBookingThis ? "not-allowed" : "pointer",
                        boxShadow: "0 4px 14px rgba(255, 90, 31, 0.4)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      className="hover:scale-105 active:scale-95 transition-transform"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>{isBookingThis ? "Booking..." : "Book Pass"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── SECTION 3: ACTIVITY ANALYSIS (User's Real Activity Tracker) ── */}
      {(() => {
        const totalActivities = userApps.length + tickets.length + hostedBeacons.length;
        const confirmedCount =
          userApps.filter((a: any) => a.status === "approved").length +
          tickets.filter((t: any) => t.ticket_status === "active" || t.ticket_status === "confirmed").length +
          hostedBeacons.filter((b: any) => b.status === "active").length;
        const pendingCount =
          userApps.filter((a: any) => a.status === "pending").length +
          tickets.filter((t: any) => t.ticket_status === "pending").length;

        const ACTIVITY_TABS = [
          { id: "all" as const, label: `All Activity (${totalActivities})` },
          { id: "applications" as const, label: `Beacon Requests (${userApps.length})` },
          { id: "tickets" as const, label: `Event Passes (${tickets.length})` },
          { id: "hosted" as const, label: `My Hosted (${hostedBeacons.length})` },
        ];

        let activityItems: any[] = [];
        if (activityTab === "all" || activityTab === "applications") {
          userApps.forEach((app: any) => {
            activityItems.push({
              _type: "application",
              id: `app-${app.id}`,
              rawId: app.id,
              createdAt: app.created_at,
              status: app.status,
              title: app.beacons?.title || "Solo Beacon Hangout",
              scheduledAt: app.beacons?.scheduled_at,
              location: app.beacons?.location_name || app.beacons?.city || selectedCity,
              category: app.beacons?.category || "casual",
              hostName: app.beacons?.profiles?.full_name || "Verified Host",
              hostAvatar: app.beacons?.profiles?.avatar_icon,
              beaconId: app.beacon_id,
            });
          });
        }
        if (activityTab === "all" || activityTab === "tickets") {
          tickets.forEach((tkt: any) => {
            activityItems.push({
              _type: "ticket",
              id: `tkt-${tkt.id}`,
              rawId: tkt.id,
              createdAt: tkt.created_at,
              status: tkt.ticket_status,
              title: tkt.official_events?.title || "Official Event Pass",
              scheduledAt: tkt.official_events?.scheduled_at,
              location: tkt.official_events?.venue_name || "Official Venue",
              price: tkt.official_events?.price,
              rawEvent: tkt.official_events,
            });
          });
        }
        if (activityTab === "all" || activityTab === "hosted") {
          hostedBeacons.forEach((h: any) => {
            activityItems.push({
              _type: "hosted",
              id: `hosted-${h.id}`,
              rawId: h.id,
              createdAt: h.created_at,
              status: h.status,
              title: h.title,
              scheduledAt: h.scheduled_at,
              location: h.location_name || h.city || selectedCity,
              filledSlots: h.filled_slots,
              totalSlots: h.total_slots,
              category: h.category,
              beaconId: h.id,
            });
          });
        }

        // Sort items by createdAt descending
        activityItems.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        return (
          <section
            id="activity-analysis-section"
            style={{
              background: "linear-gradient(160deg, rgba(18, 11, 26, 0.8) 0%, rgba(8, 4, 12, 0.9) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "24px",
              padding: "clamp(20px, 3vw, 28px)",
              boxShadow: "0 14px 40px rgba(0, 0, 0, 0.4)",
            }}
          >
            {/* Header row with Title and Counters */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #FF6F26, #FF5A1F)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 14px rgba(255, 90, 31, 0.4)",
                  }}
                >
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: 900, margin: 0, letterSpacing: "-0.02em", color: "#FFFFFF" }}>
                    Activity Analysis
                  </h2>
                  <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", margin: "2px 0 0" }}>
                    Live status of your beacon requests, official event passes &amp; hosted squads
                  </p>
                </div>
              </div>

              {/* Status Counter Summary Pills */}
              <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                <span
                  style={{
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    padding: "4px 10px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#FFFFFF",
                  }}
                >
                  {totalActivities} activities
                </span>
                <span
                  style={{
                    background: "rgba(39, 201, 63, 0.15)",
                    border: "1px solid rgba(39, 201, 63, 0.35)",
                    padding: "4px 10px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#27C93F",
                  }}
                >
                  Confirmed {confirmedCount}
                </span>
                <span
                  style={{
                    background: "rgba(255, 149, 0, 0.15)",
                    border: "1px solid rgba(255, 149, 0, 0.3)",
                    padding: "4px 10px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#FF9500",
                  }}
                >
                  Pending {pendingCount}
                </span>
              </div>
            </div>

            {/* Filter Tabs Row */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginBottom: "16px",
                paddingBottom: "12px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              {ACTIVITY_TABS.map((tab) => {
                const isActive = activityTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActivityTab(tab.id)}
                    style={{
                      background: isActive
                        ? "linear-gradient(135deg, #FF6F26, #FF5A1F)"
                        : "rgba(255, 255, 255, 0.04)",
                      border: isActive
                        ? "1px solid rgba(255, 255, 255, 0.2)"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                      color: isActive ? "#FFFFFF" : "rgba(255, 255, 255, 0.7)",
                      padding: "6px 14px",
                      borderRadius: "10px",
                      fontSize: "11.5px",
                      fontWeight: isActive ? 800 : 600,
                      cursor: "pointer",
                      boxShadow: isActive ? "0 4px 14px rgba(255, 90, 31, 0.35)" : "none",
                      transition: "all 0.15s ease",
                    }}
                    className={isActive ? "" : "hover:bg-white/[0.08] hover:text-white"}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Scrollable Container with Custom Activity Scrollbar */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                maxHeight: "440px",
                overflowY: "auto",
                paddingRight: "6px",
              }}
              className="custom-activity-scrollbar"
            >
              {activityItems.length === 0 ? (
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px dashed rgba(255, 255, 255, 0.12)",
                    borderRadius: "18px",
                    padding: "36px 20px",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "14px",
                      background: "rgba(255, 111, 38, 0.12)",
                      border: "1px solid rgba(255, 111, 38, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#FF8A3D",
                    }}
                  >
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "15px", fontWeight: 800, margin: "0 0 4px", color: "#FFFFFF" }}>
                      No Activity Logged
                    </h4>
                    <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.55)", margin: 0, maxWidth: "360px", lineHeight: 1.45 }}>
                      You haven&apos;t applied to any hangouts, claimed event tickets, or hosted beacons yet. Jump into the live radar to connect!
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                    <a
                      href="#radar-feed"
                      style={{
                        background: "linear-gradient(135deg, #FF6F26, #FF5A1F)",
                        color: "#FFFFFF",
                        fontSize: "11.5px",
                        fontWeight: 800,
                        padding: "8px 16px",
                        borderRadius: "10px",
                        textDecoration: "none",
                      }}
                    >
                      Explore Live Radar
                    </a>
                    <a
                      href="#events-section"
                      style={{
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(255, 255, 255, 0.18)",
                        color: "#FFFFFF",
                        fontSize: "11.5px",
                        fontWeight: 800,
                        padding: "8px 16px",
                        borderRadius: "10px",
                        textDecoration: "none",
                      }}
                    >
                      View Live Events
                    </a>
                  </div>
                </div>
              ) : (
                activityItems.map((item) => {
                  if (item._type === "application") {
                    const isApproved = item.status === "approved";
                    const isPending = item.status === "pending";
                    const isDeclined = item.status === "declined";

                    return (
                      <div
                        key={item.id}
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          border: isApproved
                            ? "1px solid rgba(39, 201, 63, 0.3)"
                            : "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "18px",
                          padding: "16px 20px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          transition: "border-color 0.15s ease",
                        }}
                        className="hover:border-white/20"
                      >
                        {/* Top row: Type Tag, Title, Date, Action */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            <div
                              style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "12px",
                                background: isApproved
                                  ? "linear-gradient(135deg, rgba(39, 201, 63, 0.2), rgba(39, 201, 63, 0.05))"
                                  : "linear-gradient(135deg, rgba(255, 111, 38, 0.2), rgba(255, 90, 31, 0.05))",
                                border: isApproved
                                  ? "1px solid rgba(39, 201, 63, 0.35)"
                                  : "1px solid rgba(255, 111, 38, 0.3)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Radio className={`w-5 h-5 ${isApproved ? "text-emerald-400" : "text-[#FF8A3D]"}`} />
                            </div>

                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "3px" }}>
                                <span
                                  style={{
                                    background: "rgba(255, 111, 38, 0.15)",
                                    border: "1px solid rgba(255, 111, 38, 0.3)",
                                    color: "#FFA05C",
                                    fontSize: "9.5px",
                                    fontWeight: 800,
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                    letterSpacing: "0.04em",
                                  }}
                                >
                                  BEACON APPLICATION
                                </span>
                                {item.scheduledAt && (
                                  <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.55)" }}>
                                    {new Date(item.scheduledAt).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "numeric",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                )}
                              </div>

                              <h4 style={{ fontSize: "15.5px", fontWeight: 800, margin: "0 0 2px", color: "#FFFFFF" }}>
                                {item.title}
                              </h4>

                              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "rgba(255, 255, 255, 0.6)" }}>
                                <MapPin className="w-3 h-3 text-[#FF8A3D]" />
                                <span>{item.location}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          {isApproved ? (
                            <Link
                              href={`/dashboard/chats?beacon=${item.beaconId}`}
                              style={{
                                background: "linear-gradient(135deg, #FF6F26, #FF5A1F)",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                color: "#FFFFFF",
                                padding: "8px 16px",
                                borderRadius: "10px",
                                fontSize: "12px",
                                fontWeight: 800,
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                boxShadow: "0 4px 14px rgba(255, 90, 31, 0.35)",
                              }}
                              className="hover:scale-105 active:scale-95 transition-transform"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-white" />
                              <span>Open Squad Chat</span>
                            </Link>
                          ) : (
                            <span
                              style={{
                                background: "rgba(255, 255, 255, 0.06)",
                                border: "1px solid rgba(255, 255, 255, 0.14)",
                                color: "rgba(255, 255, 255, 0.75)",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                fontSize: "11.5px",
                                fontWeight: 700,
                              }}
                            >
                              {isPending ? "Under Host Review" : isDeclined ? "Declined" : "Withdrawn"}
                            </span>
                          )}
                        </div>

                        {/* Status bar */}
                        <div
                          style={{
                            background: "rgba(0, 0, 0, 0.3)",
                            border: "1px solid rgba(255, 255, 255, 0.05)",
                            borderRadius: "12px",
                            padding: "8px 14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "8px",
                            fontSize: "11.5px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ color: "rgba(255, 255, 255, 0.55)", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase" }}>
                              Host:
                            </span>
                            <span style={{ fontWeight: 800, color: "#FFFFFF" }}>{item.hostName}</span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ color: "rgba(255, 255, 255, 0.55)", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase" }}>
                              Your Status:
                            </span>
                            {isApproved && (
                              <span
                                style={{
                                  background: "rgba(39, 201, 63, 0.15)",
                                  color: "#27C93F",
                                  border: "1px solid rgba(39, 201, 63, 0.35)",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  fontSize: "10.5px",
                                  fontWeight: 800,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Confirmed Member</span>
                              </span>
                            )}
                            {isPending && (
                              <span
                                style={{
                                  background: "rgba(255, 149, 0, 0.15)",
                                  color: "#FF9500",
                                  border: "1px solid rgba(255, 149, 0, 0.3)",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  fontSize: "10.5px",
                                  fontWeight: 800,
                                }}
                              >
                                ⏱ Pending Review
                              </span>
                            )}
                            {isDeclined && (
                              <span
                                style={{
                                  background: "rgba(255, 59, 48, 0.15)",
                                  color: "#FF3B30",
                                  border: "1px solid rgba(255, 59, 48, 0.3)",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  fontSize: "10.5px",
                                  fontWeight: 800,
                                }}
                              >
                                ✕ Declined
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (item._type === "ticket") {
                    const isConfirmed = item.status === "active" || item.status === "confirmed";

                    return (
                      <div
                        key={item.id}
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          border: isConfirmed
                            ? "1px solid rgba(39, 201, 63, 0.3)"
                            : "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "18px",
                          padding: "16px 20px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          transition: "border-color 0.15s ease",
                        }}
                        className="hover:border-white/20"
                      >
                        {/* Top row: Thumbnail, Title, Date, View Ticket */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            <div
                              style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "12px",
                                background: "linear-gradient(135deg, rgba(255, 111, 38, 0.25), rgba(255, 90, 31, 0.08))",
                                border: "1px solid rgba(255, 111, 38, 0.35)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Ticket className="w-5 h-5 text-[#FF8A3D]" />
                            </div>

                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "3px" }}>
                                <span
                                  style={{
                                    background: "rgba(255, 111, 38, 0.15)",
                                    border: "1px solid rgba(255, 111, 38, 0.3)",
                                    color: "#FFA05C",
                                    fontSize: "9.5px",
                                    fontWeight: 800,
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                    letterSpacing: "0.04em",
                                  }}
                                >
                                  OFFICIAL EVENT PASS
                                </span>
                                {item.scheduledAt && (
                                  <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.55)" }}>
                                    {new Date(item.scheduledAt).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </span>
                                )}
                              </div>

                              <h4 style={{ fontSize: "15.5px", fontWeight: 800, margin: "0 0 2px", color: "#FFFFFF" }}>
                                {item.title}
                              </h4>

                              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "rgba(255, 255, 255, 0.6)" }}>
                                <MapPin className="w-3 h-3 text-[#FF8A3D]" />
                                <span>{item.location}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedTicketForModal({
                                id: item.rawId,
                                title: item.title,
                                scheduled_at: item.scheduledAt,
                                venue_name: item.location,
                                status: isConfirmed ? "Confirmed" : "Pending",
                                memberName: name,
                              })
                            }
                            style={{
                              background: "rgba(255, 255, 255, 0.08)",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                              color: "#FFFFFF",
                              padding: "8px 16px",
                              borderRadius: "10px",
                              fontSize: "12px",
                              fontWeight: 800,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                            className="hover:bg-white/15 transition-colors"
                          >
                            <Ticket className="w-3.5 h-3.5 text-[#FF8A3D]" />
                            <span>View Ticket Pass</span>
                          </button>
                        </div>

                        {/* Status bar */}
                        <div
                          style={{
                            background: "rgba(0, 0, 0, 0.3)",
                            border: "1px solid rgba(255, 255, 255, 0.05)",
                            borderRadius: "12px",
                            padding: "8px 14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "8px",
                            fontSize: "11.5px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ color: "rgba(255, 255, 255, 0.55)", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase" }}>
                              Attendee:
                            </span>
                            <span style={{ fontWeight: 800, color: "#FFFFFF" }}>{name} (YOU)</span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ color: "rgba(255, 255, 255, 0.55)", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase" }}>
                              Pass Status:
                            </span>
                            {isConfirmed ? (
                              <span
                                style={{
                                  background: "rgba(39, 201, 63, 0.15)",
                                  color: "#27C93F",
                                  border: "1px solid rgba(39, 201, 63, 0.35)",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  fontSize: "10.5px",
                                  fontWeight: 800,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Confirmed · Ticket Ready</span>
                              </span>
                            ) : (
                              <span
                                style={{
                                  background: "rgba(255, 149, 0, 0.15)",
                                  color: "#FF9500",
                                  border: "1px solid rgba(255, 149, 0, 0.3)",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  fontSize: "10.5px",
                                  fontWeight: 800,
                                }}
                              >
                                ⏱ Verification Pending
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (item._type === "hosted") {
                    const isActive = item.status === "active";

                    return (
                      <div
                        key={item.id}
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          border: isActive
                            ? "1px solid rgba(255, 111, 38, 0.35)"
                            : "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "18px",
                          padding: "16px 20px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          transition: "border-color 0.15s ease",
                        }}
                        className="hover:border-white/20"
                      >
                        {/* Top row: Type Tag, Title, Date, Manage Link */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            <div
                              style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "12px",
                                background: "linear-gradient(135deg, #FF6F26, #FF5A1F)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                boxShadow: "0 4px 14px rgba(255, 90, 31, 0.35)",
                              }}
                            >
                              <Radio className="w-5 h-5 text-white" />
                            </div>

                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "3px" }}>
                                <span
                                  style={{
                                    background: "rgba(255, 111, 38, 0.2)",
                                    border: "1px solid rgba(255, 111, 38, 0.4)",
                                    color: "#FF8A3D",
                                    fontSize: "9.5px",
                                    fontWeight: 800,
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                    letterSpacing: "0.04em",
                                  }}
                                >
                                  HOSTED BY YOU
                                </span>
                                {item.scheduledAt && (
                                  <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.55)" }}>
                                    {new Date(item.scheduledAt).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "numeric",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                )}
                              </div>

                              <h4 style={{ fontSize: "15.5px", fontWeight: 800, margin: "0 0 2px", color: "#FFFFFF" }}>
                                {item.title}
                              </h4>

                              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "rgba(255, 255, 255, 0.6)" }}>
                                <MapPin className="w-3 h-3 text-[#FF8A3D]" />
                                <span>{item.location}</span>
                              </div>
                            </div>
                          </div>

                          <Link
                            href={`/dashboard/chats?beacon=${item.beaconId}`}
                            style={{
                              background: "rgba(255, 255, 255, 0.08)",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                              color: "#FFFFFF",
                              padding: "8px 16px",
                              borderRadius: "10px",
                              fontSize: "12px",
                              fontWeight: 800,
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                            className="hover:bg-white/15 transition-colors"
                          >
                            <Users className="w-3.5 h-3.5 text-[#FF8A3D]" />
                            <span>Manage Squad &amp; Chat</span>
                          </Link>
                        </div>

                        {/* Status bar */}
                        <div
                          style={{
                            background: "rgba(0, 0, 0, 0.3)",
                            border: "1px solid rgba(255, 255, 255, 0.05)",
                            borderRadius: "12px",
                            padding: "8px 14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "8px",
                            fontSize: "11.5px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ color: "rgba(255, 255, 255, 0.55)", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase" }}>
                              Joined Squad:
                            </span>
                            <span style={{ fontWeight: 800, color: "#FFA05C" }}>
                              {item.filledSlots} / {item.totalSlots} Spots Filled
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ color: "rgba(255, 255, 255, 0.55)", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase" }}>
                              Status:
                            </span>
                            {isActive ? (
                              <span
                                style={{
                                  background: "rgba(39, 201, 63, 0.15)",
                                  color: "#27C93F",
                                  border: "1px solid rgba(39, 201, 63, 0.35)",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  fontSize: "10.5px",
                                  fontWeight: 800,
                                }}
                              >
                                ● Broadcasting Live
                              </span>
                            ) : (
                              <span
                                style={{
                                  background: "rgba(255, 255, 255, 0.06)",
                                  color: "rgba(255, 255, 255, 0.6)",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  fontSize: "10.5px",
                                  fontWeight: 700,
                                }}
                              >
                                {item.status === "completed" ? "Completed" : "Cancelled"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })
              )}
            </div>
          </section>
        );
      })()}

      {/* ── MODALS ─────────────────────────────────────────────────────── */}
      {/* 1. Create Beacon Modal */}
      {isBeaconModalOpen && !isRestrictedRole && (
        <CreateBeaconModal
          onClose={() => setIsBeaconModalOpen(false)}
          onCreated={handleBeaconCreated}
          isPartner={isPartner}
          defaultCity={selectedCity}
        />
      )}



      {/* 3. VIP Ticket Pass Modal */}
      <VipTicketPassModal
        isOpen={!!selectedTicketForModal}
        onClose={() => setSelectedTicketForModal(null)}
        ticket={selectedTicketForModal}
      />
    </div>
  );
}
