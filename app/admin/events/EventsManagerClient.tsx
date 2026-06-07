"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createEventAction,
  updateEventAction,
  deleteEventAction,
  OfficialEventPayload,
} from "@/app/actions/admin";
import type { OfficialEvent } from "@/lib/supabase/types";

interface EventsManagerClientProps {
  initialEvents: OfficialEvent[];
}

function formatScheduledAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatToDatetimeLocal(isoString: string): string {
  const d = new Date(isoString);
  const pad = (num: number) => String(num).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function EventsManagerClient({ initialEvents }: EventsManagerClientProps) {
  const router = useRouter();
  const [events, setEvents] = useState<OfficialEvent[]>(initialEvents);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<OfficialEvent | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venueName, setVenueName] = useState("");
  const [eventType, setEventType] = useState<"artist_split" | "platform_owned">("platform_owned");
  const [price, setPrice] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state if props reload
  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingEvent(null);
    setTitle("");
    setDescription("");
    setVenueName("");
    setEventType("platform_owned");
    setPrice("0");
    setMaxCapacity("100");
    
    // Default to tomorrow same time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduledAt(formatToDatetimeLocal(tomorrow.toISOString()));

    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (evt: OfficialEvent) => {
    setEditingEvent(evt);
    setTitle(evt.title);
    setDescription(evt.description || "");
    setVenueName(evt.venue_name || "");
    setEventType(evt.event_type);
    setPrice(String(evt.price));
    setMaxCapacity(String(evt.max_capacity));
    setScheduledAt(formatToDatetimeLocal(evt.scheduled_at));

    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Handle Form Submit (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload: OfficialEventPayload = {
      title,
      description,
      venue_name: venueName,
      event_type: eventType,
      price: Number(price) || 0,
      max_capacity: Number(maxCapacity) || 100,
      scheduled_at: new Date(scheduledAt).toISOString(),
    };

    try {
      if (editingEvent) {
        // Update Action
        const res = await updateEventAction(editingEvent.id, payload);
        if (res.success) {
          setSuccessMsg(`Event "${title}" updated successfully.`);
          setIsModalOpen(false);
          router.refresh();
        } else {
          setErrorMsg(res.error);
        }
      } else {
        // Create Action
        const res = await createEventAction(payload);
        if (res.success) {
          setSuccessMsg(`Event "${title}" created successfully.`);
          setIsModalOpen(false);
          router.refresh();
        } else {
          setErrorMsg(res.error);
        }
      }
    } catch {
      setErrorMsg("Failed to save official event due to network issues.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Delete Event
  const handleDelete = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Are you sure you want to delete the event "${eventTitle}"? This will also cancel all claimed tickets.`)) {
      return;
    }

    setActionLoadingId(eventId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await deleteEventAction(eventId);
      if (res.success) {
        setSuccessMsg(`Event "${eventTitle}" has been deleted.`);
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
        router.refresh();
      } else {
        setErrorMsg(res.error);
      }
    } catch {
      setErrorMsg("Failed to delete event due to network connection issues.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Page Header */}
      <div className="nokia-panel-sunken" style={{ padding: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="font-pixel text-accent" style={{ fontSize: "14px", margin: 0, letterSpacing: "0.08em" }}>
            ▣ OFFICIAL EVENTS BOARD
          </h1>
          <p className="font-mono text-muted" style={{ fontSize: "11px", margin: "4px 0 0 0" }}>
            Manage partner official events, venue ticketing configurations, and claims.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="nokia-btn nokia-btn-primary font-pixel"
          style={{ fontSize: "8px", padding: "8px 16px" }}
        >
          [+] CREATE EVENT
        </button>
      </div>

      {/* Global Alerts */}
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

      {/* Events Data Table */}
      <div className="nokia-panel" style={{ padding: "8px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "11px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border-strong)", color: "var(--text-secondary)" }}>
              <th style={{ padding: "10px", fontFamily: "var(--font-pixel)", fontSize: "8px" }}>EVENT TITLE</th>
              <th style={{ padding: "10px", fontFamily: "var(--font-pixel)", fontSize: "8px" }}>SCHEDULED TIME</th>
              <th style={{ padding: "10px", fontFamily: "var(--font-pixel)", fontSize: "8px" }}>VENUE</th>
              <th style={{ padding: "10px", fontFamily: "var(--font-pixel)", fontSize: "8px" }}>TYPE</th>
              <th style={{ padding: "10px", fontFamily: "var(--font-pixel)", fontSize: "8px" }}>PRICE</th>
              <th style={{ padding: "10px", fontFamily: "var(--font-pixel)", fontSize: "8px", textAlign: "center" }}>LIMIT</th>
              <th style={{ padding: "10px", fontFamily: "var(--font-pixel)", fontSize: "8px", textAlign: "right" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody style={{ color: "var(--text-primary)" }}>
            {events.length > 0 ? (
              events.map((evt) => {
                const isArtistSplit = evt.event_type === "artist_split";
                return (
                  <tr key={evt.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                    {/* Title & Desc */}
                    <td style={{ padding: "10px", fontWeight: "bold" }}>
                      <span className="font-pixel text-accent" style={{ fontSize: "8px", display: "block" }}>
                        ★ {evt.title.toUpperCase()}
                      </span>
                      {evt.description && (
                        <span className="font-mono text-muted" style={{ fontSize: "10px", display: "block", marginTop: "2px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {evt.description}
                        </span>
                      )}
                    </td>

                    {/* Time */}
                    <td style={{ padding: "10px", fontFamily: "var(--font-mono)" }}>
                      {formatScheduledAt(evt.scheduled_at)}
                    </td>

                    {/* Venue */}
                    <td style={{ padding: "10px", color: "var(--text-secondary)" }}>
                      📍 {evt.venue_name || "TBD"}
                    </td>

                    {/* Type */}
                    <td style={{ padding: "10px" }}>
                      <span className={`nokia-badge ${isArtistSplit ? "nokia-badge-primary" : "nokia-badge-success"}`} style={{ fontSize: "6px" }}>
                        {isArtistSplit ? "ARTIST SPLIT" : "PLATFORM OWNED"}
                      </span>
                    </td>

                    {/* Price */}
                    <td style={{ padding: "10px", fontWeight: "bold" }}>
                      {evt.price > 0 ? `$${evt.price}` : "FREE / VIP"}
                    </td>

                    {/* Capacity */}
                    <td style={{ padding: "10px", textAlign: "center" }}>
                      <span className="nokia-badge" style={{ fontSize: "6px" }}>
                        {evt.max_capacity} PAX
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "10px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleOpenEdit(evt)}
                          className="nokia-btn"
                          style={{ padding: "4px 8px", fontSize: "7px" }}
                          title="Edit Event"
                        >
                          ✎ EDIT
                        </button>

                        <button
                          onClick={() => handleDelete(evt.id, evt.title)}
                          disabled={actionLoadingId !== null}
                          className="nokia-btn nokia-btn-danger"
                          style={{ padding: "4px 8px", fontSize: "7px" }}
                          title="Delete Event"
                        >
                          {actionLoadingId === evt.id ? "..." : "✕ DELETE"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="font-pixel text-center" style={{ padding: "32px", color: "var(--text-muted)", fontSize: "8px" }}>
                  NO OFFICIAL EVENTS SCHEDULED.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE & MODIFY MODAL */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", backgroundColor: "rgba(0,0,0,0.6)" }}>
          <div className="nokia-panel" style={{ width: "100%", maxWidth: "500px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-strong)", paddingBottom: "10px" }}>
              <h3 className="font-pixel text-accent" style={{ fontSize: "10px", margin: 0 }}>
                ▣ {editingEvent ? "MODIFY OFFICIAL EVENT" : "SCHEDULE OFFICIAL EVENT"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ border: "none", background: "none", cursor: "pointer", fontSize: "12px", color: "var(--text-primary)" }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              
              {/* Event Title */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label className="font-pixel text-muted" style={{ fontSize: "7px" }}>
                  EVENT TITLE
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Padel Championship"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="nokia-input"
                />
              </div>

              {/* Event Description */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label className="font-pixel text-muted" style={{ fontSize: "7px" }}>
                  DESCRIPTION
                </label>
                <textarea
                  rows={2}
                  placeholder="Details and perks for attendees..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="nokia-input"
                  style={{ resize: "none" }}
                />
              </div>

              {/* Grid fields */}
              <div className="responsive-grid-2">
                {/* Venue Name */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label className="font-pixel text-muted" style={{ fontSize: "7px" }}>
                    VENUE NAME
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arena Centric"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    className="nokia-input"
                  />
                </div>

                {/* Event Type Select */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label className="font-pixel text-muted" style={{ fontSize: "7px" }}>
                    EVENT TYPE
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as any)}
                    className="nokia-input"
                    style={{ height: "38px" }}
                  >
                    <option value="platform_owned">Platform Owned</option>
                    <option value="artist_split">Artist Split</option>
                  </select>
                </div>
              </div>

              <div className="responsive-grid-3">
                {/* Ticket Price */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label className="font-pixel text-muted" style={{ fontSize: "7px" }}>
                    PRICE ($)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="nokia-input"
                  />
                </div>

                {/* Capacity */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label className="font-pixel text-muted" style={{ fontSize: "7px" }}>
                    CAPACITY (PAX)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="100"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    className="nokia-input"
                  />
                </div>

                {/* Date / Time */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label className="font-pixel text-muted" style={{ fontSize: "7px" }}>
                    DATE & TIME
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="nokia-input"
                  />
                </div>
              </div>

              {/* Form buttons */}
              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="nokia-btn"
                  style={{ flex: 1 }}
                >
                  ✕ CANCEL
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="nokia-btn nokia-btn-primary"
                  style={{ flex: 1 }}
                >
                  {isLoading ? "SAVING..." : "✓ SAVE"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
