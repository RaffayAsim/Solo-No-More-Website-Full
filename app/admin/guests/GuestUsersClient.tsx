"use client";

import React, { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { UnifiedUserRecord } from "@/app/admin/users/UserVettingClient";
import {
  getAllGuestUsersAction,
  updateGuestUserStatusAction,
  saveGuestUserDetailsAction,
} from "@/app/actions/guest-users";
import {
  IconEye,
  IconX,
  IconCheck,
  IconRefresh,
  IconChevronDown,
} from "@/components/icons/AppIcons";
import { Search } from "lucide-react";

interface GuestUsersClientProps {
  initialGuests: UnifiedUserRecord[];
}

export default function GuestUsersClient({ initialGuests }: GuestUsersClientProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [guests, setGuests] = useState<UnifiedUserRecord[]>(initialGuests);
  const [search, setSearch] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── "GUEST DETAILS & EDIT" MODAL STATE ──
  const [selectedGuest, setSelectedGuest] = useState<UnifiedUserRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Edit fields
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editStatus, setEditStatus] = useState<"approved" | "pending" | "payment_pending" | "suspended" | "rejected">("approved");
  const [editPhone, setEditPhone] = useState("");
  const [editCity, setEditCity] = useState("Karachi");
  const [editBio, setEditBio] = useState("");
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Re-sync if server props update
  useEffect(() => {
    setGuests(initialGuests);
  }, [initialGuests]);

  // Open Details Modal
  const handleOpenDetails = (guest: UnifiedUserRecord) => {
    setSelectedGuest(guest);
    setEditFirstName(guest.firstName || guest.fullName.split(" ")[0] || "");
    setEditLastName(guest.lastName || guest.fullName.split(" ").slice(1).join(" ") || "");
    setEditDisplayName(guest.displayName || guest.fullName || "");
    setEditUsername(guest.username.replace(/^@/, ""));
    setEditEmail(guest.email);
    setEditStatus(guest.status);
    setEditPhone(guest.phone || "");
    setEditCity(guest.city || "Karachi");
    setEditBio(guest.bio || "");
    setIsDetailModalOpen(true);
  };

  // Inline Status Dropdown Change Handler
  const handleStatusChange = async (
    guest: UnifiedUserRecord,
    newStatus: "approved" | "pending" | "payment_pending" | "suspended" | "rejected"
  ) => {
    setActionLoadingId(guest.id);
    setFeedbackMsg(null);

    try {
      const res = await updateGuestUserStatusAction(guest.id, newStatus);
      if (res.success) {
        setGuests((prev) =>
          prev.map((g) => (g.id === guest.id ? { ...g, status: newStatus } : g))
        );
        setFeedbackMsg({
          type: "success",
          text: `Status for ${guest.fullName} updated to ${newStatus.toUpperCase()}`,
        });
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to update status." });
      }
    } catch {
      setFeedbackMsg({ type: "error", text: "Error updating guest status." });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Save changes from Guest Details modal
  const handleSaveGuestDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuest) return;

    setIsSavingDetails(true);
    setFeedbackMsg(null);

    try {
      const res = await saveGuestUserDetailsAction({
        id: selectedGuest.id,
        firstName: editFirstName,
        lastName: editLastName,
        displayName: editDisplayName || `${editFirstName} ${editLastName}`.trim(),
        username: editUsername,
        email: editEmail,
        status: editStatus,
        phone: editPhone,
        city: editCity,
        bio: editBio,
      });

      if (res.success) {
        const updatedName = `${editFirstName} ${editLastName}`.trim() || editDisplayName;
        setGuests((prev) =>
          prev.map((g) =>
            g.id === selectedGuest.id
              ? {
                  ...g,
                  fullName: updatedName,
                  firstName: editFirstName,
                  lastName: editLastName,
                  displayName: editDisplayName || updatedName,
                  username: editUsername,
                  email: editEmail,
                  phone: editPhone,
                  city: editCity,
                  bio: editBio,
                  status: editStatus,
                }
              : g
          )
        );
        setIsDetailModalOpen(false);
        setFeedbackMsg({ type: "success", text: `✓ Profile details for ${updatedName} successfully saved!` });
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to save profile changes." });
      }
    } catch {
      setFeedbackMsg({ type: "error", text: "Connection error while saving guest user." });
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Live refresh
  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const refreshed = await getAllGuestUsersAction();
        setGuests(refreshed);
        setFeedbackMsg({ type: "success", text: "Guest roster refreshed successfully." });
      } catch {
        setFeedbackMsg({ type: "error", text: "Failed to refresh guests." });
      }
    });
  };

  // Filtered guests strictly by search query (no member tabs)
  const filteredGuests = guests.filter((g) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      g.fullName.toLowerCase().includes(q) ||
      g.username.toLowerCase().includes(q) ||
      g.email.toLowerCase().includes(q) ||
      g.city.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px 20px" }}>
      {/* ── 1. HEADER & SEARCH TOOLBAR (NO MEMBER TABS) ───────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: 900, color: "#FFFFFF", margin: 0, letterSpacing: "-0.02em" }}>
              Guest Users
            </h1>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#38BDF8",
                background: "rgba(56, 189, 248, 0.12)",
                border: "1px solid rgba(56, 189, 248, 0.35)",
                padding: "2px 8px",
                borderRadius: "6px",
              }}
            >
              EXPLORER ROSTER (FREE TRIAL)
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.55)", margin: "4px 0 0" }}>
            Manage registered guest users on Free Trial and open-community event participants.
          </p>
        </div>

        {/* Right: Refresh Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isPending}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              padding: "9px 14px",
              color: "#FFFFFF",
              fontSize: "12.5px",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              cursor: "pointer",
            }}
          >
            <IconRefresh size={14} color="#FFFFFF" className={isPending ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── 2. FEEDBACK ALERT ───────────────────────────────────────────── */}
      {feedbackMsg && (
        <div
          style={{
            marginBottom: "18px",
            padding: "12px 18px",
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background:
              feedbackMsg.type === "success"
                ? "rgba(39, 201, 63, 0.15)"
                : "rgba(255, 59, 48, 0.15)",
            border:
              feedbackMsg.type === "success"
                ? "1px solid rgba(39, 201, 63, 0.3)"
                : "1px solid rgba(255, 59, 48, 0.3)",
            color: feedbackMsg.type === "success" ? "#27C93F" : "#FF453A",
          }}
        >
          {feedbackMsg.type === "success" ? <IconCheck size={16} /> : <IconX size={16} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* ── 3. SEARCH BAR (PURE DIRECTORY, NO MEMBER QUICK TABS BUTTON) ────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "18px",
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "14px",
          padding: "10px 14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255, 255, 255, 0.85)" }}>
            Total Registered Explorers:
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: "12px",
              background: "rgba(56, 189, 248, 0.15)",
              color: "#38BDF8",
              border: "1px solid rgba(56, 189, 248, 0.3)",
            }}
          >
            {filteredGuests.length} Guests
          </span>
        </div>

        <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
          <Search
            size={15}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(255, 255, 255, 0.35)",
            }}
          />
          <input
            type="text"
            placeholder="Search guests by name, email, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              padding: "8px 12px 8px 36px",
              fontSize: "12.5px",
              color: "#FFFFFF",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* ── 4. GUEST USERS TABLE (MATCHING EXACT TABLE DESIGN) ────────────────── */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  background: "rgba(255, 255, 255, 0.03)",
                }}
              >
                <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: 800, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Name
                </th>
                <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: 800, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Email
                </th>
                <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: 800, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Role
                </th>
                <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: 800, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Status
                </th>
                <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: 800, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Registered
                </th>
                <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: 800, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "48px 20px", textAlign: "center", color: "rgba(255, 255, 255, 0.4)" }}>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>No guest users found.</p>
                    <p style={{ margin: "4px 0 0", fontSize: "12px" }}>Try clearing your search query.</p>
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => {
                  const initials = (guest.fullName || "GU")
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  const isUpdating = actionLoadingId === guest.id;

                  return (
                    <tr
                      key={guest.id}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                        transition: "background 0.15s ease",
                      }}
                      className="hover:bg-white/[0.02]"
                    >
                      {/* Name & Username */}
                      <td style={{ padding: "16px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: 800,
                              color: "#FFFFFF",
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                              boxShadow: "0 2px 8px rgba(56, 189, 248, 0.25)",
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#FFFFFF" }}>
                              {guest.fullName}
                            </div>
                            <div style={{ fontSize: "11.5px", color: "#38BDF8", fontWeight: 600 }}>
                              @{guest.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: "16px 18px", fontSize: "13px", color: "rgba(255, 255, 255, 0.75)" }}>
                        {guest.email}
                      </td>

                      {/* Role */}
                      <td style={{ padding: "16px 18px" }}>
                        <span
                          style={{
                            fontSize: "11.5px",
                            fontWeight: 700,
                            padding: "3px 9px",
                            borderRadius: "6px",
                            background: "rgba(56, 189, 248, 0.12)",
                            color: "#38BDF8",
                            border: "1px solid rgba(56, 189, 248, 0.3)",
                            display: "inline-block",
                          }}
                        >
                          guest
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td style={{ padding: "16px 18px" }}>
                        <div style={{ position: "relative", display: "inline-block" }}>
                          <select
                            value={guest.status}
                            disabled={isUpdating}
                            onChange={(e) =>
                              handleStatusChange(
                                guest,
                                e.target.value as any
                              )
                            }
                            style={{
                              appearance: "none",
                              WebkitAppearance: "none",
                              padding: "5px 26px 5px 10px",
                              borderRadius: "8px",
                              fontSize: "12px",
                              fontWeight: 800,
                              cursor: "pointer",
                              outline: "none",
                              border:
                                guest.status === "approved"
                                  ? "1px solid rgba(39, 201, 63, 0.4)"
                                  : guest.status === "suspended"
                                  ? "1px solid rgba(255, 59, 48, 0.4)"
                                  : "1px solid rgba(255, 149, 0, 0.4)",
                              background:
                                guest.status === "approved"
                                  ? "rgba(39, 201, 63, 0.15)"
                                  : guest.status === "suspended"
                                  ? "rgba(255, 59, 48, 0.15)"
                                  : "rgba(255, 149, 0, 0.15)",
                              color:
                                guest.status === "approved"
                                  ? "#27C93F"
                                  : guest.status === "suspended"
                                  ? "#FF453A"
                                  : "#FF9F0A",
                            }}
                          >
                            <option value="approved" style={{ background: "#18181B", color: "#27C93F" }}>
                              Approved
                            </option>
                            <option value="pending" style={{ background: "#18181B", color: "#FF9F0A" }}>
                              Pending
                            </option>
                            <option value="suspended" style={{ background: "#18181B", color: "#FF453A" }}>
                              Suspended
                            </option>
                          </select>
                          <IconChevronDown
                            size={12}
                            style={{
                              position: "absolute",
                              right: "8px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              pointerEvents: "none",
                              color:
                                guest.status === "approved"
                                  ? "#27C93F"
                                  : guest.status === "suspended"
                                  ? "#FF453A"
                                  : "#FF9F0A",
                            }}
                          />
                        </div>
                      </td>

                      {/* Registered */}
                      <td style={{ padding: "16px 18px", fontSize: "12.5px", color: "rgba(255, 255, 255, 0.6)" }}>
                        {guest.registeredDate}
                      </td>

                      {/* Actions: View Details Button */}
                      <td style={{ padding: "16px 18px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(guest)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            color: "#FFFFFF",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          className="hover:bg-white/10"
                        >
                          <IconEye size={13} color="#FFFFFF" />
                          <span>View details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. "GUEST DETAILS & EDIT" MODAL ─────────────────────────────────── */}
      {mounted && isDetailModalOpen && selectedGuest && createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.82)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 99999,
          }}
          onClick={() => setIsDetailModalOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#111113",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "20px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
              padding: "26px",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "18px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                marginBottom: "20px",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 800,
                    color: "#38BDF8",
                    background: "rgba(56, 189, 248, 0.15)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    textTransform: "uppercase",
                  }}
                >
                  Guest Explorer Profile
                </span>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#FFFFFF", margin: "6px 0 0" }}>
                  {selectedGuest.fullName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#FFFFFF",
                }}
              >
                <IconX size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveGuestDetails} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    style={{
                      width: "100%",
                      marginTop: "6px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      color: "#FFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    style={{
                      width: "100%",
                      marginTop: "6px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      color: "#FFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    style={{
                      width: "100%",
                      marginTop: "6px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      color: "#38BDF8",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
                    Account Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    style={{
                      width: "100%",
                      marginTop: "6px",
                      background: "#18181B",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      color: "#FFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    style={{
                      width: "100%",
                      marginTop: "6px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      color: "#FFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    style={{
                      width: "100%",
                      marginTop: "6px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      color: "#FFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    style={{
                      width: "100%",
                      marginTop: "6px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      color: "#FFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
                    Access Tier
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedGuest.packageSelected || "Explorer (Free Trial)"}
                    style={{
                      width: "100%",
                      marginTop: "6px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      color: "#38BDF8",
                      fontSize: "13px",
                      fontWeight: 700,
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
                  Bio / Notes
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: "6px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "10px",
                    padding: "8px 12px",
                    color: "#FFF",
                    fontSize: "13px",
                    outline: "none",
                    resize: "none",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "12px",
                  paddingTop: "16px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "10px",
                    padding: "9px 16px",
                    color: "#FFF",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDetails}
                  style={{
                    background: "linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)",
                    border: "none",
                    borderRadius: "10px",
                    padding: "9px 20px",
                    color: "#FFF",
                    fontSize: "13px",
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(56, 189, 248, 0.3)",
                  }}
                >
                  {isSavingDetails ? "Saving..." : "Save Guest Details"}
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
