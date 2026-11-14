"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase, syncSessionCookie } from "@/lib/supabase/client";

export const fieldLabel: React.CSSProperties = {
  display: "block",
  fontSize: "11.5px",
  fontWeight: 800,
  color: "rgba(255,255,255,0.6)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "6px",
};

export const fieldInput: React.CSSProperties = {
  width: "100%",
  background: "rgba(0,0,0,0.45)",
  border: "1px solid rgba(255,255,255,0.16)",
  padding: "12px 14px",
  color: "#fff",
  fontSize: "14px",
  outline: "none",
};

export const primaryButton: React.CSSProperties = {
  width: "100%",
  background: "#FF5A1F",
  color: "#fff",
  border: "none",
  padding: "13px",
  fontSize: "14px",
  fontWeight: 900,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
};

/** Email + password sign-in that sends the user to `destination` (the page itself checks access). */
export default function SimpleSignIn({ destination, buttonLabel = "Sign in" }: { destination: string; buttonLabel?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) {
        setError(err.message === "Invalid login credentials" ? "Incorrect email or password." : err.message);
        setBusy(false);
        return;
      }
      if (data.session) syncSessionCookie(data.session);
      router.push(destination);
    } catch {
      setError("Could not reach the server. Please try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {error && (
        <div style={{ background: "rgba(235,57,57,0.15)", border: "1px solid rgba(235,57,57,0.35)", padding: "10px 14px", color: "#FF6B6B", fontSize: "13px" }}>
          {error}
        </div>
      )}
      <div>
        <label style={fieldLabel} htmlFor="signin-email">Email</label>
        <input id="signin-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} style={fieldInput} />
      </div>
      <div>
        <label style={fieldLabel} htmlFor="signin-password">Password</label>
        <div style={{ position: "relative" }}>
          <input
            id="signin-password"
            type={show ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...fieldInput, paddingRight: "44px" }}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide password" : "Show password"}
            className="rounded-full-icon"
            style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", padding: "6px", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <button type="submit" disabled={busy} style={{ ...primaryButton, opacity: busy ? 0.7 : 1 }}>
        {busy && <Loader2 size={16} className="animate-spin" />}
        {busy ? "Signing in…" : buttonLabel}
      </button>
      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", margin: 0 }}>
        Forgot your password? Email <span style={{ color: "#FFA05C" }}>thesolonomore@gmail.com</span> from your registered address.
      </p>
    </form>
  );
}
