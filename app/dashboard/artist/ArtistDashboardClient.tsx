"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseEventDescription, isEventConcluded } from "@/lib/event-metadata";
import {
  saveArtistPayoutSettingsAction,
  saveArtistProfileAction,
  toggleAttendeeAdmissionAction,
} from "@/app/actions/artists";
import {
  approveTicketByOwnerAction,
  rejectTicketByOwnerAction,
} from "@/app/actions/events";
import type { OfficialEvent, Profile } from "@/lib/supabase/types";
import {
  Mic2,
  Sparkles,
  Plus,
  Calendar,
  Ticket,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  MapPin,
  Users,
  Check,
  Wallet,
  Clock,
  ShieldCheck,
  Search,
  Sliders,
  Music,
  Share2,
  Headphones,
  Radio,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  Building2,
  Volume2,
  Camera,
  Upload,
  QrCode,
  Hourglass,
} from "lucide-react";
import EventCreateEditModal from "@/components/events/EventCreateEditModal";
import EventDoorScannerModal from "@/components/events/EventDoorScannerModal";
import DelegatedManagerSection, { ScopeDef } from "@/components/team/DelegatedManagerSection";

const ARTIST_MANAGER_SCOPES: ScopeDef[] = [
  {
    key: "events.door_scanner",
    name: "Camera Door Scanner & Live Gate Entry",
    desc: "Operate live camera check-in scanner and admit verified guests at the door",
  },
  {
    key: "events.manage_applications",
    name: "Review & Approve Ticket Bookings",
    desc: "Review and approve/decline incoming member pass bookings",
  },
  {
    key: "events.create_edit",
    name: "Create & Edit Gigs and Lineups",
    desc: "Update set times, performer lineups, and ticket tiers",
  },
  {
    key: "settlement.view",
    name: "View Ticket Revenue & Settlement",
    desc: "Inspect gross ticket sales and platform settlement wire calculations",
  },
];

interface TicketWithProfile {
  id: string;
  event_id: string;
  user_id: string;
  ticket_status: string;
  created_at: string;
  profiles?: {
    full_name?: string | null;
    city?: string | null;
  } | null;
}

interface ArtistDashboardClientProps {
  profile: Profile | null;
  initialEvents: OfficialEvent[];
  initialTickets: TicketWithProfile[];
  initialUserMeta?: Record<string, any>;
  initialTab?: string;
}

const AVAILABLE_GENRES = [
  "Melodic Techno",
  "Progressive House",
  "Deep House",
  "Minimal / Deep Tech",
  "Afro House",
  "Tech House",
  "Indie Dance",
  "Psytrance",
  "Hip-Hop / Rap",
  "Acoustic & Live Vocals",
  "Desi Fusion / EDM",
  "Drum & Bass",
];

