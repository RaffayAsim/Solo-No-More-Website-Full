"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Solo-No-More System Error]:", error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "var(--font-mono)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <div className="nokia-panel text-center" style={{ padding: "32px 20px", borderColor: "var(--accent-danger)" }}>
          {/* LCD Error Code */}
          <div
            className="nokia-lcd"
            style={{
              fontSize: "24px",
              color: "var(--accent-danger)",
              marginBottom: "16px",
              display: "inline-block",
              padding: "8px 20px",
              borderColor: "var(--accent-danger)",
            }}
          >
            ! ERROR DETECTED !
          </div>

          <h2
            className="font-pixel text-danger"
            style={{ fontSize: "11px", margin: "10px 0", letterSpacing: "0.08em" }}
          >
            COMMUNICATION BREAKDOWN
          </h2>

          <p
            className="font-mono text-muted"
            style={{ fontSize: "11px", lineHeight: "1.6", marginBottom: "20px" }}
          >
            {error.message || "A network telemetry interruption occurred while rendering this frequency."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              onClick={() => reset()}
              className="nokia-btn nokia-btn-primary font-pixel"
              style={{ fontSize: "8px", padding: "10px" }}
            >
              ↻ REBOOT TERMINAL / RETRY
            </button>
            <Link
              href="/dashboard"
              className="nokia-btn font-pixel"
              style={{ fontSize: "7px", padding: "8px", textDecoration: "none" }}
            >
              ◀ BACK TO DASHBOARD
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
