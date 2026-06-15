"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { approveApplicant, declineApplicant, flagNoShow } from "@/app/actions/applications";
import { cancelBeacon, updateBeaconCapacity } from "@/app/actions/beacons";
import type { Beacon, BeaconCategory } from "@/lib/supabase/types";
import SquadChatModal from "@/components/SquadChatModal";

// ─── Category Labels ─────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<BeaconCategory, string> = {
  sports: "SPORTS",
  casual: "CASUAL",
  nightlife: "NIGHTLIFE",
};

function formatScheduledAt(iso: string | null): string {
  if (!iso) return "Time TBD";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface ApplicationWithProfile {
  id: string;
  beacon_id: string;
  applicant_id: string;
  status: "pending" | "approved" | "declined";
  created_at: string;
  flagged_ghost?: boolean;
  profiles: {
    full_name: string | null;
    bio: string | null;
  } | null;
}

interface JoinedBeaconWithHost extends Beacon {}

interface ManageHostDashboardProps {
  beacons: Beacon[];
  initialApplications: ApplicationWithProfile[];
  joinedBeacons?: JoinedBeaconWithHost[];
}

// ─── Main Host Dashboard Component ──────────────────────────────────────────
export default function ManageHostDashboard({
  beacons,
  initialApplications,
  joinedBeacons = [],
}: ManageHostDashboardProps) {
  const [activeTab, setActiveTab] = useState<"broadcasts" | "squads">("broadcasts");
  const [applications, setApplications] = useState<ApplicationWithProfile[]>(initialApplications);
  const [localBeacons, setLocalBeacons] = useState<Beacon[]>(beacons);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Capacity editor state: beaconId → temp new value
  const [capacityEdits, setCapacityEdits] = useState<Record<string, number>>({});
  const [capacityLoading, setCapacityLoading] = useState<string | null>(null);
  const [capacityError, setCapacityError] = useState<string | null>(null);

  // Cancel beacon state
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Active chat state
  const [chatBeaconId, setChatBeaconId] = useState<string | null>(null);
  const [chatBeaconTitle, setChatBeaconTitle] = useState<string>("");

  const handleFlagNoShow = async (appId: string) => {
    setActionLoadingId(appId);
    setErrorMsg(null);
    try {
      const result = await flagNoShow(appId);
      if (result.success) {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === appId ? { ...app, flagged_ghost: true } : app
          )
        );
      } else {
        setErrorMsg(result.error);
      }
    } catch {
      setErrorMsg("Failed to flag no-show due to a network connection issue.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApprove = async (appId: string, beaconId: string) => {
    setActionLoadingId(appId);
    setErrorMsg(null);
    try {
      const result = await approveApplicant(appId);
      if (result.success) {
        // 1. Update application status locally
        setApplications((prev) =>
          prev.map((app) => (app.id === appId ? { ...app, status: "approved" as const } : app))
        );
        // 2. Increment filled slots on corresponding beacon locally
        setLocalBeacons((prev) =>
          prev.map((b) =>
            b.id === beaconId && b.filled_slots < b.total_slots
              ? { ...b, filled_slots: b.filled_slots + 1 }
              : b
          )
        );
      } else {
        setErrorMsg(result.error);
      }
    } catch {
      setErrorMsg("Failed to approve applicant due to a network connection issue.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDecline = async (appId: string) => {
    setActionLoadingId(appId);
    setErrorMsg(null);
    try {
      const result = await declineApplicant(appId);
      if (result.success) {
        // Update application status locally
        setApplications((prev) =>
          prev.map((app) => (app.id === appId ? { ...app, status: "declined" as const } : app))
        );
      } else {
        setErrorMsg(result.error);
      }
    } catch {
      setErrorMsg("Failed to decline applicant due to a network connection issue.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (beaconId: string) => {
    setCancellingId(beaconId);
    setCancelError(null);
    try {
      const result = await cancelBeacon(beaconId);
      if (result.success) {
        setLocalBeacons((prev) =>
          prev.map((b) => b.id === beaconId ? { ...b, status: "cancelled" as const } : b)
        );
      } else {
        setCancelError(result.error);
      }
    } catch {
      setCancelError("Failed to cancel beacon. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleCapacityUpdate = async (beaconId: string, newTotal: number) => {
    setCapacityLoading(beaconId);
    setCapacityError(null);
    try {
      const result = await updateBeaconCapacity(beaconId, newTotal);
      if (result.success) {
        setLocalBeacons((prev) =>
          prev.map((b) => b.id === beaconId ? { ...b, total_slots: newTotal } : b)
        );
        // Clear the edit state
        setCapacityEdits((prev) => { const next = { ...prev }; delete next[beaconId]; return next; });
      } else {
        setCapacityError(result.error);
      }
    } catch {
      setCapacityError("Failed to update capacity. Please try again.");
    } finally {
      setCapacityLoading(null);
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      {/* ── Header Bevel Panel ──────────────────────────────────────────────── */}
      <div className="nokia-panel-sunken" style={{ padding: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="font-pixel text-accent" style={{ fontSize: "14px", margin: 0, letterSpacing: "0.08em" }}>
            ▣ COORDINATION & SQUADS
          </h1>
          <p className="font-mono text-muted" style={{ fontSize: "11px", margin: "4px 0 0 0" }}>
            Manage beacons you broadcast and coordinate with squads you joined.
          </p>
        </div>
        <Link href="/dashboard" className="nokia-btn font-pixel" style={{ fontSize: "8px", padding: "6px 12px" }}>
          ◀ LOBBY FEED
        </Link>
      </div>

      {/* Global Error Banner */}
      {errorMsg && (
        <div className="nokia-panel-raised" style={{ borderColor: "var(--accent-danger)", padding: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="font-pixel text-danger" style={{ fontSize: "9px" }}>[✕ ERROR]</span>
          <span className="font-mono text-danger" style={{ fontSize: "11px" }}>{errorMsg}</span>
        </div>
      )}

      {/* Tab Switcher Grid */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("broadcasts")}
          className={activeTab === "broadcasts" ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
          style={{ flex: 1, padding: "10px", fontSize: "8px", fontFamily: "var(--font-pixel)" }}
        >
          ⊙ MY BROADCASTS ({localBeacons.length})
        </button>
        <button
          onClick={() => setActiveTab("squads")}
          className={activeTab === "squads" ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
          style={{ flex: 1, padding: "10px", fontSize: "8px", fontFamily: "var(--font-pixel)" }}
        >
          👥 MY JOINED SQUADS ({joinedBeacons.length})
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === "broadcasts" ? (
        /* MY BROADCASTS TAB */
        localBeacons.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {localBeacons.map((beacon) => {
              const beaconApps = applications.filter((app) => app.beacon_id === beacon.id);

              return (
                <div key={beacon.id} className="nokia-panel" style={{ padding: "16px" }}>
                  
                  {/* Beacon Details Sub-panel */}
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", borderBottom: "2px solid var(--border-light)", paddingBottom: "12px", marginBottom: "12px" }}>
                    <div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
                        <span className={`nokia-badge ${
                          beacon.category === "sports"
                            ? "nokia-badge-primary"
                            : beacon.category === "casual"
                            ? "nokia-badge-warning"
                            : "nokia-badge-danger"
                        }`}>
                          ● {CATEGORY_LABELS[beacon.category]}
                        </span>
                        <span className="font-pixel text-muted" style={{ fontSize: "7px" }}>
                          {beacon.visibility_mode === "friend" ? "♦ FRIENDS ONLY" : "◈ OPEN TO ALL"}
                        </span>
                      </div>
                      <h3 className="font-pixel" style={{ fontSize: "11px", margin: 0, textTransform: "uppercase" }}>
                        {beacon.title}
                      </h3>
                      <div className="font-mono text-muted" style={{ fontSize: "11px", marginTop: "6px" }}>
                        <span>🕐 {formatScheduledAt(beacon.scheduled_at)}</span>
                        {beacon.location_name && (
                          <span style={{ marginLeft: "12px" }}>📍 {beacon.location_name}</span>
                        )}
                      </div>
                    </div>

                    {/* Capacity + Cancel Controls */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                      <button
                        onClick={() => {
                          setChatBeaconTitle(beacon.title);
                          setChatBeaconId(beacon.id);
                        }}
                        className="nokia-btn nokia-btn-primary"
                        style={{ padding: "6px 12px", fontSize: "8px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        💬 SQUAD CHAT
                      </button>

                      {/* Inline capacity adjuster */}
                      <div style={{ textAlign: "right" }}>
                        <div className="font-pixel text-muted" style={{ fontSize: "6px", marginBottom: "4px" }}>SQUAD CAPACITY</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button
                            className="nokia-btn"
                            style={{ padding: "2px 8px", fontSize: "12px", lineHeight: 1 }}
                            disabled={capacityLoading === beacon.id}
                            onClick={() => {
                              const current = capacityEdits[beacon.id] ?? beacon.total_slots;
                              const next = Math.max(beacon.filled_slots, Math.max(1, current - 1));
                              setCapacityEdits((p) => ({ ...p, [beacon.id]: next }));
                            }}
                          >
                            −
                          </button>
                          <span className="font-lcd" style={{ fontSize: "18px", color: "var(--accent-primary)", minWidth: "24px", textAlign: "center" }}>
                            {capacityEdits[beacon.id] ?? beacon.total_slots}
                          </span>
                          <button
                            className="nokia-btn"
                            style={{ padding: "2px 8px", fontSize: "12px", lineHeight: 1 }}
                            disabled={capacityLoading === beacon.id}
                            onClick={() => {
                              const current = capacityEdits[beacon.id] ?? beacon.total_slots;
                              const next = Math.min(10, current + 1);
                              setCapacityEdits((p) => ({ ...p, [beacon.id]: next }));
                            }}
                          >
                            +
                          </button>
                          {capacityEdits[beacon.id] !== undefined && capacityEdits[beacon.id] !== beacon.total_slots && (
                            <button
                              className="nokia-btn nokia-btn-primary"
                              style={{ padding: "3px 8px", fontSize: "7px" }}
                              disabled={capacityLoading === beacon.id}
                              onClick={() => handleCapacityUpdate(beacon.id, capacityEdits[beacon.id])}
                            >
                              {capacityLoading === beacon.id ? "..." : "✓ SAVE"}
                            </button>
                          )}
                        </div>
                        {capacityError && <div className="font-pixel" style={{ fontSize: "6px", color: "var(--accent-danger)", marginTop: "4px", maxWidth: "200px" }}>{capacityError}</div>}
                      </div>

                      <div style={{ display: "flex", gap: "4px", marginTop: "2px", justifyContent: "flex-end" }}>
                        {Array.from({ length: beacon.total_slots }).map((_, idx) => (
                          <span
                            key={idx}
                            style={{
                              width: "8px",
                              height: "8px",
                              border: "1px solid var(--border-strong)",
                              backgroundColor: idx < beacon.filled_slots ? "var(--accent-primary)" : "var(--bg-sunken)",
                              display: "inline-block",
                              borderRadius: "1px",
                            }}
                          />
                        ))}
                      </div>

                      {/* Cancel button — only when 0 attendees */}
                      {beacon.filled_slots === 0 && beacon.status === "active" && (
                        <button
                          onClick={() => handleCancel(beacon.id)}
                          disabled={cancellingId === beacon.id}
                          className="nokia-btn nokia-btn-danger"
                          style={{ padding: "4px 10px", fontSize: "7px" }}
                          title="Cancel this beacon. Only available when no one has joined."
                        >
                          {cancellingId === beacon.id ? "..." : "⊠ CANCEL BEACON"}
                        </button>
                      )}
                      {beacon.status === "cancelled" && (
                        <span className="nokia-badge nokia-badge-danger" style={{ fontSize: "7px" }}>⊗ CANCELLED</span>
                      )}
                      {cancelError && beacon.filled_slots > 0 && (
                        <div className="font-pixel" style={{ fontSize: "6px", color: "var(--accent-danger)", maxWidth: "180px", textAlign: "right" }}>{cancelError}</div>
                      )}
                    </div>
                  </div>

                  {/* Applications Section */}
                  <div style={{ marginTop: "12px" }}>
                    <h4 className="font-pixel text-muted" style={{ fontSize: "8px", marginBottom: "8px", letterSpacing: "0.05em" }}>
                      ▶ JOIN REQUESTS ({beaconApps.length})
                    </h4>

                    {beaconApps.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {beaconApps.map((app) => (
                          <div
                            key={app.id}
                            className="nokia-panel-sunken"
                            style={{
                              padding: "12px",
                              borderLeft: app.status === "approved"
                                ? "4px solid var(--accent-success)"
                                : app.status === "declined"
                                ? "4px solid var(--accent-danger)"
                                : "4px solid var(--border-mid)",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                              <div style={{ flex: 1 }} className="applicant-profile-col">
                                <span className="font-pixel text-accent" style={{ fontSize: "8px", display: "block" }}>
                                  👤 {app.profiles?.full_name || "ANONYMOUS MEMBER"}
                                </span>
                                {app.profiles?.bio && (
                                  <p className="font-mono text-muted" style={{ fontSize: "11px", margin: "4px 0 0 0", fontStyle: "italic" }}>
                                    &ldquo;{app.profiles.bio}&rdquo;
                                  </p>
                                )}
                              </div>

                              {/* Actions or Badges */}
                              <div style={{ display: "flex", gap: "8px", alignItems: "center" }} className="applicant-actions">
                                {app.status === "approved" ? (
                                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                    <span className="nokia-badge nokia-badge-success">✓ APPROVED</span>
                                    {app.flagged_ghost ? (
                                      <span className="nokia-badge nokia-badge-danger">👻 GHOSTED</span>
                                    ) : (
                                      <button
                                        onClick={() => handleFlagNoShow(app.id)}
                                        disabled={actionLoadingId !== null}
                                        className="nokia-btn nokia-btn-danger"
                                        style={{ padding: "4px 8px", fontSize: "7px" }}
                                        title="Flag applicant as a no-show. Suspends account on 2nd strike."
                                      >
                                        {actionLoadingId === app.id ? "..." : "FLAG NO-SHOW 👻"}
                                      </button>
                                    )}
                                  </div>
                                ) : app.status === "declined" ? (
                                  <span className="nokia-badge">✕ DECLINED</span>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleDecline(app.id)}
                                      disabled={actionLoadingId !== null}
                                      className="nokia-btn"
                                      style={{ padding: "4px 8px", fontSize: "7px" }}
                                    >
                                      {actionLoadingId === app.id ? "..." : "✕ DECLINE"}
                                    </button>

                                    <button
                                      onClick={() => handleApprove(app.id, beacon.id)}
                                      disabled={actionLoadingId !== null || beacon.filled_slots >= beacon.total_slots}
                                      className="nokia-btn nokia-btn-primary"
                                      style={{ padding: "4px 8px", fontSize: "7px" }}
                                    >
                                      {actionLoadingId === app.id ? "..." : "✓ APPROVE"}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="nokia-panel-sunken font-mono text-muted" style={{ padding: "16px", fontStyle: "italic", textAlign: "center", fontSize: "11px" }}>
                        No join requests yet. When members apply, they will show up here.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="nokia-panel" style={{ padding: "32px", textAlign: "center" }}>
            <div className="nokia-lcd" style={{ fontSize: "20px", marginBottom: "16px" }}>
              EMPTY BROADCASTS
            </div>
            <p className="font-mono text-muted" style={{ fontSize: "11px", marginBottom: "16px", maxWidth: "400px", marginInline: "auto" }}>
              You are not hosting any active Beacons. Broadcast your first Beacon from the Lobby Feed to get matching!
            </p>
            <Link href="/dashboard" className="nokia-btn nokia-btn-primary">
              ◀ GO TO LOBBY
            </Link>
          </div>
        )
      ) : (
        /* MY JOINED SQUADS TAB */
        joinedBeacons.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {joinedBeacons.map((beacon) => (
              <div key={beacon.id} className="nokia-panel" style={{ padding: "16px" }}>
                
                {/* Squad header */}
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", borderBottom: "2px solid var(--border-light)", paddingBottom: "12px", marginBottom: "12px" }}>
                  <div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
                      <span className={`nokia-badge ${
                        beacon.category === "sports"
                          ? "nokia-badge-primary"
                          : beacon.category === "casual"
                          ? "nokia-badge-warning"
                          : "nokia-badge-danger"
                      }`}>
                        ● {CATEGORY_LABELS[beacon.category]}
                      </span>
                      <span className="font-pixel text-accent" style={{ fontSize: "7px" }}>
                        👤 HOST: {(beacon.profiles as any)?.full_name?.toUpperCase() || "ANONYMOUS"}
                      </span>
                    </div>
                    <h3 className="font-pixel" style={{ fontSize: "11px", margin: 0, textTransform: "uppercase" }}>
                      {beacon.title}
                    </h3>
                    <div className="font-mono text-muted" style={{ fontSize: "11px", marginTop: "6px" }}>
                      <span>🕐 {formatScheduledAt(beacon.scheduled_at)}</span>
                      {beacon.location_name && (
                        <span style={{ marginLeft: "12px" }}>📍 {beacon.location_name}</span>
                      )}
                    </div>
                  </div>

                  {/* Joined Squad Chat action & dots */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                    <button
                      onClick={() => {
                        setChatBeaconTitle(beacon.title);
                        setChatBeaconId(beacon.id);
                      }}
                      className="nokia-btn nokia-btn-primary"
                      style={{ padding: "6px 12px", fontSize: "8px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      💬 SQUAD CHAT
                    </button>
                    
                    <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                      {Array.from({ length: beacon.total_slots }).map((_, idx) => (
                        <span
                          key={idx}
                          style={{
                            width: "8px",
                            height: "8px",
                            border: "1px solid var(--border-strong)",
                            backgroundColor: idx < beacon.filled_slots ? "var(--accent-primary)" : "var(--bg-sunken)",
                            display: "inline-block",
                            borderRadius: "1px",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {beacon.description && (
                  <div className="nokia-panel-sunken font-mono text-muted" style={{ padding: "10px", fontSize: "11px", fontStyle: "italic" }}>
                    &ldquo;{beacon.description}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="nokia-panel" style={{ padding: "32px", textAlign: "center" }}>
            <div className="nokia-lcd" style={{ fontSize: "20px", marginBottom: "16px" }}>
              NO JOINED SQUADS
            </div>
            <p className="font-mono text-muted" style={{ fontSize: "11px", marginBottom: "16px", maxWidth: "400px", marginInline: "auto" }}>
              You are not a member of any approved squads yet. Request to join active Beacons in the Lobby and wait for host approvals!
            </p>
            <Link href="/dashboard" className="nokia-btn nokia-btn-primary">
              ◀ GO TO LOBBY
            </Link>
          </div>
        )
      )}

      {/* Render Squad Coordination Chat Console Overlay */}
      {chatBeaconId && (
        <SquadChatModal
          beaconId={chatBeaconId}
          beaconTitle={chatBeaconTitle}
          onClose={() => {
            setChatBeaconId(null);
            setChatBeaconTitle("");
          }}
        />
      )}
    </div>
  );
}
