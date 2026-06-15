"use client";

import { useState } from "react";
import type { Beacon, BeaconCategory } from "@/lib/supabase/types";
import { applyToBeacon, withdrawFromBeacon } from "@/app/actions/applications";
import SquadChatModal from "@/components/SquadChatModal";

// ── Category meta ─────────────────────────────────────────────────────────────
const CATEGORY_META: Record<BeaconCategory, { label: string; icon: string; accentVar: string }> = {
  sports:    { label: "SPORTS",    icon: "◉", accentVar: "var(--accent-success)" },
  casual:    { label: "CASUAL",    icon: "★", accentVar: "var(--accent-warning)" },
  nightlife: { label: "NIGHTLIFE", icon: "♦", accentVar: "var(--accent-primary)" },
};

function formatScheduledAt(iso: string | null): string {
  if (!iso) return "TIME TBD";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  }).toUpperCase();
}

function SlotDots({ filled, total }: { filled: number; total: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}
      aria-label={`${filled} of ${total} slots filled`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="font-lcd"
          style={{
            fontSize: "16px",
            lineHeight: 1,
            color: i < filled ? "var(--accent-primary)" : "var(--border-mid)",
          }}
        >
          {i < filled ? "●" : "○"}
        </span>
      ))}
      <span className="font-pixel" style={{ marginLeft: "4px", fontSize: "7px", color: "var(--text-muted)" }}>
        {total - filled} LEFT
      </span>
    </div>
  );
}

interface BeaconCardProps {
  beacon: Beacon;
  onApply?: (beaconId: string) => void;
  isLateNightRadar?: boolean;
  currentUserId?: string;
}

