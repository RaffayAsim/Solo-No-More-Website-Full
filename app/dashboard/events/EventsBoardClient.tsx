"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { claimTicket, submitEventTicketPaymentAction, buyTicketDevInstantAction } from "@/app/actions/events";
import type { OfficialEvent } from "@/lib/supabase/types";
import {
  Calendar,
  MapPin,
  Ticket,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Zap,
  Building2,
  Clock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  QrCode
} from "lucide-react";
import { isEventConcluded } from "@/lib/event-metadata";

interface EventsBoardClientProps {
  events: OfficialEvent[];
  currentTier: "none" | "member" | "family" | "admin";
  claimedEventIds: string[];
  isRestrictedRole?: boolean;
  roleLabel?: string;
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
  isRestrictedRole = false,
  roleLabel = "",
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
    if (isRestrictedRole) {
      setErrorMsg(`${roleLabel || "Restricted"} accounts cannot claim attendee passes. Attendance is reserved for member accounts.`);
      return;
    }
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
    if (isRestrictedRole) {
      setErrorMsg(`${roleLabel || "Restricted"} accounts cannot purchase attendee tickets. Attendance is reserved for member accounts.`);
      return;
    }
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
    <div className="p-3 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-4 sm:space-y-6">
      {/* ── Modern Header Panel ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-4 sm:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#FF6F26]/15 via-transparent to-transparent blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#FF6F26]/10 text-[#FF6F26] border border-[#FF6F26]/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>VERIFIED ARTISTS & PARTNERS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Official Events &amp; Raves
            </h1>
            <p className="text-sm text-neutral-400 max-w-xl">
              Curated club nights, touring DJ sessions, and partner tournaments across cities nationwide.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/artist"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/10 transition-all hover:scale-[1.02]"
            >
              <Ticket className="w-4 h-4 text-[#FF6F26]" />
              <span>Artist Portal</span>
            </Link>
            <Link
              href="/dashboard/upgrade"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-lg shadow-[#FF6F26]/20 hover:brightness-110 transition-all hover:scale-[1.02]"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Membership Hub</span>
            </Link>
          </div>
        </div>
      </div>

      {/* View-Only Mode Banner for Restricted Roles */}
      {isRestrictedRole && (
        <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl bg-[#FF6F26]/10 border border-[#FF6F26]/30 text-white">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#FF6F26] flex-shrink-0" />
            <span className="text-xs text-neutral-200">
              <strong className="text-[#FFA05C]">{roleLabel} View-Only Mode:</strong> You are browsing the events feed as a verified {roleLabel.toLowerCase()}. Ticket purchasing and pass claims are reserved for personal member accounts.
            </span>
          </div>
          <Link
            href={roleLabel === "Partner" ? "/dashboard/partner" : roleLabel === "Admin" ? "/admin" : "/dashboard/artist"}
            className="text-xs font-bold text-[#FF8A3D] hover:underline"
          >
            Manage in {roleLabel} Hub ➔
          </Link>
        </div>
      )}

      {/* Dynamic Visual Alerts */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Events Cards List */}
      {events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event) => {
            const hasTicket = claimedIds.includes(event.id);
            const isArtistSplit = event.event_type === "artist_split";
            const pricePkr = Number(event.price) || 0;
            const isPast = isEventConcluded(event.scheduled_at);

            return (
              <div
                key={event.id}
                className={`group relative overflow-hidden rounded-2xl bg-white/[0.03] border transition-all duration-300 hover:border-[#FF6F26]/40 p-6 sm:p-7 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                  hasTicket ? "border-emerald-500/40 bg-emerald-950/[0.08]" : isPast ? "opacity-75 border-white/[0.06]" : "border-white/[0.08]"
                }`}
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
                        isPast
                          ? "bg-neutral-800 border-white/10 text-neutral-400"
                          : isArtistSplit
                          ? "bg-purple-500/10 border-purple-500/25 text-purple-300"
                          : "bg-[#FF6F26]/10 border-[#FF6F26]/25 text-[#FF6F26]"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      {isPast
                        ? "Concluded / Past Event"
                        : isArtistSplit
                        ? "Touring DJ / Artist Session"
                        : "Solo-No-More Exclusive"}
                    </span>
                    {hasTicket && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Digital Ticket Active
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight group-hover:text-[#FF6F26] transition-colors">
                    {event.title}
                  </h3>

                  {event.description && (
                    <p className="text-sm text-neutral-400 line-clamp-2 leading-relaxed">
                      {event.description.split("<!--SNM_EVENT_META")[0].trim()}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-neutral-400 pt-1">
                    <span className="inline-flex items-center gap-1.5 text-neutral-300">
                      <Clock className="w-4 h-4 text-[#FF6F26]" />
                      {formatEventDate(event.scheduled_at)}
                    </span>
                    {event.venue_name && (
                      <span className="inline-flex items-center gap-1.5 text-neutral-300">
                        <MapPin className="w-4 h-4 text-[#FF6F26]" />
                        {event.venue_name}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 font-bold text-white bg-white/[0.05] px-2.5 py-1 rounded-lg border border-white/10">
                      <Ticket className="w-3.5 h-3.5 text-[#FF6F26]" />
                      {isPast
                        ? "BOOKINGS CLOSED"
                        : isFamily && isArtistSplit
                        ? "FREE VIP PASS (FAMILY PERK)"
                        : pricePkr > 0
                        ? `PKR ${pricePkr.toLocaleString()}`
                        : "FREE ENTRY"}
                    </span>
                  </div>
                </div>

                {/* Right Action Checkout Block */}
                <div className="w-full md:w-64 flex-shrink-0 flex flex-col justify-center items-stretch gap-2.5 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-white/[0.08] md:pl-6">
                  {isPast ? (
                    <div className="w-full text-center py-3 px-4 rounded-xl bg-neutral-800/80 border border-white/10 text-neutral-400 font-bold text-xs flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 text-neutral-500" />
                      <span>Event Concluded (Booking Closed)</span>
                    </div>
                  ) : isRestrictedRole ? (
                    <div
                      className="w-full text-center py-3 px-4 rounded-xl bg-white/[0.04] border border-white/10 text-neutral-400 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed"
                      title={`${roleLabel} accounts cannot book attendee tickets (View Only mode)`}
                    >
                      <ShieldCheck className="w-4 h-4 text-neutral-500" />
                      <span>View Only ({roleLabel})</span>
                    </div>
                  ) : hasTicket ? (
                    <div className="w-full text-center py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ticket Confirmed</span>
                    </div>
                  ) : isFamily && (pricePkr === 0 || isArtistSplit) ? (
                    <button
                      onClick={() => handleClaimVip(event.id, event.title)}
                      disabled={loadingEventId !== null}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-lg shadow-[#FF6F26]/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{loadingEventId === event.id ? "Claiming..." : "Claim VIP Pass"}</span>
                    </button>
                  ) : (
                    <div className="space-y-2 w-full">
                      <button
                        onClick={() => handleOpenBuyModal(event)}
                        disabled={loadingEventId !== null}
                        className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-lg shadow-[#FF6F26]/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        <Ticket className="w-4 h-4" />
                        <span>Book Pass — {pricePkr > 0 ? `PKR ${pricePkr.toLocaleString()}` : "FREE"}</span>
                      </button>
                      {!isFamily && (
                        <Link
                          href="/dashboard/upgrade"
                          className="block text-center text-[11px] text-[#FF6F26] hover:underline font-medium"
                        >
                          Free for Family VIP — Upgrade
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty events feed state */
        <div className="text-center py-16 px-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-md">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FF6F26]/10 border border-[#FF6F26]/20 flex items-center justify-center text-[#FF6F26] mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Upcoming Events</h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto">
            Our team is currently syncing up with venue partners. New rave and DJ bookings will be posted here soon.
          </p>
        </div>
      )}

      {/* ── EVENT TICKET PAYMENT MODAL ──── */}
      {activeEventForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg max-h-[94vh] overflow-y-auto rounded-2xl bg-[#0B080E] border border-white/[0.12] shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Title Bar */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.08] bg-white/[0.02]">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Ticket className="w-5 h-5 text-[#FF6F26]" />
                <span>Book Event Ticket</span>
              </div>
              <button
                onClick={() => setActiveEventForPayment(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              {modalSuccess ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Payment Proof Submitted</h3>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                    Your Transaction ID has been recorded. Admin will verify and activate your pass shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleTicketPaymentSubmit} className="space-y-5">
                  {/* Event & Amount notice */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{activeEventForPayment.title}</div>
                      <div className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#FF6F26]" />
                        <span>{activeEventForPayment.venue_name || "Karachi"}</span>
                      </div>
                    </div>
                    <div className="text-xl font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] bg-clip-text text-transparent">
                      PKR {Number(activeEventForPayment.price).toLocaleString()}
                    </div>
                  </div>

                  {/* Payment method selector */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2.5">
                      Select Payment Method
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: "raast", label: "Raast (Instant)" },
                        { id: "sadapay", label: "SadaPay" },
                        { id: "bank_transfer", label: "Bank IBFT" },
                      ].map((m) => (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => setPaymentMethod(m.id as any)}
                          className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                            paymentMethod === m.id
                              ? "bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white border-transparent shadow-lg shadow-[#FF6F26]/20"
                              : "bg-white/[0.03] border-white/10 text-neutral-300 hover:bg-white/[0.06]"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Account instructions box */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                    {paymentMethod === "raast" && (
                      <div className="text-xs space-y-1">
                        <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5" />
                          <span>RAAST ID (Instant & Free)</span>
                        </div>
                        <div className="text-lg font-mono font-bold text-white tracking-wider">
                          0300-SOLONOMORE
                        </div>
                        <div className="text-neutral-400 text-[11px]">
                          Account Title: Solo-No-More / Abdul Raffay
                        </div>
                      </div>
                    )}

                    {paymentMethod === "sadapay" && (
                      <div className="text-xs space-y-1">
                        <div className="text-[#FF6F26] font-semibold flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>SadaPay / NayaPay Wallet</span>
                        </div>
                        <div className="text-lg font-mono font-bold text-white tracking-wider">
                          0300-1234567
                        </div>
                        <div className="text-neutral-400 text-[11px]">
                          Account Title: Solo-No-More / Abdul Raffay
                        </div>
                      </div>
                    )}

                    {paymentMethod === "bank_transfer" && (
                      <div className="text-xs space-y-1">
                        <div className="text-[#FF6F26] font-semibold flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Meezan Bank IBFT</span>
                        </div>
                        <div className="text-white font-medium">Account Title: Abdul Raffay</div>
                        <div className="font-mono text-neutral-300 text-[11px]">
                          IBAN: PK00MEZN0001020304050607
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Transaction Ref input */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-2">
                      Transaction Reference / TID (From Banking App) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9840210294 or STAN/RRN"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF6F26] transition-colors font-mono"
                    />
                    <span className="block text-[11px] text-neutral-400 mt-1.5">
                      Enter the Transaction ID shown on your receipt after sending PKR {Number(activeEventForPayment.price).toLocaleString()}.
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="submit"
                      disabled={submittingPayment || !transactionRef.trim()}
                      className="w-full py-3.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-lg shadow-[#FF6F26]/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {submittingPayment ? "Submitting Proof..." : "Submit Ticket Payment Proof"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDevInstantTicket(activeEventForPayment.id)}
                      className="w-full py-2 px-3 rounded-xl text-[11px] text-neutral-400 hover:text-neutral-200 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                    >
                      ⚡ [DEV TEST: Instant Pass Confirmation]
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
