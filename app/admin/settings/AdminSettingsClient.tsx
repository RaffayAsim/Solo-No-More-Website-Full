"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Key,
  Users,
  Search,
  Check,
  X,
  Sliders,
  Sparkles,
  Lock,
  Mail,
  Phone,
  User,
  ShieldAlert,
  ArrowRight,
  Eye,
} from "lucide-react";
import {
  DelegatedManager,
  PlatformUserOption,
  assignExistingUserAsManagerAction,
  createNewManagerProfileAction,
  updateManagerPermissionsAction,
  removeManagerDelegationAction,
} from "@/app/actions/team-permissions";

export interface PermissionScopeDef {
  key: string;
  name: string;
  desc: string;
  category: "Events & Scanner" | "Bookings & Gate" | "Users & Vetting" | "Partners & Artists" | "Finance & Wires";
}

export const ADMIN_PERMISSION_SCOPES: PermissionScopeDef[] = [
  // Events
  {
    key: "events.view",
    name: "View Official Events",
    desc: "Browse upcoming and published events lineup",
    category: "Events & Scanner",
  },
  {
    key: "events.manage",
    name: "Create & Edit Events",
    desc: "Publish, reschedule, and edit event parameters",
    category: "Events & Scanner",
  },
  {
    key: "events.door_scanner",
    name: "Camera Door Scanner",
    desc: "Live camera barcode scanning & guest admission",
    category: "Events & Scanner",
  },

  // Bookings
  {
    key: "bookings.view",
    name: "View Bookings Roster",
    desc: "Access member and guest ticket pass lists",
    category: "Bookings & Gate",
  },
  {
    key: "bookings.approve",
    name: "Approve & Manage Bookings",
    desc: "Approve or decline pass applications & update status",
    category: "Bookings & Gate",
  },

  // Users
  {
    key: "members.view",
    name: "View Member Directory",
    desc: "Browse vetted solo members and profiles",
    category: "Users & Vetting",
  },
  {
    key: "members.manage",
    name: "Verify & Vet Profiles",
    desc: "Approve vetting submissions and suspend accounts",
    category: "Users & Vetting",
  },

  // Partners & Artists
  {
    key: "partners.manage",
    name: "Manage Venue Partners",
    desc: "Review venue deals and partner onboarding",
    category: "Partners & Artists",
  },
  {
    key: "artists.manage",
    name: "Manage Artists & EPKs",
    desc: "Verify resident artists and sound rider specs",
    category: "Partners & Artists",
  },

  // Finance
  {
    key: "payments.view",
    name: "View Payment Receipts",
    desc: "Review Raast & SadePay screenshots & transactions",
    category: "Finance & Wires",
  },
  {
    key: "payments.verify",
    name: "Confirm Payment Receipts",
    desc: "Mark ticket payments as confirmed / received",
    category: "Finance & Wires",
  },
];

interface AdminSettingsClientProps {
  initialSubAdmins: DelegatedManager[];
  platformUsers: PlatformUserOption[];
  currentAdminEmail?: string;
}

