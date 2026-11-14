"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { sendEmailCodeAction, verifyEmailCodeAction } from "@/app/actions/email-verification";
import { checkEmail } from "@/lib/signup-validation";

/**
 * "Send code → type code → verified" box shown under an email field. Calls onVerified with a
 * signed token the signup action requires. Changing the email clears the verification.
 */
export default function EmailVerifyBox({
  email,
  verifiedToken,
  onVerified,
}: {
  email: string;
  verifiedToken: string | null;
  onVerified: (token: string | null) => void;
}) {
  const [challenge, setChallenge] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [verifiedFor, setVerifiedFor] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"send" | "verify" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const normalized = email.trim().toLowerCase();

  // A different email needs its own code.
  useEffect(() => {
    if (verifiedFor && verifiedFor !== normalized) {
      setVerifiedFor(null);
      onVerified(null);
    }
    if (sentTo && sentTo !== normalized) {
      setChallenge(null);
      setSentTo(null);
      setCode("");
    }
  }, [normalized, verifiedFor, sentTo, onVerified]);

  const send = async () => {
    setError(null);
    const formatError = checkEmail(normalized);
    if (formatError) return setError(formatError);
    setBusy("send");
    try {
      const res = await sendEmailCodeAction(normalized);
      if (res.success) {
        setChallenge(res.challenge);
        setSentTo(normalized);
        setCode("");
      } else setError(res.error);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const verify = async () => {
    if (!challenge) return;
    setError(null);
    setBusy("verify");
    try {
      const res = await verifyEmailCodeAction(normalized, code, challenge);
      if (res.success) {
        setVerifiedFor(normalized);
        onVerified(res.verifiedToken);
      } else setError(res.error);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  if (verifiedToken && verifiedFor === normalized) {
    return (
      <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: 700, color: "#34D399" }}>
        <CheckCircle2 size={15} /> Email verified
      </div>
    );
  }

  const btn: React.CSSProperties = {
    padding: "9px 14px",
    background: "rgba(255, 90, 31, 0.16)",
    border: "1px solid rgba(255, 90, 31, 0.45)",
    color: "#FFA05C",
    fontSize: "12.5px",
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  };

  return (
    <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
      {!challenge ? (
        <button type="button" onClick={send} disabled={busy !== null || !normalized} style={{ ...btn, alignSelf: "flex-start", opacity: normalized ? 1 : 0.5 }}>
          {busy === "send" ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
          Send verification code
        </button>
      ) : (
        <>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
            We emailed a 6-digit code to <strong style={{ color: "#fff" }}>{sentTo}</strong>. Check your inbox (and spam).
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit code"
              aria-label="Email verification code"
              style={{
                flex: 1,
                minWidth: 0,
                padding: "10px 12px",
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "#fff",
                fontSize: "15px",
                letterSpacing: "0.3em",
                fontFamily: "monospace",
                outline: "none",
              }}
            />
            <button type="button" onClick={verify} disabled={busy !== null || code.length !== 6} style={{ ...btn, opacity: code.length === 6 ? 1 : 0.5 }}>
              {busy === "verify" ? <Loader2 size={14} className="animate-spin" /> : null}
              Verify
            </button>
          </div>
          <button
            type="button"
            onClick={send}
            disabled={busy !== null}
            style={{ alignSelf: "flex-start", background: "none", border: "none", padding: 0, color: "rgba(255,255,255,0.55)", fontSize: "11.5px", textDecoration: "underline", cursor: "pointer" }}
          >
            Resend code
          </button>
        </>
      )}
      {error && <div style={{ fontSize: "12px", color: "#FF6B6B" }}>{error}</div>}
    </div>
  );
}
