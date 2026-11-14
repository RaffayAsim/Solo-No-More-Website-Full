"use client";

import { useRef, useState } from "react";
import { Building2, Check, Copy, ImagePlus, Loader2, X } from "lucide-react";
import { compressImageFile } from "@/lib/image-compress";
import { bankAccountRows } from "@/lib/payment-config";

/** Only values people paste into a banking app get a Copy button. */
const COPYABLE_ROWS = new Set(["Account Number", "IBAN", "Raast ID"]);

interface BankTransferPanelProps {
  /** Amount the customer must transfer. */
  amountPkr: number;
  /** What the payment is for, e.g. "Event pass — Sunset Session". */
  purpose?: string;
  /** Booking / application reference to quote in the transfer remarks. */
  reference?: string;
  payerName?: string;
  proofImage: string | null;
  onProofImageChange: (dataUrl: string | null) => void;
  /** No longer asked for — the screenshot is enough. Kept optional for older callers. */
  transactionRef?: string;
  onTransactionRefChange?: (value: string) => void;
  disabled?: boolean;
}

/**
 * Shared "pay by bank transfer" block used everywhere money changes hands:
 * shows the account to pay into and collects the payment screenshot. WhatsApp is offered
 * only after the proof is submitted (see WhatsAppFollowUp), never as a second upload.
 */
export default function BankTransferPanel({
  amountPkr,
  reference,
  proofImage,
  onProofImageChange,
  disabled,
}: BankTransferPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied((c) => (c === label ? null : c)), 1800);
    } catch {}
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError(null);
    setProcessing(true);
    try {
      onProofImageChange(await compressImageFile(file));
    } catch (err: any) {
      setUploadError(err?.message || "Could not process that image. Please try another.");
    } finally {
      setProcessing(false);
    }
  };

  const rows = bankAccountRows();

  return (
    <div className="space-y-4 text-left">
      {/* 1. Where to pay */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FFA05C]">
            <Building2 className="w-4 h-4" />
            <span>Step 1 · Transfer to this account</span>
          </div>
          <div className="text-base sm:text-lg font-black text-white whitespace-nowrap">
            PKR {Number(amountPkr || 0).toLocaleString("en-US")}
          </div>
        </div>

        <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-black/30">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{row.label}</div>
                <div className="text-xs sm:text-sm font-mono font-semibold text-white break-all">{row.value}</div>
              </div>
              {COPYABLE_ROWS.has(row.label) && (
              <button
                type="button"
                onClick={() => copy(row.label, row.value)}
                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-zinc-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                aria-label={`Copy ${row.label}`}
              >
                {copied === row.label ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === row.label ? "Copied" : "Copy"}</span>
              </button>
              )}
            </div>
          ))}
        </div>

        {reference && (
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Your booking reference is <span className="font-mono font-bold text-white">{reference}</span>. Add it in the
            transfer remarks if your banking app allows.
          </p>
        )}
      </div>

      {/* 2. Upload proof */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-[#FFA05C]">
          Step 2 · Upload your payment screenshot *
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
          disabled={disabled || processing}
        />

        {proofImage ? (
          <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 bg-black/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={proofImage} alt="Payment proof preview" className="w-full max-h-64 object-contain" />
            <button
              type="button"
              onClick={() => onProofImageChange(null)}
              disabled={disabled}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/80 border border-white/30 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
              aria-label="Remove screenshot"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="px-3 py-2 text-[11px] text-emerald-300 flex items-center gap-1.5 border-t border-white/10">
              <Check className="w-3.5 h-3.5" /> Screenshot attached
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || processing}
            className="w-full rounded-xl border-2 border-dashed border-white/15 hover:border-[#FF6F26]/60 bg-black/20 px-4 py-6 flex flex-col items-center justify-center gap-2 text-zinc-300 transition-colors disabled:opacity-50"
          >
            {processing ? <Loader2 className="w-6 h-6 animate-spin text-[#FF6F26]" /> : <ImagePlus className="w-6 h-6 text-[#FF6F26]" />}
            <span className="text-xs font-semibold">{processing ? "Preparing image…" : "Tap to upload the transfer receipt"}</span>
            <span className="text-[11px] text-zinc-500">JPG or PNG screenshot from your banking app</span>
          </button>
        )}

        {uploadError && <div className="text-[11px] text-rose-300">{uploadError}</div>}

      </div>

    </div>
  );
}
