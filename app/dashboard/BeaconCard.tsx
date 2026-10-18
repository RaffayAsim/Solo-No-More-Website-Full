"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { Beacon, BeaconCategory } from "@/lib/supabase/types";
import { applyToBeacon, withdrawFromBeacon } from "@/app/actions/applications";
import dynamic from "next/dynamic";

const SquadChatModal = dynamic(() => import("@/components/SquadChatModal"), { ssr: false });
import {
  Calendar,
  MapPin,
  Users,
  MessageSquare,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  Sparkles,
  ShieldAlert,
  Trophy,
  Coffee,
  Moon,
  Coins,
  HelpCircle,
  Share2,
  AlertCircle,
} from "lucide-react";
import UniversalShareModal from "@/components/share/UniversalShareModal";
import { parseBeaconMeta } from "@/lib/beaconBudget";

const CATEGORY_META: Record<
  BeaconCategory,
  { label: string; icon: typeof Trophy; bg: string; border: string; color: string }
> = {
  sports: {
    label: "Sports & Padel",
    icon: Trophy,
    bg: "rgba(39, 201, 63, 0.12)",
    border: "rgba(39, 201, 63, 0.28)",
    color: "#27C93F",
  },
  casual: {
    label: "Chai & Casual",
    icon: Coffee,
    bg: "rgba(255, 160, 92, 0.12)",
    border: "rgba(255, 160, 92, 0.28)",
    color: "#FFA05C",
  },
  nightlife: {
    label: "Nightlife & Rave",
    icon: Moon,
    bg: "rgba(255, 90, 31, 0.15)",
    border: "rgba(255, 90, 31, 0.35)",
    color: "#FF8A3D",
  },
};

function formatScheduledAt(iso: string | null): string {
  if (!iso) return "Time TBD";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function SlotDots({ filled, total }: { filled: number; total: number }) {
  const remaining = Math.max(0, total - filled);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "10px 0 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        {Array.from({ length: Math.min(total, 12) }).map((_, i) => (
          <span
            key={i}
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: i < filled ? "#FF5A1F" : "rgba(255,255,255,0.2)",
              boxShadow: i < filled ? "0 0 8px rgba(255,90,31,0.6)" : "none",
              display: "inline-block",
            }}
          />
        ))}
        {total > 12 && <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>+{total - 12}</span>}
      </div>
      <span
        style={{
          fontSize: "11px",
          fontWeight: 800,
          color: remaining <= 1 ? "#FF6B6B" : "#FFA05C",
          background: remaining <= 1 ? "rgba(255, 107, 107, 0.15)" : "rgba(255, 90, 31, 0.12)",
          border: remaining <= 1 ? "1px solid rgba(255, 107, 107, 0.3)" : "1px solid rgba(255, 90, 31, 0.25)",
          padding: "2px 8px",
          borderRadius: "6px",
          letterSpacing: "0.02em",
        }}
      >
        {remaining === 0 ? "Squad Full" : `${remaining} spot${remaining > 1 ? "s" : ""} left`}
      </span>
    </div>
  );
}

interface BeaconCardProps {
  beacon: Beacon;
  onApply?: (beaconId: string) => void;
  isLateNightRadar?: boolean;
  currentUserId?: string;
  isRestrictedRole?: boolean;
  roleLabel?: string;
}

