"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/billing";
import { cancelPartnerOfferAction } from "@/app/actions/beacons";
import { checkInAttendeeAction } from "@/app/actions/events";
import CreatePartnerOfferModal from "@/components/partner/CreatePartnerOfferModal";
import CreatePartnerEventModal from "@/components/partner/CreatePartnerEventModal";
import type { Beacon, Profile, OfficialEvent } from "@/lib/supabase/types";
import { parseEventDescription } from "@/lib/event-metadata";
import {
  Store,
  Sparkles,
  Plus,
  Check,
  MapPin,
  Users,
  Building2,
  Tag,
  CheckCircle2,
  AlertCircle,
  Calendar,
  BarChart3,
  Percent,
  TrendingUp,
  ShieldCheck,
  Clock,
  ExternalLink,
  Trash2,
  Share2,
  Ticket,
  ChevronRight,
  Flame,
  Coffee,
  Coins,
  ArrowUpRight,
  Eye,
  Info,
  UserCheck,
  Camera,
  Upload,
} from "lucide-react";

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

interface OfferApplicationWithProfile {
  id: string;
  beacon_id: string;
  applicant_id: string;
  status: string;
  created_at: string;
  profiles?: {
    id?: string;
    full_name?: string | null;
    city?: string | null;
    avatar_icon?: string | null;
    vibe_tags?: string[] | null;
  } | null;
}

const VALID_VIBES = [
  "🏃 ACTIVE",
  "🎵 MUSIC",
  "☕ COFFEE",
  "🌙 NIGHTS",
  "📚 CULTURE",
  "🎮 GAMING",
  "🌊 OUTDOORS",
  "🍕 FOODIE",
  "📸 CREATIVE",
  "💬 SOCIAL",
];

interface PartnerDashboardClientProps {
  profile: Profile;
  initialOffers: Beacon[];
  initialEvents: OfficialEvent[];
  initialTickets: TicketWithProfile[];
  initialOfferApplications?: OfferApplicationWithProfile[];
  initialTab?: string;
}

