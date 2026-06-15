"use client";

import { useState } from "react";
import Link from "next/link";
import { acceptFriendRequest, removeFriend } from "@/app/actions/friends";

interface ProfileItem {
  id: string;
  full_name: string | null;
  subscription_tier: string;
}

interface RelationItem {
  id: string;
  user_id_1: string;
  user_id_2: string;
  status: "pending" | "accepted" | "blocked";
  created_at: string;
  user_1_profile: ProfileItem | null;
  user_2_profile: ProfileItem | null;
}

interface NetworkHubClientProps {
  initialRelations: RelationItem[];
  currentUserId: string;
}

export default function NetworkHubClient({
  initialRelations,
  currentUserId,
}: NetworkHubClientProps) {
  const [relations, setRelations] = useState<RelationItem[]>(initialRelations);
  const [activeTab, setActiveTab] = useState<"circle" | "pending">("circle");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAccept = async (relationId: string) => {
    setActionLoadingId(relationId);
    setErrorMsg(null);
    try {
      const res = await acceptFriendRequest(relationId);
      if (res.success) {
        setRelations((prev) =>
          prev.map((r) => (r.id === relationId ? { ...r, status: "accepted" as const } : r))
        );
      } else {
        setErrorMsg(res.error);
      }
    } catch {
      setErrorMsg("Failed to accept request due to network connection issues.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineOrRemove = async (relationId: string) => {
    setActionLoadingId(relationId);
    setErrorMsg(null);
    try {
      const res = await removeFriend(relationId);
      if (res.success) {
        setRelations((prev) => prev.filter((r) => r.id !== relationId));
      } else {
        setErrorMsg(res.error);
      }
    } catch {
      setErrorMsg("Failed to complete request due to network connection issues.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Helper to extract relevant profile details of the other user in the relationship
  const getOtherUserProfile = (relation: RelationItem): ProfileItem => {
    if (relation.user_id_1 === currentUserId) {
      return relation.user_2_profile || { id: relation.user_id_2, full_name: "Anonymous Member", subscription_tier: "none" };
    }
    return relation.user_1_profile || { id: relation.user_id_1, full_name: "Anonymous Member", subscription_tier: "none" };
  };

  // Lists
  const myCircle = relations.filter((r) => r.status === "accepted");
  const pendingRequests = relations.filter((r) => r.status === "pending" && r.user_id_2 === currentUserId);
  const sentPendingRequests = relations.filter((r) => r.status === "pending" && r.user_id_1 === currentUserId);

  return (
    <div style={{ padding: "16px" }}>
      {/* ── Header Bevel Panel ──────────────────────────────────────────────── */}
      <div className="nokia-panel-sunken" style={{ padding: "16px", marginBottom: "20px" }}>
        <h1 className="font-pixel text-accent" style={{ fontSize: "14px", margin: 0, letterSpacing: "0.08em" }}>
          ▣ NETWORK HUB
        </h1>
        <p className="font-mono text-muted" style={{ fontSize: "11px", margin: "4px 0 0 0" }}>
          Manage matches, make real-world connections, and expand your circle.
        </p>
      </div>

      {/* Global Error message */}
      {errorMsg && (
        <div className="nokia-panel-raised" style={{ borderColor: "var(--accent-danger)", padding: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="font-pixel text-danger" style={{ fontSize: "9px" }}>[✕ ERROR]</span>
          <span className="font-mono text-danger" style={{ fontSize: "11px" }}>{errorMsg}</span>
        </div>
      )}

      {/* Retro Nokia Tab Selector */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--border-strong)", gap: "4px", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("circle")}
          className="font-pixel"
          style={{
            padding: "8px 16px",
            fontSize: "8px",
            background: activeTab === "circle" ? "var(--bg-sunken)" : "var(--bg-raised)",
            color: activeTab === "circle" ? "var(--accent-primary)" : "var(--text-primary)",
            border: "2px solid var(--border-strong)",
            borderBottom: activeTab === "circle" ? "2px solid transparent" : "2px solid var(--border-strong)",
            marginBottom: activeTab === "circle" ? "-2px" : "0",
            cursor: "pointer",
          }}
        >
          ● CIRCLE ({myCircle.length})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className="font-pixel"
          style={{
            padding: "8px 16px",
            fontSize: "8px",
            background: activeTab === "pending" ? "var(--bg-sunken)" : "var(--bg-raised)",
            color: activeTab === "pending" ? "var(--accent-primary)" : "var(--text-primary)",
            border: "2px solid var(--border-strong)",
            borderBottom: activeTab === "pending" ? "2px solid transparent" : "2px solid var(--border-strong)",
            marginBottom: activeTab === "pending" ? "-2px" : "0",
            cursor: "pointer",
          }}
        >
          ✉ REQUESTS ({pendingRequests.length})
        </button>
      </div>

      {/* Dynamic Tab Panel content */}
      {activeTab === "circle" ? (
        /* ─── TAB: MY CIRCLE ────────────────────────────────────────────── */
        <div>
          {myCircle.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
              {myCircle.map((relation) => {
                const friend = getOtherUserProfile(relation);
                const isFamily = friend.subscription_tier === "family";
                return (
                  <div
                    key={relation.id}
                    className="nokia-panel"
                    style={{ padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}
                  >
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", minWidth: 0 }}>
                      {/* Sunken Avatar Initials Block */}
                      <div className="nokia-panel-sunken font-pixel text-accent" style={{
                        width: "36px",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "bold",
                        flexShrink: 0,
                      }}>
                        {friend.full_name ? friend.full_name.charAt(0).toUpperCase() : "?"}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <Link
                          href={`/profile/${friend.id}`}
                          className="font-pixel text-accent"
                          style={{ fontSize: "9px", textDecoration: "none", display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}
                        >
                          {friend.full_name || "ANONYMOUS"}
                        </Link>
                        <div style={{ marginTop: "4px" }}>
                          <span className={`nokia-badge ${isFamily ? "nokia-badge-warning" : "nokia-badge-primary"}`} style={{ fontSize: "6px" }}>
                            {isFamily ? "♦ FAMILY" : "● MEMBER"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeclineOrRemove(relation.id)}
                      disabled={actionLoadingId === relation.id}
                      className="nokia-btn nokia-btn-danger"
                      style={{ padding: "4px 8px", fontSize: "7px" }}
                    >
                      {actionLoadingId === relation.id ? "..." : "✕ REMOVE"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="nokia-panel" style={{ padding: "32px", textAlign: "center" }}>
              <div className="nokia-lcd" style={{ fontSize: "20px", marginBottom: "16px" }}>
                EMPTY CIRCLE
              </div>
              <p className="font-mono text-muted" style={{ fontSize: "11px", marginBottom: "16px", maxWidth: "400px", marginInline: "auto" }}>
                Start making connections! Find interesting members in lobby events, add them, and sync up here.
              </p>
              <Link href="/dashboard" className="nokia-btn nokia-btn-primary">
                ◀ GO TO LOBBY
              </Link>
            </div>
          )}
        </div>
      ) : (
        /* ─── TAB: PENDING REQUESTS ─────────────────────────────────────── */
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Received Requests */}
          <div>
            <h3 className="font-pixel text-muted" style={{ fontSize: "8px", marginBottom: "12px", letterSpacing: "0.05em" }}>
              ▶ RECEIVED REQUESTS ({pendingRequests.length})
            </h3>
            {pendingRequests.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {pendingRequests.map((relation) => {
                  const sender = getOtherUserProfile(relation);
                  return (
                    <div
                      key={relation.id}
                      className="nokia-panel"
                      style={{ padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}
                    >
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <div className="nokia-panel-sunken font-pixel text-accent" style={{
                          width: "32px",
                          height: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          flexShrink: 0,
                        }}>
                          {sender.full_name ? sender.full_name.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div>
                          <Link
                            href={`/profile/${sender.id}`}
                            className="font-pixel text-accent"
                            style={{ fontSize: "9px", textDecoration: "none" }}
                          >
                            {sender.full_name || "ANONYMOUS MEMBER"}
                          </Link>
                          <div className="font-mono text-muted" style={{ fontSize: "11px", marginTop: "2px" }}>
                            wants to connect
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => handleDeclineOrRemove(relation.id)}
                          disabled={actionLoadingId !== null}
                          className="nokia-btn"
                          style={{ padding: "4px 8px", fontSize: "7px" }}
                        >
                          {actionLoadingId === relation.id ? "..." : "✕ DECLINE"}
                        </button>
                        
                        <button
                          onClick={() => handleAccept(relation.id)}
                          disabled={actionLoadingId !== null}
                          className="nokia-btn nokia-btn-primary"
                          style={{ padding: "4px 8px", fontSize: "7px" }}
                        >
                          {actionLoadingId === relation.id ? "..." : "✓ ACCEPT"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="nokia-panel-sunken font-mono text-muted" style={{ padding: "16px", fontStyle: "italic", textAlign: "center", fontSize: "11px" }}>
                No incoming connection requests.
              </div>
            )}
          </div>

          <hr className="nokia-divider" />

          {/* Sent Requests */}
          <div>
            <h3 className="font-pixel text-muted" style={{ fontSize: "8px", marginBottom: "12px", letterSpacing: "0.05em" }}>
              ▶ SENT REQUESTS ({sentPendingRequests.length})
            </h3>
            {sentPendingRequests.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {sentPendingRequests.map((relation) => {
                  const recipient = getOtherUserProfile(relation);
                  return (
                    <div
                      key={relation.id}
                      className="nokia-panel"
                      style={{ padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", opacity: 0.8 }}
                    >
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <div className="nokia-panel-sunken font-pixel" style={{
                          width: "32px",
                          height: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          flexShrink: 0,
                        }}>
                          {recipient.full_name ? recipient.full_name.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div>
                          <Link
                            href={`/profile/${recipient.id}`}
                            className="font-pixel text-accent"
                            style={{ fontSize: "9px", textDecoration: "none" }}
                          >
                            {recipient.full_name || "ANONYMOUS MEMBER"}
                          </Link>
                          <div className="font-mono text-muted" style={{ fontSize: "11px", marginTop: "2px" }}>
                            awaiting response...
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeclineOrRemove(relation.id)}
                        disabled={actionLoadingId === relation.id}
                        className="nokia-btn"
                        style={{ padding: "4px 8px", fontSize: "7px" }}
                      >
                        {actionLoadingId === relation.id ? "..." : "✕ CANCEL"}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="nokia-panel-sunken font-mono text-muted" style={{ padding: "16px", fontStyle: "italic", textAlign: "center", fontSize: "11px" }}>
                No sent requests active.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
