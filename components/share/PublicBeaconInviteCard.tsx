"use client";

import React, { useState } from "react";
import { Copy, Check, Share2, Users } from "lucide-react";
import UniversalShareModal, { formatShortUrl } from "@/components/share/UniversalShareModal";

interface PublicBeaconInviteCardProps {
  beaconId: string;
  beaconTitle: string;
}

export default function PublicBeaconInviteCard({
  beaconId,
  beaconTitle,
}: PublicBeaconInviteCardProps) {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const shortCode = beaconId.length >= 8 ? beaconId.slice(0, 8) : beaconId;
  const shortUrl = typeof window !== "undefined"
    ? `${window.location.origin}/b/${shortCode}`
    : `https://solonomore.com/b/${shortCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  return (
    <>
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF6F26]/10 border border-[#FF6F26]/30 flex items-center justify-center text-[#FF6F26] shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Invite Friends to Join This Meetup</h4>
              <p className="text-xs text-zinc-400">
                Share this short invite link with your friends so they can join the exact same squad!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-[#FFA05C] border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto shrink-0 shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5 text-[#FF6F26]" />
            <span>Open Share Options</span>
          </button>
        </div>

        {/* Short Link Display & Copy Button */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/10">
          <input
            type="text"
            readOnly
            value={shortUrl}
            className="flex-1 bg-transparent px-3 text-xs text-zinc-200 font-mono outline-none truncate selection:bg-[#FF6F26]"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF6F26] hover:bg-[#FF5A1F] text-white flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Invite Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      <UniversalShareModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={beaconTitle}
        shareUrl={shortUrl}
        shareText={`Join my squad meetup "${beaconTitle}" on Solo-No-More!`}
        type="beacon"
      />
    </>
  );
}
