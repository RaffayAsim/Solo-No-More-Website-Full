"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  MapPin,
  Calendar,
  Share2,
  Edit3,
  ShieldCheck,
  Radio,
  Users,
  Compass,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Crown,
  Clock,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";

interface ProfileDashboardClientProps {
  profile: {
    id: string;
    full_name: string | null;
    bio: string | null;
    social_link: string | null;
    subscription_tier: string;
    account_status: string;
    no_show_strikes?: number | null;
    city?: string | null;
    avatar_icon?: string | null;
    is_partner?: boolean | null;
    business_name?: string | null;
    vibe_tags?: string[] | null;
    is_active_seeker?: boolean | null;
    created_at?: string;
  };
  hostedBeacons: any[];
  joinedApplications: any[];
  friendsCount: number;
}

const CATEGORY_STYLES: Record<string, { label: string; bg: string; color: string; border: string }> = {
  sports: { label: "Sports & Fitness", bg: "rgba(59, 130, 246, 0.12)", color: "#60A5FA", border: "rgba(59, 130, 246, 0.25)" },
  casual: { label: "Casual Hangout", bg: "rgba(255, 111, 38, 0.12)", color: "#FF8A3D", border: "rgba(255, 111, 38, 0.25)" },
  nightlife: { label: "Nightlife & Raves", bg: "rgba(168, 85, 247, 0.12)", color: "#C084FC", border: "rgba(168, 85, 247, 0.25)" },
};

