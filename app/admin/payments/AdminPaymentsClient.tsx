"use client";

import React, { useState } from "react";
import { reviewPaymentSubmissionAction } from "@/app/actions/billing";

interface PaymentItem {
  id: string;
  user_id: string;
  amount_pkr: number;
  tier_requested: string;
  payment_method: string;
  transaction_ref: string;
  proof_image_url: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  profiles?: {
    full_name: string | null;
    city: string | null;
    avatar_icon: string | null;
  };
}

export default function AdminPaymentsClient({ initialPayments }: { initialPayments: PaymentItem[] }) {
  const [payments, setPayments] = useState<PaymentItem[]>(initialPayments);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleReview = async (id: string, decision: "approved" | "rejected") => {
    setProcessingId(id);
    setMessage(null);

    const notes = decision === "rejected" ? prompt("Reason for rejection (sent to user):") || "Invalid Transaction ID" : undefined;

    try {
      const res = await reviewPaymentSubmissionAction(id, decision, notes);
      if (res.success) {
        setPayments((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, status: decision, admin_notes: notes || null, reviewed_at: new Date().toISOString() } : p
          )
        );
        setMessage({
          type: "success",
          text: `Payment ${decision === "approved" ? "approved and tier activated" : "rejected"} successfully.`,
        });
      } else {
        setMessage({ type: "error", text: res.error });
      }
    } catch {
      setMessage({ type: "error", text: "Network error processing payment review." });
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = payments.filter((p) => (filter === "all" ? true : p.status === filter));
  const pendingCount = payments.filter((p) => p.status === "pending").length;

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div className="nokia-panel-sunken" style={{ padding: "16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h1 className="font-pixel text-accent" style={{ fontSize: "14px", margin: 0, letterSpacing: "0.08em" }}>
              💳 PAYMENTS & BILLING VERIFICATION
            </h1>
            <p className="font-mono text-muted" style={{ fontSize: "11px", margin: "4px 0 0 0" }}>
              Review Raast, SadaPay, and Bank IBFT transaction proofs submitted by members.
            </p>
          </div>
          <div className="nokia-badge nokia-badge-warning" style={{ fontSize: "9px" }}>
            {pendingCount} PENDING VERIFICATIONS
          </div>
        </div>
      </div>

      {message && (
        <div
          className="nokia-panel-raised"
          style={{
            borderColor: message.type === "success" ? "var(--accent-success)" : "var(--accent-danger)",
            padding: "12px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span className={`font-pixel ${message.type === "success" ? "text-success" : "text-danger"}`}>
            [{message.type === "success" ? "✓" : "✕"}]
          </span>
          <span className="font-mono" style={{ fontSize: "11px" }}>{message.text}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {(["pending", "approved", "rejected", "all"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`nokia-btn font-pixel ${filter === tab ? "nokia-btn-primary" : ""}`}
            style={{ fontSize: "8px", padding: "6px 12px", textTransform: "uppercase" }}
          >
            {tab} ({tab === "all" ? payments.length : payments.filter((p) => p.status === tab).length})
          </button>
        ))}
      </div>

      {/* Payments List */}
      {filtered.length === 0 ? (
        <div className="nokia-panel text-center" style={{ padding: "32px" }}>
          <div className="font-lcd text-muted" style={{ fontSize: "20px" }}>NO TRANSACTIONS FOUND</div>
          <p className="font-mono text-muted" style={{ fontSize: "11px", marginTop: "8px" }}>
            No payment submissions currently match the &quot;{filter}&quot; filter.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map((p) => {
            const userName = p.profiles?.full_name || "Unknown Member";
            const userCity = p.profiles?.city || "Karachi";
            const dateStr = new Date(p.created_at).toLocaleDateString("en-PK", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={p.id}
                className="nokia-panel"
                style={{
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  borderLeft:
                    p.status === "approved"
                      ? "4px solid var(--accent-success)"
                      : p.status === "rejected"
                      ? "4px solid var(--accent-danger)"
                      : "4px solid var(--accent-warning)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="font-pixel text-accent" style={{ fontSize: "10px" }}>
                        {userName.toUpperCase()}
                      </span>
                      <span className="nokia-badge" style={{ fontSize: "7px" }}>{userCity}</span>
                    </div>
                    <div className="font-mono text-muted" style={{ fontSize: "10px", marginTop: "4px" }}>
                      User ID: {p.user_id} • Submitted: {dateStr}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div className="font-lcd text-accent" style={{ fontSize: "22px", lineHeight: 1 }}>
                      PKR {p.amount_pkr?.toLocaleString() || "1,500"}
                    </div>
                    <span
                      className={`nokia-badge ${
                        p.status === "approved"
                          ? "nokia-badge-success"
                          : p.status === "rejected"
                          ? "nokia-badge-danger"
                          : "nokia-badge-warning"
                      }`}
                      style={{ fontSize: "7px", marginTop: "4px" }}
                    >
                      {p.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="nokia-panel-sunken" style={{ padding: "10px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", fontSize: "11px" }}>
                  <div>
                    <span className="text-muted" style={{ fontSize: "9px", display: "block" }}>TARGET TIER:</span>
                    <span className="font-pixel text-accent" style={{ fontSize: "9px" }}>
                      ★ {p.tier_requested?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted" style={{ fontSize: "9px", display: "block" }}>CHANNEL:</span>
                    <span className="font-bold">{p.payment_method?.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-muted" style={{ fontSize: "9px", display: "block" }}>TRANSACTION ID / TID:</span>
                    <span className="font-mono text-warning font-bold" style={{ letterSpacing: "1px" }}>
                      {p.transaction_ref}
                    </span>
                  </div>
                </div>

                {p.admin_notes && (
                  <div className="font-mono text-muted" style={{ fontSize: "10px" }}>
                    Admin Notes: {p.admin_notes}
                  </div>
                )}

                {/* Actions for pending items */}
                {p.status === "pending" && (
                  <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                    <button
                      onClick={() => handleReview(p.id, "approved")}
                      disabled={processingId === p.id}
                      className="nokia-btn nokia-btn-success font-pixel"
                      style={{ fontSize: "8px", padding: "8px 14px", flex: 1 }}
                    >
                      {processingId === p.id ? "PROCESSING..." : "✓ APPROVE & ACTIVATE TIER"}
                    </button>
                    <button
                      onClick={() => handleReview(p.id, "rejected")}
                      disabled={processingId === p.id}
                      className="nokia-btn font-pixel text-danger"
                      style={{ fontSize: "8px", padding: "8px 14px", borderColor: "var(--accent-danger)" }}
                    >
                      ✕ REJECT
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
