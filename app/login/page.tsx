"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginRole, setLoginRole] = useState<"member" | "partner" | "team">("member");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

      if (loginRole === "team") {
        const { data: profile } = await (supabase.from("profiles") as any)
          .select("subscription_tier")
          .eq("id", data.user.id)
          .single();

        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "admin@solonomore.com";
        const isEmailAdmin = data.user.email?.toLowerCase() === adminEmail.toLowerCase();
        const isTierAdmin = profile?.subscription_tier === "admin";

        if (!isEmailAdmin && !isTierAdmin) {
          setError("Unauthorized. This account does not have admin team access.");
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        router.push("/admin");
      } else if (loginRole === "partner") {
        const { data: profile } = await (supabase.from("profiles") as any)
          .select("is_partner")
          .eq("id", data.user.id)
          .single();

        if (!profile?.is_partner) {
          setError("Unauthorized. This account is not registered under the Partner Ecosystem.");
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        router.push("/dashboard/partner");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Connection failed. Please try again.");
      setIsLoading(false);
    }
  };

  const isTeam = loginRole === "team";

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-base)" }}
    >
      {/* ── Status Bar ─────────────────────────────────────────────────────── */}
      <div className="nokia-statusbar">
        <span className="font-pixel" style={{ fontSize: "7px" }}>SOLO-NO-MORE</span>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <ThemeToggle />
          <span className="font-lcd" style={{ fontSize: "14px" }}>
            {"▌▌▌▌"} &nbsp; {"▮▮▮"}
          </span>
        </div>
      </div>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div style={{ width: "100%", maxWidth: "400px" }}>

          {/* Back link */}
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--text-muted)",
              fontSize: "10px",
              fontFamily: "var(--font-pixel)",
              textDecoration: "none",
              marginBottom: "20px",
            }}
          >
            ◀ BACK
          </Link>

          {/* ── Nokia Card ─────────────────────────────────────────────────── */}
          <div className="nokia-panel" style={{ padding: "0" }}>

            {/* Card title bar */}
            <div style={{
              background: isTeam ? "var(--border-strong)" : loginRole === "partner" ? "var(--accent-success)" : "var(--accent-primary)",
              color: "white",
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "2px solid var(--border-strong)",
            }}>
              <span className="font-pixel" style={{ fontSize: "8px", letterSpacing: "0.1em" }}>
                {isTeam ? "◈ TEAM COMMAND CENTER" : loginRole === "partner" ? "◈ PARTNER ECOSYSTEM" : "◈ MEMBER LOGIN"}
              </span>
              <span className="font-lcd" style={{ fontSize: "14px", opacity: 0.7 }}>
                {isTeam ? "▣" : loginRole === "partner" ? "▤" : "★"}
              </span>
            </div>

            <div style={{ padding: "20px" }}>

              {/* Role selector */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "4px",
                marginBottom: "20px",
                border: "2px solid var(--border-strong)",
                padding: "3px",
                background: "var(--bg-sunken)",
              }}>
                {(["member", "partner", "team"] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => { setLoginRole(role); setError(null); }}
                    className={loginRole === role ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
                    style={{ fontSize: "6px", padding: "6px 4px" }}
                  >
                    {role === "member" ? "► MEMBER" : role === "partner" ? "▤ PARTNER" : "◈ TEAM"}
                  </button>
                ))}
              </div>

              {/* Nokia LCD username display */}
              <div className="nokia-lcd" style={{
                width: "100%",
                textAlign: "center",
                fontSize: "13px",
                marginBottom: "16px",
                padding: "6px 12px",
                letterSpacing: "0.06em",
              }}>
                {email || (isTeam ? "TEAM_ACCESS" : loginRole === "partner" ? "PARTNER_ACCESS" : "MEMBER_ID")}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                {/* Email */}
                <div style={{ marginBottom: "12px" }}>
                  <label
                    htmlFor="email"
                    className="font-pixel"
                    style={{ display: "block", fontSize: "7px", marginBottom: "6px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}
                  >
                    ✉ EMAIL ADDRESS
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@domain.com"
                    className="nokia-input"
                  />
                </div>

                {/* Password */}
                <div style={{ marginBottom: "12px" }}>
                  <label
                    htmlFor="password"
                    className="font-pixel"
                    style={{ display: "block", fontSize: "7px", marginBottom: "6px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}
                  >
                    ■ PASSWORD
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="nokia-input"
                      style={{ paddingRight: "48px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        fontFamily: "var(--font-pixel)",
                        fontSize: "8px",
                      }}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "◉" : "◎"}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="nokia-panel-sunken" style={{
                    padding: "8px 12px",
                    marginBottom: "12px",
                    borderColor: "var(--accent-danger)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                  }}>
                    <span className="font-pixel" style={{ fontSize: "8px", color: "var(--accent-danger)", flexShrink: 0 }}>✕</span>
                    <span style={{ fontSize: "11px", color: "var(--accent-danger)", lineHeight: "1.4" }}>{error}</span>
                  </div>
                )}

                {/* Nokia divider */}
                <div className="nokia-divider" />

                {/* Submit */}
                <button
                  id="signin-btn"
                  type="submit"
                  disabled={isLoading}
                  className="nokia-btn nokia-btn-primary"
                  style={{ width: "100%", fontSize: "9px", padding: "12px 16px" }}
                >
                  {isLoading ? (
                    <span className="pixel-blink">▌ LOADING...</span>
                  ) : (
                    <>{isTeam ? "◈ AUTHORIZE TEAM" : loginRole === "partner" ? "▤ PARTNER CONNECT" : "► SIGN IN"}</>
                  )}
                </button>
              </form>

              {/* Divider + apply */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                margin: "16px 0 12px",
              }}>
                <div style={{ flex: 1, height: "1px", background: "var(--border-mid)" }} />
                <span className="font-pixel" style={{ fontSize: "6px", color: "var(--text-muted)" }}>NOT A MEMBER?</span>
                <div style={{ flex: 1, height: "1px", background: "var(--border-mid)" }} />
              </div>

              <Link
                href="/apply"
                id="goto-apply-link"
                className="nokia-btn nokia-btn-ghost"
                style={{ width: "100%", fontSize: "8px", textDecoration: "none" }}
              >
                ✦ APPLY FOR MEMBERSHIP
              </Link>
            </div>
          </div>

          {/* Footer note */}
          <p className="font-pixel" style={{
            textAlign: "center",
            marginTop: "16px",
            fontSize: "6px",
            color: "var(--text-muted)",
            letterSpacing: "0.06em",
          }}>
            SOLO-NO-MORE © 2026 — CONNECTING PEOPLE
          </p>
        </div>
      </div>
    </main>
  );
}
