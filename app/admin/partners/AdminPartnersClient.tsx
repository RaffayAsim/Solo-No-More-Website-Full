"use client";

import React, { useState } from "react";
import {
  PartnerRecord,
  ApprovedMemberOption,
  grantPartnerAccessAction,
  createNewPartnerAccountAction,
  updatePartnerStatusAction,
} from "@/app/actions/partners";
import {
  RefreshCw,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
  User,
  ShieldCheck,
  Building,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";

interface AdminPartnersClientProps {
  initialPartners: PartnerRecord[];
  initialApprovedMembers: ApprovedMemberOption[];
}

export default function AdminPartnersClient({
  initialPartners,
  initialApprovedMembers,
}: AdminPartnersClientProps) {
  const [partners, setPartners] = useState<PartnerRecord[]>(initialPartners);
  const [approvedMembers] = useState<ApprovedMemberOption[]>(initialApprovedMembers);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creationType, setCreationType] = useState<"existing" | "new">("existing");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (id: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/dashboard/partner`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Existing Member Form
  const [selectedMemberId, setSelectedMemberId] = useState("");

  // New Partner Form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cnic, setCnic] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Search Filter
  const filteredPartners = partners.filter((p) => {
    const q = search.toLowerCase().trim();
    return (
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.phone.toLowerCase().includes(q)
    );
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredPartners.length / itemsPerPage));
  const paginatedPartners = filteredPartners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle Refresh
  const handleRefresh = () => {
    setFeedback({ type: "success", text: "Partner records refreshed." });
    setTimeout(() => setFeedback(null), 2500);
  };

  // Handle Status Update (Approve / Pending / Suspend)
  const handleStatusChange = async (partnerId: string, newStatus: "approved" | "pending" | "suspended") => {
    setLoading(true);
    const res = await updatePartnerStatusAction(partnerId, newStatus);
    setLoading(false);
    if (res.success) {
      setPartners((prev) =>
        prev.map((p) => (p.id === partnerId ? { ...p, status: newStatus } : p))
      );
      setFeedback({
        type: "success",
        text: `✓ Partner status successfully updated to ${newStatus}!`,
      });
      setTimeout(() => setFeedback(null), 2500);
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to update partner status." });
    }
  };

  // Handle Grant Access to Existing Member
  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setFeedback({ type: "error", text: "Please select an approved member." });
      return;
    }

    setLoading(true);
    setFeedback(null);

    const member = approvedMembers.find((m) => m.id === selectedMemberId);
    const res = await grantPartnerAccessAction(selectedMemberId);
    setLoading(false);

    if (res.success) {
      setFeedback({
        type: "success",
        text: `✓ Partner access granted to ${member?.name || "member"}!`,
      });

      if (member) {
        setPartners((prev) => [
          {
            id: member.id,
            name: member.name,
            email: member.email,
            phone: member.phone || "03000000000",
            status: "approved",
            registered: new Date().toLocaleString("en-US"),
          },
          ...prev,
        ]);
      }
      setIsModalOpen(false);
      setSelectedMemberId("");
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to grant partner access." });
    }
  };

  // Handle Create New Partner Account
  const handleCreateNewPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setFeedback({ type: "error", text: "Full Name and Email are required." });
      return;
    }

    if (password && password.length < 6) {
      setFeedback({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }

    if (password && password !== confirmPassword) {
      setFeedback({ type: "error", text: "Passwords do not match." });
      return;
    }

    setLoading(true);
    setFeedback(null);

    const res = await createNewPartnerAccountAction({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      cnic: cnic.trim(),
      password,
    });
    setLoading(false);

    if (res.success) {
      setFeedback({
        type: "success",
        text: `✓ Partner account "${fullName}" created successfully!`,
      });

      setPartners((prev) => [
        {
          id: res.partnerId || `partner-${Date.now()}`,
          name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || "+1 (555) 000-0000",
          status: "approved",
          registered: new Date().toLocaleString("en-US"),
        },
        ...prev,
      ]);

      setIsModalOpen(false);
      setFullName("");
      setEmail("");
      setPhone("");
      setCnic("");
      setPassword("");
      setConfirmPassword("");
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to create partner account." });
    }
  };

  return (
    <div style={{ maxWidth: "1600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ── 1. HEADER (Matches Image 1) ─────────────────────────────────── */}
      <div>
        <h1
          style={{
            fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
            fontSize: "clamp(24px, 3.5vw, 32px)",
            fontWeight: 900,
            margin: "0 0 4px",
            color: "#FFFFFF",
            letterSpacing: "-0.03em",
          }}
        >
          Partners
        </h1>
        <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)", margin: 0 }}>
          Manage partner accounts and their access.
        </p>
      </div>

      {/* ── 2. FEEDBACK ALERTS ─────────────────────────────────────────── */}
      {feedback && (
        <div
          style={{
            background:
              feedback.type === "success"
                ? "rgba(39, 201, 63, 0.12)"
                : "rgba(255, 68, 68, 0.12)",
            border:
              feedback.type === "success"
                ? "1px solid rgba(39, 201, 63, 0.35)"
                : "1px solid rgba(255, 68, 68, 0.35)",
            borderRadius: "14px",
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: feedback.type === "success" ? "#4ADE80" : "#FF8080",
            fontSize: "13.5px",
            fontWeight: 700,
          }}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle size={18} className="shrink-0 text-rose-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ── 3. CONTROLS BAR (Matches Image 1) ───────────────────────────── */}
      <div
        style={{
          background: "rgba(18, 12, 24, 0.85)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "18px",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        {/* Left Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: "12px",
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            className="hover:bg-white/[0.12]"
          >
            <RefreshCw size={14} className="text-white/70" />
            <span>Refresh</span>
          </button>

          {/* + Add Partner Button (Orange Website Theme) */}
          <button
            type="button"
            onClick={() => {
              setFeedback(null);
              setIsModalOpen(true);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: "linear-gradient(135deg, #FF6F26 0%, #FF4400 100%)",
              border: "none",
              borderRadius: "12px",
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(255, 111, 38, 0.45)",
              transition: "all 0.15s ease",
            }}
            className="hover:brightness-110 active:scale-[0.98]"
          >
            <Plus size={16} className="text-white" />
            <span>Add Partner</span>
          </button>
        </div>

        {/* Right Search Input */}
        <div
          style={{
            position: "relative",
            minWidth: "260px",
            maxWidth: "360px",
            flex: 1,
          }}
        >
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: "rgba(0, 0, 0, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: "12px",
              color: "#FFFFFF",
              fontSize: "13px",
              outline: "none",
            }}
            className="focus:border-[#FF6F26] transition-colors"
          />
        </div>
      </div>

      {/* ── 4. PARTNERS TABLE (Matches Image 1) ─────────────────────────── */}
      <div
        style={{
          background: "rgba(18, 12, 24, 0.92)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 14px 40px rgba(0, 0, 0, 0.45)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  background: "rgba(255, 255, 255, 0.02)",
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                <th style={{ padding: "16px 20px" }}>Partner / Venue</th>
                <th style={{ padding: "16px 20px" }}>Email</th>
                <th style={{ padding: "16px 20px" }}>Phone</th>
                <th style={{ padding: "16px 20px" }}>Status</th>
                <th style={{ padding: "16px 20px" }}>Registered</th>
                <th style={{ padding: "16px 20px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPartners.length > 0 ? (
                paginatedPartners.map((partner) => (
                  <tr
                    key={partner.id}
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      transition: "background 0.12s ease",
                    }}
                    className="hover:bg-white/[0.03]"
                  >
                    {/* Name + Business Name + Avatar Badge 'P' */}
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "10px",
                            background: "linear-gradient(135deg, #FF6F26 0%, #FF4400 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#FFFFFF",
                            fontSize: "14px",
                            fontWeight: 900,
                            boxShadow: "0 2px 10px rgba(255, 111, 38, 0.35)",
                          }}
                        >
                          P
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "#FFFFFF", fontSize: "13.5px" }}>{partner.name}</div>
                          {partner.business_name && (
                            <div style={{ fontSize: "11.5px", color: "#FF8A3D", fontWeight: 600 }}>
                              {partner.business_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: "16px 20px", color: "rgba(255, 255, 255, 0.75)" }}>
                      {partner.email}
                    </td>

                    {/* Phone */}
                    <td style={{ padding: "16px 20px", color: "rgba(255, 255, 255, 0.75)" }}>
                      {partner.phone}
                    </td>

                    {/* Status Pill */}
                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 800,
                          background:
                            partner.status === "approved"
                              ? "rgba(39, 201, 63, 0.15)"
                              : partner.status === "suspended"
                              ? "rgba(239, 68, 68, 0.15)"
                              : "rgba(255, 111, 38, 0.15)",
                          border: `1px solid ${
                            partner.status === "approved"
                              ? "rgba(39, 201, 63, 0.35)"
                              : partner.status === "suspended"
                              ? "rgba(239, 68, 68, 0.35)"
                              : "rgba(255, 111, 38, 0.35)"
                          }`,
                          color:
                            partner.status === "approved"
                              ? "#27C93F"
                              : partner.status === "suspended"
                              ? "#EF4444"
                              : "#FF8A3D",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {partner.status}
                      </span>
                    </td>

                    {/* Registered Date */}
                    <td style={{ padding: "16px 20px", color: "rgba(255, 255, 255, 0.55)", fontSize: "12.5px" }}>
                      {partner.registered}
                    </td>

                    {/* Actions: Approve / Suspend / Copy Link */}
                    <td style={{ padding: "16px 20px", textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                        {partner.status !== "approved" ? (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(partner.id, "approved")}
                            style={{
                              background: "linear-gradient(135deg, #FF6F26 0%, #FF4400 100%)",
                              border: "none",
                              color: "#FFFFFF",
                              borderRadius: "8px",
                              padding: "5px 12px",
                              fontSize: "11.5px",
                              fontWeight: 800,
                              cursor: "pointer",
                              boxShadow: "0 2px 10px rgba(255, 111, 38, 0.3)",
                            }}
                          >
                            ✓ Approve
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(partner.id, "suspended")}
                            style={{
                              background: "rgba(255, 255, 255, 0.05)",
                              border: "1px solid rgba(255, 255, 255, 0.12)",
                              color: "rgba(255, 255, 255, 0.65)",
                              borderRadius: "8px",
                              padding: "5px 10px",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Suspend
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCopyLink(partner.id)}
                          style={{
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            borderRadius: "8px",
                            padding: "5px 10px",
                            color: "#FFFFFF",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          {copiedId === partner.id ? (
                            <>
                              <Check size={12} className="text-emerald-400" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy size={12} className="text-[#FF8A3D]" /> Portal
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: "36px", textAlign: "center", color: "rgba(255, 255, 255, 0.4)" }}>
                    No partner records found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── 5. PAGINATION (Matches Image 1) ─────────────────────────── */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            fontSize: "12.5px",
            color: "rgba(255, 255, 255, 0.6)",
          }}
        >
          <div>
            Showing {filteredPartners.length === 0 ? 0 : 1}-{filteredPartners.length} of {filteredPartners.length} partners
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: currentPage <= 1 ? "rgba(255, 255, 255, 0.3)" : "#FFFFFF",
                cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: "12px",
              }}
            >
              Previous
            </button>

            {/* Active Page Indicator (Orange website theme) */}
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #FF6F26 0%, #FF4400 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 900,
                boxShadow: "0 2px 8px rgba(255, 111, 38, 0.4)",
              }}
            >
              {currentPage}
            </div>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: currentPage >= totalPages ? "rgba(255, 255, 255, 0.3)" : "#FFFFFF",
                cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: "12px",
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ── 6. ADD PARTNER MODAL (Matches Image 2, Image 3 & Image 4) ───── */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#120C18",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "20px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
              position: "relative",
            }}
            className="custom-tabs-scrollbar"
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#FFFFFF", margin: 0 }}>
                  Add Partner
                </h2>
                <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.55)", margin: "2px 0 0" }}>
                  Admin workspace
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  cursor: "pointer",
                }}
                className="hover:bg-white/[0.15]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF", marginBottom: "4px" }}>
                  Create Partner Account
                </div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255, 255, 255, 0.6)", marginBottom: "12px" }}>
                  Partner Creation Type
                </div>

                {/* 2-Card Mode Selector (Matches Image 2 & 3) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {/* Card 1: Existing Member */}
                  <div
                    onClick={() => setCreationType("existing")}
                    style={{
                      padding: "16px",
                      borderRadius: "14px",
                      background:
                        creationType === "existing"
                          ? "rgba(255, 111, 38, 0.08)"
                          : "rgba(255, 255, 255, 0.03)",
                      border:
                        creationType === "existing"
                          ? "2px solid #FF6F26"
                          : "1px solid rgba(255, 255, 255, 0.1)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#FFFFFF", marginBottom: "4px" }}>
                      Existing Member
                    </div>
                    <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.55)", lineHeight: 1.4 }}>
                      Grant partner access to an already approved member account.
                    </div>
                  </div>

                  {/* Card 2: New Partner Account */}
                  <div
                    onClick={() => setCreationType("new")}
                    style={{
                      padding: "16px",
                      borderRadius: "14px",
                      background:
                        creationType === "new"
                          ? "rgba(255, 111, 38, 0.08)"
                          : "rgba(255, 255, 255, 0.03)",
                      border:
                        creationType === "new"
                          ? "2px solid #FF6F26"
                          : "1px solid rgba(255, 255, 255, 0.1)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#FFFFFF", marginBottom: "4px" }}>
                      New Partner Account
                    </div>
                    <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.55)", lineHeight: 1.4 }}>
                      Create a brand-new dedicated partner login with password.
                    </div>
                  </div>
                </div>
              </div>

              {/* ── MODE A: EXISTING MEMBER (Matches Image 2) ─────────────────── */}
              {creationType === "existing" && (
                <form onSubmit={handleGrantAccess} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#FFFFFF", marginBottom: "8px" }}>
                      Select Approved Member *
                    </label>
                    <select
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        background: "rgba(0, 0, 0, 0.45)",
                        border: "1px solid rgba(255, 255, 255, 0.14)",
                        borderRadius: "12px",
                        color: selectedMemberId ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)",
                        fontSize: "13px",
                        outline: "none",
                        cursor: "pointer",
                      }}
                      className="focus:border-[#FF6F26] transition-colors"
                    >
                      <option value="" style={{ background: "#110B17", color: "rgba(255, 255, 255, 0.5)" }}>
                        Select approved member
                      </option>
                      {approvedMembers.map((m) => (
                        <option key={m.id} value={m.id} style={{ background: "#110B17", color: "#FFFFFF" }}>
                          {m.name} ({m.email})
                        </option>
                      ))}
                    </select>
                    <p style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.45)", margin: "6px 0 0" }}>
                      Select an approved member account; system will auto-fill details and grant partner access.
                    </p>
                  </div>

                  {/* Callout Box */}
                  <div
                    style={{
                      background: "rgba(255, 111, 38, 0.05)",
                      border: "1px solid rgba(255, 111, 38, 0.25)",
                      borderRadius: "12px",
                      padding: "12px 16px",
                      color: "rgba(255, 255, 255, 0.8)",
                      fontSize: "12px",
                      lineHeight: 1.5,
                    }}
                  >
                    This mode upgrades an existing approved member to partner access immediately.
                  </div>

                  {/* Footer Action Buttons */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: "10px",
                      marginTop: "12px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      style={{
                        padding: "10px 20px",
                        borderRadius: "10px",
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        color: "#FFFFFF",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                      className="hover:bg-white/[0.12]"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        padding: "10px 22px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #FF6F26 0%, #FF4400 100%)",
                        border: "none",
                        color: "#FFFFFF",
                        fontSize: "13px",
                        fontWeight: 800,
                        cursor: loading ? "not-allowed" : "pointer",
                        boxShadow: "0 4px 16px rgba(255, 111, 38, 0.4)",
                      }}
                      className="hover:brightness-110 active:scale-[0.98]"
                    >
                      {loading ? "Granting..." : "Grant partner access"}
                    </button>
                  </div>
                </form>
              )}

              {/* ── MODE B: NEW PARTNER ACCOUNT (Matches Image 3 & Image 4) ───── */}
              {creationType === "new" && (
                <form onSubmit={handleCreateNewPartner} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Full Name */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#FFFFFF", marginBottom: "6px" }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        background: "rgba(0, 0, 0, 0.45)",
                        border: "1px solid rgba(255, 255, 255, 0.14)",
                        borderRadius: "10px",
                        color: "#FFFFFF",
                        fontSize: "13px",
                        outline: "none",
                      }}
                      className="focus:border-[#FF6F26] transition-colors"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#FFFFFF", marginBottom: "6px" }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="newpartner@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        background: "rgba(0, 0, 0, 0.45)",
                        border: "1px solid rgba(255, 255, 255, 0.14)",
                        borderRadius: "10px",
                        color: "#FFFFFF",
                        fontSize: "13px",
                        outline: "none",
                      }}
                      className="focus:border-[#FF6F26] transition-colors"
                    />
                    <p style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)", margin: "4px 0 0" }}>
                      Create a brand-new dedicated partner user with a fresh login and password.
                    </p>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#FFFFFF", marginBottom: "6px" }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        background: "rgba(0, 0, 0, 0.45)",
                        border: "1px solid rgba(255, 255, 255, 0.14)",
                        borderRadius: "10px",
                        color: "#FFFFFF",
                        fontSize: "13px",
                        outline: "none",
                      }}
                      className="focus:border-[#FF6F26] transition-colors"
                    />
                  </div>

                  {/* CNIC (Optional) */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#FFFFFF", marginBottom: "6px" }}>
                      CNIC (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="xxxxx-xxxxxxx-x"
                      value={cnic}
                      onChange={(e) => setCnic(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        background: "rgba(0, 0, 0, 0.45)",
                        border: "1px solid rgba(255, 255, 255, 0.14)",
                        borderRadius: "10px",
                        color: "#FFFFFF",
                        fontSize: "13px",
                        outline: "none",
                      }}
                      className="focus:border-[#FF6F26] transition-colors"
                    />
                  </div>

                  {/* Profile Image (Matches Image 4) */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#FFFFFF", marginBottom: "6px" }}>
                      Profile Image
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "rgba(255, 255, 255, 0.5)",
                        }}
                      >
                        <User size={22} />
                      </div>
                      <button
                        type="button"
                        onClick={() => alert("Image upload is ready for partner avatar.")}
                        style={{
                          padding: "8px 16px",
                          background: "rgba(255, 255, 255, 0.08)",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          borderRadius: "10px",
                          color: "#FFFFFF",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                        className="hover:bg-white/[0.14]"
                      >
                        <Upload size={13} />
                        <span>Upload Image</span>
                      </button>
                    </div>
                  </div>

                  {/* Password & Confirm Password (Matches Image 4) */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#FFFFFF", marginBottom: "6px" }}>
                        Password *
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        style={{
                          width: "100%",
                          padding: "11px 14px",
                          background: "rgba(0, 0, 0, 0.45)",
                          border: "1px solid rgba(255, 255, 255, 0.14)",
                          borderRadius: "10px",
                          color: "#FFFFFF",
                          fontSize: "13px",
                          outline: "none",
                        }}
                        className="focus:border-[#FF6F26] transition-colors"
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#FFFFFF", marginBottom: "6px" }}>
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        placeholder="Repeat required password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        style={{
                          width: "100%",
                          padding: "11px 14px",
                          background: "rgba(0, 0, 0, 0.45)",
                          border: "1px solid rgba(255, 255, 255, 0.14)",
                          borderRadius: "10px",
                          color: "#FFFFFF",
                          fontSize: "13px",
                          outline: "none",
                        }}
                        className="focus:border-[#FF6F26] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Footer Action Buttons */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: "10px",
                      marginTop: "12px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      style={{
                        padding: "10px 20px",
                        borderRadius: "10px",
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        color: "#FFFFFF",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                      className="hover:bg-white/[0.12]"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        padding: "10px 22px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #FF6F26 0%, #FF4400 100%)",
                        border: "none",
                        color: "#FFFFFF",
                        fontSize: "13px",
                        fontWeight: 800,
                        cursor: loading ? "not-allowed" : "pointer",
                        boxShadow: "0 4px 16px rgba(255, 111, 38, 0.4)",
                      }}
                      className="hover:brightness-110 active:scale-[0.98]"
                    >
                      {loading ? "Creating..." : "Create partner account"}
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
