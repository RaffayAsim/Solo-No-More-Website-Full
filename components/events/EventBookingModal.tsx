"use client";

import { useState, useEffect } from "react";
import {
  Ticket,
  Calendar,
  MapPin,
  Heart,
  Users,
  Search,
  CheckCircle,
  X,
  CreditCard,
  Lock,
  ArrowRight,
  Loader2,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  UserPlus,
  MessageCircle,
} from "lucide-react";
import {
  bookEventTicketAction,
  cancelPendingBookingAction,
  submitTicketPaymentProofAction,
} from "@/app/actions/event-booking";
import BankTransferPanel from "@/components/payments/BankTransferPanel";
import WhatsAppFollowUp from "@/components/payments/WhatsAppFollowUp";

interface TierPackage {
  id: string;
  name: string;
  price: number;
  perks?: string;
}

interface EventBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    description?: string;
    venue_name?: string;
    scheduled_at?: string;
    flyer_image_url?: string;
    price: number;
    category?: string;
    metadata?: {
      tier_packages?: TierPackage[];
      is_members_only?: boolean;
    };
  };
  currentUserProfile: Record<string, any> | null;
  onSuccess?: () => void;
}

export default function EventBookingModal({
  isOpen,
  onClose,
  event,
  currentUserProfile,
  onSuccess,
}: EventBookingModalProps) {
  const tiers = event.metadata?.tier_packages || [];

  // Form State
  const [selectedTierId, setSelectedTierId] = useState<string>(tiers[0]?.id || "");
  const [isCoupleBooking, setIsCoupleBooking] = useState(false);
  const [partnerType, setPartnerType] = useState<"existing" | "new">("new");
  
  // Existing member companion — identified by their registered email
  const [partnerSearch, setPartnerSearch] = useState("");

  // New Partner Fields
  const [partnerName, setPartnerName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");
  const [partnerCnic, setPartnerCnic] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Checkout steps: pick passes → pay by bank transfer & upload proof → done
  const [step, setStep] = useState<"details" | "payment" | "done">("details");
  const [booking, setBooking] = useState<{ bookingRef: string; totalAmountPkr: number; tierName: string; ticketCount: number } | null>(null);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [doneIsFree, setDoneIsFree] = useState(false);

  // Prevent background scroll bleed while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Selected Tier Calculation
  const selectedTier = tiers.find((t) => t.id === selectedTierId);
  const unitPrice = selectedTier ? selectedTier.price : (event.price || 0);
  const ticketCount = isCoupleBooking ? 2 : 1;
  const totalAmountPkr = unitPrice * ticketCount;

  const formattedDate = event.scheduled_at
    ? new Date(event.scheduled_at).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Time TBD";

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    // Couple booking validations
    if (isCoupleBooking) {
      if (partnerType === "new") {
        if (!partnerName.trim() || !partnerEmail.trim() || !partnerPhone.trim() || !partnerCnic.trim()) {
          setErrorMsg("Please fill in all companion details (Name, Email, Phone, and CNIC).");
          setIsLoading(false);
          return;
        }
      } else {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(partnerSearch.trim())) {
          setErrorMsg("Enter your companion's registered member email address.");
          setIsLoading(false);
          return;
        }
      }
    }

    try {
      const res = await bookEventTicketAction({
        eventId: event.id,
        tierId: selectedTier?.id,
        tierName: selectedTier?.name,
        tierPrice: unitPrice,
        isCoupleBooking,
        partnerType,
        partnerName: partnerType === "new" ? partnerName.trim() : undefined,
        partnerEmail: partnerType === "new" ? partnerEmail.trim() : partnerSearch.trim(),
        partnerPhone: partnerType === "new" ? partnerPhone.trim() : undefined,
        partnerCnic: partnerType === "new" ? partnerCnic.trim() : undefined,
      });

      if (!res.success) {
        if (res.code === "PROFILE_INCOMPLETE") {
          window.location.href = `/dashboard/profile/edit?notice=event_booking_required`;
          return;
        }
        setErrorMsg(res.error || "Failed to process booking.");
        setIsLoading(false);
        return;
      }

      // Free RSVP: confirmed straight away
      if (res.isFree) {
        setDoneIsFree(true);
        setStep("done");
        if (onSuccess) onSuccess();
        return;
      }

      // Paid: the passes are reserved — continue to bank transfer & proof upload
      setBooking({
        bookingRef: res.bookingRef,
        totalAmountPkr: res.totalAmountPkr,
        tierName: res.tierName,
        ticketCount: res.ticketCount,
      });
      setProofImage(null);
      setTransactionRef("");
      setStep("payment");
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProofSubmit = async () => {
    if (!booking) return;
    if (!proofImage) {
      setErrorMsg("Please upload a screenshot of your payment before submitting.");
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await submitTicketPaymentProofAction({
        bookingRef: booking.bookingRef,
        proofImage,
        paymentMethod: "bank_transfer",
      });
      if (!res.success) {
        setErrorMsg(res.error || "Could not submit your payment proof.");
        return;
      }
      setWhatsappUrl(res.whatsappUrl);
      setDoneIsFree(false);
      setStep("done");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Going back releases the reserved (still unpaid) passes
  const handleBackToDetails = async () => {
    if (booking) {
      setIsLoading(true);
      try {
        await cancelPendingBookingAction(booking.bookingRef);
      } catch {}
      setIsLoading(false);
    }
    setBooking(null);
    setErrorMsg(null);
    setStep("details");
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto overscroll-contain"
        style={{ overscrollBehavior: "contain" }}
      >
        <div
          className="relative w-full max-w-xl bg-[#0c0817] border border-white/15 rounded-3xl shadow-[0_0_60px_rgba(255,111,38,0.25)] overflow-hidden my-auto flex flex-col max-h-[96vh] animate-in fade-in zoom-in-95 duration-200 overscroll-contain"
          style={{ overscrollBehavior: "contain" }}
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-white/10 relative bg-gradient-to-r from-[#FF6F26]/15 via-purple-600/10 to-transparent shrink-0">
            <button
              onClick={onClose}
              aria-label="Close"
              title="Close (Esc)"
              className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 rounded-full bg-black/80 hover:bg-rose-600 text-white flex items-center justify-center border-2 border-white/40 hover:border-white shadow-[0_4px_16px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all cursor-pointer hover:scale-110 active:scale-95 z-20"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div className="flex items-center gap-2 mb-1.5 flex-wrap pr-8">
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-[#FF6F26]/20 text-[#FFA05C] border border-[#FF6F26]/30">
                <Ticket className="w-3.5 h-3.5 text-[#FF6F26]" />
                Event Pass Checkout
              </span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
              {event.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-zinc-400 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#FF6F26]" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#FF6F26]" />
                {event.venue_name || "Official Venue"}
              </span>
            </div>
          </div>

          {step === "details" ? (
          <form onSubmit={handleBookingSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1 overflow-y-auto">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Event Flyer Banner */}
            {event.flyer_image_url && (
              <div className="w-full h-32 rounded-2xl overflow-hidden border border-white/10 relative bg-black/40">
                <img
                  src={event.flyer_image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              </div>
            )}

            {/* Primary Booker Info */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-zinc-500 block">Primary Booker</span>
                <span className="font-bold text-white text-sm">
                  {currentUserProfile?.full_name || "Verified Member"}
                </span>
                <span className="text-zinc-400 block text-[11px]">
                  {currentUserProfile?.phone || "Phone on file"}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified
              </span>
            </div>

            {/* Pass Tier Selection */}
            {tiers && tiers.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 block">
                  Select Ticket Tier *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {tiers.map((tier) => {
                    const isSelected = selectedTierId === tier.id;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setSelectedTierId(tier.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? "border-[#FF6F26] bg-[#FF6F26]/10 shadow-[0_0_20px_rgba(255,111,38,0.2)]"
                            : "border-white/10 bg-white/[0.02] hover:border-white/20 text-zinc-400"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold ${isSelected ? "text-white" : "text-zinc-300"}`}>
                            {tier.name}
                          </span>
                          <span className="text-xs font-black text-[#FFA05C]">
                            PKR {tier.price.toLocaleString()}
                          </span>
                        </div>
                        {tier.perks && (
                          <p className="text-[11px] text-zinc-400 line-clamp-1">{tier.perks}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Couple Booking Toggle (Extracted from QHQ) */}
            <div className="p-4 rounded-2xl border border-[#FF6F26]/30 bg-[#FF6F26]/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF6F26] to-[#FFA05C] flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">Book as Couple</p>
                  <p className="text-zinc-400 text-xs">Bring a partner along (2 passes with linked pair code)</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCoupleBooking(!isCoupleBooking)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  isCoupleBooking ? "bg-[#FF6F26]" : "bg-white/20"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    isCoupleBooking ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Companion Details Drawer (When Couple is ON) */}
            {isCoupleBooking && (
              <div className="p-4 rounded-2xl border border-white/10 bg-black/40 space-y-4 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#FF6F26]" />
                  <p className="text-xs font-bold text-white uppercase tracking-wider">
                    Companion Partner Information
                  </p>
                </div>

                {/* Partner Type Toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPartnerType("new")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      partnerType === "new"
                        ? "bg-[#FF6F26] text-white"
                        : "bg-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>New Guest</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartnerType("existing")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      partnerType === "existing"
                        ? "bg-[#FF6F26] text-white"
                        : "bg-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Existing Member</span>
                  </button>
                </div>

                {partnerType === "new" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-zinc-400 block mb-1">
                          Partner Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={partnerName}
                          onChange={(e) => setPartnerName(e.target.value)}
                          placeholder="Companion's legal name"
                          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-400 block mb-1">
                          Partner Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={partnerEmail}
                          onChange={(e) => setPartnerEmail(e.target.value)}
                          placeholder="partner@email.com"
                          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-zinc-400 block mb-1">
                          Partner Phone *
                        </label>
                        <input
                          type="tel"
                          required
                          value={partnerPhone}
                          onChange={(e) => setPartnerPhone(e.target.value)}
                          placeholder="0300 1234567"
                          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-400 block mb-1">
                          Partner CNIC *
                        </label>
                        <input
                          type="text"
                          required
                          value={partnerCnic}
                          onChange={(e) => setPartnerCnic(e.target.value)}
                          placeholder="42101-1234567-1"
                          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26]"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      Companion&apos;s Registered Member Email *
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        value={partnerSearch}
                        onChange={(e) => setPartnerSearch(e.target.value)}
                        placeholder="member@example.com"
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26]"
                      />
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Their pass will also appear in their own Solo-No-More account.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Payment Summary Card */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  {selectedTier ? selectedTier.name : "Event Pass"} × {ticketCount}
                </span>
                <span className="font-bold text-white">
                  PKR {totalAmountPkr.toLocaleString()}
                </span>
              </div>

              <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-0">
                <div>
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-zinc-400 block">
                    Total Due
                  </span>
                  <span className="text-lg sm:text-xl font-black text-[#FFA05C]">
                    {totalAmountPkr === 0 ? "Free RSVP" : `PKR ${totalAmountPkr.toLocaleString()}`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-400">
                  <CreditCard className="w-3.5 h-3.5 text-[#FF6F26]" />
                  <span>Bank transfer · proof upload</span>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-2xl text-xs font-bold text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 transition-colors text-center"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:flex-1 px-6 sm:px-7 py-3.5 sm:py-3 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white hover:brightness-110 shadow-[0_4px_24px_rgba(255,111,38,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Reserving your pass...</span>
                  </>
                ) : (
                  <>
                    <span className="truncate">
                      {totalAmountPkr === 0
                        ? "Confirm Free Pass"
                        : `Continue to Payment · PKR ${totalAmountPkr.toLocaleString()} →`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
          ) : step === "payment" && booking ? (
            <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <div className="font-bold text-white truncate">
                    {booking.tierName} × {booking.ticketCount}
                  </div>
                  <div className="text-zinc-400 mt-0.5">
                    Booking ref <span className="font-mono font-bold text-[#FFA05C]">{booking.bookingRef}</span> · reserved for 24 hours
                  </div>
                </div>
                <Lock className="w-4 h-4 text-[#FF6F26] shrink-0" />
              </div>

              <BankTransferPanel
                amountPkr={booking.totalAmountPkr}
                purpose={`Event pass — ${event.title}`}
                reference={booking.bookingRef}
                payerName={currentUserProfile?.full_name || undefined}
                proofImage={proofImage}
                onProofImageChange={setProofImage}
                disabled={isLoading}
              />

              <div className="pt-1 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={handleBackToDetails}
                  disabled={isLoading}
                  className="px-5 py-3 rounded-2xl text-xs font-bold text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 transition-colors text-center disabled:opacity-40"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleProofSubmit}
                  disabled={isLoading || !proofImage}
                  className="w-full sm:flex-1 px-6 py-3.5 sm:py-3 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white hover:brightness-110 shadow-[0_4px_24px_rgba(255,111,38,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting proof...</span>
                    </>
                  ) : (
                    <span>Submit Payment Proof</span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8 space-y-4 text-center flex-1 overflow-y-auto">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white">
                {doneIsFree ? "Your pass is confirmed" : "Payment proof received"}
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                {doneIsFree
                  ? "Your free pass is active. Open your dashboard to see the QR code for the door."
                  : `Your booking ${booking?.bookingRef || ""} is awaiting verification. Your QR pass activates as soon as an admin confirms the payment — you will get a notification.`}
              </p>
              {!doneIsFree && (
                <WhatsAppFollowUp purpose={`Event pass — ${event?.title || "event"}`} reference={booking?.bookingRef} />
              )}
              <div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-2xl text-xs font-bold text-zinc-300 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
