"use client";

import { useState } from "react";
import { createBeacon } from "@/app/actions/beacons";
import type { BeaconCategory, BeaconVisibility } from "@/lib/supabase/types";

interface CreateBeaconModalProps {
  onClose: () => void;
  onCreated: () => void;
  isPartner?: boolean;
  defaultCity?: string;
}

const CATEGORIES: {
  value: BeaconCategory;
  label: string;
  glyph: string;
}[] = [
  {
    value: "sports",
    label: "Sports",
    glyph: "◈ SPORTS",
  },
  {
    value: "casual",
    label: "Casual",
    glyph: "☕ CASUAL",
  },
  {
    value: "nightlife",
    label: "Nightlife",
    glyph: "⚡ NIGHTLIFE",
  },
];

export default function CreateBeaconModal({
  onClose,
  onCreated,
  isPartner = false,
  defaultCity = "Karachi",
}: CreateBeaconModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<BeaconCategory>("casual");
  const [visibility, setVisibility] = useState<BeaconVisibility>("stranger");
  const [slots, setSlots] = useState(3);
  const [location, setLocation] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [imageUrl, setImageUrl] = useState("");
  const [isPartnerOffer, setIsPartnerOffer] = useState(false);

  const [scoutMode, setScoutMode] = useState<"venue" | "neighborhood">("venue");
  const [scoutDay, setScoutDay] = useState<"today" | "tomorrow">("today");
  const [scoutTimeBand, setScoutTimeBand] = useState<"evening" | "latenight" | "midnight">("evening");

  const calculateFuzzyTimestamp = (day: "today" | "tomorrow", band: "evening" | "latenight" | "midnight") => {
    const date = new Date();
    if (day === "tomorrow") {
      date.setDate(date.getDate() + 1);
    }
    if (band === "evening") {
      date.setHours(18, 0, 0, 0);
    } else if (band === "latenight") {
      date.setHours(22, 0, 0, 0);
    } else if (band === "midnight") {
      // Midnight of selected day is technically start of next calendar day at 00:00
      date.setDate(date.getDate() + 1);
      date.setHours(0, 0, 0, 0);
    }
    return date.toISOString();
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Client-side HTML5 Canvas Image Auto-Compressor
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400; // Optimal retro display size
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Compress quality to 0.4 for extremely low storage weights (~10KB)
          const dataUrl = canvas.toDataURL("image/jpeg", 0.4);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const compressed = await compressImage(file);
      setImageUrl(compressed);
    } catch {
      setError("Failed to auto-compress uploaded image banner.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await createBeacon({
      title,
      description,
      category,
      visibility_mode: visibility,
      total_slots: slots,
      location_name: location,
      scheduled_at: (scoutMode === "neighborhood"
        ? calculateFuzzyTimestamp(scoutDay, scoutTimeBand)
        : scheduledAt) || undefined,
      city,
      image_url: imageUrl || undefined,
      is_partner_offer: isPartnerOffer,
    });

    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      onCreated();
      onClose();
    }, 1200);
  };

  return (
    /* Backdrop Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Modal Nokia Panel */}
      <div
        className="nokia-panel relative z-10 w-full max-w-md font-mono page-swipe"
        style={{
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          overflow: "hidden",
          backgroundColor: "var(--bg-base)",
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            background: isPartnerOffer ? "var(--accent-success)" : "var(--accent-primary)",
            color: isPartnerOffer ? "#111" : "white",
            padding: "10px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "2px solid var(--border-strong)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span className="font-pixel" style={{ fontSize: "8px" }}>
              {isPartnerOffer ? "▤ BROADCAST PARTNER OFFER" : "★ POST A BEACON"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="font-pixel"
            style={{
              background: "none",
              border: "none",
              color: isPartnerOffer ? "#111" : "white",
              cursor: "pointer",
              fontSize: "12px",
              padding: "0",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: "16px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "4px" }}>
            <div className="font-lcd" style={{ fontSize: "20px", color: isPartnerOffer ? "var(--accent-success)" : "var(--accent-primary)" }}>
              {isPartnerOffer ? "PARTNER PROMO BROADCAST" : "NEW VIBE TRANSMISSION"}
            </div>
            <p className="font-mono text-muted" style={{ fontSize: "11px", margin: "2px 0 0 0" }}>
              Broadcast your real-time matching frequency
            </p>
          </div>

          {/* Title */}
          <div>
            <label
              className="font-pixel"
              style={{
                display: "block",
                fontSize: "7px",
                marginBottom: "6px",
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
              }}
            >
              ♦ BEACON TITLE
            </label>
            <input
              id="beacon-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
              placeholder="e.g. PADEL MATCH, CHAI RUN..."
              className="nokia-input"
            />
            <div
              className="font-pixel"
              style={{
                fontSize: "6px",
                color: "var(--text-muted)",
                marginTop: "4px",
                textAlign: "right",
              }}
            >
              {title.length}/60 CHARS
            </div>
          </div>

          {/* IF partner, show Partner Offer checkbox */}
          {isPartner && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px",
              background: "rgba(51, 255, 102, 0.05)",
              border: "2px dashed var(--accent-success)",
              borderRadius: "2px",
            }}>
              <input
                id="partner-offer-toggle"
                type="checkbox"
                checked={isPartnerOffer}
                onChange={(e) => setIsPartnerOffer(e.target.checked)}
                style={{
                  width: "18px",
                  height: "18px",
                  cursor: "pointer",
                }}
              />
              <label htmlFor="partner-offer-toggle" className="font-pixel" style={{ fontSize: "7px", color: "var(--accent-success)", cursor: "pointer" }}>
                ◈ MARK AS BUSINESS PARTNER PROMO OFFER
              </label>
            </div>
          )}

          {/* Category */}
          <div>
            <label
              className="font-pixel"
              style={{
                display: "block",
                fontSize: "7px",
                marginBottom: "6px",
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
              }}
            >
              ◈ CATEGORY
            </label>
            <div className="beacon-category-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
              {CATEGORIES.map(({ value, label, glyph }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  className={category === value ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
                  style={{
                    fontSize: "7px",
                    width: "100%",
                    padding: "10px 4px",
                  }}
                >
                  {glyph}
                </button>
              ))}
            </div>
          </div>

          {/* Image Banner Compressor Upload */}
          <div>
            <label
              className="font-pixel"
              style={{
                display: "block",
                fontSize: "7px",
                marginBottom: "6px",
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
              }}
            >
              📷 BEACON BANNER IMAGE (AUTO-COMPRESSED)
            </label>
            
            <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
              {/* File Uploader */}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
                id="banner-image-file"
              />
              <label
                htmlFor="banner-image-file"
                className="nokia-btn text-center"
                style={{
                  padding: "10px",
                  fontSize: "8px",
                  cursor: "pointer",
                  display: "block",
                  fontFamily: "var(--font-pixel)",
                }}
              >
                {imageUrl ? "✓ BANNER ATTACHED (REPLACE)" : "[ 📷 UPLOAD BANNER ]"}
              </label>

              {/* URL Passthrough alternative */}
              <input
                type="text"
                placeholder="OR PASTE BANNER URL..."
                value={imageUrl.startsWith("data:") ? "" : imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="nokia-input"
                style={{ fontSize: "10px" }}
              />
            </div>
            
            {imageUrl && (
              <div style={{ marginTop: "10px", overflow: "hidden", border: "2px solid var(--border-light)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Compressed preview"
                  style={{
                    width: "100%",
                    maxHeight: "100px",
                    objectFit: "cover",
                    filter: "grayscale(1) contrast(1.3)",
                  }}
                />
                <div className="font-pixel text-center text-muted" style={{ fontSize: "6px", padding: "4px" }}>
                  90S LOW-RES CRT DITHER PREVIEW
                </div>
              </div>
            )}
          </div>

          {/* Visibility toggle */}
          <div>
            <label
              className="font-pixel"
              style={{
                display: "block",
                fontSize: "7px",
                marginBottom: "6px",
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
              }}
            >
              ▣ VISIBILITY MODE
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                {
                  value: "stranger" as BeaconVisibility,
                  label: "STRANGER MODE",
                  sub: "Open to all members",
                  prefix: "🌐",
                },
                {
                  value: "friend" as BeaconVisibility,
                  label: "FRIEND MODE",
                  sub: "Accepted friends only",
                  prefix: "👤",
                },
              ].map(({ value, label, sub, prefix }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setVisibility(value)}
                  className={visibility === value ? "nokia-panel-sunken text-accent" : "nokia-panel"}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    padding: "10px 12px",
                    textAlign: "left",
                    cursor: "pointer",
                    gap: "4px",
                    borderRadius: "2px",
                  }}
                >
                  <span className="font-pixel" style={{ fontSize: "7px", fontWeight: "bold" }}>
                    {prefix} {label}
                  </span>
                  <span className="font-mono text-muted" style={{ fontSize: "9px" }}>
                    {sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* City Selection */}
          <div>
            <label
              className="font-pixel"
              style={{
                display: "block",
                fontSize: "7px",
                marginBottom: "6px",
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
              }}
            >
              🏙 BEACON REGION / CITY
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="nokia-input"
              style={{
                background: "var(--bg-sunken)",
                color: "var(--text-primary)",
                border: "2px solid var(--border-strong)",
                padding: "10px",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="Karachi">KARACHI</option>
              <option value="Lahore">LAHORE</option>
              <option value="Islamabad">ISLAMABAD</option>
            </select>
          </div>

          {/* Slot counter */}
          <div>
            <label
              className="font-pixel"
              style={{
                display: "block",
                fontSize: "7px",
                marginBottom: "6px",
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
              }}
            >
              ● OPEN SLOTS (CAPACITY)
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "2px solid var(--border-strong)",
                  borderRadius: "2px",
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={() => setSlots((s) => Math.max(1, s - 1))}
                  className="nokia-btn"
                  style={{ padding: "6px 12px", borderRadius: "0", border: "none" }}
                  aria-label="Decrease slots"
                >
                  ◀
                </button>
                <span
                  className="font-pixel"
                  style={{
                    width: "40px",
                    textAlign: "center",
                    fontSize: "10px",
                    background: "var(--bg-sunken)",
                    color: "var(--text-primary)",
                    padding: "6px 0",
                    fontWeight: "bold",
                    borderLeft: "2px solid var(--border-strong)",
                    borderRight: "2px solid var(--border-strong)",
                  }}
                >
                  {slots}
                </span>
                <button
                  type="button"
                  onClick={() => setSlots((s) => Math.min(10, s + 1))}
                  className="nokia-btn"
                  style={{ padding: "6px 12px", borderRadius: "0", border: "none" }}
                  aria-label="Increase slots"
                >
                  ▶
                </button>
              </div>

              {/* Slot dots preview */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <span
                    key={i}
                    className="font-pixel"
                    style={{
                      fontSize: "14px",
                      lineHeight: 1,
                      color: i < slots ? "var(--accent-primary)" : "var(--border-light)",
                    }}
                  >
                    {i < slots ? "●" : "○"}
                  </span>
                ))}
              </div>
            </div>
            <p className="font-mono text-muted" style={{ fontSize: "10px", marginTop: "6px" }}>
              {slots} {slots === 1 ? "person" : "people"} joining you
            </p>
          </div>

          {/* Coordination Mode */}
          <div>
            <label
              className="font-pixel"
              style={{
                display: "block",
                fontSize: "7px",
                marginBottom: "6px",
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
              }}
            >
              ◈ COORDINATION MODE
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setScoutMode("venue")}
                className={scoutMode === "venue" ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
                style={{ fontSize: "7px", width: "100%", padding: "10px 4px" }}
              >
                SPECIFIC VENUE
              </button>
              <button
                type="button"
                onClick={() => setScoutMode("neighborhood")}
                className={scoutMode === "neighborhood" ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
                style={{ fontSize: "7px", width: "100%", padding: "10px 4px" }}
              >
                NEIGHBORHOOD SCOUT
              </button>
            </div>
          </div>

          {/* Location */}
          <div>
            <label
              className="font-pixel"
              style={{
                display: "block",
                fontSize: "7px",
                marginBottom: "6px",
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
              }}
            >
              ◈ LOCATION
            </label>
            <input
              id="beacon-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={scoutMode === "neighborhood" ? "e.g., Clifton / DHA Phase 6 (Open Plan)" : "Venue name or area"}
              className="nokia-input"
            />
          </div>

          {/* Date & Time / Fuzzy Selector */}
          {scoutMode === "venue" ? (
            <div>
              <label
                className="font-pixel"
                style={{
                  display: "block",
                  fontSize: "7px",
                  marginBottom: "6px",
                  color: "var(--text-muted)",
                  letterSpacing: "0.08em",
                }}
              >
                ▤ DATE & TIME
              </label>
              <input
                id="beacon-datetime"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="nokia-input"
                style={{ colorScheme: "dark" }}
              />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <label
                  className="font-pixel"
                  style={{
                    display: "block",
                    fontSize: "7px",
                    marginBottom: "6px",
                    color: "var(--text-muted)",
                    letterSpacing: "0.08em",
                  }}
                >
                  ▤ TARGET DAY
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setScoutDay("today")}
                    className={scoutDay === "today" ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
                    style={{ fontSize: "7px", width: "100%", padding: "10px 4px" }}
                  >
                    TODAY
                  </button>
                  <button
                    type="button"
                    onClick={() => setScoutDay("tomorrow")}
                    className={scoutDay === "tomorrow" ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
                    style={{ fontSize: "7px", width: "100%", padding: "10px 4px" }}
                  >
                    TOMORROW
                  </button>
                </div>
              </div>

              <div>
                <label
                  className="font-pixel"
                  style={{
                    display: "block",
                    fontSize: "7px",
                    marginBottom: "6px",
                    color: "var(--text-muted)",
                    letterSpacing: "0.08em",
                  }}
                >
                  🕐 FUZZY TIME BAND
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => setScoutTimeBand("evening")}
                    className={scoutTimeBand === "evening" ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
                    style={{ fontSize: "6.5px", width: "100%", padding: "10px 2px" }}
                  >
                    EVENING (6PM)
                  </button>
                  <button
                    type="button"
                    onClick={() => setScoutTimeBand("latenight")}
                    className={scoutTimeBand === "latenight" ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
                    style={{ fontSize: "6.5px", width: "100%", padding: "10px 2px" }}
                  >
                    LATE NIGHT (10PM)
                  </button>
                  <button
                    type="button"
                    onClick={() => setScoutTimeBand("midnight")}
                    className={scoutTimeBand === "midnight" ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
                    style={{ fontSize: "6.5px", width: "100%", padding: "10px 2px" }}
                  >
                    MIDNIGHT (12AM)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div
              className="nokia-panel-sunken"
              style={{ padding: "10px 14px", borderColor: "var(--accent-danger)" }}
            >
              <span className="font-pixel" style={{ fontSize: "7px", color: "var(--accent-danger)" }}>
                ✕ ERROR:{" "}
              </span>
              <span style={{ fontSize: "11px", color: "var(--accent-danger)" }}>{error}</span>
            </div>
          )}

          <div className="nokia-divider" style={{ margin: "4px 0" }} />

          {/* Actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button
              type="button"
              onClick={onClose}
              className="nokia-btn"
              style={{ fontSize: "8px" }}
            >
              ✕ CANCEL
            </button>
            <button
              id="post-beacon-submit"
              type="submit"
              disabled={isLoading || success}
              className="nokia-btn nokia-btn-primary"
              style={{ fontSize: "8px" }}
            >
              {success ? (
                "✓ POSTED!"
              ) : isLoading ? (
                <span className="pixel-blink">▌ POSTING...</span>
              ) : (
                "★ POST BEACON"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
