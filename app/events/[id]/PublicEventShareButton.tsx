"use client";

import React, { useState } from "react";
import { Share2 } from "lucide-react";
import UniversalShareModal from "@/components/share/UniversalShareModal";

interface PublicEventShareButtonProps {
  eventTitle: string;
  eventId: string;
}

export default function PublicEventShareButton({
  eventTitle,
  eventId,
}: PublicEventShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const shortCode = eventId.length >= 8 ? eventId.slice(0, 8) : eventId;
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/e/${shortCode}`
    : `https://solonomore.com/e/${shortCode}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
      >
        <Share2 className="w-3.5 h-3.5 text-[#FF6F26]" />
        <span>Share Event</span>
      </button>

      <UniversalShareModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={eventTitle}
        shareUrl={shareUrl}
        shareText={`Check out "${eventTitle}" on Solo-No-More! Book your passes here:`}
        type="event"
      />
    </>
  );
}
