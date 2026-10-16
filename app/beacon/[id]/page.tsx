import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import SubpageNavbar from "@/components/SubpageNavbar";
import SubpageFooter from "@/components/SubpageFooter";
import { parseBeaconMeta } from "@/lib/beaconBudget";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Sparkles,
  ShieldCheck,
  Coins,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  Trophy,
  Coffee,
  Moon,
} from "lucide-react";
import UniversalShareModal from "@/components/share/UniversalShareModal";
import PublicBeaconShareButton from "./PublicBeaconShareButton";
import PublicBeaconJoinButton from "./PublicBeaconJoinButton";
import PublicBeaconInviteCard from "@/components/share/PublicBeaconInviteCard";
import { getSessionUserSecurely } from "@/lib/supabase/session";

interface PageProps {
  params: Promise<{ id: string }>;
}

const CATEGORY_META = {
  sports: { label: "Sports & Padel", icon: Trophy, color: "#27C93F", bg: "rgba(39, 201, 63, 0.12)" },
  casual: { label: "Chai & Casual", icon: Coffee, color: "#FFA05C", bg: "rgba(255, 160, 92, 0.12)" },
  nightlife: { label: "Nightlife & Rave", icon: Moon, color: "#FF8A3D", bg: "rgba(255, 90, 31, 0.15)" },
};

