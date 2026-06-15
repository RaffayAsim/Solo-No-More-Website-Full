"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateProfile } from "@/app/actions/billing";

const RETRO_AVATARS = ["👾", "👽", "🤖", "🐱", "☕", "🕹️", "📟", "💾", "🛸", "⚡"];

interface ProfileEditClientProps {
  initialProfile: {
    id: string;
    full_name: string | null;
    bio: string | null;
    social_link: string | null;
    city?: string | null;
    avatar_icon?: string | null;
    is_partner?: boolean | null;
    business_name?: string | null;
    vibe_tags?: string[] | null;
    is_active_seeker?: boolean | null;
  };
}

export default function ProfileEditClient({ initialProfile }: ProfileEditClientProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialProfile.full_name || "");
  const [bio, setBio] = useState(initialProfile.bio || "");
  const [socialLink, setSocialLink] = useState(initialProfile.social_link || "");
  const [city, setCity] = useState(initialProfile.city || "Karachi");
  const [avatarIcon, setAvatarIcon] = useState(initialProfile.avatar_icon || "👾");
  const [businessName, setBusinessName] = useState(initialProfile.business_name || "");
  const [vibeTags, setVibeTags] = useState<string[]>(initialProfile.vibe_tags || []);
  const [isActiveSeeker, setIsActiveSeeker] = useState<boolean>(initialProfile.is_active_seeker || false);

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isPartner = initialProfile.is_partner || false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccess(false);

    if (fullName.trim().length === 0) {
      setErrorMsg("Full name is required.");
      setIsLoading(false);
      return;
    }
    if (fullName.length > 50) {
      setErrorMsg("Full name must be 50 characters or less.");
      setIsLoading(false);
      return;
    }
    if (bio.length > 160) {
      setErrorMsg("Bio must be 160 characters or less.");
      setIsLoading(false);
      return;
    }
    if (socialLink.length > 255) {
      setErrorMsg("Social link must be 255 characters or less.");
      setIsLoading(false);
      return;
    }
    if (isPartner && !businessName.trim()) {
      setErrorMsg("Business name is required for partners.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await updateProfile({
        full_name: fullName,
        bio,
        social_link: socialLink,
        city,
        avatar_icon: avatarIcon,
        business_name: isPartner ? businessName : undefined,
        vibe_tags: vibeTags,
        is_active_seeker: isActiveSeeker,
      });

      if (res.success) {
        setSuccess(true);
        router.refresh();
        setTimeout(() => {
          router.push(`/profile/${initialProfile.id}`);
        }, 1000);
      } else {
        setErrorMsg(res.error);
      }
    } catch {
      setErrorMsg("Something went wrong while saving your profile. Please check your network.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-base)", padding: "16px" }}>

      {/* Header nav bar */}
      <div className="nokia-panel" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 14px",
        marginBottom: "16px",
        borderRadius: "2px",
      }}>
        <Link href={`/profile/${initialProfile.id}`} className="nokia-btn" style={{ fontSize: "7px", textDecoration: "none" }}>
          ◀ MY PROFILE
        </Link>
        <span className="font-pixel" style={{ fontSize: "8px", color: "var(--accent-primary)", letterSpacing: "0.08em" }}>
          ◈ EDIT VIBE PROFILE
        </span>
      </div>

      {/* LCD heading */}
      <div className="nokia-lcd" style={{ width: "100%", textAlign: "center", fontSize: "18px", marginBottom: "16px", maxWidth: "480px", display: "block" }}>
        CUSTOMIZE VIBE
      </div>

      <div style={{ maxWidth: "480px" }}>
        {/* Error */}
        {errorMsg && (
          <div className="nokia-panel-sunken" style={{ padding: "10px 14px", marginBottom: "12px", borderColor: "var(--accent-danger)" }}>
            <span className="font-pixel" style={{ fontSize: "7px", color: "var(--accent-danger)" }}>✕ ERROR: </span>
            <span style={{ fontSize: "11px", color: "var(--accent-danger)" }}>{errorMsg}</span>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="nokia-panel-sunken" style={{ padding: "10px 14px", marginBottom: "12px", borderColor: "var(--accent-success)" }}>
            <span className="font-pixel" style={{ fontSize: "7px", color: "var(--accent-success)" }}>✓ SAVED! </span>
            <span style={{ fontSize: "11px", color: "var(--accent-success)" }}>Routing you back to profile...</span>
          </div>
        )}

        {/* Form */}
        <div className="nokia-panel" style={{ padding: "0" }}>
          {/* Title bar */}
          <div style={{ background: "var(--accent-primary)", color: "white", padding: "8px 14px", borderBottom: "2px solid var(--border-strong)" }}>
            <span className="font-pixel" style={{ fontSize: "8px" }}>◈ PROFILE SETTINGS</span>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: "16px" }}>

            {/* Display Name */}
            <div style={{ marginBottom: "14px" }}>
              <label className="font-pixel" style={{ display: "block", fontSize: "7px", marginBottom: "6px", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                ♦ DISPLAY NAME
              </label>
              <input
                type="text"
                required
                maxLength={50}
                placeholder="e.g. ALEX VIBE"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="nokia-input"
              />
              <div className="font-pixel" style={{ fontSize: "6px", color: "var(--text-muted)", marginTop: "4px", textAlign: "right" }}>
                {fullName.length}/50 CHARS
              </div>
            </div>

            {/* IF partner, display Business Name */}
            {isPartner && (
              <div style={{ marginBottom: "14px" }}>
                <label className="font-pixel" style={{ display: "block", fontSize: "7px", marginBottom: "6px", color: "var(--accent-success)", letterSpacing: "0.08em" }}>
                  ▤ BUSINESS NAME (PARTNER ONLY)
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="e.g. THE CAFE CHAIN"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="nokia-input"
                  style={{ borderColor: "var(--accent-success)" }}
                />
              </div>
            )}

            {/* Retro Avatars scrolling list */}
            <div style={{ marginBottom: "14px" }}>
              <label className="font-pixel" style={{ display: "block", fontSize: "7px", marginBottom: "6px", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                👾 SELECT RETRO AVATAR ICON
              </label>
              <div style={{
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                padding: "8px 4px",
                background: "var(--bg-sunken)",
                border: "2px solid var(--border-strong)",
                borderRadius: "2px",
                scrollbarWidth: "thin",
              }}>
                {RETRO_AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatarIcon(emoji)}
                    className={avatarIcon === emoji ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
                    style={{
                      fontSize: "20px",
                      width: "46px",
                      height: "46px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* City Selection */}
            <div style={{ marginBottom: "14px" }}>
              <label className="font-pixel" style={{ display: "block", fontSize: "7px", marginBottom: "6px", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                🏙 SELECT RESIDENT CITY
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

            {/* Seeking Squad Status Toggle */}
            <div className="nokia-panel-sunken" style={{
              padding: "12px",
              marginBottom: "14px",
              background: "var(--bg-sunken)",
              border: "2px solid var(--border-strong)",
              borderRadius: "2px"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <div>
                  <span className="font-pixel" style={{ display: "block", fontSize: "8px", color: "var(--accent-success)", letterSpacing: "0.08em" }}>
                    ● SEEKING SQUAD THIS WEEK?
                  </span>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginTop: "2px", lineHeight: "1.2" }}>
                    Toggles a green pulse indicator on your network card so potential hosts see you are actively seeking matching vibing squads. Auto-expires after 7 days.
                  </span>
                </div>
                <button
                  type="button"
                  className={isActiveSeeker ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
                  style={{
                    fontSize: "8px",
                    minWidth: "75px",
                    height: "30px",
                    justifyContent: "center",
                    flexShrink: 0,
                    borderColor: isActiveSeeker ? "var(--accent-success)" : "var(--border-strong)"
                  }}
                  onClick={() => setIsActiveSeeker(!isActiveSeeker)}
                >
                  {isActiveSeeker ? "● ACTIVE" : "○ INACTIVE"}
                </button>
              </div>
            </div>

            {/* Vibe Tags Selector */}
            <div style={{ marginBottom: "14px" }}>
              <label className="font-pixel" style={{ display: "block", fontSize: "7px", marginBottom: "6px", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                🏷 SELECT RETRO VIBE TAGS (MAX 5)
              </label>
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                padding: "8px",
                background: "var(--bg-sunken)",
                border: "2px solid var(--border-strong)",
                borderRadius: "2px"
              }}>
                {["🏃 ACTIVE", "🎵 MUSIC", "☕ COFFEE", "🌙 NIGHTS", "📚 CULTURE", "🎮 GAMING", "🌊 OUTDOORS", "🍕 FOODIE", "📸 CREATIVE", "💬 SOCIAL"].map((tag) => {
                  const isSelected = vibeTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      className={isSelected ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
                      style={{ fontSize: "8px", padding: "4px 8px" }}
                      onClick={() => {
                        if (isSelected) {
                          setVibeTags(vibeTags.filter((t) => t !== tag));
                        } else {
                          if (vibeTags.length >= 5) {
                            setErrorMsg("You can select at most 5 vibe tags.");
                            return;
                          }
                          setVibeTags([...vibeTags, tag]);
                          setErrorMsg(null);
                        }
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              <div className="font-pixel" style={{ fontSize: "6px", color: "var(--text-muted)", marginTop: "4px", textAlign: "right" }}>
                {vibeTags.length}/5 SELECTED
              </div>
            </div>

            {/* Bio */}
            <div style={{ marginBottom: "14px" }}>
              <label className="font-pixel" style={{ display: "block", fontSize: "7px", marginBottom: "6px", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                ✎ VIBE BIO
              </label>
              <textarea
                rows={4}
                maxLength={160}
                placeholder="Tell other members what you're into..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="nokia-input"
                style={{ resize: "none" }}
              />
              <div className="font-pixel" style={{ fontSize: "6px", color: "var(--text-muted)", marginTop: "4px", textAlign: "right" }}>
                {bio.length}/160 CHARS
              </div>
            </div>

            {/* Social Link */}
            <div style={{ marginBottom: "16px" }}>
              <label className="font-pixel" style={{ display: "block", fontSize: "7px", marginBottom: "6px", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                ◉ SOCIAL LINK
              </label>
              <input
                type="text"
                maxLength={255}
                placeholder="instagram.com/yourhandle"
                value={socialLink}
                onChange={(e) => setSocialLink(e.target.value)}
                className="nokia-input"
              />
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
                Public handle so matches can check your vibe.
              </div>
            </div>

            <div className="nokia-divider" />

            {/* Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <Link
                href={`/profile/${initialProfile.id}`}
                className="nokia-btn"
                style={{ textDecoration: "none", fontSize: "8px", justifyContent: "center" }}
              >
                ✕ CANCEL
              </Link>
              <button
                type="submit"
                disabled={isLoading || success}
                className="nokia-btn nokia-btn-primary"
                style={{ fontSize: "8px" }}
              >
                {isLoading ? <span className="pixel-blink">▌ SAVING...</span> : "✓ SAVE CHANGES"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
