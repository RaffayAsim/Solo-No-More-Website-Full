"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createArtistEventAction, checkInAttendeeAction } from "@/app/actions/events";
import type { OfficialEvent, Profile } from "@/lib/supabase/types";

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
}

export default function ArtistDashboardClient({
  profile,
  initialEvents,
  initialTickets,
}: ArtistDashboardClientProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"events" | "create" | "payout">("events");
  const [events, setEvents] = useState<OfficialEvent[]>(initialEvents);
  const [tickets, setTickets] = useState<TicketWithProfile[]>(initialTickets);

  // Filter for guestlist viewer
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    initialEvents.length > 0 ? initialEvents[0].id : null
  );

  // Form State for Event Listing
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venueName, setVenueName] = useState("");
  const [price, setPrice] = useState("2500");
  const [maxCapacity, setMaxCapacity] = useState("100");
  const [scheduledAt, setScheduledAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Payout Settings State
  const [raastId, setRaastId] = useState("0300-YOURARTISTRAAST");
  const [bankIban, setBankIban] = useState("");
  const [accountTitle, setAccountTitle] = useState(profile?.full_name || "");
  const [payoutSaved, setPayoutSaved] = useState(false);

  // Check-in action state
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  // Derived Telemetry
  const totalTicketsSold = tickets.filter((t) => t.ticket_status === "active" || t.ticket_status === "admitted").length;
  const grossRevenuePkr = events.reduce((sum, ev) => {
    const soldForEvent = tickets.filter(
      (t) => t.event_id === ev.id && (t.ticket_status === "active" || t.ticket_status === "admitted")
    ).length;
    return sum + soldForEvent * (ev.price || 0);
  }, 0);
  const netEstimatedPayout = Math.round(grossRevenuePkr * 0.92); // 92% net to artist, 8% platform ticketing fee

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!title.trim() || !venueName.trim() || !scheduledAt) {
      setErrorMsg("Please fill in event title, venue location, and date/time.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await createArtistEventAction({
        title: title.trim(),
        description: description.trim(),
        venue_name: venueName.trim(),
        price: Number(price) || 0,
        max_capacity: Number(maxCapacity) || 100,
        scheduled_at: scheduledAt,
      });

      if (res.success) {
        setSuccessMsg("Event published successfully! Digital ticketing passes are now live.");
        setTitle("");
        setDescription("");
        setVenueName("");
        setPrice("2500");
        setMaxCapacity("100");
        setScheduledAt("");
        setTimeout(() => {
          router.refresh();
          setActiveTab("events");
        }, 1500);
      } else {
        setErrorMsg(res.error || "Failed to create event.");
      }
    } catch {
      setErrorMsg("Network error occurred while submitting event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckInGuest = async (ticketId: string) => {
    setCheckingInId(ticketId);
    try {
      const res = await checkInAttendeeAction(ticketId);
      if (res.success) {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, ticket_status: "admitted" } : t))
        );
      }
    } finally {
      setCheckingInId(null);
    }
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const attendeesForSelected = tickets.filter((t) => t.event_id === selectedEventId);

  return (
    <div style={{ padding: "16px", maxWidth: "1000px", margin: "0 auto" }}>
      {/* ── Header Bevel Panel ──────────────────────────────────────────────── */}
      <div className="nokia-panel-sunken" style={{ padding: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span className="nokia-badge nokia-badge-primary" style={{ fontSize: "7px" }}>
              ◈ CREATOR & PROMOTER HUB
            </span>
            <span className="font-pixel text-accent" style={{ fontSize: "8px" }}>
              ZERO UPFRONT GATEWAY FEE
            </span>
          </div>
          <h1 className="font-pixel text-accent" style={{ fontSize: "14px", margin: 0, letterSpacing: "0.08em" }}>
            🎤 ARTIST & EVENT TICKETING PORTAL
          </h1>
          <p className="font-mono text-muted" style={{ fontSize: "11px", margin: "4px 0 0 0" }}>
            Publish your gigs, collect ticket payments in PKR via Raast & Bank Transfer, and manage door check-ins.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link href="/dashboard/events" className="nokia-btn font-pixel" style={{ fontSize: "8px", padding: "6px 12px" }}>
            ◀ PUBLIC EVENTS
          </Link>
          <Link href="/dashboard" className="nokia-btn font-pixel" style={{ fontSize: "8px", padding: "6px 12px" }}>
            LOBBY
          </Link>
        </div>
      </div>

      {/* ── Telemetry Monitor Cards ─────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "20px" }}>
        <div className="nokia-panel-sunken" style={{ padding: "12px", textAlign: "center" }}>
          <div className="font-lcd text-accent" style={{ fontSize: "28px", lineHeight: 1 }}>
            {events.length}
          </div>
          <div className="font-pixel" style={{ fontSize: "7px", color: "var(--text-muted)", marginTop: "4px" }}>
            LISTED GIGS / SHOWS
          </div>
        </div>

        <div className="nokia-panel-sunken" style={{ padding: "12px", textAlign: "center" }}>
          <div className="font-lcd text-warning" style={{ fontSize: "28px", lineHeight: 1 }}>
            {totalTicketsSold}
          </div>
          <div className="font-pixel" style={{ fontSize: "7px", color: "var(--text-muted)", marginTop: "4px" }}>
            TICKETS ADMITTED / ACTIVE
          </div>
        </div>

        <div className="nokia-panel-sunken" style={{ padding: "12px", textAlign: "center" }}>
          <div className="font-lcd text-success" style={{ fontSize: "24px", lineHeight: 1 }}>
            PKR {grossRevenuePkr.toLocaleString()}
          </div>
          <div className="font-pixel" style={{ fontSize: "7px", color: "var(--text-muted)", marginTop: "4px" }}>
            GROSS TICKET SALES
          </div>
        </div>

        <div className="nokia-panel-sunken" style={{ padding: "12px", textAlign: "center" }}>
          <div className="font-lcd" style={{ fontSize: "24px", lineHeight: 1, color: "var(--accent-primary)" }}>
            PKR {netEstimatedPayout.toLocaleString()}
          </div>
          <div className="font-pixel" style={{ fontSize: "7px", color: "var(--text-muted)", marginTop: "4px" }}>
            NET ARTIST PAYOUT (92%)
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
        {[
          { id: "events", label: "🎫 TICKETED GIGS & GUESTLIST" },
          { id: "create", label: "➕ LIST NEW EVENT" },
          { id: "payout", label: "🏦 BANK & RAAST SETTLEMENT" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`nokia-btn font-pixel ${activeTab === tab.id ? "nokia-btn-primary" : ""}`}
            style={{ fontSize: "8px", padding: "8px 14px" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: GIGS & GUESTLIST ─────────────────────────────────────────── */}
      {activeTab === "events" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px", alignItems: "start" }}>
          {/* Event Selector List */}
          <div className="nokia-panel" style={{ padding: "16px" }}>
            <span className="font-pixel text-muted" style={{ fontSize: "8px", display: "block", marginBottom: "12px" }}>
              ▶ SELECT GIG TO VIEW DOOR GUESTLIST
            </span>

            {events.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {events.map((ev) => {
                  const evTickets = tickets.filter(
                    (t) => t.event_id === ev.id && (t.ticket_status === "active" || t.ticket_status === "admitted")
                  );
                  const isSelected = selectedEventId === ev.id;
                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEventId(ev.id)}
                      className={`nokia-panel-sunken cursor-pointer transition-all ${
                        isSelected ? "border-accent" : ""
                      }`}
                      style={{
                        padding: "12px",
                        cursor: "pointer",
                        border: isSelected ? "2px solid var(--accent-primary)" : "1px solid var(--border-light)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <h4 className="font-pixel" style={{ fontSize: "10px", margin: 0, textTransform: "uppercase" }}>
                          {ev.title}
                        </h4>
                        <span className="font-lcd text-accent" style={{ fontSize: "14px" }}>
                          PKR {ev.price?.toLocaleString()}
                        </span>
                      </div>

                      <div className="font-mono text-muted" style={{ fontSize: "10px", marginTop: "6px" }}>
                        📍 {ev.venue_name || "Karachi Venue"} • 👥 {evTickets.length}/{ev.max_capacity} Passes Sold
                      </div>

                      <div style={{ marginTop: "6px", display: "flex", gap: "8px", alignItems: "center" }}>
                        <span className="nokia-badge" style={{ fontSize: "6px" }}>
                          {ev.scheduled_at ? new Date(ev.scheduled_at).toLocaleDateString() : "UPCOMING"}
                        </span>
                        {isSelected && (
                          <span className="font-pixel text-accent" style={{ fontSize: "7px" }}>
                            [SELECTED FOR SCANNER]
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center font-mono text-muted" style={{ padding: "24px 0", fontSize: "11px" }}>
                No events published yet. Click "List New Event" to create one.
              </div>
            )}
          </div>

          {/* Door Check-in & Guestlist */}
          <div className="nokia-panel" style={{ padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <span className="font-pixel text-accent" style={{ fontSize: "8px" }}>
                  DOOR CHECK-IN SCANNER
                </span>
                <h3 className="font-pixel" style={{ fontSize: "11px", margin: "4px 0 0 0" }}>
                  {selectedEvent ? selectedEvent.title.toUpperCase() : "SELECT AN EVENT"}
                </h3>
              </div>
              <span className="nokia-badge nokia-badge-primary" style={{ fontSize: "7px" }}>
                {attendeesForSelected.length} ATTENDEES
              </span>
            </div>

            {attendeesForSelected.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "400px", overflowY: "auto" }}>
                {attendeesForSelected.map((att) => {
                  const isAdmitted = att.ticket_status === "admitted";
                  return (
                    <div
                      key={att.id}
                      className="nokia-panel-sunken"
                      style={{
                        padding: "10px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: isAdmitted ? "rgba(0, 255, 128, 0.05)" : undefined,
                      }}
                    >
                      <div>
                        <div className="font-mono" style={{ fontSize: "11px", fontWeight: "bold" }}>
                          {att.profiles?.full_name || "Solo Attendee"}
                        </div>
                        <div className="font-mono text-muted" style={{ fontSize: "9px" }}>
                          TICKET ID: {att.id.slice(0, 8)} • {att.profiles?.city || "Karachi"}
                        </div>
                      </div>

                      <div>
                        {isAdmitted ? (
                          <span className="nokia-badge nokia-badge-success" style={{ fontSize: "7px" }}>
                            ✓ ADMITTED AT DOOR
                          </span>
                        ) : (
                          <button
                            onClick={() => handleCheckInGuest(att.id)}
                            disabled={checkingInId === att.id}
                            className="nokia-btn nokia-btn-primary font-pixel"
                            style={{ fontSize: "7px", padding: "6px 10px" }}
                          >
                            {checkingInId === att.id ? "ADMITTING..." : "✓ CHECK-IN (ADMIT)"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="nokia-panel-sunken text-center" style={{ padding: "30px 10px" }}>
                <div className="font-pixel text-muted" style={{ fontSize: "9px" }}>
                  NO TICKET PURCHASES YET
                </div>
                <p className="font-mono text-muted" style={{ fontSize: "10px", marginTop: "6px" }}>
                  When fans buy passes via Raast/SadaPay, their names and QR ticket IDs appear here for 1-tap admission.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: LIST NEW EVENT ───────────────────────────────────────────── */}
      {activeTab === "create" && (
        <div className="nokia-panel" style={{ padding: "20px", maxWidth: "680px", margin: "0 auto" }}>
          <div style={{ marginBottom: "16px", borderBottom: "2px solid var(--border-light)", paddingBottom: "10px" }}>
            <h3 className="font-pixel text-accent" style={{ fontSize: "12px", margin: 0 }}>
              ◈ CREATE TICKETED GIG / EVENT PASS
            </h3>
            <p className="font-mono text-muted" style={{ fontSize: "11px", margin: "4px 0 0 0" }}>
              Publish an event on Solo-No-More. Digital tickets will be sold in PKR with direct local payment processing.
            </p>
          </div>

          {errorMsg && (
            <div className="nokia-panel-sunken" style={{ padding: "8px 12px", borderColor: "var(--accent-danger)", marginBottom: "16px" }}>
              <span className="font-pixel text-danger" style={{ fontSize: "8px" }}>✕ {errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="nokia-panel-sunken" style={{ padding: "8px 12px", borderColor: "var(--accent-success)", marginBottom: "16px" }}>
              <span className="font-pixel text-success" style={{ fontSize: "8px" }}>✓ {successMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateEvent} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Event Title */}
            <div>
              <label className="font-pixel text-muted" style={{ display: "block", fontSize: "7px", marginBottom: "6px" }}>
                ♦ GIG / EVENT TITLE *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Karachi Underground Sound — Live DJ Set"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="nokia-input"
              />
            </div>

            {/* Venue & Location */}
            <div>
              <label className="font-pixel text-muted" style={{ display: "block", fontSize: "7px", marginBottom: "6px" }}>
                📍 VENUE LOCATION / ADDRESS *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. District 19, Clifton / The Second Floor (T2F)"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="nokia-input"
              />
            </div>

            {/* Price & Capacity Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label className="font-pixel text-muted" style={{ display: "block", fontSize: "7px", marginBottom: "6px" }}>
                  ₨ TICKET PRICE (PKR) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="100"
                  placeholder="2500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="nokia-input font-lcd"
                  style={{ fontSize: "16px" }}
                />
              </div>

              <div>
                <label className="font-pixel text-muted" style={{ display: "block", fontSize: "7px", marginBottom: "6px" }}>
                  👥 MAXIMUM CAPACITY (SEATS) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="1000"
                  placeholder="100"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                  className="nokia-input font-lcd"
                  style={{ fontSize: "16px" }}
                />
              </div>
            </div>

            {/* Date & Time */}
            <div>
              <label className="font-pixel text-muted" style={{ display: "block", fontSize: "7px", marginBottom: "6px" }}>
                📅 DATE & TIME OF GIG *
              </label>
              <input
                type="datetime-local"
                required
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="nokia-input"
              />
            </div>

            {/* Description */}
            <div>
              <label className="font-pixel text-muted" style={{ display: "block", fontSize: "7px", marginBottom: "6px" }}>
                ✎ EVENT DETAILS & VIBE DESCRIPTION
              </label>
              <textarea
                rows={3}
                placeholder="Music genre, lineup, dress code, age limits, and special instructions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="nokia-input"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="nokia-btn nokia-btn-primary"
              style={{ width: "100%", padding: "12px", fontSize: "9px", marginTop: "8px" }}
            >
              {isSubmitting ? "LISTING GIG..." : "✓ PUBLISH EVENT & LAUNCH TICKETING PASS"}
            </button>
          </form>
        </div>
      )}

      {/* ── TAB 3: PAYOUT SETTINGS ─────────────────────────────────────────── */}
      {activeTab === "payout" && (
        <div className="nokia-panel" style={{ padding: "20px", maxWidth: "680px", margin: "0 auto" }}>
          <div style={{ marginBottom: "16px", borderBottom: "2px solid var(--border-light)", paddingBottom: "10px" }}>
            <h3 className="font-pixel text-success" style={{ fontSize: "12px", margin: 0 }}>
              🏦 LOCAL DISBURSEMENT & PAYOUT SETTINGS
            </h3>
            <p className="font-mono text-muted" style={{ fontSize: "11px", margin: "4px 0 0 0" }}>
              Configure your Pakistani Bank Account or Raast ID where net ticket proceeds are wired.
            </p>
          </div>

          {payoutSaved && (
            <div className="nokia-panel-sunken" style={{ padding: "8px 12px", borderColor: "var(--accent-success)", marginBottom: "16px" }}>
              <span className="font-pixel text-success" style={{ fontSize: "8px" }}>✓ PAYOUT PREFERENCES SAVED</span>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label className="font-pixel text-muted" style={{ display: "block", fontSize: "7px", marginBottom: "6px" }}>
                ⚡ RAAST ID (FOR INSTANT WIRE)
              </label>
              <input
                type="text"
                placeholder="e.g. 0300-1234567"
                value={raastId}
                onChange={(e) => setRaastId(e.target.value)}
                className="nokia-input font-lcd"
                style={{ fontSize: "16px" }}
              />
            </div>

            <div>
              <label className="font-pixel text-muted" style={{ display: "block", fontSize: "7px", marginBottom: "6px" }}>
                🏦 BANK NAME & IBAN
              </label>
              <input
                type="text"
                placeholder="e.g. Meezan Bank / PK42MEZN0001..."
                value={bankIban}
                onChange={(e) => setBankIban(e.target.value)}
                className="nokia-input"
              />
            </div>

            <div>
              <label className="font-pixel text-muted" style={{ display: "block", fontSize: "7px", marginBottom: "6px" }}>
                👤 ACCOUNT TITLE
              </label>
              <input
                type="text"
                placeholder="Account Holder Full Name"
                value={accountTitle}
                onChange={(e) => setAccountTitle(e.target.value)}
                className="nokia-input"
              />
            </div>

            <div className="nokia-panel-sunken" style={{ padding: "12px", fontSize: "10px", lineHeight: "1.6" }}>
              <div className="font-pixel text-accent" style={{ fontSize: "7px", marginBottom: "4px" }}>
                ◈ SETTLEMENT TIMELINE & FEES
              </div>
              <ul style={{ margin: 0, paddingLeft: "16px", color: "var(--text-muted)" }}>
                <li>Platform ticketing processing fee is a flat 8% of gross sales.</li>
                <li>Net proceeds (92%) are automatically disbursed via Raast or IBFT within 24 to 48 hours following the conclusion of your show.</li>
                <li>Direct zero-fee gate scanner access is included for door check-ins.</li>
              </ul>
            </div>

            <button
              onClick={() => {
                setPayoutSaved(true);
                setTimeout(() => setPayoutSaved(false), 2500);
              }}
              className="nokia-btn nokia-btn-success"
              style={{ width: "100%", padding: "12px", fontSize: "8px" }}
            >
              ✓ SAVE DISBURSEMENT DETAILS
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
