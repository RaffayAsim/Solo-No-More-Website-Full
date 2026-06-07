"use client";

export default function DashboardLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", padding: "20px" }}>

      {/* Nokia Boot Header */}
      <div className="nokia-panel-sunken" style={{ padding: "16px", marginBottom: "16px", textAlign: "center" }}>
        <div className="font-lcd nokia-boot" style={{ fontSize: "28px", color: "var(--accent-primary)", letterSpacing: "0.1em" }}>
          LOADING...
        </div>
        <div className="font-pixel" style={{ fontSize: "7px", color: "var(--text-muted)", marginTop: "6px", letterSpacing: "0.1em" }}>
          <span className="pixel-blink">▌</span>
          {" "}FETCHING LIVE BEACONS
        </div>
      </div>

      {/* Skeleton cards — Nokia panel style */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="nokia-panel"
            style={{
              padding: "16px",
              opacity: 1 - i * 0.15,
              animation: "nokia-boot 0.6s ease-out forwards",
              animationDelay: `${i * 100}ms`,
            }}
          >
            {/* Top badge row */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <div className="nokia-badge" style={{ width: "60px", height: "16px", background: "var(--bg-sunken)" }} />
              <div className="nokia-badge" style={{ width: "40px", height: "16px", background: "var(--bg-sunken)" }} />
            </div>
            {/* Title bar */}
            <div style={{ height: "12px", background: "var(--bg-sunken)", marginBottom: "10px", border: "1px solid var(--border-mid)" }} />
            <div style={{ height: "10px", background: "var(--bg-sunken)", marginBottom: "16px", width: "70%", border: "1px solid var(--border-mid)" }} />
            {/* Slot dots */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
              {Array.from({ length: 5 }).map((_, j) => (
                <span key={j} className="pixel-blink" style={{ fontSize: "14px", color: "var(--border-mid)", animationDelay: `${j * 200}ms` }}>○</span>
              ))}
            </div>
            {/* Button skeleton */}
            <div className="nokia-panel-sunken" style={{ height: "32px" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
