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
import { Bell, X, CheckCheck, Sparkles } from "lucide-react";

// ── Icon map for notification types ──────────────────────────────────────────
const NOTIF_ICON: Record<string, string> = {
  beacon_near_start:       "📶",
  beacon_no_attendees:     "⚠️",
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
    setNotifications((prev) =>
      prev.filter((n) => !(n.type === "post_event_vibe_check" && n.related_beacon_id === beaconId))
    );
  };

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      {/* Sleek Dock-Styled Bell Button */}
      <button
        onClick={handleOpen}
        id="notification-bell-btn"
        type="button"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          padding: "8px 12px",
          borderRadius: "10px",
          background: isOpen ? "rgba(255, 90, 31, 0.25)" : "rgba(0, 0, 0, 0.35)",
          border: isOpen ? "1px solid rgba(255, 90, 31, 0.6)" : "1px solid rgba(255, 255, 255, 0.28)",
          color: "#FFFFFF",
          cursor: "pointer",
          position: "relative",
          transition: "all 0.15s ease",
          boxShadow: isOpen ? "0 0 14px rgba(255, 90, 31, 0.35)" : "none",
        }}
        aria-label="Notifications"
        className="hover:border-[#FF6F26] hover:bg-white/[0.08]"
      >
        <Bell className="w-4 h-4 text-white" />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "linear-gradient(135deg, #FF6F26, #FF3B30)",
              color: "white",
              borderRadius: "10px",
              padding: "1px 5px",
              minWidth: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "9.5px",
              fontWeight: 900,
              boxShadow: "0 2px 8px rgba(255, 90, 31, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.4)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Luxury Notification Dropdown Panel */}
      {isOpen && (
        <div
          id="notification-panel-dropdown"
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: "360px",
            maxWidth: "calc(100vw - 28px)",
            maxHeight: "min(520px, 80vh)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "rgba(12, 8, 18, 0.98)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border: "1px solid rgba(255, 90, 31, 0.4)",
            borderRadius: "20px",
            boxShadow:
              "0 20px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(255, 90, 31, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
          }}
        >
          {/* Panel Header */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(255, 90, 31, 0.2) 0%, rgba(20, 12, 28, 0.95) 100%)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #FF6F26, #FF5A1F)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(255, 90, 31, 0.4)",
                }}
              >
                <Bell className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 900, letterSpacing: "0.04em", color: "#FFFFFF", textTransform: "uppercase" }}>
                  Alerts &amp; Notifications
                </div>
                <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.55)", fontWeight: 600 }}>
                  Solo Radar Intelligence
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: "rgba(255, 90, 31, 0.25)",
                    border: "1px solid rgba(255, 90, 31, 0.4)",
                    color: "#FFA05C",
                    padding: "2px 7px",
                    borderRadius: "6px",
                    fontSize: "10px",
                    fontWeight: 800,
                  }}
                >
                  {unreadCount} new
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  width: "26px",
                  height: "26px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s ease",
                }}
                className="hover:bg-white/20 active:scale-95"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ overflowY: "auto", flex: 1, maxHeight: "380px" }}>
            {isLoading ? (
              <div style={{ padding: "36px", textAlign: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#FFA05C" }} className="animate-pulse">
                  Syncing alerts...
                </span>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Bell className="w-6 h-6 text-[#FFA05C]" />
                </div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF" }}>
                  All Caught Up
                </div>
                <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.6)", maxWidth: "240px", lineHeight: 1.4 }}>
                  No new notifications right now. Check back when radar invites or squad updates arrive!
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
                      padding: "12px 16px",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                      background: notif.is_read ? "transparent" : "rgba(255, 90, 31, 0.06)",
                      cursor: notif.is_read ? "default" : "pointer",
                      transition: "background 0.15s ease",
                    }}
                    className={notif.is_read ? "" : "hover:bg-white/[0.04]"}
                    onClick={() => !notif.is_read && handleMarkOne(notif.id)}
                  >
                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      {/* Icon */}
                      <span
                        style={{
                          fontSize: "18px",
                          lineHeight: 1,
                          flexShrink: 0,
                          marginTop: "2px",
                          opacity: notif.is_read ? 0.6 : 1,
                        }}
                      >
                        {NOTIF_ICON[notif.type] ?? "◈"}
                      </span>

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "12.5px",
                            fontWeight: notif.is_read ? 600 : 800,
                            color: notif.is_read ? "rgba(255, 255, 255, 0.7)" : "#FFFFFF",
                            marginBottom: "2px",
                          }}
                        >
                          {notif.title}
                        </div>
                        <div
                          style={{
                            fontSize: "11.5px",
                            color: "rgba(255, 255, 255, 0.55)",
                            lineHeight: "1.45",
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
                                style={{
                                  background: "linear-gradient(135deg, #FF6F26, #FF5A1F)",
                                  border: "none",
                                  color: "white",
                                  fontSize: "10px",
                                  fontWeight: 800,
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                }}
                              >
                                ⭐ Rate the Vibe
                              </button>
                            ) : (
                              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                {[
                                  { val: "vibe_matched" as const, label: "⭐ Vibe Matched", bg: "rgba(39, 201, 63, 0.2)", color: "#27C93F" },
                                  { val: "meh" as const, label: "😐 Meh", bg: "rgba(255, 149, 0, 0.2)", color: "#FF9500" },
                                  { val: "no_show_zone" as const, label: "✕ No Shows", bg: "rgba(255, 59, 48, 0.2)", color: "#FF3B30" },
                                ].map(({ val, label, bg, color }) => (
                                  <button
                                    key={val}
                                    disabled={vibeSending}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleVibeRate(notif.related_beacon_id!, val);
                                    }}
                                    style={{
                                      fontSize: "10px",
                                      fontWeight: 800,
                                      padding: "4px 8px",
                                      background: bg,
                                      color: color,
                                      border: `1px solid ${color}`,
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                    }}
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
                          style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.4)", marginTop: "4px", fontWeight: 600 }}
                        >
                          {timeAgo(notif.created_at)}
                        </div>
                      </div>

                      {/* Unread dot */}
                      {!notif.is_read && (
                        <span
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            background: "#FF5A1F",
                            boxShadow: "0 0 6px rgba(255, 90, 31, 0.8)",
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
                padding: "10px 14px",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                background: "rgba(0, 0, 0, 0.35)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.55)", fontWeight: 600 }}>
                {notifications.filter((n) => !n.is_read).length} unread
              </span>
              <button
                onClick={async () => {
                  await markAllRead();
                  setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                  setUnreadCount(0);
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#FFFFFF",
                  padding: "5px 12px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                className="hover:bg-white/15"
              >
                Mark all read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
