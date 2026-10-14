"use client";

import React, { useState } from "react";
import {
  ArtistRecord,
  ApprovedMemberOption,
  grantArtistAccessAction,
  createNewArtistAccountAction,
  updateArtistStatusAction,
} from "@/app/actions/artists";
import {
  Mic2,
  Music,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Copy,
  Check,
  Disc3,
  TrendingUp,
  Sparkles,
  DollarSign,
  Users,
} from "lucide-react";

interface AdminArtistsClientProps {
  initialArtists: ArtistRecord[];
  initialApprovedMembers: ApprovedMemberOption[];
  stats: {
    totalArtists: number;
    activeGigs: number;
    totalTicketsSold: number;
    totalArtistPayoutsPkr: number;
  };
}

export default function AdminArtistsClient({
  initialArtists,
  initialApprovedMembers,
  stats,
}: AdminArtistsClientProps) {
  const [artists, setArtists] = useState<ArtistRecord[]>(initialArtists);
  const [approvedMembers] = useState<ApprovedMemberOption[]>(initialApprovedMembers);
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creationType, setCreationType] = useState<"existing" | "new">("existing");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Existing Member Form
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [memberStageName, setMemberStageName] = useState("");
  const [memberGenre, setMemberGenre] = useState("Electronic / DJ");

  // New Artist Form
  const [fullName, setFullName] = useState("");
  const [stageName, setStageName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [genre, setGenre] = useState("Electronic / DJ");
  const [password, setPassword] = useState("");

  // Search & Filter
  const filteredArtists = artists.filter((a) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      a.name.toLowerCase().includes(q) ||
      a.stage_name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.genre.toLowerCase().includes(q) ||
      (a.social_handle && a.social_handle.toLowerCase().includes(q));

    const matchesGenre = selectedGenre === "all" || a.genre.toLowerCase().includes(selectedGenre.toLowerCase());
    return matchesSearch && matchesGenre;
  });

  const totalPages = Math.ceil(filteredArtists.length / itemsPerPage) || 1;
  const paginatedArtists = filteredArtists.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCopyLink = (id: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/dashboard/artist`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleStatusChange = async (artistId: string, newStatus: "approved" | "pending" | "suspended") => {
    setLoading(true);
    const res = await updateArtistStatusAction(artistId, newStatus);
    setLoading(false);
    if (res.success) {
      setArtists((prev) =>
        prev.map((a) => (a.id === artistId ? { ...a, status: newStatus as any } : a))
      );
      setFeedback({
        type: "success",
        text: `✓ Artist status updated to ${newStatus}!`,
      });
      setTimeout(() => setFeedback(null), 2500);
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to update artist status." });
    }
  };

  const handleGrantExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setFeedback({ type: "error", text: "Please select an approved member." });
      return;
    }
    setLoading(true);
    setFeedback(null);

    const res = await grantArtistAccessAction(
      selectedMemberId,
      memberStageName || "Resident DJ",
      memberGenre
    );
    setLoading(false);

    if (res.success) {
      setFeedback({ type: "success", text: "Member granted Artist access successfully!" });
      const targetMember = approvedMembers.find((m) => m.id === selectedMemberId);
      if (targetMember) {
        setArtists((prev) => [
          {
            id: targetMember.id,
            name: targetMember.name,
            stage_name: memberStageName || "Resident DJ",
            email: targetMember.email,
            phone: targetMember.phone || "—",
            genre: memberGenre,
            status: "active",
            registered: new Date().toLocaleString(),
            total_gigs: 0,
            tickets_sold: 0,
            gross_revenue_pkr: 0,
            payout_rate: 92,
            social_handle: memberStageName.startsWith("@") ? memberStageName : `@${memberStageName}`,
          },
          ...prev,
        ]);
      }
      setTimeout(() => {
        setIsModalOpen(false);
        setFeedback(null);
        setSelectedMemberId("");
        setMemberStageName("");
      }, 1400);
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to grant artist role." });
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone) {
      setFeedback({ type: "error", text: "Please fill in all required fields." });
      return;
    }
    setLoading(true);
    setFeedback(null);

    const res = await createNewArtistAccountAction({
      fullName,
      stageName: stageName || fullName,
      email,
      phone,
      genre,
      password,
    });
    setLoading(false);

    if (res.success) {
      setFeedback({ type: "success", text: "New Artist Account registered successfully!" });
      setArtists((prev) => [
        {
          id: `new-${Date.now()}`,
          name: fullName,
          stage_name: stageName || fullName,
          email,
          phone,
          genre,
          status: "active",
          registered: new Date().toLocaleString(),
          total_gigs: 0,
          tickets_sold: 0,
          gross_revenue_pkr: 0,
          payout_rate: 92,
          social_handle: stageName.startsWith("@") ? stageName : `@${stageName}`,
        },
        ...prev,
      ]);
      setTimeout(() => {
        setIsModalOpen(false);
        setFeedback(null);
        setFullName("");
        setStageName("");
        setEmail("");
        setPhone("");
        setPassword("");
      }, 1400);
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to create artist account." });
    }
  };

  return (
    <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "0 clamp(16px, 2.5vw, 40px) 60px" }}>
      {/* ── HEADER TELEMETRY ── */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(20, 10, 15, 0.9) 0%, rgba(12, 6, 9, 0.95) 100%)",
          border: "1px solid rgba(255, 111, 38, 0.25)",
          borderRadius: "24px",
          padding: "30px",
          marginBottom: "28px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FF6F26", display: "inline-block", boxShadow: "0 0 10px #FF6F26" }} />
              <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.14em", color: "#FF8A3D", textTransform: "uppercase" }}>
                HEADLINER & RESIDENT ROSTER
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(26px, 3.2vw, 36px)", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.03em", margin: "0 0 8px" }}>
              Artists & DJs Command
            </h1>
            <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.65)", margin: 0, maxWidth: "620px" }}>
              Manage touring musicians, resident DJs, acoustics, and curated performers. Coordinate 92% ticket splits and door guestlists.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                background: "linear-gradient(135deg, #FF6F26 0%, #FF4400 100%)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "14px",
                padding: "12px 22px",
                fontSize: "13.5px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(255, 111, 38, 0.35)",
              }}
            >
              <Plus className="w-4 h-4" /> Add Artist Account
            </button>
          </div>
        </div>

        {/* ── METRIC TILES ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "16px",
            marginTop: "26px",
          }}
        >
          <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)", fontWeight: 600 }}>Total Artists</span>
              <Mic2 className="w-4 h-4 text-[#FF8A3D]" />
            </div>
            <div style={{ fontSize: "28px", fontWeight: 900, color: "#FFFFFF" }}>{stats.totalArtists}</div>
            <div style={{ fontSize: "11px", color: "#FF8A3D", marginTop: "4px" }}>Verified performers</div>
          </div>

          <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)", fontWeight: 600 }}>Active Gigs / Sets</span>
              <Disc3 className="w-4 h-4 text-[#FF8A3D]" />
            </div>
            <div style={{ fontSize: "28px", fontWeight: 900, color: "#FFFFFF" }}>{stats.activeGigs}</div>
            <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.5)", marginTop: "4px" }}>Platform listed</div>
          </div>

          <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)", fontWeight: 600 }}>Tickets Sold (Artist Gigs)</span>
              <TrendingUp className="w-4 h-4 text-[#FF8A3D]" />
            </div>
            <div style={{ fontSize: "28px", fontWeight: 900, color: "#FFFFFF" }}>{stats.totalTicketsSold}</div>
            <div style={{ fontSize: "11px", color: "#10B981", marginTop: "4px" }}>Active check-ins</div>
          </div>

          <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)", fontWeight: 600 }}>Estimated Artist Payouts</span>
              <DollarSign className="w-4 h-4 text-[#FF8A3D]" />
            </div>
            <div style={{ fontSize: "28px", fontWeight: 900, color: "#FF8A3D" }}>
              PKR {stats.totalArtistPayoutsPkr.toLocaleString()}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.5)", marginTop: "4px" }}>92% Net Split</div>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "14px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", flex: "1", minWidth: "260px" }}>
          <Search
            className="w-4 h-4"
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(255, 255, 255, 0.4)",
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search artists by name, stage name, genre, or email..."
            style={{
              width: "100%",
              background: "rgba(20, 10, 15, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "14px",
              padding: "11px 16px 11px 40px",
              color: "#FFFFFF",
              fontSize: "13.5px",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            style={{
              background: "rgba(20, 10, 15, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "14px",
              padding: "11px 16px",
              color: "#FFFFFF",
              fontSize: "13px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All Genres & Sets</option>
            <option value="Electronic">Electronic / Deep House</option>
            <option value="Acoustic">Acoustic / Vocals</option>
            <option value="Techno">Techno / Underground</option>
            <option value="Live">Live Performance</option>
          </select>
        </div>
      </div>

      {/* ── ARTISTS TABLE ── */}
      <div
        style={{
          background: "rgba(14, 7, 10, 0.7)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(255, 255, 255, 0.02)" }}>
                <th style={{ padding: "16px 20px", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.45)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  ARTIST / PERFORMER
                </th>
                <th style={{ padding: "16px 20px", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.45)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  GENRE & STYLE
                </th>
                <th style={{ padding: "16px 20px", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.45)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  CONTACT INFO
                </th>
                <th style={{ padding: "16px 20px", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.45)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  GIGS & TICKETS
                </th>
                <th style={{ padding: "16px 20px", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.45)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  PAYOUT SPLIT
                </th>
                <th style={{ padding: "16px 20px", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.45)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  STATUS
                </th>
                <th style={{ padding: "16px 20px", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.45)", letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "right" }}>
                  PORTAL LINK
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedArtists.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px 20px", textAlign: "center", color: "rgba(255, 255, 255, 0.45)" }}>
                    No artist accounts match your criteria.
                  </td>
                </tr>
              ) : (
                paginatedArtists.map((artist) => (
                  <tr
                    key={artist.id}
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 111, 38, 0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Artist Details */}
                    <td style={{ padding: "18px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "12px",
                            background: "linear-gradient(135deg, rgba(255, 111, 38, 0.2) 0%, rgba(255, 68, 0, 0.1) 100%)",
                            border: "1px solid rgba(255, 111, 38, 0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "16px",
                            fontWeight: 800,
                            color: "#FF8A3D",
                          }}
                        >
                          {artist.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>{artist.name}</div>
                          <div style={{ fontSize: "12px", color: "#FF8A3D", fontWeight: 600 }}>
                            {artist.stage_name}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Genre */}
                    <td style={{ padding: "18px 20px" }}>
                      <span
                        style={{
                          background: "rgba(255, 255, 255, 0.06)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "999px",
                          padding: "4px 12px",
                          fontSize: "12px",
                          color: "rgba(255, 255, 255, 0.85)",
                        }}
                      >
                        {artist.genre}
                      </span>
                    </td>

                    {/* Contact */}
                    <td style={{ padding: "18px 20px" }}>
                      <div style={{ fontSize: "13px", color: "#FFFFFF" }}>{artist.email}</div>
                      <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)", marginTop: "2px" }}>
                        {artist.phone}
                      </div>
                    </td>

                    {/* Telemetry */}
                    <td style={{ padding: "18px 20px" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF" }}>
                        {artist.total_gigs} gigs listed
                      </div>
                      <div style={{ fontSize: "12px", color: "#10B981" }}>{artist.tickets_sold} tickets sold</div>
                    </td>

                    {/* Payout Split */}
                    <td style={{ padding: "18px 20px" }}>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#FF8A3D" }}>
                        {artist.payout_rate}% Artist
                      </div>
                      <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)" }}>8% Platform fee</div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "18px 20px" }}>
                      <span
                        style={{
                          background:
                            artist.status === "approved" || artist.status === "active"
                              ? "rgba(16, 185, 129, 0.12)"
                              : artist.status === "suspended"
                              ? "rgba(239, 68, 68, 0.12)"
                              : "rgba(255, 111, 38, 0.12)",
                          border: `1px solid ${
                            artist.status === "approved" || artist.status === "active"
                              ? "rgba(16, 185, 129, 0.35)"
                              : artist.status === "suspended"
                              ? "rgba(239, 68, 68, 0.35)"
                              : "rgba(255, 111, 38, 0.35)"
                          }`,
                          color:
                            artist.status === "approved" || artist.status === "active"
                              ? "#10B981"
                              : artist.status === "suspended"
                              ? "#EF4444"
                              : "#FF8A3D",
                          fontSize: "11px",
                          fontWeight: 800,
                          padding: "4px 10px",
                          borderRadius: "999px",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {artist.status === "active" || artist.status === "approved" ? "APPROVED" : artist.status}
                      </span>
                    </td>

                    {/* Actions: Approve / Suspend / Copy Link */}
                    <td style={{ padding: "18px 20px", textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                        {artist.status !== "approved" && artist.status !== "active" ? (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(artist.id, "approved")}
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
                            onClick={() => handleStatusChange(artist.id, "suspended")}
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
                          onClick={() => handleCopyLink(artist.id)}
                          style={{
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            borderRadius: "10px",
                            padding: "6px 12px",
                            color: "#FFFFFF",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {copiedId === artist.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#10B981]" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#FF8A3D]" /> Portal Link
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            fontSize: "13px",
            color: "rgba(255, 255, 255, 0.5)",
          }}
        >
          <span>
            Showing {paginatedArtists.length} of {filteredArtists.length} artists
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "6px 12px",
                color: "#FFFFFF",
                fontSize: "12px",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                opacity: currentPage === 1 ? 0.4 : 1,
              }}
            >
              Previous
            </button>
            <span style={{ display: "inline-flex", alignItems: "center", padding: "0 8px", color: "#FF8A3D" }}>
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "6px 12px",
                color: "#FFFFFF",
                fontSize: "12px",
                cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                opacity: currentPage >= totalPages ? 0.4 : 1,
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ── ADD ARTIST MODAL ── */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#160B0E",
              border: "1px solid rgba(255, 111, 38, 0.35)",
              borderRadius: "24px",
              padding: "32px",
              maxWidth: "540px",
              width: "100%",
              boxShadow: "0 25px 60px rgba(0,0,0,0.8)",
              position: "relative",
            }}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "transparent",
                border: "none",
                color: "rgba(255, 255, 255, 0.5)",
                cursor: "pointer",
              }}
            >
              <X className="w-5 h-5" />
            </button>

            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#FFFFFF", margin: "0 0 6px" }}>
              Add Artist Account
            </h2>
            <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)", margin: "0 0 20px" }}>
              Enable musicians and DJs to list ticketed sets with automatic 92/8 payout splits.
            </p>

            {/* Sub-tab selection */}
            <div
              style={{
                display: "flex",
                background: "rgba(255, 255, 255, 0.05)",
                padding: "4px",
                borderRadius: "12px",
                marginBottom: "20px",
              }}
            >
              <button
                type="button"
                onClick={() => setCreationType("existing")}
                style={{
                  flex: 1,
                  padding: "9px 12px",
                  borderRadius: "10px",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  background: creationType === "existing" ? "#FF6F26" : "transparent",
                  color: creationType === "existing" ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)",
                }}
              >
                Grant Existing Member
              </button>
              <button
                type="button"
                onClick={() => setCreationType("new")}
                style={{
                  flex: 1,
                  padding: "9px 12px",
                  borderRadius: "10px",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  background: creationType === "new" ? "#FF6F26" : "transparent",
                  color: creationType === "new" ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)",
                }}
              >
                Create New Artist
              </button>
            </div>

            {feedback && (
              <div
                style={{
                  background: feedback.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                  border: `1px solid ${feedback.type === "success" ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
                  color: feedback.type === "success" ? "#10B981" : "#EF4444",
                  padding: "12px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {feedback.text}
              </div>
            )}

            {creationType === "existing" ? (
              <form onSubmit={handleGrantExisting} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", display: "block", marginBottom: "6px" }}>
                    Select Member
                  </label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      padding: "11px 14px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  >
                    <option value="">Choose an approved member...</option>
                    {approvedMembers.map((m) => (
                      <option key={m.id} value={m.id} style={{ background: "#1C0F12" }}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", display: "block", marginBottom: "6px" }}>
                    Stage Name / Handle (optional)
                  </label>
                  <input
                    type="text"
                    value={memberStageName}
                    onChange={(e) => setMemberStageName(e.target.value)}
                    placeholder="e.g. @dj_zayd or SubAtomic"
                    style={{
                      width: "100%",
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      padding: "11px 14px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", display: "block", marginBottom: "6px" }}>
                    Primary Music Genre
                  </label>
                  <input
                    type="text"
                    value={memberGenre}
                    onChange={(e) => setMemberGenre(e.target.value)}
                    placeholder="e.g. Deep House / Techno, Acoustic Indie"
                    style={{
                      width: "100%",
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      padding: "11px 14px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: "10px",
                    background: "linear-gradient(135deg, #FF6F26 0%, #FF4400 100%)",
                    border: "none",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    padding: "12px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    cursor: loading ? "wait" : "pointer",
                  }}
                >
                  {loading ? "Granting Access..." : "Grant Artist Privileges"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCreateNew} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", display: "block", marginBottom: "4px" }}>
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Artist legal name"
                    style={{
                      width: "100%",
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      padding: "10px 14px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", display: "block", marginBottom: "4px" }}>
                    Stage Name / Handle
                  </label>
                  <input
                    type="text"
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                    placeholder="e.g. SubAtomic"
                    style={{
                      width: "100%",
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      padding: "10px 14px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", display: "block", marginBottom: "4px" }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="artist@solo.com"
                      style={{
                        width: "100%",
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        borderRadius: "12px",
                        padding: "10px 14px",
                        color: "#FFFFFF",
                        fontSize: "13px",
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", display: "block", marginBottom: "4px" }}>
                      Phone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="03001234567"
                      style={{
                        width: "100%",
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        borderRadius: "12px",
                        padding: "10px 14px",
                        color: "#FFFFFF",
                        fontSize: "13px",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", display: "block", marginBottom: "4px" }}>
                    Genre
                  </label>
                  <input
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="e.g. Deep House / Electronic"
                    style={{
                      width: "100%",
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      padding: "10px 14px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", display: "block", marginBottom: "4px" }}>
                    Initial Password (optional)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Default: SoloArtist2026!"
                    style={{
                      width: "100%",
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      padding: "10px 14px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: "10px",
                    background: "linear-gradient(135deg, #FF6F26 0%, #FF4400 100%)",
                    border: "none",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    padding: "12px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    cursor: loading ? "wait" : "pointer",
                  }}
                >
                  {loading ? "Creating Artist..." : "Create Artist Account"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
