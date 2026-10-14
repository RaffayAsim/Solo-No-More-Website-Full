"use client";

import React, { useState, useTransition, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  IconEye,
  IconTrash,
  IconSearch,
  IconRefresh,
  IconArrowLeft,
  IconX,
  IconCheck,
  IconChevronDown,
} from "@/components/icons/AppIcons";
import {
  MemberBookingRecord,
  updateBookingStatusAction,
  deleteBookingAction,
  getAllAdminBookingsAction,
} from "@/app/actions/admin-bookings";

interface GuestBookingsClientProps {
  initialBookings: MemberBookingRecord[];
}

export default function GuestBookingsClient({ initialBookings }: GuestBookingsClientProps) {
  const [bookings, setBookings] = useState<MemberBookingRecord[]>(initialBookings);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<MemberBookingRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [modalStatusChoice, setModalStatusChoice] = useState<"Confirm" | "Pending" | "Cancelled" | "Attended">("Confirm");
  const [isPending, startTransition] = useTransition();

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Inline status update
  const handleInlineStatusChange = async (
    bookingId: string,
    newStatus: "Confirm" | "Pending" | "Cancelled" | "Attended"
  ) => {
    setStatusUpdatingId(bookingId);
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus, user_status: newStatus } : b))
    );

    try {
      const res = await updateBookingStatusAction(bookingId, newStatus);
      if (res.success) {
        showToast("success", `Guest Booking #${bookingId} status updated to ${newStatus}`);
      } else {
        showToast("error", res.error || "Failed to update booking status");
        const refreshed = await getAllAdminBookingsAction();
        const guests = refreshed.filter((b) => !!b.is_guest || b.tier?.toLowerCase().includes("guest") || !!b.is_open_event);
        setBookings(guests);
      }
    } catch {
      showToast("error", "Network error updating booking status");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Delete booking handler
  const handleDeleteBooking = async (bookingId: string) => {
    if (!window.confirm(`Are you sure you want to delete Guest Booking #${bookingId}? This cannot be undone.`)) {
      return;
    }
    setDeleteConfirmId(bookingId);
    try {
      const res = await deleteBookingAction(bookingId);
      if (res.success) {
        setBookings((prev) => prev.filter((b) => b.id !== bookingId));
        if (selectedBooking?.id === bookingId) {
          setIsModalOpen(false);
          setSelectedBooking(null);
        }
        showToast("success", `Guest Booking #${bookingId} deleted successfully.`);
      } else {
        showToast("error", res.error || "Failed to delete booking.");
      }
    } catch {
      showToast("error", "Network error deleting booking.");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Refresh
  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const refreshed = await getAllAdminBookingsAction();
        const guests = refreshed.filter((b) => !!b.is_guest || b.tier?.toLowerCase().includes("guest") || !!b.is_open_event);
        setBookings(guests);
        if (selectedBooking) {
          const updated = guests.find((b) => b.id === selectedBooking.id);
          if (updated) setSelectedBooking(updated);
        }
        showToast("success", "Guest bookings refreshed from live ledger.");
      } catch {
        showToast("error", "Failed to refresh guest bookings.");
      }
    });
  };

  // Open Details Modal
  const openDetailsModal = (booking: MemberBookingRecord) => {
    setSelectedBooking(booking);
    setModalStatusChoice(booking.status);
    setIsModalOpen(true);
  };

  // Save status from modal
  const handleModalSaveStatus = async () => {
    if (!selectedBooking) return;
    setStatusUpdatingId(selectedBooking.id);
    try {
      const res = await updateBookingStatusAction(selectedBooking.id, modalStatusChoice);
      if (res.success) {
        setSelectedBooking((prev) => (prev ? { ...prev, status: modalStatusChoice, user_status: modalStatusChoice } : null));
        setBookings((prev) =>
          prev.map((b) => (b.id === selectedBooking.id ? { ...b, status: modalStatusChoice, user_status: modalStatusChoice } : b))
        );
        showToast("success", `Booking #${selectedBooking.id} updated to ${modalStatusChoice}`);
      } else {
        showToast("error", res.error || "Failed to update status");
      }
    } catch {
      showToast("error", "Error saving status");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Filter & Search strictly by query (no member tabs)
  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return bookings;
    const q = searchQuery.toLowerCase().trim();
    return bookings.filter((b) => {
      return (
        b.name.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.event_name.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        `#${b.id}`.includes(q) ||
        b.qr_id.toLowerCase().includes(q) ||
        b.phone.toLowerCase().includes(q)
      );
    });
  }, [bookings, searchQuery]);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1600px",
        margin: "0 auto",
        padding: "24px clamp(16px, 3vw, 40px) 80px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 20px",
            borderRadius: "12px",
            fontSize: "13.5px",
            fontWeight: 700,
            color: "#FFF",
            background: toastMessage.type === "success" ? "#10B981" : "#EF4444",
            boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
          }}
        >
          <IconCheck size={18} color="#FFFFFF" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ── Top Header & Stats Bar ────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1
              style={{
                fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
                fontSize: "24px",
                fontWeight: 900,
                color: "#FFFFFF",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Guest Bookings
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
              OPEN EVENTS PASS LEDGER
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255, 255, 255, 0.55)" }}>
            Attendee bookings for open-access community events created by Admin, Artists, and Partners.
          </p>
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isPending}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 16px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#FFF",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <IconRefresh size={14} color="#FFFFFF" className={isPending ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Search Bar & Counts (No Member Tabs Button Row) ───────────────── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "14px",
          padding: "10px 14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255, 255, 255, 0.85)" }}>
            Total Open-Event Bookings:
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
            {filteredBookings.length} Passes
          </span>
        </div>

        <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
          <div
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
            <IconSearch size={15} color="rgba(255, 255, 255, 0.4)" />
          </div>
          <input
            type="text"
            placeholder="Search attendee, email, QR, booking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "#FFF",
              fontSize: "12.5px",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* ── Table Container ───────────────────────────────────────────────── */}
      <div
        style={{
          width: "100%",
          overflow: "hidden",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.07)",
          background: "rgba(255, 255, 255, 0.015)",
        }}
      >
        <div style={{ width: "100%", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  background: "rgba(255, 255, 255, 0.02)",
                }}
              >
                <th style={{ padding: "14px 18px", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase" }}>
                  Booking ID
                </th>
                <th style={{ padding: "14px 18px", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase" }}>
                  Attendee
                </th>
                <th style={{ padding: "14px 18px", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase" }}>
                  Event Name
                </th>
                <th style={{ padding: "14px 18px", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase" }}>
                  Tier / Access
                </th>
                <th style={{ padding: "14px 18px", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase" }}>
                  Price
                </th>
                <th style={{ padding: "14px 18px", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase" }}>
                  Status
                </th>
                <th style={{ padding: "14px 18px", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase" }}>
                  Registered
                </th>
                <th style={{ padding: "14px 18px", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", textAlign: "right" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "48px 20px", textAlign: "center", color: "rgba(255, 255, 255, 0.4)" }}>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>No guest bookings found.</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const isUpdating = statusUpdatingId === b.id;
                  const isDeleting = deleteConfirmId === b.id;
                  return (
                    <tr
                      key={b.id}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                        transition: "background 0.15s ease",
                      }}
                      className="hover:bg-white/[0.02]"
                    >
                      {/* Booking ID */}
                      <td style={{ padding: "16px 18px" }}>
                        <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#38BDF8" }}>
                          #{b.id}
                        </span>
                      </td>

                      {/* Attendee */}
                      <td style={{ padding: "16px 18px" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#FFF" }}>
                            {b.name}
                          </span>
                          <span style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.55)" }}>
                            {b.email}
                          </span>
                        </div>
                      </td>

                      {/* Event Name */}
                      <td style={{ padding: "16px 18px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#FFF" }}>
                          {b.event_name}
                        </span>
                      </td>

                      {/* Tier */}
                      <td style={{ padding: "16px 18px" }}>
                        <span
                          style={{
                            fontSize: "11.5px",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: "rgba(56, 189, 248, 0.15)",
                            color: "#38BDF8",
                            border: "1px solid rgba(56, 189, 248, 0.3)",
                          }}
                        >
                          Guest Pass (Open)
                        </span>
                      </td>

                      {/* Price */}
                      <td style={{ padding: "16px 18px", fontSize: "13px", fontWeight: 700, color: "#FFF" }}>
                        PKR {b.price.toLocaleString()}
                      </td>

                      {/* Status Dropdown */}
                      <td style={{ padding: "16px 18px" }}>
                        <div style={{ position: "relative", display: "inline-block" }}>
                          <select
                            value={b.status}
                            disabled={isUpdating}
                            onChange={(e) => handleInlineStatusChange(b.id, e.target.value as any)}
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
                                b.status === "Confirm"
                                  ? "1px solid rgba(39, 201, 63, 0.4)"
                                  : "1px solid rgba(255, 149, 0, 0.4)",
                              background:
                                b.status === "Confirm"
                                  ? "rgba(39, 201, 63, 0.15)"
                                  : "rgba(255, 149, 0, 0.15)",
                              color: b.status === "Confirm" ? "#27C93F" : "#FF9F0A",
                            }}
                          >
                            <option value="Confirm" style={{ background: "#18181B", color: "#27C93F" }}>
                              Confirm
                            </option>
                            <option value="Pending" style={{ background: "#18181B", color: "#FF9F0A" }}>
                              Pending
                            </option>
                            <option value="Cancelled" style={{ background: "#18181B", color: "#FF453A" }}>
                              Cancelled
                            </option>
                            <option value="Attended" style={{ background: "#18181B", color: "#38BDF8" }}>
                              Attended
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
                              color: b.status === "Confirm" ? "#27C93F" : "#FF9F0A",
                            }}
                          />
                        </div>
                      </td>

                      {/* Created */}
                      <td style={{ padding: "16px 18px", fontSize: "12px", color: "rgba(255, 255, 255, 0.55)" }}>
                        {b.created_at}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "16px 18px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => openDetailsModal(b)}
                            title="View Booking Details"
                            style={{
                              padding: "6px 10px",
                              borderRadius: "8px",
                              background: "rgba(56, 189, 248, 0.12)",
                              border: "1px solid rgba(56, 189, 248, 0.3)",
                              color: "#38BDF8",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              fontSize: "12px",
                              fontWeight: 700,
                            }}
                          >
                            <IconEye size={13} color="#38BDF8" />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteBooking(b.id)}
                            disabled={isDeleting}
                            title="Delete Booking"
                            style={{
                              padding: "6px 10px",
                              borderRadius: "8px",
                              background: "rgba(239, 68, 68, 0.12)",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              color: "#EF4444",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "12px",
                              fontWeight: 700,
                            }}
                          >
                            <IconTrash size={13} color="#EF4444" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Booking Details Modal ─────────────────────────────────────────── */}
      {isModalOpen && selectedBooking && (
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
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "640px",
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
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "16px",
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
                  Guest Booking Overview
                </span>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#FFFFFF", margin: "6px 0 0" }}>
                  Booking #{selectedBooking.id}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
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

            {/* Content Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                  QR ID
                </div>
                <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#38BDF8", marginTop: "4px" }}>
                  {selectedBooking.qr_id}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                  Event Name
                </div>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#FFF", marginTop: "4px" }}>
                  {selectedBooking.event_name}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                  Attendee Name
                </div>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#FFF", marginTop: "4px" }}>
                  {selectedBooking.name}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                  Email
                </div>
                <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#FFF", marginTop: "4px" }}>
                  {selectedBooking.email}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                  Phone
                </div>
                <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#FFF", marginTop: "4px" }}>
                  {selectedBooking.phone}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                  CNIC
                </div>
                <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#FFF", marginTop: "4px" }}>
                  {selectedBooking.cnic}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                  Venue
                </div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#FFF", marginTop: "4px" }}>
                  {selectedBooking.venue}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                  Price
                </div>
                <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#38BDF8", marginTop: "4px" }}>
                  PKR {selectedBooking.price.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Status Choice */}
            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                Update Booking Status
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <select
                  value={modalStatusChoice}
                  onChange={(e) => setModalStatusChoice(e.target.value as any)}
                  style={{
                    flex: 1,
                    background: "#18181B",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "10px",
                    padding: "9px 14px",
                    color: "#FFF",
                    fontSize: "13px",
                    fontWeight: 700,
                    outline: "none",
                  }}
                >
                  <option value="Confirm">Confirm</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Attended">Attended</option>
                </select>

                <button
                  type="button"
                  onClick={handleModalSaveStatus}
                  style={{
                    background: "linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)",
                    border: "none",
                    borderRadius: "10px",
                    padding: "9px 20px",
                    color: "#FFF",
                    fontSize: "13px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Save Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
