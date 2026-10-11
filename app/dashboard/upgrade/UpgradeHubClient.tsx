"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitPaymentProof, upgradeTier } from "@/app/actions/billing";

interface UpgradeHubClientProps {
  currentTier: "none" | "member" | "family" | "admin" | "partner";
}

export default function UpgradeHubClient({ currentTier: initialTier }: UpgradeHubClientProps) {
  const [tier, setTier] = useState(initialTier);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Payment Modal State
  const [modalTier, setModalTier] = useState<"member" | "partner" | "family" | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"raast" | "sadapay" | "bank_transfer">("raast");
  const [transactionRef, setTransactionRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);

  const router = useRouter();

  const openPaymentModal = (selectedTier: "member" | "partner" | "family") => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setTransactionRef("");
    setModalSuccess(false);
    setModalTier(selectedTier);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTier || !transactionRef.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);

    const amount = modalTier === "member" ? 2000 : 3500;

    try {
      const res = await submitPaymentProof({
        tierRequested: modalTier,
        amountPkr: amount,
        paymentMethod,
        transactionRef: transactionRef.trim(),
      });

      if (res.success) {
        setModalSuccess(true);
        setSuccessMsg(
          `Payment proof received! TID: ${transactionRef.trim()} submitted for ${modalTier.toUpperCase()} verification.`
        );
        setTimeout(() => {
          setModalTier(null);
          router.refresh();
        }, 2200);
      } else {
        setErrorMsg(res.error);
      }
    } catch {
      setErrorMsg("Failed to submit payment verification. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  // Instant simulator for test accounts
  const handleDevInstantUpgrade = async (selectedTier: "member" | "partner" | "family") => {
    setSubmitting(true);
    try {
      const res = await upgradeTier(selectedTier);
      if (res.success) {
        setTier(selectedTier);
        setSuccessMsg(`[DEV SIMULATOR] Instantly upgraded to ${selectedTier.toUpperCase()} tier!`);
        setModalTier(null);
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      {/* ── Header Bevel Panel ──────────────────────────────────────────────── */}
      <div className="nokia-panel-sunken text-center" style={{ padding: "16px", marginBottom: "20px" }}>
        <span className="nokia-badge nokia-badge-primary" style={{ fontSize: "7px", marginBottom: "8px" }}>
          ◈ MEMBERSHIP & BUSINESS PORTAL
        </span>
        <h1 className="font-pixel text-accent" style={{ fontSize: "14px", margin: "4px 0", letterSpacing: "0.08em" }}>
          CHOOSE YOUR MEMBERSHIP TIER
        </h1>
        <p className="font-mono text-muted" style={{ fontSize: "11px", margin: "4px 0 0 0" }}>
          Explore hangouts, host unlimited squad beacons across Karachi, or promote your local venue.
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
          <span className="font-pixel text-success" style={{ fontSize: "9px" }}>[✓ STATUS]</span>
          <span className="font-mono text-success" style={{ fontSize: "11px" }}>{successMsg}</span>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", maxWidth: "960px", margin: "0 auto" }}>
        
        {/* 1. EXPLORER (FREE TRIAL) */}
        <div
          className="nokia-panel"
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            border: tier === "none" ? "2px solid var(--accent-primary)" : undefined,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span className="font-pixel text-muted" style={{ fontSize: "8px" }}>STARTER PASS</span>
              <h3 className="font-pixel" style={{ fontSize: "12px", margin: "4px 0 0 0" }}>EXPLORER</h3>
            </div>
            {tier === "none" && (
              <span className="nokia-badge nokia-badge-primary">ACTIVE</span>
            )}
          </div>

          <p className="font-mono text-muted" style={{ fontSize: "11px", margin: 0 }}>
            Ideal for newcomers discovering the solo scene and exploring local squads.
          </p>

          <div className="nokia-panel-sunken" style={{ padding: "8px", display: "flex", alignItems: "baseline", gap: "6px", alignSelf: "flex-start" }}>
            <span className="font-lcd text-accent" style={{ fontSize: "28px", lineHeight: 1 }}>PKR 0</span>
            <span className="font-mono text-muted" style={{ fontSize: "10px" }}>/ free</span>
          </div>

          <hr className="nokia-divider" />

          <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px", flexGrow: 1 }}>
            {[
              "3 Free Approved Hangout Entries",
              "Access to Karachi Live Radar Discovery",
              "Squad Chat Room Access upon Acceptance",
              "Browse Community Event Calendar",
              "Option to Pay-As-You-Go after 3 Hangouts"
            ].map((perk) => (
              <li key={perk} className="font-mono" style={{ fontSize: "11px", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                <span className="text-muted" style={{ fontSize: "12px", lineHeight: "14px" }}>●</span>
                <span>{perk}</span>
              </li>
            ))}
          </ul>

          <button
            disabled
            className="nokia-btn"
            style={{ width: "100%", marginTop: "12px", opacity: 0.6 }}
          >
            {tier === "none" ? "CURRENT PLAN" : "FREE TIER"}
          </button>
        </div>

        {/* 2. MEMBER TIER */}
        <div
          className="nokia-panel"
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            border: tier === "member" ? "2px solid var(--accent-primary)" : "2px solid var(--accent-primary)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span className="font-pixel text-accent" style={{ fontSize: "8px" }}>MOST POPULAR</span>
              <h3 className="font-pixel" style={{ fontSize: "12px", margin: "4px 0 0 0" }}>MEMBER</h3>
            </div>
            {tier === "member" ? (
              <span className="nokia-badge nokia-badge-primary">ACTIVE</span>
            ) : (
              <span className="nokia-badge nokia-badge-primary">RECOMMENDED</span>
            )}
          </div>

          <p className="font-mono text-muted" style={{ fontSize: "11px", margin: 0 }}>
            Full access to squad lobby broadcasting, chat rooms, and event discounts.
          </p>

          <div className="nokia-panel-sunken" style={{ padding: "8px", display: "flex", alignItems: "baseline", gap: "6px", alignSelf: "flex-start" }}>
            <span className="font-lcd text-accent" style={{ fontSize: "28px", lineHeight: 1 }}>PKR 2,000</span>
            <span className="font-mono text-muted" style={{ fontSize: "10px" }}>/ mo</span>
          </div>

          <hr className="nokia-divider" />

          <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px", flexGrow: 1 }}>
            {[
              "15 Hangout Participations / Month",
              "UNLIMITED Beacon Hosting Across Karachi",
              "Verified Member Glow Badge on Profile & Squads",
              "15%–20% Discount on Platform Official Events",
              "Priority Queue in High-Demand Hangouts",
              "Direct Squad Group Chat Access"
            ].map((perk) => (
              <li key={perk} className="font-mono" style={{ fontSize: "11px", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                <span className="text-accent" style={{ fontSize: "12px", lineHeight: "14px" }}>◈</span>
                <span style={{ fontWeight: perk.includes("UNLIMITED") ? "bold" : "normal" }}>{perk}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => openPaymentModal("member")}
            disabled={tier === "member" || tier === "admin"}
            className="nokia-btn nokia-btn-primary"
            style={{ width: "100%", marginTop: "12px" }}
          >
            {tier === "member" ? "SUBSCRIBED" : "UPGRADE TO MEMBER"}
          </button>
        </div>

        {/* 3. PARTNER BUSINESS TIER */}
        <div
          className="nokia-panel"
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            border: tier === "partner" ? "2px solid var(--accent-success)" : "2px solid var(--border-strong)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span className="font-pixel text-success" style={{ fontSize: "8px" }}>BUSINESS VENUES</span>
              <h3 className="font-pixel" style={{ fontSize: "12px", margin: "4px 0 0 0" }}>PARTNER HUB</h3>
            </div>
            {tier === "partner" ? (
              <span className="nokia-badge nokia-badge-success">ACTIVE</span>
            ) : (
              <span className="nokia-badge nokia-badge-success">BUSINESS</span>
            )}
          </div>

          <p className="font-mono text-muted" style={{ fontSize: "11px", margin: 0 }}>
            For cafes, padel courts, gaming lounges, and restaurants in Karachi.
          </p>

          <div className="nokia-panel-sunken" style={{ padding: "8px", display: "flex", alignItems: "baseline", gap: "6px", alignSelf: "flex-start" }}>
            <span className="font-lcd text-success" style={{ fontSize: "28px", lineHeight: 1 }}>PKR 3,500</span>
            <span className="font-mono text-muted" style={{ fontSize: "10px" }}>/ mo</span>
          </div>

          <hr className="nokia-divider" />

          <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px", flexGrow: 1 }}>
            {[
              "Broadcast Daily Promo Offers & Vouchers",
              "Auto-Promoted on Radar with Emerald Badge",
              "Access to Dedicated Partner Command Center",
              "Direct Squad Foot-Traffic Generation",
              "Track Squad Check-ins & Redemptions",
              "Verified Venue Checkmark on Map"
            ].map((perk) => (
              <li key={perk} className="font-mono" style={{ fontSize: "11px", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                <span className="text-success" style={{ fontSize: "12px", lineHeight: "14px" }}>▤</span>
                <span>{perk}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => openPaymentModal("partner")}
            disabled={tier === "partner" || tier === "admin"}
            className="nokia-btn nokia-btn-success"
            style={{ width: "100%", marginTop: "12px" }}
          >
            {tier === "partner" ? "ACTIVE PARTNER" : "ACTIVATE PARTNER HUB"}
          </button>
        </div>

      </div>

      {/* Paused Tier Note */}
      <div className="text-center" style={{ marginTop: "24px" }}>
        <span className="font-mono text-muted" style={{ fontSize: "10px" }}>
          ◈ Note: Family VIP tier is currently paused for our initial community launch.
        </span>
      </div>

      {/* ── PAYMENT MODAL: RAAST / SADAPAY / BANK TRANSFER ────────────────── */}
      {modalTier && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="nokia-panel relative w-full max-w-lg font-mono page-swipe"
            style={{ maxHeight: "90vh", overflowY: "auto", padding: 0 }}
          >
            {/* Modal Title Bar */}
            <div
              style={{
                background: modalTier === "partner" ? "var(--accent-success)" : "var(--accent-primary)",
                color: modalTier === "partner" ? "#000" : "#fff",
                padding: "10px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="font-pixel" style={{ fontSize: "9px" }}>
                ◈ SECURE LOCAL PAYMENT (KARACHI / PK)
              </span>
              <button
                onClick={() => setModalTier(null)}
                style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontWeight: "bold" }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              {modalSuccess ? (
                <div className="text-center" style={{ padding: "24px 0" }}>
                  <div className="nokia-lcd" style={{ fontSize: "20px", color: "var(--accent-success)", marginBottom: "12px" }}>
                    PROOF RECEIVED ✓
                  </div>
                  <h3 className="font-pixel text-success" style={{ fontSize: "11px" }}>
                    TRANSACTION SUBMITTED FOR REVIEW
                  </h3>
                  <p className="font-mono text-muted" style={{ fontSize: "11px", marginTop: "8px" }}>
                    Your transaction ID has been recorded. Admin will verify and activate your tier shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePaymentSubmit}>
                  {/* Amount notice */}
                  <div className="nokia-panel-sunken" style={{ padding: "12px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="font-pixel" style={{ fontSize: "8px" }}>
                        TIER: {modalTier.toUpperCase()}
                      </span>
                      <span className="font-lcd text-accent" style={{ fontSize: "20px" }}>
                        PKR {modalTier === "member" ? "2,000" : "3,500"}
                      </span>
                    </div>
                  </div>

                  {/* Payment method selector */}
                  <label className="font-pixel" style={{ fontSize: "7px", display: "block", marginBottom: "8px" }}>
                    SELECT TRANSFER METHOD
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: "16px" }}>
                    {[
                      { id: "raast", label: "⚡ RAAST" },
                      { id: "sadapay", label: "📲 SADAPAY" },
                      { id: "bank_transfer", label: "🏦 BANK IBFT" }
                    ].map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`nokia-btn font-pixel ${paymentMethod === m.id ? "nokia-btn-primary" : ""}`}
                        style={{ fontSize: "7px", padding: "8px 4px" }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {/* Account instructions box */}
                  <div className="nokia-panel-sunken" style={{ padding: "12px", marginBottom: "16px" }}>
                    {paymentMethod === "raast" && (
                      <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
                        <div style={{ color: "var(--accent-success)", fontWeight: "bold" }}>RAAST ID (Instant / Zero Fee):</div>
                        <div className="font-lcd text-accent" style={{ fontSize: "18px", letterSpacing: "1px" }}>
                          0300-SOLONOMORE
                        </div>
                        <div className="text-muted" style={{ fontSize: "10px" }}>
                          Linked Account: Meezan Bank / SadaPay (Abdul Raffay)
                        </div>
                      </div>
                    )}

                    {paymentMethod === "sadapay" && (
                      <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
                        <div style={{ color: "var(--accent-warning)", fontWeight: "bold" }}>SADAPAY / NAYAPAY WALLET:</div>
                        <div className="font-lcd text-warning" style={{ fontSize: "18px" }}>
                          0300-1234567
                        </div>
                        <div className="text-muted" style={{ fontSize: "10px" }}>
                          Account Title: Solo-No-More / Abdul Raffay
                        </div>
                      </div>
                    )}

                    {paymentMethod === "bank_transfer" && (
                      <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
                        <div style={{ color: "var(--accent-primary)", fontWeight: "bold" }}>MEEZAN BANK IBFT:</div>
                        <div>Account Title: <span className="text-accent font-bold">Abdul Raffay</span></div>
                        <div className="font-mono text-muted" style={{ fontSize: "10px" }}>IBAN: PK42MEZN0001234567890123</div>
                      </div>
                    )}
                  </div>

                  {/* Transaction Ref input */}
                  <div style={{ marginBottom: "16px" }}>
                    <label className="font-pixel" style={{ fontSize: "7px", display: "block", marginBottom: "6px" }}>
                      TRANSACTION REFERENCE / TID (From Bank App Receipt) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9840210294 or STAN/RRN"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="nokia-input"
                      style={{ width: "100%", fontSize: "11px" }}
                    />
                    <span className="font-mono text-muted" style={{ fontSize: "9px", display: "block", marginTop: "4px" }}>
                      Copy the 6 to 12 digit Transaction ID shown on your banking or SadaPay confirmation.
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
                    <button
                      type="submit"
                      disabled={submitting || !transactionRef.trim()}
                      className="nokia-btn nokia-btn-primary"
                      style={{ width: "100%", padding: "12px", fontSize: "9px" }}
                    >
                      {submitting ? "SUBMITTING PROOF..." : "SUBMIT PAYMENT PROOF"}
                    </button>

                    {/* Developer instant toggle */}
                    <button
                      type="button"
                      onClick={() => handleDevInstantUpgrade(modalTier)}
                      className="nokia-btn"
                      style={{ width: "100%", fontSize: "7px", opacity: 0.7 }}
                    >
                      ⚡ [DEV TEST: SIMULATE INSTANT APPROVAL]
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
