"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Beacon, BeaconCategory } from "@/lib/supabase/types";
import { approveApplicant, declineApplicant, flagNoShow } from "@/app/actions/applications";
import { updateBeaconCapacity, cancelBeacon, updateFullBeacon } from "@/app/actions/beacons";
import { getBeaconMessages, sendBeaconMessage } from "@/app/actions/chat";
import UniversalShareModal from "@/components/share/UniversalShareModal";
import {
  ArrowLeft,
  Radio,
  Users,
  Send,
  Check,
  X,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  Crown,
  User,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Share2,
  Edit3,
  Save,
  MessageSquare,
} from "lucide-react";

interface ApplicationItem {
  id: string;
  beacon_id: string;
  applicant_id: string;
  status: "pending" | "approved" | "declined";
  created_at: string;
  profiles: {
    id: string;
    full_name: string | null;
    bio: string | null;
    phone: string | null;
    city: string | null;
    avatar_icon: string | null;
  } | null;
}

interface BeaconSquadHubClientProps {
  beacon: Beacon;
  initialApplications: ApplicationItem[];
  currentUserId: string;
  isHost: boolean;
  userApplicationStatus: string | null;
  hostProfile?: any;
}

const CATEGORY_NAMES: Record<BeaconCategory, string> = {
  sports: "Sports & Padel",
  casual: "Chai & Casual",
  nightlife: "Nightlife & Raves",
};

