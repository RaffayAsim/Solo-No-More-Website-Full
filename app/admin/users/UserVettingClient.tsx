"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import {
  adminUpdateUserStatusAction,
  adminSaveUserDetailsAction,
  adminCreateMemberFullAction,
} from "@/app/actions/admin";
import {
  adminApproveApplicationAction,
  adminVerifyPaymentAndIssueInviteAction,
} from "@/app/actions/member-applications";
import {
  IconX,
  IconPlus,
  IconCheck,
  IconTrash,
  IconUserPlus,
  IconUpload,
  IconCamera,
  IconImage,
  IconEye,
} from "@/components/icons/AppIcons";
import {
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Building2,
  Eye,
  Mail,
  Phone,
  CreditCard,
  Copy,
} from "lucide-react";

export interface UnifiedUserRecord {
  id: string;
  applicationId?: string;
  source: "profile" | "application";
  fullName: string;
  firstName: string;
  lastName: string;
  displayName: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  status: "approved" | "pending" | "payment_pending" | "suspended" | "rejected";
  subscriptionTier: string;
  registeredDate: string; // e.g. "5/31/2026"
  createdAtIso: string;
  city: string;
  address: string;
  cnic: string;
  bio: string;
  profilePictureUrl: string;
  cnicPictureUrl: string;
  instagramScreenshots: string[];
  instagram: string;
  packageSelected: string;
  paymentMethod?: string;
  transactionRef?: string;
  inviteToken?: string;
}

interface UserVettingClientProps {
  initialUsers: UnifiedUserRecord[];
}

