"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upgradeTier } from "@/app/actions/billing";

interface UpgradeHubClientProps {
  currentTier: "none" | "member" | "family";
}

export default function UpgradeHubClient({ currentTier: initialTier }: UpgradeHubClientProps) {
  const [tier, setTier] = useState(initialTier);
  const [loadingTier, setLoadingTier] = useState<"member" | "family" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const router = useRouter();

  const handleUpgrade = async (selectedTier: "member" | "family") => {
    setLoadingTier(selectedTier);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await upgradeTier(selectedTier);
      if (res.success) {
        setTier(selectedTier);
        setSuccessMsg(`Successfully upgraded to ${selectedTier === "family" ? "Family" : "Member"} Tier! Welcome to the circle.`);
        router.refresh();
      } else {
        setErrorMsg(res.error);
      }
    } catch {
      setErrorMsg("Billing transaction failed due to network connection issues.");
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      {/* ── Header Bevel Panel ──────────────────────────────────────────────── */}
      <div className="nokia-panel-sunken text-center" style={{ padding: "16px", marginBottom: "20px" }}>
        <span className="nokia-badge nokia-badge-primary" style={{ fontSize: "7px", marginBottom: "8px" }}>
          ◈ MONETIZATION HUB
        </span>
        <h1 className="font-pixel text-accent" style={{ fontSize: "14px", margin: "4px 0", letterSpacing: "0.08em" }}>
          CHOOSE YOUR VIBE LEVEL
        </h1>
        <p className="font-mono text-muted" style={{ fontSize: "11px", margin: "4px 0 0 0" }}>
          Unlock exclusive matchmaking, custom themes, VIP tickets, and community privileges.
        </p>
      </div>

      {/* Action alerts */}
      {errorMsg && (
        <div className="nokia-panel-raised" style={{ borderColor: "var(--accent-danger)", padding: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="font-pixel text-danger" style={{ fontSize: "9px" }}>[✕ ERROR]</span>
          <span className="font-mono text-danger" style={{ fontSize: "11px" }}>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="nokia-panel-raised" style={{ borderColor: "var(--accent-success)", padding: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="font-pixel text-success" style={{ fontSize: "9px" }}>[✓ SUCCESS]</span>
          <span className="font-mono text-success" style={{ fontSize: "11px" }}>{successMsg}</span>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", maxWidth: "800px", margin: "0 auto" }}>
        
        {/* 1. MEMBER TIER */}
        <div
          className="nokia-panel"
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            border: tier === "member" ? "2px solid var(--accent-primary)" : undefined,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span className="font-pixel text-accent" style={{ fontSize: "8px" }}>STANDARD VIBE</span>
              <h3 className="font-pixel" style={{ fontSize: "12px", margin: "4px 0 0 0" }}>MEMBER</h3>
            </div>
            {tier === "member" && (
              <span className="nokia-badge nokia-badge-primary">ACTIVE</span>
            )}
          </div>

          <p className="font-mono text-muted" style={{ fontSize: "11px", margin: 0 }}>
            Full access to match-making and lobby radar feeds.
          </p>

          {/* Retro LCD display style price */}
          <div className="nokia-panel-sunken" style={{ padding: "8px", display: "flex", alignItems: "baseline", gap: "4px", alignSelf: "flex-start" }}>
            <span className="font-lcd text-accent" style={{ fontSize: "28px", lineHeight: 1 }}>$19</span>
            <span className="font-mono text-muted" style={{ fontSize: "10px" }}>/ mo</span>
          </div>

          <hr className="nokia-divider" />

          {/* Perks list */}
          <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px", flexGrow: 1 }}>
            {[
              "Intelligent Lobby (Broadcasting & Joining)",
              "Late-Night Radar Nightlife Filters",
              "Secure Friend-Only Beacons Mode",
              "Verified Member Badging Accents",
              "Full Network Circle Portal"
            ].map((perk) => (
              <li key={perk} className="font-mono" style={{ fontSize: "11px", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                <span className="text-accent" style={{ fontSize: "12px", lineHeight: "14px" }}>●</span>
                <span>{perk}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => handleUpgrade("member")}
            disabled={loadingTier !== null || tier === "member"}
            className="nokia-btn nokia-btn-primary"
            style={{ width: "100%", marginTop: "12px" }}
          >
            {loadingTier === "member" ? "CONNECTING..." : tier === "member" ? "SUBSCRIBED" : "GET MEMBER"}
          </button>
        </div>

        {/* 2. FAMILY TIER */}
        <div
          className="nokia-panel"
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            border: "2px solid var(--border-strong)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span className="font-pixel text-warning" style={{ fontSize: "8px" }}>UNLIMITED VIBE</span>
              <h3 className="font-pixel" style={{ fontSize: "12px", margin: "4px 0 0 0" }}>FAMILY</h3>
            </div>
            {tier === "family" ? (
              <span className="nokia-badge nokia-badge-warning">ACTIVE</span>
            ) : (
              <span className="nokia-badge nokia-badge-warning">VIP</span>
            )}
          </div>

          <p className="font-mono text-muted" style={{ fontSize: "11px", margin: 0 }}>
            Ultimate credentials for real-world Match-Making.
          </p>

          {/* Retro LCD display style price */}
          <div className="nokia-panel-sunken" style={{ padding: "8px", display: "flex", alignItems: "baseline", gap: "4px", alignSelf: "flex-start" }}>
            <span className="font-lcd text-warning" style={{ fontSize: "28px", lineHeight: 1 }}>$49</span>
            <span className="font-mono text-muted" style={{ fontSize: "10px" }}>/ mo</span>
          </div>

          <hr className="nokia-divider" />

          {/* Perks list */}
          <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px", flexGrow: 1 }}>
            {[
              "All Member Perks & Vetting privileges",
              "Claim Free Tickets for Official DJ/Rave Events",
              "Priority Lobby Broadcasting Slots",
              "Complimentary Entry to Tournaments",
              "Golden Amber Accent Theme across app"
            ].map((perk) => (
              <li key={perk} className="font-mono" style={{ fontSize: "11px", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                <span className="text-warning" style={{ fontSize: "12px", lineHeight: "14px" }}>★</span>
                <span style={{ fontWeight: perk.includes("Free") ? "bold" : "normal" }}>{perk}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => handleUpgrade("family")}
            disabled={loadingTier !== null || tier === "family"}
            className="nokia-btn nokia-btn-warning"
            style={{
              width: "100%",
              marginTop: "12px",
            }}
          >
            {loadingTier === "family" ? "CONNECTING..." : tier === "family" ? "SUBSCRIBED" : "GET FAMILY"}
          </button>
        </div>

      </div>
    </div>
  );
}
