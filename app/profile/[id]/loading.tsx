"use client";

import React from "react";

export default function ProfileLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", padding: "16px", paddingBottom: "80px" }}>
      {/* Header nav bar skeleton */}
      <div className="nokia-panel animate-pulse" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 14px", marginBottom: "16px", borderRadius: "2px",
      }}>
        <div className="nokia-btn font-pixel" style={{ fontSize: "7px", padding: "4px 8px", cursor: "default" }}>
          ◀ LOBBY FEED
        </div>
        <span className="font-pixel" style={{ fontSize: "8px", color: "var(--accent-primary)", letterSpacing: "0.08em" }}>
          ◈ VIBE PROFILE
        </span>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Main profile card skeleton */}
        <div className="nokia-panel animate-pulse" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
            {/* Sunken Avatar Initials Block */}
            <div className="nokia-panel-sunken" style={{
              width: "64px",
              height: "64px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }} />

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", minWidth: "150px" }}>
              {/* Badge row */}
              <div style={{ width: "80px", height: "14px", background: "var(--bg-sunken)" }} />
              {/* Name row */}
              <div style={{ width: "160px", height: "20px", background: "var(--bg-sunken)" }} />
            </div>

            {/* Action button skeleton */}
            <div className="nokia-panel-sunken" style={{ width: "110px", height: "30px", flexShrink: 0 }} />
          </div>

          <hr className="nokia-divider" style={{ margin: "4px 0" }} />

          {/* Bio area */}
          <div className="nokia-panel-sunken" style={{ padding: "12px", minHeight: "60px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ width: "95%", height: "10px", background: "var(--bg-base)" }} />
            <div style={{ width: "80%", height: "10px", background: "var(--bg-base)" }} />
          </div>

          {/* Social connection row */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "12px", height: "12px", background: "var(--bg-sunken)" }} />
            <div style={{ width: "120px", height: "10px", background: "var(--bg-sunken)" }} />
          </div>
        </div>

        {/* Achievements header */}
        <div style={{ marginTop: "12px" }}>
          <h3 className="font-pixel animate-pulse" style={{ fontSize: "8px", marginBottom: "12px", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
            ▶ TROPHY ROOM (ACHIEVEMENTS)
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="nokia-panel animate-pulse"
                style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px", animationDelay: `${i * 150}ms` }}
              >
                {/* Glyph icon */}
                <div className="nokia-panel-sunken" style={{
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  flexShrink: 0,
                }} />

                {/* Text fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ width: "80px", height: "10px", background: "var(--bg-sunken)" }} />
                  <div style={{ width: "100%", height: "8px", background: "var(--bg-sunken)" }} />
                  <div style={{ width: "60%", height: "8px", background: "var(--bg-sunken)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
