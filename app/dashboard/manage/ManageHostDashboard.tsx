"use client";

import { useState } from "react";
import Link from "next/link";
import type { Beacon, BeaconCategory } from "@/lib/supabase/types";
import {
  Radio,
  Users,
  MessageSquare,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const CATEGORY_LABELS: Record<BeaconCategory, string> = {
  sports: "Sports & Padel",
  casual: "Chai & Casual",
  nightlife: "Nightlife & Raves",
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

export interface ApplicationWithProfile {
  id: string;
  beacon_id: string;
  applicant_id: string;
  status: "pending" | "approved" | "declined";
  created_at: string;
}

export interface JoinedBeaconWithHost extends Beacon {}

export interface ManageHostDashboardProps {
  beacons: Beacon[];
  initialApplications: ApplicationWithProfile[];
  joinedBeacons?: JoinedBeaconWithHost[];
  currentUserId?: string;
}

export default function ManageHostDashboard({
  beacons,
  initialApplications,
  joinedBeacons = [],
}: ManageHostDashboardProps) {
  const [activeTab, setActiveTab] = useState<"broadcasts" | "squads">("broadcasts");

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#FF6F26]/10 text-[#FF6F26] border border-[#FF6F26]/30">
              <Radio className="w-3.5 h-3.5" />
              My Hosting Summary
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Hosted Beacons &amp; Broadcasts
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-1 max-w-xl">
            A clean overview of all your created meetups. Select any meetup to manage applicants, edit plans, and chat with your squad.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("broadcasts")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "broadcasts"
                ? "bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-[0_0_15px_rgba(255,111,38,0.3)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>My Broadcasts ({beacons.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("squads")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "squads"
                ? "bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-[0_0_15px_rgba(255,111,38,0.3)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Joined Squads ({joinedBeacons.length})</span>
          </button>
        </div>
      </div>

      {/* ─── HOSTED BEACONS OVERVIEW LIST ─── */}
      {activeTab === "broadcasts" ? (
        beacons.length > 0 ? (
          <div className="space-y-4">
            {beacons.map((beacon) => {
              const pendingCount = initialApplications.filter(
                (app) => app.beacon_id === beacon.id && app.status === "pending"
              ).length;
              const approvedCount = initialApplications.filter(
                (app) => app.beacon_id === beacon.id && app.status === "approved"
              ).length;

              return (
                <div
                  key={beacon.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 md:p-6 backdrop-blur-md hover:border-white/20 transition-all space-y-4 shadow-xl"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Beacon Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#FF6F26]/10 text-[#FF6F26] border border-[#FF6F26]/30">
                          {CATEGORY_LABELS[beacon.category] || beacon.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-zinc-400 border border-white/10">
                          {beacon.visibility_mode === "friend" ? "Friends Only" : "Open to All"}
                        </span>
                        {beacon.status === "active" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active Meetup
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                            {beacon.status}
                          </span>
                        )}
                      </div>

                      <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                        {beacon.title}
                      </h2>

                      <div className="flex items-center gap-4 text-xs text-zinc-400 flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          {formatScheduledAt(beacon.scheduled_at)}
                        </span>
                        {beacon.location_name && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#FF6F26]" />
                            {beacon.location_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 font-bold text-zinc-300">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          {beacon.filled_slots} / {beacon.total_slots} Slots Filled
                        </span>
                      </div>

                      {beacon.description && (
                        <p className="text-xs text-zinc-400 italic line-clamp-2 pt-1">
                          &ldquo;{beacon.description}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Action & Redirect Button to Squad Chat Workspace */}
                    <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2.5 shrink-0">
                      {pendingCount > 0 && (
                        <div className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 animate-pulse">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{pendingCount} Join Request{pendingCount > 1 ? "s" : ""} Pending</span>
                        </div>
                      )}

                      <Link
                        href={`/dashboard/chats?beaconId=${beacon.id}`}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white hover:brightness-110 shadow-[0_0_15px_rgba(255,111,38,0.3)] transition-all flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Manage Beacon &amp; Squad Chat ➔</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center backdrop-blur-md space-y-4">
            <Radio className="w-10 h-10 text-zinc-600 mx-auto" />
            <div className="text-base font-bold text-white">No Active Broadcasts</div>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              You haven&apos;t hosted any meetups yet. Broadcast a new beacon from the Lobby Feed to begin matching!
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white hover:brightness-110 shadow-[0_0_15px_rgba(255,111,38,0.3)] transition-all"
            >
              <span>Explore Lobby Feed</span>
            </Link>
          </div>
        )
      ) : (
        /* ─── JOINED SQUADS LIST ─── */
        joinedBeacons.length > 0 ? (
          <div className="space-y-4">
            {joinedBeacons.map((beacon) => (
              <div
                key={beacon.id}
                className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 md:p-6 backdrop-blur-md space-y-3 hover:border-white/20 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-3 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF6F26]/10 text-[#FF6F26] border border-[#FF6F26]/30">
                        {CATEGORY_LABELS[beacon.category] || beacon.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-zinc-400">
                        Host: {(beacon.profiles as any)?.full_name || "Verified Host"}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">{beacon.title}</h3>
                    <div className="text-xs text-zinc-400 flex items-center gap-3 flex-wrap mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        {formatScheduledAt(beacon.scheduled_at)}
                      </span>
                      {beacon.location_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#FF6F26]" />
                          {beacon.location_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/chats?beaconId=${beacon.id}`}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:brightness-110 shadow-[0_0_15px_rgba(39,201,63,0.25)] transition-all flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Enter Squad Chat ➔</span>
                  </Link>
                </div>

                {beacon.description && (
                  <p className="text-xs text-zinc-400 italic">
                    &ldquo;{beacon.description}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center backdrop-blur-md space-y-3">
            <Users className="w-8 h-8 text-zinc-600 mx-auto" />
            <div className="text-base font-bold text-white">No Joined Squads Yet</div>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              You are not a member of any approved squads yet. Request to join active meetups in the Lobby!
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white hover:brightness-110 shadow-[0_0_15px_rgba(255,111,38,0.3)] transition-all"
            >
              <span>Browse Lobby</span>
            </Link>
          </div>
        )
      )}
    </div>
  );
}