export default async function PublicBeaconPage({ params }: PageProps) {
  const { id: beaconId } = await params;

  // 1. Fetch beacon
  const { data: beacon, error } = await (supabaseAdmin
    .from("beacons") as any)
    .select(`
      *,
      host:host_id (
        id,
        full_name,
        avatar_icon,
        bio,
        city
      )
    `)
    .eq("id", beaconId)
    .maybeSingle();

  if (error || !beacon) {
    notFound();
  }

  const parsedMeta = parseBeaconMeta(beacon.description);
  const categoryMeta = (CATEGORY_META as any)[beacon.category] || CATEGORY_META.casual;
  const CategoryIcon = categoryMeta.icon;
  const spotsLeft = Math.max(0, (beacon.total_slots || 5) - (beacon.filled_slots || 0));

  const formattedDate = beacon.scheduled_at
    ? new Date(beacon.scheduled_at).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Time TBD";

  // 2. Fetch current session user securely
  const auth = await getSessionUserSecurely();
  const userId = "error" in auth ? null : auth.userId;

  // 3. Fetch post-hangout memories if completed
  let memories: any[] = [];
  if (beacon.status === "completed") {
    const { data: mems } = await (supabaseAdmin
      .from("beacon_memories") as any)
      .select("id, image_url, caption, created_at, profiles:user_id(full_name)")
      .eq("beacon_id", beaconId)
      .order("created_at", { ascending: false });
    memories = mems || [];
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#060408] text-white selection:bg-[#FF6F26] selection:text-white relative overflow-hidden">
      {/* Background Ambience */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255, 111, 38, 0.22) 0%, transparent 70%)",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.12) 1.25px, transparent 1.25px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative z-10">
        <SubpageNavbar />
      </div>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 relative z-10 space-y-6">
        {/* Top Status & Category Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border"
              style={{
                background: categoryMeta.bg,
                borderColor: `${categoryMeta.color}55`,
                color: categoryMeta.color,
              }}
            >
              <CategoryIcon className="w-3.5 h-3.5" />
              {categoryMeta.label}
            </span>

            {beacon.status === "completed" ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300 border border-white/10">
                🔒 Meetup Concluded
              </span>
            ) : spotsLeft === 0 ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                Squad Full
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 animate-pulse">
                ● Live Hangout · {spotsLeft} Spot{spotsLeft > 1 ? "s" : ""} Left
              </span>
            )}
          </div>

          {/* Public Share Trigger */}
          <PublicBeaconShareButton
            beaconTitle={beacon.title}
            beaconId={beacon.id}
          />
        </div>

        {/* Hero Beacon Card */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {/* Host Byline */}
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6F26] to-[#FF4500] p-0.5 flex items-center justify-center shrink-0 shadow-lg">
              <div className="w-full h-full rounded-[14px] bg-[#0d0916] flex items-center justify-center font-black text-sm text-[#FFA05C]">
                {beacon.host?.avatar_icon === "coffee" ? "☕" : beacon.host?.avatar_icon === "trophy" ? "🏆" : "🔥"}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                <span>Hosted by</span>
                <span className="text-white font-bold">{beacon.host?.full_name || "Verified Member"}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-[11px] text-zinc-500">{beacon.city || "Karachi"} City Radar</div>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {beacon.title}
            </h1>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {parsedMeta.description || "Join this open hangout circle in the city. Meet vetted people and make real friends."}
            </p>
          </div>

          {/* Quick Specs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Calendar className="w-3.5 h-3.5 text-[#FF6F26]" />
                <span>Date &amp; Time</span>
              </div>
              <div className="text-xs font-bold text-white truncate">{formattedDate}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <MapPin className="w-3.5 h-3.5 text-[#FF6F26]" />
                <span>Location</span>
              </div>
              <div className="text-xs font-bold text-white truncate">
                {beacon.location_name || "City Venue"}
              </div>
              {beacon.google_maps_url && (
                <a
                  href={beacon.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#FFA05C] hover:underline flex items-center gap-1 mt-0.5"
                >
                  <span>Google Maps Pin</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Budget Pact</span>
              </div>
              <div className="text-xs font-bold text-amber-300">{parsedMeta.budgetTier}</div>
            </div>
          </div>

          {/* Host Icebreaker Question */}
          {parsedMeta.customQuestion && (
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <HelpCircle className="w-3.5 h-3.5 text-[#FF6F26]" />
                <span>Host Icebreaker Question:</span>
              </div>
              <p className="text-zinc-300 italic">&ldquo;{parsedMeta.customQuestion}&rdquo;</p>
            </div>
          )}

          {/* Call to Action Bar */}
          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-zinc-400 text-center sm:text-left">
              <strong className="text-white">{beacon.filled_slots || 0}</strong> of{" "}
              <strong className="text-white">{beacon.total_slots}</strong> spots claimed so far.
            </div>

            <PublicBeaconJoinButton
              beacon={beacon}
              isLoggedIn={!!userId}
              currentUserId={userId}
            />
          </div>
        </div>

        {/* Invite Squad & Friends Section */}
        {beacon.status === "active" && (
          <PublicBeaconInviteCard
            beaconId={beacon.id}
            beaconTitle={beacon.title}
          />
        )}

        {/* Post-Hangout Memories Reel (If Available) */}
        {memories.length > 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Squad Hangout Memories ({memories.length})
              </h3>
              <span className="text-[10px] text-zinc-400">Captured by Attendees</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {memories.map((m) => (
                <div key={m.id} className="group relative rounded-2xl overflow-hidden border border-white/10 bg-black aspect-square">
                  <img src={m.image_url} alt="Meetup moment" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  {m.caption && (
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black via-black/70 to-transparent text-[10px] text-zinc-200 truncate">
                      {m.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instagram Spotlight Banner */}
        <div className="p-4 sm:p-5 rounded-3xl border border-purple-500/25 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs font-black text-pink-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tag Us on Instagram @solonomore</span>
            </div>
            <p className="text-xs text-zinc-300">
              Meeting up with this squad? Post your hangout stories and tag <strong>@solonomore</strong> to get highlighted across our city network!
            </p>
          </div>
          <a
            href="https://instagram.com/solonomore"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 border border-pink-500/40 shrink-0 self-start sm:self-auto transition-colors"
          >
            Visit @solonomore ↗
          </a>
        </div>
      </main>

      <SubpageFooter />
    </div>
  );
}
