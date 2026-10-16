"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Ticket } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import EventBookingModal from "@/components/events/EventBookingModal";

interface PublicEventBookButtonProps {
  event: any;
  userProfile: any | null;
  isLoggedIn: boolean;
}

export default function PublicEventBookButton({
  event,
  userProfile,
  isLoggedIn,
}: PublicEventBookButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldAutoBook = searchParams.get("book") === "true";

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (shouldAutoBook && isLoggedIn) {
      setIsModalOpen(true);
    }
  }, [shouldAutoBook, isLoggedIn]);

  const handleClick = () => {
    if (!isLoggedIn) {
      const returnUrl = `/events/${event.id}?book=true`;
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white hover:brightness-110 shadow-[0_4px_24px_rgba(255,111,38,0.5)] transition-all flex items-center justify-center gap-2 group cursor-pointer"
      >
        <Ticket className="w-4 h-4 text-white" />
        <span>Book Passes &amp; QR Pass</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>

      {isModalOpen && (
        <EventBookingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          event={event}
          currentUserProfile={userProfile}
          onSuccess={() => {
            router.push("/dashboard?booking_confirmed=true");
          }}
        />
      )}
    </>
  );
}