export default function AdminSettingsClient({
  initialSubAdmins,
  platformUsers,
  currentAdminEmail = "admin@solonomore.com",
}: AdminSettingsClientProps) {
  const router = useRouter();
  const [subAdmins, setSubAdmins] = useState<DelegatedManager[]>(initialSubAdmins);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"existing" | "new">("existing");

  // Selected Existing User
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // New Profile Form
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // Scopes State for assignment
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    "events.view",
    "events.door_scanner",
    "bookings.view",
    "bookings.approve",
  ]);

  // Edit Permissions Modal
  const [editingManager, setEditingManager] = useState<DelegatedManager | null>(null);
  const [editScopes, setEditScopes] = useState<string[]>([]);

  // Action status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredUsers = platformUsers.filter((u) => {
    const q = userSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone || "").includes(q)
    );
  });

  const toggleScope = (scopeKey: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scopeKey)
        ? prev.filter((s) => s !== scopeKey)
        : [...prev, scopeKey]
    );
  };

  const toggleEditScope = (scopeKey: string) => {
    setEditScopes((prev) =>
      prev.includes(scopeKey)
        ? prev.filter((s) => s !== scopeKey)
        : [...prev, scopeKey]
    );
  };

  const handleSelectAllScopes = () => {
    setSelectedScopes(ADMIN_PERMISSION_SCOPES.map((s) => s.key));
  };

  const handleClearScopes = () => {
    setSelectedScopes([]);
  };

  // ─── Assign Existing User ───────────────────────────────────────────────────
  const handleAssignExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setErrorMsg("Please select an existing member or guest profile.");
      return;
    }

    const targetUser = platformUsers.find((u) => u.id === selectedUserId);
    if (!targetUser) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await assignExistingUserAsManagerAction({
        delegatorId: "admin_root",
        delegatorName: currentAdminEmail,
        type: "sub_admin",
        targetUserId: targetUser.id,
        managerName: targetUser.fullName,
        managerEmail: targetUser.email,
        managerPhone: targetUser.phone,
        permissions: selectedScopes,
      });

      if (res.success && res.delegation) {
        setSubAdmins((prev) => [
          res.delegation!,
          ...prev.filter((d) => d.id !== res.delegation!.id),
        ]);
        setSuccessMsg(`✓ Successfully assigned ${targetUser.fullName} as Sub-Admin!`);
        setIsModalOpen(false);
        setSelectedUserId("");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to assign sub-admin.");
      }
    } catch {
      setErrorMsg("Network error assigning sub-admin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Create Brand New Sub-Admin ─────────────────────────────────────────────
  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || !newFullName) {
      setErrorMsg("Please fill in Name, Email, and Password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await createNewManagerProfileAction({
        delegatorId: "admin_root",
        delegatorName: currentAdminEmail,
        type: "sub_admin",
        email: newEmail,
        password: newPassword,
        fullName: newFullName,
        phone: newPhone,
        permissions: selectedScopes,
      });

      if (res.success && res.delegation) {
        setSubAdmins((prev) => [res.delegation!, ...prev]);
        setSuccessMsg(`✓ Created new Sub-Admin profile for ${newFullName}!`);
        setIsModalOpen(false);
        setNewEmail("");
        setNewPassword("");
        setNewFullName("");
        setNewPhone("");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to create sub-admin.");
      }
    } catch {
      setErrorMsg("Network error creating sub-admin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Update Permissions ─────────────────────────────────────────────────────
  const handleSaveEditPermissions = async () => {
    if (!editingManager) return;
    setIsSubmitting(true);
    try {
      const res = await updateManagerPermissionsAction({
        delegationId: editingManager.id,
        permissions: editScopes,
      });

      if (res.success) {
        setSubAdmins((prev) =>
          prev.map((d) =>
            d.id === editingManager.id ? { ...d, permissions: editScopes } : d
          )
        );
        setSuccessMsg("✓ Sub-Admin permission scopes updated!");
        setEditingManager(null);
      } else {
        alert(res.error || "Failed to update permissions.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Toggle Active/Suspended Status ─────────────────────────────────────────
  const handleToggleStatus = async (delegation: DelegatedManager) => {
    const newStatus = delegation.status === "active" ? "suspended" : "active";
    const res = await updateManagerPermissionsAction({
      delegationId: delegation.id,
      status: newStatus,
    });

    if (res.success) {
      setSubAdmins((prev) =>
        prev.map((d) => (d.id === delegation.id ? { ...d, status: newStatus } : d))
      );
    }
  };

  // ─── Remove Sub-Admin ───────────────────────────────────────────────────────
  const handleRemove = async (delegationId: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke Sub-Admin access for ${name}?`)) {
      return;
    }

    const res = await removeManagerDelegationAction(delegationId);
    if (res.success) {
      setSubAdmins((prev) => prev.filter((d) => d.id !== delegationId));
      setSuccessMsg(`✓ Revoked Sub-Admin privileges for ${name}.`);
    } else {
      alert(res.error || "Failed to remove sub-admin.");
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Top Header Banner ──────────────────────────────────────────────── */}
      <div className="rounded-3xl bg-gradient-to-r from-white/[0.04] to-white/[0.01] border border-white/10 p-6 md:p-8 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FF6F26]/15 text-[#FFA05C] border border-[#FF6F26]/30 flex items-center gap-1">
              <Key className="w-3 h-3" />
              <span>GitHub-Token Style Permissions</span>
            </span>
            <span className="text-xs text-zinc-400">Granular Access Control</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-[#FF6F26]" />
            <span>Admin Settings &amp; Sub-Admin Access</span>
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Delegate operation workloads without compromising master security. Assign trusted sub-admins to review bookings, verify payment wires, or operate live door gate scanners with fine-grained scopes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsModalOpen(true);
            setErrorMsg(null);
          }}
          className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF4400] text-white hover:scale-105 transition-all shadow-[0_0_25px_rgba(255,111,38,0.4)] flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Sub-Admin</span>
        </button>
      </div>

      {/* Alert Notices */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ── Sub-Admins Roster List ─────────────────────────────────────────── */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#FF6F26]" />
              <span>Authorized Sub-Admins ({subAdmins.length})</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Team members with active delegated tokens into Solo-No-More operations.
            </p>
          </div>
        </div>

        {subAdmins.length > 0 ? (
          <div className="divide-y divide-white/5 border border-white/10 rounded-2xl overflow-hidden bg-black/40">
            {subAdmins.map((admin) => {
              const isActive = admin.status === "active";
              return (
                <div
                  key={admin.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="font-extrabold text-white text-sm">
                        {admin.manager_name}
                      </h4>
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isActive
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-zinc-800 text-zinc-500 border-zinc-700"
                        }`}
                      >
                        {isActive ? "● Active Token" : "○ Suspended"}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        ID: #{admin.id.slice(0, 10)}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-400 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 font-mono text-zinc-300">
                        <Mail className="w-3 h-3 text-zinc-500" />
                        {admin.manager_email}
                      </span>
                      {admin.manager_phone && (
                        <span className="flex items-center gap-1 text-zinc-400">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          {admin.manager_phone}
                        </span>
                      )}
                    </div>

                    {/* Granted Scope Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">
                        Granted Scopes:
                      </span>
                      {admin.permissions.map((p) => {
                        const def = ADMIN_PERMISSION_SCOPES.find((s) => s.key === p);
                        return (
                          <span
                            key={p}
                            className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-[#FF6F26]/10 text-[#FFA05C] border border-[#FF6F26]/20"
                            title={def?.desc || p}
                          >
                            {def?.name || p}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingManager(admin);
                        setEditScopes([...admin.permissions]);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Edit Scopes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(admin)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isActive
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                      }`}
                    >
                      {isActive ? "Suspend" : "Activate"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemove(admin.id, admin.manager_name)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      title="Permanently revoke delegated access token"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Revoke</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center rounded-3xl border border-dashed border-white/10 space-y-2">
            <Key className="w-8 h-8 text-zinc-600 mx-auto" />
            <div className="text-sm font-bold text-white">No Sub-Admins Assigned Yet</div>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              You are currently managing all operations directly. Add a sub-admin to delegate ticket approvals or gate check-ins.
            </p>
          </div>
        )}
      </div>

      {/* ── ADD SUB-ADMIN MODAL ───────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#100b1a] p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFA05C]">
                  Role Delegation &amp; Security Scopes
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  Assign New Sub-Admin
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Selection Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/[0.03] border border-white/10">
              <button
                type="button"
                onClick={() => setModalTab("existing")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  modalTab === "existing"
                    ? "bg-[#FF6F26] text-white shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Option 1: Pick Existing Member / Guest
              </button>
              <button
                type="button"
                onClick={() => setModalTab("new")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  modalTab === "new"
                    ? "bg-[#FF6F26] text-white shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Option 2: Create Brand-New Profile
              </button>
            </div>

            {/* FORM A: Pick Existing User */}
            {modalTab === "existing" && (
              <form onSubmit={handleAssignExisting} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 block">
                    Select Member or Guest from Platform Directory *
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Filter directory by name, email, or phone..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6F26]"
                    />
                  </div>

                  <select
                    size={5}
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full p-2 rounded-xl bg-[#0c0914] border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-[#FF6F26]"
                  >
                    {filteredUsers.map((u) => (
                      <option key={u.id} value={u.id} className="p-2 border-b border-white/5 hover:bg-white/5">
                        {u.fullName} — {u.email} ({u.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Granular Scope Selector */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300">
                      Granular GitHub-Token Permission Scopes
                    </span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={handleSelectAllScopes}
                        className="text-[#FFA05C] hover:underline font-semibold"
                      >
                        Select All
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={handleClearScopes}
                        className="text-zinc-500 hover:text-zinc-300 font-semibold"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1 custom-scrollbar">
                    {ADMIN_PERMISSION_SCOPES.map((scope) => {
                      const isChecked = selectedScopes.includes(scope.key);
                      return (
                        <label
                          key={scope.key}
                          className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                            isChecked
                              ? "bg-[#FF6F26]/10 border-[#FF6F26]/40 text-white"
                              : "bg-white/[0.02] border-white/5 text-zinc-400 hover:border-white/15"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleScope(scope.key)}
                            className="mt-0.5 rounded border-white/20 text-[#FF6F26] focus:ring-0"
                          />
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-bold text-xs leading-tight">
                              {scope.name}
                            </div>
                            <div className="text-[10px] text-zinc-400 leading-tight">
                              {scope.desc}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !selectedUserId || selectedScopes.length === 0}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-[#FF6F26] text-white hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? "Assigning..." : "Assign Selected User as Sub-Admin"}
                </button>
              </form>
            )}

            {/* FORM B: Create Brand New Sub-Admin Profile */}
            {modalTab === "new" && (
              <form onSubmit={handleCreateNew} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ahmed Raza"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6F26]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. ahmed.ops@solonomore.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6F26]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">
                      Secure Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6F26]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 0300-1234567"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6F26]"
                    />
                  </div>
                </div>

                {/* Granular Scope Selector */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <span className="text-xs font-bold text-zinc-300">
                    Grant Permission Scopes
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1 custom-scrollbar">
                    {ADMIN_PERMISSION_SCOPES.map((scope) => {
                      const isChecked = selectedScopes.includes(scope.key);
                      return (
                        <label
                          key={scope.key}
                          className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                            isChecked
                              ? "bg-[#FF6F26]/10 border-[#FF6F26]/40 text-white"
                              : "bg-white/[0.02] border-white/5 text-zinc-400 hover:border-white/15"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleScope(scope.key)}
                            className="mt-0.5 rounded border-white/20 text-[#FF6F26] focus:ring-0"
                          />
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-bold text-xs leading-tight">
                              {scope.name}
                            </div>
                            <div className="text-[10px] text-zinc-400 leading-tight">
                              {scope.desc}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || selectedScopes.length === 0}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-[#FF6F26] text-white hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? "Creating..." : "Create Profile & Grant Sub-Admin Token"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── EDIT SCOPES MODAL ────────────────────────────────────────────── */}
      {editingManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-[#100b1a] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFA05C]">
                  Edit Delegated Token Scopes
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  {editingManager.manager_name} ({editingManager.manager_email})
                </h3>
              </div>
              <button
                onClick={() => setEditingManager(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-1 custom-scrollbar">
              {ADMIN_PERMISSION_SCOPES.map((scope) => {
                const isChecked = editScopes.includes(scope.key);
                return (
                  <label
                    key={scope.key}
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                      isChecked
                        ? "bg-[#FF6F26]/10 border-[#FF6F26]/40 text-white"
                        : "bg-white/[0.02] border-white/5 text-zinc-400 hover:border-white/15"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleEditScope(scope.key)}
                      className="mt-0.5 rounded border-white/20 text-[#FF6F26] focus:ring-0"
                    />
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-bold text-xs leading-tight">
                        {scope.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 leading-tight">
                        {scope.desc}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  const m = editingManager;
                  setEditingManager(null);
                  handleRemove(m.id, m.manager_name);
                }}
                className="py-2.5 px-3.5 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Revoke Token</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveEditPermissions}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#FF6F26] text-white hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSubmitting ? "Saving..." : "Save Scope Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