export default function PartnerDashboardClient({
  profile,
  initialOffers,
  initialEvents,
  initialTickets,
  initialOfferApplications = [],
  initialTab = "overview",
}: PartnerDashboardClientProps) {
  const router = useRouter();

  // Tab State: "overview" | "offers" | "events" | "store"
  const [activeTab, setActiveTab] = useState<"overview" | "offers" | "events" | "store">(() => {
    if (initialTab === "offers" || initialTab === "events" || initialTab === "store") {
      return initialTab;
    }
    return "overview";
  });

  useEffect(() => {
    const handleUrlChange = () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab");
        if (tab === "offers" || tab === "events" || tab === "store") {
          setActiveTab(tab);
        } else {
          setActiveTab("overview");
        }
      }
    };

    handleUrlChange();
    window.addEventListener("snm-tab-change", handleUrlChange);
    window.addEventListener("popstate", handleUrlChange);
    return () => {
      window.removeEventListener("snm-tab-change", handleUrlChange);
      window.removeEventListener("popstate", handleUrlChange);
    };
  }, [initialTab]);

  const handleTabChange = (tab: "overview" | "offers" | "events" | "store") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = tab === "overview" ? "/dashboard/partner" : `/dashboard/partner?tab=${tab}`;
      window.history.pushState(null, "", url);
      window.dispatchEvent(new Event("snm-tab-change"));
    }
  };

  const [offers, setOffers] = useState<Beacon[]>(initialOffers);
  const [events, setEvents] = useState<OfficialEvent[]>(initialEvents);
  const [tickets, setTickets] = useState<TicketWithProfile[]>(initialTickets);
  const [offerApplications, setOfferApplications] = useState<OfferApplicationWithProfile[]>(
    initialOfferApplications
  );

  // Door check-in and Roster states
  const [checkingInTicketId, setCheckingInTicketId] = useState<string | null>(null);
  const [selectedOfferForRoster, setSelectedOfferForRoster] = useState<Beacon | null>(null);

  // Store form state
  const [businessName, setBusinessName] = useState(profile.business_name || profile.full_name || "");
  const [city, setCity] = useState(profile.city || "Karachi");
  const [bio, setBio] = useState(profile.bio || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [selectedVibes, setSelectedVibes] = useState<string[]>(profile.vibe_tags || []);

  const toggleVibe = (tag: string) => {
    setSelectedVibes((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 5 ? [...prev, tag] : prev
    );
  };

  // Door Check-in Handler
  const handleAdmitTicket = async (ticketId: string) => {
    setCheckingInTicketId(ticketId);
    try {
      const res = await checkInAttendeeAction(ticketId);
      if (res.success) {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, ticket_status: "admitted" } : t))
        );
      } else {
        alert(res.error || "Failed to admit attendee.");
      }
    } catch {
      alert("Network error during door check-in.");
    } finally {
      setCheckingInTicketId(null);
    }
  };

  // Modal triggers
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedGuestlistEvent, setSelectedGuestlistEvent] = useState<OfficialEvent | null>(null);

  // Action states
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [storeSuccess, setStoreSuccess] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);

  const [cancellingOfferId, setCancellingOfferId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Derived Business Figures
  const activeOffers = offers.filter((o) => o.status === "active");
  const totalSlotsJoined = offers.reduce((sum, offer) => sum + (offer.filled_slots || 0), 0);
  const totalTicketsSold = tickets.filter(
    (t) => t.ticket_status === "active" || t.ticket_status === "admitted" || t.ticket_status === "scanned"
  ).length;

  // Estimated Footfall Revenue (PKR)
  // Assumes average spend of PKR 2,800 per squad cover + ticket revenue
  const grossTicketRevenue = events.reduce((sum, ev) => {
    const count = tickets.filter(
      (t) => t.event_id === ev.id && (t.ticket_status === "active" || t.ticket_status === "scanned")
    ).length;
    return sum + count * (ev.price || 0);
  }, 0);
  const estimatedDineInSpend = totalSlotsJoined * 2800;
  const totalEstimatedValuePkr = estimatedDineInSpend + grossTicketRevenue;

  // Store form state
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_icon || "");
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

  // Store profile updater
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStore(true);
    setStoreError(null);
    setStoreSuccess(false);

    if (!businessName.trim()) {
      setStoreError("Business name is required.");
      setIsSavingStore(false);
      return;
    }

    try {
      const res = await updateProfile({
        business_name: businessName,
        city,
        bio,
        vibe_tags: selectedVibes,
        avatar_icon: avatarUrl,
      });

      if (res.success) {
        setStoreSuccess(true);
        router.refresh();
        setTimeout(() => setStoreSuccess(false), 2500);
      } else {
        setStoreError(res.error);
      }
    } catch {
      setStoreError("Connection failed. Unable to save venue details.");
    } finally {
      setIsSavingStore(false);
    }
  };

  // Archive / Cancel Offer
  const handleCancelOffer = async (offerId: string) => {
    if (!confirm("Are you sure you want to archive this promotional offer? It will be removed from member radars.")) {
      return;
    }
    setCancellingOfferId(offerId);
    try {
      const res = await cancelPartnerOfferAction(offerId);
      if (res.success) {
        setOffers((prev) => prev.filter((o) => o.id !== offerId));
        router.refresh();
      } else {
        alert(res.error || "Failed to remove offer.");
      }
    } catch {
      alert("Network error while removing offer.");
    } finally {
      setCancellingOfferId(null);
    }
  };

  const handleCopyRadarLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/dashboard`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-7">
      {/* ── TOP HERO BANNER: BRAND SPOTLIGHT & ACTION CENTER ────────────── */}
      <div className="relative rounded-3xl bg-gradient-to-r from-white/[0.04] via-white/[0.02] to-transparent border border-[#FF6F26]/30 p-6 md:p-8 overflow-hidden backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#FF6F26]/20 text-[#FFA05C] border border-[#FF6F26]/40">
                <Store className="w-3.5 h-3.5 text-[#FF6F26]" />
                <span>Verified Venue Portal</span>
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/5 border border-white/10 text-zinc-300 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#FF6F26]" />
                <span>{city} Radar Active</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <span>{businessName || "Your Venue"}</span>
              <span title="Verified Solo-No-More Partner">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
              Command center to mobilize high-spending solo squads, launch location-locked discounts, host brand events, and drive verified off-peak footfall.
            </p>
          </div>

          {/* Quick Action Launchers - Contextual per Tab */}
          <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto">
            {activeTab === "overview" && (
              <>
                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(true)}
                  className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white hover:brightness-110 shadow-[0_0_25px_rgba(255,111,38,0.35)] transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Broadcast Promo Offer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(true)}
                  className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white transition-all flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-[#FFA05C]" />
                  <span>+ Host Brand Event</span>
                </button>
              </>
            )}

            {activeTab === "offers" && (
              <button
                type="button"
                onClick={() => setIsOfferModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white hover:brightness-110 shadow-[0_0_25px_rgba(255,111,38,0.35)] transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>+ Broadcast New Promo Offer</span>
              </button>
            )}

            {activeTab === "events" && (
              <button
                type="button"
                onClick={() => setIsEventModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:brightness-110 shadow-[0_0_25px_rgba(147,51,234,0.35)] transition-all flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-white" />
                <span>+ Host New Brand Event</span>
              </button>
            )}

            {activeTab === "store" && (
              <button
                type="button"
                onClick={() => {
                  const saveBtn = document.getElementById("store-submit-btn");
                  if (saveBtn) saveBtn.click();
                }}
                className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white hover:brightness-110 shadow-[0_0_25px_rgba(255,111,38,0.35)] transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-white" />
                <span>Save Venue Setup</span>
              </button>
            )}
          </div>
        </div>

        {/* Ambient Corner Flare */}
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#FF6F26]/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ── SEGMENTED SUB-NAV TABS ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto custom-scrollbar">
        {[
          { id: "overview", label: "Command Center & Figures", icon: BarChart3 },
          { id: "offers", label: `Promos & Deals (${activeOffers.length})`, icon: Tag },
          { id: "events", label: `Brand Events (${events.length})`, icon: Calendar },
          { id: "store", label: "Store & Venue Setup", icon: Building2 },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                isSelected
                  ? "bg-[#FF6F26] text-white shadow-[0_4px_16px_rgba(255,111,38,0.35)]"
                  : "bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-white/5"
              }`}
            >
              <TabIcon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-zinc-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: OVERVIEW & PERFORMANCE FIGURES ("PROS & FIGURES") ──────── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-fadeIn">
          {/* ── KEY BUSINESS FIGURES ────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Figure 1: Active Promos */}
            <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-5 backdrop-blur-xl flex flex-col justify-between hover:border-white/20 transition-all">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-bold uppercase tracking-wider">Active Promos</span>
                <Tag className="w-4 h-4 text-[#FF8A3D]" />
              </div>
              <div className="my-3">
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {activeOffers.length}
                </div>
                <div className="text-[11px] font-medium text-emerald-400 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live on Member Radar
                </div>
              </div>
              <button
                onClick={() => handleTabChange("offers")}
                className="text-[11px] font-bold text-[#FFA05C] hover:text-white flex items-center gap-1 self-start"
              >
                <span>Manage promos</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Figure 2: Brand Events */}
            <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-5 backdrop-blur-xl flex flex-col justify-between hover:border-white/20 transition-all">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-bold uppercase tracking-wider">Events Hosted</span>
                <Calendar className="w-4 h-4 text-purple-400" />
              </div>
              <div className="my-3">
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {events.length}
                </div>
                <div className="text-[11px] font-medium text-zinc-400 mt-1">
                  {totalTicketsSold} Passes Claimed / Sold
                </div>
              </div>
              <button
                onClick={() => handleTabChange("events")}
                className="text-[11px] font-bold text-purple-400 hover:text-white flex items-center gap-1 self-start"
              >
                <span>View guestlist</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Figure 3: Squad Members Mobilized */}
            <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-5 backdrop-blur-xl flex flex-col justify-between hover:border-white/20 transition-all">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-bold uppercase tracking-wider">Squad Reach</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="my-3">
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {totalSlotsJoined + totalTicketsSold}
                </div>
                <div className="text-[11px] font-medium text-zinc-400 mt-1">
                  High-intent diners mobilized
                </div>
              </div>
              <div className="text-[11px] text-zinc-500">
                Avg. 2–5 members per table
              </div>
            </div>

            {/* Figure 4: Estimated In-Store Footfall Value */}
            <div className="rounded-3xl bg-gradient-to-br from-[#FF6F26]/10 to-transparent border border-[#FF6F26]/40 p-5 backdrop-blur-xl flex flex-col justify-between shadow-[0_0_20px_rgba(255,111,38,0.15)]">
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-xs font-bold uppercase tracking-wider">Estimated F&B Spend</span>
                <Coins className="w-4 h-4 text-[#FFA05C]" />
              </div>
              <div className="my-3">
                <div className="text-2xl sm:text-3xl font-black text-[#FFA05C] tracking-tight">
                  PKR {totalEstimatedValuePkr.toLocaleString()}
                </div>
                <div className="text-[11px] font-medium text-zinc-300 mt-1">
                  100% In-Store Keeps (0% Fee)
                </div>
              </div>
              <div className="text-[10px] text-zinc-400">
                Based on ~PKR 2,800/diner spend
              </div>
            </div>
          </div>

          {/* ── PARTNER PROS & PLATFORM VALUE SHOWCASE ───────────────────────── */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8 backdrop-blur-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#FFA05C] block">
                  Why Solo-No-More Works For Your Venue
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  Partner Growth Pros & Advantages
                </h3>
              </div>
              <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-zinc-400 self-start sm:self-auto">
                No Upfront Fees · Keep 100% Bill
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pro 1 */}
              <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-5 space-y-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Percent className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white text-sm">0% Food & Drink Commission</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Unlike delivery portals taking 25–35%, Solo-No-More charges 0% on member bills. Members pay your full bill directly at checkout.
                </p>
              </div>

              {/* Pro 2 */}
              <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-5 space-y-3">
                <div className="w-9 h-9 rounded-xl bg-[#FF6F26]/10 border border-[#FF6F26]/20 flex items-center justify-center text-[#FFA05C]">
                  <Flame className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white text-sm">Off-Peak Table Activation</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Broadcast happy hour perks on slow weekday nights (Mon–Thu) to fill empty capacity with verified working professionals and students.
                </p>
              </div>

              {/* Pro 3 */}
              <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-5 space-y-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white text-sm">High-Spending Squads</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Solo members join in groups of 2 to 5 for coffee, meals, or drinks. Average table check ranges from PKR 4,500 to PKR 12,000.
                </p>
              </div>

              {/* Pro 4 */}
              <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-5 space-y-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white text-sm">Verified Radar Spotlight</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Your venue blip is permanently pinned with a verified partner badge on Karachi, Lahore & Islamabad discovery radars.
                </p>
              </div>
            </div>
          </div>

          {/* ── QUICK PREVIEW OF ACTIVE PROMOS & EVENTS ──────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Promos Snapshot */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-[#FF6F26]" />
                  Active Promotions ({activeOffers.length})
                </span>
                <button
                  onClick={() => setIsOfferModalOpen(true)}
                  className="text-xs font-bold text-[#FFA05C] hover:text-white flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Offer</span>
                </button>
              </div>

              {activeOffers.length > 0 ? (
                <div className="space-y-3">
                  {activeOffers.slice(0, 3).map((offer) => (
                    <div
                      key={offer.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between gap-3 hover:border-white/20 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FF6F26]/15 text-[#FFA05C] border border-[#FF6F26]/30">
                            % Partner Promo
                          </span>
                          <span className="text-[10px] text-zinc-400 font-medium">
                            {offer.location_name || businessName}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-sm">{offer.title}</h4>
                        <div className="text-xs text-zinc-400 flex items-center gap-3">
                          <span>{offer.filled_slots} / {offer.total_slots} Seats Claimed</span>
                          <span>·</span>
                          <span className="text-zinc-500">{offer.city}</span>
                        </div>
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setSelectedOfferForRoster(offer)}
                            className="text-[11px] font-bold text-[#FFA05C] hover:text-white flex items-center gap-1 transition-colors"
                          >
                            <Users className="w-3 h-3 text-[#FF6F26]" />
                            <span>View Squad Roster ({offerApplications.filter((a) => a.beacon_id === offer.id && a.status === "approved").length})</span>
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelOffer(offer.id)}
                        disabled={cancellingOfferId === offer.id}
                        className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Archive promo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 space-y-2">
                  <Tag className="w-6 h-6 text-zinc-500 mx-auto" />
                  <p className="text-xs text-zinc-400 font-medium">No live promo broadcasts active</p>
                  <button
                    onClick={() => setIsOfferModalOpen(true)}
                    className="text-xs font-bold text-[#FFA05C] hover:underline"
                  >
                    + Broadcast your first promo deal
                  </button>
                </div>
              )}
            </div>

            {/* Brand Events Snapshot */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  Brand Events & Gigs ({events.length})
                </span>
                <button
                  onClick={() => setIsEventModalOpen(true)}
                  className="text-xs font-bold text-purple-400 hover:text-white flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Event</span>
                </button>
              </div>

              {events.length > 0 ? (
                <div className="space-y-3">
                  {events.slice(0, 3).map((ev) => {
                    const { metadata } = parseEventDescription(ev.description);
                    const soldCount = tickets.filter(
                      (t) => t.event_id === ev.id && (t.ticket_status === "active" || t.ticket_status === "scanned")
                    ).length;
                    return (
                      <div
                        key={ev.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between gap-3 hover:border-white/20 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                metadata.status === "published"
                                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                  : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              }`}
                            >
                              {metadata.status === "published" ? "Published" : "Under Verification"}
                            </span>
                            <span className="text-[10px] text-zinc-400">{ev.venue_name}</span>
                          </div>
                          <h4 className="font-bold text-white text-sm">{ev.title}</h4>
                          <div className="text-xs text-zinc-400 flex items-center gap-3">
                            <span>{new Date(ev.scheduled_at).toLocaleDateString()}</span>
                            <span>·</span>
                            <span className="text-[#FFA05C] font-semibold">{soldCount} / {ev.max_capacity} Passes Sold</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedGuestlistEvent(ev)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all flex items-center gap-1"
                        >
                          <Ticket className="w-3.5 h-3.5 text-purple-400" />
                          <span>Guestlist</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 space-y-2">
                  <Calendar className="w-6 h-6 text-zinc-500 mx-auto" />
                  <p className="text-xs text-zinc-400 font-medium">No brand events created yet</p>
                  <button
                    onClick={() => setIsEventModalOpen(true)}
                    className="text-xs font-bold text-purple-400 hover:underline"
                  >
                    + Host your first tasting, trivia night, or live session
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: PROMOTIONS & DEALS ─────────────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "offers" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#FF6F26]" />
                <span>Venue Deals & Promotional Broadcasts</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Active discounts, vouchers, and group table deals live on member radars across {city}.
              </p>
            </div>
            <button
              onClick={() => setIsOfferModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white hover:brightness-110 shadow-[0_0_20px_rgba(255,111,38,0.3)] transition-all flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Post Dedicated Promo Offer</span>
            </button>
          </div>

          {offers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers.map((offer) => {
                const isCancelled = offer.status === "cancelled";
                return (
                  <div
                    key={offer.id}
                    className={`rounded-3xl border p-5 backdrop-blur-xl space-y-4 transition-all ${
                      isCancelled
                        ? "bg-white/[0.01] border-white/5 opacity-60"
                        : "bg-white/[0.02] border-white/10 hover:border-[#FF6F26]/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FF6F26]/15 text-[#FFA05C] border border-[#FF6F26]/30">
                          % PARTNER PROMO
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-zinc-400 uppercase">
                          {offer.city}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isCancelled
                            ? "bg-zinc-800 text-zinc-500"
                            : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {isCancelled ? "Archived" : "● Live on Radar"}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-white text-base">
                        {offer.title}
                      </h3>
                      {offer.description && (
                        <p className="text-xs text-zinc-400 mt-1.5 whitespace-pre-line line-clamp-3">
                          {offer.description}
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-zinc-400 flex items-center justify-between gap-3 flex-wrap pt-1 border-t border-white/5">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#FF6F26]" />
                        {offer.location_name || businessName}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-semibold text-zinc-300">
                          <Users className="w-3.5 h-3.5 text-[#FFA05C]" />
                          {offer.filled_slots} / {offer.total_slots} Squad Seats
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedOfferForRoster(offer)}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold bg-[#FF6F26]/15 hover:bg-[#FF6F26]/25 text-[#FFA05C] border border-[#FF6F26]/30 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <Users className="w-3.5 h-3.5 text-[#FF6F26]" />
                          <span>Squad Roster ({offerApplications.filter((a) => a.beacon_id === offer.id && a.status === "approved").length})</span>
                        </button>
                      </div>
                    </div>

                    {offer.image_url && (
                      <div className="rounded-2xl overflow-hidden border border-white/10 max-h-40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={offer.image_url}
                          alt="Promo banner"
                          className="w-full h-36 object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={handleCopyRadarLink}
                        className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1.5"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{copiedLink ? "Radar Link Copied!" : "Share Promo"}</span>
                      </button>

                      {!isCancelled && (
                        <button
                          onClick={() => handleCancelOffer(offer.id)}
                          disabled={cancellingOfferId === offer.id}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{cancellingOfferId === offer.id ? "Removing..." : "Archive Offer"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center backdrop-blur-md space-y-3">
              <Tag className="w-10 h-10 text-zinc-600 mx-auto" />
              <div className="text-base font-bold text-white">No Promos Broadcasted</div>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Broadcast discounts, 1+1 coffee vouchers, or off-peak happy hours. They show up highlighted on the live radar for solo members looking for hangout plans.
              </p>
              <button
                onClick={() => setIsOfferModalOpen(true)}
                className="mt-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-[#FF6F26] text-white hover:brightness-110"
              >
                + Broadcast First Promo Deal
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 3: BRAND & VENUE EVENTS ───────────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "events" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                <span>Brand Events, Gigs & Ticket Passes</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Sell digital ticket passes in PKR via Raast or SadePay, manage door check-ins, and host exclusive tastings.
              </p>
            </div>
            <button
              onClick={() => setIsEventModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:brightness-110 shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Host New Partner Event</span>
            </button>
          </div>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((ev) => {
                const { metadata, cleanDescription } = parseEventDescription(ev.description);
                const soldForThisEvent = tickets.filter(
                  (t) => t.event_id === ev.id && (t.ticket_status === "active" || t.ticket_status === "scanned")
                );
                const revenueForEvent = soldForThisEvent.length * (ev.price || 0);

                return (
                  <div
                    key={ev.id}
                    className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl space-y-4 hover:border-purple-500/40 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          metadata.status === "published"
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {metadata.status === "published" ? "✓ Published & Live" : "⏳ Pending Verification"}
                      </span>
                      <span className="text-xs font-bold text-[#FFA05C]">
                        {ev.price ? `PKR ${ev.price.toLocaleString()}` : "Free Admission"}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-white text-base">{ev.title}</h3>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                        {cleanDescription || "Brand event hosted by venue partner."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-xs">
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase font-bold">Date & Time</span>
                        <span className="font-semibold text-zinc-200">
                          {new Date(ev.scheduled_at).toLocaleDateString()} · {metadata.start_time || "20:00"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase font-bold">Passes Sold</span>
                        <span className="font-semibold text-purple-300">
                          {soldForThisEvent.length} / {ev.max_capacity}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="text-xs text-zinc-400">
                        Revenue: <span className="text-emerald-400 font-bold">PKR {revenueForEvent.toLocaleString()}</span>
                      </div>
                      <button
                        onClick={() => setSelectedGuestlistEvent(ev)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all flex items-center gap-1.5"
                      >
                        <Ticket className="w-3.5 h-3.5 text-purple-400" />
                        <span>Guestlist ({soldForThisEvent.length})</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center backdrop-blur-md space-y-3">
              <Calendar className="w-10 h-10 text-zinc-600 mx-auto" />
              <div className="text-base font-bold text-white">No Events Hosted Yet</div>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Host a trivia night, acoustic music session, weekend mixer, or culinary masterclass at your venue. Solo-No-More handles digital ticket issuance.
              </p>
              <button
                onClick={() => setIsEventModalOpen(true)}
                className="mt-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-purple-600 text-white hover:brightness-110"
              >
                + Launch Partner Event
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 4: STORE & VENUE SETUP ────────────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "store" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
          {/* Column 1: Store Setup Form */}
          <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#FF6F26]" />
                <span>Store & Venue Information</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Configure your public venue profile, city, and verified perk descriptions displayed to members.
              </p>
            </div>

            <form onSubmit={handleSaveInfo} className="p-6 space-y-4">
              {/* Venue Logo / Profile Picture */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#FF6F26]" />
                    <span>Venue Logo / Profile Picture</span>
                  </label>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl("")}
                      className="text-[11px] text-red-400 hover:text-red-300 transition-colors font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6F26]/20 to-purple-600/20 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Venue Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-7 h-7 text-zinc-500" />
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/10 cursor-pointer transition-all">
                      <span>{avatarUrl ? "Change Venue Logo" : "Upload Venue Logo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </label>
                    <p className="text-[11px] text-zinc-500">
                      Square JPG/PNG/WebP recommended. Compressed automatically for instant loading across member feed & event cards.
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Business / Brand Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="e.g. Koyla Chai, District 19, Artisan Roasters..."
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6F26] transition-colors"
                />
              </div>

              {/* Operating City */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Operating City
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#140e1b] border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-[#FF6F26]"
                >
                  <option value="Karachi">Karachi</option>
                  <option value="Lahore">Lahore</option>
                  <option value="Islamabad">Islamabad</option>
                </select>
              </div>

              {/* Venue Category & Vibe Ambiance */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300">
                    Venue Category & Vibe Tags (Select up to 5)
                  </label>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {selectedVibes.length}/5 selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {VALID_VIBES.map((tag) => {
                    const isSelected = selectedVibes.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleVibe(tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          isSelected
                            ? "bg-[#FF6F26] border-[#FF6F26] text-white shadow-[0_0_15px_rgba(255,111,38,0.3)]"
                            : "bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-zinc-500">
                  These vibes automatically auto-fill your promo offers and brand events for the right solo audience.
                </p>
              </div>

              {/* Perks & Standard Bio */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Standard Venue Perks & Ambiance
                </label>
                <textarea
                  rows={4}
                  maxLength={220}
                  placeholder="e.g. 10% off bill for all verified solo members. Free Wi-Fi, power outlets for remote work, and specialty pour-over coffee."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6F26] transition-colors resize-none"
                />
                <div className="text-[10px] text-zinc-500 text-right">
                  {bio.length}/220 characters
                </div>
              </div>

              {/* Feedback Alerts */}
              {storeError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{storeError}</span>
                </div>
              )}

              {storeSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Venue profile updated successfully!</span>
                </div>
              )}

              <button
                id="store-submit-btn"
                type="submit"
                disabled={isSavingStore}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white hover:brightness-110 shadow-[0_0_20px_rgba(255,111,38,0.25)] transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSavingStore ? "Saving..." : "Update Store Profile"}</span>
              </button>
            </form>
          </div>

          {/* Column 2: Live Public Preview */}
          <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFA05C] flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Member Discovery Card Preview
            </span>

            <div className="rounded-2xl border border-[#FF6F26]/30 bg-gradient-to-br from-white/[0.04] to-transparent p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-5 h-5 text-[#FF6F26]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#FF6F26]/20 text-[#FFA05C] border border-[#FF6F26]/40">
                      VERIFIED PARTNER
                    </span>
                    <span className="text-[10px] font-medium text-zinc-400">{city}</span>
                  </div>
                  <h4 className="text-base font-black text-white truncate mt-0.5">
                    {businessName || "Your Venue Name"}
                  </h4>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                {bio || "Specialty cafe and hangout space welcoming solo members and social squads."}
              </p>

              {selectedVibes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedVibes.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/5 border border-white/10 text-zinc-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#FF6F26]" />
                  <span>{city} Radar Active</span>
                </span>
                <span className="text-emerald-400 font-bold">Verified Blip</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-zinc-400 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#FFA05C]" />
                <span>Automatic Location Pinning</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Whenever you broadcast a promo or event, your verified venue details and city are automatically locked into the offer so you never have to re-enter your location.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── DEDICATED PARTNER OFFER MODAL ─────────────────────────────────── */}
      <CreatePartnerOfferModal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        onCreated={() => {
          router.refresh();
          handleTabChange("offers");
        }}
        profile={profile}
      />

      {/* ── PARTNER EVENT CREATE MODAL ────────────────────────────────────── */}
      <CreatePartnerEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onCreated={() => {
          router.refresh();
          handleTabChange("events");
        }}
        profile={profile}
      />

      {/* ── GUESTLIST / TICKET VIEWER MODAL ───────────────────────────────── */}
      {selectedGuestlistEvent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#120d18] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                  Guestlist & Check-in
                </span>
                <h3 className="text-base font-extrabold text-white">
                  {selectedGuestlistEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedGuestlistEvent(null)}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2.5 custom-scrollbar">
              {tickets.filter((t) => t.event_id === selectedGuestlistEvent.id).length > 0 ? (
                tickets
                  .filter((t) => t.event_id === selectedGuestlistEvent.id)
                  .map((t) => {
                    const isAdmitted = t.ticket_status === "admitted" || t.ticket_status === "scanned";
                    return (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs gap-3 hover:border-white/15 transition-all"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{t.profiles?.full_name || "Verified Member"}</span>
                          </div>
                          <div className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                            <span>{t.profiles?.city || "Karachi"}</span>
                            <span>·</span>
                            <span className="font-mono text-zinc-500">Pass #{t.id.slice(0, 8)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isAdmitted ? (
                            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>✓ Admitted at Door</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={checkingInTicketId === t.id}
                              onClick={() => handleAdmitTicket(t.id)}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:brightness-110 border border-emerald-400/40 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.25)] active:scale-95 disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{checkingInTicketId === t.id ? "Checking In..." : "Admit Guest"}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="p-8 text-center text-xs text-zinc-500">
                  No ticket passes claimed for this event yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SQUAD ROSTER VIEWER MODAL (PROMO OFFERS) ────────────────────── */}
      {selectedOfferForRoster && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-[#FF6F26]/30 bg-[#140e1b] p-6 space-y-4 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(255,111,38,0.2)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFA05C] bg-[#FF6F26]/15 px-2 py-0.5 rounded-full border border-[#FF6F26]/30">
                    Promo Squad Roster
                  </span>
                  <span className="text-xs text-zinc-400">
                    {selectedOfferForRoster.filled_slots} / {selectedOfferForRoster.total_slots} Seats
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-white mt-1">
                  {selectedOfferForRoster.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOfferForRoster(null)}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2.5 custom-scrollbar">
              {offerApplications.filter(
                (a) => a.beacon_id === selectedOfferForRoster.id && a.status === "approved"
              ).length > 0 ? (
                offerApplications
                  .filter(
                    (a) => a.beacon_id === selectedOfferForRoster.id && a.status === "approved"
                  )
                  .map((app) => (
                    <div
                      key={app.id}
                      className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs gap-3 hover:border-white/15 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                          {app.profiles?.avatar_icon ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={app.profiles.avatar_icon}
                              alt={app.profiles.full_name || "Member"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users className="w-5 h-5 text-zinc-400" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{app.profiles?.full_name || "Solo Member"}</span>
                          </div>
                          <div className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                            <span>{app.profiles?.city || "Karachi"}</span>
                            <span>·</span>
                            <span className="text-zinc-500">
                              Joined {new Date(app.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Seated / Confirmed</span>
                      </span>
                    </div>
                  ))
              ) : (
                <div className="p-8 text-center text-xs text-zinc-500 space-y-1">
                  <Users className="w-7 h-7 text-zinc-600 mx-auto mb-1" />
                  <p className="font-bold text-zinc-300">No squad members seated yet</p>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                    When solo members join this table on their radar, their verified profiles will appear here for table reservation.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
