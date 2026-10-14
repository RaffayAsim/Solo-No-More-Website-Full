"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getApplicationByTokenAction, setupMemberCredentialsAction, MemberApplicationRecord } from "@/app/actions/member-applications";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
} from "lucide-react";

function CreateCredentialsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [application, setApplication] = useState<MemberApplicationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadApp() {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const data = await getApplicationByTokenAction(token);
      setApplication(data);
      setLoading(false);
    }
    loadApp();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorMsg("Missing or invalid verification token.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const res = await setupMemberCredentialsAction({
      token,
      password,
    });

    if (!res.success) {
      setErrorMsg(res.error || "Failed to set credentials.");
      setSubmitting(false);
      return;
    }

    // Sign user in immediately
    if (application?.email) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: application.email,
        password,
      });

      if (signInErr) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 1500);
        return;
      }
    }

    setSuccess(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  };

  return (
    <div style={{ background: "#060408", minHeight: "100vh", color: "#FFFFFF", position: "relative", padding: "40px 20px 80px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {/* Background Radial Glow */}
      <div
        style={{
          position: "fixed",
          top: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "900px",
          height: "600px",
          background: "radial-gradient(ellipse 70% 50% at 50% 20%, rgba(255, 90, 31, 0.25) 0%, transparent 80%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      <div style={{ width: "100%", maxWidth: "480px", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 900, color: "#fff" }}>
              solo-no-more
            </span>
          </Link>
          <h1 style={{ fontSize: "28px", fontWeight: 900, margin: "0 0 8px" }}>
            Create Your Login Credentials
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", margin: 0 }}>
            Set a secure password to unlock your verified squad radar.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "rgba(255,255,255,0.7)" }}>Verifying approval token...</p>
          </div>
        ) : !token || !application ? (
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "20px", padding: "30px", textAlign: "center", border: "1px solid rgba(255,255,255,0.12)" }}>
            <AlertCircle className="w-12 h-12 text-[#FF6B6B] mx-auto mb-3" />
            <h2 style={{ fontSize: "18px", fontWeight: 800 }}>Invalid or Expired Link</h2>
            <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.65)", margin: "8px 0 20px" }}>
              This invitation token is invalid or has already been used to set credentials.
            </p>
            <Link
              href="/login"
              style={{
                display: "inline-block",
                background: "#FF5A1F",
                color: "#fff",
                padding: "10px 24px",
                borderRadius: "10px",
                fontWeight: 800,
                fontSize: "13.5px",
                textDecoration: "none",
              }}
            >
              Go to Sign In
            </Link>
          </div>
        ) : (
          <div
            style={{
              background: "linear-gradient(160deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
              border: "1.5px solid rgba(255, 255, 255, 0.14)",
              borderRadius: "26px",
              padding: "clamp(26px, 4vw, 36px)",
              backdropFilter: "blur(18px)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            }}
          >
            {success ? (
              <div style={{ textAlign: "center", padding: "20px 10px" }}>
                <CheckCircle2 className="w-14 h-14 text-[#27C93F] mx-auto mb-3" />
                <h3 style={{ fontSize: "22px", fontWeight: 900, margin: "0 0 8px" }}>Account Activated!</h3>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.75)" }}>
                  Redirecting you to the live squad radar...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {errorMsg && (
                  <div style={{ background: "rgba(235,57,57,0.15)", border: "1px solid rgba(235,57,57,0.3)", borderRadius: "10px", padding: "10px 14px", color: "#FF6B6B", fontSize: "13px" }}>
                    {errorMsg}
                  </div>
                )}

                {/* Account Identity Card */}
                <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "14px 16px", marginBottom: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Email:</span>
                    <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#fff" }}>{application.email}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Username:</span>
                    <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#FFA05C" }}>@{application.username}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Membership Tier:</span>
                    <span style={{ fontSize: "12.5px", fontWeight: 800, color: "#27C93F" }}>{application.packageSelected}</span>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                    Choose Password *
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.5)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "12px",
                        padding: "12px 42px 12px 14px",
                        color: "#fff",
                        fontSize: "14px",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "rgba(255,255,255,0.5)",
                        cursor: "pointer",
                      }}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                    Confirm Password *
                  </label>
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    style={{
                      width: "100%",
                      background: "rgba(0,0,0,0.5)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      color: "#fff",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    marginTop: "8px",
                    background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 45%, #E6450A 100%)",
                    border: "none",
                    borderRadius: "12px",
                    padding: "14px",
                    color: "#fff",
                    fontSize: "14.5px",
                    fontWeight: 900,
                    cursor: "pointer",
                    boxShadow: "0 8px 24px rgba(255,90,31,0.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                  className="hover:scale-[1.02]"
                >
                  <span>{submitting ? "ACTIVATING ACCOUNT…" : "SAVE CREDENTIALS & JOIN RADAR"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreateCredentialsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#060408" }} />}>
      <CreateCredentialsContent />
    </Suspense>
  );
}
