import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import SubpageNavbar from "@/components/SubpageNavbar";
import SubpageFooter from "@/components/SubpageFooter";
import { parseEventDescription } from "@/lib/event-metadata";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Sparkles,
  ShieldCheck,
  Coins,
  ArrowRight,
  ExternalLink,
  Users,
} from "lucide-react";
import PublicEventShareButton from "./PublicEventShareButton";
import PublicEventBookButton from "./PublicEventBookButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicEventPage({ params }: PageProps) {
  const { id: eventId } = await params;

  // Fetch official / partner / artist event
  const { data: event, error } = await (supabaseAdmin
    .from("official_events") as any)
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (error || !event) {
    notFound();
  }

  const { cleanDescription, metadata } = parseEventDescription(event.description || "");
  const tiers = metadata?.tier_packages || [];

  // Fetch current user profile to pass to booking modal
  const auth = await getSessionUserSecurely();
  const userId = "error" in auth ? null : auth.userId;
  let userProfile = null;
  if (userId) {
    const { data: prof } = await (supabaseAdmin.from("profiles") as any)
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    userProfile = prof;
  }

  const formattedDate = event.scheduled_at
    ? new Date(event.scheduled_at).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Time TBD";

  const priceLabel = event.price > 0 ? `PKR ${event.price.toLocaleString()}` : "Free RSVP · Complimentary VIP";

  return (
    <div className="min-h-screen flex flex-col bg-[#060408] text-white selection:bg-[#FF6F26] selection:text-white relative overflow-hidden">
      {/* Background Ambience */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255, 111, 38, 0.25) 0%, transparent 75%)",
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
        {/* Top Badges & Share Trigger */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#FF6F26]/15 text-[#FFA05C] border border-[#FF6F26]/30">
              <Ticket className="w-3.5 h-3.5" />
              {event.category?.toUpperCase() || "OFFICIAL EVENT"}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              ● Passes Active · {event.max_capacity} Capacity
            </span>
          </div>

          <PublicEventShareButton
            eventTitle={event.title}
            eventId={event.id}
          />
        </div>

        {/* Hero Event Card */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden shadow-2xl space-y-0">
          {/* Cover Flyer Image */}
          {event.flyer_image_url && (
            <div className="w-full h-64 sm:h-80 relative overflow-hidden bg-black/40">
              <img
                src={event.flyer_image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0817] via-transparent to-transparent" />
            </div>
          )}

          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#FFA05C] flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Solo-No-More Exclusive Experience</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                {event.title}
              </h1>
            </div>

            {/* Quick Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  <span>Venue</span>
                </div>
                <div className="text-xs font-bold text-white truncate">
                  {event.venue_name || "Secret Location"}
                </div>
                {event.google_maps_url && (
                  <a
                    href={event.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#FFA05C] hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <span>Google Maps Directions</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Ticket className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pass Tier / Pricing</span>
                </div>
                <div className="text-xs font-bold text-emerald-300">{priceLabel}</div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                Event Experience &amp; Inclusions
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                {cleanDescription || "Join us for this curated city event. Bring your friends and connect with our social community."}
              </p>
            </div>

            {/* Multi-Tier Passes (If Configured) */}
            {tiers && tiers.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  Ticket Tiers &amp; Access Options
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tiers.map((t: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{t.name}</span>
                        <span className="text-xs font-black text-[#FFA05C]">PKR {t.price.toLocaleString()}</span>
                      </div>
                      {t.perks && (
                        <p className="text-[11px] text-zinc-400">{t.perks}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Booking Call to Action */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-zinc-400 text-center sm:text-left">
                Door scanner verification active. Instant digital QR pass on confirmation.
              </div>

              <PublicEventBookButton
                event={{ ...event, metadata }}
                userProfile={userProfile}
                isLoggedIn={!!userId}
              />
            </div>
          </div>
        </div>

        {/* Instagram Tag & Highlight Card */}
        <div className="p-4 sm:p-5 rounded-3xl border border-purple-500/25 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs font-black text-pink-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tag Us on Instagram @solonomore</span>
            </div>
            <p className="text-xs text-zinc-300">
              Attending this event? Tag <strong>@solonomore</strong> in your stories &amp; reels to get featured on our official highlight reel!
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
