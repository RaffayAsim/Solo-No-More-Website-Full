"use client";

import { useState } from "react";
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
  ExternalLink,
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
];

interface ProfileEditClientProps {
  initialProfile: {
    id: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    cnic?: string;
    address?: string;
    gender?: string;
    cnic_picture_url?: string;
    avatar_url?: string;
    avatar_icon?: string;
    bio?: string;
    social_link?: string;
    city?: string;
    vibe_tags?: string[];
    is_partner?: boolean;
    business_name?: string;
    is_active_seeker?: boolean;
  };
  email?: string;
}

export default function ProfileEditClient({
  initialProfile,
  email = "member@solonomore.com",
}: ProfileEditClientProps) {
  const router = useRouter();

  const nameParts = (initialProfile.full_name || "").trim().split(" ");
  const defaultFirstName = initialProfile.first_name || nameParts[0] || "Zainab";
  const defaultLastName =
    initialProfile.last_name || nameParts.slice(1).join(" ") || "Ahmed";

  const [firstName, setFirstName] = useState(defaultFirstName);
  const [lastName, setLastName] = useState(defaultLastName);
  const [cnic, setCnic] = useState(initialProfile.cnic || "12345-6789012-3");
  const [phone, setPhone] = useState(initialProfile.phone || "03332877852");
  const [address, setAddress] = useState(
    initialProfile.address || "House 45-B, Street 2, Phase 5, DHA, Lahore, Pakistan"
  );
  const [gender, setGender] = useState(initialProfile.gender || "Male");
  const [cnicPictureUrl, setCnicPictureUrl] = useState(initialProfile.cnic_picture_url || "");
  const [bio, setBio] = useState(
    initialProfile.bio || "Padel fanatic, weekend chai explorer & social foodie in Karachi."
  );
  const [city, setCity] = useState(initialProfile.city || "Karachi");
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url || "");
  const [vibeTags, setVibeTags] = useState<string[]>(
    initialProfile.vibe_tags || ["Techno & House", "Late Night Chai", "Padel & Sports"]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const toggleVibe = (tag: string) => {
    setVibeTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const initials =
    `${firstName.charAt(0) || ""}${lastName.charAt(0) || ""}`.toUpperCase() || "ZA";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await updateProfileAction({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        phone: phone.trim(),
        cnic: cnic.trim(),
        address: address.trim(),
        gender,
        cnic_picture_url: cnicPictureUrl.trim(),
        avatar_url: avatarUrl.trim(),
        bio: bio.trim(),
        city,
        vibe_tags: vibeTags,
      });

      if (res.success) {
        setSuccessMsg("Profile successfully updated!");
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
    <div className="w-full max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* ── Top Navigation Link ── */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/profile"
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Profile</span>
        </Link>
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Profile Settings
        </span>
      </div>

      {/* ── Form Card ── */}
      <div className="rounded-3xl bg-[#0E0A16] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl">
        {/* Header Bar */}
        <div className="flex items-center gap-3.5 pb-2">
          <div className="w-10 h-10 rounded-xl bg-[#FF6F26]/15 text-[#FF6F26] border border-[#FF6F26]/30 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Edit User Profile
            </h1>
            <p className="text-xs text-zinc-400">
              Manage your personal identity, CNIC verification &amp; contact details
            </p>
          </div>
        </div>

        {/* ── Top Readonly Summary Tiles (Name & Email) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
              NAME
            </div>
            <div className="text-sm font-bold text-white mt-1 truncate">
              {firstName} {lastName}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
              EMAIL
            </div>
            <div className="text-sm font-bold text-zinc-200 mt-1 truncate">
              {email}
            </div>
          </div>
        </div>

        {/* ── Profile Photo Section ── */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="relative shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Profile Avatar"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#FF6F26] shadow-lg shadow-[#FF6F26]/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF6F26] to-[#FF8A3D] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-[#FF6F26]/30 select-none">
                {initials}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-[#FF6F26] text-white shadow-md">
              <Camera className="w-3 h-3" />
            </div>
          </div>

          <div className="flex-1 w-full space-y-1.5 text-center sm:text-left">
            <div className="text-xs font-bold text-white">Profile Photo</div>
            <p className="text-[11px] text-zinc-400">
              Upload a clear image. It will be visible across your dashboard profile.
            </p>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="Paste image URL (e.g. https://... or leave empty for initials)"
              className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26] transition-colors"
            />
          </div>
        </div>

        {/* ── Feedback Alerts ── */}
        {errorMsg && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ── Main Form Fields ── */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF6F26] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF6F26] transition-colors"
              />
            </div>
          </div>

          {/* CNIC Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              CNIC Number *
            </label>
            <input
              type="text"
              required
              value={cnic}
              onChange={(e) => setCnic(e.target.value)}
              placeholder="e.g. 12345-6789012-3"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-[#FF6F26] transition-colors"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 03332877852"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-[#FF6F26] transition-colors"
            />
          </div>

          {/* City Radar Hub */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#FF6F26]" />
              <span>City Radar Hub</span>
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0B0812] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF6F26] transition-colors"
            >
              <option value="Karachi">Karachi</option>
              <option value="Lahore">Lahore</option>
              <option value="Islamabad">Islamabad</option>
            </select>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Address *
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House #, Street, Phase / Area, City"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF6F26] transition-colors"
            />
          </div>

          {/* Gender & CNIC Picture URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Gender *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0B0812] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF6F26] transition-colors"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                CNIC Picture URL
              </label>
              <input
                type="url"
                value={cnicPictureUrl}
                onChange={(e) => setCnicPictureUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26] transition-colors"
              />
            </div>
          </div>

          {/* Bio & Vibe Statement */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Bio &amp; Vibe Statement
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share a short bio or vibe statement..."
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6F26] transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Interests & Vibe Tags */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6F26]" />
              <span>Interests &amp; Vibe Tags</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_VIBES.map((tag) => {
                const isSelected = vibeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleVibe(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white border-transparent shadow-md shadow-[#FF6F26]/30"
                        : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <span>{isSelected ? "✓" : "+"}</span>
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Link
              href="/dashboard/profile"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-lg shadow-[#FF6F26]/30 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
