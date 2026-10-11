"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { claimTicket, submitEventTicketPaymentAction, buyTicketDevInstantAction } from "@/app/actions/events";
import type { OfficialEvent } from "@/lib/supabase/types";

interface EventsBoardClientProps {
  events: OfficialEvent[];
  currentTier: "none" | "member" | "family" | "admin";
  claimedEventIds: string[];
}

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-PK", {
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

  // Modal State for Purchasing Event Tickets via Raast / Bank
  const [activeEventForPayment, setActiveEventForPayment] = useState<OfficialEvent | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"raast" | "sadapay" | "bank_transfer">("raast");
  const [transactionRef, setTransactionRef] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);

  const router = useRouter();
  const isFamily = currentTier === "family" || currentTier === "admin";

  // Claim free VIP pass for Family Tier
  const handleClaimVip = async (eventId: string, eventTitle: string) => {
    setLoadingEventId(eventId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await claimTicket(eventId);
      if (res.success) {
        setClaimedIds((prev) => [...prev, eventId]);
        setSuccessMsg(`VIP Ticket for "${eventTitle}" confirmed! It is active in your profile.`);
        router.refresh();
      } else {
        setErrorMsg(res.error);
      }
    } catch {
      setErrorMsg("Failed to book VIP pass due to network issues.");
    } finally {
      setLoadingEventId(null);
    }
  };

  // Open Raast / Bank modal for paid tickets
  const handleOpenBuyModal = (event: OfficialEvent) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setTransactionRef("");
    setModalSuccess(false);
    setActiveEventForPayment(event);
  };

  // Submit payment proof for event ticket
  const handleTicketPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEventForPayment || !transactionRef.trim()) return;

    setSubmittingPayment(true);
    setErrorMsg(null);

    try {
      const res = await submitEventTicketPaymentAction({
        eventId: activeEventForPayment.id,
        amountPkr: Number(activeEventForPayment.price),
        paymentMethod,
        transactionRef: transactionRef.trim(),
      });

      if (res.success) {
        setModalSuccess(true);
        setSuccessMsg(
          `Payment proof received for "${activeEventForPayment.title}"! TID: ${transactionRef.trim()} submitted for verification.`
        );
        setTimeout(() => {
          setActiveEventForPayment(null);
          router.refresh();
        }, 2200);
      } else {
        setErrorMsg(res.error);
      }
    } catch {
      setErrorMsg("Network error submitting ticket payment.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Developer instant buy for testing
  const handleDevInstantTicket = async (eventId: string) => {
    setSubmittingPayment(true);
    try {
      const res = await buyTicketDevInstantAction(eventId);
      if (res.success) {
        setClaimedIds((prev) => [...prev, eventId]);
        setSuccessMsg("[DEV SIMULATOR] Ticket pass booked instantly!");
        setActiveEventForPayment(null);
        router.refresh();
      }
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      {/* ── Header Bevel Panel ──────────────────────────────────────────────── */}
      <div className="nokia-panel-sunken" style={{ padding: "16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <span className="nokia-badge nokia-badge-warning" style={{ fontSize: "7px", marginBottom: "4px" }}>
              ★ VERIFIED ARTISTS & PARTNERS
            </span>
            <h1 className="font-pixel text-accent" style={{ fontSize: "14px", margin: "4px 0 0 0", letterSpacing: "0.08em" }}>
              ▣ OFFICIAL EVENTS & RAVES
            </h1>
            <p className="font-mono text-muted" style={{ fontSize: "11px", margin: "4px 0 0 0" }}>
              Curated club nights, touring DJ sessions, and partner tournaments across Karachi.
            </p>
          </div>
          {!isFamily && (
            <Link href="/dashboard/upgrade" className="nokia-btn font-pixel" style={{ fontSize: "7px", padding: "6px 12px" }}>
              ★ UPGRADE TO FAMILY FOR FREE VIP PASSES
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
          <span className="font-pixel text-success" style={{ fontSize: "9px" }}>[✓ STATUS]</span>
          <span className="font-mono text-success" style={{ fontSize: "11px" }}>{successMsg}</span>
        </div>
      )}

      {/* Wide Event Cards List */}
      {events.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {events.map((event) => {
            const hasTicket = claimedIds.includes(event.id);
            const isArtistSplit = event.event_type === "artist_split";
            const pricePkr = Number(event.price) || 0;

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
                      ● {isArtistSplit ? "TOURING DJ / ARTIST SESSION" : "SOLO-NO-MORE EXCLUSIVE"}
                    </span>
                    {hasTicket && (
                      <span className="nokia-badge nokia-badge-success">✓ DIGITAL TICKET ACTIVE</span>
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
                      🎟 {isFamily && isArtistSplit ? "FREE VIP PASS (FAMILY PERK)" : pricePkr > 0 ? `PKR ${pricePkr.toLocaleString()}` : "FREE ENTRY"}
                    </span>
                  </div>
                </div>

                {/* Right Action Checkout Block */}
                <div
                  className="nokia-panel-sunken event-checkout-block"
                  style={{
                    padding: "12px",
                    width: "100%",
                    maxWidth: "260px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {hasTicket ? (
                    <div className="font-pixel text-success" style={{ textAlign: "center", fontSize: "9px" }}>
                      🎟 TICKET BOOKED ✓
                    </div>
                  ) : isFamily && (pricePkr === 0 || isArtistSplit) ? (
                    /* Family VIP Complimentary Claim */
                    <button
                      onClick={() => handleClaimVip(event.id, event.title)}
                      disabled={loadingEventId !== null}
                      className="nokia-btn nokia-btn-primary font-pixel"
                      style={{ width: "100%", fontSize: "8px", padding: "10px" }}
                    >
                      {loadingEventId === event.id ? "CLAIMING..." : "★ CLAIM VIP PASS"}
                    </button>
                  ) : (
                    /* Purchase Ticket flow via Raast / Bank */
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                      <button
                        onClick={() => handleOpenBuyModal(event)}
                        disabled={loadingEventId !== null}
                        className="nokia-btn nokia-btn-primary font-pixel"
                        style={{ width: "100%", fontSize: "8px", padding: "10px" }}
                      >
                        BOOK PASS — {pricePkr > 0 ? `PKR ${pricePkr.toLocaleString()}` : "FREE"}
                      </button>
                      {!isFamily && (
                        <Link
                          href="/dashboard/upgrade"
                          className="font-pixel text-warning"
                          style={{ fontSize: "6px", textAlign: "center", textDecoration: "underline" }}
                        >
                          FREE FOR FAMILY VIP — UPGRADE
                        </Link>
                      )}
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

      {/* ── EVENT TICKET PAYMENT MODAL (RAAST / SADAPAY / BANK TRANSFER) ──── */}
      {activeEventForPayment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="nokia-panel relative w-full max-w-lg font-mono page-swipe"
            style={{ maxHeight: "90vh", overflowY: "auto", padding: 0 }}
          >
            {/* Modal Title Bar */}
            <div
              style={{
                background: "var(--accent-primary)",
                color: "#fff",
                padding: "10px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="font-pixel" style={{ fontSize: "9px" }}>
                ◈ BOOK EVENT TICKET (RAAST / SADAPAY / BANK)
              </span>
              <button
                onClick={() => setActiveEventForPayment(null)}
                style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontWeight: "bold" }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              {modalSuccess ? (
                <div className="text-center" style={{ padding: "24px 0" }}>
                  <div className="nokia-lcd" style={{ fontSize: "20px", color: "var(--accent-success)", marginBottom: "12px" }}>
                    PROOF SUBMITTED ✓
                  </div>
                  <h3 className="font-pixel text-success" style={{ fontSize: "11px" }}>
                    TICKET VERIFICATION QUEUED
                  </h3>
                  <p className="font-mono text-muted" style={{ fontSize: "11px", marginTop: "8px" }}>
                    Your Transaction ID has been recorded. Admin will verify and activate your pass shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleTicketPaymentSubmit}>
                  {/* Event & Amount notice */}
                  <div className="nokia-panel-sunken" style={{ padding: "12px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span className="font-pixel text-accent" style={{ fontSize: "9px", display: "block" }}>
                          {activeEventForPayment.title.toUpperCase()}
                        </span>
                        <span className="font-mono text-muted" style={{ fontSize: "10px" }}>
                          Venue: {activeEventForPayment.venue_name || "Karachi"}
                        </span>
                      </div>
                      <span className="font-lcd text-accent" style={{ fontSize: "22px" }}>
                        PKR {Number(activeEventForPayment.price).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Payment method selector */}
                  <label className="font-pixel" style={{ fontSize: "7px", display: "block", marginBottom: "8px" }}>
                    SELECT PAYMENT METHOD
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: "16px" }}>
                    {[
                      { id: "raast", label: "⚡ RAAST" },
                      { id: "sadapay", label: "📲 SADAPAY" },
                      { id: "bank_transfer", label: "🏦 BANK IBFT" }
                    ].map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`nokia-btn font-pixel ${paymentMethod === m.id ? "nokia-btn-primary" : ""}`}
                        style={{ fontSize: "7px", padding: "8px 4px" }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {/* Account instructions box */}
                  <div className="nokia-panel-sunken" style={{ padding: "12px", marginBottom: "16px" }}>
                    {paymentMethod === "raast" && (
                      <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
                        <div style={{ color: "var(--accent-success)", fontWeight: "bold" }}>RAAST ID (Instant & Free):</div>
                        <div className="font-lcd text-accent" style={{ fontSize: "18px", letterSpacing: "1px" }}>
                          0300-SOLONOMORE
                        </div>
                        <div className="text-muted" style={{ fontSize: "10px" }}>
                          Account Title: Solo-No-More / Abdul Raffay
                        </div>
                      </div>
                    )}

                    {paymentMethod === "sadapay" && (
                      <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
                        <div style={{ color: "var(--accent-warning)", fontWeight: "bold" }}>SADAPAY / NAYAPAY WALLET:</div>
                        <div className="font-lcd text-warning" style={{ fontSize: "18px" }}>
                          0300-1234567
                        </div>
                        <div className="text-muted" style={{ fontSize: "10px" }}>
                          Account Title: Solo-No-More / Abdul Raffay
                        </div>
                      </div>
                    )}

                    {paymentMethod === "bank_transfer" && (
                      <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
                        <div style={{ color: "var(--accent-primary)", fontWeight: "bold" }}>MEEZAN BANK IBFT:</div>
                        <div>Account Title: <span className="text-accent font-bold">Abdul Raffay</span></div>
                        <div className="font-mono text-muted" style={{ fontSize: "10px" }}>IBAN: PK00MEZN0001020304050607</div>
                      </div>
                    )}
                  </div>

                  {/* Transaction Ref input */}
                  <div style={{ marginBottom: "16px" }}>
                    <label className="font-pixel" style={{ fontSize: "7px", display: "block", marginBottom: "6px" }}>
                      TRANSACTION REFERENCE / TID (From Banking App) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9840210294 or STAN/RRN"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="nokia-input"
                      style={{ width: "100%", fontSize: "11px" }}
                    />
                    <span className="font-mono text-muted" style={{ fontSize: "9px", display: "block", marginTop: "4px" }}>
                      Enter the Transaction ID shown on your banking or SadaPay receipt after sending PKR {Number(activeEventForPayment.price).toLocaleString()}.
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
                    <button
                      type="submit"
                      disabled={submittingPayment || !transactionRef.trim()}
                      className="nokia-btn nokia-btn-primary font-pixel"
                      style={{ width: "100%", padding: "12px", fontSize: "9px" }}
                    >
                      {submittingPayment ? "SUBMITTING PROOF..." : "SUBMIT TICKET PAYMENT PROOF"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDevInstantTicket(activeEventForPayment.id)}
                      className="nokia-btn font-pixel"
                      style={{ width: "100%", fontSize: "7px", opacity: 0.7 }}
                    >
                      ⚡ [DEV TEST: SIMULATE INSTANT TICKET CONFIRMATION]
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
