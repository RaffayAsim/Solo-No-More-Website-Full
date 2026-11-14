"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, syncSessionCookie } from "@/lib/supabase/client";
import { Sparkles, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Store, Shield, Mic2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || searchParams.get("next");
  // Only same-site paths are allowed as a post-login destination.
  const redirectParam =
    rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") && !rawRedirect.includes("\\")
      ? rawRedirect
      : null;

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginRole, setLoginRole] = useState<"member" | "artist" | "partner" | "team">("member");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // If the browser still holds a valid session (e.g. the cookie lapsed while the tab
  // was closed), restore it silently and continue to the intended page.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled || !data?.session) return;
      // Guard against redirect loops: only auto-restore once per minute.
      try {
        const last = Number(sessionStorage.getItem("snm_session_restore") || 0);
        if (Date.now() - last < 60_000) return;
        sessionStorage.setItem("snm_session_restore", String(Date.now()));
      } catch {}
      syncSessionCookie(data.session);
      window.location.replace(redirectParam || "/dashboard");
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials"
            ? "Incorrect email or password. Please try again."
            : signInError.message
        );
        setIsLoading(false);
        return;
      }

      // Determine target destination
      const safeRedirect = redirectParam && redirectParam.startsWith("/") ? redirectParam : null;

      if (loginRole === "team") {
        // The server decides who may enter /admin (owner, admins and delegated sub-admins);
        // anyone else is sent on to their normal dashboard.
        router.push(safeRedirect || "/admin");
      } else if (loginRole === "artist") {
        router.push(safeRedirect || "/dashboard/artist");
      } else if (loginRole === "partner") {
        // The partner hub itself verifies partner / delegated-manager access.
        router.push(safeRedirect || "/dashboard/partner");
      } else {
        router.push(safeRedirect || "/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Connection failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "#060408",
        minHeight: "100vh",
        color: "#FFFFFF",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
    >
      {/* Background Radial Glow */}
      <div
        style={{
          position: "fixed",
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "600px",
          background: "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(255, 90, 31, 0.22) 0%, rgba(255, 90, 31, 0.04) 50%, transparent 80%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      {/* Dotted Texture Background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.16) 1.25px, transparent 1.25px)",
          backgroundSize: "22px 22px",
          pointerEvents: "none",
          opacity: 0.65,
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      {/* Top Bar with Brand Logo */}
      <header
        style={{
          position: "relative",
          zIndex: 10,
          padding: "24px clamp(20px, 4vw, 48px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link
          href="/"
          style={{
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
          }}
          className="group cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="solo-no-more"
            className="h-9 sm:h-11 md:h-12 lg:h-[50px] w-auto object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-[0_2px_12px_rgba(255,90,31,0.35)]"
          />
        </Link>

        <Link
          href="/"
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "rgba(255,255,255,0.7)",
            textDecoration: "none",
            padding: "8px 16px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
          className="hover:text-white hover:bg-white/10"
        >
          ← Back to Home
        </Link>
      </header>

      {/* Main Login Card */}
      <main
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "30px 20px 80px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "460px",
            background: "linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1.5px solid rgba(255,255,255,0.12)",
            borderRadius: "32px",
            padding: "clamp(28px, 4vw, 44px)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.65), 0 0 60px rgba(255,90,31,0.12)",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255, 90, 31, 0.14)",
                border: "1px solid rgba(255, 90, 31, 0.35)",
                padding: "4px 14px",
                borderRadius: "999px",
                fontSize: "11.5px",
                fontWeight: 800,
                color: "#FF8A3D",
                marginBottom: "14px",
                letterSpacing: "0.06em",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" /> SECURE CLUB ACCESS
            </div>
            <h1
              style={{
                fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
                fontSize: "clamp(26px, 3.5vw, 32px)",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                margin: "0 0 8px",
                color: "#fff",
              }}
            >
              Welcome Back
            </h1>
            <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)", margin: 0, lineHeight: 1.5 }}>
              Enter your credentials to access your live squad dashboard and radar.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              style={{
                background: "rgba(255, 60, 60, 0.12)",
                border: "1px solid rgba(255, 60, 60, 0.35)",
                borderRadius: "12px",
                padding: "12px 14px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#FF8E8E",
                marginBottom: "20px",
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail className="w-4 h-4 text-white/40" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.5)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    borderRadius: "12px",
                    padding: "12px 14px 12px 40px",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  className="focus:border-[#FF5A1F] focus:ring-2 focus:ring-[#FF5A1F]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "11.5px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Password
                </label>
                <a href="mailto:thesolonomore@gmail.com?subject=Password%20Reset%20Request" style={{ fontSize: "12px", color: "#FF8A3D", textDecoration: "none" }} className="hover:underline">
                  Forgot?
                </a>
              </div>
              <div style={{ position: "relative" }}>
                <Lock className="w-4 h-4 text-white/40" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.5)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    borderRadius: "12px",
                    padding: "12px 42px 12px 40px",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  className="focus:border-[#FF5A1F] focus:ring-2 focus:ring-[#FF5A1F]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "rgba(255,255,255,0.4)",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: "8px",
                background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 45%, #E6450A 100%)",
                border: "none",
                borderRadius: "14px",
                padding: "14px",
                color: "#fff",
                fontSize: "14.5px",
                fontWeight: 900,
                letterSpacing: "0.03em",
                cursor: "pointer",
                boxShadow: "0 10px 28px rgba(255, 90, 31, 0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                opacity: isLoading ? 0.75 : 1,
                transition: "transform 0.15s ease",
              }}
              className="hover:scale-[1.02] active:scale-98"
            >
              <span>{isLoading ? "SIGNING IN…" : "LOG IN"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer inside card */}
          <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.08)", textAlign: "center", fontSize: "13.5px", color: "rgba(255,255,255,0.6)" }}>
            Don&apos;t have an account yet?{" "}
            <Link
              href={redirectParam ? `/apply?redirect=${encodeURIComponent(redirectParam)}` : "/apply"}
              style={{ color: "#FF8A3D", fontWeight: 800, textDecoration: "none" }}
              className="hover:underline"
            >
              Apply to Join Club
            </Link>
            <div style={{ marginTop: "14px", fontSize: "12.5px", color: "rgba(255,255,255,0.45)" }}>
              Venue, brand or artist?{" "}
              <Link href="/portal?mode=signin" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "underline" }}>
                Use the partner &amp; artist portal
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060408] flex items-center justify-center text-zinc-400">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
