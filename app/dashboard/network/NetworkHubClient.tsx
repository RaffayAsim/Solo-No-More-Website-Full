"use client";

import { useState } from "react";
import Link from "next/link";
import { acceptFriendRequest, removeFriend } from "@/app/actions/friends";
import {
  Users,
  UserCheck,
  UserPlus,
  UserX,
  Check,
  X,
  Sparkles,
  Clock,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  User
} from "lucide-react";

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* ── Modern Header Panel ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#FF6F26]/15 via-transparent to-transparent blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#FF6F26]/10 text-[#FF6F26] border border-[#FF6F26]/20">
              <Users className="w-3.5 h-3.5" />
              <span>COMMUNITY CONNECTIONS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Network Hub
            </h1>
            <p className="text-sm text-neutral-400 max-w-xl">
              Manage matches, build real-world connections, and expand your verified inner circle.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/10 transition-all hover:scale-[1.02] self-start md:self-auto"
          >
            <Sparkles className="w-4 h-4 text-[#FF6F26]" />
            <span>Discover in Lobby</span>
          </Link>
        </div>
      </div>

      {/* Global Error message */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Modern Filter Tabs */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md w-fit">
        <button
          onClick={() => setActiveTab("circle")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "circle"
              ? "bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-lg shadow-[#FF6F26]/20"
              : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>My Circle ({myCircle.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "pending"
              ? "bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-lg shadow-[#FF6F26]/20"
              : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Requests ({pendingRequests.length})</span>
        </button>
      </div>

      {/* Dynamic Tab Panel content */}
      {activeTab === "circle" ? (
        /* ─── TAB: MY CIRCLE ────────────────────────────────────────────── */
        <div>
          {myCircle.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myCircle.map((relation) => {
                const friend = getOtherUserProfile(relation);
                const isFamily = friend.subscription_tier === "family";
                return (
                  <div
                    key={relation.id}
                    className="group relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-[#FF6F26]/40 transition-all duration-300 p-5 backdrop-blur-md flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 group-hover:border-[#FF6F26]/50 transition-colors">
                        {friend.full_name ? friend.full_name.charAt(0).toUpperCase() : "?"}
                      </div>

                      <div className="min-w-0">
                        <Link
                          href={`/profile/${friend.id}`}
                          className="font-bold text-white text-sm hover:text-[#FF6F26] transition-colors block truncate"
                        >
                          {friend.full_name || "Anonymous Member"}
                        </Link>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                              isFamily
                                ? "bg-amber-500/10 border-amber-500/25 text-amber-400"
                                : "bg-[#FF6F26]/10 border-[#FF6F26]/25 text-[#FF6F26]"
                            }`}
                          >
                            {isFamily ? "VIP Family" : "Member"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeclineOrRemove(relation.id)}
                      disabled={actionLoadingId === relation.id}
                      className="p-2 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all flex-shrink-0"
                      title="Remove from circle"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 px-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-md">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FF6F26]/10 border border-[#FF6F26]/20 flex items-center justify-center text-[#FF6F26] mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Empty Circle</h3>
              <p className="text-sm text-neutral-400 max-w-md mx-auto mb-6">
                Start making connections! Find interesting members in lobby events, add them, and sync up here.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-lg shadow-[#FF6F26]/20 hover:brightness-110 transition-all"
              >
                <span>Explore Lobby</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      ) : (
        /* ─── TAB: PENDING REQUESTS ─────────────────────────────────────── */
        <div className="space-y-6">
          {/* Received Requests */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FF6F26]" />
              <span>Received Requests ({pendingRequests.length})</span>
            </h3>
            {pendingRequests.length > 0 ? (
              <div className="space-y-3">
                {pendingRequests.map((relation) => {
                  const sender = getOtherUserProfile(relation);
                  return (
                    <div
                      key={relation.id}
                      className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                          {sender.full_name ? sender.full_name.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div>
                          <Link
                            href={`/profile/${sender.id}`}
                            className="font-bold text-white text-sm hover:text-[#FF6F26] transition-colors"
                          >
                            {sender.full_name || "Anonymous Member"}
                          </Link>
                          <div className="text-xs text-neutral-400 mt-0.5">
                            Wants to connect with you
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => handleDeclineOrRemove(relation.id)}
                          disabled={actionLoadingId !== null}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-red-500/10 text-neutral-300 hover:text-red-400 border border-white/10 hover:border-red-500/20 transition-all"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleAccept(relation.id)}
                          disabled={actionLoadingId !== null}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-lg shadow-[#FF6F26]/20 hover:brightness-110 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/[0.08] text-xs text-neutral-400">
                No incoming connection requests.
              </div>
            )}
          </div>

          {/* Sent Requests */}
          <div className="space-y-3 pt-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-neutral-400" />
              <span>Sent Requests ({sentPendingRequests.length})</span>
            </h3>
            {sentPendingRequests.length > 0 ? (
              <div className="space-y-3">
                {sentPendingRequests.map((relation) => {
                  const recipient = getOtherUserProfile(relation);
                  return (
                    <div
                      key={relation.id}
                      className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md flex items-center justify-between gap-4 opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-neutral-400 font-bold text-sm flex-shrink-0">
                          {recipient.full_name ? recipient.full_name.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div>
                          <Link
                            href={`/profile/${recipient.id}`}
                            className="font-bold text-white text-sm hover:text-[#FF6F26] transition-colors"
                          >
                            {recipient.full_name || "Anonymous Member"}
                          </Link>
                          <div className="text-xs text-neutral-500 mt-0.5">
                            Awaiting response...
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeclineOrRemove(relation.id)}
                        disabled={actionLoadingId === relation.id}
                        className="px-3.5 py-1.5 rounded-xl text-xs text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/[0.08] text-xs text-neutral-400">
                No sent requests pending.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