export default function UserVettingClient({ initialUsers }: UserVettingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [users, setUsers] = useState<UnifiedUserRecord[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "approved" | "pending" | "suspended">("all");

  // Read filter query param
  useEffect(() => {
    const filter = searchParams?.get("filter");
    if (filter === "guest") {
      router.replace("/admin/guests");
    } else if (filter === "pending") {
      setActiveTab("pending");
    }
  }, [searchParams, router]);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // ── "USER DETAILS & EDIT" MODAL STATE ──
  const [selectedUser, setSelectedUser] = useState<UnifiedUserRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Edit form state
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("Subscriber / Member");
  const [editStatus, setEditStatus] = useState<"approved" | "pending" | "payment_pending" | "suspended" | "rejected">("approved");
  const [editPhone, setEditPhone] = useState("");
  const [editCnic, setEditCnic] = useState("");
  const [editCity, setEditCity] = useState("Karachi");
  const [editAddress, setEditAddress] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editProfilePic, setEditProfilePic] = useState("");
  const [editCnicPic, setEditCnicPic] = useState("");
  const [editInstagramShots, setEditInstagramShots] = useState<string[]>([]);
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Hidden File Inputs for Modal
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const cnicPicInputRef = useRef<HTMLInputElement>(null);
  const instaShotInputRef0 = useRef<HTMLInputElement>(null);
  const instaShotInputRef1 = useRef<HTMLInputElement>(null);

  // ── "ADD NEW MEMBER" MODAL STATE ──
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCity, setNewCity] = useState("Karachi");
  const [newCnic, setNewCnic] = useState("");
  const [newPackage, setNewPackage] = useState<"none" | "member" | "family">("member");
  const [newRole, setNewRole] = useState<"member" | "partner" | "admin">("member");
  const [isCreatingMember, setIsCreatingMember] = useState(false);

  // Sync state if server revalidates
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  // Open "User Details & Edit" modal
  const handleOpenDetails = (user: UnifiedUserRecord) => {
    setSelectedUser(user);
    setEditFirstName(user.firstName || user.fullName.split(" ")[0] || "");
    setEditLastName(user.lastName || user.fullName.split(" ").slice(1).join(" ") || "");
    setEditDisplayName(user.displayName || user.fullName || "");
    setEditUsername(user.username.replace(/^@/, ""));
    setEditEmail(user.email);
    setEditRole(
      user.role === "admin"
        ? "Admin"
        : user.role === "partner"
        ? "Partner"
        : "Subscriber / Member"
    );
    setEditStatus(user.status);
    setEditPhone(user.phone || "");
    setEditCnic(user.cnic || "");
    setEditCity(user.city || "Karachi");
    setEditAddress(user.address || "");
    setEditBio(user.bio || "");
    setEditProfilePic(user.profilePictureUrl || "");
    setEditCnicPic(user.cnicPictureUrl || "");
    setEditInstagramShots(user.instagramScreenshots || []);
    setIsDetailModalOpen(true);
  };

  // Inline Status Dropdown Change Handler
  const handleStatusChange = async (user: UnifiedUserRecord, newStatus: "approved" | "pending" | "payment_pending" | "suspended" | "rejected") => {
    setActionLoadingId(user.id);
    setFeedbackMsg(null);

    try {
      const res = await adminUpdateUserStatusAction(user.id, newStatus);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
        );
        setFeedbackMsg({
          type: "success",
          text: `Status for ${user.fullName} updated to ${newStatus.replace("_", " ").toUpperCase()}`,
        });
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to update status." });
      }
    } catch {
      setFeedbackMsg({ type: "error", text: "Connection error updating status." });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Save changes from "User Details & Edit" modal
  const handleSaveUserDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSavingDetails(true);
    setFeedbackMsg(null);

    try {
      const res = await adminSaveUserDetailsAction({
        id: selectedUser.id,
        applicationId: selectedUser.applicationId,
        firstName: editFirstName,
        lastName: editLastName,
        displayName: editDisplayName || `${editFirstName} ${editLastName}`.trim(),
        username: editUsername,
        email: editEmail,
        role: editRole,
        status: editStatus,
        phone: editPhone,
        cnic: editCnic,
        city: editCity,
        address: editAddress,
        bio: editBio,
        profilePictureUrl: editProfilePic,
        cnicPictureUrl: editCnicPic,
        instagramScreenshots: editInstagramShots,
      });

      if (res.success) {
        const updatedName = `${editFirstName} ${editLastName}`.trim() || editDisplayName;
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id
              ? {
                  ...u,
                  fullName: updatedName,
                  firstName: editFirstName,
                  lastName: editLastName,
                  displayName: editDisplayName || updatedName,
                  username: editUsername,
                  email: editEmail,
                  phone: editPhone,
                  city: editCity,
                  cnic: editCnic,
                  bio: editBio,
                  status: editStatus,
                  profilePictureUrl: editProfilePic,
                }
              : u
          )
        );
        setIsDetailModalOpen(false);
        setFeedbackMsg({ type: "success", text: `✓ Profile details for ${updatedName} successfully saved!` });
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to save profile changes." });
      }
    } catch {
      setFeedbackMsg({ type: "error", text: "Connection error while saving user." });
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Quick Approve & Issue Invoice for Pending Query
  const handleApproveAndIssuePayment = async (user: UnifiedUserRecord) => {
    setActionLoadingId(user.id);
    setFeedbackMsg(null);

    const targetId = user.applicationId || user.id;
    try {
      const res = await adminApproveApplicationAction(targetId);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: "payment_pending" } : u))
        );
        if (selectedUser?.id === user.id) {
          setEditStatus("payment_pending");
        }
        setFeedbackMsg({
          type: "success",
          text: `✓ ${user.fullName} approved for payment! Invoice link is now ready.`,
        });
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to approve member." });
      }
    } catch {
      setFeedbackMsg({ type: "error", text: "Connection error approving member." });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Create New Member Manually (Auto-Approved)
  const handleCreateNewMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName || !newEmail) {
      setFeedbackMsg({ type: "error", text: "First Name and Email are required." });
      return;
    }

    setIsCreatingMember(true);
    setFeedbackMsg(null);

    try {
      const res = await adminCreateMemberFullAction({
        firstName: newFirstName,
        lastName: newLastName,
        username: newUsername || newEmail.split("@")[0],
        email: newEmail,
        phone: newPhone,
        city: newCity,
        cnic: newCnic,
        packageTier: newPackage,
        role: newRole,
      });

      if (res.success) {
        setIsAddMemberModalOpen(false);
        setNewFirstName("");
        setNewLastName("");
        setNewUsername("");
        setNewEmail("");
        setNewPhone("");
        setNewCnic("");
        setFeedbackMsg({ type: "success", text: `✓ New member officially onboarded as Auto-Approved!` });
        router.refresh();
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to create member." });
      }
    } catch {
      setFeedbackMsg({ type: "error", text: "Connection error while creating member." });
    } finally {
      setIsCreatingMember(false);
    }
  };

  // File Upload Helper (Canvas Compression)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setter(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Filter logic for Members
  const filteredUsers = users.filter((u) => {
    if (activeTab === "approved") {
      if (u.status !== "approved") return false;
    }
    if (activeTab === "pending" && u.status !== "pending" && u.status !== "payment_pending") return false;
    if (activeTab === "suspended" && u.status !== "suspended") return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.city.toLowerCase().includes(q)
    );
  });

  const countAll = users.length;
  const countApproved = users.filter((u) => u.status === "approved").length;
  const countPending = users.filter((u) => u.status === "pending" || u.status === "payment_pending").length;
  const countSuspended = users.filter((u) => u.status === "suspended").length;

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px 20px" }}>
      {/* ── 1. HEADER & ACTION TOOLBAR ──────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: 900, color: "#FFFFFF", margin: 0, letterSpacing: "-0.02em" }}>
              Members &amp; Users
            </h1>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#FF8A3D",
                background: "rgba(255, 111, 38, 0.15)",
                border: "1px solid rgba(255, 111, 38, 0.35)",
                padding: "2px 8px",
                borderRadius: "6px",
              }}
            >
              PAID &amp; PENDING ROSTER
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.55)", margin: "4px 0 0" }}>
            Manage active verified members, approve new applicant queries, and configure profile parameters.
          </p>
        </div>

        {/* Top Right: Add New Member Button */}
        <button
          type="button"
          onClick={() => setIsAddMemberModalOpen(true)}
          style={{
            background: "linear-gradient(135deg, #FF6F26 0%, #FF4400 100%)",
            color: "#FFFFFF",
            fontSize: "13px",
            fontWeight: 800,
            padding: "10px 18px",
            borderRadius: "12px",
            border: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 16px rgba(255, 111, 38, 0.4)",
            transition: "transform 0.15s ease",
          }}
          className="hover:scale-105 active:scale-95"
        >
          <IconUserPlus size={16} color="#FFFFFF" />
          <span>+ Add New Member</span>
        </button>
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
                ? "1px solid rgba(39, 201, 63, 0.4)"
                : "1px solid rgba(255, 59, 48, 0.4)",
            color: feedbackMsg.type === "success" ? "#27C93F" : "#FF3B30",
          }}
        >
          {feedbackMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* ── 3. FILTER TABS & SEARCH BAR ─────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "18px",
        }}
      >
        {/* Navigation Tabs */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "4px",
            gap: "4px",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              fontSize: "12.5px",
              fontWeight: 800,
              cursor: "pointer",
              border: "none",
              background: activeTab === "all" ? "rgba(255, 111, 38, 0.2)" : "transparent",
              color: activeTab === "all" ? "#FF8A3D" : "rgba(255, 255, 255, 0.6)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>All Members</span>
            <span style={{ fontSize: "10px", opacity: 0.8 }}>({countAll})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("approved")}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              fontSize: "12.5px",
              fontWeight: 800,
              cursor: "pointer",
              border: "none",
              background: activeTab === "approved" ? "rgba(39, 201, 63, 0.2)" : "transparent",
              color: activeTab === "approved" ? "#27C93F" : "rgba(255, 255, 255, 0.6)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>Approved (Paid)</span>
            <span style={{ fontSize: "10px", opacity: 0.8 }}>({countApproved})</span>
          </button>


          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              fontSize: "12.5px",
              fontWeight: 800,
              cursor: "pointer",
              border: "none",
              background: activeTab === "pending" ? "rgba(255, 149, 0, 0.2)" : "transparent",
              color: activeTab === "pending" ? "#FF9500" : "rgba(255, 255, 255, 0.6)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>Pending Applications</span>
            <span style={{ fontSize: "10px", opacity: 0.8 }}>({countPending})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("suspended")}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              fontSize: "12.5px",
              fontWeight: 800,
              cursor: "pointer",
              border: "none",
              background: activeTab === "suspended" ? "rgba(255, 59, 48, 0.2)" : "transparent",
              color: activeTab === "suspended" ? "#FF3B30" : "rgba(255, 255, 255, 0.6)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>Suspended</span>
            <span style={{ fontSize: "10px", opacity: 0.8 }}>({countSuspended})</span>
          </button>
        </div>

        {/* Search input */}
        <div style={{ position: "relative", minWidth: "260px" }}>
          <Search
            size={15}
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }}
          />
          <input
            type="text"
            placeholder="Search by name, @username, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 14px 8px 34px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "10px",
              color: "#FFFFFF",
              fontSize: "12.5px",
              outline: "none",
            }}
            className="focus:border-[#FF6F26]"
          />
        </div>
      </div>

      {/* ── 4. MEMBERS DATA TABLE (EXACT REQUESTED COLUMNS) ──────────────── */}
      <div
        style={{
          overflow: "hidden",
          borderRadius: "20px",
          background: "linear-gradient(180deg, rgba(18, 12, 24, 0.95) 0%, rgba(8, 4, 12, 0.95) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  background: "rgba(255, 255, 255, 0.02)",
                  color: "rgba(255, 255, 255, 0.55)",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontSize: "11px",
                }}
              >
                <th style={{ padding: "16px 20px" }}>Name / Username</th>
                <th style={{ padding: "16px 20px" }}>Email</th>
                <th style={{ padding: "16px 20px" }}>Role</th>
                <th style={{ padding: "16px 20px" }}>Status</th>
                <th style={{ padding: "16px 20px" }}>Registered</th>
                <th style={{ padding: "16px 20px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const initial = (user.fullName || "M").charAt(0).toUpperCase();
                  const isLoading = actionLoadingId === user.id;

                  return (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                        transition: "background-color 0.15s ease",
                      }}
                      className="hover:bg-white/[0.03]"
                    >
                      {/* Name / Username */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {/* Avatar Circle */}
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "10px",
                              background: user.profilePictureUrl
                                ? "transparent"
                                : "linear-gradient(135deg, #FF6F26, #E02E00)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#FFFFFF",
                              fontWeight: 800,
                              fontSize: "14px",
                              overflow: "hidden",
                              flexShrink: 0,
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                            }}
                          >
                            {user.profilePictureUrl ? (
                              <img src={user.profilePictureUrl} alt={user.fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              initial
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: "#FFFFFF", fontSize: "13.5px" }}>
                              {user.fullName}
                            </div>
                            <div style={{ fontSize: "11.5px", color: "#FF8A3D", fontWeight: 700, marginTop: "1px" }}>
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: "16px 20px", color: "rgba(255, 255, 255, 0.8)", fontFamily: "monospace", fontSize: "12px" }}>
                        {user.email}
                      </td>

                      {/* Role */}
                      <td style={{ padding: "16px 20px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 800,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            textTransform: "capitalize",
                            background:
                              user.role === "admin"
                                ? "rgba(168, 85, 247, 0.15)"
                                : user.role === "partner"
                                ? "rgba(59, 130, 246, 0.15)"
                                : "rgba(255, 255, 255, 0.08)",
                            color:
                              user.role === "admin"
                                ? "#C084FC"
                                : user.role === "partner"
                                ? "#60A5FA"
                                : "#FFFFFF",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                          }}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Status: DIRECT INTERACTIVE DROPDOWN OPTION */}
                      <td style={{ padding: "16px 20px" }}>
                        <select
                          value={user.status}
                          disabled={isLoading}
                          onChange={(e) =>
                            handleStatusChange(
                              user,
                              e.target.value as "approved" | "pending" | "payment_pending" | "suspended" | "rejected"
                            )
                          }
                          style={{
                            padding: "5px 10px",
                            borderRadius: "8px",
                            fontSize: "11.5px",
                            fontWeight: 800,
                            cursor: "pointer",
                            outline: "none",
                            background:
                              user.status === "approved"
                                ? "rgba(39, 201, 63, 0.15)"
                                : user.status === "pending"
                                ? "rgba(255, 149, 0, 0.15)"
                                : user.status === "payment_pending"
                                ? "rgba(234, 179, 8, 0.18)"
                                : "rgba(255, 59, 48, 0.15)",
                            color:
                              user.status === "approved"
                                ? "#27C93F"
                                : user.status === "pending"
                                ? "#FF9500"
                                : user.status === "payment_pending"
                                ? "#FACC15"
                                : "#FF3B30",
                            border:
                              user.status === "approved"
                                ? "1px solid rgba(39, 201, 63, 0.4)"
                                : user.status === "pending"
                                ? "1px solid rgba(255, 149, 0, 0.4)"
                                : user.status === "payment_pending"
                                ? "1px solid rgba(234, 179, 8, 0.45)"
                                : "1px solid rgba(255, 59, 48, 0.4)",
                          }}
                        >
                          <option value="approved" style={{ background: "#1E1428", color: "#27C93F" }}>Approved</option>
                          <option value="pending" style={{ background: "#1E1428", color: "#FF9500" }}>Pending</option>
                          <option value="payment_pending" style={{ background: "#1E1428", color: "#FACC15" }}>Payment Pending</option>
                          <option value="suspended" style={{ background: "#1E1428", color: "#FF3B30" }}>Suspended</option>
                          <option value="rejected" style={{ background: "#1E1428", color: "#8E8E93" }}>Rejected</option>
                        </select>
                      </td>

                      {/* Registered Date */}
                      <td style={{ padding: "16px 20px", color: "rgba(255, 255, 255, 0.6)", fontSize: "12px", fontWeight: 600 }}>
                        {user.registeredDate}
                      </td>

                      {/* Actions: View Details */}
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                          {/* Quick Invoice Link button for payment pending */}
                          {user.status === "payment_pending" && (
                            <button
                              type="button"
                              onClick={() => {
                                const url = `${window.location.origin}/pay/${user.applicationId || user.id}`;
                                navigator.clipboard.writeText(url);
                                setCopiedText(user.id);
                                setTimeout(() => setCopiedText(null), 2000);
                              }}
                              title="Copy Payment Link"
                              style={{
                                background: "rgba(255, 149, 0, 0.15)",
                                border: "1px solid rgba(255, 149, 0, 0.35)",
                                color: "#FF9500",
                                padding: "6px 10px",
                                borderRadius: "8px",
                                fontSize: "11px",
                                fontWeight: 800,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <CreditCard size={12} />
                              <span>{copiedText === user.id ? "Link Copied!" : "Invoice Link"}</span>
                            </button>
                          )}

                          {/* View details button */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(user)}
                            style={{
                              background: "rgba(255, 255, 255, 0.08)",
                              border: "1px solid rgba(255, 255, 255, 0.16)",
                              borderRadius: "8px",
                              padding: "6px 12px",
                              color: "#FFFFFF",
                              fontSize: "12px",
                              fontWeight: 800,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              transition: "all 0.15s ease",
                            }}
                            className="hover:bg-white/20 hover:border-white/30"
                          >
                            <IconEye size={14} color="#FFFFFF" />
                            <span>View details</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: "40px 20px", textAlign: "center", color: "rgba(255, 255, 255, 0.4)" }}>
                    No members match your filter query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          5. "USER DETAILS & EDIT" MODAL (MATCHING USER IMAGES 2 & 3)
          ═════════════════════════════════════════════════════════════════════ */}
      {isDetailModalOpen && mounted && createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.90)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            zIndex: 999999,
            overflowY: "auto",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDetailModalOpen(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "880px",
              maxHeight: "92vh",
              background: "linear-gradient(180deg, #160E1D 0%, #0A0610 100%)",
              border: "1px solid rgba(255, 111, 38, 0.35)",
              borderRadius: "24px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 24px 80px rgba(0, 0, 0, 0.95)",
              overflow: "hidden",
              position: "relative",
              zIndex: 1000000,
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(255, 255, 255, 0.02)",
              }}
            >
              <div>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#FF8A3D", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  User Details &amp; Edit
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #FF6F26, #FF4400)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#FFFFFF",
                      fontWeight: 900,
                      fontSize: "15px",
                    }}
                  >
                    {(editDisplayName || "K").slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ fontSize: "17px", fontWeight: 900, color: "#FFFFFF", margin: 0 }}>
                      {editDisplayName || "User Profile"}
                    </h2>
                    <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.55)" }}>
                      @{editUsername} • {editEmail}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.18)",
                  borderRadius: "10px",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  cursor: "pointer",
                }}
                className="hover:bg-white/20"
              >
                <IconX size={18} color="#FFFFFF" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form
              onSubmit={handleSaveUserDetails}
              style={{
                padding: "24px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {/* Photo Preview Cards (Side by Side: Profile Picture & CNIC Picture) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* Profile Picture Card */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "16px",
                    padding: "16px",
                    textAlign: "center",
                  }}
                >
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.75)", marginBottom: "10px" }}>
                    Profile Picture
                  </label>
                  <input
                    type="file"
                    ref={profilePicInputRef}
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setEditProfilePic)}
                    style={{ display: "none" }}
                  />
                  <div
                    onClick={() => profilePicInputRef.current?.click()}
                    style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "14px",
                      border: "1px dashed rgba(255, 255, 255, 0.2)",
                      background: "rgba(0, 0, 0, 0.3)",
                      margin: "0 auto 10px",
                      overflow: "hidden",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    className="hover:border-[#FF6F26]"
                  >
                    {editProfilePic ? (
                      <img src={editProfilePic} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.4)", fontWeight: 700 }}>No image</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => profilePicInputRef.current?.click()}
                    style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#FFFFFF",
                      padding: "5px 12px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {editProfilePic ? "Change Photo" : "Upload Photo"}
                  </button>
                </div>

                {/* CNIC Picture Card */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "16px",
                    padding: "16px",
                    textAlign: "center",
                  }}
                >
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.75)", marginBottom: "10px" }}>
                    CNIC Picture
                  </label>
                  <input
                    type="file"
                    ref={cnicPicInputRef}
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setEditCnicPic)}
                    style={{ display: "none" }}
                  />
                  <div
                    onClick={() => cnicPicInputRef.current?.click()}
                    style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "14px",
                      border: "1px dashed rgba(255, 255, 255, 0.2)",
                      background: "rgba(0, 0, 0, 0.3)",
                      margin: "0 auto 10px",
                      overflow: "hidden",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    className="hover:border-[#FF6F26]"
                  >
                    {editCnicPic ? (
                      <img src={editCnicPic} alt="CNIC" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.4)", fontWeight: 700 }}>No image</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => cnicPicInputRef.current?.click()}
                    style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#FFFFFF",
                      padding: "5px 12px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {editCnicPic ? "Change Photo" : "Upload CNIC"}
                  </button>
                </div>
              </div>

              {/* Row 1: First Name & Last Name */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", marginBottom: "6px" }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(0, 0, 0, 0.35)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", marginBottom: "6px" }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(0, 0, 0, 0.35)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Row 2: Display Name & Username */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", marginBottom: "6px" }}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(0, 0, 0, 0.35)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", marginBottom: "6px" }}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(0, 0, 0, 0.35)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Row 3: Email & Role */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", marginBottom: "6px" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(0, 0, 0, 0.35)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", marginBottom: "6px" }}>
                    Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#1E1428",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  >
                    <option value="Subscriber / Member">Subscriber / Member</option>
                    <option value="Partner">Partner</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Status & Phone */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", marginBottom: "6px" }}>
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#1E1428",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="payment_pending">Payment Pending</option>
                    <option value="suspended">Suspended</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", marginBottom: "6px" }}>
                    Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0300 1234567"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(0, 0, 0, 0.35)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Row 5: CNIC & City */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", marginBottom: "6px" }}>
                    CNIC Number
                  </label>
                  <input
                    type="text"
                    placeholder="42101-1234567-1"
                    value={editCnic}
                    onChange={(e) => setEditCnic(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(0, 0, 0, 0.35)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", marginBottom: "6px" }}>
                    City Radar Hub
                  </label>
                  <select
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#1E1428",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  >
                    <option value="Karachi">Karachi</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Islamabad">Islamabad</option>
                  </select>
                </div>
              </div>

              {/* Row 6: Address & Bio */}
              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", marginBottom: "6px" }}>
                  Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. DHA Phase 6, Karachi"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "rgba(0, 0, 0, 0.35)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "12px",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", marginBottom: "6px" }}>
                  Bio &amp; Vibe Statement
                </label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell community members about personal vibe, interests..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "rgba(0, 0, 0, 0.35)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "12px",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    outline: "none",
                    resize: "none",
                  }}
                />
              </div>

              {/* Instagram Screenshots (Matching Image 3) */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#FFFFFF", marginBottom: "4px" }}>
                  Instagram Screenshots (max 2 images)
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "8px" }}>
                  {/* Slot 0 */}
                  <input
                    type="file"
                    ref={instaShotInputRef0}
                    accept="image/*"
                    onChange={(e) =>
                      handleFileUpload(e, (dataUrl) =>
                        setEditInstagramShots((prev) => [dataUrl, prev[1] || ""])
                      )
                    }
                    style={{ display: "none" }}
                  />
                  <div
                    onClick={() => instaShotInputRef0.current?.click()}
                    style={{
                      height: "120px",
                      borderRadius: "14px",
                      border: "1px dashed rgba(255, 255, 255, 0.25)",
                      background: "rgba(0, 0, 0, 0.35)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: "10px",
                      overflow: "hidden",
                    }}
                    className="hover:border-[#FF6F26]"
                  >
                    {editInstagramShots[0] ? (
                      <img src={editInstagramShots[0]} alt="Screenshot 1" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
                    ) : (
                      <div style={{ textAlign: "center", color: "rgba(255, 255, 255, 0.45)", fontSize: "11px" }}>
                        <div style={{ fontWeight: 700, marginBottom: "2px" }}>Click to upload</div>
                        <div>or paste URL below</div>
                      </div>
                    )}
                  </div>

                  {/* Slot 1 */}
                  <input
                    type="file"
                    ref={instaShotInputRef1}
                    accept="image/*"
                    onChange={(e) =>
                      handleFileUpload(e, (dataUrl) =>
                        setEditInstagramShots((prev) => [prev[0] || "", dataUrl])
                      )
                    }
                    style={{ display: "none" }}
                  />
                  <div
                    onClick={() => instaShotInputRef1.current?.click()}
                    style={{
                      height: "120px",
                      borderRadius: "14px",
                      border: "1px dashed rgba(255, 255, 255, 0.25)",
                      background: "rgba(0, 0, 0, 0.35)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: "10px",
                      overflow: "hidden",
                    }}
                    className="hover:border-[#FF6F26]"
                  >
                    {editInstagramShots[1] ? (
                      <img src={editInstagramShots[1]} alt="Screenshot 2" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
                    ) : (
                      <div style={{ textAlign: "center", color: "rgba(255, 255, 255, 0.45)", fontSize: "11px" }}>
                        <div style={{ fontWeight: 700, marginBottom: "2px" }}>Click to upload</div>
                        <div>or paste URL below</div>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)", marginTop: "6px" }}>
                  Max 2 images • Upload by clicking empty slots or paste URLs
                </div>
              </div>

              {/* Action Buttons at bottom of Modal */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "10px",
                  paddingTop: "16px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                {/* For pending members: Quick Approve & Send Invoice */}
                {selectedUser && (selectedUser.status === "pending" || selectedUser.status === "payment_pending") && (
                  <button
                    type="button"
                    onClick={() => handleApproveAndIssuePayment(selectedUser)}
                    disabled={actionLoadingId === selectedUser.id}
                    style={{
                      background: "rgba(255, 149, 0, 0.18)",
                      border: "1px solid rgba(255, 149, 0, 0.4)",
                      color: "#FF9500",
                      padding: "9px 16px",
                      borderRadius: "10px",
                      fontSize: "12.5px",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      marginRight: "auto",
                    }}
                  >
                    <CreditCard size={14} />
                    <span>Approve &amp; Send Invoice</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#FFFFFF",
                    padding: "9px 18px",
                    borderRadius: "10px",
                    fontSize: "12.5px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>

                <button
                  type="submit"
                  disabled={isSavingDetails}
                  style={{
                    background: "linear-gradient(135deg, #FF6F26, #FF4400)",
                    border: "none",
                    color: "#FFFFFF",
                    padding: "9px 22px",
                    borderRadius: "10px",
                    fontSize: "12.5px",
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(255, 111, 38, 0.4)",
                  }}
                >
                  {isSavingDetails ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          6. "ADD NEW MEMBER" MODAL (MANUAL ONBOARDING BY ADMIN)
          ═════════════════════════════════════════════════════════════════════ */}
      {isAddMemberModalOpen && mounted && createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.90)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            zIndex: 999999,
            overflowY: "auto",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddMemberModalOpen(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "600px",
              background: "linear-gradient(180deg, #160E1D 0%, #0A0610 100%)",
              border: "1px solid rgba(255, 111, 38, 0.35)",
              borderRadius: "24px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 24px 80px rgba(0, 0, 0, 0.95)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(255, 255, 255, 0.02)",
              }}
            >
              <div>
                <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#FF8A3D", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Direct Member Enrollment
                </span>
                <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#FFFFFF", margin: "2px 0 0" }}>
                  Add New Member
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMemberModalOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.18)",
                  borderRadius: "10px",
                  width: "34px",
                  height: "34px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  cursor: "pointer",
                }}
              >
                <IconX size={16} color="#FFFFFF" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateNewMember} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", marginBottom: "5px" }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kazim"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      background: "rgba(0, 0, 0, 0.35)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", marginBottom: "5px" }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Noor"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      background: "rgba(0, 0, 0, 0.35)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", marginBottom: "5px" }}>
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KazimNoor"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      background: "rgba(0, 0, 0, 0.35)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", marginBottom: "5px" }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. member@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      background: "rgba(0, 0, 0, 0.35)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", marginBottom: "5px" }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="0300 1234567"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      background: "rgba(0, 0, 0, 0.35)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", marginBottom: "5px" }}>
                    City Radar Hub
                  </label>
                  <select
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      background: "#1E1428",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                      outline: "none",
                    }}
                  >
                    <option value="Karachi">Karachi</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Islamabad">Islamabad</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", marginBottom: "5px" }}>
                    Membership Package
                  </label>
                  <select
                    value={newPackage}
                    onChange={(e) => setNewPackage(e.target.value as any)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      background: "#1E1428",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                      outline: "none",
                    }}
                  >
                    <option value="none">Explorer / Free Tier</option>
                    <option value="member">Solo Pass Pro (Member)</option>
                    <option value="family">VIP Inner Circle (Family Tier)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "rgba(255, 255, 255, 0.7)", marginBottom: "5px" }}>
                    Role Assignment
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      background: "#1E1428",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                      outline: "none",
                    }}
                  >
                    <option value="member">Standard Member</option>
                    <option value="partner">Venue / Artist Partner</option>
                    <option value="admin">Operations Admin</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  background: "rgba(39, 201, 63, 0.08)",
                  border: "1px solid rgba(39, 201, 63, 0.25)",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  color: "#27C93F",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <CheckCircle2 size={16} />
                <span>Account will be automatically marked as Approved with instant lobby access.</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#FFFFFF",
                    padding: "9px 18px",
                    borderRadius: "10px",
                    fontSize: "12.5px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingMember}
                  style={{
                    background: "linear-gradient(135deg, #FF6F26, #FF4400)",
                    border: "none",
                    color: "#FFFFFF",
                    padding: "9px 20px",
                    borderRadius: "10px",
                    fontSize: "12.5px",
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(255, 111, 38, 0.4)",
                  }}
                >
                  {isCreatingMember ? "Creating..." : "Create & Approve Member"}
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
