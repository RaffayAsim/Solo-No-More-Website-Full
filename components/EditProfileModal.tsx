"use client";

import { useState, useEffect } from "react";
import { updateProfileAction } from "@/app/actions/profile";
import {
  User,
  Camera,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfile: {
    id: string;
    full_name?: string | null;
    phone?: string | null;
    bio?: string | null;
    social_link?: string | null;
    city?: string;
    avatar_icon?: string;
    vibe_tags?: string[];
    // Extended fields
    first_name?: string;
    last_name?: string;
    cnic?: string;
    address?: string;
    gender?: string;
    cnic_picture_url?: string;
    avatar_url?: string;
  };
  email?: string;
  onProfileUpdated?: () => void;
}

const AVAILABLE_VIBES = [
  "Techno & House",
  "Late Night Chai",
  "Padel & Sports",
  "Live Music",
  "Rooftop Lounges",
  "Deep Beats",
  "Weekend Roadtrips",
  "Café Crawls",
];

export default function EditProfileModal({
  isOpen,
  onClose,
  initialProfile,
  email = "raffay.asim6@gmail.com",
  onProfileUpdated,
}: EditProfileModalProps) {
  // Split full name if first_name / last_name not explicitly provided
  const nameParts = (initialProfile.full_name || "").trim().split(" ");
  const defaultFirstName = initialProfile.first_name || nameParts[0] || "Abdul";
  const defaultLastName =
    initialProfile.last_name || nameParts.slice(1).join(" ") || "Raffay";

  const [firstName, setFirstName] = useState(defaultFirstName);
  const [lastName, setLastName] = useState(defaultLastName);
  const [cnic, setCnic] = useState(initialProfile.cnic || "12345-6789012-3");
  const [phone, setPhone] = useState(initialProfile.phone || "03332877852");
  const [address, setAddress] = useState(
    initialProfile.address || "House 45-B, Street 2, Phase 5, DHA, Lahore, Pakistan"
  );
  const [gender, setGender] = useState(initialProfile.gender || "Male");
  const [cnicPictureUrl, setCnicPictureUrl] = useState(initialProfile.cnic_picture_url || "");
  const [bio, setBio] = useState(initialProfile.bio || "");
  const [city, setCity] = useState(initialProfile.city || "Karachi");
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url || "");
  const [vibeTags, setVibeTags] = useState<string[]>(
    initialProfile.vibe_tags || ["Techno & House", "Late Night Chai", "Padel & Sports"]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleVibe = (tag: string) => {
    setVibeTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const initials =
    `${firstName.charAt(0) || ""}${lastName.charAt(0) || ""}`.toUpperCase() || "AR";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await updateProfileAction({
        firstName,
        lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        phone,
        cnic,
        address,
        gender,
        cnic_picture_url: cnicPictureUrl,
        avatar_url: avatarUrl,
        bio,
        city,
        vibe_tags: vibeTags,
      });

      if (res.success) {
        setSuccessMsg("Profile successfully updated!");
        setTimeout(() => {
          onProfileUpdated?.();
          onClose();
        }, 700);
      } else {
        setErrorMsg(res.error || "Failed to update profile.");
      }
    } catch {
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-xl overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[94vh] overflow-y-auto rounded-2xl sm:rounded-3xl border border-[#FF5A1F]/40 p-4 sm:p-7 shadow-[0_32px_80px_rgba(0,0,0,0.95),0_0_45px_rgba(255,90,31,0.25)] text-white"
        style={{
          background: "linear-gradient(150deg, #130B1C 0%, #09050F 100%)",
          fontFamily:
            "var(--font-display), 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        }}
      >
        {/* ── GUARANTEED VISIBLE CLOSE "✕" BUTTON ────────────────────────── */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          title="Close (Esc)"
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "rgba(255, 255, 255, 0.16)",
            border: "1.5px solid rgba(255, 255, 255, 0.4)",
            borderRadius: "12px",
            width: "38px",
            height: "38px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            cursor: "pointer",
            zIndex: 30,
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.5)",
            transition: "all 0.15s ease",
          }}
          className="hover:scale-105 active:scale-95 hover:bg-white/30 hover:border-white"
        >
          {/* Explicit SVG - Never collapses */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ display: "block" }}
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* ── MODAL HEADER ────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "22px",
            paddingRight: "50px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #FF6F26, #FF5A1F)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 16px rgba(255, 90, 31, 0.4)",
              flexShrink: 0,
            }}
          >
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 900,
                margin: 0,
                letterSpacing: "-0.02em",
                color: "#FFFFFF",
              }}
            >
              Edit User Profile
            </h2>
            <p
              style={{
                fontSize: "12.5px",
                color: "rgba(255, 255, 255, 0.65)",
                margin: "2px 0 0",
              }}
            >
              Manage your personal identity, CNIC verification &amp; contact details
            </p>
          </div>
        </div>

        {/* ── TOP READONLY SUMMARY TILES (Matching Image 3) ─────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "14px",
              padding: "12px 16px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontWeight: 800,
                color: "rgba(255, 255, 255, 0.5)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              NAME
            </div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 800,
                color: "#FFFFFF",
                marginTop: "4px",
              }}
            >
              {firstName} {lastName}
            </div>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "14px",
              padding: "12px 16px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontWeight: 800,
                color: "rgba(255, 255, 255, 0.5)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              EMAIL
            </div>
            <div
              style={{
                fontSize: "13.5px",
                fontWeight: 700,
                color: "rgba(255, 255, 255, 0.85)",
                marginTop: "4px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {email}
            </div>
          </div>
        </div>

        {/* ── PROFILE PHOTO SECTION (Matching Image 3) ─────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "18px",
            padding: "16px",
            marginBottom: "24px",
          }}
        >
          {/* Avatar with Camera Overlay */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "22px",
                background: "linear-gradient(135deg, #FF6F26 0%, #E82F74 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                fontWeight: 900,
                color: "#FFFFFF",
                boxShadow: "0 8px 24px rgba(255, 90, 31, 0.4)",
                overflow: "hidden",
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                initials
              )}
            </div>

            <div
              style={{
                position: "absolute",
                bottom: "-4px",
                right: "-4px",
                width: "26px",
                height: "26px",
                borderRadius: "8px",
                background: "#FF5A1F",
                border: "2px solid #09050F",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              }}
            >
              <Camera className="w-3.5 h-3.5" />
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF", marginBottom: "3px" }}>
              Profile Photo
            </div>
            <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", marginBottom: "8px" }}>
              Upload a clear image. It will be visible across your dashboard profile.
            </div>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="Paste image URL (e.g. https://... or leave empty for initials)"
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "10px",
                padding: "8px 12px",
                color: "#FFFFFF",
                fontSize: "12px",
                outline: "none",
              }}
              className="focus:border-[#FF5A1F] transition-colors"
            />
          </div>
        </div>

        {/* ── THE BIG FORM: ALL REQUESTED USER PROFILE DETAILS ─────────── */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.7)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                }}
              >
                First Name *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="e.g. Abdul"
                style={{
                  width: "100%",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "12px",
                  padding: "11px 14px",
                  color: "#FFFFFF",
                  fontSize: "13.5px",
                  outline: "none",
                }}
                className="focus:border-[#FF5A1F] transition-colors"
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.7)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                }}
              >
                Last Name *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="e.g. Raffay"
                style={{
                  width: "100%",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "12px",
                  padding: "11px 14px",
                  color: "#FFFFFF",
                  fontSize: "13.5px",
                  outline: "none",
                }}
                className="focus:border-[#FF5A1F] transition-colors"
              />
            </div>
          </div>

          {/* CNIC Number */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 800,
                color: "rgba(255,255,255,0.7)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              CNIC Number *
            </label>
            <input
              type="text"
              value={cnic}
              onChange={(e) => setCnic(e.target.value)}
              required
              placeholder="12345-6789012-3"
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "12px",
                padding: "11px 14px",
                color: "#FFFFFF",
                fontSize: "13.5px",
                outline: "none",
                fontFamily: "monospace",
              }}
              className="focus:border-[#FF5A1F] transition-colors"
            />
          </div>

          {/* Phone Number & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.7)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                }}
              >
                Phone Number *
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="03332877852"
                style={{
                  width: "100%",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "12px",
                  padding: "11px 14px",
                  color: "#FFFFFF",
                  fontSize: "13.5px",
                  outline: "none",
                }}
                className="focus:border-[#FF5A1F] transition-colors"
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.7)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                }}
              >
                City Radar Hub
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{
                  width: "100%",
                  background: "#160F22",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "12px",
                  padding: "11px 14px",
                  color: "#FFFFFF",
                  fontSize: "13.5px",
                  outline: "none",
                }}
              >
                <option value="Karachi">Karachi</option>
                <option value="Lahore">Lahore</option>
                <option value="Islamabad">Islamabad</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 800,
                color: "rgba(255,255,255,0.7)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              Address *
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              placeholder="House 45-B, Street 2, Phase 5, DHA, Lahore, Pakistan"
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "12px",
                padding: "11px 14px",
                color: "#FFFFFF",
                fontSize: "13.5px",
                outline: "none",
              }}
              className="focus:border-[#FF5A1F] transition-colors"
            />
          </div>

          {/* Gender & CNIC Picture URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.7)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                }}
              >
                Gender *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                style={{
                  width: "100%",
                  background: "#160F22",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "12px",
                  padding: "11px 14px",
                  color: "#FFFFFF",
                  fontSize: "13.5px",
                  outline: "none",
                }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.7)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                }}
              >
                CNIC Picture URL
              </label>
              <input
                type="text"
                value={cnicPictureUrl}
                onChange={(e) => setCnicPictureUrl(e.target.value)}
                placeholder="https://..."
                style={{
                  width: "100%",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "12px",
                  padding: "11px 14px",
                  color: "#FFFFFF",
                  fontSize: "13.5px",
                  outline: "none",
                }}
                className="focus:border-[#FF5A1F] transition-colors"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 800,
                color: "rgba(255,255,255,0.7)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              Bio &amp; Vibe Statement
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell us a little about yourself, your social preferences, music vibes..."
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "12px",
                padding: "11px 14px",
                color: "#FFFFFF",
                fontSize: "13px",
                outline: "none",
                resize: "none",
              }}
              className="focus:border-[#FF5A1F] transition-colors"
            />
          </div>

          {/* Vibe Tags */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 800,
                color: "rgba(255,255,255,0.7)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Interests &amp; Vibe Tags
            </label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {AVAILABLE_VIBES.map((tag) => {
                const isSelected = vibeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleVibe(tag)}
                    style={{
                      background: isSelected
                        ? "rgba(255, 90, 31, 0.25)"
                        : "rgba(255, 255, 255, 0.05)",
                      border: isSelected
                        ? "1px solid #FF5A1F"
                        : "1px solid rgba(255, 255, 255, 0.1)",
                      color: isSelected ? "#FFA05C" : "rgba(255, 255, 255, 0.7)",
                      padding: "5px 12px",
                      borderRadius: "8px",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>{isSelected ? "✓" : "+"}</span>
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Feedback */}
          {errorMsg && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                background: "rgba(255, 59, 48, 0.15)",
                border: "1px solid rgba(255, 59, 48, 0.35)",
                color: "#FF6B6B",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                background: "rgba(39, 201, 63, 0.15)",
                border: "1px solid rgba(39, 201, 63, 0.35)",
                color: "#27C93F",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "8px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "12px",
                padding: "12px 20px",
                color: "rgba(255, 255, 255, 0.8)",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)",
                border: "none",
                borderRadius: "12px",
                padding: "12px 28px",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 800,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 6px 20px rgba(255, 90, 31, 0.45)",
                opacity: isSubmitting ? 0.7 : 1,
              }}
              className="hover:scale-105 active:scale-95 transition-transform"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? "Saving Changes..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