export default function BeaconSquadHubClient({
  beacon: initialBeacon,
  initialApplications,
  currentUserId,
  isHost,
  userApplicationStatus,
  hostProfile,
}: BeaconSquadHubClientProps) {
  const router = useRouter();
  const [beacon, setBeacon] = useState<Beacon>(initialBeacon);
  const [applications, setApplications] = useState<ApplicationItem[]>(initialApplications);
  const [activeTab, setActiveTab] = useState<"applicants" | "squad" | "edit">("applicants");
  const [mobileSection, setMobileSection] = useState<"squad" | "chat">("squad");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Edit Beacon state (Host all-in-one suite)
  const [editTitle, setEditTitle] = useState(beacon.title);
  const [editDescription, setEditDescription] = useState(beacon.description || "");
  const [editCategory, setEditCategory] = useState<BeaconCategory>(beacon.category);
  const [editLocation, setEditLocation] = useState(beacon.location_name || "");
  const [editScheduledAt, setEditScheduledAt] = useState(beacon.scheduled_at || "");
  const [editMapsUrl, setEditMapsUrl] = useState(beacon.google_maps_url || "");
  const [editCapacity, setEditCapacity] = useState(beacon.total_slots);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);

  // Capacity adjustment
  const [capacity, setCapacity] = useState(beacon.total_slots);
  const [isUpdatingCapacity, setIsUpdatingCapacity] = useState(false);

  // Chat state
  const [showShareModal, setShowShareModal] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMessagesContainerRef = useRef<HTMLDivElement>(null);
  const isInitialChatLoadRef = useRef(true);

  const pendingApps = applications.filter((a) => a.status === "pending");
  const approvedApps = applications.filter((a) => a.status === "approved");

  // Fetch messages
  const loadMessages = async () => {
    try {
      const res = await getBeaconMessages(beacon.id);
      if (res.success && res.data) {
        setMessages(res.data);
      }
    } catch {} finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3500);
    return () => clearInterval(interval);
  }, [beacon.id]);

  // Scroll inner chat container only — NEVER hijack or scroll the whole browser page window!
  useEffect(() => {
    const el = chatMessagesContainerRef.current;
    if (!el) return;

    if (isInitialChatLoadRef.current) {
      el.scrollTop = el.scrollHeight;
      isInitialChatLoadRef.current = false;
      return;
    }

    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // Handle Save Beacon Edit (All-in-one suite)
  const handleSaveBeaconEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      setEditErrorMsg("Beacon title is required.");
      return;
    }
    setIsSavingEdit(true);
    setEditErrorMsg(null);
    setEditSuccessMsg(null);

    try {
      const res = await updateFullBeacon(beacon.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        category: editCategory,
        location_name: editLocation.trim() || null,
        scheduled_at: editScheduledAt || null,
        google_maps_url: editMapsUrl.trim() || null,
        total_slots: editCapacity,
      });

      if (res.success) {
        setBeacon((prev) => ({
          ...prev,
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          category: editCategory,
          location_name: editLocation.trim() || null,
          scheduled_at: editScheduledAt || null,
          google_maps_url: editMapsUrl.trim() || null,
          total_slots: editCapacity,
        }));
        setCapacity(editCapacity);
        setEditSuccessMsg("Beacon plans updated successfully! Attendees notified.");
        setTimeout(() => setEditSuccessMsg(null), 4000);
      } else {
        setEditErrorMsg(res.error);
      }
    } catch {
      setEditErrorMsg("Network error updating beacon.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Approve
  const handleApprove = async (appId: string, applicantName: string) => {
    setActionLoadingId(appId);
    setActionFeedback(null);
    try {
      const res = await approveApplicant(appId);
      if (res.success) {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: "approved" } : a))
        );
        setBeacon((prev) => ({
          ...prev,
          filled_slots: Math.min(prev.filled_slots + 1, prev.total_slots),
        }));
        setActionFeedback(`${applicantName} added to the squad!`);
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch {} finally {
      setActionLoadingId(null);
    }
  };

  // Handle Decline
  const handleDecline = async (appId: string) => {
    setActionLoadingId(appId);
    setActionFeedback(null);
    try {
      const res = await declineApplicant(appId);
      if (res.success) {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: "declined" } : a))
        );
      }
    } catch {} finally {
      setActionLoadingId(null);
    }
  };

  // Handle Capacity Change
  const handleCapacityChange = async (delta: number) => {
    const nextCap = capacity + delta;
    if (nextCap < beacon.filled_slots || nextCap < 2 || nextCap > 30) return;
    setCapacity(nextCap);
    setIsUpdatingCapacity(true);
    try {
      const res = await updateBeaconCapacity(beacon.id, nextCap);
      if (res.success) {
        setBeacon((prev) => ({ ...prev, total_slots: nextCap }));
      }
    } catch {} finally {
      setIsUpdatingCapacity(false);
    }
  };

  // Handle Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const content = newMessage.trim();
    setNewMessage("");
    setIsSending(true);

    try {
      const res = await sendBeaconMessage(beacon.id, content);
      if (res.success) {
        await loadMessages();
        if (chatMessagesContainerRef.current) {
          chatMessagesContainerRef.current.scrollTop = chatMessagesContainerRef.current.scrollHeight;
        }
      }
    } catch {} finally {
      setIsSending(false);
    }
  };

  const formattedDate = beacon.scheduled_at
    ? new Date(beacon.scheduled_at).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Tonight, Time TBD";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060408",
        color: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        fontFamily:
          "var(--font-display), 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ── TOP HEADER BAR ────────────────────────────────────────────── */}
      <header
        style={{
          borderBottom: "1px solid rgba(255, 90, 31, 0.2)",
          background: "rgba(12, 7, 18, 0.95)",
          backdropFilter: "blur(20px)",
          padding: "14px clamp(16px, 2.5vw, 36px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <Link
            href="/dashboard"
            style={{
              textDecoration: "none",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "12px",
              padding: "8px 14px",
              color: "#FFFFFF",
              fontSize: "12.5px",
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
            className="hover:bg-white/15 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#FFA05C]" />
            <span>Back to Lobby Radar</span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #FF6F26, #FF5A1F)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(255, 90, 31, 0.45)",
              }}
            >
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h1
                  style={{
                    fontSize: "18px",
                    fontWeight: 900,
                    margin: 0,
                    letterSpacing: "-0.01em",
                    color: "#FFFFFF",
                  }}
                >
                  {beacon.title}
                </h1>
                {isHost && (
                  <span
                    style={{
                      background: "rgba(255, 90, 31, 0.2)",
                      border: "1px solid rgba(255, 90, 31, 0.45)",
                      color: "#FFA05C",
                      fontSize: "10.5px",
                      fontWeight: 800,
                      padding: "2px 7px",
                      borderRadius: "6px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Crown className="w-3 h-3 text-[#FF5A1F]" /> YOU ARE HOST
                  </span>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "11.5px",
                  color: "rgba(255, 255, 255, 0.6)",
                  marginTop: "2px",
                }}
              >
                <span>{CATEGORY_NAMES[beacon.category]}</span>
                <span>•</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Calendar className="w-3 h-3 text-[#FFA05C]" /> {formattedDate}
                </span>
                {beacon.location_name && (
                  <>
                    <span>•</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <MapPin className="w-3 h-3 text-[#FFA05C]" /> {beacon.location_name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions & Capacity Indicator Pill */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Mobile Switcher (Visible on < 768px) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              padding: "3px",
              borderRadius: "10px",
            }}
            className="md:hidden"
          >
            <button
              type="button"
              onClick={() => setMobileSection("squad")}
              style={{
                background: mobileSection === "squad" ? "linear-gradient(135deg, #FF6F26, #FF5A1F)" : "transparent",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "7px",
                padding: "5px 9px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Squad &amp; Edit
            </button>
            <button
              type="button"
              onClick={() => setMobileSection("chat")}
              style={{
                background: mobileSection === "chat" ? "linear-gradient(135deg, #FF6F26, #FF5A1F)" : "transparent",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "7px",
                padding: "5px 9px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Squad Chat
            </button>
          </div>

          {/* Host Edit Plans Button */}
          {isHost && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("edit");
                setMobileSection("squad");
              }}
              style={{
                background: activeTab === "edit"
                  ? "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)"
                  : "rgba(255, 255, 255, 0.07)",
                border: "1px solid rgba(255, 90, 31, 0.4)",
                color: "#FFFFFF",
                borderRadius: "12px",
                padding: "7px 14px",
                fontSize: "12.5px",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                boxShadow: activeTab === "edit" ? "0 4px 14px rgba(255,90,31,0.4)" : "none",
              }}
              className="hover:scale-[1.02] active:scale-98 transition-transform"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#FFA05C]" />
              <span>Edit Plans</span>
            </button>
          )}

          {beacon.status === "active" && (
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              style={{
                background: "rgba(255, 111, 38, 0.12)",
                border: "1px solid rgba(255, 111, 38, 0.35)",
                color: "#FFA05C",
                borderRadius: "12px",
                padding: "7px 14px",
                fontSize: "12.5px",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
              }}
              className="hover:scale-[1.02] active:scale-98 transition-transform"
              title="Share this meetup with friends or on socials"
            >
              <Share2 className="w-3.5 h-3.5 text-[#FF6F26]" />
              <span>Share Link</span>
            </button>
          )}

          <div
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "12px",
              padding: "7px 14px",
              fontSize: "12.5px",
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              color: "#FFA05C",
            }}
          >
            <Users className="w-4 h-4 text-[#FF5A1F]" />
            <span>
              {beacon.filled_slots}/{beacon.total_slots} Squad Members
            </span>
          </div>

          <div
            style={{
              background: "rgba(39, 201, 63, 0.12)",
              border: "1px solid rgba(39, 201, 63, 0.3)",
              color: "#27C93F",
              borderRadius: "12px",
              padding: "7px 14px",
              fontSize: "11.5px",
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-[#27C93F] animate-pulse" />
            <span>FREQUENCY LIVE</span>
          </div>
        </div>
      </header>

      {/* ── SPLIT WORKSPACE: SQUAD SELECTION (LEFT) + INSTAGRAM CHAT (RIGHT) ── */}
      <div
        style={{
          flex: 1,
          minHeight: "calc(100vh - 75px)",
        }}
        className="grid grid-cols-1 md:grid-cols-[clamp(340px,32vw,420px)_1fr]"
      >
        {/* ── LEFT PANE: SQUAD SELECTION & APPLICANT AUDIENCE VETTING ───── */}
        <aside
          style={{
            borderRight: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(10, 6, 15, 0.75)",
            backdropFilter: "blur(14px)",
            flexDirection: "column",
            overflowY: "auto",
            maxHeight: "calc(100vh - 75px)",
          }}
          className={`${mobileSection === "squad" ? "flex" : "hidden md:flex"} w-full`}
        >
          {/* Host Action Toast */}
          {actionFeedback && (
            <div
              style={{
                margin: "12px 14px 0",
                background: "rgba(39, 201, 63, 0.15)",
                border: "1px solid rgba(39, 201, 63, 0.4)",
                color: "#27C93F",
                borderRadius: "10px",
                padding: "8px 12px",
                fontSize: "12px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{actionFeedback}</span>
            </div>
          )}

          {/* Pane Header */}
          <div
            style={{
              padding: "18px 18px 12px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 900, margin: 0, color: "#FFFFFF" }}>
                  {isHost ? "Squad Selection & Audience" : "Squad Members"}
                </h2>
                <p style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.55)", margin: "2px 0 0" }}>
                  {isHost
                    ? "Vet applicants & curate your party crowd"
                    : "Verified members currently in this squad"}
                </p>
              </div>

              {isHost && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "8px",
                    padding: "2px 6px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleCapacityChange(-1)}
                    disabled={isUpdatingCapacity || capacity <= beacon.filled_slots}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: capacity <= beacon.filled_slots ? "rgba(255,255,255,0.2)" : "#fff",
                      cursor: capacity <= beacon.filled_slots ? "not-allowed" : "pointer",
                      padding: "3px",
                      display: "flex",
                    }}
                    title="Reduce Slots"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "#FFA05C", minWidth: "16px", textAlign: "center" }}>
                    {capacity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCapacityChange(1)}
                    disabled={isUpdatingCapacity || capacity >= 30}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                      padding: "3px",
                      display: "flex",
                    }}
                    title="Add Slots"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Selection Tabs for Host */}
            {isHost && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "4px",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "3px",
                  borderRadius: "12px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab("applicants")}
                  style={{
                    background:
                      activeTab === "applicants"
                        ? "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)"
                        : "transparent",
                    color: activeTab === "applicants" ? "#FFFFFF" : "rgba(255, 255, 255, 0.7)",
                    border: "none",
                    borderRadius: "9px",
                    padding: "7px 4px",
                    fontSize: "11.5px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    boxShadow: activeTab === "applicants" ? "0 4px 12px rgba(255,90,31,0.35)" : "none",
                  }}
                >
                  <span>Applicants</span>
                  <span
                    style={{
                      background: activeTab === "applicants" ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.1)",
                      padding: "1px 5px",
                      borderRadius: "6px",
                      fontSize: "10px",
                    }}
                  >
                    {pendingApps.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("squad")}
                  style={{
                    background:
                      activeTab === "squad"
                        ? "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)"
                        : "transparent",
                    color: activeTab === "squad" ? "#FFFFFF" : "rgba(255, 255, 255, 0.7)",
                    border: "none",
                    borderRadius: "9px",
                    padding: "7px 4px",
                    fontSize: "11.5px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    boxShadow: activeTab === "squad" ? "0 4px 12px rgba(255,90,31,0.35)" : "none",
                  }}
                >
                  <span>In Squad</span>
                  <span
                    style={{
                      background: activeTab === "squad" ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.1)",
                      padding: "1px 5px",
                      borderRadius: "6px",
                      fontSize: "10px",
                    }}
                  >
                    {approvedApps.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  style={{
                    background:
                      activeTab === "edit"
                        ? "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)"
                        : "transparent",
                    color: activeTab === "edit" ? "#FFFFFF" : "rgba(255, 255, 255, 0.7)",
                    border: "none",
                    borderRadius: "9px",
                    padding: "7px 4px",
                    fontSize: "11.5px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    boxShadow: activeTab === "edit" ? "0 4px 12px rgba(255,90,31,0.35)" : "none",
                  }}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Plans</span>
                </button>
              </div>
            )}
          </div>

          {/* List Area */}
          <div style={{ flex: 1, padding: "14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* Host Profile Card (Always visible at top of squad view) */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(255, 90, 31, 0.15) 0%, rgba(18, 11, 24, 0.8) 100%)",
                border: "1px solid rgba(255, 90, 31, 0.35)",
                borderRadius: "14px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #FF6F26, #FF5A1F)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: 900,
                    color: "#FFFFFF",
                  }}
                >
                  {hostProfile?.full_name?.charAt(0) || "H"}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#FFFFFF" }}>
                      {hostProfile?.full_name || "Host Member"}
                    </span>
                    <Crown className="w-3.5 h-3.5 text-[#FF5A1F]" />
                  </div>
                  <div style={{ fontSize: "11px", color: "#FFA05C", fontWeight: 700 }}>
                    Host &amp; Squad Organizer
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 900,
                  color: "#27C93F",
                  background: "rgba(39, 201, 63, 0.12)",
                  border: "1px solid rgba(39, 201, 63, 0.3)",
                  padding: "2px 7px",
                  borderRadius: "6px",
                }}
              >
                CONFIRMED
              </span>
            </div>

            {/* TAB 1: PENDING AUDIENCE APPLICANTS (HOST ONLY) */}
            {isHost && activeTab === "applicants" && (
              <>
                {pendingApps.length > 0 ? (
                  pendingApps.map((app) => {
                    const applicantName = app.profiles?.full_name || "Applicant Member";
                    const isActing = actionLoadingId === app.id;

                    return (
                      <div
                        key={app.id}
                        style={{
                          background: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "14px",
                          padding: "14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          transition: "border-color 0.15s ease",
                        }}
                        className="hover:border-[#FF5A1F]/40"
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "10px",
                                background: "rgba(255, 255, 255, 0.08)",
                                border: "1px solid rgba(255, 255, 255, 0.15)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "13px",
                                fontWeight: 800,
                                color: "#FFFFFF",
                              }}
                            >
                              {app.profiles?.avatar_icon || applicantName.charAt(0) || "M"}
                            </div>
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: 800, color: "#FFFFFF" }}>
                                {applicantName}
                              </div>
                              <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.5)" }}>
                                Applied {new Date(app.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          </div>

                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 800,
                              color: "#FFA05C",
                              background: "rgba(255, 90, 31, 0.15)",
                              border: "1px solid rgba(255, 90, 31, 0.3)",
                              padding: "2px 6px",
                              borderRadius: "5px",
                            }}
                          >
                            WAITING
                          </span>
                        </div>

                        {app.profiles?.bio && (
                          <div
                            style={{
                              fontSize: "11.5px",
                              color: "rgba(255, 255, 255, 0.7)",
                              lineHeight: 1.4,
                              background: "rgba(0,0,0,0.25)",
                              padding: "6px 10px",
                              borderRadius: "8px",
                            }}
                          >
                            &ldquo;{app.profiles.bio}&rdquo;
                          </div>
                        )}

                        {/* Host Approve / Decline Buttons */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "2px" }}>
                          <button
                            type="button"
                            onClick={() => handleDecline(app.id)}
                            disabled={isActing}
                            style={{
                              background: "rgba(255, 255, 255, 0.06)",
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                              color: "rgba(255, 255, 255, 0.8)",
                              borderRadius: "8px",
                              padding: "7px",
                              fontSize: "11.5px",
                              fontWeight: 700,
                              cursor: isActing ? "not-allowed" : "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px",
                            }}
                            className="hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApprove(app.id, applicantName)}
                            disabled={isActing || beacon.filled_slots >= beacon.total_slots}
                            style={{
                              background: "linear-gradient(135deg, #27C93F 0%, #16A34A 100%)",
                              border: "none",
                              color: "#FFFFFF",
                              borderRadius: "8px",
                              padding: "7px",
                              fontSize: "11.5px",
                              fontWeight: 800,
                              cursor: isActing ? "not-allowed" : "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px",
                              boxShadow: "0 2px 8px rgba(39, 201, 63, 0.35)",
                            }}
                            className="hover:scale-102 transition-transform"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div
                    style={{
                      padding: "36px 16px",
                      textAlign: "center",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px dashed rgba(255, 255, 255, 0.12)",
                      borderRadius: "14px",
                    }}
                  >
                    <Users className="w-8 h-8 text-white/30 mx-auto mb-2" />
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "#FFFFFF" }}>
                      No Pending Applicants
                    </div>
                    <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.5)", marginTop: "4px" }}>
                      When members request to join your hangout, they will appear here for your approval.
                    </div>
                  </div>
                )}
              </>
            )}

            {/* TAB 2: CONFIRMED SQUAD MEMBERS */}
            {(!isHost || activeTab === "squad") && (
              <>
                {approvedApps.length > 0 ? (
                  approvedApps.map((app) => {
                    const applicantName = app.profiles?.full_name || "Squad Member";
                    return (
                      <div
                        key={app.id}
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.09)",
                          borderRadius: "14px",
                          padding: "12px 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "10px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "10px",
                              background: "rgba(39, 201, 63, 0.15)",
                              border: "1px solid rgba(39, 201, 63, 0.3)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "13px",
                              fontWeight: 800,
                              color: "#27C93F",
                            }}
                          >
                            {app.profiles?.avatar_icon || applicantName.charAt(0) || "M"}
                          </div>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 800, color: "#FFFFFF" }}>
                              {applicantName}
                            </div>
                            <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.5)" }}>
                              {app.profiles?.phone ? `📱 ${app.profiles.phone}` : "Confirmed Member"}
                            </div>
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 800,
                            color: "#27C93F",
                            background: "rgba(39, 201, 63, 0.1)",
                            padding: "3px 6px",
                            borderRadius: "5px",
                          }}
                        >
                          ✓ IN SQUAD
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div
                    style={{
                      padding: "30px 16px",
                      textAlign: "center",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px dashed rgba(255, 255, 255, 0.1)",
                      borderRadius: "14px",
                    }}
                  >
                    <div style={{ fontSize: "12.5px", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
                      Spots Waiting to be Filled
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "4px" }}>
                      Approve audience applicants from the Applicants tab to add them to your squad.
                    </div>
                  </div>
                )}
              </>
            )}

            {/* TAB 3: EDIT BEACON PLANS (HOST ALL-IN-ONE WORKSPACE) */}
            {isHost && activeTab === "edit" && (
              <form
                onSubmit={handleSaveBeaconEdit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  padding: "6px 2px",
                }}
              >
                {editSuccessMsg && (
                  <div
                    style={{
                      background: "rgba(39, 201, 63, 0.15)",
                      border: "1px solid rgba(39, 201, 63, 0.4)",
                      color: "#27C93F",
                      borderRadius: "10px",
                      padding: "10px 12px",
                      fontSize: "12px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{editSuccessMsg}</span>
                  </div>
                )}

                {editErrorMsg && (
                  <div
                    style={{
                      background: "rgba(235, 57, 57, 0.15)",
                      border: "1px solid rgba(235, 57, 57, 0.4)",
                      color: "#FF6B6B",
                      borderRadius: "10px",
                      padding: "10px 12px",
                      fontSize: "12px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{editErrorMsg}</span>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 800,
                      color: "rgba(255,255,255,0.7)",
                      display: "block",
                      marginBottom: "4px",
                      letterSpacing: "0.04em",
                    }}
                  >
                    BEACON TITLE
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g. Sunset Padel & Match"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "12.5px",
                      outline: "none",
                    }}
                    className="focus:border-[#FF5A1F]"
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 800,
                      color: "rgba(255,255,255,0.7)",
                      display: "block",
                      marginBottom: "4px",
                      letterSpacing: "0.04em",
                    }}
                  >
                    CATEGORY
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                    {(["sports", "casual", "nightlife"] as BeaconCategory[]).map((cat) => {
                      const isCat = editCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setEditCategory(cat)}
                          style={{
                            background: isCat
                              ? "linear-gradient(135deg, #FF6F26, #FF5A1F)"
                              : "rgba(255,255,255,0.05)",
                            border: isCat ? "1px solid #FF5A1F" : "1px solid rgba(255,255,255,0.1)",
                            color: isCat ? "#fff" : "rgba(255,255,255,0.7)",
                            borderRadius: "8px",
                            padding: "7px 4px",
                            fontSize: "11px",
                            fontWeight: 800,
                            cursor: "pointer",
                            textTransform: "capitalize",
                          }}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Scheduled Time */}
                <div>
                  <label
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 800,
                      color: "rgba(255,255,255,0.7)",
                      display: "block",
                      marginBottom: "4px",
                      letterSpacing: "0.04em",
                    }}
                  >
                    DATE &amp; TIME
                  </label>
                  <input
                    type="datetime-local"
                    value={editScheduledAt ? new Date(editScheduledAt).toISOString().slice(0, 16) : ""}
                    onChange={(e) =>
                      setEditScheduledAt(e.target.value ? new Date(e.target.value).toISOString() : "")
                    }
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "12px",
                      outline: "none",
                    }}
                    className="focus:border-[#FF5A1F]"
                  />
                </div>

                {/* Location Name & Google Maps Link */}
                <div>
                  <label
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 800,
                      color: "rgba(255,255,255,0.7)",
                      display: "block",
                      marginBottom: "4px",
                      letterSpacing: "0.04em",
                    }}
                  >
                    VENUE &amp; MAPS LINK
                  </label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="Venue name (e.g. Third Culture Coffee)"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "12.5px",
                      outline: "none",
                      marginBottom: "6px",
                    }}
                    className="focus:border-[#FF5A1F]"
                  />
                  <input
                    type="url"
                    value={editMapsUrl}
                    onChange={(e) => setEditMapsUrl(e.target.value)}
                    placeholder="Google Maps URL (optional)"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "11px",
                      outline: "none",
                    }}
                    className="focus:border-[#FF5A1F]"
                  />
                </div>

                {/* Total Capacity Stepper */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 800,
                        color: "rgba(255,255,255,0.7)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      SQUAD CAPACITY (SLOTS)
                    </label>
                    <span style={{ fontSize: "10.5px", color: "#FFA05C", fontWeight: 700 }}>
                      Currently {beacon.filled_slots} in squad
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setEditCapacity((c) => Math.max(beacon.filled_slots, c - 1))}
                      disabled={editCapacity <= beacon.filled_slots}
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "8px",
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "#fff",
                        cursor: editCapacity <= beacon.filled_slots ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: 900,
                        color: "#fff",
                        width: "28px",
                        textAlign: "center",
                      }}
                    >
                      {editCapacity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditCapacity((c) => Math.min(30, c + 1))}
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "8px",
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 800,
                      color: "rgba(255,255,255,0.7)",
                      display: "block",
                      marginBottom: "4px",
                      letterSpacing: "0.04em",
                    }}
                  >
                    VIBE &amp; DETAILS
                  </label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Provide details or what to bring..."
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "12px",
                      outline: "none",
                      resize: "vertical",
                    }}
                    className="focus:border-[#FF5A1F]"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    padding: "11px",
                    fontSize: "12.5px",
                    fontWeight: 800,
                    cursor: isSavingEdit ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxShadow: "0 4px 14px rgba(255,90,31,0.4)",
                    marginTop: "4px",
                  }}
                  className="hover:scale-[1.01] active:scale-98 transition-transform"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingEdit ? "Saving Changes..." : "Save Beacon Updates"}</span>
                </button>
              </form>
            )}
          </div>
        </aside>

        {/* ── RIGHT PANE: INSTAGRAM DIRECT MESSAGES STYLE REAL-TIME CHAT ── */}
        <main
          style={{
            flexDirection: "column",
            height: "calc(100vh - 75px)",
            background: "radial-gradient(ellipse at 80% 20%, rgba(255, 90, 31, 0.08) 0%, rgba(6, 4, 8, 1) 70%)",
          }}
          className={`${mobileSection === "chat" ? "flex" : "hidden md:flex"} w-full`}
        >
          {/* Chat Stream Header */}
          <div
            style={{
              padding: "14px 24px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(10, 6, 15, 0.6)",
              backdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#27C93F",
                  boxShadow: "0 0 10px #27C93F",
                }}
              />
              <div>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF" }}>
                  Squad Direct Channel
                </span>
                <span style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.5)", marginLeft: "8px" }}>
                  Encrypted group conversation with verified attendees
                </span>
              </div>
            </div>

            <div style={{ fontSize: "11px", color: "#FFA05C", fontWeight: 700 }}>
              Anti-Ghosting Safeguard Active
            </div>
          </div>

          {/* Messages Feed */}
          <div
            ref={chatMessagesContainerRef}
            style={{
              flex: 1,
              padding: "20px 24px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {/* System Meetup Card Banner */}
            <div
              style={{
                alignSelf: "center",
                maxWidth: "460px",
                width: "100%",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 90, 31, 0.3)",
                borderRadius: "16px",
                padding: "14px 18px",
                textAlign: "center",
                marginBottom: "10px",
              }}
            >
              <Sparkles className="w-4 h-4 text-[#FF5A1F] mx-auto mb-1" />
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#FFFFFF" }}>
                Meetup Confirmed: {beacon.title}
              </div>
              <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.6)", marginTop: "4px" }}>
                📅 {formattedDate} • 📍 {beacon.location_name || "Venue details inside chat"}
              </div>
            </div>

            {chatLoading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                Connecting to squad frequency...
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(255,255,255,0.45)", fontSize: "13px" }}>
                No messages yet. Say hello and coordinate meetup logistics!
              </div>
            ) : (
              messages.map((msg: any) => {
                const isMine = msg.sender_id === currentUserId;
                const isHostMsg = msg.sender_id === beacon.host_id;
                const senderName = msg.profiles?.full_name || (isMine ? "You" : "Squad Member");

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMine ? "flex-end" : "flex-start",
                      maxWidth: "75%",
                      alignSelf: isMine ? "flex-end" : "flex-start",
                    }}
                  >
                    {!isMine && (
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: isHostMsg ? "#FFA05C" : "rgba(255, 255, 255, 0.65)",
                          marginBottom: "4px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>{senderName}</span>
                        {isHostMsg && <Crown className="w-3 h-3 text-[#FF5A1F]" />}
                      </div>
                    )}

                    <div
                      style={{
                        padding: "12px 16px",
                        borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        background: isMine
                          ? "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)"
                          : "rgba(255, 255, 255, 0.07)",
                        border: isMine
                          ? "none"
                          : "1px solid rgba(255, 255, 255, 0.12)",
                        color: "#FFFFFF",
                        fontSize: "13.5px",
                        lineHeight: 1.45,
                        wordBreak: "break-word",
                        boxShadow: isMine
                          ? "0 4px 16px rgba(255, 90, 31, 0.35)"
                          : "0 2px 10px rgba(0, 0, 0, 0.2)",
                      }}
                    >
                      {msg.content}
                    </div>

                    <div
                      style={{
                        fontSize: "10px",
                        color: "rgba(255, 255, 255, 0.4)",
                        marginTop: "4px",
                      }}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Composer (Instagram DM Style) */}
          <div
            style={{
              padding: "14px 24px 20px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(10, 6, 15, 0.9)",
              backdropFilter: "blur(16px)",
            }}
          >
            {/* Quick Reaction Chips */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
              {["🔥", "🙌", "⚡", "☕", "🎾", "🚀"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setNewMessage((prev) => prev + emoji)}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    width: "30px",
                    height: "30px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                  className="hover:scale-110 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleSendMessage}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                borderRadius: "16px",
                padding: "6px 8px 6px 16px",
              }}
              className="focus-within:border-[#FF5A1F] transition-colors"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Message the squad (e.g. Arriving in 10 mins!)..."
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#FFFFFF",
                  fontSize: "13.5px",
                }}
              />

              <button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                style={{
                  background: newMessage.trim()
                    ? "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)"
                    : "rgba(255, 255, 255, 0.08)",
                  border: "none",
                  borderRadius: "12px",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  cursor: newMessage.trim() ? "pointer" : "default",
                  boxShadow: newMessage.trim() ? "0 4px 14px rgba(255, 90, 31, 0.4)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </main>
      </div>

      {/* Universal Share Modal */}
      <UniversalShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={beacon.title}
        shareUrl={
          typeof window !== "undefined"
            ? `${window.location.origin}/b/${beacon.id.slice(0, 8)}`
            : `https://solonomore.com/b/${beacon.id.slice(0, 8)}`
        }
        shareText={`Join my squad meetup "${beacon.title}" on Solo-No-More!`}
        type="beacon"
      />
    </div>
  );
}