export default function ArtistDashboardClient({
  profile,
  initialEvents,
  initialTickets,
  initialUserMeta = {},
  initialTab = "overview",
}: ArtistDashboardClientProps) {
  const router = useRouter();

  // Tab State: "overview" | "gigs" | "create" | "team" | "profile" | "settlement"
  const [activeTab, setActiveTab] = useState<"overview" | "gigs" | "create" | "team" | "profile" | "settlement">(() => {
    if (["overview", "gigs", "create", "team", "profile", "settlement"].includes(initialTab)) {
      return initialTab as any;
    }
    return "overview";
  });

  const [events, setEvents] = useState<OfficialEvent[]>(initialEvents);
  const [tickets, setTickets] = useState<TicketWithProfile[]>(initialTickets);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Per-event Door Scanner modal
  const [scannerEvent, setScannerEvent] = useState<OfficialEvent | null>(null);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  // Legacy scanner support (kept for backward compatibility in gigs tab)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    initialEvents.length > 0 ? initialEvents[0].id : null
  );
  const [scannerSearch, setScannerSearch] = useState("");
  const [attendeeFilter, setAttendeeFilter] = useState<"all" | "waiting" | "admitted">("all");

  // Feedback Messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // ─── Artist EPK & Sound Profile State ──────────────────────────────────────
  const [stageName, setStageName] = useState(
    profile?.business_name || initialUserMeta?.stage_name || profile?.full_name || ""
  );
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    profile?.vibe_tags || initialUserMeta?.genres || ["Melodic Techno", "Deep House"]
  );
  const [mixLink, setMixLink] = useState(
    profile?.social_link || initialUserMeta?.mix_link || ""
  );
  const [artistBio, setArtistBio] = useState(
    profile?.bio || initialUserMeta?.artist_bio || ""
  );
  const [soundRider, setSoundRider] = useState(
    initialUserMeta?.sound_rider || "2x Pioneer CDJ-3000, 1x DJM-900NXS2 mixer, 2x active booth monitors."
  );
  const [savingProfile, setSavingProfile] = useState(false);

  // ─── Payout & Settlement State (Confidential Platform Direct) ─────────────
  const [raastId, setRaastId] = useState(
    initialUserMeta?.raast_id || profile?.phone || ""
  );
  const [bankIban, setBankIban] = useState(initialUserMeta?.bank_iban || "");
  const [bankName, setBankName] = useState(initialUserMeta?.bank_name || "Meezan Bank");
  const [accountTitle, setAccountTitle] = useState(
    initialUserMeta?.account_title || profile?.full_name || ""
  );
  const [savingPayout, setSavingPayout] = useState(false);

  // Sync tab with top navbar dock and URL
  useEffect(() => {
    const handleUrlChange = () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab");
        if (tab && ["overview", "gigs", "create", "team", "profile", "settlement"].includes(tab)) {
          setActiveTab(tab as any);
        } else {
          setActiveTab("overview");
        }
      }
    };

    handleUrlChange();
    window.addEventListener("snm-artist-tab-change", handleUrlChange);
    window.addEventListener("popstate", handleUrlChange);
    return () => {
      window.removeEventListener("snm-artist-tab-change", handleUrlChange);
      window.removeEventListener("popstate", handleUrlChange);
    };
  }, []);

  const handleTabChange = (tab: "overview" | "gigs" | "create" | "team" | "profile" | "settlement") => {
    setActiveTab(tab);
    setErrorMsg(null);
    setSuccessMsg(null);
    if (typeof window !== "undefined") {
      const url = tab === "overview" ? "/dashboard/artist" : `/dashboard/artist?tab=${tab}`;
      window.history.pushState(null, "", url);
      window.dispatchEvent(new Event("snm-artist-tab-change"));
    }
  };

  // Telemetry Calculations (Strictly Isolated to Artist's Events)
  const totalTicketsSold = tickets.filter(
    (t) => t.ticket_status === "active" || t.ticket_status === "admitted"
  ).length;

  const grossRevenuePkr = events.reduce((sum, ev) => {
    const soldForEvent = tickets.filter(
      (t) => t.event_id === ev.id && (t.ticket_status === "active" || t.ticket_status === "admitted")
    ).length;
    return sum + soldForEvent * (ev.price || 0);
  }, 0);

  const platformFeePkr = Math.round(grossRevenuePkr * 0.08); // 8% platform fee
  const netArtistPayoutPkr = grossRevenuePkr - platformFeePkr; // 92% net to artist

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleToggleAdmission = async (ticketId: string, currentStatus: string) => {
    const newStatus = currentStatus === "admitted" ? "active" : "admitted";
    setCheckingInId(ticketId);
    try {
      const res = await toggleAttendeeAdmissionAction(ticketId, newStatus as any);
      if (res.success) {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, ticket_status: newStatus } : t))
        );
      } else {
        alert(res.error || "Failed to update admission.");
      }
    } finally {
      setCheckingInId(null);
    }
  };

  const handleApproveTicket = async (ticketId: string) => {
    try {
      const res = await approveTicketByOwnerAction(ticketId);
      if (res.success) {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, ticket_status: "active" } : t))
        );
        setSuccessMsg("✓ Ticket booking approved! Attendee is now cleared for door admission.");
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        alert(res.error || "Failed to approve ticket");
      }
    } catch {
      alert("Network error approving ticket");
    }
  };

  const handleRejectTicket = async (ticketId: string) => {
    try {
      const res = await rejectTicketByOwnerAction(ticketId);
      if (res.success) {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, ticket_status: "cancelled" } : t))
        );
      } else {
        alert(res.error || "Failed to reject ticket");
      }
    } catch {
      alert("Network error rejecting ticket");
    }
  };

  const [avatarUrl, setAvatarUrl] = useState(
    profile?.avatar_icon || initialUserMeta?.avatar_url || ""
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingAvatar(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (ev) => {
        const img = new window.Image();
        img.src = ev.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const MAX = 600;
          if (width > height) {
            if (width > MAX) {
              height = Math.round((height * MAX) / width);
              width = MAX;
            }
          } else {
            if (height > MAX) {
              width = Math.round((width * MAX) / height);
              height = MAX;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          try {
            const dataUrl = canvas.toDataURL("image/webp", 0.85);
            setAvatarUrl(dataUrl);
          } catch {
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
            setAvatarUrl(dataUrl);
          }
          setUploadingAvatar(false);
        };
      };
    } catch {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await saveArtistProfileAction({
        stageName: stageName.trim(),
        genres: selectedGenres,
        mixLink: mixLink.trim(),
        bio: artistBio.trim(),
        soundRider: soundRider.trim(),
        avatarUrl,
      });

      if (res.success) {
        setSuccessMsg("✓ Artist EPK & Sound Profile updated successfully!");
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(res.error || "Failed to update artist profile.");
      }
    } catch {
      setErrorMsg("Network error saving profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPayout(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await saveArtistPayoutSettingsAction({
        raastId: raastId.trim(),
        bankIban: bankIban.trim(),
        bankName: bankName.trim(),
        accountTitle: accountTitle.trim(),
      });

      if (res.success) {
        setSuccessMsg("✓ Settlement bank details saved securely for platform payout wires!");
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(res.error || "Failed to save settlement settings.");
      }
    } catch {
      setErrorMsg("Network error saving payout settings.");
    } finally {
      setSavingPayout(false);
    }
  };

  const handleCopyPublicLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/dashboard/events`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  // Selected event for door scanner
  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const attendeesForSelected = tickets.filter((t) => t.event_id === selectedEventId);

  // Filtered attendees for scanner
  const filteredAttendees = attendeesForSelected.filter((att) => {
    const matchesFilter =
      attendeeFilter === "all"
        ? true
        : attendeeFilter === "admitted"
        ? att.ticket_status === "admitted"
        : att.ticket_status !== "admitted";

    const query = scannerSearch.trim().toLowerCase();
    const matchesSearch =
      query === "" ||
      (att.profiles?.full_name?.toLowerCase() || "").includes(query) ||
      att.id.toLowerCase().includes(query) ||
      (att.profiles?.city?.toLowerCase() || "").includes(query);

    return matchesFilter && matchesSearch;
  });

  const admittedCount = attendeesForSelected.filter((t) => t.ticket_status === "admitted").length;
  const gateCapacityPercentage = attendeesForSelected.length > 0
    ? Math.round((admittedCount / attendeesForSelected.length) * 100)
    : 0;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* ── Top Hero Banner ──────────────────────────────────────────────── */}
      <div className="relative rounded-3xl bg-gradient-to-r from-white/[0.04] to-white/[0.01] border border-[#FF6F26]/30 p-6 md:p-8 overflow-hidden backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#FF6F26]/15 via-transparent to-transparent blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FF6F26]/15 text-[#FFA05C] border border-[#FF6F26]/30">
              <span className="w-2 h-2 rounded-full bg-[#FF6F26] animate-pulse" />
              VERIFIED CREATOR &amp; PROMOTER
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/[0.05] text-zinc-300 border border-white/10 flex items-center gap-1.5">
              {avatarUrl && (
                <img src={avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
              )}
              <span>{stageName || profile?.full_name || "Resident Artist"}</span>
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Mic2 className="w-7 h-7 text-[#FF6F26]" />
            Artist &amp; Performer Command Hub
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Manage your official DJ sets, track live ticket sales in PKR, run instant door check-ins, and configure post-event bank settlements.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap relative z-10">
          <button
            type="button"
            onClick={() => setIsEventModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF4400] text-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,111,38,0.45)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ List New Gig</span>
          </button>

          <button
            type="button"
            onClick={handleCopyPublicLink}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer"
            title="Copy Public Events Board link for Instagram bio"
          >
            <Share2 className="w-3.5 h-3.5 text-[#FF6F26]" />
            <span>{copiedLink ? "✓ Copied!" : "Share Link"}</span>
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 transition-all"
            title="Browse Member Radar in View Only mode"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#FF6F26]" />
            <span>Member Radar</span>
          </Link>
        </div>
      </div>

      {/* ── Telemetry Monitor Cards (Data-Isolated to Artist) ─────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-4 sm:p-5 text-center backdrop-blur-md">
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {events.length}
          </div>
          <div className="text-[11px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider mt-1">
            My Listed Gigs
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-4 sm:p-5 text-center backdrop-blur-md">
          <div className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">
            {totalTicketsSold}
          </div>
          <div className="text-[11px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider mt-1">
            Total Tickets Sold
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-4 sm:p-5 text-center backdrop-blur-md">
          <div className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-400 tracking-tight">
            PKR {grossRevenuePkr.toLocaleString()}
          </div>
          <div className="text-[11px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider mt-1">
            Gross Ticket Sales
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.02] border border-[#FF6F26]/40 p-4 sm:p-5 text-center backdrop-blur-md bg-gradient-to-br from-[#FF6F26]/10 to-transparent">
          <div className="text-xl sm:text-2xl md:text-3xl font-black text-[#FF8A3D] tracking-tight">
            PKR {netArtistPayoutPkr.toLocaleString()}
          </div>
          <div className="text-[11px] sm:text-xs font-semibold text-zinc-300 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
            <span>Net Payout (92%)</span>
            <span className="text-[10px] text-zinc-500 font-normal">(-8% fee)</span>
          </div>
        </div>
      </div>

      {/* ── SEGMENTED SUB-NAV TABS (Mobile horizontally scrollable) ──────── */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar scrollbar-none shrink-0 whitespace-nowrap">
        {[
          { id: "overview", label: "Dashboard & Lineups", icon: Calendar },
          { id: "gigs", label: `Live Gigs & Scanners (${events.length})`, icon: QrCode },
          { id: "create", label: "Gig Studio", icon: Plus },
          { id: "profile", label: "Press Kit & EPK", icon: Headphones },
          { id: "settlement", label: "Settlement Wire (92%)", icon: Wallet },
          { id: "team", label: "Gate Reception Team", icon: Users },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                isSelected
                  ? "bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-[0_4px_16px_rgba(255,111,38,0.35)]"
                  : "bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-white/5"
              }`}
            >
              <TabIcon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-zinc-400"}`} />
              <span>{tab.label}</span>
              {tab.id === "gigs" && tickets.filter((t) => t.ticket_status === "pending").length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-300 text-[10px] font-black border border-amber-500/40">
                  {tickets.filter((t) => t.ticket_status === "pending").length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Alert Banners */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── TAB 1: OVERVIEW & ACTIVE SHOWS ─────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#FF6F26]" />
                My Official Events &amp; Lineups
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Shows hosted under your artist account. Events pending review appear here before being published live.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEventModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#FF6F26]/20 border border-[#FF6F26]/40 text-[#FFA05C] hover:bg-[#FF6F26]/30 transition-colors"
            >
              + Launch Another Gig
            </button>
          </div>

          {tickets.filter((t) => t.ticket_status === "pending").length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                  <Hourglass className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-200">
                    {tickets.filter((t) => t.ticket_status === "pending").length} Ticket Booking{tickets.filter((t) => t.ticket_status === "pending").length > 1 ? "s" : ""} Awaiting Your Approval
                  </div>
                  <div className="text-[11px] text-amber-300/70">
                    As the event creator, approve attendee bookings directly before door admission.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange("gigs")}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-colors shadow-sm"
              >
                Review &amp; Approve ➔
              </button>
            </div>
          )}

          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {events.map((ev) => {
                const { metadata: meta } = parseEventDescription(ev.description);
                const isPendingReview = meta.status === "pending_review";
                const isDraft = meta.status === "draft";
                const isPast = isEventConcluded(ev.scheduled_at);
                const evTickets = tickets.filter(
                  (t) => t.event_id === ev.id && (t.ticket_status === "active" || t.ticket_status === "admitted")
                );

                return (
                  <div
                    key={ev.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md flex flex-col justify-between space-y-4 hover:border-white/20 transition-all"
                  >
                    <div>
                      {/* Status Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        {isPendingReview ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Pending Admin Review
                          </span>
                        ) : isPast ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                            <Clock className="w-3 h-3" />
                            Concluded Show
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live on Radar
                          </span>
                        )}

                        <span className="text-xs font-bold text-[#FF8A3D]">
                          {ev.price ? `PKR ${Number(ev.price).toLocaleString()}` : "FREE PASS"}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white tracking-tight">
                        {ev.title}
                      </h4>

                      <div className="text-xs text-zinc-400 mt-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#FF6F26] shrink-0" />
                          <span>{ev.venue_name || "Karachi Venue"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>
                            {ev.scheduled_at
                              ? new Date(ev.scheduled_at).toLocaleDateString("en-PK", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })
                              : "Upcoming"}
                          </span>
                        </div>
                      </div>

                      {/* Lineup & Tiers preview */}
                      {meta.lineups && meta.lineups.length > 0 && (
                        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-zinc-500 font-semibold uppercase">Lineup:</span>
                          {meta.lineups.slice(0, 3).map((l, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/[0.04] text-zinc-300 border border-white/5">
                              {l.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
                      <div className="text-xs font-semibold text-zinc-400">
                        <span className="text-white font-bold">{evTickets.length}</span> / {ev.max_capacity} Passes Sold
                      </div>

                      <button
                        type="button"
                        onClick={() => setScannerEvent(ev)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FF6F26]/15 hover:bg-[#FF6F26]/25 text-[#FFA05C] border border-[#FF6F26]/30 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-[#FF6F26]" />
                        <span>Door Scanner ➔</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 px-6 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-md">
              <Headphones className="w-12 h-12 text-[#FF6F26] mx-auto mb-3 opacity-60" />
              <h3 className="text-lg font-bold text-white">No Events Published Yet</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-5 leading-relaxed">
                Publish your upcoming gig or club night. Passes will be available on the community radar with automated door guestlist access.
              </p>
              <button
                type="button"
                onClick={() => setIsEventModalOpen(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-lg shadow-[#FF6F26]/30 cursor-pointer"
              >
                + Create Your First Gig
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: GIGS & PER-EVENT DOOR SCANNER ───────────────────────── */}
      {activeTab === "gigs" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#FF6F26]" />
                Event Guestlist & Door Scanners
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Select an event to open its dedicated door scanner — approve pending bookings, admit attendees, and track real-time admission.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEventModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#FF6F26]/20 border border-[#FF6F26]/40 text-[#FFA05C] hover:bg-[#FF6F26]/30 transition-colors"
            >
              + List New Gig
            </button>
          </div>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((ev) => {
                const evTickets = tickets.filter((t) => t.event_id === ev.id);
                const admittedForEv = evTickets.filter((t) => t.ticket_status === "admitted").length;
                const pendingForEv = evTickets.filter((t) => t.ticket_status === "pending").length;
                const activeForEv = evTickets.filter((t) => t.ticket_status === "active").length;
                const { metadata: meta } = parseEventDescription(ev.description);
                const isPendingAdmin = meta.status === "pending_review";

                return (
                  <div
                    key={ev.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md space-y-4 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {isPendingAdmin ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          Pending Admin Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live on Radar
                        </span>
                      )}
                      <span className="text-xs font-bold text-[#FFA05C]">
                        {ev.price ? `PKR ${Number(ev.price).toLocaleString()}` : "FREE"}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-sm">{ev.title}</h4>
                      <div className="text-xs text-zinc-400 mt-1 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {ev.venue_name || "Karachi Venue"}
                        </span>
                        <span>
                          {ev.scheduled_at ? new Date(ev.scheduled_at).toLocaleDateString() : "Upcoming"}
                        </span>
                      </div>
                    </div>

                    {/* Mini stats */}
                    <div className="grid grid-cols-3 gap-2">
                      {pendingForEv > 0 && (
                        <div className="text-center p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          <div className="text-lg font-black text-amber-400">{pendingForEv}</div>
                          <div className="text-[10px] text-amber-500/70 font-bold uppercase">Pending</div>
                        </div>
                      )}
                      <div className="text-center p-2 rounded-xl bg-white/[0.03] border border-white/5">
                        <div className="text-lg font-black text-sky-400">{activeForEv}</div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase">At Gate</div>
                      </div>
                      <div className="text-center p-2 rounded-xl bg-white/[0.03] border border-white/5">
                        <div className="text-lg font-black text-emerald-400">{admittedForEv}</div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase">Admitted</div>
                      </div>
                      {pendingForEv === 0 && (
                        <div className="text-center p-2 rounded-xl bg-white/[0.03] border border-white/5">
                          <div className="text-lg font-black text-white">{evTickets.length}</div>
                          <div className="text-[10px] text-zinc-500 font-bold uppercase">Total</div>
                        </div>
                      )}
                    </div>

                    {/* Open Door Scanner button */}
                    <button
                      type="button"
                      onClick={() => setScannerEvent(ev)}
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26]/20 to-[#FF5A1F]/10 hover:from-[#FF6F26]/30 hover:to-[#FF5A1F]/20 border border-[#FF6F26]/30 text-[#FFA05C] transition-all flex items-center justify-center gap-2"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Open Door Scanner</span>
                      {pendingForEv > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30">
                          {pendingForEv} pending
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 px-6 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-md">
              <QrCode className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">No Events to Scan</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-5 leading-relaxed">
                Create your first gig to unlock the Door Scanner. Once members book tickets, you can manage admissions here.
              </p>
              <button
                type="button"
                onClick={() => setIsEventModalOpen(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-lg shadow-[#FF6F26]/30 cursor-pointer"
              >
                + Create Your First Gig
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Per-event Door Scanner Modal ──────────────────────────────── */}
      {scannerEvent && (
        <EventDoorScannerModal
          isOpen={!!scannerEvent}
          onClose={() => setScannerEvent(null)}
          eventTitle={scannerEvent.title}
          eventDate={scannerEvent.scheduled_at ? new Date(scannerEvent.scheduled_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : undefined}
          eventVenue={scannerEvent.venue_name || undefined}
          tickets={tickets.filter((t) => t.event_id === scannerEvent.id)}
          accent="orange"
          onToggleAdmit={async (ticketId, currentStatus) => {
            const newStatus = currentStatus === "admitted" ? "active" : "admitted";
            const res = await toggleAttendeeAdmissionAction(ticketId, newStatus as any);
            if (res.success) {
              setTickets((prev) =>
                prev.map((t) => (t.id === ticketId ? { ...t, ticket_status: newStatus } : t))
              );
            }
          }}
          onApprove={async (ticketId) => {
            const res = await approveTicketByOwnerAction(ticketId);
            if (res.success) {
              setTickets((prev) =>
                prev.map((t) => (t.id === ticketId ? { ...t, ticket_status: "active" } : t))
              );
            }
          }}
          onReject={async (ticketId) => {
            const res = await rejectTicketByOwnerAction(ticketId);
            if (res.success) {
              setTickets((prev) =>
                prev.map((t) => (t.id === ticketId ? { ...t, ticket_status: "cancelled" } : t))
              );
            }
          }}
        />
      )}

      {/* ── TAB 3: LIST NEW GIG ───────────────────────────────────────────── */}
      {activeTab === "create" && (
        <div className="max-w-3xl mx-auto rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8 backdrop-blur-md space-y-6">
          <div className="border-b border-white/10 pb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6F26] block">
              Creator Pipeline
            </span>
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-1">
              <Sparkles className="w-5 h-5 text-[#FF6F26]" />
              Publish Official Artist Gig / Concert Pass
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Launch your upcoming rave or club night. Artist events feature custom ticket packages (Early Bird, VIP, Backstage), lineup selectors, and direct platform payment collection.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-amber-200">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300 block mb-0.5">Admin Ops Verification Pipeline:</strong>
              Once submitted, your event will enter the Admin Review Queue. Solo-No-More operations verifies venue logistics and activates digital passes live on the community radar within 2–4 hours.
            </div>
          </div>

          <div className="text-center py-6 space-y-3">
            <button
              type="button"
              onClick={() => setIsEventModalOpen(true)}
              className="px-6 py-3.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF4400] text-white hover:scale-105 transition-all shadow-[0_0_25px_rgba(255,111,38,0.45)] inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Artist Gig Creation Studio ➔</span>
            </button>
            <p className="text-[11px] text-zinc-500">
              Opens the full event designer with rich tier packages, poster uploads, and lineup slots.
            </p>
          </div>
        </div>
      )}

      {/* ── TAB 4: ARTIST PRESS KIT (EPK) & SOUND PROFILE ─────────────────── */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="max-w-2xl mx-auto rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8 backdrop-blur-md space-y-6">
          <div className="border-b border-white/10 pb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6F26] block">
              Electronic Press Kit (EPK)
            </span>
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-1">
              <Headphones className="w-5 h-5 text-[#FF6F26]" />
              Artist Moniker &amp; Sound Identity
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Curate your stage alias, music genres, sound rider, and mixtape links for promoters and attendees.
            </p>
          </div>

          <div className="space-y-4">
            {/* Artist Profile Picture / Avatar */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-4">
              <input
                type="file"
                ref={avatarFileRef}
                accept="image/png, image/jpeg, image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <div
                onClick={() => avatarFileRef.current?.click()}
                className="relative w-16 h-16 rounded-2xl bg-white/5 border border-white/15 overflow-hidden flex items-center justify-center cursor-pointer hover:border-[#FF6F26] transition-all group shrink-0"
                title="Upload artist profile photo"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={stageName || "Artist Profile"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Mic2 className="w-7 h-7 text-zinc-500 group-hover:text-[#FF6F26] transition-colors" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="flex-1 space-y-1">
                <span className="text-xs font-bold text-white block">
                  Artist Profile Picture
                </span>
                <p className="text-[11px] text-zinc-400">
                  Featured on your live events, lineups, attendee passes, and promoter radar.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => avatarFileRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="px-3 py-1 rounded-lg text-[11px] font-bold bg-[#FF6F26]/15 hover:bg-[#FF6F26]/25 border border-[#FF6F26]/30 text-[#FFA05C] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{uploadingAvatar ? "Processing..." : avatarUrl ? "Change Photo" : "Upload Photo"}</span>
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl("")}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Stage Name / Artist Moniker *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. DJ NeonPulse / Ali Baig Live"
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6F26]/60 transition-colors"
              />
            </div>

            {/* Music Genres Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">
                Music Genres &amp; Sonic Style (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_GENRES.map((genre) => {
                  const isSelected = selectedGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => toggleGenre(genre)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-[0_0_12px_rgba(255,111,38,0.3)]"
                          : "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 border border-white/5"
                      }`}
                    >
                      {isSelected ? `✓ ${genre}` : genre}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Mixtape / Audio Stream Link (SoundCloud / Spotify / Mixcloud)
              </label>
              <input
                type="url"
                placeholder="https://soundcloud.com/your-artist-profile"
                value={mixLink}
                onChange={(e) => setMixLink(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6F26]/60 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Artist Bio &amp; Sound Philosophy
              </label>
              <textarea
                rows={3}
                placeholder="Share your musical background, signature sound, and past headlining performances..."
                value={artistBio}
                onChange={(e) => setArtistBio(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6F26]/60 transition-colors resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Technical Sound Rider (DJ Gear / Soundcard Specs)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. 2x Pioneer CDJ-3000s, 1x DJM-900NXS2 mixer, 2x booth monitors, Shure wireless microphone."
                value={soundRider}
                onChange={(e) => setSoundRider(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6F26]/60 transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-3.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white hover:brightness-110 shadow-[0_0_20px_rgba(255,111,38,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{savingProfile ? "Saving Press Kit..." : "Save Artist EPK & Sound Profile"}</span>
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 5: PLATFORM SETTLEMENT & PAYOUTS ───────────────────────────── */}
      {activeTab === "settlement" && (
        <form onSubmit={handleSavePayout} className="max-w-2xl mx-auto rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8 backdrop-blur-md space-y-6">
          <div className="border-b border-white/10 pb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
              Confidential Treasury
            </span>
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-1">
              <Wallet className="w-5 h-5 text-emerald-400" />
              Platform Payout &amp; Settlement Wire
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Your confidential settlement details used strictly by the Solo-No-More platform treasury to disburse your net event revenue.
            </p>
          </div>

          {/* Platform Merchant Security Notice */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-xs text-emerald-300">
            <div className="font-bold text-emerald-400 flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Platform-Managed Payments (Confidential)
            </div>
            <p className="text-zinc-300 leading-relaxed text-[11.5px]">
              Attendee ticket payments are collected via the official Solo-No-More platform merchant and bank accounts. Your personal banking information is <strong>never visible to attendees</strong>. Within 24–48 hours after your show concludes, platform treasury wires your <strong>92% net earnings</strong> directly to your settlement account below.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Raast ID (Phone or Raast Alias for Instant PKR Wire) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 0300-1234567"
                value={raastId}
                onChange={(e) => setRaastId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Bank Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meezan Bank / HBL / SadaPay"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Account Title (Full Legal Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Legal Name on CNIC / Bank"
                  value={accountTitle}
                  onChange={(e) => setAccountTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Bank IBAN (24 Characters) *
              </label>
              <input
                type="text"
                required
                placeholder="PK42MEZN0000000123456701"
                value={bankIban}
                onChange={(e) => setBankIban(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400 font-mono"
              />
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-xs text-zinc-400">
              <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#FF6F26]" />
                Settlement Transparency &amp; Payout Terms
              </div>
              <ul className="list-disc pl-5 space-y-1 text-zinc-400 text-[11px]">
                <li>Platform ticketing fee is a flat 8% covering payment gateway and fraud protection.</li>
                <li>Net proceeds (92%) are automatically calculated and wired within 24 to 48 hours following your event.</li>
                <li>Fast-pass gate check-in scanner is included with every event at zero setup fee.</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={savingPayout}
              className="w-full py-3.5 px-4 rounded-xl text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 transition-colors cursor-pointer"
            >
              {savingPayout ? "Saving Settlement Info..." : "Save Confidential Settlement Details"}
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 6: GATE MANAGERS & TEAM ACCESS ────────────────────────────── */}
      {activeTab === "team" && (
        <DelegatedManagerSection
          type="artist_manager"
          delegatorId={profile?.id || "artist_default"}
          delegatorName={stageName || profile?.full_name || "Artist Host"}
          title="Gatekeepers & Door Reception Team"
          subtitle="Assign trusted crew or receptionists to operate the live camera Door Scanner and approve attendee bookings at the gate."
          availableScopes={ARTIST_MANAGER_SCOPES}
          accent="orange"
        />
      )}

      {/* ── Event Create Modal for Artist ───────────────────────────────── */}
      <EventCreateEditModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
        workspaceTitle="Artist & Performer Studio"
        isPartnerOrArtist={true}
      />

      {/* ── Dedicated Event Door Scanner Modal ───────────────────────────── */}
      {scannerEvent && (
        <EventDoorScannerModal
          isOpen={!!scannerEvent}
          onClose={() => setScannerEvent(null)}
          eventId={scannerEvent.id}
          eventTitle={scannerEvent.title}
          eventDate={
            scannerEvent.scheduled_at
              ? new Date(scannerEvent.scheduled_at).toLocaleDateString()
              : undefined
          }
          eventVenue={scannerEvent.venue_name || "Official Venue"}
          tickets={tickets.filter((t) => t.event_id === scannerEvent.id)}
          onToggleAdmit={handleToggleAdmission}
          onApprove={handleApproveTicket}
          onReject={handleRejectTicket}
          accent="orange"
        />
      )}
    </div>
  );
}
