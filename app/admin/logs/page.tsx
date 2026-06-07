import React from "react";

export const revalidate = 0; // Disable static caching

export default function AdminLogsPage() {
  const logEvents = [
    {
      timestamp: "2026-05-30 14:02:11",
      service: "AUTH_GATEWAY",
      level: "INFO",
      message: "Admin session authenticated for vibe.tester@solonomore.com from team dashboard.",
    },
    {
      timestamp: "2026-05-30 13:45:15",
      service: "NO_SHOW_ENGINE",
      level: "WARN",
      message: "User warning strike logged for applicant due to host ghost flake flagging. Strikes count = 1.",
    },
    {
      timestamp: "2026-05-30 13:21:50",
      service: "VETTING_MANAGER",
      level: "INFO",
      message: "New applicant profile approved. Lobby access granted securely.",
    },
    {
      timestamp: "2026-05-30 12:05:11",
      service: "VIP_PASS_ENGINE",
      level: "INFO",
      message: "Free ticket claimed for 'official_event = VIP Padel Tournament' by family tier user.",
    },
    {
      timestamp: "2026-05-30 10:15:33",
      service: "POSTGRES_POOL",
      level: "INFO",
      message: "Successfully synchronized database connection pools. 0 leaks detected.",
    },
    {
      timestamp: "2026-05-30 08:30:00",
      service: "STRIKE_MONITOR",
      level: "INFO",
      message: "Scanning active beacon applications... Vibe parameters checking completed.",
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {/* Page Header */}
      <div className="nokia-panel-sunken" style={{ padding: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="font-pixel text-accent" style={{ fontSize: "14px", margin: 0, letterSpacing: "0.08em" }}>
            ▣ SYSTEM DIAGNOSTIC LOGS
          </h1>
          <p className="font-mono text-muted" style={{ fontSize: "11px", margin: "4px 0 0 0" }}>
            Real-time gateway diagnostic entries and security logs.
          </p>
        </div>

        <button 
          className="nokia-btn font-pixel"
          style={{ fontSize: "8px", padding: "8px 16px", borderColor: "#33FF66", color: "#33FF66" }}
        >
          ● LIVE STREAM
        </button>
      </div>

      {/* Terminal View */}
      <div 
        className="nokia-panel-sunken" 
        style={{ 
          padding: "20px", 
          fontFamily: "var(--font-mono)", 
          fontSize: "11px", 
          color: "#8AB890", 
          backgroundColor: "#030710", 
          border: "2px solid #33FF66",
        }}
      >
        {/* Terminal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1E3A5F", paddingBottom: "10px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#FF4444" }}>●</span>
            <span style={{ color: "#FFB300" }}>●</span>
            <span style={{ color: "#33FF66" }}>●</span>
            <span className="font-pixel text-accent" style={{ fontSize: "8px", marginLeft: "8px" }}>
              LOGS@SOLO-NO-MORE: ~
            </span>
          </div>
          <span className="font-pixel" style={{ fontSize: "7px" }}>BASH - v4.4.23</span>
        </div>

        {/* Console stream */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {logEvents.map((evt, idx) => {
            const isWarn = evt.level === "WARN";
            const levelColor = isWarn ? "#FFB300" : "#33FF66";

            return (
              <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "4px", borderBottom: "1px dashed rgba(30, 58, 95, 0.3)" }}>
                <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>[{evt.timestamp}]</span>
                <span className="font-pixel" style={{ fontSize: "7px", color: levelColor, flexShrink: 0, marginTop: "2px" }}>
                  {evt.level}
                </span>
                <span style={{ fontWeight: "bold", color: "#33FF66", flexShrink: 0 }}>[{evt.service}]</span>
                <span style={{ color: "#D0EDD0" }}>{evt.message}</span>
              </div>
            );
          })}
        </div>

        {/* Prompt cursor */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px", paddingTop: "10px", borderTop: "1px solid #1E3A5F" }}>
          <span style={{ color: "#33FF66", fontWeight: "bold" }}>$</span>
          <span className="pixel-blink" style={{ width: "8px", height: "14px", backgroundColor: "#33FF66", display: "inline-block" }} />
          <span className="font-pixel text-muted" style={{ fontSize: "7px" }}>
            LISTENING FOR LIVE GATEWAY EVENTS...
          </span>
        </div>
      </div>
    </div>
  );
}
