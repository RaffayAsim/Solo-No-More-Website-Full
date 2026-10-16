"use client";

import { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  HeartPulse,
  Camera,
  Sparkles,
  Loader2,
  Lock,
  Trash2,
  Check,
} from "lucide-react";
import { updateProfileAction } from "@/app/actions/profile";
import {
  checkProfileCompleteness,
  MANDATORY_PROFILE_FIELDS,
} from "@/lib/profile-completeness";

interface CompleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Record<string, any> | null | undefined;
  onProfileCompleted?: (updated: Record<string, any>) => void;
  actionContext?: string; // e.g. "hosting a hangout", "joining this squad", "booking event tickets"
}

const AVAILABLE_VIBES = [
  "Techno & House",
  "Late Night Chai",
  "Padel & Sports",
  "Live Music",
  "Rooftop Lounges",
  "Deep Beats",
  "Weekend Roadtrips",
  "Café Crawls",
  "Gaming & Tech",
  "Art & Culture",
];

/**
 * High-performance image compressor for responsive client-side uploads.
 * Shrinks raw 10MB mobile headshots down to ~40KB WebP/JPEG for instant server saving.
 */
function compressAndResizeImage(
  file: File,
  maxDim = 600,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        try {
          resolve(canvas.toDataURL("image/webp", quality));
        } catch {
          resolve(canvas.toDataURL("image/jpeg", quality));
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Format CNIC as 13-digit Pakistani standard: XXXXX-XXXXXXX-X */
function formatCnic(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export default function CompleteProfileModal({
  isOpen,
  onClose,
  profile,
  onProfileCompleted,
  actionContext = "hosting a hangout",
}: CompleteProfileModalProps) {
  // Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Karachi");
  const [gender, setGender] = useState("Male");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [cnic, setCnic] = useState("");
  const [cnicPictureUrl, setCnicPictureUrl] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [vibeTags, setVibeTags] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<"personal" | "safety" | "vibe">("personal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingCnic, setIsUploadingCnic] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const cnicInputRef = useRef<HTMLInputElement>(null);

  // Sync initial profile values on open
  useEffect(() => {
    if (isOpen && profile) {
      setFullName(
        profile.full_name ||
          (profile.first_name && profile.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : "")
      );
      setPhone(profile.phone || "");
      setCity(profile.city || "Karachi");
      setGender(profile.gender || "Male");
      setDateOfBirth(profile.date_of_birth || "");
      setCnic(profile.cnic ? formatCnic(profile.cnic) : "");
      setCnicPictureUrl(profile.cnic_picture_url || "");
      setEmergencyName(profile.emergency_contact_name || profile.emergency_name || "");
      setEmergencyPhone(profile.emergency_contact_phone || profile.emergency_phone || "");
      setInstagram(
        (profile.instagram_username || profile.instagram || "").replace(/^@/, "")
      );

      // Only treat real URLs as avatarUrl, not emoji icons like "👾"
      const rawAvatar = profile.avatar_url || profile.photo_url || "";
      const isRealUrl =
        typeof rawAvatar === "string" &&
        (rawAvatar.startsWith("http://") ||
          rawAvatar.startsWith("https://") ||
          rawAvatar.startsWith("data:") ||
          rawAvatar.startsWith("/"));
      setAvatarUrl(isRealUrl ? rawAvatar : "");

      const existingVibes = profile.vibe_tags || profile.interests;
      setVibeTags(
        Array.isArray(existingVibes) && existingVibes.length > 0
          ? existingVibes
          : ["Techno & House"]
      );
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, profile]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Live completeness calculation
  const currentDraft = {
    full_name: fullName,
    phone,
    city,
    gender,
    date_of_birth: dateOfBirth,
    cnic,
    emergency_contact_name: emergencyName,
    emergency_contact_phone: emergencyPhone,
    instagram_username: instagram,
    vibe_tags: vibeTags,
    avatar_url: avatarUrl,
    photo_url: avatarUrl,
  };

  const completeness = checkProfileCompleteness(currentDraft);

  // Tab completion indicators
  const isPersonalComplete =
    fullName.trim().length >= 3 &&
    phone.trim().length >= 7 &&
    Boolean(city) &&
    Boolean(gender) &&
    dateOfBirth.trim().length >= 4;

  const isSafetyComplete =
    cnic.trim().length >= 8 &&
    emergencyName.trim().length >= 2 &&
    emergencyPhone.trim().length >= 7 &&
    instagram.trim().length >= 2;

  const isVibeComplete =
    Boolean(avatarUrl.trim()) && vibeTags.length >= 1;

  const toggleVibe = (tag: string) => {
    setVibeTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnic(formatCnic(e.target.value));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingPhoto(true);
      setErrorMsg(null);
      const optimized = await compressAndResizeImage(file, 600, 0.85);
      setAvatarUrl(optimized);
    } catch {
      setErrorMsg("Failed to process photo. Please try a different image.");
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleCnicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingCnic(true);
      setErrorMsg(null);
      const optimized = await compressAndResizeImage(file, 900, 0.85);
      setCnicPictureUrl(optimized);
    } catch {
      setErrorMsg("Failed to process CNIC picture. Please try another file.");
    } finally {
      setIsUploadingCnic(false);
      if (cnicInputRef.current) cnicInputRef.current.value = "";
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    // Validate fields before submitting
    if (completeness.missingFields.length > 0) {
      setErrorMsg(
        `Please complete the remaining mandatory fields: ${completeness.missingFields
          .map((f) => f.label)
          .join(", ")}`
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await updateProfileAction({
        full_name: fullName.trim(),
        phone: phone.trim(),
        city,
        gender,
        date_of_birth: dateOfBirth.trim(),
        cnic: cnic.trim(),
        cnic_picture_url: cnicPictureUrl,
        emergency_contact_name: emergencyName.trim(),
        emergency_contact_phone: emergencyPhone.trim(),
        instagram_username: instagram.trim().replace(/^@/, ""),
        photo_url: avatarUrl,
        avatar_url: avatarUrl,
        vibe_tags: vibeTags,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to update profile. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg("Identity verified successfully! Access granted.");
      if (onProfileCompleted) {
        onProfileCompleted({
          ...profile,
          ...currentDraft,
          is_profile_complete: true,
        });
      }

      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-[#0c0817] border border-white/15 rounded-3xl shadow-[0_0_60px_rgba(255,111,38,0.25)] flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* ── 1. PINNED HEADER ── */}
        <div className="p-4 sm:p-6 border-b border-white/10 relative bg-gradient-to-r from-[#FF6F26]/15 via-purple-600/10 to-transparent shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2 flex-wrap pr-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-[#FF6F26]/20 text-[#FFA05C] border border-[#FF6F26]/30">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF6F26]" />
              Mandatory Safety Verification
            </span>
            <span className="text-[11px] sm:text-xs text-zinc-400 font-medium">
              Before {actionContext}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Complete Your Verified Profile
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 mt-1 line-clamp-2">
            Solo-No-More is a trusted social club. All members and guests must provide verified identity &amp; emergency details to unlock squad meetups and door access.
          </p>

          {/* Progress Bar */}
          <div className="mt-3 sm:mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-zinc-400 text-[11px] sm:text-xs">
                {completeness.filledCount} of {completeness.totalCount} fields completed
              </span>
              <span
                className={
                  completeness.isComplete
                    ? "text-emerald-400 text-[11px] sm:text-xs font-black flex items-center gap-1"
                    : "text-[#FFA05C] text-[11px] sm:text-xs font-black"
                }
              >
                {completeness.isComplete && <Check className="w-3.5 h-3.5" />}
                {completeness.completionPercentage}% Ready
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  completeness.isComplete
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                    : "bg-gradient-to-r from-[#FF6F26] to-[#FFA05C]"
                }`}
                style={{ width: `${completeness.completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── 2. PINNED TAB NAVIGATION BAR ── */}
        <div className="flex border-b border-white/10 bg-black/40 px-3 sm:px-6 overflow-x-auto no-scrollbar whitespace-nowrap shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("personal")}
            className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "personal"
                ? "border-[#FF6F26] text-white"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <User className="w-3.5 h-3.5 text-[#FF6F26]" />
            <span>1. Personal Info</span>
            {isPersonalComplete && (
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px] ml-1">
                ✓
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("safety")}
            className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "safety"
                ? "border-[#FF6F26] text-white"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-[#FF6F26]" />
            <span>2. Safety &amp; CNIC</span>
            {isSafetyComplete && (
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px] ml-1">
                ✓
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("vibe")}
            className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "vibe"
                ? "border-[#FF6F26] text-white"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FFA05C]" />
            <span>3. Photo &amp; Vibes</span>
            {isVibeComplete && (
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px] ml-1">
                ✓
              </span>
            )}
          </button>
        </div>

        {/* ── 3. SCROLLABLE FORM BODY ── */}
        <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: Personal Details */}
          {activeTab === "personal" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Zainab Ahmed"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                    WhatsApp / Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300 1234567"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                    City *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#140e24] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF6F26] transition-colors cursor-pointer"
                  >
                    <option value="Karachi">Karachi</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Islamabad">Islamabad</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                    Gender *
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#140e24] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF6F26] transition-colors cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#140e24] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF6F26] transition-colors cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Safety & CNIC Details */}
          {activeTab === "safety" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                    CNIC / National Identity Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={cnic}
                    onChange={handleCnicChange}
                    placeholder="42101-1234567-1"
                    maxLength={15}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26] transition-colors font-mono tracking-wide"
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    Kept encrypted. Never displayed publicly to other users.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                    Instagram Handle (@) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-zinc-500 text-sm">@</span>
                    <input
                      type="text"
                      required
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))}
                      placeholder="username"
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26] transition-colors"
                    />
                  </div>
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    Used for community vetting &amp; social authenticity.
                  </span>
                </div>
              </div>

              {/* Emergency Contact Box */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                  <HeartPulse className="w-4 h-4 text-rose-400" />
                  <span>Emergency Safety Contact (Parent / Spouse / Friend)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 block mb-1">
                      Emergency Contact Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      placeholder="e.g. Zahid Asim (Father)"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-400 block mb-1">
                      Emergency Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      placeholder="0300 9876543"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26]"
                    />
                  </div>
                </div>
              </div>

              {/* CNIC Card Front Upload */}
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                  CNIC Front Picture (Optional for faster VIP approval)
                </label>
                <input
                  ref={cnicInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCnicUpload}
                />
                {cnicPictureUrl ? (
                  <div className="relative w-full h-28 rounded-2xl border border-white/15 overflow-hidden bg-black/40 group">
                    <img
                      src={cnicPictureUrl}
                      alt="CNIC Front"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => cnicInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => setCnicPictureUrl("")}
                        className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-xs transition-colors cursor-pointer"
                        title="Remove CNIC"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => cnicInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/15 rounded-2xl cursor-pointer hover:border-[#FF6F26]/60 transition-colors bg-white/[0.01]"
                  >
                    {isUploadingCnic ? (
                      <Loader2 className="w-5 h-5 text-[#FF6F26] animate-spin mb-1" />
                    ) : (
                      <CreditCard className="w-5 h-5 text-zinc-500 mb-1" />
                    )}
                    <span className="text-xs text-zinc-400 font-medium">
                      {isUploadingCnic ? "Optimizing image..." : "Click to Upload CNIC Front Photo"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Photo & Vibes */}
          {activeTab === "vibe" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Profile Photo Headshot */}
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-2">
                  Profile Headshot Photo *
                </label>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/20 bg-black/40 shrink-0 flex items-center justify-center relative">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-8 h-8 text-zinc-600" />
                    )}
                    {isUploadingPhoto && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-[#FF6F26] animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold cursor-pointer transition-colors"
                      >
                        <Camera className="w-4 h-4 text-[#FF6F26]" />
                        <span>{avatarUrl ? "Change Photo" : "Upload Headshot"}</span>
                      </button>

                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl("")}
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-colors cursor-pointer"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Real photo required for door check-in security and meetup recognition.
                    </p>
                  </div>
                </div>
              </div>

              {/* Vibe Selection */}
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-2">
                  Pick Your Vibes (Select at least 1) *
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_VIBES.map((vibe) => {
                    const isSelected = vibeTags.includes(vibe);
                    return (
                      <button
                        key={vibe}
                        type="button"
                        onClick={() => toggleVibe(vibe)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#FF6F26] text-white shadow-[0_0_15px_rgba(255,111,38,0.4)] border border-[#FF6F26]"
                            : "bg-white/5 text-zinc-400 hover:text-white border border-white/10"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {vibe}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 4. PINNED FOOTER (ALWAYS VISIBLE & ACCESSIBLE) ── */}
        <div className="p-4 sm:px-6 border-t border-white/10 bg-[#0c0817] flex items-center justify-between shrink-0 gap-3">
          {activeTab === "personal" && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("safety")}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Continue to Safety &amp; CNIC</span>
                <span>→</span>
              </button>
            </>
          )}

          {activeTab === "safety" && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab("personal")}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("vibe")}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Continue to Photo &amp; Vibes</span>
                <span>→</span>
              </button>
            </>
          )}

          {activeTab === "vibe" && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab("safety")}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={isSubmitting || !completeness.isComplete}
                className="px-7 py-3 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white hover:brightness-110 shadow-[0_4px_24px_rgba(255,111,38,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Profile...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Profile &amp; Unlock →</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
