"use client";

import React, { useState } from "react";
import { adminCancelBeaconAction } from "@/app/actions/admin";

interface BeaconItem {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  category: string;
  city: string;
  location_name: string | null;
  scheduled_at: string | null;
  filled_slots: number;
  total_slots: number;
  status: "active" | "completed" | "cancelled";
  created_at: string;
  host?: {
    full_name: string | null;
    city: string | null;
    avatar_icon: string | null;
  };
}

export default function AdminBeaconsClient({ initialBeacons }: { initialBeacons: BeaconItem[] }) {
  const [beacons, setBeacons] = useState<BeaconItem[]>(initialBeacons);
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleCancelBeacon = async (beaconId: string, beaconTitle: string) => {
    const confirmCancel = confirm(`Are you sure you want to FORCE CANCEL "${beaconTitle}"?`);
    if (!confirmCancel) return;

    setCancellingId(beaconId);
    setMessage(null);

    try {
      const res = await adminCancelBeaconAction(beaconId);
      if (res.success) {
        setBeacons((prev) =>
          prev.map((b) => (b.id === beaconId ? { ...b, status: "cancelled" } : b))
        );
        setMessage({ type: "success", text: `Beacon "${beaconTitle}" has been cancelled.` });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to cancel beacon." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error cancelling beacon." });
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = beacons.filter((b) => {
    if (filterCity !== "all" && b.city?.toLowerCase() !== filterCity.toLowerCase()) return false;
    if (filterStatus !== "all" && b.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = b.title?.toLowerCase().includes(q);
      const matchHost = b.host?.full_name?.toLowerCase().includes(q);
      const matchLoc = b.location_name?.toLowerCase().includes(q);
      if (!matchTitle && !matchHost && !matchLoc) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div className="nokia-panel-sunken" style={{ padding: "16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h1 className="font-pixel text-accent" style={{ fontSize: "14px", margin: 0, letterSpacing: "0.08em" }}>
              📡 BEACONS & HANGOUTS CONTROL
            </h1>
            <p className="font-mono text-muted" style={{ fontSize: "11px", margin: "4px 0 0 0" }}>
              Live telemetry and moderation of all community broadcasts across Pakistan.
            </p>
          </div>
          <div className="nokia-badge nokia-badge-primary" style={{ fontSize: "9px" }}>
            {beacons.filter((b) => b.status === "active").length} LIVE BEACONS
          </div>
        </div>
      </div>

      {message && (
        <div
          className="nokia-panel-raised"
          style={{
            borderColor: message.type === "success" ? "var(--accent-success)" : "var(--accent-danger)",
            padding: "12px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span className={`font-pixel ${message.type === "success" ? "text-success" : "text-danger"}`}>
            [{message.type === "success" ? "✓" : "✕"}]
          </span>
          <span className="font-mono" style={{ fontSize: "11px" }}>{message.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="SEARCH BEACONS OR HOSTS..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="nokia-input"
          style={{ flex: 1, minWidth: "200px", fontSize: "11px" }}
        />

        <select
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
          className="nokia-input"
          style={{ fontSize: "10px", padding: "8px" }}
        >
          <option value="all">ALL CITIES</option>
          <option value="karachi">KARACHI</option>
          <option value="lahore">LAHORE</option>
          <option value="islamabad">ISLAMABAD</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="nokia-input"
          style={{ fontSize: "10px", padding: "8px" }}
        >
          <option value="all">ALL STATUSES</option>
          <option value="active">ACTIVE</option>
          <option value="completed">COMPLETED</option>
          <option value="cancelled">CANCELLED</option>
        </select>
      </div>

      {/* Beacons List */}
      {filtered.length === 0 ? (
        <div className="nokia-panel text-center" style={{ padding: "32px" }}>
          <div className="font-lcd text-muted" style={{ fontSize: "20px" }}>NO BEACONS FOUND</div>
          <p className="font-mono text-muted" style={{ fontSize: "11px", marginTop: "8px" }}>
            No beacons match your active search and filter parameters.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map((b) => {
            const hostName = b.host?.full_name || "Unknown Host";
            const hostAvatar = b.host?.avatar_icon || "👾";
            const timeStr = b.scheduled_at
              ? new Date(b.scheduled_at).toLocaleDateString("en-PK", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "FLEXIBLE / OPEN";

            return (
              <div
                key={b.id}
                className="nokia-panel"
                style={{
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  borderLeft:
                    b.status === "active"
                      ? "4px solid var(--accent-primary)"
                      : b.status === "completed"
                      ? "4px solid var(--accent-success)"
                      : "4px solid var(--accent-danger)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="font-pixel text-accent" style={{ fontSize: "11px" }}>
                        {b.title}
                      </span>
                      <span className="nokia-badge" style={{ fontSize: "7px" }}>{b.city?.toUpperCase()}</span>
                      <span className="nokia-badge nokia-badge-primary" style={{ fontSize: "7px" }}>{b.category}</span>
                    </div>

                    <div className="font-mono text-muted" style={{ fontSize: "11px", marginTop: "4px" }}>
                      Host: {hostAvatar} {hostName} • Venue: {b.location_name || "Open Area"} • Time: {timeStr}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div className="font-lcd text-accent" style={{ fontSize: "20px", lineHeight: 1 }}>
                      {b.filled_slots} / {b.total_slots} SLOTS
                    </div>
                    <span
                      className={`nokia-badge ${
                        b.status === "active"
                          ? "nokia-badge-primary"
                          : b.status === "completed"
                          ? "nokia-badge-success"
                          : "nokia-badge-danger"
                      }`}
                      style={{ fontSize: "7px", marginTop: "4px" }}
                    >
                      {b.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {b.description && (
                  <p className="font-mono text-muted" style={{ fontSize: "11px", margin: "4px 0", lineHeight: "1.4" }}>
                    {b.description}
                  </p>
                )}

                {/* Moderation Controls */}
                {b.status === "active" && (
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
                    <button
                      onClick={() => handleCancelBeacon(b.id, b.title)}
                      disabled={cancellingId === b.id}
                      className="nokia-btn font-pixel text-danger"
                      style={{ fontSize: "8px", padding: "6px 12px", borderColor: "var(--accent-danger)" }}
                    >
                      {cancellingId === b.id ? "CANCELLING..." : "⊗ FORCE CANCEL BEACON"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
