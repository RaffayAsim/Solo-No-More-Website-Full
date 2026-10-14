"use client";

import React, { useState } from "react";
import Link from "next/link";
import { reviewPaymentSubmissionAction } from "@/app/actions/billing";

import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface PaymentItem {
  id: string;
  user_id: string;
  amount_pkr: number;
  tier_requested: string;
  payment_method: string;
  transaction_ref: string;
  proof_image_url: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  profiles?: {
    full_name: string | null;
    city: string | null;
    avatar_icon: string | null;
  };
}

export default function AdminPaymentsClient({ initialPayments }: { initialPayments: PaymentItem[] }) {
  const [payments, setPayments] = useState<PaymentItem[]>(initialPayments);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleReview = async (id: string, decision: "approved" | "rejected") => {
    setProcessingId(id);
    setMessage(null);

    const notes = decision === "rejected" ? prompt("Reason for rejection (sent to user):") || "Invalid Transaction ID" : undefined;

    try {
      const res = await reviewPaymentSubmissionAction(id, decision, notes);
      if (res.success) {
        setPayments((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, status: decision, admin_notes: notes || null, reviewed_at: new Date().toISOString() } : p
          )
        );
        setMessage({
          type: "success",
          text: `Payment ${decision === "approved" ? "approved and tier activated" : "rejected"} successfully.`,
        });
      } else {
        setMessage({ type: "error", text: res.error });
      }
    } catch {
      setMessage({ type: "error", text: "Network error processing payment review." });
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = payments.filter((p) => (filter === "all" ? true : p.status === filter));
  const pendingCount = payments.filter((p) => p.status === "pending").length;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-white/[0.04] to-white/[0.01] border border-white/10 p-6 md:p-8 overflow-hidden backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF6F26] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6F26]">
              Financial Settlement & Ledger
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Payments & Billing Verification
          </h1>
          <p className="text-xs md:text-sm text-zinc-400">
            Review Raast, SadaPay, and Bank IBFT transaction proofs submitted by members.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/20 transition-colors"
          >
            <span>View Member Bookings &rarr;</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#FF6F26]/10 text-[#FF6F26] border border-[#FF6F26]/30">
            <Clock className="w-3.5 h-3.5" />
            {pendingCount} Pending Verification
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] border border-white/10 rounded-2xl w-fit overflow-x-auto">
        {(["pending", "approved", "rejected", "all"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
              filter === tab
                ? "bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-[0_0_15px_rgba(255,111,38,0.3)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {tab} ({tab === "all" ? payments.length : payments.filter((p) => p.status === tab).length})
          </button>
        ))}
      </div>

      {/* Payments List */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center backdrop-blur-md">
          <CreditCard className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <div className="text-sm font-semibold text-white">No Transactions Found</div>
          <p className="text-xs text-zinc-500 mt-1">
            No payment submissions currently match the &quot;{filter}&quot; filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const userName = p.profiles?.full_name || "Unknown Member";
            const userCity = p.profiles?.city || "Karachi";
            const dateStr = new Date(p.created_at).toLocaleDateString("en-PK", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={p.id}
                className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 md:p-6 backdrop-blur-md space-y-4 hover:border-white/20 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF6F26]/20 to-[#FF5A1F]/10 border border-[#FF6F26]/30 flex items-center justify-center text-[#FF6F26] font-bold text-sm">
                      {userName.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {userName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-zinc-400 border border-white/10">
                          {userCity}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                        User ID: {p.user_id} • {dateStr}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                    <div className="text-xl md:text-2xl font-black text-white tracking-tight">
                      PKR {p.amount_pkr?.toLocaleString() || "1,500"}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1 ${
                        p.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : p.status === "rejected"
                          ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                          : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">
                      Target Tier
                    </span>
                    <span className="font-bold text-[#FF6F26] mt-0.5 block">
                      ★ {p.tier_requested?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">
                      Channel
                    </span>
                    <span className="font-semibold text-zinc-300 mt-0.5 block">
                      {p.payment_method?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">
                      Transaction Ref / TID
                    </span>
                    <span className="font-mono font-bold text-amber-300 mt-0.5 block tracking-wider">
                      {p.transaction_ref}
                    </span>
                  </div>
                </div>

                {p.admin_notes && (
                  <div className="text-xs text-zinc-400 italic">
                    Note: {p.admin_notes}
                  </div>
                )}

                {/* Actions for pending items */}
                {p.status === "pending" && (
                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      onClick={() => handleReview(p.id, "approved")}
                      disabled={processingId === p.id}
                      className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white hover:brightness-110 shadow-[0_0_20px_rgba(255,111,38,0.25)] transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{processingId === p.id ? "Processing..." : "Approve & Activate Tier"}</span>
                    </button>
                    <button
                      onClick={() => handleReview(p.id, "rejected")}
                      disabled={processingId === p.id}
                      className="py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
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