export default function BeaconCard({ beacon, onApply, isLateNightRadar, currentUserId }: BeaconCardProps) {
  const [isPending, setIsPending] = useState(false);
  const [appliedStatus, setAppliedStatus] = useState<"none" | "requested" | "error" | "withdrawn">("none");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const meta = CATEGORY_META[beacon.category];
  const isFull = beacon.filled_slots >= beacon.total_slots;

  // Check if event is within 2 hours (warn before withdraw)
  const isNearEvent = beacon.scheduled_at
    ? new Date(beacon.scheduled_at).getTime() - Date.now() < 2 * 60 * 60 * 1000
    : false;

  const handleJoin = async () => {
    setIsPending(true);
    setErrorMessage(null);
    try {
      const result = await applyToBeacon(beacon.id);
      if (result.success) {
        setAppliedStatus("requested");
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
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Late-Night Radar uses amber accent
  const accent = isLateNightRadar ? "var(--accent-warning)" : meta.accentVar;

  return (
    <article
      className={beacon.is_partner_offer ? "nokia-panel partner-offer-card" : "nokia-panel"}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "14px",
        borderColor: isLateNightRadar ? "var(--accent-warning)" : undefined,
        transform: isHovered ? "translateY(-4px)" : "none",
        boxShadow: isHovered
          ? "inset 2px 2px 0 var(--bevel-light), inset -2px -2px 0 var(--bevel-dark), 4px 6px 0 var(--bevel-darkest)"
          : undefined,
        transition: "transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), border-color 0.15s ease",
      }}
    >
      {/* Banner Image */}
      {beacon.image_url && (
        <div style={{
          margin: "-14px -14px 4px -14px",
          height: "90px",
          overflow: "hidden",
          borderBottom: "2px solid var(--border-strong)",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={beacon.image_url}
            alt="Promo Banner"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "grayscale(1) contrast(1.3) brightness(0.9)",
            }}
          />
        </div>
      )}

      {/* Top row — category badge + visibility */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          <span
            className="nokia-badge"
            style={{
              background: accent,
              color: "var(--text-inverse)",
              borderColor: "var(--border-strong)",
              fontSize: "7px",
            }}
          >
            {meta.icon} {meta.label}
          </span>
          {beacon.application_status === "approved" && (
            <span
              className="nokia-badge"
              style={{
                fontSize: "7px",
                background: "var(--accent-success)",
                color: "white",
              }}
            >
              ✓ JOINED
            </span>
          )}
          {currentUserId && beacon.host_id === currentUserId && (
            <span
              className="nokia-badge"
              style={{
                fontSize: "7px",
                background: "var(--accent-primary)",
                color: "white",
              }}
            >
              ★ HOST
            </span>
          )}
        </div>
        <span
          className="nokia-badge"
          style={{
            fontSize: "7px",
            background: beacon.visibility_mode === "friend" ? "var(--accent-primary)" : "var(--bg-sunken)",
            color: beacon.visibility_mode === "friend" ? "white" : "var(--text-muted)",
          }}
        >
          {beacon.visibility_mode === "friend" ? "♥ FRIENDS" : "◈ OPEN"}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-mono" style={{ fontSize: "12px", fontWeight: "bold", lineHeight: "1.4", color: "var(--text-primary)", letterSpacing: "0.02em" }}>
        {beacon.title.toUpperCase()}
      </h3>

      {/* Host details with customizable glowing CRT avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", margin: "-4px 0 2px 0" }}>
        <span
          className="phosphor"
          style={{
            fontSize: "14px",
            lineHeight: 1,
            textShadow: "0 0 6px var(--accent-primary)",
            display: "inline-block",
          }}
        >
          {beacon.profiles?.avatar_icon || "👾"}
        </span>
        <span style={{ fontSize: "9px", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.04em" }}>
          BY {beacon.profiles?.full_name?.toUpperCase() || "ANONYMOUS"}
        </span>
      </div>

      {/* LCD meta row */}
      <div className="nokia-panel-sunken" style={{ padding: "6px 10px" }}>
        <div className="font-lcd" style={{ fontSize: "14px", color: accent, letterSpacing: "0.06em", lineHeight: "1.3" }}>
          {formatScheduledAt(beacon.scheduled_at)}
        </div>
        {beacon.location_name && (
          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
            ▸ {beacon.location_name}
          </div>
        )}
      </div>

      {/* Slot dots */}
      <SlotDots filled={beacon.filled_slots} total={beacon.total_slots} />

      {/* Error */}
      {errorMessage && (
        <div className="nokia-panel-sunken" style={{ padding: "6px 10px", borderColor: "var(--accent-danger)" }}>
          <span className="font-pixel" style={{ fontSize: "7px", color: "var(--accent-danger)" }}>
            ✕ {errorMessage}
          </span>
        </div>
      )}

      {/* Apply / Chat / Withdraw button area */}
      {onApply && (
        <>
          {currentUserId && beacon.host_id === currentUserId ? (
            // HOST VIEW
            <button
              onClick={() => setIsChatOpen(true)}
              className="nokia-btn nokia-btn-primary"
              style={{ marginTop: "auto", width: "100%", fontSize: "8px" }}
            >
              💬 SQUAD CHAT (HOST)
            </button>
          ) : appliedStatus === "withdrawn" ? (
            // WITHDRAWN STATE
            <div className="nokia-panel-sunken" style={{ padding: "8px", textAlign: "center" }}>
              <span className="font-pixel" style={{ fontSize: "7px", color: "var(--text-muted)" }}>⊠ WITHDRAWN FROM SQUAD</span>
            </div>
          ) : beacon.application_status === "approved" ? (
            // APPROVED GUEST VIEW — Chat + Withdraw
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "auto" }}>
              <button
                onClick={() => setIsChatOpen(true)}
                className="nokia-btn nokia-btn-primary"
                style={{ width: "100%", fontSize: "8px", background: "var(--accent-success)", color: "white" }}
              >
                💬 SQUAD CHAT
              </button>

              {/* Withdraw flow */}
              {!showWithdrawConfirm ? (
                <button
                  onClick={() => setShowWithdrawConfirm(true)}
                  className="nokia-btn"
                  style={{ width: "100%", fontSize: "7px", opacity: 0.7 }}
                >
                  ⊠ WITHDRAW FROM SQUAD
                </button>
              ) : (
                <div className="nokia-panel-sunken" style={{ padding: "8px" }}>
                  {isNearEvent && (
                    <div style={{ marginBottom: "6px" }}>
                      <span className="font-pixel" style={{ fontSize: "6px", color: "var(--accent-danger)" }}>
                        ⚠ EVENT IS WITHIN 2H — WITHDRAWING NOW WILL NOTIFY THE HOST!
                      </span>
                    </div>
                  )}
                  <div className="font-pixel" style={{ fontSize: "6px", marginBottom: "8px", color: "var(--text-muted)" }}>
                    CONFIRM WITHDRAW?
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => setShowWithdrawConfirm(false)}
                      className="nokia-btn"
                      style={{ flex: 1, fontSize: "7px" }}
                    >
                      ✕ CANCEL
                    </button>
                    <button
                      onClick={handleWithdraw}
                      disabled={isWithdrawing}
                      className="nokia-btn nokia-btn-danger"
                      style={{ flex: 1, fontSize: "7px" }}
                    >
                      {isWithdrawing ? "..." : "⊠ CONFIRM"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // NON-APPROVED GUEST — Apply button
            <button
              onClick={handleJoin}
              disabled={
                isFull ||
                isPending ||
                appliedStatus === "requested" ||
                beacon.application_status === "pending" ||
                beacon.application_status === "declined"
              }
              className={
                appliedStatus === "requested" || beacon.application_status === "pending"
                  ? "nokia-btn"
                  : beacon.application_status === "declined"
                  ? "nokia-btn"
                  : isFull
                  ? "nokia-btn"
                  : "nokia-btn nokia-btn-primary"
              }
              style={{
                marginTop: "auto",
                width: "100%",
                fontSize: "8px",
                opacity: isFull ? 0.5 : 1,
                background:
                  appliedStatus === "requested" || beacon.application_status === "pending"
                    ? "var(--accent-success)"
                    : undefined,
                color:
                  appliedStatus === "requested" || beacon.application_status === "pending"
                    ? "white"
                    : undefined,
              }}
            >
              {isPending ? (
                <span className="pixel-blink">▌ SENDING...</span>
              ) : appliedStatus === "requested" || beacon.application_status === "pending" ? (
                "✓ REQUESTED"
              ) : beacon.application_status === "declined" ? (
                "✕ DECLINED"
              ) : isFull ? (
                "■ FULL"
              ) : (
                "► REQUEST TO JOIN"
              )}
            </button>
          )}

          {isChatOpen && (
            <SquadChatModal
              beaconId={beacon.id}
              beaconTitle={beacon.title}
              onClose={() => setIsChatOpen(false)}
            />
          )}
        </>
      )}
    </article>
  );
}
