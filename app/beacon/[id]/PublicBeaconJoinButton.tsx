"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Coins, HelpCircle, AlertCircle, Share2, Check, Sparkles } from "lucide-react";
import { parseBeaconMeta } from "@/lib/beaconBudget";
import { applyToBeacon } from "@/app/actions/applications";

interface PublicBeaconJoinButtonProps {
  beacon: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    filled_slots: number;
    total_slots: number;
    host_id: string;
  };
  isLoggedIn: boolean;
  currentUserId?: string | null;
}

export default function PublicBeaconJoinButton({
  beacon,
  isLoggedIn,
  currentUserId,
}: PublicBeaconJoinButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldAutoJoin = searchParams.get("join") === "true";

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [budgetAgreed, setBudgetAgreed] = useState(true);
  const [applicantAnswer, setApplicantAnswer] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const parsedMeta = parseBeaconMeta(beacon.description);
  const isHost = currentUserId && beacon.host_id === currentUserId;
  const isFull = (beacon.filled_slots || 0) >= (beacon.total_slots || 5);

  const shortCode = beacon.id.length >= 8 ? beacon.id.slice(0, 8) : beacon.id;
  const shortUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/b/${shortCode}`
      : `https://solonomore.com/b/${shortCode}`;

  useEffect(() => {
    if (shouldAutoJoin && isLoggedIn && !isHost && !isFull && beacon.status === "active") {
      setShowApplyModal(true);
    }
  }, [shouldAutoJoin, isLoggedIn, isHost, isFull, beacon.status]);

  const handleClick = () => {
    if (!isLoggedIn) {
      const returnUrl = `/beacon/${beacon.id}?join=true`;
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (isHost) {
      router.push(`/dashboard?beaconId=${beacon.id}`);
      return;
    }

    setShowApplyModal(true);
  };

  const handleCopyShortLink = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMessage(null);

    try {
      const result = await applyToBeacon(beacon.id, {
        budgetAgreement: parsedMeta.budgetTier,
        icebreakerAnswer: applicantAnswer.trim() || undefined,
      });

      if (result.success) {
        setAppliedSuccess(true);
      } else {
        setErrorMessage(result.error);
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  if (beacon.status === "completed") {
    return (
      <div className="px-5 py-3 rounded-2xl text-xs font-bold bg-zinc-800 text-zinc-400 border border-white/10">
        This Meetup Has Concluded
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isFull && !isHost}
        className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 group cursor-pointer ${
          isFull && !isHost
            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            : "bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white hover:brightness-110 shadow-[0_4px_20px_rgba(255,111,38,0.45)]"
        }`}
      >
        <span>
          {isHost
            ? "Manage Your Beacon"
            : isFull
            ? "Squad Full"
            : "⚡ Join This Squad Hangout"}
        </span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Join Meetup Modal */}
      {showApplyModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(3, 2, 6, 0.88)",
            backdropFilter: "blur(20px)",
          }}
          onClick={() => {
            setShowApplyModal(false);
            setAppliedSuccess(false);
          }}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-[#FF6F26]/40 p-6 space-y-4 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(255,111,38,0.2)]"
            style={{
              background: "linear-gradient(180deg, #160e1d 0%, #0c0814 100%)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FF6F26]/20 border border-[#FF6F26]/40 flex items-center justify-center text-[#FF6F26]">
                  ⚡
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Join Squad Meetup</h3>
                  <p className="text-xs text-zinc-400">{beacon.title}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowApplyModal(false);
                  setAppliedSuccess(false);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {appliedSuccess ? (
              <div className="space-y-4 py-3 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">Join Request Sent!</h4>
                  <p className="text-xs text-zinc-300">
                    The host will review your request. Want friends to join this squad with you?
                  </p>
                </div>

                <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 text-left">
                  <input
                    type="text"
                    readOnly
                    value={shortUrl}
                    className="flex-1 bg-transparent px-2.5 text-xs text-zinc-300 font-mono outline-none truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyShortLink}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#FF6F26] hover:bg-[#FF5A1F] text-white flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    {copiedLink ? "✓ Copied!" : "Copy Link"}
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowApplyModal(false);
                      setAppliedSuccess(false);
                      router.push("/dashboard");
                    }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleJoinSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                    {errorMessage.includes("PROFILE_INCOMPLETE") && (
                      <Link
                        href="/dashboard/profile/edit?notice=beacon_required"
                        className="inline-flex items-center gap-1 font-bold text-[#FFA05C] hover:underline text-[11px] pt-1"
                      >
                        <span>Complete Your Safety Profile Now →</span>
                      </Link>
                    )}
                  </div>
                )}

                {/* Budget Pact Alignment */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Meetup Budget Pact</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">{parsedMeta.budgetTier}</p>
                  <label className="flex items-center gap-2 text-[11px] text-zinc-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={budgetAgreed}
                      onChange={(e) => setBudgetAgreed(e.target.checked)}
                      required
                      className="rounded accent-[#FF6F26]"
                    />
                    <span>I confirm I am comfortable with this expense pact.</span>
                  </label>
                </div>

                {/* Icebreaker */}
                {parsedMeta.customQuestion && (
                  <div className="space-y-1.5 text-xs">
                    <label className="font-bold text-zinc-200 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-[#FF6F26]" />
                      <span>Host Question: &ldquo;{parsedMeta.customQuestion}&rdquo;</span>
                    </label>
                    <textarea
                      value={applicantAnswer}
                      onChange={(e) => setApplicantAnswer(e.target.value)}
                      required
                      placeholder="Type your brief answer for the host..."
                      rows={2}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#FF6F26] resize-none"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending || !budgetAgreed}
                  className="w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white hover:brightness-110 shadow-[0_4px_20px_rgba(255,111,38,0.45)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{isPending ? "Submitting Request..." : "Submit Join Request"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
