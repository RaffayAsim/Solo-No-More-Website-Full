"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { OfficialEvent } from "@/lib/supabase/types";
import {
  Calendar,
  MapPin,
  Ticket,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  Users,
  Sparkles,
  ShieldCheck,
  Building2,
  Layers,
  QrCode,
} from "lucide-react";
import { IconEdit, IconTrash, IconCheck, IconPlus, IconImage } from "@/components/icons/AppIcons";
import EventCreateEditModal from "@/components/events/EventCreateEditModal";
import EventDoorScannerModal from "@/components/events/EventDoorScannerModal";
import {
  parseEventDescription,
  isEventConcluded,
} from "@/lib/event-metadata";
import {
  verifyAndPublishEventAction,
  deleteRichEventAction,
  checkInAttendeeAction,
} from "@/app/actions/events";

interface EventsManagerClientProps {
  initialEvents: OfficialEvent[];
  initialTickets?: any[];
}

function formatScheduledAt(iso: string): string {
  if (!iso) return "TBD";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function EventsManagerClient({
  initialEvents,
  initialTickets = [],
}: EventsManagerClientProps) {
  const router = useRouter();
  const [events, setEvents] = useState<OfficialEvent[]>(initialEvents);
  const [tickets, setTickets] = useState<any[]>(initialTickets);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "past">("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<OfficialEvent | null>(null);
  const [scannerEvent, setScannerEvent] = useState<OfficialEvent | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleToggleAdmission = async (ticketId: string, currentStatus: string) => {
    const newStatus = currentStatus === "admitted" ? "active" : "admitted";
    try {
      const res = await checkInAttendeeAction(ticketId);
      if (res.success) {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, ticket_status: newStatus } : t))
        );
      }
    } catch {}
  };

  // Sync state if props reload
  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingEvent(null);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (evt: OfficialEvent) => {
    setEditingEvent(evt);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Verify and Publish a 3rd party event
  const handleVerifyAndPublish = async (eventId: string, eventTitle: string) => {
    setActionLoadingId(eventId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await verifyAndPublishEventAction(eventId);
      if (res.success) {
        setSuccessMsg(`✓ Event "${eventTitle}" verified & published live!`);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to verify event");
      }
    } catch {
      setErrorMsg("Failed to verify event due to network error.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Delete Event
  const handleDelete = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Are you sure you want to delete the event "${eventTitle}"? This will cancel all claimed tickets.`)) {
      return;
    }

    setActionLoadingId(eventId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await deleteRichEventAction(eventId);
      if (res.success) {
        setSuccessMsg(`Event "${eventTitle}" has been removed.`);
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to delete event.");
      }
    } catch {
      setErrorMsg("Failed to delete event due to network connection issues.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Classify events
  const pendingEvents = events.filter((e) => {
    const { metadata } = parseEventDescription(e.description);
    return metadata.status === "pending_review";
  });

  const filteredEvents = events.filter((e) => {
    const { metadata } = parseEventDescription(e.description);
    const isPast = isEventConcluded(e.scheduled_at);

    if (activeTab === "pending") {
      return metadata.status === "pending_review";
    }
    if (activeTab === "past") {
      return isPast;
    }
    // "all" tab shows published or active events
    return metadata.status !== "pending_review" || pendingEvents.length === 0;
  });

  return (
    <div style={{ maxWidth: "1600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ── 1. PAGE HEADER (Matching User Uploaded Image) ──────────────── */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "24px",
          background: "linear-gradient(135deg, rgba(22, 14, 29, 0.95) 0%, rgba(10, 6, 16, 0.95) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          padding: "clamp(20px, 3vw, 32px)",
          boxShadow: "0 14px 40px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "360px",
            height: "360px",
            background: "radial-gradient(circle, rgba(255, 111, 38, 0.14) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "3px 10px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: 800,
                color: "#FF8A3D",
                background: "rgba(255, 111, 38, 0.12)",
                border: "1px solid rgba(255, 111, 38, 0.28)",
                marginBottom: "8px",
              }}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>EVENTS &amp; TICKETING</span>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
                fontSize: "clamp(24px, 3vw, 32px)",
                fontWeight: 900,
                color: "#FFFFFF",
                margin: "0 0 6px",
                letterSpacing: "-0.03em",
              }}
            >
              Official Events Board
            </h1>
            <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)", margin: 0, maxWidth: "600px" }}>
              Manage partner official events, venue ticketing configurations, and attendee claims.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            style={{
              background: "linear-gradient(135deg, #FF6F26 0%, #FF4400 100%)",
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: 800,
              padding: "11px 22px",
              borderRadius: "14px",
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 18px rgba(255, 111, 38, 0.45)",
              transition: "transform 0.15s ease",
            }}
            className="hover:scale-105 active:scale-95"
          >
            <IconPlus size={16} color="#FFFFFF" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* ── 2. GLOBAL ALERTS ───────────────────────────────────────────── */}
      {errorMsg && (
        <div
          style={{
            background: "rgba(255, 59, 48, 0.15)",
            border: "1px solid rgba(255, 59, 48, 0.4)",
            color: "#FF3B30",
            padding: "12px 18px",
            borderRadius: "14px",
            fontSize: "13px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            background: "rgba(39, 201, 63, 0.15)",
            border: "1px solid rgba(39, 201, 63, 0.4)",
            color: "#27C93F",
            padding: "12px 18px",
            borderRadius: "14px",
            fontSize: "13px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── 3. QUEUE FILTER TABS ───────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          style={{
            padding: "8px 16px",
            borderRadius: "10px",
            fontSize: "12.5px",
            fontWeight: 800,
            border: activeTab === "all" ? "1px solid rgba(255, 111, 38, 0.5)" : "1px solid rgba(255, 255, 255, 0.1)",
            background: activeTab === "all" ? "linear-gradient(135deg, #FF6F26, #FF4400)" : "rgba(255, 255, 255, 0.04)",
            color: "#FFFFFF",
            cursor: "pointer",
          }}
        >
          All &amp; Published ({events.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          style={{
            padding: "8px 16px",
            borderRadius: "10px",
            fontSize: "12.5px",
            fontWeight: 800,
            border: activeTab === "pending" ? "1px solid rgba(255, 149, 0, 0.6)" : "1px solid rgba(255, 255, 255, 0.1)",
            background: activeTab === "pending" ? "rgba(255, 149, 0, 0.2)" : "rgba(255, 255, 255, 0.04)",
            color: activeTab === "pending" ? "#FF9500" : "rgba(255, 255, 255, 0.8)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>Pending Artist / Partner Verification</span>
          {pendingEvents.length > 0 && (
            <span
              style={{
                background: "#FF9500",
                color: "#000000",
                fontSize: "10px",
                fontWeight: 900,
                padding: "1px 6px",
                borderRadius: "6px",
              }}
            >
              {pendingEvents.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("past")}
          style={{
            padding: "8px 16px",
            borderRadius: "10px",
            fontSize: "12.5px",
            fontWeight: 800,
            border: activeTab === "past" ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
            background: activeTab === "past" ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.04)",
            color: "#FFFFFF",
            cursor: "pointer",
          }}
        >
          Concluded Events
        </button>
      </div>

      {/* ── 4. EVENTS DATA TABLE (Exact Image Format) ──────────────────── */}
      <div
        style={{
          overflow: "hidden",
          borderRadius: "20px",
          background: "linear-gradient(180deg, rgba(18, 12, 24, 0.95) 0%, rgba(8, 4, 12, 0.95) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* Desktop Table View */}
        <div className="hidden md:block" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  background: "rgba(255, 255, 255, 0.02)",
                  color: "rgba(255, 255, 255, 0.55)",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontSize: "11px",
                }}
              >
                <th style={{ padding: "16px 20px" }}>Event Title</th>
                <th style={{ padding: "16px 20px" }}>Scheduled Time</th>
                <th style={{ padding: "16px 20px" }}>Venue</th>
                <th style={{ padding: "16px 20px" }}>Type</th>
                <th style={{ padding: "16px 20px" }}>Price</th>
                <th style={{ padding: "16px 20px", textAlign: "center" }}>Capacity</th>
                <th style={{ padding: "16px 20px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((evt) => {
                  const { cleanDescription, metadata } = parseEventDescription(evt.description);
                  const isArtistSplit = evt.event_type === "artist_split";
                  const isPast = isEventConcluded(evt.scheduled_at);
                  const isPending = metadata.status === "pending_review";
                  const isLoading = actionLoadingId === evt.id;

                  return (
                    <tr
                      key={evt.id}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                        transition: "background-color 0.15s ease",
                      }}
                      className="hover:bg-white/[0.03]"
                    >
                      {/* Event Title + Subtitle + Creator Badge */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {metadata.feature_image ? (
                            <div
                              style={{
                                width: "48px",
                                height: "36px",
                                borderRadius: "8px",
                                overflow: "hidden",
                                flexShrink: 0,
                                border: "1px solid rgba(255, 111, 38, 0.4)",
                                background: "#08040C",
                              }}
                            >
                              <img
                                src={metadata.feature_image}
                                alt={evt.title}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            </div>
                          ) : (
                            <div
                              style={{
                                width: "48px",
                                height: "36px",
                                borderRadius: "8px",
                                flexShrink: 0,
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                background: "rgba(255, 255, 255, 0.04)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <IconImage size={16} color="rgba(255, 255, 255, 0.3)" />
                            </div>
                          )}

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "3px" }}>
                              <span style={{ fontWeight: 800, color: "#FFFFFF", fontSize: "14px" }}>
                                {evt.title}
                              </span>

                              {/* Status Badge */}
                              {isPast ? (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: 800,
                                    background: "rgba(255, 255, 255, 0.1)",
                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                    color: "rgba(255, 255, 255, 0.6)",
                                    padding: "2px 6px",
                                    borderRadius: "6px",
                                  }}
                                >
                                  CONCLUDED
                                </span>
                              ) : isPending ? (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: 800,
                                    background: "rgba(255, 149, 0, 0.15)",
                                    border: "1px solid rgba(255, 149, 0, 0.35)",
                                    color: "#FF9500",
                                    padding: "2px 7px",
                                    borderRadius: "6px",
                                  }}
                                >
                                  PENDING VERIFICATION
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: 800,
                                    background: "rgba(39, 201, 63, 0.12)",
                                    border: "1px solid rgba(39, 201, 63, 0.3)",
                                    color: "#27C93F",
                                    padding: "2px 6px",
                                    borderRadius: "6px",
                                  }}
                                >
                                  PUBLISHED
                                </span>
                              )}
                            </div>

                            {cleanDescription && (
                              <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.55)", maxWidth: "340px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {cleanDescription}
                              </div>
                            )}

                            {metadata.creator_name && metadata.creator_type !== "admin" && (
                              <div style={{ fontSize: "11px", color: "#FF8A3D", marginTop: "3px", fontWeight: 700 }}>
                                Submitted by: {metadata.creator_name} ({metadata.creator_type?.toUpperCase()})
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Scheduled Time */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(255, 255, 255, 0.8)", fontFamily: "monospace" }}>
                          <Clock className="w-3.5 h-3.5 text-[#FF6F26]" />
                          <span>{formatScheduledAt(evt.scheduled_at)}</span>
                        </div>
                      </td>

                      {/* Venue */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(255, 255, 255, 0.8)" }}>
                          <MapPin className="w-3.5 h-3.5 text-[#FF8A3D]" />
                          <span style={{ fontWeight: 600 }}>{evt.venue_name || "Karachi Venue"}</span>
                        </div>
                        {metadata.full_address && (
                          <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)", marginTop: "2px" }}>
                            {metadata.full_address}
                          </div>
                        )}
                      </td>

                      {/* Event Type (Platform Owned vs Artist Split) */}
                      <td style={{ padding: "16px 20px" }}>
                        {isArtistSplit ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 10px",
                              borderRadius: "8px",
                              fontSize: "11px",
                              fontWeight: 800,
                              background: "rgba(168, 85, 247, 0.15)",
                              border: "1px solid rgba(168, 85, 247, 0.35)",
                              color: "#C084FC",
                            }}
                          >
                            Artist Split
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 10px",
                              borderRadius: "8px",
                              fontSize: "11px",
                              fontWeight: 800,
                              background: "rgba(39, 201, 63, 0.12)",
                              border: "1px solid rgba(39, 201, 63, 0.3)",
                              color: "#27C93F",
                            }}
                          >
                            Platform Owned
                          </span>
                        )}
                      </td>

                      {/* Price */}
                      <td style={{ padding: "16px 20px", fontWeight: 800, color: "#FFFFFF" }}>
                        {Number(evt.price) > 0 ? `PKR ${Number(evt.price).toLocaleString()}` : "FREE"}
                      </td>

                      {/* Capacity */}
                      <td style={{ padding: "16px 20px", textAlign: "center" }}>
                        <span
                          style={{
                            background: "rgba(255, 255, 255, 0.06)",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            padding: "4px 10px",
                            borderRadius: "8px",
                            fontWeight: 800,
                            color: "#FFFFFF",
                            fontSize: "11.5px",
                          }}
                        >
                          {evt.max_capacity} PAX
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          {/* Quick Verify & Publish button for pending events */}
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleVerifyAndPublish(evt.id, evt.title)}
                              disabled={isLoading}
                              title="Verify & Publish Event"
                              style={{
                                background: "linear-gradient(135deg, #27C93F, #1E9E30)",
                                border: "none",
                                borderRadius: "8px",
                                padding: "6px 12px",
                                color: "#FFFFFF",
                                fontSize: "11.5px",
                                fontWeight: 800,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                              className="hover:scale-105"
                            >
                              <IconCheck size={14} color="#FFFFFF" />
                              <span>Verify &amp; Go Live</span>
                            </button>
                          )}

                          {/* Door Scanner button */}
                          <button
                            type="button"
                            onClick={() => setScannerEvent(evt)}
                            title="Open Camera Door Scanner"
                            style={{
                              padding: "6px 12px",
                              borderRadius: "8px",
                              background: "rgba(255, 111, 38, 0.15)",
                              border: "1px solid rgba(255, 111, 38, 0.4)",
                              color: "#FFA05C",
                              fontSize: "11.5px",
                              fontWeight: 800,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              transition: "all 0.15s ease",
                            }}
                            className="hover:bg-[#FF6F26]/25 hover:border-[#FF6F26]/60 cursor-pointer"
                          >
                            <QrCode size={14} className="text-[#FF6F26]" />
                            <span>Door Scanner</span>
                          </button>

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(evt)}
                            title="Edit Event"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background: "rgba(255, 255, 255, 0.08)",
                              border: "1px solid rgba(255, 255, 255, 0.16)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#FFFFFF",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            className="hover:bg-white/20 hover:border-white/30"
                          >
                            <IconEdit size={16} color="#FFFFFF" />
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => handleDelete(evt.id, evt.title)}
                            disabled={isLoading}
                            title="Delete Event"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background: "rgba(255, 59, 48, 0.15)",
                              border: "1px solid rgba(255, 59, 48, 0.3)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#FF3B30",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            className="hover:bg-red-500/25 hover:border-red-500/50"
                          >
                            <IconTrash size={16} color="#FF3B30" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: "48px 20px", textAlign: "center", color: "rgba(255, 255, 255, 0.5)" }}>
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-white/30" />
                    <p style={{ margin: 0, fontSize: "13px" }}>
                      No events found in this category. Click &quot;+ Create Event&quot; to publish a new gig.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards View (< 768px) */}
        <div className="md:hidden p-3.5 space-y-3">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((evt) => {
              const { metadata } = parseEventDescription(evt.description);
              const isArtistSplit = evt.event_type === "artist_split";
              const isPast = isEventConcluded(evt.scheduled_at);
              const isPending = metadata.status === "pending_review";
              const isLoading = actionLoadingId === evt.id;

              return (
                <div
                  key={evt.id}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    {metadata.feature_image ? (
                      <img
                        src={metadata.feature_image}
                        alt={evt.title}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#FF6F26]/30"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white/40">
                        <Calendar size={22} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">
                        {evt.title}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#FF6F26]/15 text-[#FFA05C] border border-[#FF6F26]/30">
                          {metadata.creator_type || "Admin"}
                        </span>
                        {isPending && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Pending
                          </span>
                        )}
                        {isPast && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-zinc-400">
                            Concluded
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300 pt-1 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#FF8A3D] shrink-0" />
                      <span className="truncate">{evt.venue_name || "Karachi Venue"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="font-bold text-[#FFA05C]">
                        {evt.price > 0 ? `PKR ${evt.price.toLocaleString()}` : "Free"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                      <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                      <span className="truncate">{formatScheduledAt(evt.scheduled_at)}</span>
                    </div>
                    <div className="text-right text-[11px] text-zinc-400">
                      Capacity: <strong className="text-white">{evt.max_capacity}</strong>
                    </div>
                  </div>

                  {/* Mobile Actions Toolbar */}
                  <div className="pt-2 border-t border-white/10 flex items-center gap-2 flex-wrap">
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleVerifyAndPublish(evt.id, evt.title)}
                        disabled={isLoading}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-green-600 text-white flex items-center justify-center gap-1.5 shadow"
                      >
                        <IconCheck size={14} color="#FFFFFF" />
                        <span>Verify &amp; Go Live</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setScannerEvent(evt)}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-[#FF6F26]/20 border border-[#FF6F26]/40 text-[#FFA05C] flex items-center justify-center gap-1.5"
                    >
                      <QrCode size={14} className="text-[#FF6F26]" />
                      <span>Scanner</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(evt)}
                      className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 border border-white/15"
                      title="Edit"
                    >
                      <IconEdit size={16} color="#FFFFFF" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(evt.id, evt.title)}
                      disabled={isLoading}
                      className="p-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40"
                      title="Delete"
                    >
                      <IconTrash size={16} color="#FF3B30" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-zinc-500 text-xs">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-white/30" />
              <p>No events found in this category.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── 5. COMPREHENSIVE EVENT CREATION & EDIT MODAL ───────────────── */}
      <EventCreateEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventToEdit={editingEvent}
        onSuccess={() => {
          router.refresh();
        }}
        workspaceTitle="Admin workspace"
      />

      {/* ── 6. DEDICATED OFFICIAL EVENT DOOR SCANNER MODAL ───────────────── */}
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
          accent="orange"
        />
      )}
    </div>
  );
}