export default function BeaconCard({
  beacon,
  onApply,
  isLateNightRadar,
  currentUserId,
  isRestrictedRole = false,
  roleLabel = "",
}: BeaconCardProps) {
  const [isPending, setIsPending] = useState(false);
  const [appliedStatus, setAppliedStatus] = useState<"none" | "requested" | "error" | "withdrawn">("none");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const meta = CATEGORY_META[beacon.category] || CATEGORY_META.casual;
  const isFull = beacon.filled_slots >= beacon.total_slots;
  const isHost = currentUserId && beacon.host_id === currentUserId;

  const isNearEvent = beacon.scheduled_at
    ? new Date(beacon.scheduled_at).getTime() - Date.now() < 2 * 60 * 60 * 1000
    : false;

  const parsedMeta = parseBeaconMeta(beacon.description);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [applicantAnswer, setApplicantAnswer] = useState("");
  const [budgetAgreed, setBudgetAgreed] = useState(true);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const shortCode = beacon.id.length >= 8 ? beacon.id.slice(0, 8) : beacon.id;
  const shortUrl = typeof window !== "undefined"
    ? `${window.location.origin}/b/${shortCode}`
    : `https://solonomore.com/b/${shortCode}`;

  const handleCopyShortLink = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  const handleJoin = async () => {
    if (isRestrictedRole) {
      alert(`${roleLabel || "Restricted"} accounts cannot join member hangouts. Hangout participation is reserved for personal member accounts.`);
      return;
    }
    setAppliedSuccess(false);
    setShowApplyModal(true);
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMessage(null);
    try {
      const result = await applyToBeacon(beacon.id, {
        budgetAgreement: parsedMeta.budgetTier,
        icebreakerAnswer: applicantAnswer.trim() || undefined,
      });
      if (result.success) {
        setAppliedStatus("requested");
        setAppliedSuccess(true);
        onApply?.(beacon.id);
      } else {
        setErrorMessage(result.error);
        setAppliedStatus("error");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
      setAppliedStatus("error");
    } finally {
      setIsPending(false);
    }
  };

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    setErrorMessage(null);
    try {
      const result = await withdrawFromBeacon(beacon.id);
      if (result.success) {
        setAppliedStatus("withdrawn");
        setShowWithdrawConfirm(false);
      } else {
        setErrorMessage(result.error);
      }
    } catch {
      setErrorMessage("Network error withdrawing.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <article
      style={{
        background: "linear-gradient(160deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: "22px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backdropFilter: "blur(14px)",
        boxShadow: "0 14px 40px rgba(0, 0, 0, 0.4)",
        transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
        position: "relative",
        overflow: "hidden",
      }}
      className="hover:-translate-y-1 hover:border-[#FF5A1F]/50 hover:shadow-[0_20px_50px_rgba(255,90,31,0.18)]"
    >
      <div>
        {/* Banner image if present */}
        {beacon.image_url && (
          <div
            style={{
              margin: "-20px -20px 14px -20px",
              height: "120px",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <img
              src={beacon.image_url}
              alt={beacon.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(14,7,20,0.9) 0%, transparent 70%)",
              }}
            />
          </div>
        )}

        {/* Top Badges Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "12px" }}>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
            {(() => {
              const CategoryIcon = meta.icon;
              return (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    background: meta.bg,
                    border: `1px solid ${meta.border}`,
                    color: meta.color,
                    padding: "3px 8px",
                    borderRadius: "6px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    letterSpacing: "0.02em",
                  }}
                >
                  <CategoryIcon className="w-3 h-3 flex-shrink-0" />
                  <span>{meta.label}</span>
                </span>
              );
            })()}

            {/* Budget Pact Badge */}
            <span
              style={{
                fontSize: "10px",
                fontWeight: 800,
                background: "rgba(255, 160, 92, 0.12)",
                border: "1px solid rgba(255, 160, 92, 0.28)",
                color: "#FFA05C",
                padding: "3px 7px",
                borderRadius: "6px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Coins className="w-3 h-3 text-amber-400" />
              <span>{parsedMeta.budgetTier}</span>
            </span>

            {beacon.application_status === "approved" && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 900,
                  background: "rgba(39, 201, 63, 0.15)",
                  border: "1px solid rgba(39, 201, 63, 0.35)",
                  color: "#27C93F",
                  padding: "3px 7px",
                  borderRadius: "6px",
                  letterSpacing: "0.04em",
                }}
              >
                JOINED
              </span>
            )}

            {isHost && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 900,
                  background: "rgba(255, 90, 31, 0.2)",
                  border: "1px solid rgba(255, 90, 31, 0.45)",
                  color: "#FFA05C",
                  padding: "3px 7px",
                  borderRadius: "6px",
                  letterSpacing: "0.04em",
                }}
              >
                HOST
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                color: beacon.visibility_mode === "friend" ? "#FF8A3D" : "rgba(255,255,255,0.6)",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "2px 8px",
                borderRadius: "6px",
                letterSpacing: "0.02em",
              }}
            >
              {beacon.visibility_mode === "friend" ? "Friends" : "Open Radar"}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowShareModal(true);
              }}
              style={{
                background: "rgba(255, 111, 38, 0.12)",
                border: "1px solid rgba(255, 111, 38, 0.3)",
                borderRadius: "6px",
                padding: "2px 7px",
                color: "#FFA05C",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "10px",
                fontWeight: 800,
              }}
              className="hover:bg-[#FF6F26]/20 transition-colors"
              title="Share this hangout with friends or on socials"
            >
              <Share2 style={{ width: "11px", height: "11px" }} />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: "17px",
            fontWeight: 800,
            lineHeight: 1.35,
            color: "#FFFFFF",
            margin: "0 0 10px",
            letterSpacing: "-0.01em",
          }}
        >
          {beacon.title}
        </h3>

        {/* Location & Time info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px", color: "rgba(255,255,255,0.7)", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <MapPin className="w-3.5 h-3.5 text-[#FF8A3D] flex-shrink-0" />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {beacon.location_name}
            </span>
            {beacon.google_maps_url && (
              <a
                href={beacon.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#FFA05C",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  marginLeft: "auto",
                  textDecoration: "underline",
                }}
              >
                Map Pin ↗
              </a>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Clock className="w-3.5 h-3.5 text-white/50 flex-shrink-0" />
            <span>{formatScheduledAt(beacon.scheduled_at)}</span>
          </div>
        </div>

        {/* Host avatar & name */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
          {beacon.profiles?.avatar_icon && (beacon.profiles.avatar_icon.startsWith("http") || beacon.profiles.avatar_icon.startsWith("/")) ? (
            <img
              src={beacon.profiles.avatar_icon}
              alt={beacon.profiles.full_name || "Host"}
              style={{ width: "22px", height: "22px", borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.2)", flexShrink: 0 }}
            />
          ) : (
            <span style={{ fontSize: "15px", flexShrink: 0 }}>{beacon.profiles?.avatar_icon || "👤"}</span>
          )}
          <span>Hosted by <strong style={{ color: "#FFFFFF" }}>{beacon.profiles?.full_name || "Community Host"}</strong></span>
        </div>

        {/* Slot Progress Dots */}
        <SlotDots filled={beacon.filled_slots} total={beacon.total_slots} />
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div style={{ background: "rgba(235,57,57,0.15)", border: "1px solid rgba(235,57,57,0.3)", borderRadius: "8px", padding: "6px 10px", color: "#FF6B6B", fontSize: "11px", marginBottom: "8px" }}>
          {errorMessage}
        </div>
      )}

      {/* Action Buttons Area */}
      {onApply && (
        <div style={{ marginTop: "6px" }}>
          {isHost ? (
            /* HOST ACTION: Dedicated Squad Chat, Vetting & Edit Workspace */
            <Link
              href={`/dashboard/chats?beaconId=${beacon.id}`}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)",
                color: "#fff",
                textDecoration: "none",
                borderRadius: "12px",
                padding: "11px",
                fontSize: "13px",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                boxShadow: "0 4px 15px rgba(255, 90, 31, 0.4)",
              }}
              className="hover:scale-[1.02] active:scale-98 transition-transform"
            >
              <Users className="w-4 h-4" />
              <span>Manage Squad &amp; Chat ➔</span>
            </Link>
          ) : appliedStatus === "withdrawn" ? (
            <div style={{ padding: "10px", background: "rgba(255,255,255,0.06)", borderRadius: "10px", textAlign: "center", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
              Withdrawn from Squad
            </div>
          ) : beacon.application_status === "approved" ? (
            /* APPROVED GUEST VIEW: Link to Squad Chat + Withdraw option */
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Link
                href={`/dashboard/chats?beaconId=${beacon.id}`}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #27C93F 0%, #1FB837 100%)",
                  color: "#000",
                  textDecoration: "none",
                  borderRadius: "12px",
                  padding: "10px",
                  fontSize: "13px",
                  fontWeight: 900,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
                className="hover:scale-[1.02] transition-transform"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open Squad Hub &amp; Chat ➔</span>
              </Link>

              {!showWithdrawConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowWithdrawConfirm(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.45)",
                    fontSize: "11px",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                  className="hover:text-white"
                >
                  Withdraw from Hangout
                </button>
              ) : (
                <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", padding: "8px", textAlign: "center" }}>
                  {isNearEvent && (
                    <div style={{ fontSize: "10px", color: "#FF6B6B", marginBottom: "4px" }}>
                      ⚠️ Within 2 hours of meetup!
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => setShowWithdrawConfirm(false)}
                      style={{ flex: 1, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "6px", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}
                    >
                      Keep Spot
                    </button>
                    <button
                      type="button"
                      disabled={isWithdrawing}
                      onClick={handleWithdraw}
                      style={{ flex: 1, background: "#FF453A", border: "none", color: "#fff", padding: "6px", borderRadius: "6px", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}
                    >
                      {isWithdrawing ? "..." : "Confirm Leave"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : isRestrictedRole ? (
            /* RESTRICTED ROLES (PARTNER / ADMIN / ARTIST): VIEW ONLY */
            <button
              type="button"
              disabled
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.04)",
                color: "rgba(255, 255, 255, 0.45)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                padding: "11px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
              title={`${roleLabel || "Staff/Partner"} accounts cannot join member hangouts (View Only mode)`}
            >
              <ShieldAlert className="w-4 h-4 text-white/40" />
              <span>View Only ({roleLabel || "Partner/Staff"})</span>
            </button>
          ) : (
            /* NON-APPROVED GUEST: Join Button */
            <button
              type="button"
              onClick={handleJoin}
              disabled={
                isFull ||
                isPending ||
                appliedStatus === "requested" ||
                beacon.application_status === "pending" ||
                beacon.application_status === "declined"
              }
              style={{
                width: "100%",
                background:
                  appliedStatus === "requested" || beacon.application_status === "pending"
                    ? "rgba(39, 201, 63, 0.2)"
                    : isFull
                    ? "rgba(255,255,255,0.06)"
                    : "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)",
                color:
                  appliedStatus === "requested" || beacon.application_status === "pending"
                    ? "#27C93F"
                    : isFull
                    ? "rgba(255,255,255,0.4)"
                    : "#FFFFFF",
                border:
                  appliedStatus === "requested" || beacon.application_status === "pending"
                    ? "1px solid rgba(39, 201, 63, 0.4)"
                    : "none",
                borderRadius: "12px",
                padding: "11px",
                fontSize: "13px",
                fontWeight: 800,
                cursor: isFull ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                boxShadow: isFull ? "none" : "0 4px 15px rgba(255, 90, 31, 0.35)",
              }}
              className={isFull ? "" : "hover:scale-[1.02] active:scale-98"}
            >
              {isPending ? (
                <span>Requesting...</span>
              ) : appliedStatus === "requested" || beacon.application_status === "pending" ? (
                <span>✓ Request Sent</span>
              ) : beacon.application_status === "declined" ? (
                <span>✕ Declined</span>
              ) : isFull ? (
                <span>Squad Full</span>
              ) : (
                <>
                  <span>Request to Join</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white/80" />
                </>
              )}
            </button>
          )}

          {isMounted && isChatOpen && typeof document !== "undefined" && createPortal(
            <SquadChatModal
              beaconId={beacon.id}
              beaconTitle={beacon.title}
              onClose={() => setIsChatOpen(false)}
            />,
            document.body
          )}

          {/* Interactive Squad Apply Modal Popup (Portal to document.body to avoid parent card clipping) */}
          {isMounted && showApplyModal && typeof document !== "undefined" && createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowApplyModal(false);
                  setAppliedSuccess(false);
                }
              }}
            >
              <div
                className="w-full max-w-[440px] rounded-3xl border border-white/15 p-6 space-y-4 shadow-[0_24px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(255,90,31,0.25)] text-left relative z-10 animate-scaleIn"
                style={{
                  background: "linear-gradient(165deg, #180D24 0%, #0B0612 100%)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-9 h-9 rounded-xl bg-[#FF6F26]/20 border border-[#FF6F26]/35 flex items-center justify-center text-base shrink-0">
                      🔥
                    </span>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#FFA05C] block">
                        Join Squad Hangout
                      </span>
                      <h3 className="text-sm font-bold text-white truncate max-w-[280px]">
                        {beacon.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 pt-0.5">
                        {beacon.profiles?.avatar_icon && (beacon.profiles.avatar_icon.startsWith("http") || beacon.profiles.avatar_icon.startsWith("/")) ? (
                          <img
                            src={beacon.profiles.avatar_icon}
                            alt={beacon.profiles.full_name || "Host"}
                            className="w-3.5 h-3.5 rounded-full object-cover border border-white/20 shrink-0"
                          />
                        ) : (
                          <span>{beacon.profiles?.avatar_icon || "👤"}</span>
                        )}
                        <span>Host: <strong className="text-zinc-200">{beacon.profiles?.full_name || "Verified Host"}</strong></span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowApplyModal(false);
                      setAppliedSuccess(false);
                    }}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                {appliedSuccess ? (
                  <div className="space-y-4 py-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">
                      ✓
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-white">Join Request Sent!</h4>
                      <p className="text-xs text-zinc-300">
                        The host will review your request. Want your friends to join the same squad with you?
                      </p>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 text-left">
                      <input
                        type="text"
                        readOnly
                        value={shortUrl}
                        className="flex-1 bg-transparent px-2.5 text-xs text-zinc-300 font-mono outline-none truncate"
                      />
                      <button
                        type="button"
                        onClick={handleCopyShortLink}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#FF6F26] hover:bg-[#FF5A1F] text-white flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                      >
                        {copiedLink ? "✓ Copied!" : "Copy Link"}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowApplyModal(false);
                          setAppliedSuccess(false);
                          setShowShareModal(true);
                        }}
                        className="flex-1 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-[#FFA05C] border border-white/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5 text-[#FF6F26]" />
                        <span>Share With Friends</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowApplyModal(false);
                          setAppliedSuccess(false);
                        }}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleJoinSubmit} className="space-y-4">
                    {errorMessage && (
                      <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 space-y-1.5">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <span>{errorMessage}</span>
                        </div>
                        {errorMessage.includes("PROFILE_INCOMPLETE") && (
                          <Link
                            href="/dashboard/profile/edit?notice=beacon_required"
                            className="inline-flex items-center gap-1 font-bold text-[#FFA05C] hover:underline text-[11px] pt-1"
                          >
                            <span>Complete Your Safety Profile Now →</span>
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Meetup Budget Pact Box */}
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span>Meetup Budget Pact</span>
                      </div>
                      <p className="text-[11.5px] text-zinc-300 font-medium">
                        {parsedMeta.budgetTier}
                      </p>
                      <label className="flex items-center gap-2 text-[11px] text-zinc-300 cursor-pointer pt-1 border-t border-amber-500/15">
                        <input
                          type="checkbox"
                          checked={budgetAgreed}
                          onChange={(e) => setBudgetAgreed(e.target.checked)}
                          required
                          className="rounded accent-[#FF6F26] cursor-pointer"
                        />
                        <span>I confirm I am comfortable with this expense pact.</span>
                      </label>
                    </div>

                    {/* Host's Custom Icebreaker Question (Enhanced Highlight Card) */}
                    {parsedMeta.customQuestion && (
                      <div className="p-3.5 rounded-2xl bg-[#FF6F26]/[0.08] border border-[#FF6F26]/30 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                          <HelpCircle className="w-4 h-4 text-[#FF6F26]" />
                          <span>Host&apos;s Icebreaker Question</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/40 border border-[#FF6F26]/20 text-xs font-semibold text-[#FFA05C] leading-snug">
                          &ldquo;{parsedMeta.customQuestion}&rdquo;
                        </div>
                        <textarea
                          value={applicantAnswer}
                          onChange={(e) => setApplicantAnswer(e.target.value)}
                          placeholder="Type your brief answer for the host..."
                          rows={2}
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6F26] transition-colors resize-none"
                        />
                      </div>
                    )}

                    {/* Info Notice */}
                    <p className="text-[10px] text-zinc-400 leading-normal">
                      Your profile and verification status will be shared with the host. If approved, you unlock the private squad chat hub!
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setShowApplyModal(false)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-white/5 cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isPending || !budgetAgreed}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white hover:brightness-110 shadow-[0_0_15px_rgba(255,111,38,0.3)] transition-all disabled:opacity-40 cursor-pointer"
                      >
                        {isPending ? "Sending..." : "Submit Join Request ➔"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>,
            document.body
          )}
        </div>
      )}

      {/* Universal Share Modal */}
      <UniversalShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={beacon.title}
        shareUrl={shortUrl}
        shareText={`Join my squad hangout "${beacon.title}" on Solo-No-More!`}
        type="beacon"
      />
    </article>
  );
}
