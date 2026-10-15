"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Search,
  Key,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  Check,
  X,
  Sliders,
  Sparkles,
  Lock,
  UserCheck,
} from "lucide-react";
import {
  DelegatedManager,
  ManagerType,
  PlatformUserOption,
  getTeamDelegationsAction,
  searchMemberByExactEmailAction,
  assignExistingUserAsManagerAction,
  createNewManagerProfileAction,
  updateManagerPermissionsAction,
  removeManagerDelegationAction,
} from "@/app/actions/team-permissions";

export interface ScopeDef {
  key: string;
  name: string;
  desc: string;
}

interface DelegatedManagerSectionProps {
  type: ManagerType;
  delegatorId: string;
  delegatorName: string;
  title: string;
  subtitle: string;
  availableScopes: ScopeDef[];
  accent?: "orange" | "purple";
}

export default function DelegatedManagerSection({
  type,
  delegatorId,
  delegatorName,
  title,
  subtitle,
  availableScopes,
  accent = "orange",
}: DelegatedManagerSectionProps) {
  const [managers, setManagers] = useState<DelegatedManager[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"search" | "new">("search");

  // Search Existing User
  const [searchEmail, setSearchEmail] = useState("");
  const [searchingUser, setSearchingUser] = useState(false);
  const [searchedUser, setSearchedUser] = useState<PlatformUserOption | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // New Profile Form
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // Scope selection
  const [selectedScopes, setSelectedScopes] = useState<string[]>(
    availableScopes.map((s) => s.key)
  );

  // Action status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit Permissions
  const [editingManager, setEditingManager] = useState<DelegatedManager | null>(null);
  const [editScopes, setEditScopes] = useState<string[]>([]);

  const accentCls =
    accent === "purple"
      ? {
          primary: "text-purple-300",
          bg: "bg-purple-500/15",
          border: "border-purple-500/30",
          btn: "bg-gradient-to-r from-purple-600 to-indigo-600",
          badge: "bg-purple-500/10 text-purple-300 border-purple-500/20",
        }
      : {
          primary: "text-[#FFA05C]",
          bg: "bg-[#FF6F26]/15",
          border: "border-[#FF6F26]/30",
          btn: "bg-gradient-to-r from-[#FF6F26] to-[#FF4400]",
          badge: "bg-[#FF6F26]/10 text-[#FFA05C] border-[#FF6F26]/20",
        };

  useEffect(() => {
    async function loadManagers() {
      try {
        const list = await getTeamDelegationsAction({ type, delegatorId });
        setManagers(list);
      } catch {}
      setLoading(false);
    }
    loadManagers();
  }, [type, delegatorId]);

  const toggleScope = (key: string) => {
    setSelectedScopes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleEditScope = (key: string) => {
    setEditScopes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // ─── Search Member by Exact Email ───────────────────────────────────────────
  const handleSearchEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    setSearchingUser(true);
    setSearchError(null);
    setSearchedUser(null);

    try {
      const res = await searchMemberByExactEmailAction(searchEmail.trim());
      if (res.success && res.user) {
        setSearchedUser(res.user);
      } else {
        setSearchError(res.error || "No member found matching this email.");
      }
    } catch {
      setSearchError("Network error looking up email.");
    } finally {
      setSearchingUser(false);
    }
  };

  // ─── Assign Existing Member ─────────────────────────────────────────────────
  const handleAssignExisting = async () => {
    if (!searchedUser) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await assignExistingUserAsManagerAction({
        delegatorId,
        delegatorName,
        type,
        targetUserId: searchedUser.id,
        managerName: searchedUser.fullName,
        managerEmail: searchedUser.email,
        managerPhone: searchedUser.phone,
        permissions: selectedScopes,
      });

      if (res.success && res.delegation) {
        setManagers((prev) => [
          res.delegation!,
          ...prev.filter((m) => m.id !== res.delegation!.id),
        ]);
        setSuccessMsg(`✓ Assigned ${searchedUser.fullName} as team manager!`);
        setIsModalOpen(false);
        setSearchedUser(null);
        setSearchEmail("");
      } else {
        setErrorMsg(res.error || "Failed to assign manager.");
      }
    } catch {
      setErrorMsg("Network error assigning manager.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Create New Manager Profile ─────────────────────────────────────────────
  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newEmail || !newPassword) {
      setErrorMsg("Please fill in Name, Email, and Password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await createNewManagerProfileAction({
        delegatorId,
        delegatorName,
        type,
        fullName: newFullName,
        email: newEmail,
        password: newPassword,
        phone: newPhone,
        permissions: selectedScopes,
      });

      if (res.success && res.delegation) {
        setManagers((prev) => [res.delegation!, ...prev]);
        setSuccessMsg(`✓ Created new manager profile for ${newFullName}!`);
        setIsModalOpen(false);
        setNewFullName("");
        setNewEmail("");
        setNewPassword("");
        setNewPhone("");
      } else {
        setErrorMsg(res.error || "Failed to create manager profile.");
      }
    } catch {
      setErrorMsg("Network error creating manager.");
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
        setManagers((prev) =>
          prev.map((m) =>
            m.id === editingManager.id ? { ...m, permissions: editScopes } : m
          )
        );
        setSuccessMsg("✓ Manager permissions updated successfully.");
        setEditingManager(null);
      } else {
        alert(res.error || "Failed to update permissions.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Toggle Status ──────────────────────────────────────────────────────────
  const handleToggleStatus = async (mgr: DelegatedManager) => {
    const newStatus = mgr.status === "active" ? "suspended" : "active";
    const res = await updateManagerPermissionsAction({
      delegationId: mgr.id,
      status: newStatus,
    });
    if (res.success) {
      setManagers((prev) =>
        prev.map((m) => (m.id === mgr.id ? { ...m, status: newStatus } : m))
      );
    }
  };

  // ─── Remove ─────────────────────────────────────────────────────────────────
  const handleRemove = async (delegationId: string, name: string) => {
    if (!confirm(`Revoke manager access for ${name}?`)) return;
    const res = await removeManagerDelegationAction(delegationId);
    if (res.success) {
      setManagers((prev) => prev.filter((m) => m.id !== delegationId));
      setSuccessMsg(`✓ Revoked access for ${name}.`);
    } else {
      alert(res.error || "Failed to remove manager.");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Top Header Bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${accentCls.bg} ${accentCls.primary} ${accentCls.border}`}
            >
              Team &amp; Gate Delegations
            </span>
            <span className="text-xs text-zinc-400">Scoped Staff Access</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-[#FF6F26]" />
            <span>{title}</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsModalOpen(true);
            setErrorMsg(null);
            setSearchedUser(null);
          }}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white shadow-lg hover:scale-105 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer ${accentCls.btn}`}
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Manager Account</span>
        </button>
      </div>

      {/* Notifications */}
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

      {/* ── Active Managers Roster ─────────────────────────────────────────── */}
      {managers.length > 0 ? (
        <div className="divide-y divide-white/5 border border-white/10 rounded-3xl overflow-hidden bg-white/[0.02] backdrop-blur-xl">
          {managers.map((mgr) => {
            const isActive = mgr.status === "active";
            return (
              <div
                key={mgr.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h4 className="font-extrabold text-white text-sm">
                      {mgr.manager_name}
                    </h4>
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        isActive
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-zinc-800 text-zinc-500 border-zinc-700"
                      }`}
                    >
                      {isActive ? "● Active Access" : "○ Suspended"}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Pass #{mgr.id.slice(0, 10)}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-400 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1 font-mono text-zinc-300">
                      <Mail className="w-3 h-3 text-zinc-500" />
                      {mgr.manager_email}
                    </span>
                    {mgr.manager_phone && (
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Phone className="w-3 h-3 text-zinc-500" />
                        {mgr.manager_phone}
                      </span>
                    )}
                  </div>

                  {/* Scopes Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">
                      Permissions:
                    </span>
                    {mgr.permissions.map((p) => {
                      const def = availableScopes.find((s) => s.key === p);
                      return (
                        <span
                          key={p}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-medium border ${accentCls.badge}`}
                          title={def?.desc || p}
                        >
                          {def?.name || p}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingManager(mgr);
                      setEditScopes([...mgr.permissions]);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Edit Scopes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(mgr)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isActive
                        ? "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                    }`}
                  >
                    {isActive ? "Pause" : "Resume"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemove(mgr.id, mgr.manager_name)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="Permanently revoke delegated access"
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
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center backdrop-blur-md space-y-3">
          <Key className="w-10 h-10 text-zinc-600 mx-auto" />
          <div className="text-base font-bold text-white">No Team Managers Assigned</div>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            Delegate door scanning and guestlist check-in to your trusted crew or reception staff. They will be able to operate the camera Door Scanner at the venue gate.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md ${accentCls.btn}`}
          >
            + Add First Manager Account
          </button>
        </div>
      )}

      {/* ── ADD MANAGER MODAL ─────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl rounded-2xl sm:rounded-3xl border border-white/10 bg-[#100b1a] p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl max-h-[94vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${accentCls.primary}`}>
                  Role Delegation &amp; Staff Access
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  Assign Manager Profile
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Selection Switcher */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1 rounded-2xl bg-white/[0.03] border border-white/10">
              <button
                type="button"
                onClick={() => setModalTab("search")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modalTab === "search"
                    ? `${accentCls.btn} text-white shadow-md`
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Option 1: Existing Member (By Email)
              </button>
              <button
                type="button"
                onClick={() => setModalTab("new")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modalTab === "new"
                    ? `${accentCls.btn} text-white shadow-md`
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Option 2: Create New Profile
              </button>
            </div>

            {/* OPTION 1: Search Exact Email */}
            {modalTab === "search" && (
              <div className="space-y-4">
                <form onSubmit={handleSearchEmail} className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 block">
                    Enter Member&apos;s Full Registered Email *
                  </label>
                  <p className="text-[11px] text-zinc-500">
                    To preserve member privacy, please input their exact email address to pull up their profile.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      required
                      placeholder="e.g. taha.gatekeeper@gmail.com"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                    />
                    <button
                      type="submit"
                      disabled={searchingUser || !searchEmail.trim()}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md disabled:opacity-50 transition-all cursor-pointer shrink-0 ${accentCls.btn}`}
                    >
                      {searchingUser ? "Searching..." : "Find Member"}
                    </button>
                  </div>
                </form>

                {searchError && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2">
                    <span>{searchError}</span>
                    <button
                      type="button"
                      onClick={() => setModalTab("new")}
                      className="text-xs font-bold underline text-white hover:text-amber-200"
                    >
                      Create Profile ➔
                    </button>
                  </div>
                )}

                {searchedUser && (
                  <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/15 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                          <UserCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">
                            {searchedUser.fullName}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono">
                            {searchedUser.email}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        ✓ Verified Member
                      </span>
                    </div>

                    {/* Scopes selector */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <label className="text-xs font-bold text-zinc-300 block">
                        Select Allowed Delegated Scopes:
                      </label>
                      <div className="space-y-2">
                        {availableScopes.map((scope) => {
                          const isChecked = selectedScopes.includes(scope.key);
                          return (
                            <label
                              key={scope.key}
                              className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                                isChecked
                                  ? `${accentCls.bg} ${accentCls.border} text-white`
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
                      type="button"
                      disabled={isSubmitting || selectedScopes.length === 0}
                      onClick={handleAssignExisting}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md disabled:opacity-50 transition-all cursor-pointer ${accentCls.btn}`}
                    >
                      {isSubmitting ? "Assigning..." : `Grant Manager Access to ${searchedUser.fullName}`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* OPTION 2: Create New Profile */}
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
                      placeholder="e.g. Farhan Gate"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. farhan@eventgate.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 0333-1234567"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>

                {/* Scopes selector */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <label className="text-xs font-bold text-zinc-300 block">
                    Select Granted Security Scopes:
                  </label>
                  <div className="space-y-2">
                    {availableScopes.map((scope) => {
                      const isChecked = selectedScopes.includes(scope.key);
                      return (
                        <label
                          key={scope.key}
                          className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                            isChecked
                              ? `${accentCls.bg} ${accentCls.border} text-white`
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
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md disabled:opacity-50 transition-all cursor-pointer ${accentCls.btn}`}
                >
                  {isSubmitting ? "Creating..." : "Create Account & Grant Access"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── EDIT SCOPES MODAL ────────────────────────────────────────────── */}
      {editingManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl border border-white/10 bg-[#100b1a] p-4 sm:p-6 space-y-4 shadow-2xl max-h-[94vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${accentCls.primary}`}>
                  Modify Staff Permissions
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  {editingManager.manager_name}
                </h3>
              </div>
              <button
                onClick={() => setEditingManager(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {availableScopes.map((scope) => {
                const isChecked = editScopes.includes(scope.key);
                return (
                  <label
                    key={scope.key}
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                      isChecked
                        ? `${accentCls.bg} ${accentCls.border} text-white`
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
                <span>Revoke Access</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveEditPermissions}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md disabled:opacity-50 transition-all cursor-pointer ${accentCls.btn}`}
              >
                {isSubmitting ? "Saving..." : "Save Scopes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
