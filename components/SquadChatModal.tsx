"use client";

import { useState, useEffect, useRef } from "react";
import { getBeaconMessages, sendBeaconMessage, getBeaconDetailsForChat, endorseSquadMember } from "@/app/actions/chat";
import { updateLiveBeacon } from "@/app/actions/beacons";
import { sendFriendRequest } from "@/app/actions/friends";

interface SquadChatModalProps {
  beaconId: string;
  beaconTitle: string;
  onClose: () => void;
}

export default function SquadChatModal({
  beaconId,
  beaconTitle,
  onClose,
}: SquadChatModalProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phase 13 Telemetry
  const [telemetry, setTelemetry] = useState<any>(null);

  // Rescheduling inline form state
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newLocation, setNewLocation] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newMapsUrl, setNewMapsUrl] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTelemetry = async () => {
    try {
      const res = await getBeaconDetailsForChat(beaconId);
      if (res.success) {
        setTelemetry(res.data);
      }
    } catch (e) {
      console.error("[SquadChatModal] Telemetry fetch failed:", e);
    }
  };

  const fetchMessages = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await getBeaconMessages(beaconId);
      if (res.success) {
        setMessages(res.data || []);
      } else {
        setError(res.error);
      }
    } catch {
      setError("Failed to fetch messages.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchMessages(true);
    fetchTelemetry();

    // Polling every 3 seconds for dynamic real-time-like updates
    const interval = setInterval(() => {
      fetchMessages(false);
      fetchTelemetry();
    }, 3000);

    return () => clearInterval(interval);
  }, [beaconId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    setError(null);
    try {
      const res = await sendBeaconMessage(beaconId, newMessage.trim());
      if (res.success) {
        setNewMessage("");
        await fetchMessages(false); // Instantly update view
      } else {
        setError(res.error);
      }
    } catch {
      setError("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleAddFriend = async (peerId: string) => {
    try {
      const res = await sendFriendRequest(peerId);
      if (res.success) {
        await fetchTelemetry();
      } else {
        alert(res.error || "Failed to send friend request.");
      }
    } catch {
      alert("Network error sending friend request.");
    }
  };

  const handleEndorse = async (peerId: string) => {
    try {
      const res = await endorseSquadMember(beaconId, peerId);
      if (res.success) {
        await fetchTelemetry();
      } else {
        alert(res.error || "Failed to submit endorsement.");
      }
    } catch {
      alert("Network error submitting endorsement.");
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!newLocation.trim()) {
      setRescheduleError("Location name is required.");
      return;
    }
    if (!newTime) {
      setRescheduleError("Scheduled date/time is required.");
      return;
    }
    setRescheduleLoading(true);
    setRescheduleError(null);
    try {
      const res = await updateLiveBeacon(beaconId, newLocation, newTime, newMapsUrl || null);
      if (res.success) {
        setIsRescheduling(false);
        await fetchTelemetry();
      } else {
        setRescheduleError(res.error);
      }
    } catch (e) {
      setRescheduleError("Reschedule failed.");
    } finally {
      setRescheduleLoading(false);
    }
  };

  const isLocked = telemetry?.beacon?.scheduled_at
    ? Date.now() > new Date(telemetry.beacon.scheduled_at).getTime() + 2 * 60 * 60 * 1000
    : false;

  return (
    <div className="squad-chat-overlay" style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      backgroundColor: "rgba(5, 10, 20, 0.85)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      backdropFilter: "blur(4px)",
    }}>
      <div className="nokia-panel page-swipe" style={{
        width: "100%",
        maxWidth: "460px",
        height: "80vh",
        minHeight: "320px",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        padding: 0,
        backgroundColor: "var(--bg-base)",
      }}>
        {/* Top Status Bar Header */}
        <div style={{
          background: "var(--accent-primary)",
          color: "white",
          padding: "8px 12px",
          borderBottom: "2px solid var(--border-strong)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span className="font-pixel" style={{ fontSize: "8px", letterSpacing: "0.08em" }}>
            📶 [ SQUAD COORDINATION ]
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            {telemetry?.beacon?.host_id === telemetry?.currentUserId && !isLocked && (
              <button
                onClick={() => {
                  setIsRescheduling(!isRescheduling);
                  // pre-populate
                  if (telemetry?.beacon) {
                    setNewLocation(telemetry.beacon.location_name || "");
                    if (telemetry.beacon.scheduled_at) {
                      const d = new Date(telemetry.beacon.scheduled_at);
                      const year = d.getFullYear();
                      const month = String(d.getMonth() + 1).padStart(2, "0");
                      const day = String(d.getDate()).padStart(2, "0");
                      const hours = String(d.getHours()).padStart(2, "0");
                      const minutes = String(d.getMinutes()).padStart(2, "0");
                      setNewTime(`${year}-${month}-${day}T${hours}:${minutes}`);
                    }
                    setNewMapsUrl(telemetry.beacon.google_maps_url || "");
                  }
                }}
                className="nokia-btn font-pixel"
                style={{
                  padding: "2px 8px",
                  fontSize: "6px",
                  background: "var(--accent-warning)",
                  color: "#111",
                  borderColor: "var(--border-strong)",
                }}
              >
                🕐 RE-SCHEDULE
              </button>
            )}
            <button
              onClick={onClose}
              className="nokia-btn font-pixel"
              style={{
                padding: "2px 8px",
                fontSize: "6px",
                background: "var(--accent-danger)",
                color: "white",
                borderColor: "var(--border-strong)",
              }}
            >
              ✕ CLOSE
            </button>
          </div>
        </div>

        {/* LCD Panel for active broadcast title & Plans details */}
        <div className="nokia-lcd" style={{
          padding: "8px 12px",
          fontSize: "11px",
          borderBottom: "2px solid var(--border-light)",
          borderRadius: 0,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}>
          <div className="font-lcd" style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase" }}>
            SQUAD: {beaconTitle}
          </div>
          {telemetry?.beacon && (
            <div style={{ fontSize: "9px", color: "var(--text-muted)", display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
              <span>📍 {telemetry.beacon.location_name || "TBD"}</span>
              {telemetry.beacon.scheduled_at && (
                <span>🕐 {new Date(telemetry.beacon.scheduled_at).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
              )}
              {telemetry.beacon.google_maps_url && (
                <a
                  href={telemetry.beacon.google_maps_url.startsWith("http") ? telemetry.beacon.google_maps_url : `https://${telemetry.beacon.google_maps_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-pixel"
                  style={{ color: "var(--accent-primary)", textDecoration: "underline", fontSize: "7px" }}
                >
                  🗺 MAPS LINK
                </a>
              )}
            </div>
          )}
        </div>

        {/* Rescheduling Form Display */}
        {isRescheduling && (
          <div className="nokia-panel-sunken" style={{ padding: "14px", margin: "12px", border: "2px solid var(--accent-warning)", background: "var(--bg-sunken)" }}>
            <div className="font-pixel" style={{ fontSize: "8px", color: "var(--accent-warning)", marginBottom: "10px" }}>
              🕐 RE-SCHEDULE EVENT PLANS
            </div>

            {rescheduleError && (
              <div style={{ color: "var(--accent-danger)", fontSize: "10px", marginBottom: "8px" }}>✕ {rescheduleError}</div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <label className="font-pixel" style={{ display: "block", fontSize: "7px", color: "var(--text-muted)", marginBottom: "4px" }}>◈ VENUE/LOCATION</label>
                <input
                  type="text"
                  className="nokia-input"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="New venue name..."
                />
              </div>

              <div>
                <label className="font-pixel" style={{ display: "block", fontSize: "7px", color: "var(--text-muted)", marginBottom: "4px" }}>▤ DATE & TIME</label>
                <input
                  type="datetime-local"
                  className="nokia-input"
                  style={{ colorScheme: "dark" }}
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
              </div>

              <div>
                <label className="font-pixel" style={{ display: "block", fontSize: "7px", color: "var(--text-muted)", marginBottom: "4px" }}>🗺 GOOGLE MAPS URL (OPTIONAL)</label>
                <input
                  type="text"
                  className="nokia-input"
                  value={newMapsUrl}
                  onChange={(e) => setNewMapsUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => setIsRescheduling(false)}
                  className="nokia-btn"
                  style={{ fontSize: "7px" }}
                >
                  ✕ CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleRescheduleSubmit}
                  disabled={rescheduleLoading}
                  className="nokia-btn nokia-btn-primary"
                  style={{ fontSize: "7px" }}
                >
                  {rescheduleLoading ? "SAVING..." : "✓ CONFIRM PLANS"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message List area */}
        <div className="nokia-panel-sunken" style={{
          flex: 1,
          overflowY: "auto",
          margin: "12px",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          backgroundColor: "var(--bg-sunken)",
        }}>
          {loading ? (
            <div style={{ textAlign: "center", margin: "auto" }}>
              <span className="font-lcd pixel-blink" style={{ fontSize: "20px", color: "var(--accent-primary)" }}>
                CONNECTING...
              </span>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", margin: "auto", color: "var(--accent-danger)" }}>
              <div className="font-pixel" style={{ fontSize: "8px" }}>[✕ ERROR]</div>
              <div style={{ fontSize: "11px", marginTop: "4px" }}>{error}</div>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: "center", margin: "auto", color: "var(--text-muted)", opacity: 0.8 }}>
              <div className="font-lcd" style={{ fontSize: "18px", color: "var(--accent-primary)" }}>
                [ READY TO CONNECT ]
              </div>
              <p className="font-mono" style={{ fontSize: "10px", marginTop: "6px" }}>
                Send a message to coordinate parking, exact spots, or meeting times.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignSelf: "stretch",
                  borderBottom: "1px dashed var(--border-light)",
                  paddingBottom: "6px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "3px" }}>
                  <span className="font-pixel text-accent" style={{ fontSize: "7px", color: "var(--accent-primary)" }}>
                    👤 {msg.profiles?.full_name?.toUpperCase() || "ANONYMOUS"}
                  </span>
                  <span className="font-mono text-muted" style={{ fontSize: "8px" }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
                <p className="font-mono" style={{ fontSize: "11px", margin: 0, whiteSpace: "pre-wrap", color: "var(--text-primary)" }}>
                  {msg.content}
                </p>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input line and submit action OR Post-Event Vibe Check Lock */}
        {isLocked ? (
          <div className="nokia-panel" style={{
            margin: "12px",
            padding: "12px",
            border: "2px solid var(--accent-success)",
            background: "rgba(51, 255, 102, 0.05)",
            boxShadow: "0 0 10px rgba(51, 255, 102, 0.2)",
          }}>
            <div className="font-lcd text-center pixel-blink" style={{
              fontSize: "14px",
              color: "var(--accent-success)",
              marginBottom: "8px",
              textShadow: "0 0 8px var(--accent-success)",
            }}>
              📶 VIBE CHECK LOCK
            </div>
            <p className="font-mono text-center text-muted" style={{ fontSize: "9.5px", marginBottom: "12px", lineHeight: "1.4" }}>
              This chat console is locked as the event ended over 2 hours ago. Boost your network by endorsing squad vibes and adding members to your phonebook!
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {telemetry?.participants
                ?.filter((p: any) => p.id !== telemetry?.currentUserId)
                ?.map((peer: any) => {
                  const isFriend = telemetry.contactsMap?.[peer.id] === "accepted";
                  const isPending = telemetry.contactsMap?.[peer.id] === "pending";
                  const isEndorsed = telemetry.endorsedIds?.includes(peer.id);

                  return (
                    <div
                      key={peer.id}
                      className="nokia-panel-sunken"
                      style={{
                        padding: "8px 10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "var(--bg-sunken)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "14px" }}>{peer.avatar_icon || "👾"}</span>
                        <span className="font-pixel" style={{ fontSize: "8px", fontWeight: "bold" }}>
                          {peer.full_name?.split(" ")[0].toUpperCase()}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "6px" }}>
                        {/* Phonebook button */}
                        {isFriend ? (
                          <span className="nokia-badge nokia-badge-success font-pixel" style={{ fontSize: "6px" }}>
                            ✓ IN PHONEBOOK
                          </span>
                        ) : isPending ? (
                          <span className="nokia-badge font-pixel" style={{ fontSize: "6px", background: "var(--bg-base)" }}>
                            ▌ PENDING
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddFriend(peer.id)}
                            className="nokia-btn nokia-btn-primary"
                            style={{ fontSize: "6px", padding: "4px 8px" }}
                          >
                            ♥ ADD TO PHONEBOOK
                          </button>
                        )}

                        {/* Endorsement button */}
                        {isEndorsed ? (
                          <span className="nokia-badge nokia-badge-success font-pixel" style={{ fontSize: "6px" }}>
                            ★ ENDORSED
                          </span>
                        ) : (
                          <button
                            onClick={() => handleEndorse(peer.id)}
                            className="nokia-btn font-pixel"
                            style={{ fontSize: "6px", padding: "4px 8px", background: "var(--accent-warning)", color: "#111" }}
                          >
                            ⭐ ENDORSE VIBE
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              {(!telemetry?.participants || telemetry.participants.filter((p: any) => p.id !== telemetry.currentUserId).length === 0) && (
                <div className="font-mono text-center text-muted" style={{ fontSize: "9px", padding: "10px" }}>
                  No other approved squad members found.
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="chat-input-form" style={{
            padding: "12px",
            borderTop: "2px solid var(--border-light)",
            display: "flex",
            gap: "8px",
          }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="TYPE COORDINATE..."
              className="nokia-input"
              style={{ flex: 1, fontSize: "11px" }}
              maxLength={500}
              disabled={sending || isRescheduling}
              required
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim() || isRescheduling}
              className="nokia-btn nokia-btn-primary"
              style={{
                padding: "6px 16px",
                fontSize: "8px",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {sending ? "..." : "✉ SEND"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
