"use client";

import { useState, useEffect } from "react";
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

export default function CompleteProfileModal({
  isOpen,
  onClose,
  profile,
  onProfileCompleted,
  actionContext = "participating",
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
      setCnic(profile.cnic || "");
      setCnicPictureUrl(profile.cnic_picture_url || "");
      setEmergencyName(profile.emergency_contact_name || profile.emergency_name || "");
      setEmergencyPhone(profile.emergency_contact_phone || profile.emergency_phone || "");
      setInstagram(profile.instagram_username || profile.instagram || "");
      setAvatarUrl(profile.avatar_url || profile.photo_url || "");
      setVibeTags(profile.vibe_tags || profile.interests || ["Techno & House"]);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, profile]);

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
  };

  const completeness = checkProfileCompleteness(currentDraft);

  const toggleVibe = (tag: string) => {
    setVibeTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setter(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
        avatar_url: avatarUrl,
        vibe_tags: vibeTags,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to update profile. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg("Profile verified successfully! Action unlocked.");
      if (onProfileCompleted) {
        onProfileCompleted({
          ...profile,
          ...currentDraft,
          is_profile_complete: true,
        });
      }

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0c0817] border border-white/15 rounded-3xl shadow-[0_0_50px_rgba(255,111,38,0.25)] overflow-hidden my-auto flex flex-col max-h-[96vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Top Glow Header */}
        <div className="p-4 sm:p-7 border-b border-white/10 relative bg-gradient-to-r from-[#FF6F26]/10 via-purple-600/10 to-transparent shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2 flex-wrap pr-8">
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-[#FF6F26]/20 text-[#FFA05C] border border-[#FF6F26]/30">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF6F26]" />
              Mandatory Safety Verification
            </span>
            <span className="text-[11px] sm:text-xs text-zinc-400">
              Before {actionContext}
            </span>
          </div>

          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
            Complete Your Verified Profile
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 mt-1 line-clamp-2 sm:line-clamp-none">
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
                  completeness.isComplete ? "text-emerald-400 text-[11px] sm:text-xs" : "text-[#FFA05C] text-[11px] sm:text-xs"
                }
              >
                {completeness.completionPercentage}% Ready
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF6F26] to-[#FFA05C] transition-all duration-300 rounded-full"
                style={{ width: `${completeness.completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-black/40 px-2 sm:px-6 overflow-x-auto no-scrollbar whitespace-nowrap shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("personal")}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "personal"
                ? "border-[#FF6F26] text-white"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <User className="w-3.5 h-3.5 text-[#FF6F26]" />
            <span><span className="hidden sm:inline">1. </span>Personal Info</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("safety")}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "safety"
                ? "border-[#FF6F26] text-white"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-[#FF6F26]" />
            <span><span className="hidden sm:inline">2. </span>Safety &amp; CNIC</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("vibe")}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "vibe"
                ? "border-[#FF6F26] text-white"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FFA05C]" />
            <span><span className="hidden sm:inline">3. </span>Photo &amp; Vibes</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-7 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: Personal Details */}
          {activeTab === "personal" && (
            <div className="space-y-4 animate-in fade-in">
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
                    placeholder="e.g. Abdul Raffay"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#140e24] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF6F26] transition-colors"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#140e24] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF6F26] transition-colors"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#140e24] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF6F26] transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab("safety")}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  Continue to Safety &amp; CNIC →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Safety & CNIC Details */}
          {activeTab === "safety" && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                    CNIC / National Identity Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={cnic}
                    onChange={(e) => setCnic(e.target.value)}
                    placeholder="42101-1234567-1"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26] transition-colors"
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
                      value={instagram.replace(/^@/, "")}
                      onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))}
                      placeholder="username"
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
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
                {cnicPictureUrl ? (
                  <div className="relative w-full h-32 rounded-2xl border border-white/15 overflow-hidden bg-black/40">
                    <img
                      src={cnicPictureUrl}
                      alt="CNIC Front"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setCnicPictureUrl("")}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white text-xs hover:bg-red-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/15 rounded-2xl cursor-pointer hover:border-[#FF6F26]/60 transition-colors bg-white/[0.01]">
                    <CreditCard className="w-6 h-6 text-zinc-500 mb-1" />
                    <span className="text-xs text-zinc-400">Upload CNIC Front Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, setCnicPictureUrl)}
                    />
                  </label>
                )}
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab("personal")}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("vibe")}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  Continue to Photo &amp; Vibes →
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Photo & Vibes */}
          {activeTab === "vibe" && (
            <div className="space-y-4 animate-in fade-in">
              {/* Profile Photo */}
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-2">
                  Profile Headshot Photo *
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/20 bg-black/40 shrink-0 flex items-center justify-center">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-8 h-8 text-zinc-600" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold cursor-pointer transition-colors">
                      <Camera className="w-4 h-4 text-[#FF6F26]" />
                      <span>{avatarUrl ? "Change Photo" : "Upload Headshot"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, setAvatarUrl)}
                      />
                    </label>
                    <p className="text-[11px] text-zinc-500">
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
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-[#FF6F26] text-white shadow-[0_0_15px_rgba(255,111,38,0.4)]"
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

              <div className="pt-4 border-t border-white/10 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("safety")}
                  className="px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white text-center border border-white/10 sm:border-transparent"
                >
                  ← Back to Safety &amp; CNIC
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !completeness.isComplete}
                  className="w-full sm:w-auto px-7 py-3.5 sm:py-3 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white hover:brightness-110 shadow-[0_4px_24px_rgba(255,111,38,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify Profile &amp; Unlock →</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
