"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitPaymentProof, upgradeTier } from "@/app/actions/billing";
import {
  Sparkles,
  Zap,
  Building2,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Crown,
  ShieldCheck,
  ArrowRight
} from "lucide-react";

interface UpgradeHubClientProps {
  currentTier: "none" | "member" | "family" | "admin" | "partner";
}

export default function UpgradeHubClient({ currentTier: initialTier }: UpgradeHubClientProps) {
  const [tier, setTier] = useState(initialTier);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Payment Modal State
  const [modalTier, setModalTier] = useState<"member" | "partner" | "family" | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"raast" | "sadapay" | "bank_transfer">("raast");
  const [transactionRef, setTransactionRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);

  const router = useRouter();

  const openPaymentModal = (selectedTier: "member" | "partner" | "family") => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setTransactionRef("");
    setModalSuccess(false);
    setModalTier(selectedTier);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTier || !transactionRef.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);

    const amount = modalTier === "member" ? 2000 : 3500;

    try {
      const res = await submitPaymentProof({
        tierRequested: modalTier,
        amountPkr: amount,
        paymentMethod,
        transactionRef: transactionRef.trim(),
      });

      if (res.success) {
        setModalSuccess(true);
        setSuccessMsg(
          `Payment proof received! TID: ${transactionRef.trim()} submitted for ${modalTier.toUpperCase()} verification.`
        );
        setTimeout(() => {
          setModalTier(null);
          router.refresh();
        }, 2200);
      } else {
        setErrorMsg(res.error);
      }
    } catch {
      setErrorMsg("Failed to submit payment verification. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  // Instant simulator for test accounts
  const handleDevInstantUpgrade = async (selectedTier: "member" | "partner" | "family") => {
    setSubmitting(true);
    try {
      const res = await upgradeTier(selectedTier);
      if (res.success) {
        setTier(selectedTier);
        setSuccessMsg(`[DEV SIMULATOR] Instantly upgraded to ${selectedTier.toUpperCase()} tier!`);
        setModalTier(null);
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* ── Modern Header Panel ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-6 sm:p-10 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-[#FF6F26]/15 via-transparent to-transparent blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#FF6F26]/10 text-[#FF6F26] border border-[#FF6F26]/20">
            <Crown className="w-3.5 h-3.5" />
            <span>MEMBERSHIP & BUSINESS TIERS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Choose Your Membership Tier
          </h1>
          <p className="text-sm sm:text-base text-neutral-400">
            Explore hangouts, host unlimited squad beacons across Karachi, or promote your local business.
          </p>
        </div>
      </div>

      {/* Action alerts */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* 1. EXPLORER (STARTER) */}
        <div
          className={`relative rounded-2xl bg-white/[0.03] border p-6 sm:p-7 flex flex-col justify-between backdrop-blur-md transition-all duration-300 ${
            tier === "none" ? "border-white/30" : "border-white/[0.08] hover:border-white/20"
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Starter Pass
              </span>
              {tier === "none" && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20">
                  Active Plan
                </span>
              )}
            </div>

            <h3 className="text-2xl font-bold text-white">Explorer</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Ideal for newcomers discovering the solo scene and exploring local squads.
            </p>

            <div className="pt-2 pb-4 border-b border-white/[0.08]">
              <span className="text-3xl font-extrabold text-white">PKR 0</span>
              <span className="text-xs text-neutral-400 ml-1.5">/ free</span>
            </div>

            <ul className="space-y-3 pt-2">
              {[
                "3 Free Approved Hangout Entries",
                "Access to Karachi Live Radar Discovery",
                "Squad Chat Room Access upon Acceptance",
                "Browse Community Event Calendar",
                "Option to Pay-As-You-Go after 3 Hangouts",
              ].map((perk) => (
                <li key={perk} className="flex items-start gap-2.5 text-xs text-neutral-300">
                  <Check className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            disabled
            className="w-full mt-6 py-3 px-4 rounded-xl text-xs font-semibold bg-white/[0.04] text-neutral-500 border border-white/5 cursor-not-allowed"
          >
            {tier === "none" ? "Current Plan" : "Free Starter Tier"}
          </button>
        </div>

        {/* 2. MEMBER TIER (MOST POPULAR - ORANGE GRADIENT) */}
        <div
          className="relative rounded-2xl bg-gradient-to-b from-[#FF6F26]/10 via-white/[0.03] to-white/[0.02] border-2 border-[#FF6F26] p-6 sm:p-7 flex flex-col justify-between shadow-2xl shadow-[#FF6F26]/15 backdrop-blur-md transform md:-translate-y-2 transition-all duration-300"
        >
          {/* Top Pill */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-md shadow-[#FF6F26]/30 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 fill-white" />
              <span>Most Popular · Recommended</span>
            </span>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#FF6F26] uppercase tracking-wider">
                Full Member
              </span>
              {tier === "member" && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FF6F26]/20 text-[#FF6F26] border border-[#FF6F26]/30">
                  Active
                </span>
              )}
            </div>

            <h3 className="text-2xl font-bold text-white">Member</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Full access to squad lobby broadcasting, chat rooms, and event discounts.
            </p>

            <div className="pt-2 pb-4 border-b border-white/[0.08]">
              <span className="text-3xl font-extrabold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] bg-clip-text text-transparent">
                PKR 2,000
              </span>
              <span className="text-xs text-neutral-400 ml-1.5">/ month</span>
            </div>

            <ul className="space-y-3 pt-2">
              {[
                "15 Hangout Participations / Month",
                "UNLIMITED Beacon Hosting Across Karachi",
                "Verified Member Glow Badge on Profile & Squads",
                "15%–20% Discount on Platform Official Events",
                "Priority Queue in High-Demand Hangouts",
                "Direct Squad Group Chat Access",
              ].map((perk) => (
                <li key={perk} className="flex items-start gap-2.5 text-xs text-white">
                  <div className="w-4 h-4 rounded-full bg-[#FF6F26]/20 text-[#FF6F26] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className={perk.includes("UNLIMITED") ? "font-bold text-[#FF6F26]" : ""}>
                    {perk}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => openPaymentModal("member")}
            disabled={tier === "member" || tier === "admin"}
            className="w-full mt-6 py-3.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-lg shadow-[#FF6F26]/25 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {tier === "member" ? "Subscribed · Active" : "Upgrade to Member"}
          </button>
        </div>

        {/* 3. PARTNER BUSINESS TIER */}
        <div
          className={`relative rounded-2xl bg-white/[0.03] border p-6 sm:p-7 flex flex-col justify-between backdrop-blur-md transition-all duration-300 ${
            tier === "partner" ? "border-emerald-500/50" : "border-white/[0.08] hover:border-emerald-500/30"
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Business Venues
              </span>
              {tier === "partner" && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Active
                </span>
              )}
            </div>

            <h3 className="text-2xl font-bold text-white">Partner Hub</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              For cafes, padel courts, gaming lounges, and restaurants in Karachi.
            </p>

            <div className="pt-2 pb-4 border-b border-white/[0.08]">
              <span className="text-3xl font-extrabold text-emerald-400">PKR 3,500</span>
              <span className="text-xs text-neutral-400 ml-1.5">/ month</span>
            </div>

            <ul className="space-y-3 pt-2">
              {[
                "Broadcast Daily Promo Offers & Vouchers",
                "Auto-Promoted on Radar with Emerald Badge",
                "Access to Dedicated Partner Command Center",
                "Direct Squad Foot-Traffic Generation",
                "Track Squad Check-ins & Redemptions",
                "Verified Venue Checkmark on Map",
              ].map((perk) => (
                <li key={perk} className="flex items-start gap-2.5 text-xs text-neutral-300">
                  <Building2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => openPaymentModal("partner")}
            disabled={tier === "partner" || tier === "admin"}
            className="w-full mt-6 py-3 px-4 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {tier === "partner" ? "Active Partner" : "Activate Partner Hub"}
          </button>
        </div>
      </div>

      {/* Paused Tier Note */}
      <div className="text-center pt-2">
        <span className="text-xs text-neutral-400">
          Note: Family VIP tier is currently paused for our initial community launch.
        </span>
      </div>

      {/* ── PAYMENT MODAL: RAAST / SADAPAY / BANK TRANSFER ────────────────── */}
      {modalTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-[#0B080E] border border-white/[0.12] shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Title Bar */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.08] bg-white/[0.02]">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <CreditCard className="w-5 h-5 text-[#FF6F26]" />
                <span>Secure Local Payment (Karachi / PK)</span>
              </div>
              <button
                onClick={() => setModalTier(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              {modalSuccess ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Proof Received</h3>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                    Your transaction ID has been recorded. Admin will verify and activate your tier shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePaymentSubmit} className="space-y-5">
                  {/* Amount notice */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
                    <div>
                      <div className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Tier Selected</div>
                      <div className="text-lg font-bold text-white capitalize">{modalTier} Plan</div>
                    </div>
                    <div className="text-2xl font-extrabold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] bg-clip-text text-transparent">
                      PKR {modalTier === "member" ? "2,000" : "3,500"}
                    </div>
                  </div>

                  {/* Payment method selector */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2.5">
                      Select Transfer Method
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "raast", label: "Raast (Instant)" },
                        { id: "sadapay", label: "SadaPay" },
                        { id: "bank_transfer", label: "Bank IBFT" },
                      ].map((m) => (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => setPaymentMethod(m.id as any)}
                          className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                            paymentMethod === m.id
                              ? "bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white border-transparent shadow-lg shadow-[#FF6F26]/20"
                              : "bg-white/[0.03] border-white/10 text-neutral-300 hover:bg-white/[0.06]"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Account instructions box */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                    {paymentMethod === "raast" && (
                      <div className="text-xs space-y-1">
                        <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5" />
                          <span>RAAST ID (Instant / Zero Fee)</span>
                        </div>
                        <div className="text-lg font-mono font-bold text-white tracking-wider">
                          0300-SOLONOMORE
                        </div>
                        <div className="text-neutral-400 text-[11px]">
                          Linked Account: Meezan Bank / SadaPay (Abdul Raffay)
                        </div>
                      </div>
                    )}

                    {paymentMethod === "sadapay" && (
                      <div className="text-xs space-y-1">
                        <div className="text-[#FF6F26] font-semibold flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>SadaPay / NayaPay Wallet</span>
                        </div>
                        <div className="text-lg font-mono font-bold text-white tracking-wider">
                          0300-1234567
                        </div>
                        <div className="text-neutral-400 text-[11px]">
                          Account Title: Solo-No-More / Abdul Raffay
                        </div>
                      </div>
                    )}

                    {paymentMethod === "bank_transfer" && (
                      <div className="text-xs space-y-1">
                        <div className="text-[#FF6F26] font-semibold flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Meezan Bank IBFT</span>
                        </div>
                        <div className="text-white font-medium">Account Title: Abdul Raffay</div>
                        <div className="font-mono text-neutral-300 text-[11px]">
                          IBAN: PK42MEZN0001234567890123
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Transaction Ref input */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-2">
                      Transaction Reference / TID (From Bank App Receipt) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9840210294 or STAN/RRN"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF6F26] transition-colors font-mono"
                    />
                    <span className="block text-[11px] text-neutral-400 mt-1.5">
                      Copy the 6 to 12 digit Transaction ID shown on your banking or SadaPay confirmation.
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="submit"
                      disabled={submitting || !transactionRef.trim()}
                      className="w-full py-3.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-lg shadow-[#FF6F26]/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {submitting ? "Submitting Proof..." : "Submit Payment Proof"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDevInstantUpgrade(modalTier)}
                      className="w-full py-2 px-3 rounded-xl text-[11px] text-neutral-400 hover:text-neutral-200 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                    >
                      ⚡ [DEV TEST: Simulate Instant Approval]
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
