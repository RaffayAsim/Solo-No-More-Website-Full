"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Radio,
  CreditCard,
  Ticket,
  ClipboardList,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  Calendar,
  AlertCircle,
  Activity,
} from "lucide-react";
import { IconUserPlus, IconX } from "@/components/icons/AppIcons";
import { adminCreateMemberAction } from "@/app/actions/admin";

export interface ActivityItem {
  id: string;
  type: "beacon" | "payment" | "application" | "booking";
  title: string;
  subtitle: string;
  userName: string;
  status: string;
  timestamp: string;
  href: string;
}

interface AdminOverviewClientProps {
  recentActivities: ActivityItem[];
}

export default function AdminOverviewClient({ recentActivities }: AdminOverviewClientProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "Karachi",
    tier: "member" as "none" | "member" | "family",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await adminCreateMemberAction({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        tier: formData.tier,
        password: formData.password || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to create member");
      } else {
        setSuccessMsg(`✓ Member ${formData.fullName} onboarded and verified successfully!`);
        setTimeout(() => {
          setIsAddModalOpen(false);
          setSuccessMsg("");
          setFormData({
            fullName: "",
            email: "",
            phone: "",
            city: "Karachi",
            tier: "member",
            password: "",
          });
          router.refresh();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("approved") || s.includes("active") || s.includes("confirmed")) {
      return { bg: "rgba(39, 201, 63, 0.15)", border: "rgba(39, 201, 63, 0.35)", text: "#27C93F" };
    }
    if (s.includes("pending") || s.includes("review")) {
      return { bg: "rgba(255, 149, 0, 0.15)", border: "rgba(255, 149, 0, 0.35)", text: "#FF9500" };
    }
    if (s.includes("cancel") || s.includes("reject")) {
      return { bg: "rgba(255, 59, 48, 0.15)", border: "rgba(255, 59, 48, 0.35)", text: "#FF3B30" };
    }
    return { bg: "rgba(255, 255, 255, 0.1)", border: "rgba(255, 255, 255, 0.2)", text: "#E5E5E5" };
  };

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "beacon":
        return <Radio className="w-4 h-4 text-[#FF6F26]" />;
      case "payment":
        return <CreditCard className="w-4 h-4 text-[#27C93F]" />;
      case "application":
        return <ClipboardList className="w-4 h-4 text-[#FF9500]" />;
      case "booking":
        return <Ticket className="w-4 h-4 text-[#FFA05C]" />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ── 1. QUICK ACTION BUTTONS BAR ─────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(255, 111, 38, 0.08) 0%, rgba(18, 12, 24, 0.8) 100%)",
          border: "1px solid rgba(255, 111, 38, 0.25)",
          borderRadius: "20px",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #FF6F26 0%, #FF4400 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(255, 111, 38, 0.45)",
            }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 900, color: "#FFFFFF" }}>
              Quick Operations Command
            </div>
            <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.6)" }}>
              Direct onboarding, event publishing and priority queue clearance
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {/* Quick Button: Add New Member */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            style={{
              background: "linear-gradient(135deg, #FF6F26 0%, #FF4400 100%)",
              color: "#FFFFFF",
              fontSize: "12.5px",
              fontWeight: 800,
              padding: "9px 18px",
              borderRadius: "12px",
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              boxShadow: "0 4px 16px rgba(255, 111, 38, 0.45)",
              transition: "transform 0.15s ease",
            }}
            className="hover:scale-105 active:scale-95"
          >
            <IconUserPlus size={16} color="#FFFFFF" />
            <span>+ Add New Member</span>
          </button>

          {/* Quick Button: Create Event */}
          <Link
            href="/admin/events"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#FFFFFF",
              fontSize: "12.5px",
              fontWeight: 800,
              padding: "9px 16px",
              borderRadius: "12px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
            className="hover:bg-white/15 hover:border-white/30"
          >
            <Calendar className="w-4 h-4 text-[#FF8A3D]" />
            <span>+ Create Event</span>
          </Link>

          {/* Quick Button: Review Applications */}
          <Link
            href="/admin/applications"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#FFFFFF",
              fontSize: "12.5px",
              fontWeight: 800,
              padding: "9px 16px",
              borderRadius: "12px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
            className="hover:bg-white/15 hover:border-white/30"
          >
            <ClipboardList className="w-4 h-4 text-[#FF9500]" />
            <span>Applications Queue</span>
          </Link>

          {/* Quick Button: Payments */}
          <Link
            href="/admin/payments"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#FFFFFF",
              fontSize: "12.5px",
              fontWeight: 800,
              padding: "9px 16px",
              borderRadius: "12px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
            className="hover:bg-white/15 hover:border-white/30"
          >
            <CreditCard className="w-4 h-4 text-[#27C93F]" />
            <span>Verify Payments</span>
          </Link>
        </div>
      </div>

      {/* ── 2. RECENT ACTIVITY FEATURE (Replacing Old Guardrails) ───────── */}
      <section
        style={{
          background: "linear-gradient(160deg, rgba(18, 12, 24, 0.95) 0%, rgba(8, 4, 12, 0.95) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "24px",
          padding: "clamp(20px, 3vw, 28px)",
          boxShadow: "0 14px 40px rgba(0, 0, 0, 0.45)",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(255, 111, 38, 0.15)",
                border: "1px solid rgba(255, 111, 38, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FF8A3D",
              }}
            >
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: 900, margin: 0, color: "#FFFFFF" }}>
                Recent Platform Activity &amp; Live Telemetry
              </h3>
              <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", margin: "2px 0 0" }}>
                Chronological feed of new applications, ticket bookings, beacon broadcasts &amp; payment receipts
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: "rgba(39, 201, 63, 0.12)",
                border: "1px solid rgba(39, 201, 63, 0.3)",
                color: "#27C93F",
                padding: "4px 10px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: 800,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#27C93F] animate-pulse" />
              <span>LIVE UPDATES</span>
            </span>
          </div>
        </div>

        {/* Activity Items List */}
        {recentActivities.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              background: "rgba(255, 255, 255, 0.02)",
              borderRadius: "16px",
              border: "1px dashed rgba(255, 255, 255, 0.12)",
            }}
          >
            <Clock className="w-8 h-8 text-white/30 mx-auto mb-2" />
            <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)", margin: 0 }}>
              No recent activity recorded yet. As members book events and broadcast beacons, updates will appear here in real time.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recentActivities.map((act) => {
              const badge = getStatusBadge(act.status);
              return (
                <div
                  key={act.id}
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                    transition: "all 0.15s ease",
                  }}
                  className="hover:border-white/20 hover:bg-white/[0.05]"
                >
                  {/* Left: Icon + Title + Details */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "260px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {getActivityIcon(act.type)}
                    </div>
                    <div>
                      <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#FFFFFF", marginBottom: "2px" }}>
                        {act.title}
                      </div>
                      <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.6)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontWeight: 700, color: "#FFA05C" }}>{act.userName}</span>
                        <span>•</span>
                        <span>{act.subtitle}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Badge + Timestamp + Action Link */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        padding: "3px 10px",
                        borderRadius: "8px",
                        background: badge.bg,
                        border: `1px solid ${badge.border}`,
                        color: badge.text,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {act.status}
                    </span>

                    <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.5)", whiteSpace: "nowrap" }}>
                      {act.timestamp}
                    </span>

                    <Link
                      href={act.href}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        color: "#FFFFFF",
                        fontSize: "11.5px",
                        fontWeight: 800,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        transition: "all 0.15s ease",
                      }}
                      className="hover:bg-white/15"
                    >
                      <span>Inspect</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#FF8A3D]" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 3. MODAL: QUICK ADD NEW MEMBER ──────────────────────────────── */}
      {isAddModalOpen && mounted && createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.90)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 999999,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "#120C18",
              border: "1px solid rgba(255, 111, 38, 0.35)",
              borderRadius: "24px",
              padding: "28px",
              boxShadow: "0 24px 80px rgba(0, 0, 0, 0.95)",
              position: "relative",
              zIndex: 1000000,
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #FF6F26, #FF4400)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                  }}
                >
                  <IconUserPlus size={18} color="#FFFFFF" />
                </div>
                <div>
                  <h3 style={{ fontSize: "17px", fontWeight: 900, color: "#FFFFFF", margin: 0 }}>
                    Onboard New Member
                  </h3>
                  <p style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.6)", margin: "2px 0 0" }}>
                    Instantly create and grant approved membership access
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close modal"
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  borderRadius: "10px",
                  width: "34px",
                  height: "34px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  cursor: "pointer",
                }}
                className="hover:bg-white/20 transition-all"
              >
                <IconX size={16} color="#FFFFFF" />
              </button>
            </div>

            {/* Error & Success Messages */}
            {errorMsg && (
              <div
                style={{
                  background: "rgba(255, 59, 48, 0.15)",
                  border: "1px solid rgba(255, 59, 48, 0.4)",
                  color: "#FF3B30",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontWeight: 700,
                  marginBottom: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div
                style={{
                  background: "rgba(39, 201, 63, 0.15)",
                  border: "1px solid rgba(39, 201, 63, 0.4)",
                  color: "#27C93F",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontWeight: 700,
                  marginBottom: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAddMember} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zainab Ahmed"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "10px",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    outline: "none",
                  }}
                  className="focus:border-[#FF6F26]"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="member@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                    className="focus:border-[#FF6F26]"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="0300-1234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                    className="focus:border-[#FF6F26]"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                    City Radar Hub
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#1E1428",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  >
                    <option value="Karachi">Karachi</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                    Membership Tier
                  </label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#1E1428",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  >
                    <option value="member">Solo Member (Verified)</option>
                    <option value="family">Family / Inner Circle VIP</option>
                    <option value="none">Active Explorer (Free/Guest)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                  Temporary Password (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Defaults to SoloNoMore2026!"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "10px",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    outline: "none",
                  }}
                  className="focus:border-[#FF6F26]"
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#FFFFFF",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "10px 22px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #FF6F26, #FF4400)",
                    border: "none",
                    color: "#FFFFFF",
                    fontSize: "12.5px",
                    fontWeight: 800,
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.7 : 1,
                    boxShadow: "0 4px 16px rgba(255, 111, 38, 0.45)",
                  }}
                >
                  {submitting ? "Onboarding..." : "Confirm & Onboard Member"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
