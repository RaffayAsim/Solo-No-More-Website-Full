"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MemberApplicationRecord,
  adminApproveApplicationAction,
  adminVerifyPaymentAndIssueInviteAction,
} from "@/app/actions/member-applications";
import {
  Users,
  Store,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Building,
  Sparkles,
  Phone,
  Mail,
  Heart,
  Camera,
  Search,
  Filter,
  FileText
} from "lucide-react";
import { IconX } from "@/components/icons/AppIcons";

interface AdminApplicationsClientProps {
  initialApplications: MemberApplicationRecord[];
}

export default function AdminApplicationsClient({ initialApplications }: AdminApplicationsClientProps) {
  const router = useRouter();
  const [applications, setApplications] = useState<MemberApplicationRecord[]>(initialApplications);
  const [filter, setFilter] = useState<"all" | "pending_admin_approval" | "payment_pending" | "payment_submitted" | "approved" | "credentials_created">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "member" | "partner">("all");
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<MemberApplicationRecord | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(label);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // ── ADMIN ACTIONS ──
  const handleApproveForPayment = async (id: string) => {
    setActionLoadingId(id);
    setFeedbackMsg(null);
    const res = await adminApproveApplicationAction(id, "Approved for membership payment verification.");
    setActionLoadingId(null);

    if (res.success) {
      setFeedbackMsg({
        type: "success",
        text: "Application approved! Payment instructions & link are now ready to share.",
      });
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "payment_pending" } : a))
      );
      if (selectedApp?.id === id) {
        setSelectedApp((prev) => (prev ? { ...prev, status: "payment_pending" } : null));
      }
      router.refresh();
    } else {
      setFeedbackMsg({ type: "error", text: res.error || "Failed to approve." });
    }
  };

  const handleVerifyPayment = async (id: string) => {
    setActionLoadingId(id);
    setFeedbackMsg(null);
    const res = await adminVerifyPaymentAndIssueInviteAction(id);
    setActionLoadingId(null);

    if (res.success && res.inviteToken) {
      setFeedbackMsg({
        type: "success",
        text: "Payment verified! Credential setup link generated.",
      });
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "approved", inviteToken: res.inviteToken } : a))
      );
      if (selectedApp?.id === id) {
        setSelectedApp((prev) => (prev ? { ...prev, status: "approved", inviteToken: res.inviteToken } : null));
      }
      router.refresh();
    } else {
      setFeedbackMsg({ type: "error", text: res.error || "Failed to verify payment." });
    }
  };

  const filtered = applications.filter((a) => {
    if (filter !== "all" && a.status !== filter) return false;
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = a.fullName.toLowerCase().includes(q);
      const matchEmail = a.email.toLowerCase().includes(q);
      const matchUser = a.username.toLowerCase().includes(q);
      const matchCnic = a.cnic?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchUser && !matchCnic) return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_admin_approval":
        return { text: "Pending Review", bg: "bg-amber-500/15 border-amber-500/30 text-amber-400" };
      case "payment_pending":
        return { text: "Awaiting Payment", bg: "bg-blue-500/15 border-blue-500/30 text-blue-400" };
      case "payment_submitted":
        return { text: "Proof Submitted", bg: "bg-amber-500/20 border-amber-500/40 text-amber-300" };
      case "approved":
        return { text: "Payment Verified", bg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" };
      case "credentials_created":
        return { text: "Live & Active", bg: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" };
      case "rejected":
        return { text: "Rejected", bg: "bg-red-500/15 border-red-500/30 text-red-400" };
      default:
        return { text: status, bg: "bg-white/10 border-white/20 text-white" };
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Panel */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#FF6F26]/15 via-transparent to-transparent blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#FF6F26]/10 text-[#FF6F26] border border-[#FF6F26]/20">
              <FileText className="w-3.5 h-3.5" />
              <span>ONBOARDING QUEUE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Member &amp; Partner Applications
            </h1>
            <p className="text-sm text-neutral-400 max-w-xl">
              Review multi-step applications, issue bank payment instructions, verify receipts, and generate credential setup links.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
              {applications.filter((a) => a.status === "pending_admin_approval").length} Pending Review
            </span>
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              {applications.filter((a) => a.status === "payment_submitted").length} Proofs Ready
            </span>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl text-sm border ${
            feedbackMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {feedbackMsg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, @username, or CNIC..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF6F26] transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08] overflow-x-auto">
            {[
              { id: "all", label: "All" },
              { id: "pending_admin_approval", label: "Pending" },
              { id: "payment_pending", label: "Awaiting Pay" },
              { id: "payment_submitted", label: "Verify Proof" },
              { id: "approved", label: "Verified" },
              { id: "credentials_created", label: "Active" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === tab.id
                    ? "bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-md shadow-[#FF6F26]/20"
                    : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-[#0E0B12] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF6F26] cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="member">Members Only</option>
            <option value="partner">Partners Only</option>
          </select>
        </div>
      </div>

      {/* Applications Grid / Table */}
      <div className={`grid gap-6 ${selectedApp ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"}`}>
        {/* Table Container */}
        <div className={`overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md ${selectedApp ? "lg:col-span-2" : ""}`}>
          {filtered.length === 0 ? (
            <div className="text-center py-16 px-6 text-neutral-400 text-xs">
              No applications found matching the current filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="p-4">Applicant</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Package</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filtered.map((app) => {
                    const badge = getStatusBadge(app.status);
                    const isSelected = selectedApp?.id === app.id;
                    return (
                      <tr
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className={`transition-colors cursor-pointer hover:bg-white/[0.04] ${
                          isSelected ? "bg-[#FF6F26]/10" : ""
                        }`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {app.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={app.photoUrl}
                                alt={app.fullName}
                                className="w-9 h-9 rounded-xl object-cover border border-[#FF6F26]/40"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-white/[0.08] flex items-center justify-center text-white font-bold">
                                <Users className="w-4 h-4 text-neutral-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-white text-sm">{app.fullName}</div>
                              <div className="text-[11px] text-neutral-400">
                                @{app.username} · {app.city}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`font-bold uppercase text-[10px] ${
                              app.type === "partner" ? "text-cyan-400" : "text-[#FF6F26]"
                            }`}
                          >
                            {app.type}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="font-semibold text-white">{app.packageSelected}</div>
                          <div className="text-emerald-400 text-[11px] font-mono">
                            PKR {app.packagePricePkr.toLocaleString()}
                          </div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg}`}
                          >
                            {badge.text}
                          </span>
                        </td>

                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {app.status === "pending_admin_approval" && (
                              <button
                                type="button"
                                disabled={actionLoadingId === app.id}
                                onClick={() => handleApproveForPayment(app.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-sm hover:brightness-110 transition-all disabled:opacity-50"
                              >
                                Approve
                              </button>
                            )}

                            {app.status === "payment_submitted" && (
                              <button
                                type="button"
                                disabled={actionLoadingId === app.id}
                                onClick={() => handleVerifyPayment(app.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 transition-all disabled:opacity-50"
                              >
                                Verify Proof
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedApp(app)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.06] hover:bg-white/10 text-white transition-colors"
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Details Drawer */}
        {selectedApp && (
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md p-6 space-y-5 h-fit sticky top-24">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <span className="text-xs font-bold text-[#FF6F26] uppercase tracking-wider">
                Application Dossier
              </span>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                aria-label="Close dossier"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <IconX size={16} color="#FFFFFF" />
              </button>
            </div>

            {/* Profile Avatar & Header */}
            <div className="text-center pb-4 border-b border-white/[0.08]">
              {selectedApp.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedApp.photoUrl}
                  alt={selectedApp.fullName}
                  className="w-20 h-20 rounded-2xl object-cover mx-auto mb-3 border-2 border-[#FF6F26]"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-white/10 mx-auto mb-3 flex items-center justify-center text-white">
                  <Users className="w-8 h-8" />
                </div>
              )}
              <h2 className="text-lg font-bold text-white">{selectedApp.fullName}</h2>
              <span className="text-xs text-neutral-400">
                @{selectedApp.username} · {selectedApp.city}
              </span>
            </div>

            {/* Application Data Fields */}
            <div className="space-y-2 text-xs text-neutral-300">
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-neutral-400">Email:</span>
                <span className="text-white font-medium">{selectedApp.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-neutral-400">Phone:</span>
                <span className="text-white font-medium">{selectedApp.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-neutral-400">Gender:</span>
                <span className="text-white capitalize font-medium">{selectedApp.gender}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-neutral-400">Date of Birth:</span>
                <span className="text-white font-medium">{selectedApp.dateOfBirth || "N/A"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-neutral-400">CNIC:</span>
                <span className="text-[#FF6F26] font-mono font-medium">{selectedApp.cnic || "N/A"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-neutral-400">Emergency:</span>
                <span className="text-white font-medium">{selectedApp.emergencyName} ({selectedApp.emergencyPhone})</span>
              </div>
              {selectedApp.instagram && (
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-neutral-400">Instagram:</span>
                  <a
                    href={`https://instagram.com/${selectedApp.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#FF6F26] hover:underline"
                  >
                    {selectedApp.instagram}
                  </a>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-neutral-400">Preferred Vibe:</span>
                <span className="text-white font-medium">{selectedApp.vibe}</span>
              </div>

              {selectedApp.interests && selectedApp.interests.length > 0 && (
                <div className="pt-2">
                  <span className="text-neutral-400 block mb-2">Interests:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedApp.interests.map((int) => (
                      <span
                        key={int}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FF6F26]/10 text-[#FF6F26] border border-[#FF6F26]/20"
                      >
                        {int}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Payment & Verification Section */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Payment &amp; Onboarding</span>
                <span className="text-emerald-400 font-mono">PKR {selectedApp.packagePricePkr.toLocaleString()}</span>
              </div>

              {/* Status Specific Info */}
              {selectedApp.status === "payment_pending" && (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-neutral-400">Payment link to share with user:</div>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/pay/${selectedApp.id}`}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          `${window.location.origin}/pay/${selectedApp.id}`,
                          "payment"
                        )
                      }
                      className="p-2 rounded-lg bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white"
                    >
                      {copiedLink === "payment" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Proof Image */}
              {selectedApp.paymentProofUrl && (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-neutral-300 font-semibold">
                    Submitted Proof (TID: {selectedApp.transactionRef}):
                  </div>
                  <a href={selectedApp.paymentProofUrl} target="_blank" rel="noreferrer" className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedApp.paymentProofUrl}
                      alt="Proof"
                      className="w-full h-36 object-cover rounded-xl border border-white/10 hover:opacity-90 transition-opacity"
                    />
                  </a>
                </div>
              )}

              {/* Credential Setup Token */}
              {selectedApp.inviteToken && (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-emerald-400 font-bold">Credential Setup Link:</div>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/create-credentials?token=${selectedApp.inviteToken}`}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          `${window.location.origin}/create-credentials?token=${selectedApp.inviteToken}`,
                          "token"
                        )
                      }
                      className="p-2 rounded-lg bg-emerald-500 text-neutral-950 font-bold"
                    >
                      {copiedLink === "token" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons in Drawer */}
            <div className="space-y-2 pt-2">
              {selectedApp.status === "pending_admin_approval" && (
                <button
                  type="button"
                  disabled={actionLoadingId === selectedApp.id}
                  onClick={() => handleApproveForPayment(selectedApp.id)}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-lg shadow-[#FF6F26]/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  Approve Application &amp; Issue Bank Link
                </button>
              )}

              {selectedApp.status === "payment_submitted" && (
                <button
                  type="button"
                  disabled={actionLoadingId === selectedApp.id}
                  onClick={() => handleVerifyPayment(selectedApp.id)}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 transition-all disabled:opacity-50"
                >
                  Verify Payment Proof &amp; Generate Invite
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
