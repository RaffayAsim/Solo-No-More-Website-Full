"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Beacon } from "@/lib/supabase/types";
import SignOutButton from "./SignOutButton";
import BeaconCard from "./BeaconCard";
import CreateBeaconModal from "./CreateBeaconModal";
import { updateProfile } from "@/app/actions/billing";

const CITY_CENTROIDS = {
  Karachi: { lat: 24.8607, lng: 67.0011 },
  Lahore: { lat: 31.5204, lng: 74.3587 },
  Islamabad: { lat: 33.6844, lng: 73.0479 },
};

function getClosestCity(lat: number, lng: number): string {
  let closestCity = "Karachi";
  let minDistance = Infinity;

  for (const [city, coords] of Object.entries(CITY_CENTROIDS)) {
    const distance = Math.sqrt(
      Math.pow(lat - coords.lat, 2) + Math.pow(lng - coords.lng, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestCity = city;
    }
  }
  return closestCity;
}

interface ApprovedScreenProps {
  name: string;
  currentUserId: string;
  initialBeacons: Beacon[];
  selectedCity: string;
  isPartner: boolean;
}

const FILTER_TABS = [
  { id: "all",       label: "ALL",      icon: "◈" },
  { id: "sports",    label: "SPORTS",   icon: "◉" },
  { id: "casual",    label: "CASUAL",   icon: "★" },
  { id: "nightlife", label: "NITE",     icon: "♦" },
];

export default function ApprovedScreen({
  name,
  currentUserId,
  initialBeacons,
  selectedCity,
  isPartner,
}: ApprovedScreenProps) {
  const [beacons, setBeacons] = useState<Beacon[]>(initialBeacons);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLateNightRadar, setIsLateNightRadar] = useState(false);

  const router = useRouter();

  useEffect(() => { setBeacons(initialBeacons); }, [initialBeacons]);

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const closest = getClosestCity(latitude, longitude);
          if (closest !== selectedCity) {
            try {
              // Update profile city saved in db
              await updateProfile({ city: closest });
            } catch (err) {
              console.error("Failed to update profile city dynamically:", err);
            }
            // Redirect query parameter to refresh beacons query
            router.push(`/dashboard?city=${closest}`);
          }
        },
        (error) => {
          console.log("Geolocation permission denied or failed. Defaulting to profile city:", selectedCity);
        }
      );
    }
  }, [selectedCity, router]);

  const handleApply = (beaconId: string) => {
    setBeacons((prev) =>
      prev.map((b) => {
        if (b.id === beaconId && b.filled_slots < b.total_slots) {
          const updatedFilled = b.filled_slots + 1;
          return { ...b, filled_slots: updatedFilled, status: updatedFilled >= b.total_slots ? "completed" : "active" };
        }
        return b;
      })
    );
  };

  const handleBeaconCreated = () => { router.refresh(); };

  const filteredBeacons = beacons.filter((b) => {
    const matchesCategory = categoryFilter === "all" || b.category === categoryFilter;
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.location_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    let matchesLateNight = true;
    if (isLateNightRadar) {
      if (!b.scheduled_at) {
        matchesLateNight = b.category === "nightlife";
      } else {
        const hour = new Date(b.scheduled_at).getHours();
        matchesLateNight = b.category === "nightlife" || hour >= 21 || hour < 3;
      }
    }
    return matchesCategory && matchesSearch && matchesLateNight;
  });

  const firstName = name ? name.split(" ")[0].toUpperCase() : "MEMBER";

  return (
    <main className="page-swipe neon-grid-perspective retro-corners" style={{ minHeight: "100vh", background: "var(--bg-base)" }}>

      {/* ── Welcome + Stats Header ────────────────────────────────────────── */}
      <div className="nokia-panel retro-corners" style={{
        margin: "12px",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "10px",
        borderRadius: "2px",
      }}>
        <div>
          <div className="font-pixel" style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.08em" }}>👋 WELCOME BACK</div>
          <div className="font-lcd" style={{ fontSize: "32px", color: "var(--accent-primary)", lineHeight: 1 }}>
            {firstName}
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "6px", flexWrap: "wrap" }}>
            <div className="nokia-badge nokia-badge-success">
              🟢 ACTIVE MEMBER
            </div>
            
            {/* CITY STATIC LCD INDICATOR */}
            <div
              className="nokia-badge font-pixel"
              style={{
                background: "var(--bg-sunken)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-strong)",
                fontSize: "10px",
                padding: "2px 6px",
                textTransform: "uppercase",
              }}
            >
              🏙 LOBBY: {selectedCity}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }} className="lobby-header-right">
          <div className="nokia-panel-sunken" style={{ padding: "6px 14px", textAlign: "center" }}>
            <div className="font-lcd" style={{ fontSize: "24px", color: "var(--accent-primary)" }}>
              {filteredBeacons.length}
            </div>
            <div className="font-pixel" style={{ fontSize: "9px", color: "var(--text-muted)" }}>LIVE BEACONS</div>
          </div>
          <button
            onClick={() => setIsLateNightRadar(!isLateNightRadar)}
            className={isLateNightRadar ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
            style={{ fontSize: "11px" }}
          >
            {isLateNightRadar ? "📡 NEON RADAR ON" : "📡 NEON RADAR"}
          </button>
        </div>
      </div>

      {/* ── Filter Tabs + Search ──────────────────────────────────────────── */}
      <div style={{ margin: "0 12px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>

        <div style={{ display: "grid", gridTemplateColumns: `repeat(${FILTER_TABS.length}, 1fr)`, gap: "4px" }}>
          {FILTER_TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setCategoryFilter(id)}
              className={categoryFilter === id ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
              style={{ fontSize: "8.5px", padding: "8px 2px" }}
            >
              {icon} {label}
              <span className="font-lcd" style={{ marginLeft: "4px", fontSize: "14px" }}>
                {id === "all" ? beacons.length : beacons.filter(b => b.category === id).length}
              </span>
            </button>
          ))}
        </div>

        {/* Search + Post row */}
        <div style={{ display: "flex", gap: "6px" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH BEACONS..."
            className="nokia-input"
            style={{ flex: 1, fontSize: "13px" }}
          />
          <button
            onClick={() => setIsModalOpen(true)}
            className="nokia-btn nokia-btn-primary"
            style={{ fontSize: "9.5px", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            + 🛰 POST BEACON
          </button>
        </div>
      </div>

      {/* ── Beacon Cards Grid ─────────────────────────────────────────────── */}
      <div style={{ margin: "0 12px 12px" }}>
        {filteredBeacons.length > 0 ? (
          <div className="beacon-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
            {filteredBeacons.map((beacon) => (
              <BeaconCard
                key={beacon.id}
                beacon={beacon}
                onApply={handleApply}
                isLateNightRadar={isLateNightRadar}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        ) : (
          <div className="nokia-panel-sunken" style={{ padding: "40px 20px", textAlign: "center" }}>
            <div className="font-lcd pixel-blink" style={{ fontSize: "36px", color: "var(--text-muted)" }}>
              NO SIGNAL
            </div>
            <div className="font-pixel" style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "8px", letterSpacing: "0.08em" }}>
              NO ACTIVE BEACONS FOUND
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>
              Try broadcasting one yourself!
            </div>
          </div>
        )}
      </div>

      {/* ── Community Notice ──────────────────────────────────────────────── */}
      <div className="nokia-panel retro-corners" style={{ margin: "0 12px 24px", padding: "10px 14px" }}>
        <span className="font-pixel" style={{ fontSize: "11px", color: "var(--accent-warning)", letterSpacing: "0.06em" }}>
          ⚠️ MEMBER STANDARDS:
        </span>
        <span style={{ fontSize: "13px", color: "var(--text-muted)", marginLeft: "8px" }}>
          Real identities required. Ghosting confirmed slots leads to account suspension.
        </span>
      </div>

      {/* Create Beacon Modal */}
      {isModalOpen && (
        <CreateBeaconModal
          onClose={() => setIsModalOpen(false)}
          onCreated={handleBeaconCreated}
          isPartner={isPartner}
          defaultCity={selectedCity}
        />
      )}
    </main>
  );
}
