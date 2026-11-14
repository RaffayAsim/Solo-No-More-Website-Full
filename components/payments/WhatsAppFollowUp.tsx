"use client";

import { MessageCircle } from "lucide-react";
import { PAYMENT_CONFIG, buildWhatsAppProofLink, formatWhatsAppNumber } from "@/lib/payment-config";

/**
 * Shown only AFTER a payment proof was submitted. The proof is already with the admin
 * team; this just lets the customer ask for a quicker confirmation if they want to.
 */
export default function WhatsAppFollowUp({
  purpose,
  amountPkr,
  reference,
  payerName,
}: {
  purpose?: string;
  amountPkr?: number;
  reference?: string;
  payerName?: string;
}) {
  const href = buildWhatsAppProofLink({ purpose, amountPkr, reference, payerName });
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 space-y-2.5 text-left max-w-md mx-auto">
      <div className="text-xs font-bold text-emerald-300">Want a faster confirmation? (optional)</div>
      <p className="text-[11.5px] text-zinc-300 leading-relaxed">
        Your screenshot is already with our team — no need to send it again. If you&apos;re in a hurry, message us on
        WhatsApp at <span className="font-semibold text-white whitespace-nowrap">{formatWhatsAppNumber(PAYMENT_CONFIG.whatsappNumber)}</span>{" "}
        with your reference and we&apos;ll prioritise it.
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#128C4B] hover:bg-[#0f7a41] transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        <span>Message us on WhatsApp</span>
      </a>
    </div>
  );
}
