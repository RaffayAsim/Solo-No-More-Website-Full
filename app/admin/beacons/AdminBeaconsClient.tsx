"use client";

import React, { useState } from "react";
import { adminCancelBeaconAction } from "@/app/actions/admin";

import {
  Radio,
  Search,
  MapPin,
  Calendar,
  Users,
  XCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { IconTrash } from "@/components/icons/AppIcons";

export interface SquadApplicant {
  id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  flagged_ghost?: boolean;
  applicant?: {
    id: string;
    full_name: string | null;
    phone: string | null;
    city: string | null;
    avatar_icon: string | null;
  };
}

export interface BeaconItem {
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
    id?: string;
    full_name: string | null;
    phone?: string | null;
    city: string | null;
    avatar_icon: string | null;
  };
  applications?: SquadApplicant[];
}

export default function AdminBeaconsClient({ initialBeacons }: { initialBeacons: BeaconItem[] }) {
  const [beacons, setBeacons] = useState<BeaconItem[]>(initialBeacons);
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [expandedSquadId, setExpandedSquadId] = useState<string | null>(null);

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
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-white/[0.04] to-white/[0.01] border border-white/10 p-6 md:p-8 overflow-hidden backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF6F26] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6F26]">
              Real-Time Feed Telemetry
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Beacons & Hangouts Control
          </h1>
          <p className="text-xs md:text-sm text-zinc-400">
            Live telemetry and moderation of all community broadcasts across Pakistan.
          </p>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#FF6F26]/10 text-[#FF6F26] border border-[#FF6F26]/30">
            <Radio className="w-3.5 h-3.5" />
            {beacons.filter((b) => b.status === "active").length} Live Beacons
          </span>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 border ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search beacons, hosts, or venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6F26]/60 transition-colors"
          />
        </div>

        <select
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-[#FF6F26]"
        >
          <option value="all" className="bg-[#120d18]">All Cities</option>
          <option value="karachi" className="bg-[#120d18]">Karachi</option>
          <option value="lahore" className="bg-[#120d18]">Lahore</option>
          <option value="islamabad" className="bg-[#120d18]">Islamabad</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-[#FF6F26]"
        >
          <option value="all" className="bg-[#120d18]">All Statuses</option>
          <option value="active" className="bg-[#120d18]">Active</option>
          <option value="completed" className="bg-[#120d18]">Completed</option>
          <option value="cancelled" className="bg-[#120d18]">Cancelled</option>
        </select>
      </div>

      {/* Beacons List */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center backdrop-blur-md">
          <Radio className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <div className="text-sm font-semibold text-white">No Beacons Found</div>
          <p className="text-xs text-zinc-500 mt-1">
            No beacons match your active search and filter parameters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
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
              : "Flexible / Open";

            return (
              <div
                key={b.id}
                className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 md:p-6 backdrop-blur-md space-y-3 hover:border-white/20 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-base">
                        {b.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-zinc-400 border border-white/10 uppercase">
                        {b.city}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FF6F26]/10 text-[#FF6F26] border border-[#FF6F26]/30">
                        {b.category}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-400 flex items-center gap-3 flex-wrap mt-1">
                      <span>Host: {hostAvatar} <strong className="text-zinc-300">{hostName}</strong></span>
                      <span>• Venue: <strong className="text-zinc-300">{b.location_name || "Open Area"}</strong></span>
                      <span>• Time: <strong className="text-zinc-300">{timeStr}</strong></span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#FF6F26]" />
                      <span>{b.filled_slots} / {b.total_slots} Slots</span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1 ${
                        b.status === "active"
                          ? "bg-[#FF6F26]/15 text-[#FF6F26] border border-[#FF6F26]/30"
                          : b.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>

                {b.description && (
                  <p className="text-xs text-zinc-400 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5">
                    {b.description}
                  </p>
                )}

                {/* ── Squad Person Details Toggle Bar ── */}
                <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setExpandedSquadId(expandedSquadId === b.id ? null : b.id)}
                    style={{
                      background: expandedSquadId === b.id ? "rgba(255, 111, 38, 0.15)" : "rgba(255, 255, 255, 0.05)",
                      border: expandedSquadId === b.id ? "1px solid #FF6F26" : "1px solid rgba(255, 255, 255, 0.1)",
                      color: expandedSquadId === b.id ? "#FF8A3D" : "#FFFFFF",
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 hover:bg-white/[0.1] transition-all"
                  >
                    <Users className="w-3.5 h-3.5 text-[#FF6F26]" />
                    <span>Squad Person Details ({b.applications?.length || 0} members)</span>
                    <span className="text-[10px] ml-1">{expandedSquadId === b.id ? "▲ Hide" : "▼ View"}</span>
                  </button>

                  {/* Moderation Controls */}
                  {b.status === "active" && (
                    <button
                      onClick={() => handleCancelBeacon(b.id, b.title)}
                      disabled={cancellingId === b.id}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center gap-1.5"
                    >
                      <IconTrash size={14} color="#FDA4AF" />
                      <span>{cancellingId === b.id ? "Cancelling..." : "Force Cancel Beacon"}</span>
                    </button>
                  )}
                </div>

                {/* ── Expanded Squad Person Details Panel ── */}
                {expandedSquadId === b.id && (
                  <div
                    style={{
                      background: "rgba(10, 6, 14, 0.8)",
                      border: "1px solid rgba(255, 111, 38, 0.25)",
                      borderRadius: "16px",
                      padding: "16px",
                      marginTop: "12px",
                    }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-xs font-extrabold text-[#FF8A3D] uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Squad Roster & Contact Information
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {b.filled_slots} filled of {b.total_slots} capacity
                      </span>
                    </div>

                    {/* Host Person Card */}
                    <div
                      style={{
                        background: "rgba(255, 111, 38, 0.08)",
                        border: "1px solid rgba(255, 111, 38, 0.2)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                      }}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            background: "linear-gradient(135deg, #FF6F26 0%, #FF4400 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "16px",
                          }}
                        >
                          {hostAvatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-white">{hostName}</span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#FF6F26] text-white uppercase tracking-wider">
                              HOST / CREATOR
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            City: {b.host?.city || b.city} • Phone: {b.host?.phone || "Private on platform"}
                          </div>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 self-start sm:self-auto">
                        Leader Active
                      </span>
                    </div>

                    {/* Squad Applicants / Attendees */}
                    <div>
                      <div className="text-[11px] font-bold text-zinc-400 mb-2">
                        Squad Members & Join Requests:
                      </div>

                      {b.applications && b.applications.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {b.applications.map((app) => {
                            const applicantName = app.applicant?.full_name || "Squad Member";
                            const applicantPhone = app.applicant?.phone || "Not provided";
                            const applicantCity = app.applicant?.city || b.city;
                            const isAccepted = app.status === "accepted";

                            return (
                              <div
                                key={app.id}
                                style={{
                                  background: "rgba(255, 255, 255, 0.03)",
                                  border: "1px solid rgba(255, 255, 255, 0.08)",
                                  borderRadius: "12px",
                                  padding: "10px 12px",
                                }}
                                className="flex items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    style={{
                                      width: "30px",
                                      height: "30px",
                                      borderRadius: "8px",
                                      background: "rgba(255, 255, 255, 0.08)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "13px",
                                    }}
                                  >
                                    {app.applicant?.avatar_icon || "👤"}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-white truncate">
                                      {applicantName}
                                    </div>
                                    <div className="text-[10.5px] text-zinc-400 truncate">
                                      {applicantPhone} • {applicantCity}
                                    </div>
                                  </div>
                                </div>

                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-wider shrink-0 ${
                                    isAccepted
                                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                      : app.status === "pending"
                                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                      : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                  }`}
                                >
                                  {isAccepted ? "Squad Member" : app.status}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div
                          style={{
                            background: "rgba(255, 255, 255, 0.02)",
                            border: "1px dashed rgba(255, 255, 255, 0.1)",
                            borderRadius: "10px",
                            padding: "16px",
                            textAlign: "center",
                            color: "rgba(255, 255, 255, 0.4)",
                            fontSize: "12px",
                          }}
                        >
                          No other squad attendees have joined this hangout yet ({b.total_slots - b.filled_slots} slots remaining).
                        </div>
                      )}
                    </div>
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