export default function ProfileDashboardClient({
  profile,
  hostedBeacons = [],
  joinedApplications = [],
  friendsCount = 0,
}: ProfileDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"hosted" | "joined">("hosted");
  const [copiedLink, setCopiedLink] = useState(false);

  const strikes = profile.no_show_strikes || 0;
  const isReliable = strikes === 0;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/profile/${profile.id}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Flexible timing";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "TBD";
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* ── 1. Hero Identity Profile Card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#140E1E] to-[#0A0710] border border-white/[0.12] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#FF6F26]/20 blur-[90px] rounded-full pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          {/* Avatar Icon */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-[#FF6F26]/20 via-[#181124] to-[#FF8A3D]/20 border-2 border-[#FF6F26]/40 flex items-center justify-center text-5xl shadow-[0_0_30px_rgba(255,111,38,0.25)] select-none">
              {profile.avatar_icon || "👤"}
            </div>
            {profile.is_active_seeker && (
              <span
                title="Actively seeking squad hangout"
                className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-black border-2 border-[#0A0710] shadow-md animate-pulse"
              >
                Seeking
              </span>
            )}
          </div>

          {/* Main User Details */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {profile.full_name || "Community Member"}
              </h1>

              {/* Verified Pill */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified</span>
              </span>

              {/* Membership Tier */}
              {profile.subscription_tier && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>{profile.subscription_tier}</span>
                </span>
              )}
            </div>

            {/* City & Meta */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-medium text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <MapPin className="w-3.5 h-3.5 text-[#FF6F26]" />
                <span>{profile.city || "Karachi, Pakistan"}</span>
              </span>

              {profile.social_link && (
                <a
                  href={
                    profile.social_link.startsWith("http")
                      ? profile.social_link
                      : `https://instagram.com/${profile.social_link.replace("@", "")}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[#FFA05C] hover:text-[#FF6F26] hover:underline transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>{profile.social_link}</span>
                </a>
              )}
            </div>

            {/* Bio */}
            {profile.bio ? (
              <p className="text-sm text-zinc-300 max-w-2xl leading-relaxed pt-1">
                {profile.bio}
              </p>
            ) : (
              <p className="text-xs text-zinc-500 italic pt-1">
                No bio added yet. Tell the squad about your favorite weekend vibes!
              </p>
            )}

            {/* Vibe Tags */}
            {profile.vibe_tags && profile.vibe_tags.length > 0 && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                {profile.vibe_tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-xl text-xs font-bold bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/10 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center md:flex-col gap-2.5 shrink-0 self-center md:self-start">
            <Link
              href="/dashboard/profile/edit"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-lg shadow-[#FF6F26]/25 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </Link>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border border-white/10 active:scale-[0.98] transition-all"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Clean 4-Stat Metric Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#FF6F26]/10 text-[#FF6F26] border border-[#FF6F26]/20 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{hostedBeacons.length}</div>
            <div className="text-xs text-zinc-400 font-medium">Beacons Hosted</div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{joinedApplications.length}</div>
            <div className="text-xs text-zinc-400 font-medium">Squads Joined</div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{friendsCount}</div>
            <div className="text-xs text-zinc-400 font-medium">Squad Network</div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400">
              {isReliable ? "100%" : `${Math.max(0, 100 - strikes * 25)}%`}
            </div>
            <div className="text-xs text-zinc-400 font-medium">
              {isReliable ? "Zero Flakes" : `${strikes} Strikes`}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Activity Section: Hosted & Joined Tabs ── */}
      <div className="rounded-3xl bg-[#0E0A16] border border-white/10 p-5 sm:p-6 space-y-5">
        {/* Segmented Tab Controls */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/[0.03] border border-white/10 max-w-sm">
          <button
            type="button"
            onClick={() => setActiveTab("hosted")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "hosted"
                ? "bg-[#FF6F26] text-white shadow-md shadow-[#FF6F26]/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>My Hosted ({hostedBeacons.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("joined")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "joined"
                ? "bg-[#FF6F26] text-white shadow-md shadow-[#FF6F26]/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Joined Squads ({joinedApplications.length})</span>
          </button>
        </div>

        {/* Tab 1: Hosted Beacons */}
        {activeTab === "hosted" && (
          <div className="space-y-3">
            {hostedBeacons.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white/[0.01] border border-dashed border-white/10 space-y-3">
                <Radio className="w-8 h-8 text-zinc-500 mx-auto" />
                <p className="text-sm font-semibold text-zinc-400">
                  You haven&apos;t hosted any beacons yet.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#FF6F26]/10 text-[#FF6F26] border border-[#FF6F26]/20 hover:bg-[#FF6F26]/20 transition-all"
                >
                  Post your first beacon from Lobby
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {hostedBeacons.map((beacon) => {
                  const cat = CATEGORY_STYLES[beacon.category] || CATEGORY_STYLES.casual;
                  return (
                    <div
                      key={beacon.id}
                      className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 transition-all flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                            style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}
                          >
                            {cat.label}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            {beacon.status}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white line-clamp-1">{beacon.title}</h3>
                        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(beacon.scheduled_at)}
                          </span>
                          <span>•</span>
                          <span>
                            {beacon.filled_slots || 0}/{beacon.total_slots} spots
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                        <span className="text-[11px] text-zinc-500 truncate max-w-[180px]">
                          📍 {beacon.location_name || "Location TBD"}
                        </span>
                        <Link
                          href={`/dashboard/chats?beaconId=${beacon.id}`}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 flex items-center gap-1 transition-all"
                        >
                          <MessageSquare className="w-3 h-3 text-[#FF6F26]" />
                          <span>Chat</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Joined Applications */}
        {activeTab === "joined" && (
          <div className="space-y-3">
            {joinedApplications.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white/[0.01] border border-dashed border-white/10 space-y-3">
                <Compass className="w-8 h-8 text-zinc-500 mx-auto" />
                <p className="text-sm font-semibold text-zinc-400">
                  You haven&apos;t joined any squad meetups yet.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#FF6F26]/10 text-[#FF6F26] border border-[#FF6F26]/20 hover:bg-[#FF6F26]/20 transition-all"
                >
                  Explore Lobby Radar
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {joinedApplications.map((item) => {
                  const b = item.beacon;
                  if (!b) return null;
                  const cat = CATEGORY_STYLES[b.category] || CATEGORY_STYLES.casual;
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 transition-all flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                            style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}
                          >
                            {cat.label}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            Approved Guest
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white line-clamp-1">{b.title}</h3>
                        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(b.scheduled_at)}
                          </span>
                          <span>•</span>
                          <span>Hosted by {b.profiles?.full_name || "Host"}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                        <span className="text-[11px] text-zinc-500 truncate max-w-[180px]">
                          📍 {b.location_name || "Location TBD"}
                        </span>
                        <Link
                          href={`/dashboard/chats?beaconId=${b.id}`}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 flex items-center gap-1 transition-all"
                        >
                          <MessageSquare className="w-3 h-3 text-[#FF6F26]" />
                          <span>Squad Chat</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
