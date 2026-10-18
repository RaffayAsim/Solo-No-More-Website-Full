"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Copy, Check, MessageCircle, X } from "lucide-react";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

/**
 * Shorten standard /beacon/[uuid] or /events/[uuid] links to /b/[8-char] or /e/[8-char]
 */
export function formatShortUrl(rawUrl: string, type: "beacon" | "event" = "beacon"): string {
  if (!rawUrl) return "";
  try {
    // Already short
    if (rawUrl.includes("/b/") || rawUrl.includes("/e/")) {
      return rawUrl;
    }

    const beaconMatch = rawUrl.match(/\/beacon\/([a-zA-Z0-9-]+)/);
    if (beaconMatch) {
      const fullId = beaconMatch[1];
      const shortId = fullId.length >= 8 ? fullId.slice(0, 8) : fullId;
      const origin = rawUrl.split("/beacon/")[0];
      return `${origin}/b/${shortId}`;
    }

    const eventMatch = rawUrl.match(/\/events\/([a-zA-Z0-9-]+)/);
    if (eventMatch) {
      const fullId = eventMatch[1];
      const shortId = fullId.length >= 8 ? fullId.slice(0, 8) : fullId;
      const origin = rawUrl.split("/events/")[0];
      return `${origin}/e/${shortId}`;
    }
  } catch {}
  return rawUrl;
}

interface UniversalShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  shareUrl: string;
  shareText?: string;
  type?: "beacon" | "event";
}

export default function UniversalShareModal({
  isOpen,
  onClose,
  title,
  shareUrl,
  shareText = "Join this meetup on Solo-No-More!",
  type = "beacon",
}: UniversalShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [copiedTag, setCopiedTag] = useState(false);
  const [instaShared, setInstaShared] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Compute clean shortened URL
  const shortUrl = useMemo(() => formatShortUrl(shareUrl, type), [shareUrl, type]);

  if (!isOpen || !isMounted || typeof document === "undefined") return null;

  const fullShareText = `${shareText} ${shortUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareText)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const handleCopyTag = async () => {
    try {
      await navigator.clipboard.writeText("@solonomore");
      setCopiedTag(true);
      setTimeout(() => setCopiedTag(false), 2500);
    } catch {}
  };

  const handleInstagramShare = async () => {
    try {
      // 1. Copy the short invite link so user can paste it into Story link sticker or DM
      await navigator.clipboard.writeText(shortUrl);
      setInstaShared(true);
      setTimeout(() => setInstaShared(false), 3500);

      // 2. Open Instagram Direct or Instagram Web
      window.open("https://www.instagram.com/direct/inbox/", "_blank", "noopener,noreferrer");
    } catch {
      window.open("https://instagram.com", "_blank", "noopener,noreferrer");
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0d0916] p-6 space-y-5 shadow-2xl overflow-hidden">
        {/* Glow Accent */}
        <div
          className="absolute -top-24 -right-24 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(255, 111, 38, 0.25) 0%, transparent 70%)",
            filter: "blur(30px)",
          }}
        />

        {/* Header with High-Contrast Visible Close Button */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FF6F26]/10 border border-[#FF6F26]/30 flex items-center justify-center text-[#FF6F26]">
              <span className="text-base">🚀</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#FFA05C]">
                Share With Friends &amp; Socials
              </span>
              <h3 className="text-base font-black text-white truncate max-w-[260px]">
                {title}
              </h3>
            </div>
          </div>

          {/* Explicitly Visible Close Icon */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white stroke-[2.5]" />
          </button>
        </div>

        {/* Short Direct Shareable Link Input */}
        <div className="space-y-2 relative z-10">
          <label className="text-xs font-bold text-zinc-300">Direct Shareable Link</label>
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10">
            <input
              type="text"
              readOnly
              value={shortUrl}
              className="flex-1 bg-transparent px-2.5 text-xs text-zinc-200 font-mono outline-none truncate selection:bg-[#FF6F26]"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#FF6F26] hover:bg-[#FF5A1F] text-white flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 1-Tap Sharing Actions: WhatsApp & Instagram (Story & DM) */}
        <div className="grid grid-cols-2 gap-2.5 relative z-10">
          {/* WhatsApp Share */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-center group"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span>WhatsApp Share</span>
          </a>

          {/* Instagram Share (Story & DM) */}
          <button
            type="button"
            onClick={handleInstagramShare}
            className="p-3 rounded-2xl border border-pink-500/30 bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-orange-500/15 hover:brightness-110 text-pink-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-center group"
          >
            <InstagramIcon className="w-4 h-4 text-pink-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span>{instaShared ? "Link Copied! ➔" : "Share on Insta"}</span>
          </button>
        </div>

        {/* Instagram Share Guidance / Notice */}
        {instaShared && (
          <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/30 text-[11px] text-pink-200 text-center animate-fadeIn">
            ✓ Short link copied! Paste in your <strong>Instagram Story (Link Sticker)</strong> or send to a friend via <strong>DM</strong>!
          </div>
        )}

        {/* Instagram Tag & Highlight Card */}
        <div className="p-3.5 rounded-2xl border border-purple-500/25 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 space-y-2 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-pink-300 text-xs font-bold">
              <InstagramIcon className="w-4 h-4 text-pink-400 shrink-0" />
              <span>Get Highlighted on Solo-No-More!</span>
            </div>
            <button
              type="button"
              onClick={handleCopyTag}
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors cursor-pointer"
            >
              {copiedTag ? "Copied @tag!" : "Copy Tag"}
            </button>
          </div>
          <p className="text-[11px] text-zinc-300 leading-relaxed">
            Share hangout selfies or event stories on Instagram and tag{" "}
            <strong className="text-pink-300">@solonomore</strong> to get your squad featured on our official platform highlights!
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
