"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BeaconCategory } from "@/lib/supabase/types";
import { getBeaconMessages, sendBeaconMessage } from "@/app/actions/chat";
import {
  approveApplicant,
  declineApplicant,
  flagNoShow,
  removeSquadMember,
} from "@/app/actions/applications";
import { updateFullBeacon, cancelBeacon, completeBeaconAction } from "@/app/actions/beacons";
import { uploadMemory, getMemoriesForBeacon } from "@/app/actions/memories";
import UniversalShareModal from "@/components/share/UniversalShareModal";
import {
  BUDGET_TIERS,
  parseBeaconMeta,
  formatBeaconDescription,
} from "@/lib/beaconBudget";
import {
  MessageSquare,
  Send,
  Users,
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  Search,
  Sparkles,
  Flame,
  Coffee,
  Trophy,
  Moon,
  Radio,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Save,
  Check,
  X,
  ShieldCheck,
  UserCheck,
  Lock,
  Tag,
  ExternalLink,
  Coins,
  HelpCircle,
  Trash2,
  UserMinus,
  AlertTriangle,
  Share2,
  Camera,
  Image as ImageIcon,
} from "lucide-react";

function InstagramIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface ChatBeaconItem {
  id: string;
  title: string;
  description: string | null;
  category: BeaconCategory;
  location_name: string | null;
  scheduled_at: string | null;
  status: string;
  filled_slots: number;
  total_slots: number;
  google_maps_url?: string | null;
  visibility_mode?: string;
  created_at: string;
  host_id: string;
  isHost: boolean;
  hostName: string;
  hostAvatar: string;
}

interface ApplicationItem {
  id: string;
  beacon_id: string;
  applicant_id: string;
  status: "pending" | "approved" | "declined";
  created_at: string;
  flagged_ghost?: boolean;
  budgetPact?: string;
  icebreakerAnswer?: string;
  profiles: {
    id?: string;
    full_name: string | null;
    bio: string | null;
    city?: string | null;
    avatar_icon?: string | null;
    vibe_tags?: string[] | null;
    created_at?: string | null;
  } | null;
}

interface ChatsDashboardClientProps {
  currentUserId: string;
  currentUserProfile: any;
  chatBeacons: ChatBeaconItem[];
  recentMessagesMap: Record<string, any>;
  initialSelectedBeaconId: string | null;
  hostedApplications?: ApplicationItem[];
  attendanceCountMap?: Record<string, number>;
  friendIds?: string[];
}

const CATEGORY_META: Record<
  BeaconCategory,
  { label: string; icon: typeof Trophy; bg: string; border: string; color: string }
> = {
  sports: {
    label: "Sports & Padel",
    icon: Trophy,
    bg: "rgba(39, 201, 63, 0.12)",
    border: "rgba(39, 201, 63, 0.28)",
    color: "#27C93F",
  },
  casual: {
    label: "Chai & Casual",
    icon: Coffee,
    bg: "rgba(255, 160, 92, 0.12)",
    border: "rgba(255, 160, 92, 0.28)",
    color: "#FFA05C",
  },
  nightlife: {
    label: "Nightlife & Rave",
    icon: Moon,
    bg: "rgba(255, 90, 31, 0.15)",
    border: "rgba(255, 90, 31, 0.35)",
    color: "#FF8A3D",
  },
};

