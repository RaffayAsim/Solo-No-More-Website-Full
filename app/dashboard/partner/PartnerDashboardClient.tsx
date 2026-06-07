"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/billing";
import CreateBeaconModal from "../CreateBeaconModal";
import type { Beacon, Profile } from "@/lib/supabase/types";

interface PartnerDashboardClientProps {
  profile: Profile;
  initialOffers: Beacon[];
}

export default function PartnerDashboardClient({
  profile,
  initialOffers,
}: PartnerDashboardClientProps) {
  const router = useRouter();
  const [offers, setOffers] = useState<Beacon[]>(initialOffers);
  const [businessName, setBusinessName] = useState(profile.business_name || "");
  const [city, setCity] = useState(profile.city || "Karachi");
  const [bio, setBio] = useState(profile.bio || "");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalReach = offers.reduce((sum, offer) => sum + (offer.filled_slots || 0), 0);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccess(false);

    if (!businessName.trim()) {
      setErrorMsg("Business name is required.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await updateProfile({
        business_name: businessName,
        city,
        bio,
      });

      if (res.success) {
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 2000);
      } else {
        setErrorMsg(res.error);
      }
    } catch {
      setErrorMsg("Connection failed. Unable to save business details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBeaconCreated = () => {
    router.refresh();
    // Wait slightly and update local state via reload
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div style={{ padding: "16px" }}>
      {/* ── Header Bevel Panel ──────────────────────────────────────────────── */}
      <div className="nokia-panel-sunken" style={{ padding: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="font-pixel text-accent" style={{ fontSize: "14px", margin: 0, letterSpacing: "0.08em" }}>
            ▤ PARTNER COMMAND CENTER
          </h1>
          <p className="font-mono text-muted" style={{ fontSize: "11px", margin: "4px 0 0 0" }}>
            Set up your store details and broadcast promotional squad meetups.
          </p>
        </div>
        <Link href="/dashboard" className="nokia-btn font-pixel" style={{ fontSize: "8px", padding: "6px 12px" }}>
          ◀ LOBBY FEED
        </Link>
      </div>

      {/* ── Telemetry Monitor Panel ─────────────────────────────────────────── */}
      <div className="partner-stats-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
        <div className="nokia-panel-sunken" style={{ padding: "12px", textAlign: "center" }}>
          <div className="font-lcd text-accent" style={{ fontSize: "28px", color: "var(--accent-success)", lineHeight: 1 }}>
            {offers.length}
          </div>
          <div className="font-pixel" style={{ fontSize: "6px", color: "var(--text-muted)", marginTop: "4px" }}>
            ACTIVE PROMOTIONS
          </div>
        </div>

        <div className="nokia-panel-sunken" style={{ padding: "12px", textAlign: "center" }}>
          <div className="font-lcd text-accent" style={{ fontSize: "28px", color: "var(--accent-warning)", lineHeight: 1 }}>
            {totalReach}
          </div>
          <div className="font-pixel" style={{ fontSize: "6px", color: "var(--text-muted)", marginTop: "4px" }}>
            TOTAL REACH (SLOTS FILLED)
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", alignItems: "start" }}>
        
        {/* ── Column 1: Business Setup ─────────────────────────────────────── */}
        <div className="nokia-panel" style={{ padding: 0 }}>
          <div style={{
            background: "var(--accent-primary)",
            color: "white",
            padding: "8px 14px",
            borderBottom: "2px solid var(--border-strong)",
            display: "flex",
            justifyContent: "space-between",
          }}>
            <span className="font-pixel" style={{ fontSize: "8px" }}>◈ SETUP BUSINESS INFO</span>
            <span className="font-pixel" style={{ fontSize: "8px" }}>✍</span>
          </div>

          <form onSubmit={handleSaveInfo} style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Business Name */}
            <div>
              <label className="font-pixel text-muted" style={{ display: "block", fontSize: "7px", marginBottom: "6px" }}>
                ♦ BUSINESS NAME
              </label>
              <input
                type="text"
                required
                maxLength={100}
                placeholder="e.g. KOYLA CHAI, TURF ARENA..."
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="nokia-input"
              />
            </div>

            {/* City Dropdown */}
            <div>
              <label className="font-pixel text-muted" style={{ display: "block", fontSize: "7px", marginBottom: "6px" }}>
                🏙 SELECT CITY AREA
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="nokia-input"
                style={{
                  background: "var(--bg-sunken)",
                  color: "var(--text-primary)",
                  border: "2px solid var(--border-strong)",
                  padding: "10px",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="Karachi">KARACHI</option>
                <option value="Lahore">LAHORE</option>
                <option value="Islamabad">ISLAMABAD</option>
              </select>
            </div>

            {/* Promo descriptive Bio */}
            <div>
              <label className="font-pixel text-muted" style={{ display: "block", fontSize: "7px", marginBottom: "6px" }}>
                ✎ BUSINESS DESCRIPTION / OFFERS
              </label>
              <textarea
                rows={4}
                maxLength={160}
                placeholder="Describe your promos, turf details, or standard discount info..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="nokia-input"
                style={{ resize: "none" }}
              />
              <div className="font-pixel" style={{ fontSize: "6px", color: "var(--text-muted)", marginTop: "4px", textAlign: "right" }}>
                {bio.length}/160 CHARS
              </div>
            </div>

            {/* Feedback Alerts */}
            {errorMsg && (
              <div className="nokia-panel-sunken" style={{ padding: "8px 12px", borderColor: "var(--accent-danger)" }}>
                <span className="font-pixel text-danger" style={{ fontSize: "7px" }}>✕ {errorMsg}</span>
              </div>
            )}

            {success && (
              <div className="nokia-panel-sunken" style={{ padding: "8px 12px", borderColor: "var(--accent-success)" }}>
                <span className="font-pixel text-success" style={{ fontSize: "7px" }}>✓ CHANGES SAVED SECURELY</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="nokia-btn nokia-btn-primary"
              style={{ width: "100%", padding: "10px", fontSize: "8px", marginTop: "4px" }}
            >
              {isLoading ? "SAVING..." : "✓ UPDATE STORE PROFILE"}
            </button>
          </form>
        </div>

        {/* ── Column 2: Promo Offers ───────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="font-pixel text-muted" style={{ fontSize: "8px" }}>
              ▶ BROADCASTED PROMOS ({offers.length})
            </span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="nokia-btn nokia-btn-primary"
              style={{ padding: "6px 12px", fontSize: "7px" }}
            >
              + POST PROMO OFFER
            </button>
          </div>

          {offers.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {offers.map((offer) => (
                <div key={offer.id} className="nokia-panel" style={{ padding: "14px" }}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "6px" }}>
                    <span className="nokia-badge nokia-badge-success" style={{ fontSize: "6px" }}>
                      % PROMO OFFER
                    </span>
                    <span className="font-pixel text-muted" style={{ fontSize: "7px" }}>
                      🏙 {offer.city.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="font-pixel" style={{ fontSize: "11px", margin: 0, textTransform: "uppercase" }}>
                    {offer.title}
                  </h3>

                  <div className="promo-meta-row font-mono text-muted" style={{ fontSize: "11px", marginTop: "6px" }}>
                    <span>📍 {offer.location_name || "VENUE"}</span>
                    <span style={{ marginLeft: "12px" }}>👥 {offer.filled_slots} / {offer.total_slots} SQUAD</span>
                  </div>

                  {offer.image_url && (
                    <div style={{ marginTop: "10px", overflow: "hidden", border: "2px solid var(--border-light)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={offer.image_url}
                        alt="Promo banner"
                        style={{
                          width: "100%",
                          maxHeight: "100px",
                          objectFit: "cover",
                          filter: "grayscale(1) contrast(1.3)",
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="nokia-panel-sunken" style={{ padding: "40px 20px", textAlign: "center" }}>
              <div className="font-lcd pixel-blink" style={{ fontSize: "28px", color: "var(--text-muted)" }}>
                NO PROMOS
              </div>
              <p className="font-mono text-muted" style={{ fontSize: "10px", marginTop: "8px" }}>
                You have not broadcasted any turf discounts, café vouchers, or partner squad promos yet.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Broadcast Offer Modal */}
      {isModalOpen && (
        <CreateBeaconModal
          onClose={() => setIsModalOpen(false)}
          onCreated={handleBeaconCreated}
        />
      )}
    </div>
  );
}
