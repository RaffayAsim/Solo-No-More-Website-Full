"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  approveUserAction,
  suspendUserAction,
  resetStrikesAction,
  upgradeToPartnerAction,
} from "@/app/actions/admin";

interface MappedUser {
  id: string;
  full_name: string | null;
  email: string;
  bio: string | null;
  social_link: string | null;
  subscription_tier: string;
  account_status: string;
  no_show_strikes: number;
  is_partner: boolean;
  business_name: string | null;
}

interface UserVettingClientProps {
  initialUsers: MappedUser[];
}

export default function UserVettingClient({ initialUsers }: UserVettingClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState<MappedUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending_vetting" | "approved" | "suspended">("all");

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Partner Upgrade modal/input state
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [selectedUserForPartner, setSelectedUserForPartner] = useState<MappedUser | null>(null);
  const [businessNameInput, setBusinessNameInput] = useState("");

  // Sync state if props reload from server page
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const handleApprove = async (userId: string) => {
    setActionLoadingId(userId + "-approve");
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await approveUserAction(userId);
      if (res.success) {
        setSuccessMsg("User account approved successfully!");
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, account_status: "approved" } : u))
        );
        router.refresh();
      } else {
        setErrorMsg(res.error);
      }
    } catch {
      setErrorMsg("Failed to approve user. Connection error.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSuspend = async (userId: string) => {
    setActionLoadingId(userId + "-suspend");
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await suspendUserAction(userId);
      if (res.success) {
        setSuccessMsg("User account suspended.");
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, account_status: "suspended" } : u))
        );
        router.refresh();
      } else {
        setErrorMsg(res.error);
      }
    } catch {
      setErrorMsg("Failed to suspend account. Connection error.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResetStrikes = async (userId: string) => {
    setActionLoadingId(userId + "-reset");
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await resetStrikesAction(userId);
      if (res.success) {
        setSuccessMsg("Warning strikes reset to 0. Account restored to approved.");
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, no_show_strikes: 0, account_status: "approved" }
              : u
          )
        );
        router.refresh();
      } else {
        setErrorMsg(res.error);
      }
    } catch {
      setErrorMsg("Failed to reset warnings. Connection error.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpgradeToPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPartner || !businessNameInput.trim()) return;

    setActionLoadingId(selectedUserForPartner.id + "-partner");
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsPartnerModalOpen(false);

    try {
      const res = await upgradeToPartnerAction(selectedUserForPartner.id, businessNameInput);
      if (res.success) {
        setSuccessMsg(`Upgraded ${selectedUserForPartner.full_name || "user"} to Partner: ${businessNameInput}`);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUserForPartner.id
              ? { ...u, is_partner: true, business_name: businessNameInput }
              : u
          )
        );
        router.refresh();
      } else {
        setErrorMsg(res.error);
      }
    } catch {
      setErrorMsg("Failed to upgrade to partner. Connection error.");
    } finally {
      setActionLoadingId(null);
      setSelectedUserForPartner(null);
    }
  };

  // Perform search and category filters
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.bio || "").toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === "all" || u.account_status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ padding: "24px" }}>
      {/* Vetting Panel Header */}
      <div className="nokia-panel-sunken" style={{ padding: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="font-pixel text-accent" style={{ fontSize: "14px", margin: 0, letterSpacing: "0.08em" }}>
            ▣ USER VETTING CONTROL CENTER
          </h1>
          <p className="font-mono text-muted" style={{ fontSize: "11px", margin: "4px 0 0 0" }}>
            Review waitlist applications, flag risks, and manage membership status.
          </p>
        </div>

        <div>
          <span className="nokia-badge nokia-badge-warning animate-pulse" style={{ fontSize: "7px" }}>
            ⏳ {users.filter((u) => u.account_status === "pending_vetting").length} PENDING
          </span>
        </div>
      </div>

      {/* Global Alerts */}
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

      {/* Control Filters and Search Bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          
          {/* Vetting Status Tabs */}
          <div style={{ display: "flex", gap: "4px" }}>
            {(["all", "pending_vetting", "approved", "suspended"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setFilter(opt)}
                className="font-pixel"
                style={{
                  padding: "8px 12px",
                  fontSize: "8px",
                  background: filter === opt ? "var(--bg-sunken)" : "var(--bg-raised)",
                  color: filter === opt ? "var(--accent-primary)" : "var(--text-primary)",
                  border: "2px solid var(--border-strong)",
                  cursor: "pointer",
                }}
              >
                {opt === "all"
                  ? "ALL"
                  : opt === "pending_vetting"
                  ? "PENDING"
                  : opt === "approved"
                  ? "ACTIVE"
                  : "SUSPENDED"}
              </button>
            ))}
          </div>

          {/* Tactical Search input */}
          <div style={{ position: "relative", width: "100%", maxWidth: "300px" }}>
            <input
              type="text"
              placeholder="SEARCH USER BASE..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="nokia-input font-pixel"
              style={{
                fontSize: "8px",
                padding: "8px 12px",
                textTransform: "uppercase",
              }}
            />
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="nokia-panel" style={{ padding: "8px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "11px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border-strong)", color: "var(--text-secondary)" }}>
              <th style={{ padding: "10px", fontFamily: "var(--font-pixel)", fontSize: "8px" }}>MEMBER</th>
              <th style={{ padding: "10px", fontFamily: "var(--font-pixel)", fontSize: "8px" }}>EMAIL</th>
              <th style={{ padding: "10px", fontFamily: "var(--font-pixel)", fontSize: "8px" }}>TIER</th>
              <th style={{ padding: "10px", fontFamily: "var(--font-pixel)", fontSize: "8px" }}>BIO / VIBE</th>
              <th style={{ padding: "10px", fontFamily: "var(--font-pixel)", fontSize: "8px" }}>SOCIAL</th>
              <th style={{ padding: "10px", fontFamily: "var(--font-pixel)", fontSize: "8px", textAlign: "center" }}>STRIKES</th>
              <th style={{ padding: "10px", fontFamily: "var(--font-pixel)", fontSize: "8px", textAlign: "center" }}>STATUS</th>
              <th style={{ padding: "10px", fontFamily: "var(--font-pixel)", fontSize: "8px", textAlign: "right" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody style={{ color: "var(--text-primary)" }}>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const isFlake = user.no_show_strikes === 1;
                const isGhost = user.no_show_strikes >= 2;

                return (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: "1px solid var(--border-light)",
                      backgroundColor: user.account_status === "pending_vetting" ? "rgba(255, 136, 0, 0.04)" : undefined,
                    }}
                  >
                    {/* Name */}
                    <td style={{ padding: "10px", fontWeight: "bold" }}>
                      <span className="font-pixel text-accent" style={{ fontSize: "8px" }}>
                        👤 {user.full_name?.toUpperCase() || "ANONYMOUS"}
                      </span>
                      {user.is_partner && user.business_name && (
                        <div className="font-pixel text-success animate-pulse" style={{ fontSize: "6px", marginTop: "4px" }}>
                          [▤ PARTNER: {user.business_name.toUpperCase()}]
                        </div>
                      )}
                    </td>

                    {/* Email */}
                    <td style={{ padding: "10px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                      {user.email}
                    </td>

                    {/* Tier */}
                    <td style={{ padding: "10px" }}>
                      <span className={`nokia-badge ${
                        user.subscription_tier === "family"
                          ? "nokia-badge-warning"
                          : user.subscription_tier === "admin"
                          ? "nokia-badge-primary"
                          : ""
                      }`} style={{ fontSize: "6px" }}>
                        {user.subscription_tier.toUpperCase()}
                      </span>
                    </td>

                    {/* Bio */}
                    <td style={{ padding: "10px", color: "var(--text-muted)", fontStyle: "italic", maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={user.bio || ""}>
                      {user.bio ? `“${user.bio}”` : "—"}
                    </td>

                    {/* Social Link */}
                    <td style={{ padding: "10px" }}>
                      {user.social_link ? (
                        <a
                          href={user.social_link.startsWith("http") ? user.social_link : `https://${user.social_link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent"
                          style={{ textDecoration: "underline" }}
                        >
                          {user.social_link.replace(/^(https?:\/\/)?(www\.)?/, "")}
                        </a>
                      ) : (
                        <span style={{ color: "var(--border-light)" }}>—</span>
                      )}
                    </td>

                    {/* Strikes */}
                    <td style={{ padding: "10px", textAlign: "center" }}>
                      <span className={`nokia-badge ${isGhost ? "nokia-badge-danger" : isFlake ? "nokia-badge-warning" : ""}`} style={{ fontSize: "6px" }}>
                        {user.no_show_strikes} {isGhost ? "👻 GHOST" : isFlake ? "⚠ RISK" : ""}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "10px", textAlign: "center" }}>
                      <span className={`nokia-badge ${
                        user.account_status === "approved"
                          ? "nokia-badge-success"
                          : user.account_status === "pending_vetting"
                          ? "nokia-badge-warning animate-pulse"
                          : "nokia-badge-danger"
                      }`} style={{ fontSize: "6px" }}>
                        {user.account_status === "pending_vetting" ? "PENDING" : user.account_status.toUpperCase()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "10px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                        {user.account_status !== "approved" && (
                          <button
                            onClick={() => handleApprove(user.id)}
                            disabled={actionLoadingId !== null}
                            className="nokia-btn nokia-btn-primary"
                            style={{ padding: "4px 8px", fontSize: "7px" }}
                            title="Approve Member Vetting"
                          >
                            {actionLoadingId === user.id + "-approve" ? "..." : "✓ APPROVE"}
                          </button>
                        )}

                        {user.account_status !== "suspended" && (
                          <button
                            onClick={() => handleSuspend(user.id)}
                            disabled={actionLoadingId !== null}
                            className="nokia-btn nokia-btn-danger"
                            style={{ padding: "4px 8px", fontSize: "7px" }}
                            title="Suspend Member Account"
                          >
                            {actionLoadingId === user.id + "-suspend" ? "..." : "✕ SUSPEND"}
                          </button>
                        )}

                        {user.no_show_strikes > 0 && (
                          <button
                            onClick={() => handleResetStrikes(user.id)}
                            disabled={actionLoadingId !== null}
                            className="nokia-btn"
                            style={{ padding: "4px 8px", fontSize: "7px", borderColor: "var(--accent-warning)", color: "var(--accent-warning)" }}
                            title="Reset warning strikes to 0"
                          >
                            {actionLoadingId === user.id + "-reset" ? "..." : "↻ RESET"}
                          </button>
                        )}

                        {!user.is_partner && (
                          <button
                            onClick={() => {
                              setSelectedUserForPartner(user);
                              setBusinessNameInput("");
                              setIsPartnerModalOpen(true);
                            }}
                            disabled={actionLoadingId !== null}
                            className="nokia-btn"
                            style={{ padding: "4px 8px", fontSize: "7px", borderColor: "var(--accent-success)", color: "var(--accent-success)" }}
                            title="Upgrade to Business Partner"
                          >
                            {actionLoadingId === user.id + "-partner" ? "..." : "▤ +PARTNER"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="font-pixel text-center" style={{ padding: "32px", color: "var(--text-muted)", fontSize: "8px" }}>
                  NO MATCHING PROFILES IN QUEUE.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Partner Business Name Modal Prompt */}
      {isPartnerModalOpen && selectedUserForPartner && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={(e) => e.target === e.currentTarget && setIsPartnerModalOpen(false)}
        >
          <div className="nokia-panel font-mono page-swipe" style={{ width: "100%", maxWidth: "400px", padding: 0 }}>
            {/* Header */}
            <div style={{ background: "var(--accent-success)", color: "#111", padding: "8px 14px", borderBottom: "2px solid var(--border-strong)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="font-pixel" style={{ fontSize: "8px" }}>▤ UPGRADE TO PARTNER</span>
              <button onClick={() => setIsPartnerModalOpen(false)} style={{ background: "none", border: "none", color: "#111", cursor: "pointer", fontSize: "12px" }}>✕</button>
            </div>

            <form onSubmit={handleUpgradeToPartner} style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="font-lcd text-center" style={{ fontSize: "18px", color: "var(--accent-success)", marginBottom: "4px" }}>
                BUSINESS SETUP
              </div>

              <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", lineHeight: "1.4" }}>
                Upgrade <strong style={{ color: "var(--text-primary)" }}>{selectedUserForPartner.full_name || "this user"}</strong> to verified partner status.
              </p>

              <div>
                <label className="font-pixel" style={{ display: "block", fontSize: "7px", marginBottom: "6px", color: "var(--accent-success)" }}>
                  ♦ PARTNER BUSINESS NAME
                </label>
                <input
                  type="text"
                  required
                  value={businessNameInput}
                  onChange={(e) => setBusinessNameInput(e.target.value)}
                  placeholder="e.g. MONOCHROME COFFEE CLUB"
                  className="nokia-input"
                  maxLength={100}
                />
              </div>

              <div className="nokia-divider" />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <button type="button" onClick={() => setIsPartnerModalOpen(false)} className="nokia-btn" style={{ fontSize: "8px" }}>
                  ✕ CANCEL
                </button>
                <button type="submit" className="nokia-btn nokia-btn-primary" style={{ fontSize: "8px", borderColor: "var(--accent-success)", color: "var(--accent-success)" }}>
                  ✓ VERIFY PARTNER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
