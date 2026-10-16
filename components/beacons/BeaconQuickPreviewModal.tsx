"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Sparkles,
  Share2,
  X,
  ExternalLink,
  Flame,
  Check,
  ShieldCheck,
  Coins,
  ArrowRight,
  HelpCircle,
  Trophy,
  Coffee,
  Moon,
} from "lucide-react";
import { parseBeaconMeta } from "@/lib/beaconBudget";

export interface BeaconPreviewData {
  id: string;
  title: string;
  description?: string;
  category: "sports" | "casual" | "nightlife" | string;
  location_name?: string;
  location?: string;
  neighborhood?: string;
  scheduled_at?: string;
  date?: string;
  time?: string;
  total_slots?: number;
  capacity?: number;
  filled_slots?: number;
  joined?: number;
  status?: string;
  google_maps_url?: string;
  host?: {
    id?: string;
    full_name?: string;
    avatar_icon?: string;
    bio?: string;
    city?: string;
  };
  hostName?: string;
  hostRole?: string;
}

interface BeaconQuickPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  beacon: BeaconPreviewData | null;
  isLoggedIn?: boolean;
  onJoinNow?: (beacon: BeaconPreviewData) => void;
}

const CATEGORY_THEMES: Record<
  string,
  { label: string; icon: typeof Coffee; color: string; bg: string; border: string }
> = {
  sports: {
    label: "Sports & Padel",
    icon: Trophy,
    color: "#27C93F",
    bg: "rgba(39, 201, 63, 0.15)",
    border: "rgba(39, 201, 63, 0.35)",
  },
  casual: {
    label: "Chai & Casual",
    icon: Coffee,
    color: "#FFA05C",
    bg: "rgba(255, 160, 92, 0.15)",
    border: "rgba(255, 160, 92, 0.35)",
  },
  nightlife: {
    label: "Nightlife & Rave",
    icon: Moon,
    color: "#FF8A3D",
    bg: "rgba(255, 90, 31, 0.18)",
    border: "rgba(255, 90, 31, 0.4)",
  },
};

