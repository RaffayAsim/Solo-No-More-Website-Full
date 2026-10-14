"use client";

import React, { useState, useTransition, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  IconEye,
  IconTrash,
  IconSearch,
  IconRefresh,
  IconArrowLeft,
  IconX,
  IconCheck,
  IconChevronDown,
  IconExternalLink,
  IconUsers,
  IconCreditCard,
} from "@/components/icons/AppIcons";
import {
  MemberBookingRecord,
  updateBookingStatusAction,
  deleteBookingAction,
  getAllAdminBookingsAction,
} from "@/app/actions/admin-bookings";

interface AdminBookingsClientProps {
  initialBookings: MemberBookingRecord[];
}

export default function AdminBookingsClient({ initialBookings }: AdminBookingsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<MemberBookingRecord[]>(initialBookings);
  const [activeTab, setActiveTab] = useState<"all" | "couple" | "single" | "confirmed" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<MemberBookingRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [modalStatusChoice, setModalStatusChoice] = useState<"Confirm" | "Pending" | "Cancelled" | "Attended">("Confirm");
  const [isPending, startTransition] = useTransition();
  const [screenshotModalUrl, setScreenshotModalUrl] = useState<string | null>(null);

  // Redirect ?filter=guest to dedicated /admin/guest-bookings route
  useEffect(() => {
    const filter = searchParams?.get("filter");
    if (filter === "guest") {
      router.replace("/admin/guest-bookings");
    }
  }, [searchParams, router]);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Status inline change from table dropdown
  const handleInlineStatusChange = async (
    bookingId: string,
    newStatus: "Confirm" | "Pending" | "Cancelled" | "Attended"
  ) => {
    setStatusUpdatingId(bookingId);
    // Optimistic UI update
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus, user_status: newStatus } : b))
    );

    try {
      const res = await updateBookingStatusAction(bookingId, newStatus);
      if (res.success) {
        showToast("success", `Booking #${bookingId} status updated to ${newStatus}`);
      } else {
        showToast("error", res.error || "Failed to update booking status");
        // Revert
        const refreshed = await getAllAdminBookingsAction();
        setBookings(refreshed);
      }
    } catch {
      showToast("error", "Network error updating status");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Delete booking handler
  const handleDeleteBooking = async (bookingId: string) => {
    if (!window.confirm(`Are you sure you want to delete Booking #${bookingId}? This cannot be undone.`)) {
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
        showToast("success", `Booking #${bookingId} deleted successfully.`);
      } else {
        showToast("error", res.error || "Failed to delete booking.");
      }
    } catch {
      showToast("error", "Network error deleting booking.");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const refreshed = await getAllAdminBookingsAction();
        setBookings(refreshed);
        if (selectedBooking) {
          const updated = refreshed.find((b) => b.id === selectedBooking.id);
          if (updated) setSelectedBooking(updated);
        }
        showToast("success", "Bookings refreshed from live ledger.");
      } catch {
        showToast("error", "Failed to refresh bookings.");
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

  const isGuestBooking = (b: MemberBookingRecord) =>
    !!b.is_guest || b.tier?.toLowerCase().includes("guest") || !!b.is_open_event;

  // Tab counts for Member Bookings
  const coupleCount = useMemo(() => bookings.filter((b) => b.booking_type === "Couple").length, [bookings]);
  const singleCount = useMemo(() => bookings.filter((b) => b.booking_type === "Single").length, [bookings]);
  const confirmedCount = useMemo(() => bookings.filter((b) => b.status === "Confirm").length, [bookings]);
  const pendingCount = useMemo(() => bookings.filter((b) => b.status === "Pending").length, [bookings]);

  // Filter & Search
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Tab filter
      if (activeTab === "couple" && b.booking_type !== "Couple") return false;
      if (activeTab === "single" && b.booking_type !== "Single") return false;
      if (activeTab === "confirmed" && b.status !== "Confirm") return false;
      if (activeTab === "pending" && b.status !== "Pending") return false;

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = b.name.toLowerCase().includes(q);
        const matchesEmail = b.email.toLowerCase().includes(q);
        const matchesEvent = b.event_name.toLowerCase().includes(q);
        const matchesId = b.id.toLowerCase().includes(q) || `#${b.id}`.includes(q);
        const matchesQr = b.qr_id.toLowerCase().includes(q);
        const matchesPhone = b.phone.toLowerCase().includes(q);
        const matchesAttendee = b.additional_attendee?.name.toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesEvent || matchesId || matchesQr || matchesPhone || matchesAttendee;
      }
      return true;
    });
  }, [bookings, activeTab, searchQuery]);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1600px",
        margin: "0 auto",
        padding: "24px clamp(16px, 3vw, 40px) 80px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
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
            animation: "fadeIn 0.2s ease-out",
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#FF6F26",
                boxShadow: "0 0 10px #FF6F26",
              }}
            />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#FF6F26",
              }}
            >
              Event Ticketing &amp; Reservations
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(22px, 2.5vw, 30px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#FFF",
              margin: 0,
            }}
          >
            Member Bookings
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255, 255, 255, 0.55)" }}>
            Review attendee member passes, couple pairings, door entry check-ins, and booking status across all events.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isPending}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "10px 16px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#FFF",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <IconRefresh size={14} color="#FFFFFF" className={isPending ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Filter Tabs & Search Controls ─────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "16px",
          padding: "10px 14px",
        }}
      >
        {/* Left: Tab Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}>
          {[
            { id: "all", label: "All Member Bookings", count: bookings.length },
            { id: "couple", label: "Couple Passes", count: coupleCount },
            { id: "single", label: "Single Passes", count: singleCount },
            { id: "confirmed", label: "Confirmed", count: confirmedCount },
            { id: "pending", label: "Pending", count: pendingCount },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "7px 14px",
                  borderRadius: "10px",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: isActive ? "1px solid #FF6F26" : "1px solid transparent",
                  background: isActive ? "rgba(255, 111, 38, 0.15)" : "transparent",
                  color: isActive ? "#FF884D" : "rgba(255, 255, 255, 0.6)",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: "11px",
                    padding: "1px 6px",
                    borderRadius: "20px",
                    background: isActive ? "#FF6F26" : "rgba(255, 255, 255, 0.08)",
                    color: isActive ? "#FFF" : "rgba(255, 255, 255, 0.5)",
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Search Input */}
        <div
          style={{
            position: "relative",
            minWidth: "260px",
            flexGrow: 1,
            maxWidth: "400px",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          >
            <IconSearch size={14} color="rgba(255, 255, 255, 0.4)" />
          </div>
          <input
            type="text"
            placeholder="Search attendee, email, event, QR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 34px",
              borderRadius: "10px",
              background: "rgba(0, 0, 0, 0.35)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#FFF",
              fontSize: "13px",
              outline: "none",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "rgba(255, 255, 255, 0.4)",
                cursor: "pointer",
                padding: "2px",
              }}
            >
              <IconX size={12} color="rgba(255, 255, 255, 0.5)" />
            </button>
          )}
        </div>
      </div>

      {/* ── Main Bookings Table Matching Image 1 ─────────────────────────── */}
      <div
        style={{
          width: "100%",
          background: "#0E0C12",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 12px 35px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div style={{ width: "100%", overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: "1000px",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
                }}
              >
                <th
                  style={{
                    padding: "16px 20px",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(255, 255, 255, 0.45)",
                    width: "70px",
                  }}
                >
                  ID
                </th>
                <th
                  style={{
                    padding: "16px 20px",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(255, 255, 255, 0.45)",
                  }}
                >
                  NAME
                </th>
                <th
                  style={{
                    padding: "16px 20px",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(255, 255, 255, 0.45)",
                  }}
                >
                  EMAIL
                </th>
                <th
                  style={{
                    padding: "16px 20px",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(255, 255, 255, 0.45)",
                    width: "140px",
                  }}
                >
                  STATUS
                </th>
                <th
                  style={{
                    padding: "16px 20px",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(255, 255, 255, 0.45)",
                    width: "140px",
                  }}
                >
                  BOOKING TYPE
                </th>
                <th
                  style={{
                    padding: "16px 20px",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(255, 255, 255, 0.45)",
                  }}
                >
                  EVENT
                </th>
                <th
                  style={{
                    padding: "16px 20px",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(255, 255, 255, 0.45)",
                    width: "190px",
                  }}
                >
                  CREATED
                </th>
                <th
                  style={{
                    padding: "16px 20px",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(255, 255, 255, 0.45)",
                    textAlign: "right",
                    width: "110px",
                  }}
                >
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: "60px 20px",
                      textAlign: "center",
                      color: "rgba(255, 255, 255, 0.4)",
                      fontSize: "14px",
                    }}
                  >
                    <p style={{ margin: 0 }}>No bookings found matching your filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => {
                  const isCouple = booking.booking_type === "Couple";
                  const isGuest = isGuestBooking(booking);

                  return (
                    <tr
                      key={booking.id}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        transition: "background 0.15s ease",
                      }}
                      className="hover:bg-white/[0.02]"
                    >
                      {/* 1. ID: Circular Badge with Magenta/Pink outline */}
                      <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: isGuest ? "rgba(56, 189, 248, 0.14)" : "rgba(224, 40, 136, 0.12)",
                            border: isGuest ? "1px solid rgba(56, 189, 248, 0.5)" : "1px solid rgba(224, 40, 136, 0.45)",
                            color: isGuest ? "#38BDF8" : "#E02888",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12.5px",
                            fontWeight: 800,
                          }}
                        >
                          {booking.id}
                        </div>
                      </td>

                      {/* 2. NAME: Full name on top, phone on bottom */}
                      <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "#FFFFFF",
                              }}
                            >
                              {booking.name}
                            </span>
                            {isGuest && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 800,
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  background: "rgba(56, 189, 248, 0.15)",
                                  color: "#38BDF8",
                                  border: "1px solid rgba(56, 189, 248, 0.35)",
                                }}
                              >
                                Explorer
                              </span>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: "12px",
                              color: "rgba(255, 255, 255, 0.45)",
                            }}
                          >
                            {booking.phone}
                          </span>
                        </div>
                      </td>

                      {/* 3. EMAIL */}
                      <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                        <span
                          style={{
                            fontSize: "13px",
                            color: "rgba(255, 255, 255, 0.75)",
                          }}
                        >
                          {booking.email}
                        </span>
                      </td>

                      {/* 4. STATUS: Inline Dropdown Select */}
                      <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                        <div style={{ position: "relative", width: "116px" }}>
                          <select
                            value={booking.status}
                            disabled={statusUpdatingId === booking.id}
                            onChange={(e) =>
                              handleInlineStatusChange(
                                booking.id,
                                e.target.value as "Confirm" | "Pending" | "Cancelled" | "Attended"
                              )
                            }
                            style={{
                              width: "100%",
                              padding: "7px 24px 7px 12px",
                              borderRadius: "8px",
                              background: "#141218",
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                              color:
                                booking.status === "Confirm"
                                  ? "#FFFFFF"
                                  : booking.status === "Pending"
                                  ? "#F59E0B"
                                  : booking.status === "Attended"
                                  ? "#10B981"
                                  : "#EF4444",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                              outline: "none",
                              appearance: "none",
                              WebkitAppearance: "none",
                            }}
                          >
                            <option value="Confirm">Confirm</option>
                            <option value="Pending">Pending</option>
                            <option value="Attended">Attended</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                          <div
                            style={{
                              position: "absolute",
                              right: "8px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              pointerEvents: "none",
                            }}
                          >
                            <IconChevronDown size={11} color="rgba(255, 255, 255, 0.4)" />
                          </div>
                        </div>
                      </td>

                      {/* 5. BOOKING TYPE: Couple Pass / Single Pass / Guest Pass Pill */}
                      <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "5px 12px",
                            borderRadius: "20px",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            letterSpacing: "0.02em",
                            background: isCouple
                              ? "rgba(147, 51, 234, 0.16)"
                              : isGuest
                              ? "rgba(56, 189, 248, 0.14)"
                              : "rgba(14, 165, 233, 0.14)",
                            border: isCouple
                              ? "1px solid rgba(147, 51, 234, 0.45)"
                              : isGuest
                              ? "1px solid rgba(56, 189, 248, 0.4)"
                              : "1px solid rgba(14, 165, 233, 0.4)",
                            color: isCouple ? "#D8B4FE" : isGuest ? "#38BDF8" : "#38BDF8",
                          }}
                        >
                          {booking.tier || (isCouple ? "Couple Pass" : isGuest ? "Guest Pass" : "Single Pass")}
                        </span>
                      </td>

                      {/* 6. EVENT: Title on top, date on bottom */}
                      <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <span
                              style={{
                                fontSize: "13.5px",
                                fontWeight: 700,
                                color: "#FFFFFF",
                              }}
                            >
                              {booking.event_name}
                            </span>
                            {booking.is_open_event && (
                              <span
                                style={{
                                  fontSize: "9.5px",
                                  fontWeight: 800,
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  background: "rgba(39, 201, 63, 0.15)",
                                  color: "#27C93F",
                                  border: "1px solid rgba(39, 201, 63, 0.35)",
                                }}
                              >
                                Open Event
                              </span>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: "12px",
                              color: "rgba(255, 255, 255, 0.45)",
                            }}
                          >
                            {booking.event_date}
                          </span>
                        </div>
                      </td>

                      {/* 7. CREATED */}
                      <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                        <span
                          style={{
                            fontSize: "12.5px",
                            color: "rgba(255, 255, 255, 0.7)",
                          }}
                        >
                          {booking.created_at}
                        </span>
                      </td>

                      {/* 8. ACTIONS: View details eye icon & Delete trash icon (Rock-solid SVGs) */}
                      <td
                        style={{
                          padding: "18px 20px",
                          verticalAlign: "middle",
                          textAlign: "right",
                        }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            justifyContent: "flex-end",
                          }}
                        >
                          {/* Eye button */}
                          <button
                            type="button"
                            onClick={() => openDetailsModal(booking)}
                            title="View details"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background: "rgba(255, 255, 255, 0.05)",
                              border: "1px solid rgba(255, 255, 255, 0.12)",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            className="hover:bg-white/10"
                          >
                            <IconEye size={16} color="rgba(255, 255, 255, 0.9)" />
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            disabled={deleteConfirmId === booking.id}
                            onClick={() => handleDeleteBooking(booking.id)}
                            title="Delete booking"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background: "rgba(239, 68, 68, 0.08)",
                              border: "1px solid rgba(239, 68, 68, 0.25)",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            className="hover:bg-red-500/20"
                          >
                            <IconTrash size={16} color="#F87171" />
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

      {/* ── Booking Details Modal (Image 2 & 3 Matching) ────────────────── */}
      {isModalOpen && selectedBooking && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(0, 0, 0, 0.82)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px clamp(12px, 3vw, 40px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "880px",
              maxHeight: "92vh",
              overflowY: "auto",
              background: "#121016",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "24px",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
              padding: "clamp(20px, 3vw, 32px)",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              color: "#FFF",
              position: "relative",
            }}
          >
            {/* Header: Title + Subtitle on Left, Back & Refresh Buttons on Right */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "14px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                paddingBottom: "16px",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    margin: 0,
                    color: "#FFFFFF",
                  }}
                >
                  Booking Details
                </h2>
                <span
                  style={{
                    fontSize: "12px",
                    color: "rgba(255, 255, 255, 0.45)",
                    display: "block",
                    marginTop: "2px",
                  }}
                >
                  Admin workspace
                </span>
              </div>

              {/* Right: Back & Refresh Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#FFFFFF",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <IconArrowLeft size={14} color="#FFFFFF" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleRefresh}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#FFFFFF",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <IconRefresh size={13} color="#FFFFFF" className={isPending ? "animate-spin" : ""} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Sub-header: Booking Overview + status badge & Event badge */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    margin: 0,
                    color: "#FFFFFF",
                  }}
                >
                  Booking Overview
                </h3>
                <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.45)" }}>
                  Detailed information for attendee request.
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {/* confirmed badge */}
                <span
                  style={{
                    padding: "5px 12px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.03em",
                    textTransform: "lowercase",
                    background:
                      selectedBooking.status === "Confirm"
                        ? "rgba(16, 185, 129, 0.16)"
                        : "rgba(245, 158, 11, 0.16)",
                    border:
                      selectedBooking.status === "Confirm"
                        ? "1px solid rgba(16, 185, 129, 0.45)"
                        : "1px solid rgba(245, 158, 11, 0.45)",
                    color: selectedBooking.status === "Confirm" ? "#34D399" : "#FBBF24",
                  }}
                >
                  {selectedBooking.status.toLowerCase()}
                </span>

                {/* Event tag */}
                <span
                  style={{
                    padding: "5px 12px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: 800,
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "rgba(255, 255, 255, 0.7)",
                  }}
                >
                  Event #{selectedBooking.event_id}
                </span>
              </div>
            </div>

            {/* ── 2-Column Grid of Detail Cards Matching Screenshots ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "12px",
              }}
            >
              {/* Card 1: BOOKING ID */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.025)",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.4)" }}>
                  BOOKING ID
                </span>
                <span style={{ fontSize: "16px", fontWeight: 800, color: "#FFFFFF" }}>
                  #{selectedBooking.id}
                </span>
              </div>

              {/* Card 2: QR ID */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.025)",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.4)" }}>
                  QR ID
                </span>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "#FFFFFF" }}>
                  {selectedBooking.qr_id}
                </span>
              </div>

              {/* Card 3: EVENT NAME */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.025)",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.4)" }}>
                  EVENT NAME
                </span>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "#FFFFFF" }}>
                  {selectedBooking.event_name}
                </span>
              </div>

              {/* Card 4: BOOKING TYPE */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.025)",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.4)" }}>
                  BOOKING TYPE
                </span>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "#FFFFFF" }}>
                  {selectedBooking.booking_type}
                </span>
              </div>

              {/* Card 5: TIER */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.025)",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.4)" }}>
                  TIER
                </span>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "#FFFFFF" }}>
                  {selectedBooking.tier}
                </span>
              </div>

              {/* Card 6: NAME */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.025)",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.4)" }}>
                  NAME
                </span>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "#FFFFFF" }}>
                  {selectedBooking.name}
                </span>
              </div>

              {/* Card 7: EMAIL */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.025)",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.4)" }}>
                  EMAIL
                </span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF", wordBreak: "break-all" }}>
                  {selectedBooking.email}
                </span>
              </div>

              {/* Card 8: PHONE */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.025)",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.4)" }}>
                  PHONE
                </span>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "#FFFFFF" }}>
                  {selectedBooking.phone}
                </span>
              </div>

              {/* Card 9 (Optional if couple): PARTNER PAYMENT */}
              {selectedBooking.booking_type === "Couple" && (
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.025)",
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    borderRadius: "14px",
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.4)" }}>
                    PARTNER PAYMENT
                  </span>
                  <span style={{ fontSize: "15px", fontWeight: 800, color: "#FFFFFF" }}>
                    {selectedBooking.partner_payment || "Invitee needs to pay"}
                  </span>
                </div>
              )}

              {/* Card 10: STATUS */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.025)",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.4)" }}>
                  STATUS
                </span>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "#FFFFFF" }}>
                  {selectedBooking.status.toLowerCase()}
                </span>
              </div>

              {/* Card 11: USER STATUS */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.025)",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.4)" }}>
                  USER STATUS
                </span>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "#FFFFFF" }}>
                  {selectedBooking.user_status}
                </span>
              </div>

              {/* Card 12: INVITE PROGRESS */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.025)",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.4)" }}>
                  INVITE PROGRESS
                </span>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "#FFFFFF" }}>
                  {selectedBooking.invite_progress || "N/A"}
                </span>
              </div>

              {/* Card 13: CNIC */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.025)",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.4)" }}>
                  CNIC
                </span>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "#FFFFFF" }}>
                  {selectedBooking.cnic}
                </span>
              </div>

              {/* Card 14: CAR NUMBER */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.025)",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.4)" }}>
                  CAR NUMBER
                </span>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "#FFFFFF" }}>
                  {selectedBooking.car_number || "N/A"}
                </span>
              </div>

              {/* Card 15: PRICE */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.025)",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.4)" }}>
                  PRICE
                </span>
                <span style={{ fontSize: "16px", fontWeight: 800, color: "#FFFFFF" }}>
                  PKR {selectedBooking.price?.toLocaleString() || selectedBooking.price}
                </span>
              </div>

              {/* Card 16: VENUE (Full width on span) */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.025)",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  gridColumn: "1 / -1",
                }}
              >
                <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.4)" }}>
                  VENUE
                </span>
                <span style={{ fontSize: "14.5px", fontWeight: 700, color: "#FFFFFF" }}>
                  {selectedBooking.venue}
                </span>
              </div>

              {/* Card 17: PAYMENT SCREENSHOT */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.025)",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.4)" }}>
                  PAYMENT SCREENSHOT
                </span>
                {selectedBooking.payment_screenshot_url ? (
                  <button
                    type="button"
                    onClick={() => setScreenshotModalUrl(selectedBooking.payment_screenshot_url || null)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: "#FF884D",
                      fontSize: "14px",
                      fontWeight: 700,
                      textAlign: "left",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span>View Screenshot</span>
                    <IconExternalLink size={13} color="#FF884D" />
                  </button>
                ) : (
                  <span style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.5)" }}>No screenshot attached</span>
                )}
              </div>

              {/* Card 18: CREATED */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.025)",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.4)" }}>
                  CREATED
                </span>
                <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#FFFFFF" }}>
                  {selectedBooking.created_at}
                </span>
              </div>
            </div>

            {/* ── Additional Attendee Section (For Couple Bookings - Matching Image 2) ── */}
            {selectedBooking.booking_type === "Couple" && selectedBooking.additional_attendee && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  paddingTop: "8px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <IconUsers size={16} color="#D8B4FE" />
                  <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#FFFFFF" }}>
                    Additional Attendee
                  </h4>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {/* Attendee Name */}
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.025)",
                      border: "1px solid rgba(255, 255, 255, 0.07)",
                      borderRadius: "14px",
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.4)" }}>
                      NAME
                    </span>
                    <span style={{ fontSize: "15px", fontWeight: 800, color: "#FFFFFF" }}>
                      {selectedBooking.additional_attendee.name}
                    </span>
                  </div>

                  {/* Attendee Email */}
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.025)",
                      border: "1px solid rgba(255, 255, 255, 0.07)",
                      borderRadius: "14px",
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.4)" }}>
                      EMAIL
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF", wordBreak: "break-all" }}>
                      {selectedBooking.additional_attendee.email}
                    </span>
                  </div>

                  {/* Attendee Status */}
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.025)",
                      border: "1px solid rgba(255, 255, 255, 0.07)",
                      borderRadius: "14px",
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.4)" }}>
                      STATUS
                    </span>
                    <span style={{ fontSize: "15px", fontWeight: 800, color: "#FFFFFF" }}>
                      {selectedBooking.additional_attendee.status}
                    </span>
                  </div>

                  {/* Attendee Gender */}
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.025)",
                      border: "1px solid rgba(255, 255, 255, 0.07)",
                      borderRadius: "14px",
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.4)" }}>
                      GENDER
                    </span>
                    <span style={{ fontSize: "15px", fontWeight: 800, color: "#FFFFFF", textTransform: "capitalize" }}>
                      {selectedBooking.additional_attendee.gender}
                    </span>
                  </div>

                  {/* Attendee Entry */}
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.025)",
                      border: "1px solid rgba(255, 255, 255, 0.07)",
                      borderRadius: "14px",
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.4)" }}>
                      ENTRY
                    </span>
                    <span style={{ fontSize: "15px", fontWeight: 800, color: "#FFFFFF" }}>
                      {selectedBooking.additional_attendee.entry}
                    </span>
                  </div>

                  {/* Attendee Pair Code */}
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.025)",
                      border: "1px solid rgba(255, 255, 255, 0.07)",
                      borderRadius: "14px",
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.4)" }}>
                      PAIR CODE
                    </span>
                    <span style={{ fontSize: "16px", fontWeight: 800, color: "#D8B4FE", letterSpacing: "0.08em" }}>
                      {selectedBooking.additional_attendee.pair_code}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Modal Footer: Update Status Dropdown & Action ── */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "14px",
                paddingTop: "18px",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                marginTop: "6px",
              }}
            >
              {/* Left: Update Status selector */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255, 255, 255, 0.6)" }}>
                  Update Status:
                </span>
                <div style={{ position: "relative", width: "130px" }}>
                  <select
                    value={modalStatusChoice}
                    onChange={(e) =>
                      setModalStatusChoice(e.target.value as "Confirm" | "Pending" | "Cancelled" | "Attended")
                    }
                    style={{
                      width: "100%",
                      padding: "8px 26px 8px 12px",
                      borderRadius: "10px",
                      background: "#181520",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      outline: "none",
                      appearance: "none",
                    }}
                  >
                    <option value="Confirm">Confirm</option>
                    <option value="Pending">Pending</option>
                    <option value="Attended">Attended</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <div
                    style={{
                      position: "absolute",
                      right: "9px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  >
                    <IconChevronDown size={12} color="rgba(255, 255, 255, 0.4)" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleModalSaveStatus}
                  disabled={statusUpdatingId === selectedBooking.id}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)",
                    border: "none",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(255, 90, 31, 0.3)",
                  }}
                >
                  Save Status
                </button>
              </div>

              {/* Right: Close button */}
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: "9px 22px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Optional Screenshot Lightbox Modal ── */}
      {screenshotModalUrl && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setScreenshotModalUrl(null)}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "600px",
              width: "100%",
              background: "#181520",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              padding: "16px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#FFF" }}>Payment Proof Screenshot</span>
              <button
                type="button"
                onClick={() => setScreenshotModalUrl(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#FFF",
                  cursor: "pointer",
                }}
              >
                <IconX size={18} color="#FFFFFF" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={screenshotModalUrl}
              alt="Payment Screenshot"
              style={{
                width: "100%",
                maxHeight: "70vh",
                objectFit: "contain",
                borderRadius: "8px",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