function formatScheduledTime(iso: string | null): string {
  if (!iso) return "Time TBD";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toLocalInputDateTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ChatsDashboardClient({
  currentUserId,
  currentUserProfile,
  chatBeacons: initialChatBeacons,
  recentMessagesMap: initialRecentMessages,
  initialSelectedBeaconId,
  hostedApplications: initialHostedApps = [],
  attendanceCountMap = {},
  friendIds = [],
}: ChatsDashboardClientProps) {
  const router = useRouter();
  const [chatBeacons, setChatBeacons] = useState<ChatBeaconItem[]>(initialChatBeacons);
  const [selectedBeaconId, setSelectedBeaconId] = useState<string | null>(initialSelectedBeaconId);
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [recentMessages, setRecentMessages] = useState<Record<string, any>>(initialRecentMessages);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(Boolean(initialSelectedBeaconId));

  // Host sub-tabs for the selected beacon: "chat" | "squad" | "edit"
  const [hostTab, setHostTab] = useState<"chat" | "squad" | "edit">("chat");

  // Host Applications state
  const [applications, setApplications] = useState<ApplicationItem[]>(initialHostedApps);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Selected Beacon
  const selectedBeacon = chatBeacons.find((b) => b.id === selectedBeaconId) || null;

  // Metadata parser for selected beacon
  const parsedMeta = selectedBeacon ? parseBeaconMeta(selectedBeacon.description) : { description: "", budgetTier: BUDGET_TIERS[0].label, customQuestion: "" };

  // Edit Beacon state
  const [editTitle, setEditTitle] = useState(selectedBeacon?.title || "");
  const [editDescription, setEditDescription] = useState(parsedMeta.description);
  const [editBudgetTier, setEditBudgetTier] = useState(parsedMeta.budgetTier);
  const [editCustomQuestion, setEditCustomQuestion] = useState(parsedMeta.customQuestion);
  const [editCategory, setEditCategory] = useState<BeaconCategory>(selectedBeacon?.category || "casual");
  const [editLocation, setEditLocation] = useState(selectedBeacon?.location_name || "");
  const [editScheduledAt, setEditScheduledAt] = useState(selectedBeacon?.scheduled_at || "");
  const [editMapsUrl, setEditMapsUrl] = useState(selectedBeacon?.google_maps_url || "");
  const [editCapacity, setEditCapacity] = useState(selectedBeacon?.total_slots || 5);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Cancellation & Downgrade Warning Modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Remove Member Confirm Modal state
  const [memberToRemove, setMemberToRemove] = useState<ApplicationItem | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  // Share & Post-Hangout Memories state
  const [showShareModal, setShowShareModal] = useState(false);
  const [memories, setMemories] = useState<any[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);
  const [selectedPhotoBase64, setSelectedPhotoBase64] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isConcluding, setIsConcluding] = useState(false);
  const [copiedInstagramTag, setCopiedInstagramTag] = useState(false);

  // Load memories for selected beacon
  const loadBeaconMemories = async (id: string) => {
    setLoadingMemories(true);
    try {
      const res = await getMemoriesForBeacon(id);
      if (res.success && res.memories) {
        setMemories(res.memories);
      }
    } catch (e) {
      console.error("[Chats] Error loading memories:", e);
    } finally {
      setLoadingMemories(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const MAX_WIDTH = 1200;
        const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL("image/jpeg", 0.82);
        setSelectedPhotoBase64(compressed);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!selectedPhotoBase64 || !selectedBeaconId || uploadingPhoto) return;
    setUploadingPhoto(true);
    try {
      const res = await uploadMemory(selectedBeaconId, selectedPhotoBase64, photoCaption.trim() || null, true);
      if (res.success) {
        setSelectedPhotoBase64(null);
        setPhotoCaption("");
        setFeedback({ type: "success", text: "Photo uploaded to squad hangout memories! 🎉" });
        loadBeaconMemories(selectedBeaconId);
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to upload photo" });
      }
    } catch {
      setFeedback({ type: "error", text: "Upload failed. Please try a smaller photo." });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleConcludeMeetup = async () => {
    if (!selectedBeaconId || isConcluding) return;
    if (!confirm("Are you sure you want to conclude this meetup? Normal chat will close and squad members can upload hangout photos & memories!")) return;
    setIsConcluding(true);
    try {
      const res = await completeBeaconAction(selectedBeaconId);
      if (res.success) {
        setChatBeacons((prev) =>
          prev.map((b) => (b.id === selectedBeaconId ? { ...b, status: "completed" } : b))
        );
        setFeedback({ type: "success", text: "Meetup concluded! Post-hangout memories & photo drop are now open!" });
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to conclude meetup" });
      }
    } catch {
      setFeedback({ type: "error", text: "Failed to conclude meetup." });
    } finally {
      setIsConcluding(false);
    }
  };

  const handleCopyInstagramTag = async () => {
    try {
      await navigator.clipboard.writeText("@solonomore");
      setCopiedInstagramTag(true);
      setTimeout(() => setCopiedInstagramTag(false), 2500);
    } catch {}
  };

  // Sync edit form whenever selected beacon changes
  useEffect(() => {
    if (selectedBeacon) {
      const meta = parseBeaconMeta(selectedBeacon.description);
      setEditTitle(selectedBeacon.title);
      setEditDescription(meta.description);
      setEditBudgetTier(meta.budgetTier);
      setEditCustomQuestion(meta.customQuestion);
      setEditCategory(selectedBeacon.category);
      setEditLocation(selectedBeacon.location_name || "");
      setEditScheduledAt(selectedBeacon.scheduled_at || "");
      setEditMapsUrl(selectedBeacon.google_maps_url || "");
      setEditCapacity(selectedBeacon.total_slots);
      setHostTab("chat");
      setFeedback(null);
      setShowCancelModal(false);
      setMemberToRemove(null);
      setSelectedPhotoBase64(null);
      setPhotoCaption("");
      loadBeaconMemories(selectedBeacon.id);
    }
  }, [selectedBeaconId]);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);

  // Filter beacons by title, location, or host
  const filteredBeacons = chatBeacons.filter((b) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      b.title.toLowerCase().includes(query) ||
      (b.location_name?.toLowerCase() || "").includes(query) ||
      b.hostName.toLowerCase().includes(query)
    );
  });

  // Fetch messages for selected beacon
  const fetchMessages = async (showLoading = false) => {
    if (!selectedBeaconId) return;
    if (showLoading) setLoadingMessages(true);
    try {
      const res = await getBeaconMessages(selectedBeaconId);
      if (res.success && res.data) {
        setMessages(res.data);
        if (res.data.length > 0) {
          const last = res.data[res.data.length - 1];
          setRecentMessages((prev) => ({ ...prev, [selectedBeaconId]: last }));
        }
      }
    } catch (e) {
      console.error("[Chats] Error fetching messages:", e);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!selectedBeaconId) return;
    isInitialLoadRef.current = true;
    fetchMessages(true);

    const interval = setInterval(() => {
      fetchMessages(false);
    }, 3500);

    return () => clearInterval(interval);
  }, [selectedBeaconId]);

  // Container-only smooth scrolling (PREVENTS PAGE AUTO-SCROLL HIJACKING)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (isInitialLoadRef.current) {
      container.scrollTop = container.scrollHeight;
      if (messages.length > 0) {
        isInitialLoadRef.current = false;
      }
      return;
    }

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 120) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedBeaconId || sending) return;

    const content = newMessage.trim();
    setSending(true);
    try {
      const res = await sendBeaconMessage(selectedBeaconId, content);
      if (res.success) {
        setNewMessage("");
        await fetchMessages(false);
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to send message." });
      }
    } catch {
      setFeedback({ type: "error", text: "Failed to send message due to network error." });
    } finally {
      setSending(false);
    }
  };

  // Host Action: Approve Applicant
  const handleApproveApplicant = async (appId: string) => {
    if (!selectedBeacon) return;
    setActionLoadingId(appId);
    setFeedback(null);
    try {
      const res = await approveApplicant(appId);
      if (res.success) {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: "approved" as const } : a))
        );
        setChatBeacons((prev) =>
          prev.map((b) =>
            b.id === selectedBeacon.id && b.filled_slots < b.total_slots
              ? { ...b, filled_slots: b.filled_slots + 1 }
              : b
          )
        );
        setFeedback({ type: "success", text: "Applicant approved! Added to squad chat stream." });
        fetchMessages(false);
      } else {
        setFeedback({ type: "error", text: res.error });
      }
    } catch {
      setFeedback({ type: "error", text: "Failed to approve applicant." });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Host Action: Decline Applicant
  const handleDeclineApplicant = async (appId: string) => {
    setActionLoadingId(appId);
    setFeedback(null);
    try {
      const res = await declineApplicant(appId);
      if (res.success) {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: "declined" as const } : a))
        );
        setFeedback({ type: "success", text: "Request declined." });
      } else {
        setFeedback({ type: "error", text: res.error });
      }
    } catch {
      setFeedback({ type: "error", text: "Failed to decline applicant." });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Host Action: Remove Squad Member (Post-Approval)
  const handleRemoveMember = async () => {
    if (!selectedBeacon || !memberToRemove) return;
    setIsRemovingMember(true);
    setFeedback(null);
    try {
      const res = await removeSquadMember(memberToRemove.id, selectedBeacon.id);
      if (res.success) {
        setApplications((prev) =>
          prev.map((a) => (a.id === memberToRemove.id ? { ...a, status: "declined" as const } : a))
        );
        setChatBeacons((prev) =>
          prev.map((b) =>
            b.id === selectedBeacon.id
              ? { ...b, filled_slots: Math.max(0, b.filled_slots - 1) }
              : b
          )
        );
        setFeedback({
          type: "success",
          text: `Removed ${memberToRemove.profiles?.full_name || "member"} from squad. Slot opened up.`,
        });
        setMemberToRemove(null);
        fetchMessages(false);
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to remove member." });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error removing member." });
    } finally {
      setIsRemovingMember(false);
    }
  };

  // Host Action: Flag No-Show
  const handleFlagNoShow = async (appId: string) => {
    setActionLoadingId(appId);
    setFeedback(null);
    try {
      const res = await flagNoShow(appId);
      if (res.success) {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, flagged_ghost: true } : a))
        );
        setFeedback({ type: "success", text: "Member flagged as no-show." });
      } else {
        setFeedback({ type: "error", text: res.error });
      }
    } catch {
      setFeedback({ type: "error", text: "Failed to flag member." });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Host Action: Save Full Beacon Updates (Includes Budget Pact & Custom Question)
  const handleSaveBeaconUpdates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBeacon) return;

    setIsSavingEdit(true);
    setFeedback(null);

    const fullDescription = formatBeaconDescription(
      editDescription,
      editBudgetTier,
      editCustomQuestion
    );

    try {
      const res = await updateFullBeacon(selectedBeacon.id, {
        title: editTitle.trim(),
        description: fullDescription || null,
        category: editCategory,
        location_name: editLocation.trim() || null,
        scheduled_at: editScheduledAt ? new Date(editScheduledAt).toISOString() : null,
        google_maps_url: editMapsUrl.trim() || null,
        total_slots: editCapacity,
      });

      if (res.success) {
        setChatBeacons((prev) =>
          prev.map((b) =>
            b.id === selectedBeacon.id
              ? {
                  ...b,
                  title: editTitle.trim(),
                  description: fullDescription || null,
                  category: editCategory,
                  location_name: editLocation.trim() || null,
                  scheduled_at: editScheduledAt ? new Date(editScheduledAt).toISOString() : null,
                  google_maps_url: editMapsUrl.trim() || null,
                  total_slots: editCapacity,
                }
              : b
          )
        );
        setFeedback({
          type: "success",
          text: "Beacon details, Budget Pact, and questions updated! Squad notified.",
        });
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to update beacon." });
      }
    } catch {
      setFeedback({ type: "error", text: "Failed to save beacon updates." });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Host Action: Cancel / Delete Beacon (Handles 0-attendee safe vs audience downgrade consequence)
  const handleCancelBeacon = async (acceptDowngrade = false) => {
    if (!selectedBeacon) return;
    setIsCancelling(true);
    setFeedback(null);

    try {
      const res = await cancelBeacon(selectedBeacon.id, acceptDowngrade);
      if (res.success) {
        setChatBeacons((prev) =>
          prev.map((b) => (b.id === selectedBeacon.id ? { ...b, status: "cancelled" } : b))
        );
        setShowCancelModal(false);
        if (res.downgraded) {
          setFeedback({
            type: "error",
            text: "Beacon cancelled with active audience. Host Reliability Rating has been downgraded on your profile.",
          });
        } else {
          setFeedback({
            type: "success",
            text: "Beacon safely cancelled with zero audience. Your Host Trust Score remains 100% intact!",
          });
        }
      } else if (res.error?.startsWith("AUDIENCE_CONFIRMATION_REQUIRED")) {
        // Open the confirmation dialog
        setShowCancelModal(true);
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to cancel beacon." });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error cancelling beacon." });
    } finally {
      setIsCancelling(false);
    }
  };

  // Selected Beacon Applications
  const activeBeaconApps = selectedBeacon
    ? applications.filter((a) => a.beacon_id === selectedBeacon.id)
    : [];
  const pendingApps = activeBeaconApps.filter((a) => a.status === "pending");
  const approvedApps = activeBeaconApps.filter((a) => a.status === "approved");

  const friendsSet = new Set(friendIds);

  // Auto-cancel time alert calculation: If 0 attendees and within 2 hours or passed
  const isZeroAttendeesNearTime =
    selectedBeacon?.isHost &&
    selectedBeacon.status === "active" &&
    selectedBeacon.filled_slots === 0 &&
    selectedBeacon.scheduled_at &&
    (new Date(selectedBeacon.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60) <= 2;

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col h-[calc(100dvh-125px)] min-h-[520px] space-y-2">
      {/* ─── Compact Top Header ─── */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#FF6F26]/10 text-[#FF6F26] border border-[#FF6F26]/30">
            <MessageSquare className="w-3.5 h-3.5" />
            Squad Direct Channels
          </span>
          <h1 className="text-sm sm:text-base font-black text-white tracking-tight hidden sm:inline">
            Squad Chats, Vetting &amp; Plan Coordination
          </h1>
        </div>

        <Link
          href="/dashboard/manage"
          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 py-1 px-3 rounded-xl bg-white/5 border border-white/10 transition-colors"
        >
          <Radio className="w-3.5 h-3.5 text-[#FF6F26]" />
          <span>My Hosting Summary ➔</span>
        </Link>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs font-medium animate-fadeIn ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* ─── 0-ATTENDEE TIME ALERT BANNER (SAFE AUTO-CANCEL WITH 0 PENALTY) ─── */}
      {isZeroAttendeesNearTime && selectedBeacon && (
        <div className="p-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-200">
            <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>
              <strong>Zero Audience Notice:</strong> Your scheduled meetup time is approaching with 0 attendees. You can auto-cancel now with <strong>zero penalty</strong>.
            </span>
          </div>
          <button
            onClick={() => handleCancelBeacon(false)}
            disabled={isCancelling}
            className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shrink-0 transition-colors"
          >
            {isCancelling ? "Cancelling..." : "Auto-Cancel Safely (0 Penalty)"}
          </button>
        </div>
      )}

      {/* ─── MAIN CHAT & COMMAND WORKSPACE ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-3 flex-1 min-h-0 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden shadow-2xl">
        {/* ─── LEFT COLUMN: BEACON CHANNELS LIST ─── */}
        <div
          className={`lg:col-span-4 border-r border-white/10 flex flex-col h-full bg-white/[0.01] ${
            isMobileChatOpen ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Search Header */}
          <div className="p-4 border-b border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Conversations ({chatBeacons.length})
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Real-Time</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search squads or hosts..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26] transition-colors"
              />
            </div>
          </div>

          {/* Beacon Channels Roster */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10">
            {filteredBeacons.length > 0 ? (
              filteredBeacons.map((beacon) => {
                const isSelected = beacon.id === selectedBeaconId;
                const meta = CATEGORY_META[beacon.category] || CATEGORY_META.casual;
                const IconComponent = meta.icon;
                const lastMsg = recentMessages[beacon.id];
                const pendingCount = applications.filter(
                  (a) => a.beacon_id === beacon.id && a.status === "pending"
                ).length;

                return (
                  <button
                    key={beacon.id}
                    onClick={() => {
                      setSelectedBeaconId(beacon.id);
                      setIsMobileChatOpen(true);
                    }}
                    className={`w-full p-4 text-left transition-all flex items-start gap-3 hover:bg-white/[0.04] ${
                      isSelected ? "bg-white/[0.06] border-l-4 border-l-[#FF6F26]" : ""
                    }`}
                  >
                    {/* Category / Host Icon */}
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border"
                      style={{ background: meta.bg, borderColor: meta.border, color: meta.color }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-white truncate">
                          {beacon.title}
                        </span>
                        {beacon.isHost && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#FF6F26]/10 text-[#FF6F26] border border-[#FF6F26]/20 shrink-0">
                            Host
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 mb-1.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          {formatScheduledTime(beacon.scheduled_at)}
                        </span>
                        <span>•</span>
                        <span>
                          {beacon.filled_slots}/{beacon.total_slots} spots
                        </span>
                      </div>

                      {/* Last Message Snippet */}
                      <p className="text-[11px] text-zinc-400 truncate">
                        {lastMsg ? lastMsg.content : "No messages yet. Tap to coordinate!"}
                      </p>

                      {/* Pending Join Requests Indicator */}
                      {beacon.isHost && pendingCount > 0 && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 animate-pulse">
                            <UserCheck className="w-3 h-3" />
                            {pendingCount} Join Request{pendingCount > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-zinc-500">
                No active squad channels found. Join or host a beacon to unlock coordination chat!
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT COLUMN: ACTIVE SQUAD WORKSPACE ─── */}
        <div
          className={`lg:col-span-8 flex flex-col h-full bg-black/20 ${
            !isMobileChatOpen ? "hidden lg:flex" : "flex"
          }`}
        >
          {selectedBeacon ? (
            <>
              {/* Header Bar */}
              <div className="p-4 border-b border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setIsMobileChatOpen(false)}
                    className="lg:hidden p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-xs font-black text-white truncate">
                        {selectedBeacon.title}
                      </span>
                      {selectedBeacon.isHost && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#FF6F26]/10 text-[#FF6F26] border border-[#FF6F26]/30">
                          Host
                        </span>
                      )}
                      {/* Budget Badge in Header */}
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/5 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Coins className="w-2.5 h-2.5 text-amber-400" />
                        <span>{parsedMeta.budgetTier}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#FF6F26]" />
                        {selectedBeacon.location_name || "Location TBD"}
                      </span>
                      <span>•</span>
                      <span>
                        {selectedBeacon.filled_slots}/{selectedBeacon.total_slots} filled
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action Bar: Share Link + Host Tabs + Conclude Meetup */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 no-scrollbar shrink-0">
                  {/* Universal Share Beacon Link Button (Only while active) */}
                  {selectedBeacon.status === "active" && (
                    <button
                      type="button"
                      onClick={() => setShowShareModal(true)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-[#FFA05C] border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
                      title="Share beacon link with friends or on socials"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#FF6F26]" />
                      <span>Share</span>
                    </button>
                  )}

                  {/* Host Control Tabs */}
                  {selectedBeacon.isHost ? (
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 shrink-0 whitespace-nowrap">
                      <button
                        onClick={() => setHostTab("chat")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                          hostTab === "chat"
                            ? "bg-[#FF6F26] text-white shadow-[0_0_10px_rgba(255,111,38,0.3)]"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>

                      <button
                        onClick={() => setHostTab("squad")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                          hostTab === "squad"
                            ? "bg-[#FF6F26] text-white shadow-[0_0_10px_rgba(255,111,38,0.3)]"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>
                          Squad
                          {pendingApps.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white">
                              {pendingApps.length}
                            </span>
                          )}
                        </span>
                      </button>

                      <button
                        onClick={() => setHostTab("edit")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                          hostTab === "edit"
                            ? "bg-[#FF6F26] text-white shadow-[0_0_10px_rgba(255,111,38,0.3)]"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Plans</span>
                      </button>

                      {/* Conclude Meetup Button */}
                      {selectedBeacon.status === "active" ? (
                        <button
                          type="button"
                          onClick={handleConcludeMeetup}
                          disabled={isConcluding}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap"
                          title="Wrap up this hangout and unlock photo sharing"
                        >
                          <Check className="w-3.5 h-3.5 text-purple-400" />
                          <span>{isConcluding ? "Wrapping up..." : "Conclude"}</span>
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-white/10 flex items-center gap-1 shrink-0 whitespace-nowrap">
                          <Lock className="w-3 h-3 text-zinc-400" />
                          <span>Concluded</span>
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                      {selectedBeacon.status === "completed" ? (
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-white/10 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-zinc-400" />
                          <span>Meetup Concluded</span>
                        </span>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Approved Attendee View</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ─── VIEW 1: LIVE CHAT STREAM ─── */}
              {hostTab === "chat" && (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Messages Stream */}
                  <div
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3.5 scrollbar-thin scrollbar-thumb-white/10"
                  >
                    {loadingMessages ? (
                      <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                        Connecting to squad channel...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500 space-y-2">
                        <MessageSquare className="w-10 h-10 text-zinc-600" />
                        <div className="text-sm font-bold text-white">Squad Stream Ready</div>
                        <p className="text-xs max-w-sm">
                          Coordinate meetup parking, timings, and meetup spots with your approved squad members here.
                        </p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.sender_id === currentUserId;
                        const isHostMsg = msg.sender_id === selectedBeacon.host_id;

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col space-y-1 ${
                              isMe ? "items-end" : "items-start"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                              <span
                                className={
                                  isHostMsg
                                    ? "font-bold text-[#FF6F26]"
                                    : "font-medium text-zinc-400"
                                }
                              >
                                {isMe
                                  ? "You" + (isHostMsg ? " (Host)" : "")
                                  : (msg.profiles?.full_name || "Member") + (isHostMsg ? " (Host)" : "")}
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(msg.created_at).toLocaleTimeString([], {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>

                            <div
                              className={`px-4 py-2.5 rounded-2xl text-xs max-w-[80%] break-words leading-relaxed ${
                                isMe
                                  ? "bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-[0_2px_10px_rgba(255,111,38,0.25)] rounded-tr-sm"
                                  : "bg-white/10 text-zinc-100 rounded-tl-sm border border-white/5"
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        );
                      })
                    )}
                    {/* Post-Hangout Memories Gallery inside Chat Stream */}
                    {memories.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 mb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-white">
                            <Camera className="w-3.5 h-3.5 text-[#FF6F26]" />
                            <span>Squad Hangout Photos ({memories.length})</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono">Shared Memories</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {memories.map((m: any) => (
                            <div key={m.id} className="relative rounded-xl overflow-hidden aspect-square border border-white/10 bg-black group">
                              <img src={m.image_url} alt="Memory" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/90 to-transparent text-[9px] text-zinc-300">
                                <div className="font-bold text-white truncate">{m.uploader_name}</div>
                                {m.caption && <div className="truncate">{m.caption}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Form or Post-Hangout Memories Drop Zone */}
                  {selectedBeacon.status === "completed" ? (
                    <div className="p-4 border-t border-white/10 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 space-y-3">
                      {/* Notice & Instagram Callout */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-zinc-800 text-zinc-300 border border-white/10 shrink-0">
                            🔒 Chat Closed
                          </span>
                          <span className="text-xs text-zinc-200">
                            Hangout concluded! Share your meetup selfies &amp; memories below.
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={handleCopyInstagramTag}
                          className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                        >
                          <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
                          <span>{copiedInstagramTag ? "Copied @tag!" : "Tag Us @solonomore"}</span>
                        </button>
                      </div>

                      {/* Photo Upload Row */}
                      {selectedPhotoBase64 ? (
                        <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-2xl bg-black/40 border border-white/10">
                          <img
                            src={selectedPhotoBase64}
                            alt="Preview"
                            className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/20"
                          />
                          <input
                            type="text"
                            value={photoCaption}
                            onChange={(e) => setPhotoCaption(e.target.value)}
                            placeholder="Add a photo caption (e.g. Best chai night with the squad!)..."
                            className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6F26]"
                          />
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => setSelectedPhotoBase64(null)}
                              className="px-3 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-white/5 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={uploadingPhoto}
                              onClick={handleUploadPhoto}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF6F26] hover:bg-[#FF5A1F] text-white flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{uploadingPhoto ? "Posting..." : "Post Photo"}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all">
                          <label className="flex-1 flex items-center gap-2.5 cursor-pointer text-xs font-bold text-zinc-300 hover:text-white">
                            <div className="w-8 h-8 rounded-xl bg-[#FF6F26]/15 border border-[#FF6F26]/30 flex items-center justify-center text-[#FF6F26] shrink-0">
                              <Camera className="w-4 h-4" />
                            </div>
                            <div>
                              <div>Drop Hangout Photo or Squad Selfie</div>
                              <div className="text-[10px] text-zinc-400 font-normal">Click to upload photos directly to this squad gallery</div>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoSelect}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Regular Input Form */
                    <form
                      onSubmit={handleSendMessage}
                      className="p-3.5 border-t border-white/10 bg-white/[0.01] flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Message your squad..."
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26] transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="px-4 py-2.5 rounded-xl bg-[#FF6F26] hover:bg-[#FF5A1F] text-white text-xs font-bold disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* ─── VIEW 2: SELECT SQUAD (RICH APPLICANT VETTING & REMOVE MEMBER CONTROLS) ─── */}
              {hostTab === "squad" && (
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
                  {/* Privacy Policy & Budget Pact Banner */}
                  <div className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2 text-xs text-zinc-400">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span>Meetup Budget Pact: {parsedMeta.budgetTier}</span>
                    </div>
                    {parsedMeta.customQuestion && (
                      <div className="flex items-center gap-2 text-zinc-300">
                        <HelpCircle className="w-3.5 h-3.5 text-[#FF6F26]" />
                        <span>Host Question: &ldquo;{parsedMeta.customQuestion}&rdquo;</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1 border-t border-white/5 text-[11px] text-zinc-500">
                      <Lock className="w-3 h-3 text-zinc-500 shrink-0" />
                      <span>
                        Vetting Shield: Candidate vibes &amp; track records are viewable while selecting squad. Once meetup is closed, contact details are protected unless connected as friends.
                      </span>
                    </div>
                  </div>

                  {/* 1. Pending Join Requests */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-[#FF6F26]" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-white">
                          Pending Join Requests ({pendingApps.length})
                        </h3>
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        {selectedBeacon.total_slots - selectedBeacon.filled_slots} spots left
                      </span>
                    </div>

                    {pendingApps.length > 0 ? (
                      <div className="space-y-3">
                        {pendingApps.map((app) => {
                          const profile = app.profiles;
                          const isClosed = selectedBeacon.status !== "active";
                          const isFriend = friendsSet.has(app.applicant_id);
                          const showPrivate = !isClosed || isFriend;
                          const attendedCount = attendanceCountMap[app.applicant_id] || 0;

                          return (
                            <div
                              key={app.id}
                              className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all space-y-3"
                            >
                              {/* Applicant Card Header */}
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  {/* Avatar circle */}
                                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FF6F26]/30 to-[#FF5A1F]/10 border border-[#FF6F26]/30 flex items-center justify-center text-lg shrink-0 shadow-[0_0_12px_rgba(255,111,38,0.2)]">
                                    {profile?.avatar_icon || "🔥"}
                                  </div>

                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="text-sm font-bold text-white">
                                        {profile?.full_name || "Solo Member"}
                                      </h4>
                                      {profile?.city && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-zinc-400">
                                          {profile.city}
                                        </span>
                                      )}
                                      <span className="text-[10px] text-zinc-500 font-mono">
                                        Applied{" "}
                                        {new Date(app.created_at).toLocaleTimeString([], {
                                          hour: "numeric",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>

                                    {/* Beacon History / Reliability Stats */}
                                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1 flex-wrap">
                                      <span className="flex items-center gap-1 font-bold text-emerald-400">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        Attended {attendedCount} Verified Squad{attendedCount === 1 ? "" : "s"}
                                      </span>
                                      {profile?.created_at && (
                                        <span>
                                          Member since {new Date(profile.created_at).toLocaleDateString([], { month: "short", year: "numeric" })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Approve / Decline Buttons */}
                                <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                                  <button
                                    onClick={() => handleDeclineApplicant(app.id)}
                                    disabled={actionLoadingId === app.id}
                                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                                  >
                                    {actionLoadingId === app.id ? "..." : "Decline"}
                                  </button>

                                  <button
                                    onClick={() => handleApproveApplicant(app.id)}
                                    disabled={
                                      actionLoadingId === app.id ||
                                      selectedBeacon.filled_slots >= selectedBeacon.total_slots
                                    }
                                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white hover:brightness-110 shadow-[0_0_12px_rgba(255,111,38,0.25)] transition-all flex items-center gap-1.5 disabled:opacity-40"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{actionLoadingId === app.id ? "..." : "Approve"}</span>
                                  </button>
                                </div>
                              </div>

                              {/* Candidate Vibe & Bio (Respecting Privacy Rule) */}
                              {showPrivate ? (
                                <div className="space-y-2 pt-2 border-t border-white/5">
                                  {profile?.bio ? (
                                    <p className="text-xs text-zinc-300 italic bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                                      &ldquo;{profile.bio}&rdquo;
                                    </p>
                                  ) : (
                                    <p className="text-xs text-zinc-500 italic">
                                      No bio statement added by member.
                                    </p>
                                  )}

                                  {/* Budget Pact Alignment & Host Answer Badge */}
                                  <div className="flex items-center gap-2 flex-wrap text-xs">
                                    <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1.5">
                                      <Coins className="w-3 h-3 text-amber-400" />
                                      <span>Comfortable with: {parsedMeta.budgetTier}</span>
                                    </span>
                                  </div>

                                  {/* Vibe Tags */}
                                  {profile?.vibe_tags && profile.vibe_tags.length > 0 && (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[10px] font-bold text-zinc-400">
                                        Vibes:
                                      </span>
                                      {profile.vibe_tags.map((tag, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[#FF6F26]/10 text-[#FF6F26] border border-[#FF6F26]/20"
                                        >
                                          #{tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-zinc-500 flex items-center gap-2">
                                  <Lock className="w-3.5 h-3.5 text-zinc-500" />
                                  <span>
                                    Bio &amp; Vibe details locked post-meetup. Connect in My Network to view full profile.
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 text-center text-xs text-zinc-500">
                        No pending join requests right now. When members apply to this meetup, they will appear here with their vibe profile and budget agreement.
                      </div>
                    )}
                  </div>

                  {/* 2. Confirmed Squad Members Roster + Host Remove Member Capability */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-white">
                          Confirmed Squad ({approvedApps.length} Members)
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: selectedBeacon.total_slots }).map((_, idx) => (
                          <span
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all ${
                              idx < selectedBeacon.filled_slots
                                ? "bg-[#FF6F26] shadow-[0_0_6px_#FF6F26]"
                                : "bg-white/10"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {approvedApps.length > 0 ? (
                      <div className="space-y-2">
                        {approvedApps.map((app) => (
                          <div
                            key={app.id}
                            className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm shrink-0">
                                {app.profiles?.avatar_icon || "🔥"}
                              </div>
                              <div>
                                <span className="text-xs font-bold text-white block">
                                  {app.profiles?.full_name || "Squad Member"}
                                </span>
                                {app.profiles?.bio && (
                                  <span className="text-[11px] text-zinc-400 italic line-clamp-1">
                                    {app.profiles.bio}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              {/* Remove Member Button (Host privilege) */}
                              <button
                                onClick={() => setMemberToRemove(app)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/20 transition-colors flex items-center gap-1"
                                title="Remove member from squad and reopen spot."
                              >
                                <UserMinus className="w-3 h-3" />
                                <span>Remove</span>
                              </button>

                              {/* Flag No-Show */}
                              {app.flagged_ghost ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                                  👻 Ghosted
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleFlagNoShow(app.id)}
                                  disabled={actionLoadingId === app.id}
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                                  title="Flag as no-show."
                                >
                                  Flag No-Show 👻
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 text-center text-xs text-zinc-500">
                        No members approved yet. Check pending join requests above!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── VIEW 3: EDIT BEACON PLANS (INCLUDES BUDGET, QUESTION & DELETE BEACON) ─── */}
              {hostTab === "edit" && (
                <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-white/10">
                  <form onSubmit={handleSaveBeaconUpdates} className="space-y-4 max-w-2xl mx-auto">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-[#FF6F26]" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                          Edit Beacon Plans, Budget &amp; Capacity
                        </h3>
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        Auto-alerts squad members
                      </span>
                    </div>

                    {/* Title */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300">Beacon Title *</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26] transition-colors"
                      />
                    </div>

                    {/* Category & Budget Tier Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-300">Category</label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value as BeaconCategory)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF6F26] transition-colors"
                        >
                          <option value="casual">Chai &amp; Casual</option>
                          <option value="sports">Sports &amp; Padel</option>
                          <option value="nightlife">Nightlife &amp; Raves</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5 text-amber-400" />
                          <span>Budget / Barter Pact</span>
                        </label>
                        <select
                          value={editBudgetTier}
                          onChange={(e) => setEditBudgetTier(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF6F26] transition-colors"
                        >
                          {BUDGET_TIERS.map((tier) => (
                            <option key={tier.id} value={tier.label}>
                              {tier.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Host's Custom Question for Candidate */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-[#FF6F26]" />
                        <span>Host Icebreaker Question (Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={editCustomQuestion}
                        onChange={(e) => setEditCustomQuestion(e.target.value)}
                        placeholder="e.g. What's your go-to coffee order? Or skill to share if barter?"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26] transition-colors"
                      />
                    </div>

                    {/* Capacity Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-300">
                          Total Slots (Min {selectedBeacon.filled_slots})
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setEditCapacity((c) =>
                                Math.max(selectedBeacon.filled_slots, Math.max(1, c - 1))
                              )
                            }
                            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center font-bold text-sm"
                          >
                            −
                          </button>
                          <span className="flex-1 text-center py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-white">
                            {editCapacity} Slots
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditCapacity((c) => Math.min(20, c + 1))}
                            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center font-bold text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-300">
                          Scheduled Date &amp; Time
                        </label>
                        <input
                          type="datetime-local"
                          value={toLocalInputDateTime(editScheduledAt)}
                          onChange={(e) =>
                            setEditScheduledAt(
                              e.target.value ? new Date(e.target.value).toISOString() : ""
                            )
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF6F26] transition-colors"
                        />
                      </div>
                    </div>

                    {/* Location & Maps */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-300">
                          Venue / Location Name
                        </label>
                        <input
                          type="text"
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                          placeholder="e.g. Secret Sky Cafe, F-7"
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26] transition-colors"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-zinc-300">
                            Google Maps Link (Optional)
                          </label>
                          {editLocation.trim() && (
                            <button
                              type="button"
                              onClick={() => {
                                const q = encodeURIComponent(editLocation.trim());
                                setEditMapsUrl(`https://www.google.com/maps/search/?api=1&query=${q}`);
                              }}
                              className="text-[10px] font-bold text-[#FFA05C] hover:text-[#FF6F26] transition-colors"
                            >
                              ⚡ Auto-fill Pin
                            </button>
                          )}
                        </div>
                        <input
                          type="url"
                          value={editMapsUrl}
                          onChange={(e) => setEditMapsUrl(e.target.value)}
                          placeholder="https://maps.google.com/..."
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26] transition-colors"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300">
                        Beacon Vibe &amp; Description
                      </label>
                      <textarea
                        rows={3}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Tell members what to expect, meetup spot, parking notes..."
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26] transition-colors resize-none"
                      />
                    </div>

                    {/* Form Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-white/10">
                      {/* Delete Beacon Button */}
                      <button
                        type="button"
                        onClick={() => handleCancelBeacon(false)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors flex items-center gap-1.5 self-start"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Cancel / Delete Meetup</span>
                      </button>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setHostTab("chat")}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          Return to Chat
                        </button>

                        <button
                          type="submit"
                          disabled={isSavingEdit}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white hover:brightness-110 shadow-[0_0_15px_rgba(255,111,38,0.3)] transition-all flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>{isSavingEdit ? "Saving..." : "Save Beacon Updates"}</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-zinc-500 space-y-3">
              <MessageSquare className="w-12 h-12 text-zinc-700" />
              <div className="text-base font-bold text-white">Select a Squad Conversation</div>
              <p className="text-xs max-w-sm">
                Pick a meetup from the channels on the left to start coordinating live, vetting applicants, and updating meetup plans.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL: REMOVE SQUAD MEMBER CONFIRMATION ─── */}
      {memberToRemove && selectedBeacon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl border border-white/10 bg-zinc-950 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <UserMinus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Remove Squad Member?</h3>
                <p className="text-xs text-zinc-400">
                  {memberToRemove.profiles?.full_name || "Member"}
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed bg-white/5 p-3 rounded-2xl border border-white/5">
              This will remove this attendee from &ldquo;{selectedBeacon.title}&rdquo; and reopen their spot for others. They will be notified that the host adjusted the squad roster.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setMemberToRemove(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-white/5"
              >
                Keep in Squad
              </button>
              <button
                onClick={handleRemoveMember}
                disabled={isRemovingMember}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-colors"
              >
                {isRemovingMember ? "Removing..." : "Confirm Removal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CANCEL BEACON DOWNGRADE CONSEQUENCE CONFIRMATION ─── */}
      {showCancelModal && selectedBeacon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl border border-rose-500/30 bg-zinc-950 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-300">
                  ⚠️ Host Reliability Downgrade Warning
                </h3>
                <p className="text-xs text-zinc-400">
                  Active audience confirmed on this meetup
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200 leading-relaxed space-y-2">
              <p>
                You have <strong>{selectedBeacon.filled_slots} confirmed member(s)</strong> who arranged their plans around this beacon.
              </p>
              <p>
                Cancelling an event with an active audience will <strong>downgrade your Host Reliability Score</strong> and add a cancellation strike to your public profile.
              </p>
            </div>

            <p className="text-[11px] text-zinc-400">
              Tip: If you only need to adjust the time, venue, or capacity, use the <strong>Edit Plans</strong> tab instead of cancelling.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-white/5"
              >
                Keep Meetup Active
              </button>
              <button
                onClick={() => handleCancelBeacon(true)}
                disabled={isCancelling}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-colors"
              >
                {isCancelling ? "Cancelling..." : "Cancel Meetup (Accept Downgrade)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── UNIVERSAL SHARE BEACON MODAL ─── */}
      {selectedBeacon && (
        <UniversalShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title={selectedBeacon.title}
          shareUrl={
            typeof window !== "undefined"
              ? `${window.location.origin}/b/${selectedBeacon.id.slice(0, 8)}`
              : `https://solonomore.com/b/${selectedBeacon.id.slice(0, 8)}`
          }
          shareText={`Join my squad meetup "${selectedBeacon.title}" on Solo-No-More!`}
          type="beacon"
        />
      )}
    </div>
  );
}
