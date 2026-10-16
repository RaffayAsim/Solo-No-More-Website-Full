"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Users,
  Sparkles,
  Share2,
  X,
  ExternalLink,
  Flame,
  Check,
  ShieldCheck,
  Lock,
  ArrowRight,
} from "lucide-react";

export interface EventPreviewData {
  id: string;
  title: string;
  description?: string;
  cleanDescription?: string;
  venue_name?: string;
  location?: string;
  scheduled_at?: string;
  date?: string;
  time?: string;
  flyer_image_url?: string;
  price?: number | string;
  category?: string;
  tag?: string;
  joined?: number;
  capacity?: number;
  max_capacity?: number;
  google_maps_url?: string;
  lineups?: string[];
  hostName?: string;
  metadata?: {
    tier_packages?: Array<{
      id: string;
      name: string;
      price: number;
      perks?: string;
      spots?: number;
    }>;
    is_members_only?: boolean;
    lineups?: string[];
  };
}

interface EventQuickPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventPreviewData | null;
  isLoggedIn?: boolean;
  onBookNow?: (event: EventPreviewData) => void;
}

export default function EventQuickPreviewModal({
  isOpen,
  onClose,
  event,
  isLoggedIn = false,
  onBookNow,
}: EventQuickPreviewModalProps) {
  const router = useRouter();
  const [copiedShare, setCopiedShare] = useState(false);

  // Prevent background scroll bleed while modal is open
  useEffect(() => {
    if (!isOpen || !event) return;
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
  }, [isOpen, event, onClose]);

  if (!isOpen || !event) return null;

  // Compute countdown / time
  let formattedDate = event.date || "Date TBA";
  let formattedTime = event.time || "Time TBA";
  let daysUntil: number | null = null;
  let isUpcoming = false;

  if (event.scheduled_at) {
    try {
      const dt = new Date(event.scheduled_at);
      formattedDate = dt.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      formattedTime = dt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });

      const now = new Date();
      daysUntil = Math.ceil((dt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      isUpcoming = daysUntil >= 0;
    } catch {}
  }

  // Price formatting
  const rawPrice = event.price ?? 0;
  const numPrice = typeof rawPrice === "number" ? rawPrice : parseFloat(rawPrice.toString().replace(/[^0-9.]/g, "")) || 0;
  const priceDisplay = numPrice > 0 ? `PKR ${numPrice.toLocaleString()}` : "Free RSVP";
  const isFree = numPrice === 0 || priceDisplay.toLowerCase().includes("free");

  // Attendees count
  const attending = event.joined ?? 0;
  const maxCap = event.capacity || event.max_capacity || 100;
  const spotsLeft = Math.max(0, maxCap - attending);

  // Tiers and lineups
  const tiers = event.metadata?.tier_packages || [];
  const lineups = event.lineups || event.metadata?.lineups || [];

  // Share handler
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/events/${event.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Check out ${event.title} on Solo-No-More!`,
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

  // Booking CTA Handler
  const handleBookingClick = () => {
    if (isLoggedIn) {
      if (onBookNow) {
        onBookNow(event);
      } else {
        router.push(`/events/${event.id}?book=true`);
      }
    } else {
      const targetUrl = `/events/${event.id}?book=true`;
      router.push(`/login?redirect=${encodeURIComponent(targetUrl)}`);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto overscroll-contain"
      style={{
        background: "rgba(3, 2, 6, 0.88)",
        backdropFilter: "blur(20px)",
        overscrollBehavior: "contain",
      }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] rounded-3xl border border-[#FF6F26]/35 overflow-hidden shadow-[0_20px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(255,111,38,0.25)] flex flex-col my-auto overscroll-contain"
        style={{
          background: "linear-gradient(180deg, #160e1d 0%, #0c0814 100%)",
          overscrollBehavior: "contain",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover Flyer Image Header */}
        <div className="relative h-48 sm:h-64 w-full bg-black/60 overflow-hidden shrink-0">
          {event.flyer_image_url ? (
            <img
              src={event.flyer_image_url}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#241107] to-[#120803] p-4 text-center">
              <Ticket className="w-12 h-12 text-[#FF6F26]/60 mb-2" />
              <span className="text-xs font-black uppercase tracking-widest text-[#FFA05C]">
                Solo-No-More Curated Event
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#160e1d] via-[#160e1d]/40 to-transparent" />

          {/* Top Left Badges */}
          <div className="absolute top-3.5 left-3.5 flex items-center gap-2 flex-wrap z-10">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-[#FFA05C] border border-[#FF6F26]/40">
              {event.category?.toUpperCase() || "EVENT PASS"}
            </span>

            {isFree ? (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/80 text-white shadow-md">
                FREE ADMISSION
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#FF6F26] text-white shadow-md">
                TICKETS ACTIVE
              </span>
            )}

            {event.metadata?.is_members_only && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center gap-1 shadow-md">
                <Flame className="w-3 h-3" />
                MEMBERS ONLY
              </span>
            )}
          </div>

          {/* Top Right Action & Close (High-Contrast Bold X) */}
          <div className="absolute top-3.5 right-3.5 flex items-center gap-2 z-30">
            <button
              type="button"
              onClick={handleShare}
              title="Share event link"
              className="p-2 rounded-full bg-black/80 hover:bg-white/20 border border-white/30 text-white transition-all cursor-pointer shadow-lg backdrop-blur-md"
            >
              {copiedShare ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              title="Close modal (Esc)"
              className="w-9 h-9 rounded-full bg-black/85 hover:bg-rose-600 text-white flex items-center justify-center border-2 border-white/50 hover:border-white shadow-[0_4px_20px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-all cursor-pointer hover:scale-110 active:scale-95"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Bottom Countdown Pill on Flyer */}
          {isUpcoming && daysUntil !== null && (
            <div className="absolute bottom-3 left-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/15 text-[11px] font-black text-amber-300">
              <Clock className="w-3.5 h-3.5 text-[#FF6F26]" />
              <span>{daysUntil === 0 ? "Happening Today!" : `Happening in ${daysUntil} day${daysUntil > 1 ? "s" : ""}`}</span>
            </div>
          )}
        </div>

        {/* Scrollable Body (Overscroll-Contain to stop parent scroll bleed) */}
        <div
          className="p-4 sm:p-6 space-y-5 overflow-y-auto overscroll-contain custom-scrollbar flex-1"
          style={{ overscrollBehavior: "contain" }}
        >
          {/* Title & Host row */}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              {event.title}
            </h2>
            {event.hostName && (
              <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hosted by <strong className="text-white">{event.hostName}</strong></span>
              </div>
            )}
          </div>

          {/* 4 Quick Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                <Calendar className="w-3.5 h-3.5 text-[#FF6F26]" />
                <span>Date</span>
              </div>
              <div className="text-xs font-bold text-white truncate">{formattedDate}</div>
              <div className="text-[10px] text-zinc-400 truncate">{formattedTime}</div>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                <MapPin className="w-3.5 h-3.5 text-[#FF6F26]" />
                <span>Venue</span>
              </div>
              <div className="text-xs font-bold text-white truncate">
                {event.venue_name || event.location || "City Location"}
              </div>
              {event.google_maps_url && (
                <a
                  href={event.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-[#FFA05C] hover:underline flex items-center gap-1 truncate"
                >
                  <span>Directions ↗</span>
                </a>
              )}
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                <Ticket className="w-3.5 h-3.5 text-emerald-400" />
                <span>Starting Pass</span>
              </div>
              <div className="text-xs font-black text-emerald-300 truncate">{priceDisplay}</div>
              <div className="text-[10px] text-zinc-400">Per Attendee</div>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                <Users className="w-3.5 h-3.5 text-[#FFA05C]" />
                <span>Capacity</span>
              </div>
              <div className="text-xs font-bold text-white truncate">
                {attending}/{maxCap} Joined
              </div>
              <div className="text-[10px] text-emerald-400 font-bold">{spotsLeft} spots left</div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300">
              About This Experience
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line bg-white/[0.02] p-3.5 rounded-2xl border border-white/5">
              {event.cleanDescription || event.description || "Join fellow community members and verified guests for this curated scene meetup."}
            </p>
          </div>

          {/* Lineups / Artists (if configured) */}
          {lineups && lineups.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                Featured Artists &amp; Lineup
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {lineups.map((artist, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl text-xs font-bold bg-[#FF6F26]/15 text-[#FFA05C] border border-[#FF6F26]/30"
                  >
                    🎤 {artist}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ticket Tiers Breakdown */}
          {tiers && tiers.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                <span>Available Pass Tiers</span>
                <span className="text-[10px] font-bold text-zinc-500">Door Scanner QR Verified</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {tiers.map((t, idx) => (
                  <div
                    key={t.id || idx}
                    className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1 hover:border-[#FF6F26]/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-white">{t.name}</span>
                      <span className="text-xs font-black text-[#FFA05C]">
                        {t.price > 0 ? `PKR ${t.price.toLocaleString()}` : "Free"}
                      </span>
                    </div>
                    {t.perks && <p className="text-[10.5px] text-zinc-400 line-clamp-1">{t.perks}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Instant digital ticket pass with unique QR verification.</span>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleBookingClick}
              className="w-full sm:w-auto px-7 py-3 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white hover:brightness-110 shadow-[0_4px_24px_rgba(255,111,38,0.5)] transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Ticket className="w-4 h-4 text-white" />
              <span>{isLoggedIn ? "Book Passes & Tickets" : "Sign In to Book Passes"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
