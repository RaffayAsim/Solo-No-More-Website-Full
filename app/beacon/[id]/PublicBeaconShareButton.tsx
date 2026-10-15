"use client";

import React, { useState } from "react";
import { Share2 } from "lucide-react";
import UniversalShareModal from "@/components/share/UniversalShareModal";

interface PublicBeaconShareButtonProps {
  beaconTitle: string;
  beaconId: string;
}

export default function PublicBeaconShareButton({
  beaconTitle,
  beaconId,
}: PublicBeaconShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const shortCode = beaconId.length >= 8 ? beaconId.slice(0, 8) : beaconId;
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/b/${shortCode}`
    : `https://solonomore.com/b/${shortCode}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
      >
        <Share2 className="w-3.5 h-3.5 text-[#FF6F26]" />
        <span>Share Hangout</span>
      </button>

      <UniversalShareModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={beaconTitle}
        shareUrl={shareUrl}
        shareText={`Join my squad meetup "${beaconTitle}" on Solo-No-More!`}
        type="beacon"
      />
    </>
  );
}
