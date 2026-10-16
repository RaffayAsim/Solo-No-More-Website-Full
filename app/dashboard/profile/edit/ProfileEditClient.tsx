"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateProfileAction } from "@/app/actions/profile";
import {
  ArrowLeft,
  User,
  Camera,
  MapPin,
  Sparkles,
  Check,
  AlertCircle,
  Save,
  CheckCircle2,
  Lock,
  HeartPulse,
  CreditCard,
  Trash2,
  Loader2,
  ShieldCheck,
  Radio,
  Ticket,
  Image as ImageIcon,
} from "lucide-react";

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

function compressAndResizeImage(
  file: File,
  maxDim = 900,
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

interface ProfileEditClientProps {
  initialProfile: {
    id: string;
    full_name?: string;
    phone?: string;
    city?: string;
    gender?: string;
    date_of_birth?: string;
    cnic?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    instagram_username?: string;
    cnic_picture_url?: string;
    instagram_screenshot_url?: string;
    photo_url?: string;
    bio?: string;
    vibe_tags?: string[];
    is_profile_complete?: boolean;
  };
  email?: string;
  notice?: string;
}

export default function ProfileEditClient({
  initialProfile,
  email = "member@solonomore.com",
  notice,
}: ProfileEditClientProps) {
  const router = useRouter();

  // Unified Verification Form State
  const [fullName, setFullName] = useState(initialProfile.full_name || "");
  const [phone, setPhone] = useState(initialProfile.phone || "");
  const [city, setCity] = useState(initialProfile.city || "Karachi");
  const [gender, setGender] = useState(initialProfile.gender || "Male");
  const [dateOfBirth, setDateOfBirth] = useState(initialProfile.date_of_birth || "");
  
  const [instagram, setInstagram] = useState(
    (initialProfile.instagram_username || "").replace(/^@/, "")
  );
  const [emergencyName, setEmergencyName] = useState(initialProfile.emergency_contact_name || "");
  const [emergencyPhone, setEmergencyPhone] = useState(initialProfile.emergency_contact_phone || "");
  const [cnicPictureUrl, setCnicPictureUrl] = useState(initialProfile.cnic_picture_url || "");
  const [instagramScreenshotUrl, setInstagramScreenshotUrl] = useState(
    initialProfile.instagram_screenshot_url || ""
  );

  const [photoUrl, setPhotoUrl] = useState(initialProfile.photo_url || "");
  const [bio, setBio] = useState(initialProfile.bio || "");
  const [vibeTags, setVibeTags] = useState<string[]>(
    Array.isArray(initialProfile.vibe_tags) && initialProfile.vibe_tags.length > 0
      ? initialProfile.vibe_tags
      : ["Techno & House"]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingCnic, setIsUploadingCnic] = useState(false);
  const [isUploadingIgScreenshot, setIsUploadingIgScreenshot] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const cnicInputRef = useRef<HTMLInputElement>(null);
  const igScreenshotInputRef = useRef<HTMLInputElement>(null);

  const toggleVibe = (tag: string) => {
    setVibeTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingPhoto(true);
      setErrorMsg(null);
      const optimized = await compressAndResizeImage(file, 600, 0.85);
      setPhotoUrl(optimized);
    } catch {
      setErrorMsg("Failed to process profile photo.");
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
      setErrorMsg("Failed to process CNIC picture.");
    } finally {
      setIsUploadingCnic(false);
      if (cnicInputRef.current) cnicInputRef.current.value = "";
    }
  };

  const handleIgScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingIgScreenshot(true);
      setErrorMsg(null);
      const optimized = await compressAndResizeImage(file, 900, 0.85);
      setInstagramScreenshotUrl(optimized);
    } catch {
      setErrorMsg("Failed to process Instagram screenshot.");
    } finally {
      setIsUploadingIgScreenshot(false);
      if (igScreenshotInputRef.current) igScreenshotInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setErrorMsg("Full Legal Name is required.");
      setIsSubmitting(false);
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("WhatsApp / Phone is required.");
      setIsSubmitting(false);
      return;
    }
    if (!dateOfBirth.trim()) {
      setErrorMsg("Date of Birth is required for 18+ age verification.");
      setIsSubmitting(false);
      return;
    }
    if (!cnicPictureUrl) {
      setErrorMsg("Front CNIC Document Photo is required for verification.");
      setIsSubmitting(false);
      return;
    }
    if (!instagramScreenshotUrl) {
      setErrorMsg("Instagram Profile Screenshot is required for verification.");
      setIsSubmitting(false);
      return;
    }
    if (!instagram.trim()) {
      setErrorMsg("Instagram handle (@username) is required.");
      setIsSubmitting(false);
      return;
    }
    if (!emergencyName.trim() || !emergencyPhone.trim()) {
      setErrorMsg("Emergency contact name and phone are required for community safety.");
      setIsSubmitting(false);
      return;
    }
    if (vibeTags.length === 0) {
      setErrorMsg("Please select at least 1 vibe tag.");
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
        cnic_picture_url: cnicPictureUrl,
        instagram_screenshot_url: instagramScreenshotUrl,
        emergency_contact_name: emergencyName.trim(),
        emergency_contact_phone: emergencyPhone.trim(),
        instagram_username: instagram.trim().replace(/^@/, ""),
        photo_url: photoUrl,
        avatar_url: photoUrl,
        bio: bio.trim(),
        vibe_tags: vibeTags,
      });

      if (res.success) {
        setSuccessMsg("✓ Profile verification details successfully saved to Supabase!");
        router.refresh();
        setTimeout(() => {
          router.push("/dashboard/profile");
        }, 800);
      } else {
        setErrorMsg(res.error || "Failed to update profile.");
      }
    } catch {
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* ── Top Navigation Link ── */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/profile"
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#FF6F26]" />
          <span>Back to Profile</span>
        </Link>

        {initialProfile.is_profile_complete && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Verified Profile
          </span>
        )}
      </div>

      {/* ── Prominent Notice Banner (When redirected for verification) ── */}
      {notice && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FF6F26]/20 via-orange-950/40 to-black/70 border border-[#FF6F26]/50 shadow-[0_0_30px_rgba(255,111,38,0.2)] animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            {notice === "beacon_required" ? (
              <Radio className="w-5 h-5 text-[#FFA05C] shrink-0 mt-0.5 animate-pulse" />
            ) : notice === "event_booking_required" ? (
              <Ticket className="w-5 h-5 text-[#FFA05C] shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-[#FFA05C] shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h3 className="text-sm font-black text-[#FFA05C] uppercase tracking-wider">
                {notice === "beacon_required"
                  ? "Profile Verification Required for Beacons"
                  : notice === "event_booking_required"
                  ? "Profile Verification Required for Event Tickets"
                  : notice === "membership_upgrade"
                  ? "Membership Upgrade Verification"
                  : "Profile Verification Required"}
              </h3>
              <p className="text-xs text-zinc-200 leading-relaxed">
                {notice === "beacon_required"
                  ? "To host or join member beacons, our community safety standards require verified identity details (including your CNIC photo and Instagram screenshot) before broadcasting."
                  : notice === "event_booking_required"
                  ? "Official event booking and door verification require your CNIC photo and Instagram screenshot on file for secure check-in."
                  : notice === "membership_upgrade"
                  ? "Please submit your required identity details below to request full membership upgrade."
                  : "Please provide the required verification details below to participate in Beacons and official Solo-No-More events."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Edit &amp; Verify Profile
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Update your identity, safety documents (CNIC &amp; Instagram screenshot), and community vibes.
        </p>
      </div>

      {/* ── Alerts ── */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-start gap-3 text-sm text-red-300 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3 text-sm text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── Unified Form ── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ── Section 1: Headshot (Optional) ── */}
        <div className="p-6 rounded-3xl bg-[#140E1E] border border-white/10 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Camera className="w-4 h-4 text-[#FF6F26]" />
              <span>Profile Headshot Photo</span>
            </div>
            <span className="text-xs font-semibold text-zinc-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
              Optional
            </span>
          </div>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-white/20 bg-black/40 shrink-0 flex items-center justify-center relative shadow-lg">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-zinc-600" />
              )}
              {isUploadingPhoto && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-[#FF6F26] animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-3 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-[#FF6F26]" />
                  <span>{photoUrl ? "Change Photo" : "Upload Headshot (Optional)"}</span>
                </button>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl("")}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-colors cursor-pointer"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Optional: Upload a headshot photo for community squad meetups and door recognition. Can be uploaded at any time.
              </p>
            </div>
          </div>
        </div>

        {/* ── Section 2: Personal Information ── */}
        <div className="p-6 rounded-3xl bg-[#140E1E] border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-white/10 pb-3">
            <User className="w-4 h-4 text-[#FF6F26]" />
            <span>1. Personal Information</span>
          </div>

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
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                WhatsApp / Mobile Phone *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300 1234567"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                City Radar Hub *
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
                Date of Birth * (18+)
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

          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1.5">
              Account Email
            </label>
            <input
              type="text"
              disabled
              value={email}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-zinc-500 text-sm cursor-not-allowed font-mono"
            />
          </div>
        </div>

        {/* ── Section 3: Safety & Verification Documents ── */}
        <div className="p-6 rounded-3xl bg-[#140E1E] border border-white/10 space-y-5 shadow-xl">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-white/10 pb-3">
            <Lock className="w-4 h-4 text-[#FF6F26]" />
            <span>2. Safety Documents &amp; Contacts</span>
          </div>

          {/* Social Handle */}
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
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26] transition-colors"
              />
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">
              Used by ops team for social vetting.
            </span>
          </div>

          {/* Document Uploads: CNIC Photo & Instagram Screenshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            
            {/* Front CNIC Picture (Required) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300">
                  Front CNIC Document Photo *
                </label>
                <span className="text-[10px] font-black uppercase text-[#FFA05C] bg-[#FF6F26]/15 px-2 py-0.5 rounded-full border border-[#FF6F26]/30">
                  Required
                </span>
              </div>
              <input
                ref={cnicInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCnicUpload}
              />

              {cnicPictureUrl ? (
                <div className="relative w-full h-36 rounded-2xl border border-white/15 overflow-hidden bg-black/40 group shadow-md">
                  <img
                    src={cnicPictureUrl}
                    alt="CNIC Front"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
                  className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-[#FF6F26]/40 hover:border-[#FF6F26] rounded-2xl cursor-pointer transition-colors bg-white/[0.02] p-4 text-center group"
                >
                  {isUploadingCnic ? (
                    <Loader2 className="w-6 h-6 text-[#FF6F26] animate-spin mb-1.5" />
                  ) : (
                    <CreditCard className="w-6 h-6 text-[#FFA05C] mb-1.5 group-hover:scale-110 transition-transform" />
                  )}
                  <span className="text-xs text-white font-bold">
                    {isUploadingCnic ? "Optimizing photo..." : "Upload Front CNIC Photo"}
                  </span>
                  <span className="text-[10px] text-zinc-400 mt-0.5">
                    Clear front side photo of your national ID
                  </span>
                </div>
              )}
            </div>

            {/* Instagram Profile Screenshot (Required) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300">
                  Instagram Profile Screenshot *
                </label>
                <span className="text-[10px] font-black uppercase text-[#FFA05C] bg-[#FF6F26]/15 px-2 py-0.5 rounded-full border border-[#FF6F26]/30">
                  Required
                </span>
              </div>
              <input
                ref={igScreenshotInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleIgScreenshotUpload}
              />

              {instagramScreenshotUrl ? (
                <div className="relative w-full h-36 rounded-2xl border border-white/15 overflow-hidden bg-black/40 group shadow-md">
                  <img
                    src={instagramScreenshotUrl}
                    alt="Instagram Screenshot"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => igScreenshotInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstagramScreenshotUrl("")}
                      className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-xs transition-colors cursor-pointer"
                      title="Remove Screenshot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => igScreenshotInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-[#FF6F26]/40 hover:border-[#FF6F26] rounded-2xl cursor-pointer transition-colors bg-white/[0.02] p-4 text-center group"
                >
                  {isUploadingIgScreenshot ? (
                    <Loader2 className="w-6 h-6 text-[#FF6F26] animate-spin mb-1.5" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-[#FFA05C] mb-1.5 group-hover:scale-110 transition-transform" />
                  )}
                  <span className="text-xs text-white font-bold">
                    {isUploadingIgScreenshot ? "Optimizing screenshot..." : "Upload Instagram Screenshot"}
                  </span>
                  <span className="text-[10px] text-zinc-400 mt-0.5">
                    Screenshot showing your bio &amp; handle
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* Emergency Safety Contact */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3 mt-3">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
              <HeartPulse className="w-4 h-4 text-rose-400" />
              <span>Emergency Safety Contact (Parent / Spouse / Friend) *</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">
                  Contact Full Name *
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
                  Contact Phone Number *
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
        </div>

        {/* ── Section 4: Vibes & Bio ── */}
        <div className="p-6 rounded-3xl bg-[#140E1E] border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-white/10 pb-3">
            <Sparkles className="w-4 h-4 text-[#FFA05C]" />
            <span>3. Vibes &amp; Bio Statement</span>
          </div>

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

          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1.5">
              Personal Bio / About Me
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other squad members what experiences you're into..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26] transition-colors resize-none"
            />
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/dashboard/profile"
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white hover:brightness-110 shadow-[0_4px_24px_rgba(255,111,38,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Details...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
