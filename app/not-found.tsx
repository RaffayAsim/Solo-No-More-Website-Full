import Link from "next/link";

export default function NotFound() {
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
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div className="nokia-panel text-center" style={{ padding: "32px 20px" }}>
          {/* LCD Error Code */}
          <div
            className="nokia-lcd"
            style={{
              fontSize: "36px",
              color: "var(--accent-warning)",
              marginBottom: "16px",
              display: "inline-block",
              padding: "8px 24px",
            }}
          >
            404
          </div>

          <h2
            className="font-pixel text-accent"
            style={{ fontSize: "11px", margin: "10px 0", letterSpacing: "0.08em" }}
          >
            COORDINATES NOT FOUND
          </h2>

          <p
            className="font-mono text-muted"
            style={{ fontSize: "11px", lineHeight: "1.6", marginBottom: "24px" }}
          >
            The frequency or page you are tuning into does not exist on this cellular frequency.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Link
              href="/dashboard"
              className="nokia-btn nokia-btn-primary font-pixel"
              style={{ fontSize: "8px", padding: "10px", textDecoration: "none" }}
            >
              ◀ RETURN TO RADAR LOBBY
            </Link>
            <Link
              href="/"
              className="nokia-btn font-pixel"
              style={{ fontSize: "7px", padding: "8px", textDecoration: "none" }}
            >
              ◈ GO TO HOMEPAGE
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
