"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getUnreadCount,
  getNotifications,
  markAllRead,
  markOneRead,
  submitVibeFeedback,
} from "@/app/actions/notifications";
import type { Notification } from "@/lib/supabase/types";

// ── Icon map for notification types ──────────────────────────────────────────
const NOTIF_ICON: Record<string, string> = {
  beacon_near_start:       "📶",
  beacon_no_attendees:     "⚠",
  beacon_not_full:         "◉",
  beacon_no_interest:      "😶",
  attendance_reminder:     "📅",
  post_event_vibe_check:   "⭐",
  beacon_full:             "🎉",
  application_approved:    "✓",
  application_declined:    "✕",
  guest_withdrew:          "⊠",
  beacon_cancelled:        "⊗",
  capacity_changed:        "◉",
  new_request_pending:     "▶",
  pending_request_reminder:"⏱",
  spot_available:          "🔔",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vibeBeaconId, setVibeBeaconId] = useState<string | null>(null);
  const [vibeSending, setVibeSending] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Poll unread count every 60s
  useEffect(() => {
    const fetchCount = async () => {
      const res = await getUnreadCount();
      if (res.success) setUnreadCount(res.data ?? 0);
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const handleOpen = async () => {
    if (isOpen) { setIsOpen(false); return; }
    setIsOpen(true);
    setIsLoading(true);
    const res = await getNotifications();
    if (res.success) setNotifications(res.data ?? []);
    setIsLoading(false);

    // Mark all as read when panel opens
    if (unreadCount > 0) {
      await markAllRead();
      setUnreadCount(0);
    }
  };

  const handleMarkOne = async (id: string) => {
    await markOneRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleVibeRate = async (beaconId: string, rating: "vibe_matched" | "meh" | "no_show_zone") => {
    setVibeSending(true);
    await submitVibeFeedback(beaconId, rating);
    setVibeSending(false);
    setVibeBeaconId(null);
    // Remove vibe check notifications for this beacon from the list
    setNotifications((prev) =>
      prev.filter((n) => !(n.type === "post_event_vibe_check" && n.related_beacon_id === beaconId))
    );
  };

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className="nokia-btn"
        id="notification-bell-btn"
        style={{
          padding: "3px 10px",
          fontSize: "7px",
          fontFamily: "var(--font-pixel)",
          letterSpacing: "0.06em",
          color: "var(--statusbar-text)",
          background: isOpen ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.2)",
          border: "2px solid var(--border-strong)",
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: "5px",
        }}
        aria-label="Notifications"
      >
        <span style={{ fontSize: "14px", lineHeight: 1 }}>🔔</span>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "var(--accent-danger)",
              color: "white",
              borderRadius: "50%",
              width: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "8px",
              fontFamily: "var(--font-pixel)",
              fontWeight: "bold",
              border: "1px solid var(--border-strong)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div
          className="nokia-panel page-swipe"
          style={{
            position: "fixed",
            top: "32px",
            right: "8px",
            width: "min(340px, calc(100vw - 16px))",
            maxHeight: "min(480px, 80vh)",
            zIndex: 9998,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            backgroundColor: "var(--bg-base)",
          }}
        >
          {/* Panel Header */}
          <div
            style={{
              background: "var(--accent-primary)",
              color: "white",
              padding: "8px 12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "2px solid var(--border-strong)",
              flexShrink: 0,
            }}
          >
            <span className="font-pixel" style={{ fontSize: "7px", letterSpacing: "0.08em" }}>
              🔔 ALERTS &amp; NOTIFICATIONS
            </span>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "white",
                cursor: "pointer",
                fontSize: "12px",
                padding: 0,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {isLoading ? (
              <div style={{ padding: "24px", textAlign: "center" }}>
                <span className="font-lcd pixel-blink" style={{ fontSize: "18px", color: "var(--accent-primary)" }}>
                  LOADING...
                </span>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <div className="font-lcd" style={{ fontSize: "22px", color: "var(--text-muted)" }}>
                  ALL CLEAR
                </div>
                <div className="font-pixel" style={{ fontSize: "6px", color: "var(--text-muted)", marginTop: "6px", letterSpacing: "0.06em" }}>
                  NO NEW NOTIFICATIONS
                </div>
              </div>
            ) : (
              notifications.map((notif) => {
                const isVibeCheck = notif.type === "post_event_vibe_check" && notif.related_beacon_id;
                const showingVibe = vibeBeaconId === notif.related_beacon_id;
                return (
                  <div
                    key={notif.id}
                    style={{
                      padding: "10px 12px",
                      borderBottom: "1px solid var(--border-light)",
                      background: notif.is_read ? "transparent" : "var(--accent-glow)",
                      cursor: notif.is_read ? "default" : "pointer",
                    }}
                    onClick={() => !notif.is_read && handleMarkOne(notif.id)}
                  >
                    <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                      {/* Icon */}
                      <span
                        style={{
                          fontSize: "16px",
                          lineHeight: 1,
                          flexShrink: 0,
                          marginTop: "1px",
                          opacity: notif.is_read ? 0.5 : 1,
                        }}
                      >
                        {NOTIF_ICON[notif.type] ?? "◈"}
                      </span>

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          className="font-pixel"
                          style={{
                            fontSize: "7px",
                            letterSpacing: "0.06em",
                            color: notif.is_read ? "var(--text-muted)" : "var(--text-primary)",
                            marginBottom: "3px",
                          }}
                        >
                          {notif.title}
                        </div>
                        <div
                          className="font-mono"
                          style={{
                            fontSize: "10px",
                            color: "var(--text-muted)",
                            lineHeight: "1.4",
                            wordBreak: "break-word",
                          }}
                        >
                          {notif.body}
                        </div>

                        {/* Vibe Rating UI */}
                        {isVibeCheck && (
                          <div style={{ marginTop: "8px" }}>
                            {!showingVibe ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setVibeBeaconId(notif.related_beacon_id!);
                                }}
                                className="nokia-btn nokia-btn-primary"
                                style={{ fontSize: "6px", padding: "4px 10px" }}
                              >
                                ⭐ RATE THE VIBE
                              </button>
                            ) : (
                              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                {[
                                  { val: "vibe_matched" as const, label: "⭐ VIBE MATCHED", color: "var(--accent-success)" },
                                  { val: "meh" as const, label: "😐 MEH", color: "var(--accent-warning)" },
                                  { val: "no_show_zone" as const, label: "✕ NO SHOWS", color: "var(--accent-danger)" },
                                ].map(({ val, label, color }) => (
                                  <button
                                    key={val}
                                    disabled={vibeSending}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleVibeRate(notif.related_beacon_id!, val);
                                    }}
                                    className="nokia-btn"
                                    style={{ fontSize: "6px", padding: "4px 8px", background: color, color: "white", borderColor: "var(--border-strong)" }}
                                  >
                                    {vibeSending ? "..." : label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Timestamp */}
                        <div
                          className="font-mono"
                          style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "4px", opacity: 0.7 }}
                        >
                          {timeAgo(notif.created_at)}
                        </div>
                      </div>

                      {/* Unread dot */}
                      {!notif.is_read && (
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: "var(--accent-primary)",
                            flexShrink: 0,
                            marginTop: "4px",
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: "8px 12px",
                borderTop: "2px solid var(--border-light)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <span className="font-pixel" style={{ fontSize: "6px", color: "var(--text-muted)" }}>
                {notifications.filter((n) => !n.is_read).length} UNREAD
              </span>
              <button
                onClick={async () => {
                  await markAllRead();
                  setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                  setUnreadCount(0);
                }}
                className="nokia-btn"
                style={{ fontSize: "6px", padding: "3px 8px" }}
              >
                ✓ MARK ALL READ
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
