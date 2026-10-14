"use client";

import { useEffect } from "react";
import { X, QrCode, Calendar, MapPin, Ticket, ShieldCheck } from "lucide-react";

interface VipTicketPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: {
    id: string;
    title: string;
    scheduled_at: string;
    venue_name: string | null;
    status: string;
    memberName: string;
    ticketType?: string;
  } | null;
}

export default function VipTicketPassModal({
  isOpen,
  onClose,
  ticket,
}: VipTicketPassModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen || !ticket) return null;

  const dateStr = ticket.scheduled_at
    ? new Date(ticket.scheduled_at).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Time TBD";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(16px)",
        padding: "40px 16px",
        overflowY: "auto",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "linear-gradient(155deg, #130B1C 0%, #08040C 100%)",
          border: "1.5px solid rgba(255, 90, 31, 0.4)",
          borderRadius: "26px",
          boxShadow: "0 28px 70px rgba(0, 0, 0, 0.9), 0 0 40px rgba(255, 90, 31, 0.25)",
          color: "#FFFFFF",
          padding: "26px",
          position: "relative",
          overflow: "hidden",
          fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: "absolute",
            top: "18px",
            right: "18px",
            background: "rgba(255, 255, 255, 0.15)",
            border: "1.5px solid rgba(255, 255, 255, 0.35)",
            borderRadius: "12px",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            cursor: "pointer",
            zIndex: 10,
          }}
          className="hover:bg-white/30 hover:border-white transition-all"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ display: "block" }}
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Ticket Header */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "8px",
              background: "rgba(39, 201, 63, 0.15)",
              border: "1px solid rgba(39, 201, 63, 0.35)",
              color: "#27C93F",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>CONFIRMED VIP ACCESS PASS</span>
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: "22px",
              fontWeight: 900,
              margin: "0 0 6px",
              letterSpacing: "-0.02em",
            }}
          >
            {ticket.title}
          </h2>
          <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", margin: 0 }}>
            Issued to {ticket.memberName}
          </p>
        </div>

        {/* Perforated Divider */}
        <div
          style={{
            height: "1px",
            borderTop: "2px dashed rgba(255, 255, 255, 0.2)",
            margin: "18px -26px",
            position: "relative",
          }}
        />

        {/* Ticket Details Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "14px",
              padding: "10px 12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#FF8A3D", fontSize: "11px", fontWeight: 800 }}>
              <Calendar className="w-3 h-3" />
              <span>DATE &amp; TIME</span>
            </div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", marginTop: "4px" }}>
              {dateStr}
            </div>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "14px",
              padding: "10px 12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#FF8A3D", fontSize: "11px", fontWeight: 800 }}>
              <MapPin className="w-3 h-3" />
              <span>VENUE</span>
            </div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {ticket.venue_name || "Secret VIP Venue"}
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "18px",
            padding: "20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "120px",
              height: "120px",
              background: "#FFFFFF",
              borderRadius: "12px",
              padding: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)",
            }}
          >
            <QrCode className="w-full h-full text-black" />
          </div>
          <div style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(255, 255, 255, 0.7)", letterSpacing: "0.1em" }}>
            TICKET #{ticket.id.slice(0, 8).toUpperCase()}
          </div>
          <div style={{ fontSize: "10.5px", color: "rgba(255, 255, 255, 0.5)" }}>
            Present this QR code at door reception for instant guest check-in
          </div>
        </div>
      </div>
    </div>
  );
}
