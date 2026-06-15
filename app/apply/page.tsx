"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { signUpAction } from "@/app/actions/auth";

export default function ApplyPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [isPartner, setIsPartner] = useState(false);
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [socialLink, setSocialLink] = useState("");
  const [city, setCity] = useState("Karachi");
  const [weekendVibe, setWeekendVibe] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (isPartner && !businessName.trim()) {
      setError("Business name is required for partner applications.");
      setIsLoading(false);
      return;
    }

    // Step 1: Create the user server-side with email pre-confirmed
    const result = await signUpAction({
      email,
      password,
      fullName,
      socialLink,
      bio: weekendVibe,
      city,
      isPartner,
      businessName: isPartner ? businessName : undefined,
    });

    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    // Step 2: Sign in immediately (account is pre-confirmed, no email needed)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Account created but sign-in failed: " + signInError.message);
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 1800);
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-base)", padding: "16px", fontFamily: "var(--font-mono)" }}>
        <div className="nokia-panel" style={{ padding: "32px", maxWidth: "400px", width: "100%", textAlign: "center" }}>
          <div className="nokia-lcd" style={{ fontSize: "20px", color: "var(--accent-success)", marginBottom: "16px" }}>
            RECEIVED ✓
          </div>
          <h2 className="font-pixel text-success" style={{ fontSize: "12px", margin: "12px 0 0 0" }}>
            {isPartner ? "PROPOSAL RECEIVED" : "APPLICATION RECEIVED"}
          </h2>
          <p className="font-mono text-muted" style={{ fontSize: "11px", marginTop: "8px", lineHeight: "1.4" }}>
            {isPartner 
              ? "Your partner onboarding request is queued. Redirecting you to your dashboard..."
              : "Welcome to the waitlist. Redirecting you to your dashboard…"}
          </p>
          <div style={{ marginTop: "16px" }} className="pixel-blink font-pixel text-accent">
            ■ ■ ■ ■
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-base)", color: "var(--text-primary)", fontFamily: "var(--font-mono)", padding: "48px 16px 24px 16px" }}>
      
      {/* Mini top statusbar */}
      <div className="nokia-statusbar" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="font-pixel" style={{ fontSize: "8px", color: "var(--statusbar-text)" }}>◈ SNM</span>
          <span style={{ fontSize: "8px", opacity: 0.6 }}>REGISTRATION</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="font-lcd" style={{ fontSize: "14px", letterSpacing: "0.06em" }}>▌▌▌▌ ▮▮▮</span>
        </div>
      </div>

      <div style={{ maxWidth: "450px", margin: "0 auto" }}>
        {/* Back */}
        <Link
          href="/"
          className="nokia-btn font-pixel"
          style={{ fontSize: "7px", padding: "6px 12px", marginBottom: "20px" }}
        >
          ◀ HOME
        </Link>

        {/* Header */}
        <div className="nokia-panel-sunken text-center" style={{ padding: "16px", marginBottom: "20px" }}>
          <h1 className="font-pixel text-accent" style={{ fontSize: "12px", margin: 0, letterSpacing: "0.08em" }}>
            {isPartner ? "▣ PARTNER ECOSYSTEM APPLICATION" : "▣ APPLY FOR MEMBERSHIP"}
          </h1>
          <p className="font-mono text-muted" style={{ fontSize: "11px", margin: "4px 0 0 0" }}>
            {isPartner
              ? "Apply as a local business partner to publish promo offers and events to the lobby."
              : "Tell us a bit about yourself. Every application is personally reviewed by our team."}
          </p>
          <div className="nokia-badge nokia-badge-primary" style={{ marginTop: "8px", fontSize: "7px" }}>
            {isPartner ? "● VERIFIED PARTNERSHIP" : "● SPOTS REMAINING"}
          </div>
        </div>

        {/* Form Card */}
        <div className="nokia-panel" style={{ padding: "20px" }}>
          {/* Role selector tab grid */}
          <div className="role-toggle-row" style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
            <button
              type="button"
              onClick={() => setIsPartner(false)}
              className={!isPartner ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
              style={{ flex: 1, padding: "8px", fontSize: "8px", fontFamily: "var(--font-pixel)" }}
            >
              ● MEMBER APPLICANT
            </button>
            <button
              type="button"
              onClick={() => setIsPartner(true)}
              className={isPartner ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
              style={{ flex: 1, padding: "8px", fontSize: "8px", fontFamily: "var(--font-pixel)" }}
            >
              ▤ BUSINESS PARTNER
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Business Name (Partner Only) */}
            {isPartner && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label htmlFor="business-name" className="font-pixel text-muted" style={{ fontSize: "7px", color: "var(--accent-success)" }}>
                  ♦ BUSINESS / PARTNER NAME
                </label>
                <input
                  id="business-name"
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. MONOCHROME COFFEE CLUB"
                  className="nokia-input"
                  style={{ borderColor: "var(--accent-success)" }}
                />
              </div>
            )}

            {/* Full Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label htmlFor="full-name" className="font-pixel text-muted" style={{ fontSize: "7px" }}>
                {isPartner ? "REPRESENTATIVE NAME" : "FULL NAME"}
              </label>
              <input
                id="full-name"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={isPartner ? "Contact representative" : "Your full name"}
                className="nokia-input"
              />
            </div>

            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label htmlFor="apply-email" className="font-pixel text-muted" style={{ fontSize: "7px" }}>
                EMAIL ADDRESS
              </label>
              <input
                id="apply-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="nokia-input"
              />
            </div>

            {/* Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label htmlFor="apply-password" className="font-pixel text-muted" style={{ fontSize: "7px" }}>
                CREATE PASSWORD
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="apply-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="nokia-input"
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "var(--text-primary)"
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "✕" : "👁"}
                </button>
              </div>
            </div>

            {/* Social Media Link */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label htmlFor="social-link" className="font-pixel text-muted" style={{ fontSize: "7px" }}>
                SOCIAL MEDIA PROFILE
              </label>
              <input
                id="social-link"
                type="url"
                value={socialLink}
                onChange={(e) => setSocialLink(e.target.value)}
                placeholder="instagram.com/you or linkedin.com/in/you"
                className="nokia-input"
              />
              <span className="font-mono text-muted" style={{ fontSize: "10px", marginTop: "2px" }}>
                Instagram or LinkedIn · helps us verify you
              </span>
            </div>

            {/* City Selection */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label htmlFor="select-city" className="font-pixel text-muted" style={{ fontSize: "7px" }}>
                SELECT YOUR CITY
              </label>
              <select
                id="select-city"
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

            {/* Divider */}
            <hr className="nokia-divider" />

            {/* Weekend Vibe */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label htmlFor="weekend-vibe" className="font-pixel text-muted" style={{ fontSize: "7px" }}>
                {isPartner ? "BUSINESS DETAILS & PROMO OFFERS" : "WHAT IS YOUR USUAL WEEKEND VIBE?"}
              </label>
              <textarea
                id="weekend-vibe"
                required
                rows={4}
                maxLength={500}
                value={weekendVibe}
                onChange={(e) => {
                  setWeekendVibe(e.target.value);
                  setCharCount(e.target.value.length);
                }}
                placeholder={
                  isPartner
                    ? "Specify the types of promotions, exclusive discounts, or events your business intends to post in the matching lobby..."
                    : "Rooftop bars? Spontaneous road trips? Tell us what a great weekend looks like for you..."
                }
                className="nokia-input"
                style={{ resize: "none" }}
              />
              <div style={{ textAlign: "right", fontSize: "10px", color: charCount > 450 ? "var(--accent-warning)" : "var(--text-muted)" }}>
                {charCount}/500
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="nokia-panel-raised" style={{ borderColor: "var(--accent-danger)", padding: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="font-pixel text-danger" style={{ fontSize: "9px" }}>[✕ ERROR]</span>
                <span className="font-mono text-danger" style={{ fontSize: "11px" }}>{error}</span>
              </div>
            )}

            {/* Terms note */}
            <p className="font-mono text-muted text-center" style={{ fontSize: "10px", margin: 0 }}>
              By applying, you agree to our community standards. We will review your application within 3–5 business days.
            </p>

            {/* Submit */}
            <button
              id="apply-now-btn"
              type="submit"
              disabled={isLoading}
              className="nokia-btn nokia-btn-primary"
              style={{ width: "100%", padding: "12px" }}
            >
              {isLoading ? "SUBMITTING APPLICATION..." : "▣ APPLY NOW"}
            </button>
          </form>
        </div>

        <p className="font-mono text-center text-muted" style={{ fontSize: "11px", marginTop: "16px" }}>
          Already a member?{" "}
          <Link href="/login" id="goto-login-link" className="text-accent" style={{ textDecoration: "underline" }}>
            Sign in here →
          </Link>
        </p>
      </div>
    </div>
  );
}
