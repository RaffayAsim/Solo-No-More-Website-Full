"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { claimTicket } from "@/app/actions/events";
import type { OfficialEvent } from "@/lib/supabase/types";

interface EventsBoardClientProps {
  events: OfficialEvent[];
  currentTier: "none" | "member" | "family";
  claimedEventIds: string[];
}

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function EventsBoardClient({
  events,
  currentTier,
  claimedEventIds: initialClaimedIds,
}: EventsBoardClientProps) {
  const [claimedIds, setClaimedIds] = useState<string[]>(initialClaimedIds);
  const [loadingEventId, setLoadingEventId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const router = useRouter();
  const isFamily = currentTier === "family";

  const handleClaim = async (eventId: string) => {
    setLoadingEventId(eventId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await claimTicket(eventId);
      if (res.success) {
        setClaimedIds((prev) => [...prev, eventId]);
        setSuccessMsg("VIP Ticket successfully booked! Your digital ticket is active in your profile.");
        router.refresh();
      } else {
        setErrorMsg(res.error);
      }
    } catch {
      setErrorMsg("Failed to book ticket due to network connection issues.");
    } finally {
      setLoadingEventId(null);
    }
  };

  const handleSimulateBuy = (eventId: string, price: number) => {
    setErrorMsg(null);
    setSuccessMsg(`Simulated Ticket Purchase for $${price.toFixed(2)} completed successfully!`);
    setClaimedIds((prev) => [...prev, eventId]);
  };

  return (
    <div style={{ padding: "16px" }}>
      {/* ── Header Bevel Panel ──────────────────────────────────────────────── */}
      <div className="nokia-panel-sunken" style={{ padding: "16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <span className="nokia-badge nokia-badge-warning" style={{ fontSize: "7px", marginBottom: "4px" }}>
              ★ VERIFIED PARTNERS
            </span>
            <h1 className="font-pixel text-accent" style={{ fontSize: "14px", margin: "4px 0 0 0", letterSpacing: "0.08em" }}>
              ▣ OFFICIAL EVENTS
            </h1>
            <p className="font-mono text-muted" style={{ fontSize: "11px", margin: "4px 0 0 0" }}>
              Access large-scale club bookings, touring DJs, and exclusive partner tournaments.
            </p>
          </div>
          {!isFamily && (
            <Link href="/dashboard/upgrade" className="nokia-btn font-pixel" style={{ fontSize: "7px", padding: "6px 12px" }}>
              ★ UPGRADE TO FAMILY FOR FREE VIP
            </Link>
          )}
        </div>
      </div>

      {/* Dynamic visual alerts */}
      {errorMsg && (
        <div className="nokia-panel-raised" style={{ borderColor: "var(--accent-danger)", padding: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="font-pixel text-danger" style={{ fontSize: "9px" }}>[✕ ERROR]</span>
          <span className="font-mono text-danger" style={{ fontSize: "11px" }}>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="nokia-panel-raised" style={{ borderColor: "var(--accent-success)", padding: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="font-pixel text-success" style={{ fontSize: "9px" }}>[✓ SUCCESS]</span>
          <span className="font-mono text-success" style={{ fontSize: "11px" }}>{successMsg}</span>
        </div>
      )}

      {/* Wide Event Cards List */}
      {events.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {events.map((event) => {
            const hasTicket = claimedIds.includes(event.id);
            const isArtistSplit = event.event_type === "artist_split";

            return (
              <article
                key={event.id}
                className="nokia-panel event-card"
                style={{
                  border: hasTicket ? "2px solid var(--accent-success)" : undefined,
                }}
              >
                {/* Left content block */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <span className={`nokia-badge ${isArtistSplit ? "nokia-badge-primary" : "nokia-badge-warning"}`}>
                      ● {isArtistSplit ? "TOURING DJ SESSION" : "SOLO-NO-MORE EXCLUSIVE"}
                    </span>
                    {hasTicket && (
                      <span className="nokia-badge nokia-badge-success">✓ TICKET RESERVED</span>
                    )}
                  </div>

                  <h3 className="font-pixel text-accent" style={{ fontSize: "11px", margin: 0, textTransform: "uppercase" }}>
                    {event.title}
                  </h3>

                  {event.description && (
                    <p className="font-mono text-muted" style={{ fontSize: "11px", margin: "4px 0 0 0", lineHeight: "1.4" }}>
                      {event.description}
                    </p>
                  )}

                  {/* Metadata specs */}
                  <div className="font-mono text-muted" style={{ fontSize: "11px", marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "16px" }}>
                    <span>🕐 {formatEventDate(event.scheduled_at)}</span>
                    {event.venue_name && <span>📍 {event.venue_name}</span>}
                    <span className="font-pixel text-accent" style={{ fontSize: "8px" }}>
                      🎟 {isFamily && isArtistSplit ? "COMPLIMENTARY VIP" : `$${Number(event.price).toFixed(2)}`}
                    </span>
                  </div>
                </div>

                {/* Right Action Checkout Block */}
                <div
                  className="nokia-panel-sunken event-checkout-block"
                  style={{
                    padding: "12px",
                    width: "100%",
                    maxWidth: "240px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {hasTicket ? (
                    <div className="font-pixel text-success" style={{ textAlign: "center", fontSize: "9px" }}>
                      🎟 BOOKED ✓
                    </div>
                  ) : isFamily ? (
                    /* Family VIP Claim Trigger */
                    <button
                      onClick={() => handleClaim(event.id)}
                      disabled={loadingEventId !== null}
                      className="nokia-btn nokia-btn-primary"
                      style={{ width: "100%" }}
                    >
                      {loadingEventId === event.id ? "BOOKING..." : "★ CLAIM FREE VIP"}
                    </button>
                  ) : (
                    /* Purchase Ticket flow */
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                      <button
                        onClick={() => handleSimulateBuy(event.id, Number(event.price))}
                        disabled={loadingEventId !== null}
                        className="nokia-btn"
                        style={{ width: "100%" }}
                      >
                        BUY PASS - ${Number(event.price).toFixed(2)}
                      </button>
                      <Link
                        href="/dashboard/upgrade"
                        className="font-pixel text-warning"
                        style={{ fontSize: "6px", textAlign: "center", textDecoration: "underline" }}
                      >
                        FREE FOR FAMILY - UPGRADE
                      </Link>
                    </div>
                  )}
                </div>

              </article>
            );
          })}
        </div>
      ) : (
        /* Empty events feed state */
        <div className="nokia-panel" style={{ padding: "32px", textAlign: "center" }}>
          <div className="nokia-lcd" style={{ fontSize: "20px", marginBottom: "16px" }}>
            NO EVENTS
          </div>
          <p className="font-mono text-muted" style={{ fontSize: "11px", maxWidth: "400px", marginInline: "auto" }}>
            Our team is currently syncing up with venue partners. New rave and DJ bookings will be posted here soon.
          </p>
        </div>
      )}
    </div>
  );
}