export default function BeaconQuickPreviewModal({
  isOpen,
  onClose,
  beacon,
  isLoggedIn = false,
  onJoinNow,
}: BeaconQuickPreviewModalProps) {
  const router = useRouter();
  const [copiedShare, setCopiedShare] = useState(false);

  // Prevent background scroll bleed while modal is open
  useEffect(() => {
    if (!isOpen || !beacon) return;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, beacon, onClose]);

  if (!isOpen || !beacon) return null;

  const categoryMeta =
    CATEGORY_THEMES[beacon.category?.toLowerCase()] || CATEGORY_THEMES.casual;
  const CategoryIcon = categoryMeta.icon;

  const totalSlots = beacon.total_slots || beacon.capacity || 5;
  const filledSlots = beacon.filled_slots ?? beacon.joined ?? 0;
  const spotsLeft = Math.max(0, totalSlots - filledSlots);
  const isFull = spotsLeft === 0;

  const parsedMeta = parseBeaconMeta(beacon.description || "");

  // Date / Time formatting
  let displayDate = beacon.date || "Date TBD";
  let displayTime = beacon.time || "Time TBD";
  if (beacon.scheduled_at) {
    try {
      const dt = new Date(beacon.scheduled_at);
      displayDate = dt.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      displayTime = dt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {}
  }

  const hostName =
    beacon.host?.full_name || beacon.hostName || "Verified Member";

  const shortCode = beacon.id.length >= 8 ? beacon.id.slice(0, 8) : beacon.id;
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/b/${shortCode}`
      : `https://solonomore.com/b/${shortCode}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: beacon.title,
          text: `Join ${beacon.title} on Solo-No-More!`,
          url: shareUrl,
        });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    } catch {}
  };

  const handleJoinClick = () => {
    if (isLoggedIn) {
      if (onJoinNow) {
        onJoinNow(beacon);
      } else {
        router.push(`/beacon/${beacon.id}?join=true`);
      }
    } else {
      const targetUrl = `/beacon/${beacon.id}?join=true`;
      router.push(`/login?redirect=${encodeURIComponent(targetUrl)}`);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto overscroll-contain"
      style={{
        background: "rgba(3, 2, 6, 0.88)",
        backdropFilter: "blur(20px)",
        overscrollBehavior: "contain",
      }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[92vh] rounded-3xl border border-[#FF6F26]/35 overflow-hidden shadow-[0_20px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(255,111,38,0.25)] flex flex-col my-auto overscroll-contain"
        style={{
          background: "linear-gradient(180deg, #160e1d 0%, #0c0814 100%)",
          overscrollBehavior: "contain",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Glow Banner */}
        <div className="relative p-6 pb-5 bg-gradient-to-b from-[#26152a] to-transparent border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider"
                style={{
                  background: categoryMeta.bg,
                  color: categoryMeta.color,
                  border: `1px solid ${categoryMeta.border}`,
                }}
              >
                <CategoryIcon className="w-3.5 h-3.5" />
                {categoryMeta.label}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Live Radar Squad
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/85 hover:bg-rose-600 text-white flex items-center justify-center border-2 border-white/50 hover:border-white shadow-[0_4px_20px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-all cursor-pointer hover:scale-110 active:scale-95 shrink-0"
              aria-label="Close Preview"
              title="Close Preview (Esc)"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mb-2">
            {beacon.title}
          </h2>

          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-[#27C93F] shrink-0" />
            <span>
              Hosted by <strong className="text-white">{hostName}</strong>
            </span>
            {beacon.host?.city && (
              <span className="text-zinc-500">· {beacon.host.city}</span>
            )}
          </div>
        </div>

        {/* Scrollable Content Body (Overscroll-Contain to stop parent scroll bleed) */}
        <div
          className="p-5 sm:p-6 space-y-5 overflow-y-auto overscroll-contain flex-1 text-white custom-scrollbar"
          style={{ overscrollBehavior: "contain" }}
        >
          {/* 4 Telemetry Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* 1. Date & Time */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF6F26]/15 border border-[#FF6F26]/30 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-[#FF6F26]" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Schedule</div>
                <div className="text-xs font-black text-white truncate">{displayDate}</div>
                <div className="text-[11px] text-zinc-400 truncate">{displayTime}</div>
              </div>
            </div>

            {/* 2. Venue Location */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-purple-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Location</div>
                <div className="text-xs font-black text-white truncate">
                  {beacon.location_name || beacon.location || "City Spot"}
                </div>
                {beacon.google_maps_url ? (
                  <a
                    href={beacon.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#FFA05C] hover:underline flex items-center gap-0.5 truncate"
                  >
                    Maps Link <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ) : (
                  <div className="text-[11px] text-zinc-400 truncate">{beacon.neighborhood || "Curated Hub"}</div>
                )}
              </div>
            </div>

            {/* 3. Budget Pact */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Coins className="w-4 h-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Budget Pact</div>
                <div className="text-xs font-black text-amber-300 truncate">
                  {parsedMeta.budgetTier || "Fair Split"}
                </div>
                <div className="text-[11px] text-zinc-400">Agreed upfront</div>
              </div>
            </div>

            {/* 4. Squad Capacity Meter */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Squad Spots</div>
                <div className="text-xs font-black text-emerald-300">
                  {filledSlots}/{totalSlots} Claimed
                </div>
                <div className="text-[11px] text-zinc-400 font-semibold">
                  {isFull ? "Full Squad" : `${spotsLeft} spots left`}
                </div>
              </div>
            </div>
          </div>

          {/* Spots Visualization Bar */}
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(totalSlots, 10) }).map((_, i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    background: i < filledSlots ? "#FF6F26" : "rgba(255, 255, 255, 0.2)",
                    boxShadow: i < filledSlots ? "0 0 8px rgba(255, 111, 38, 0.6)" : "none",
                  }}
                />
              ))}
              {totalSlots > 10 && (
                <span className="text-[11px] text-zinc-400">+{totalSlots - 10}</span>
              )}
            </div>
            <span className="text-xs font-bold text-zinc-300">
              {isFull ? "Squad Capped" : `${spotsLeft} openings remaining`}
            </span>
          </div>

          {/* Host Icebreaker Question (if configured) */}
          {parsedMeta.customQuestion && (
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/25 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-purple-300">
                <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                <span>Host Icebreaker Question:</span>
              </div>
              <p className="text-zinc-200 italic">&ldquo;{parsedMeta.customQuestion}&rdquo;</p>
            </div>
          )}

          {/* Meetup Vibe & Description */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Meetup Vibe &amp; Plan
            </h4>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line bg-white/[0.02] p-4 rounded-2xl border border-white/5">
              {parsedMeta.description ||
                beacon.description ||
                "Drop in solo, hang out with like-minded locals, and make genuine IRL connections."}
            </p>
          </div>

          {/* Guest notice if not logged in */}
          {!isLoggedIn && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-200 leading-snug">
                <strong>No account required to preview!</strong> Click &ldquo;Join Squad Meetup&rdquo; to sign in or create an account and secure your spot instantly.
              </p>
            </div>
          )}
        </div>

        {/* Bottom CTA Action Bar */}
        <div className="p-4 sm:p-5 bg-black/60 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleShare}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto"
            >
              {copiedShare ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Meetup</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={handleJoinClick}
            disabled={isFull}
            className={`w-full sm:w-auto px-7 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isFull
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white hover:brightness-110 shadow-[0_4px_24px_rgba(255,111,38,0.5)]"
            }`}
          >
            <span>{isFull ? "Squad Full" : "⚡ Join Squad Meetup"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
