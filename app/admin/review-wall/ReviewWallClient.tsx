"use client";

import React, { useState } from "react";
import { ReviewWallData, ReviewWallSlot, saveReviewWallDataAction } from "@/app/actions/review-wall";
import {
  Save,
  Upload,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";

function InstagramIcon({ size = 18, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface ReviewWallClientProps {
  initialData: ReviewWallData;
}

export default function ReviewWallClient({ initialData }: ReviewWallClientProps) {
  const [heading, setHeading] = useState(initialData.heading);
  const [tagline, setTagline] = useState(initialData.tagline);
  const [slots, setSlots] = useState<ReviewWallSlot[]>(initialData.slots);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Update URL for a slot
  const handleUrlChange = (index: number, newUrl: string) => {
    setSlots((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], url: newUrl };
      return copy;
    });
  };

  // Image Upload handler for a slot
  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSlots((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], image_url: result };
        return copy;
      });
      setFeedback({ type: "success", text: `✓ Image updated for Slot ${index + 1}. Click "Save Changes" to apply.` });
    };
    reader.readAsDataURL(file);
  };

  // Save Changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    const payload: ReviewWallData = {
      heading,
      tagline,
      slots,
    };

    const res = await saveReviewWallDataAction(payload);
    setLoading(false);

    if (res.success) {
      setFeedback({
        type: "success",
        text: "✓ Review Wall updated successfully! The home page now reflects your changes.",
      });
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({
        type: "error",
        text: res.error || "Failed to save Review Wall settings.",
      });
    }
  };

  return (
    <div style={{ maxWidth: "1600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ── 1. HEADER (Matches Image 2) ─────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: "clamp(24px, 3.5vw, 32px)",
              fontWeight: 900,
              margin: "0 0 4px",
              color: "#FFFFFF",
              letterSpacing: "-0.03em",
            }}
          >
            Review Wall
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)", margin: 0, maxWidth: "700px" }}>
            Manage the Instagram posts shown on the home page. Update any URL and save — the wall updates immediately on the next page load.
          </p>
        </div>

        {/* Save Changes Button (Orange Website Theme) */}
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "11px 24px",
            background: "linear-gradient(135deg, #FF6F26 0%, #FF4400 100%)",
            border: "none",
            borderRadius: "14px",
            color: "#FFFFFF",
            fontSize: "13.5px",
            fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 4px 18px rgba(255, 111, 38, 0.45)",
            transition: "all 0.15s ease",
            opacity: loading ? 0.7 : 1,
          }}
          className="hover:brightness-110 active:scale-[0.98]"
        >
          <Save size={16} />
          <span>{loading ? "Saving Changes..." : "Save Changes"}</span>
        </button>
      </div>

      {/* ── 2. FEEDBACK ALERT ──────────────────────────────────────────── */}
      {feedback && (
        <div
          style={{
            background:
              feedback.type === "success"
                ? "rgba(39, 201, 63, 0.12)"
                : "rgba(255, 68, 68, 0.12)",
            border:
              feedback.type === "success"
                ? "1px solid rgba(39, 201, 63, 0.35)"
                : "1px solid rgba(255, 68, 68, 0.35)",
            borderRadius: "14px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: feedback.type === "success" ? "#4ADE80" : "#FF8080",
            fontSize: "13.5px",
            fontWeight: 700,
          }}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle size={18} className="shrink-0 text-rose-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ── 3. SECTION TEXT CARD (Matches Image 2) ──────────────────────── */}
      <div
        style={{
          background: "rgba(18, 12, 24, 0.92)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "20px",
          padding: "24px 28px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#FF6F26" }}>
          <InstagramIcon size={18} />
          <span style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF" }}>Section Text</span>
        </div>

        {/* Heading Input */}
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255, 255, 255, 0.7)", marginBottom: "6px" }}>
            Heading
          </label>
          <input
            type="text"
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            placeholder="Stories from the Squad"
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "rgba(0, 0, 0, 0.45)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "12px",
              color: "#FFFFFF",
              fontSize: "13.5px",
              outline: "none",
            }}
            className="focus:border-[#FF6F26] transition-colors"
          />
        </div>

        {/* Tagline / CTA text Input */}
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255, 255, 255, 0.7)", marginBottom: "6px" }}>
            Tagline / CTA text
          </label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Tag @qhq on Instagram to get featured on the Review Wall"
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "rgba(0, 0, 0, 0.45)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "12px",
              color: "#FFFFFF",
              fontSize: "13.5px",
              outline: "none",
            }}
            className="focus:border-[#FF6F26] transition-colors"
          />
        </div>
      </div>

      {/* ── 4. INSTAGRAM POST URLS (Matches Image 2 & 3) ────────────────── */}
      <div
        style={{
          background: "rgba(18, 12, 24, 0.92)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "20px",
          padding: "24px 28px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ fontSize: "15px", fontWeight: 900, color: "#FFFFFF", margin: "0 0 4px" }}>
              Instagram Post URLs
            </h2>
            <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.55)", margin: 0 }}>
              Use slots 1-2 for reels/videos and slots 3-6 for Instagram posts. The home page keeps this saved slot order exactly.
            </p>
          </div>

          <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255, 255, 255, 0.5)", background: "rgba(255, 255, 255, 0.05)", padding: "4px 10px", borderRadius: "8px" }}>
            up to 6 posts
          </span>
        </div>

        {/* 6 Slots Grid (2 columns on medium+ screens) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "16px" }}>
          {slots.map((slot, index) => (
            <div
              key={slot.id || index}
              style={{
                background: "rgba(0, 0, 0, 0.35)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "16px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {/* Slot Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "rgba(255, 255, 255, 0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "rgba(255, 255, 255, 0.7)",
                    }}
                  >
                    {slot.slot}
                  </div>
                  <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#FFFFFF" }}>
                    {slot.label}
                  </span>
                </div>

                {/* Upload Image Button */}
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    color: "#FFFFFF",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  className="hover:bg-white/[0.16]"
                >
                  <Upload size={12} />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(index, e)}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              {/* Photo Thumbnail Preview (if present) */}
              {slot.image_url && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255, 255, 255, 0.03)", padding: "8px 10px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slot.image_url}
                    alt={slot.label}
                    style={{
                      width: "48px",
                      height: "36px",
                      borderRadius: "6px",
                      objectFit: "cover",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                    }}
                  />
                  <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    Photo: {slot.image_url.startsWith("data:") ? "Custom uploaded image" : slot.image_url}
                  </div>
                </div>
              )}

              {/* URL Input */}
              <div style={{ position: "relative" }}>
                <input
                  type="url"
                  value={slot.url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  placeholder={slot.type === "reel" ? "https://www.instagram.com/reel/..." : "https://www.instagram.com/p/..."}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "rgba(0, 0, 0, 0.5)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "10px",
                    color: "#FFFFFF",
                    fontSize: "12.5px",
                    outline: "none",
                  }}
                  className="focus:border-[#FF6F26] transition-colors"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. BOTTOM INFO BANNER (Matches Image 3) ─────────────────────── */}
      <div
        style={{
          background: "rgba(255, 111, 38, 0.06)",
          border: "1px solid rgba(255, 111, 38, 0.25)",
          borderRadius: "16px",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "12.5px",
          color: "rgba(255, 255, 255, 0.8)",
        }}
      >
        <InstagramIcon size={18} className="text-[#FF8A3D] shrink-0" />
        <span>After saving, the home page will reflect your changes immediately on the next page load. No redeploy needed.</span>
      </div>
    </div>
  );
}
