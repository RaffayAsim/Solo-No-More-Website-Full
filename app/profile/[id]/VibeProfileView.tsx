"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { sendFriendRequest, acceptFriendRequest, removeFriend } from "@/app/actions/friends";
import { uploadMemory, getMemoriesForProfile, toggleMemoryPrivacy, deleteMemory } from "@/app/actions/memories";
import SignOutButton from "@/app/dashboard/SignOutButton";

interface VibeProfileViewProps {
  profile: {
    id: string;
    full_name: string | null;
    bio: string | null;
    social_link: string | null;
    subscription_tier: string;
    account_status: string;
    no_show_strikes?: number | null;
    city?: string | null;
    avatar_icon?: string | null;
    is_partner?: boolean | null;
    business_name?: string | null;
    vibe_tags?: string[] | null;
    is_active_seeker?: boolean | null;
    seeker_updated_at?: string | null;
    created_at?: string;
  };
  currentUserId: string;
  initialFriendship: {
    id: string;
    user_id_1: string;
    user_id_2: string;
    status: "pending" | "accepted" | "blocked";
  } | null;
  hostedBeacons: any[];
  joinedApplications: any[];
  ratings: string[];
  mutualFriendsCount: number;
  mutualFriends: any[];
}

export default function VibeProfileView({
  profile,
  currentUserId,
  initialFriendship,
  hostedBeacons = [],
  joinedApplications = [],
  ratings = [],
  mutualFriendsCount = 0,
  mutualFriends = [],
}: VibeProfileViewProps) {
  const [friendship, setFriendship] = useState<any>(initialFriendship);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tab State: "overview" | "memories" | "timeline" | "activity"
  const [activeTab, setActiveTab] = useState<"overview" | "memories" | "timeline" | "activity">("overview");

  // Vibe Memories state
  const [memories, setMemories] = useState<any[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadBeaconId, setUploadBeaconId] = useState("");
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadIsPublic, setUploadIsPublic] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSelf = profile.id === currentUserId;
  const isFamily = profile.subscription_tier === "family";
  const firstName = (profile.full_name || "ANONYMOUS").split(" ")[0].toUpperCase();
  const strikes = profile.no_show_strikes || 0;

  // ── 1. Calculate Badges ───────────────────────────────────────────────────
  const sportsAttended = joinedApplications.filter((app: any) => app.status === "approved" && app.beacons?.category === "sports").length;
  const nightlifeAttended = joinedApplications.filter((app: any) => app.status === "approved" && app.beacons?.category === "nightlife").length;
  const casualAttended = joinedApplications.filter((app: any) => app.status === "approved" && app.beacons?.category === "casual").length;

  const completedHosted = hostedBeacons.filter((b: any) => b.status === "completed").length;
  const approvedGuestsCount = joinedApplications.filter((app: any) => app.status === "approved").length;
  const totalAttended = approvedGuestsCount + completedHosted;

  // 1. FAST JOINER: Applied to any beacon within 1 hour of its creation
  const hasFastJoiner = joinedApplications.some((app: any) => {
    if (!app.created_at || !app.beacons?.created_at) return false;
    const diff = new Date(app.created_at).getTime() - new Date(app.beacons.created_at).getTime();
    return diff >= 0 && diff <= 60 * 60 * 1000;
  });

  // 2. SQUAD STARTER: Hosted at least 1 completed beacon
  const hasSquadStarter = completedHosted >= 1;

  // 3. PADEL PIONEER: 3+ Sports beacons attended
  const hasPadelPioneer = sportsAttended >= 3;

  // 4. NIGHT OWL: 3+ Nightlife beacons attended
  const hasNightOwl = nightlifeAttended >= 3;

  // 5. CASUAL KING: 3+ Casual beacons attended
  const hasCasualKing = casualAttended >= 3;

  // 6. RELIABLE: 5+ beacons attended, 0 strikes
  const hasReliable = totalAttended >= 5 && strikes === 0;

  // 7. CITY CONNECTOR: Hosted or Attended beacons in 2+ cities
  const cities = new Set<string>();
  if (profile.city) cities.add(profile.city);
  hostedBeacons.forEach((b: any) => { if (b.city) cities.add(b.city); });
  joinedApplications.forEach((app: any) => { if (app.beacons?.city) cities.add(app.beacons.city); });
  const hasCityConnector = cities.size >= 2;

  // 8. VIBE MATCHED: Received 3+ "vibe_matched" feedback ratings
  const vibeMatchedRatings = ratings.filter(r => r === "vibe_matched").length;
  const hasVibeMatched = vibeMatchedRatings >= 3;

  // 9. SQUAD BUILDER: Hosted 3+ fully-filled beacons
  const fullyFilledHosted = hostedBeacons.filter((b: any) => b.status === "completed" && b.filled_slots >= b.total_slots).length;
  const hasSquadBuilder = fullyFilledHosted >= 3;

  // 10. ALWAYS THERE: Attended 3+ beacons and withdrew 0 times
  const totalWithdrawn = joinedApplications.filter((app: any) => app.status === "withdrawn").length;
  const hasAlwaysThere = totalAttended >= 3 && totalWithdrawn === 0;

  // 11. VERIFIED PARTNER: Profile is partner
  const hasVerifiedPartner = !!profile.is_partner;

  // 12. FAST HOST: Excellent host statistics
  const hasFastHost = completedHosted >= 3 && strikes === 0;

  const badgeDefinitions = [
    { id: "fast_joiner", icon: "⚡", label: "FAST JOINER", desc: "Applied within 1h of beacon going live.", earned: hasFastJoiner, progress: `${hasFastJoiner ? 1 : 0}/1` },
    { id: "squad_starter", icon: "★", label: "SQUAD STARTER", desc: "Hosted 1+ completed squads.", earned: hasSquadStarter, progress: `${completedHosted}/1` },
    { id: "padel_pioneer", icon: "🥎", label: "PADEL PIONEER", desc: "Attended 3+ Sports beacons.", earned: hasPadelPioneer, progress: `${sportsAttended}/3` },
    { id: "night_owl", icon: "♦", label: "NIGHT OWL", desc: "Attended 3+ Nightlife beacons.", earned: hasNightOwl, progress: `${nightlifeAttended}/3` },
    { id: "casual_king", icon: "☕", label: "CASUAL KING", desc: "Attended 3+ Casual beacons.", earned: hasCasualKing, progress: `${casualAttended}/3` },
    { id: "reliable", icon: "✓", label: "RELIABLE", desc: "Attended 5+ beacons with 0 strikes.", earned: hasReliable, progress: `${totalAttended}/5` },
    { id: "city_connector", icon: "🌆", label: "CITY CONNECTOR", desc: "Beacons in 2+ cities.", earned: hasCityConnector, progress: `${cities.size}/2` },
    { id: "vibe_matched", icon: "⭐", label: "VIBE MATCHED", desc: "3+ vibe-matched ratings received.", earned: hasVibeMatched, progress: `${vibeMatchedRatings}/3` },
    { id: "squad_builder", icon: "👥", label: "SQUAD BUILDER", desc: "Hosted 3+ fully-filled beacons.", earned: hasSquadBuilder, progress: `${fullyFilledHosted}/3` },
    { id: "always_there", icon: "🔔", label: "ALWAYS THERE", desc: "3+ squads attended, 0 withdrawals.", earned: hasAlwaysThere, progress: `${totalWithdrawn === 0 ? Math.min(totalAttended, 3) : 0}/3` },
    { id: "verified_partner", icon: "▤", label: "VERIFIED PARTNER", desc: "is_partner = true.", earned: hasVerifiedPartner, progress: hasVerifiedPartner ? "1/1" : "0/1" },
    { id: "fast_host", icon: "⚡", label: "FAST HOST", desc: "Hosted 3+ squads with zero flakes.", earned: hasFastHost, progress: `${completedHosted}/3` },
  ];

  // ── 2. Vibe Score Signal Bars ──────────────────────────────────────────────
  const vibeMatchedCount = ratings.filter((r) => r === "vibe_matched").length;
  const mehCount = ratings.filter((r) => r === "meh").length;
  const flakeCount = ratings.filter((r) => r === "no_show_zone").length;
  const totalFeedback = vibeMatchedCount + mehCount + flakeCount;
  
  const vibeScore = totalFeedback > 0 
    ? Math.round((vibeMatchedCount / totalFeedback) * 100) 
    : 100; // default 100%

  const signalBars = vibeScore >= 90 ? "▰▰▰▰▰" : vibeScore >= 70 ? "▰▰▰▰▱" : vibeScore >= 50 ? "▰▰▰▱▱" : vibeScore >= 25 ? "▰▰▱▱▱" : "▰▱▱▱▱";

  // ── 3. Profile Completeness Meter ──────────────────────────────────────────
  let completeness = 0;
  if (profile.avatar_icon) completeness += 20;
  if (profile.bio) completeness += 20;
  if (profile.city) completeness += 20;
  if (profile.social_link) completeness += 20;
  if (profile.vibe_tags && profile.vibe_tags.length > 0) completeness += 20;

  // ── 4. Hosted vs Joined Ratio Bar ─────────────────────────────────────────
  const totalRatio = (completedHosted + approvedGuestsCount) || 1;
  const hostPercentage = Math.round((completedHosted / totalRatio) * 100);
  const guestPercentage = 100 - hostPercentage;

  // ── 5. Eligible Beacons for Memory Upload ──────────────────────────────────
  const eligibleBeaconsForMemory = [
    ...hostedBeacons.filter(b => b.status === "completed" || b.status === "active").map(b => ({ id: b.id, title: b.title, isHost: true })),
    ...joinedApplications.filter(app => app.status === "approved" && (app.beacons?.status === "completed" || app.beacons?.status === "active")).map(app => ({
      id: app.beacons.id,
      title: app.beacons.title,
      isHost: false
    }))
  ].filter((item, index, self) => self.findIndex(t => t.id === item.id) === index); // deduplicate

  // Fetch memories client side
  useEffect(() => {
    loadMemories();
  }, [profile.id]);

  const loadMemories = async () => {
    setLoadingMemories(true);
    const res = await getMemoriesForProfile(profile.id);
    if (res.success) {
      setMemories(res.memories);
    }
    setLoadingMemories(false);
  };

  const handleAddFriend = async () => {
    setIsLoading(true); setErrorMsg(null);
    try {
      const res = await sendFriendRequest(profile.id);
      if (res.success) { setFriendship({ id: "temp-id", user_id_1: currentUserId, user_id_2: profile.id, status: "pending" as const }); }
      else { setErrorMsg(res.error); }
    } catch { setErrorMsg("Failed to send request. Check your network."); }
    finally { setIsLoading(false); }
  };

  const handleAcceptRequest = async () => {
    if (!friendship) return;
    setIsLoading(true); setErrorMsg(null);
    try {
      const res = await acceptFriendRequest(friendship.id);
      if (res.success) { setFriendship({ ...friendship, status: "accepted" as const }); }
      else { setErrorMsg(res.error); }
    } catch { setErrorMsg("Failed to accept request. Check your network."); }
    finally { setIsLoading(false); }
  };

  const handleRemoveOrDecline = async () => {
    if (!friendship) return;
    setIsLoading(true); setErrorMsg(null);
    try {
      const res = await removeFriend(friendship.id);
      if (res.success) { setFriendship(null); }
      else { setErrorMsg(res.error); }
    } catch { setErrorMsg("Failed to complete action. Check your network."); }
    finally { setIsLoading(false); }
  };

  // ── Canvas Compressor Client-side ─────────────────────────────────────────
  const processAndUploadMemory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadBeaconId) return;

    setIsUploading(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        // Dynamic Canvas Resize & Compression (Polaroid retro feel limit: 800px width max)
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        // Apply a subtle nostalgic contrast adjustment (0.5 compression quality)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.5);

        // Upload
        const res = await uploadMemory(uploadBeaconId, dataUrl, uploadCaption, uploadIsPublic);
        if (res.success) {
          setUploadCaption("");
          setUploadBeaconId("");
          setUploadIsPublic(false);
          loadMemories();
          setActiveTab("memories");
        } else {
          setUploadError(res.error);
        }
        setIsUploading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleTogglePrivacy = async (memoryId: string, currentPublic: boolean) => {
    const res = await toggleMemoryPrivacy(memoryId, !currentPublic);
    if (res.success) {
      setMemories(memories.map(m => m.id === memoryId ? { ...m, is_public: !currentPublic } : m));
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (!confirm("Are you sure you want to delete this vibe memory?")) return;
    const res = await deleteMemory(memoryId);
    if (res.success) {
      setMemories(memories.filter(m => m.id !== memoryId));
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-base)", padding: "12px" }}>
      
      {/* Nav bar */}
      <div className="nokia-panel" style={{
        display: "flex", alignItems: "center",
        padding: "8px 14px", marginBottom: "12px", borderRadius: "2px",
        justifyContent: "space-between"
      }}>
        <Link href="/dashboard" className="nokia-btn" style={{ fontSize: "7px", textDecoration: "none" }}>
          ◀ LOBBY
        </Link>
        <span className="font-pixel" style={{ fontSize: "8px", color: "var(--accent-primary)" }}>
          ◈ VIBE PROFILE
        </span>
      </div>

      {/* Error alerts */}
      {errorMsg && (
        <div className="nokia-panel-sunken" style={{ padding: "8px 14px", marginBottom: "12px", borderColor: "var(--accent-danger)" }}>
          <span className="font-pixel" style={{ fontSize: "7px", color: "var(--accent-danger)" }}>✕ {errorMsg}</span>
        </div>
      )}

      {/* ── 1. Header Profile Card ─────────────────────────────────────────── */}
      <div className="nokia-panel" style={{ padding: 0, marginBottom: "12px" }}>
        
        {/* Title bar */}
        <div style={{
          background: isFamily ? "var(--accent-warning)" : "var(--accent-primary)",
          color: isFamily ? "#111" : "white",
          padding: "8px 16px",
          borderBottom: "2px solid var(--border-strong)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span className="font-pixel" style={{ fontSize: "8px", letterSpacing: "0.08em" }}>
            {isFamily ? "★ FAMILY MEMBER" : "◈ ACTIVE MEMBER"}
          </span>
          <span className="font-lcd" style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
            {profile.is_active_seeker && strikes < 2 && (
              <span className="pixel-blink" style={{ color: "var(--accent-success)", textShadow: "0 0 6px var(--accent-success)" }}>● SEEKING SQUAD</span>
            )}
            {profile.no_show_strikes === 1 ? "⚠ 1 STRIKE" : ""}
            {profile.account_status === "suspended" ? "■ SUSPENDED" : ""}
          </span>
        </div>

        <div style={{ padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
            
            {/* Avatar block with green pulse seeker badge */}
            <div style={{ position: "relative" }}>
              <div className="nokia-lcd" style={{
                width: "60px", height: "60px", fontSize: "36px",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, padding: "0",
                textShadow: "0 0 10px var(--accent-primary)",
              }}>
                {profile.avatar_icon || "👾"}
              </div>
              {profile.is_active_seeker && strikes < 2 && (
                <div style={{
                  position: "absolute",
                  bottom: "-4px",
                  right: "-4px",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: "var(--accent-success)",
                  border: "2px solid var(--border-strong)",
                  boxShadow: "0 0 8px var(--accent-success)"
                }} className="pixel-blink" />
              )}
            </div>

            {/* Main info */}
            <div style={{ flex: 1, minWidth: "150px" }}>
              <div className="font-lcd" style={{ fontSize: "22px", color: "var(--accent-primary)", lineHeight: 1, display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span>{firstName}</span>
                <span style={{ fontSize: "16px" }}>{profile.avatar_icon || "👾"}</span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-primary)", fontWeight: "600", marginBottom: "8px" }}>
                {profile.full_name || "Anonymous Member"}
                {profile.is_partner && profile.business_name && (
                  <span style={{ marginLeft: "8px", color: "var(--accent-success)", fontWeight: "bold" }}>
                    [▤ {profile.business_name.toUpperCase()}]
                  </span>
                )}
              </div>

              {/* Tag Badges */}
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "8px" }}>
                <span className="nokia-badge font-pixel" style={{ fontSize: "6px" }}>
                  🏙 {profile.city?.toUpperCase() || "KARACHI"}
                </span>
                {profile.is_partner && (
                  <span className="nokia-badge nokia-badge-success font-pixel" style={{ fontSize: "6px" }}>
                    ● PARTNER
                  </span>
                )}
                {profile.vibe_tags && profile.vibe_tags.map(tag => (
                  <span key={tag} className="nokia-badge font-pixel" style={{ fontSize: "6px", background: "var(--bg-sunken)", border: "1px solid var(--accent-primary)" }}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Strikes warnings */}
              {profile.no_show_strikes === 1 && (
                <div className="nokia-badge nokia-badge-warning" style={{ marginBottom: "8px", fontSize: "7px" }}>
                  ⚠ FLAKE RISK (1 STRIKE)
                </div>
              )}
              {profile.account_status === "suspended" && (
                <div className="nokia-badge nokia-badge-danger" style={{ marginBottom: "8px", fontSize: "7px" }}>
                  ■ SUSPENDED (2+ STRIKES)
                </div>
              )}

              {/* Bio */}
              {profile.bio ? (
                <div className="nokia-panel-sunken" style={{ padding: "8px 10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", lineHeight: "1.4" }}>
                    &ldquo;{profile.bio}&rdquo;
                  </span>
                </div>
              ) : (
                <div style={{ fontSize: "10px", color: "var(--text-muted)", fontStyle: "italic", marginBottom: "8px" }}>
                  No bio yet. Just matching the vibe.
                </div>
              )}

              {/* Social Link */}
              {profile.social_link && (
                <a
                  href={profile.social_link.startsWith("http") ? profile.social_link : `https://${profile.social_link}`}
                  target="_blank" rel="noopener noreferrer"
                  className="font-pixel"
                  style={{ fontSize: "7px", color: "var(--accent-primary)", textDecoration: "none", letterSpacing: "0.04em" }}
                >
                  ◉ {profile.social_link.replace(/^(https?:\/\/)?(www\.)?/, "")}
                </a>
              )}
            </div>
          </div>

          <div className="nokia-divider" />

          {/* Social Friendship Buttons */}
          {isSelf ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", width: "100%" }}>
              <Link href="/profile/edit" className="nokia-btn nokia-btn-primary" style={{ fontSize: "8px", textDecoration: "none", justifyContent: "center" }}>
                ✎ EDIT PROFILE
              </Link>
              <SignOutButton />
            </div>
          ) : isLoading ? (
            <div className="nokia-btn" style={{ width: "100%", fontSize: "8px", opacity: 0.6, justifyContent: "center" }}>
              <span className="pixel-blink">▌ UPDATING...</span>
            </div>
          ) : !friendship ? (
            <button onClick={handleAddFriend} className="nokia-btn nokia-btn-primary" style={{ width: "100%", fontSize: "8px" }}>
              ♥ ADD FRIEND
            </button>
          ) : friendship.status === "accepted" ? (
            <div style={{ display: "flex", gap: "6px" }}>
              <div className="nokia-badge nokia-badge-success" style={{ flex: 1, textAlign: "center", padding: "8px" }}>✓ FRIENDS</div>
              <button onClick={handleRemoveOrDecline} className="nokia-btn nokia-btn-danger" style={{ fontSize: "7px" }}>
                ✕ REMOVE
              </button>
            </div>
          ) : friendship.user_id_1 === currentUserId ? (
            <div style={{ display: "flex", gap: "6px" }}>
              <div className="nokia-btn" style={{ flex: 1, fontSize: "7px", justifyContent: "center" }}>▌ REQUEST PENDING</div>
              <button onClick={handleRemoveOrDecline} className="nokia-btn" style={{ fontSize: "7px" }}>✕ CANCEL</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={handleRemoveOrDecline} className="nokia-btn nokia-btn-danger" style={{ fontSize: "7px", flex: 1 }}>✕ DECLINE</button>
              <button onClick={handleAcceptRequest} className="nokia-btn nokia-btn-primary" style={{ fontSize: "7px", flex: 1 }}>✓ ACCEPT</button>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Nokia LCD Tab Navigation ─────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "12px", overflowX: "auto", paddingBottom: "4px" }}>
        <button
          className={activeTab === "overview" ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
          style={{ fontSize: "7px", flex: 1, padding: "8px 4px", whiteSpace: "nowrap", justifyContent: "center" }}
          onClick={() => setActiveTab("overview")}
        >
          ● OVERVIEW
        </button>
        <button
          className={activeTab === "memories" ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
          style={{ fontSize: "7px", flex: 1, padding: "8px 4px", whiteSpace: "nowrap", justifyContent: "center" }}
          onClick={() => setActiveTab("memories")}
        >
          📷 MEMORIES ({memories.length})
        </button>
        <button
          className={activeTab === "timeline" ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
          style={{ fontSize: "7px", flex: 1, padding: "8px 4px", whiteSpace: "nowrap", justifyContent: "center" }}
          onClick={() => setActiveTab("timeline")}
        >
          ★ TIMELINE
        </button>
        {isSelf && (
          <button
            className={activeTab === "activity" ? "nokia-btn nokia-btn-primary" : "nokia-btn"}
            style={{ fontSize: "7px", flex: 1, padding: "8px 4px", whiteSpace: "nowrap", justifyContent: "center" }}
            onClick={() => setActiveTab("activity")}
          >
            ▤ PRIVATE LEDGER
          </button>
        )}
      </div>

      {/* ── 3. Tab Contents ─────────────────────────────────────────────────── */}

      {/* TAB A: OVERVIEW */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          
          {/* Vibe Score Signal Meter & Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
            
            {/* Nokia Vibe Score card */}
            <div className="nokia-panel" style={{ padding: "12px" }}>
              <span className="font-pixel" style={{ fontSize: "7px", color: "var(--text-muted)", display: "block", marginBottom: "8px", letterSpacing: "0.08em" }}>
                📶 VIBE METER (TRUST)
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "space-between" }}>
                <span className="font-lcd" style={{ fontSize: "28px", color: "var(--accent-success)", letterSpacing: "0.04em" }}>
                  {signalBars}
                </span>
                <div style={{ textAlign: "right" }}>
                  <span className="font-lcd" style={{ fontSize: "24px", color: "var(--text-primary)", display: "block", lineHeight: "1" }}>
                    {vibeScore}%
                  </span>
                  <span style={{ fontSize: "8px", color: "var(--text-muted)" }}>
                    {totalFeedback} RATINGS
                  </span>
                </div>
              </div>
              <div className="nokia-divider" style={{ margin: "8px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)" }}>
                <span>♥ MATCHED: {vibeMatchedCount}</span>
                <span>😐 MEH: {mehCount}</span>
                <span>✕ FLAKES: {flakeCount}</span>
              </div>
            </div>

            {/* Quick Stats list */}
            <div className="nokia-panel" style={{ padding: "12px" }}>
              <span className="font-pixel" style={{ fontSize: "7px", color: "var(--text-muted)", display: "block", marginBottom: "8px", letterSpacing: "0.08em" }}>
                ★ ACTIVITY METRICS
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                  <span style={{ color: "var(--text-muted)" }}>🔥 EVENT STREAK:</span>
                  <span className="font-pixel" style={{ color: "var(--accent-warning)", fontSize: "8px" }}>
                    {strikes === 0 && totalAttended > 0 ? `🔥 ${totalAttended} STREAK` : "0 STREAK"}
                  </span>
                </div>
                
                {/* Host vs guest ratio bar */}
                <div style={{ marginTop: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "var(--text-muted)", marginBottom: "3px" }}>
                    <span>HOST: {completedHosted}</span>
                    <span>GUEST: {approvedGuestsCount}</span>
                  </div>
                  <div style={{
                    width: "100%", height: "8px", background: "var(--bg-sunken)",
                    border: "1px solid var(--border-strong)", borderRadius: "1px", overflow: "hidden", display: "flex"
                  }}>
                    <div style={{ width: `${hostPercentage}%`, height: "100%", background: "var(--accent-primary)" }} />
                    <div style={{ width: `${guestPercentage}%`, height: "100%", background: "var(--accent-warning)" }} />
                  </div>
                </div>

                {/* Mutual connections count */}
                {!isSelf && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px", fontSize: "11px" }}>
                    <span style={{ color: "var(--text-muted)" }}>👥 MUTUAL CONNECTIONS:</span>
                    <span className="font-pixel" style={{ fontSize: "7px", color: "var(--accent-primary)" }}>{mutualFriendsCount} MUTUAL</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Mutual Friends Avatar Panel (Showcase) */}
          {!isSelf && mutualFriends.length > 0 && (
            <div className="nokia-panel-sunken" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px", background: "var(--bg-sunken)", border: "2px solid var(--border-strong)", borderRadius: "2px" }}>
              <span className="font-pixel" style={{ fontSize: "7px", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                MUTUAL FRIENDS:
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                {mutualFriends.map(friend => (
                  <Link key={friend.id} href={`/profile/${friend.id}`} className="nokia-btn" style={{
                    fontSize: "7px", padding: "2px 6px", display: "inline-flex", gap: "4px", textDecoration: "none", alignItems: "center"
                  }}>
                    <span>{friend.avatar_icon || "👾"}</span>
                    <span>{(friend.full_name || "").split(" ")[0].toUpperCase()}</span>
                  </Link>
                ))}
                {mutualFriendsCount > 3 && (
                  <span style={{ fontSize: "9px", color: "var(--text-muted)", marginLeft: "4px" }}>+{mutualFriendsCount - 3} MORE</span>
                )}
              </div>
            </div>
          )}

          {/* Profile Completeness Signal Meter (Self Nudge) */}
          {isSelf && completeness < 100 && (
            <div className="nokia-panel-sunken" style={{
              padding: "10px 14px", background: "var(--bg-sunken)", border: "2px solid var(--accent-warning)", borderRadius: "2px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px"
            }}>
              <div>
                <span className="font-pixel" style={{ display: "block", fontSize: "7px", color: "var(--accent-warning)", letterSpacing: "0.08em" }}>
                  📶 COMPLETE YOUR VIBE PROFILE ({completeness}%)
                </span>
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                  Add avatar, bio, city, social link, and tags to unlock the TRUSTED badges room!
                </span>
              </div>
              <div className="font-lcd" style={{ fontSize: "18px", color: "var(--accent-warning)" }}>
                {completeness >= 80 ? "▰▰▰▰▱" : completeness >= 60 ? "▰▰▰▱▱" : completeness >= 40 ? "▰▰▱▱▱" : "▰▱▱▱▱"}
              </div>
            </div>
          )}

          {/* Earned Badges Case (Neon retro pixel grids) */}
          <div>
            <div className="font-pixel" style={{ fontSize: "7px", color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ flex: 1, height: "1px", background: "var(--border-mid)" }} />
              ★ EARNED BADGES ROOM
              <div style={{ flex: 1, height: "1px", background: "var(--border-mid)" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px" }}>
              {badgeDefinitions.map(({ id, icon, label, desc, earned, progress }) => (
                <div
                  key={id}
                  className="nokia-panel"
                  style={{
                    padding: "10px",
                    opacity: earned ? 1 : 0.45,
                    border: earned ? "2px solid var(--accent-primary)" : "2px dashed var(--border-strong)",
                    position: "relative",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                  title={`${label}: ${desc} (${progress})`}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <span className="font-lcd" style={{
                        fontSize: "20px",
                        color: earned ? "var(--accent-primary)" : "var(--text-muted)",
                        textShadow: earned ? "0 0 6px var(--accent-primary)" : "none"
                      }}>{icon}</span>
                      <span className="font-pixel" style={{
                        fontSize: "6.5px",
                        color: earned ? "var(--text-primary)" : "var(--text-muted)",
                        fontWeight: "bold"
                      }}>{label}</span>
                    </div>
                    <p style={{ fontSize: "9.5px", color: "var(--text-muted)", lineHeight: "1.2", marginBottom: "6px" }}>
                      {desc}
                    </p>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                    <span className="font-pixel" style={{ fontSize: "5.5px", color: "var(--text-muted)" }}>{progress}</span>
                    <span className="font-pixel" style={{
                      fontSize: "5.5px",
                      color: earned ? "var(--accent-success)" : "var(--text-muted)",
                      fontWeight: "bold"
                    }}>
                      {earned ? "✓ UNLOCKED" : "🔒 LOCKED"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB B: MEMORIES (Polaroid CRT Grid) */}
      {activeTab === "memories" && (
        <div>
          {/* Upload panel for self */}
          {isSelf && eligibleBeaconsForMemory.length > 0 && (
            <div className="nokia-panel" style={{ padding: "14px", marginBottom: "14px", background: "var(--bg-sunken)", border: "2px solid var(--accent-primary)" }}>
              <span className="font-pixel" style={{ display: "block", fontSize: "8px", color: "var(--accent-primary)", marginBottom: "8px" }}>
                📷 POST EVENT MEMORY (SHARE THE VIBE)
              </span>

              {uploadError && (
                <div style={{ fontSize: "11px", color: "var(--accent-danger)", marginBottom: "8px" }}>✕ {uploadError}</div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "9px", color: "var(--text-muted)", marginBottom: "4px" }}>Select completed beacon:</label>
                  <select
                    value={uploadBeaconId}
                    onChange={(e) => setUploadBeaconId(e.target.value)}
                    className="nokia-input"
                    style={{ background: "var(--bg-base)" }}
                  >
                    <option value="">-- CHOOSE A RECENT EVENT --</option>
                    {eligibleBeaconsForMemory.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.title.toUpperCase()} ({b.isHost ? "HOSTED" : "ATTENDED"})
                      </option>
                    ))}
                  </select>
                </div>

                {uploadBeaconId && (
                  <>
                    <div>
                      <label style={{ display: "block", fontSize: "9px", color: "var(--text-muted)", marginBottom: "4px" }}>Caption thoughts (max 280 chars):</label>
                      <input
                        type="text"
                        placeholder="What was the vibe like?"
                        maxLength={280}
                        value={uploadCaption}
                        onChange={(e) => setUploadCaption(e.target.value)}
                        className="nokia-input"
                      />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        type="checkbox"
                        id="is_public_memory"
                        checked={uploadIsPublic}
                        onChange={(e) => setUploadIsPublic(e.target.checked)}
                        style={{ width: "14px", height: "14px" }}
                      />
                      <label htmlFor="is_public_memory" style={{ fontSize: "10px", color: "var(--text-primary)" }}>
                        Showcase on profile to public & future vetting hosts?
                      </label>
                    </div>

                    <div style={{ marginTop: "6px" }}>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={processAndUploadMemory}
                      />
                      <button
                        type="button"
                        disabled={isUploading}
                        className="nokia-btn nokia-btn-primary"
                        style={{ width: "100%", fontSize: "8px", justifyContent: "center" }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {isUploading ? <span className="pixel-blink">COMPRESSING & UPLOADING...</span> : "✓ SELECT & COMPRESS PHOTO"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Grid display */}
          {loadingMemories ? (
            <div style={{ padding: "30px", textAlign: "center" }}>
              <span className="font-pixel pixel-blink" style={{ fontSize: "8px" }}>LOADING RETRO MEMORIES...</span>
            </div>
          ) : memories.length === 0 ? (
            <div className="nokia-panel-sunken" style={{ padding: "40px 20px", textAlign: "center" }}>
              <span className="font-lcd" style={{ fontSize: "28px", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>📷</span>
              <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                No vibe memories showcased yet.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
              {memories.map((m) => (
                <div
                  key={m.id}
                  className="nokia-panel"
                  style={{
                    padding: "8px",
                    background: "var(--bg-sunken)",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "3px",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
                  }}
                >
                  {/* Polaroid Frame */}
                  <div style={{
                    width: "100%",
                    position: "relative",
                    background: "#0a0a0a",
                    border: "2px solid var(--border-strong)",
                    overflow: "hidden",
                    aspectRatio: "1"
                  }}>
                    <img
                      src={m.image_url}
                      alt={m.caption || "Memory"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        filter: "grayscale(100%) contrast(1.2)",
                        transition: "filter 0.3s"
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.filter = "grayscale(0%) contrast(1)"; }}
                      onMouseOut={(e) => { e.currentTarget.style.filter = "grayscale(100%) contrast(1.2)"; }}
                    />
                    
                    {/* Privacy marker badge overlay */}
                    <div style={{
                      position: "absolute",
                      top: "6px",
                      right: "6px",
                      background: m.is_public ? "var(--accent-primary)" : "var(--bg-base)",
                      color: m.is_public ? "white" : "var(--text-muted)",
                      padding: "2px 6px",
                      fontSize: "6px",
                      border: "1px solid var(--border-strong)"
                    }} className="font-pixel">
                      {m.is_public ? "● PUBLIC" : "🔒 FRIENDS"}
                    </div>
                  </div>

                  {/* Polaroid Caption bottom */}
                  <div style={{ padding: "8px 4px 4px 4px" }}>
                    <span className="font-pixel" style={{ fontSize: "6.5px", color: "var(--accent-primary)", display: "block", marginBottom: "4px" }}>
                      ◈ {m.beacon_title.toUpperCase()}
                    </span>
                    {m.caption ? (
                      <p style={{ fontSize: "11px", fontStyle: "italic", color: "var(--text-primary)", lineHeight: "1.3", margin: "0" }}>
                        &ldquo;{m.caption}&rdquo;
                      </p>
                    ) : (
                      <p style={{ fontSize: "9px", color: "var(--text-muted)", margin: "0" }}>No caption shared.</p>
                    )}
                    
                    <span style={{ fontSize: "8px", color: "var(--text-muted)", display: "block", marginTop: "6px" }}>
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>

                    {/* Owner controls */}
                    {isSelf && (
                      <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                        <button
                          onClick={() => handleTogglePrivacy(m.id, m.is_public)}
                          className="nokia-btn"
                          style={{ fontSize: "6.5px", flex: 1, padding: "2px 4px", justifyContent: "center" }}
                        >
                          {m.is_public ? "MAKE PRIVATE" : "MAKE PUBLIC"}
                        </button>
                        <button
                          onClick={() => handleDeleteMemory(m.id)}
                          className="nokia-btn nokia-btn-danger"
                          style={{ fontSize: "6.5px", padding: "2px 4px" }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB C: TIMELINE (Public Beacon History) */}
      {activeTab === "timeline" && (
        <div className="nokia-panel" style={{ padding: "16px" }}>
          <span className="font-pixel" style={{ display: "block", fontSize: "8px", color: "var(--accent-primary)", marginBottom: "12px" }}>
            ★ PARTICIPATION HISTORY & STATUS RECORD
          </span>

          {/* Group and filter all completed beacons & applications */}
          {(() => {
            const timelineEvents: any[] = [];

            // Add hosted beacons
            hostedBeacons.forEach((b: any) => {
              if (b.status === "completed" || b.status === "active") {
                timelineEvents.push({
                  id: b.id,
                  title: b.title,
                  category: b.category,
                  date: b.scheduled_at || b.created_at,
                  role: "host",
                  outcome: b.status === "completed" ? "HOSTED" : "LIVE HOST",
                  color: "var(--accent-success)"
                });
              }
            });

            // Add joined beacons (approved guests)
            joinedApplications.forEach((app: any) => {
              if (app.status === "approved" && app.beacons) {
                timelineEvents.push({
                  id: app.beacons.id,
                  title: app.beacons.title,
                  category: app.beacons.category,
                  date: app.beacons.scheduled_at || app.created_at,
                  role: "guest",
                  outcome: app.beacons.status === "completed" ? "JOINED" : "SQUAD CHAT",
                  color: "var(--accent-primary)"
                });
              }
            });

            // Sort newest first
            timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            if (timelineEvents.length === 0) {
              return (
                <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: "11px" }}>
                  No public beacon history recorded yet.
                </div>
              );
            }

            return (
              <div style={{ position: "relative", paddingLeft: "20px" }}>
                {/* Timeline Line */}
                <div style={{
                  position: "absolute",
                  left: "7px",
                  top: "6px",
                  bottom: "6px",
                  width: "2px",
                  background: "var(--border-strong)"
                }} />

                {/* Timeline Nodes */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {timelineEvents.map((ev, idx) => (
                    <div key={idx} style={{ position: "relative" }}>
                      
                      {/* Node Bullet Dot */}
                      <div style={{
                        position: "absolute",
                        left: "-18px",
                        top: "4px",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: ev.role === "host" ? "var(--accent-success)" : "var(--accent-primary)",
                        border: "2px solid var(--border-strong)",
                        boxShadow: "0 0 6px rgba(0,0,0,0.5)"
                      }} />

                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <span className="font-pixel" style={{ fontSize: "7px", color: ev.color }}>
                            [{ev.outcome}]
                          </span>
                          <span className="font-pixel" style={{ fontSize: "6.5px", background: "var(--bg-sunken)", padding: "1px 4px", border: "1px solid var(--border-mid)" }}>
                            {ev.category.toUpperCase()}
                          </span>
                          <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                            {new Date(ev.date).toLocaleDateString()}
                          </span>
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-primary)" }}>
                          {ev.title.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB D: PRIVATE ACTIVITY LEDGER (Self Only) */}
      {isSelf && activeTab === "activity" && (
        <div className="nokia-panel" style={{ padding: "16px" }}>
          <span className="font-pixel" style={{ display: "block", fontSize: "8px", color: "var(--accent-warning)", marginBottom: "12px" }}>
            ▤ GRANULAR AUDIT FEED (SELF-MONITORING ONLY)
          </span>

          {(() => {
            const feedItems: any[] = [];

            // Add hosted entries
            hostedBeacons.forEach(b => {
              feedItems.push({
                type: "HOSTED",
                title: b.title,
                date: b.created_at,
                detail: `Created squad beacon with ${b.total_slots} capacity.`,
                color: "var(--accent-success)"
              });
              if (b.status === "cancelled") {
                feedItems.push({
                  type: "CANCELLED",
                  title: b.title,
                  date: b.created_at,
                  detail: `Beacon cancelled with zero slots filled.`,
                  color: "var(--accent-danger)"
                });
              }
            });

            // Add all application entries (withdrawn, approved, declined, pending)
            joinedApplications.forEach(app => {
              if (app.beacons) {
                let statusLabel = app.status.toUpperCase();
                let statusColor = "var(--text-primary)";
                let statusDesc = "";

                if (app.status === "pending") {
                  statusColor = "var(--text-muted)";
                  statusDesc = "Join request is currently pending host approval.";
                } else if (app.status === "approved") {
                  statusColor = "var(--accent-success)";
                  statusDesc = "Approved! Access to squad chat is open.";
                } else if (app.status === "declined") {
                  statusColor = "var(--accent-danger)";
                  statusDesc = "Join request was declined by the host.";
                } else if (app.status === "withdrawn") {
                  statusColor = "var(--text-muted)";
                  statusDesc = "You withdrew your application from the squad.";
                }

                feedItems.push({
                  type: statusLabel,
                  title: app.beacons.title,
                  date: app.created_at,
                  detail: statusDesc,
                  color: statusColor
                });
              }
            });

            // Sort newest first
            feedItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            if (feedItems.length === 0) {
              return (
                <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: "11px" }}>
                  No granular logs available yet.
                </div>
              );
            }

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {feedItems.map((item, idx) => (
                  <div key={idx} className="nokia-panel-sunken" style={{ padding: "8px 12px", background: "var(--bg-sunken)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span className="font-pixel" style={{ fontSize: "6.5px", color: item.color }}>
                        ◈ {item.type}
                      </span>
                      <span style={{ fontSize: "8.5px", color: "var(--text-muted)" }}>
                        {new Date(item.date).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-primary)", marginBottom: "2px" }}>
                      {item.title.toUpperCase()}
                    </div>
                    <p style={{ fontSize: "9.5px", color: "var(--text-muted)", margin: "0", lineHeight: "1.3" }}>
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

    </main>
  );
}
