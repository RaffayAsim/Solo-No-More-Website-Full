"use client";

import { useState, useEffect } from "react";
import { createBeacon } from "@/app/actions/beacons";
import type { Profile, BeaconCategory } from "@/lib/supabase/types";
import {
  Tag,
  Store,
  Sparkles,
  MapPin,
  Calendar,
  Users,
  X,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  Percent,
  Gift,
  Flame,
  Check,
  Building2,
} from "lucide-react";

interface CreatePartnerOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  profile: Profile;
}

const DEAL_TYPES = [
  {
    id: "discount",
    label: "% Discount",
    badge: "DISCOUNT DEAL",
    icon: Percent,
    defaultPlaceholder: "e.g. 20% Off Entire Bill",
    color: "from-emerald-500/20 to-teal-500/10 text-emerald-300 border-emerald-500/30",
  },
  {
    id: "bogo",
    label: "1+1 BOGO",
    badge: "BUY 1 GET 1",
    icon: Gift,
    defaultPlaceholder: "e.g. Buy 1 Coffee, Get 1 Free for Solo Squads",
    color: "from-amber-500/20 to-orange-500/10 text-amber-300 border-amber-500/30",
  },
  {
    id: "perk",
    label: "Free Welcome Perk",
    badge: "FREE PERK",
    icon: Sparkles,
    defaultPlaceholder: "e.g. Free Artisanal Dessert with Main Course",
    color: "from-purple-500/20 to-pink-500/10 text-purple-300 border-purple-500/30",
  },
  {
    id: "happy_hour",
    label: "Happy Hour Special",
    badge: "HAPPY HOUR",
    icon: Flame,
    defaultPlaceholder: "e.g. 30% Off Mocktails & Appetizers between 4–7 PM",
    color: "from-rose-500/20 to-orange-500/10 text-rose-300 border-rose-500/30",
  },
];

function getAutoCategoryFromProfile(profile: Profile): { category: BeaconCategory; label: string } {
  const name = (profile.business_name || profile.full_name || "").toLowerCase();
  const vibes = (profile.vibe_tags || []).join(" ").toLowerCase();

  if (
    vibes.includes("active") ||
    vibes.includes("sports") ||
    vibes.includes("gaming") ||
    name.includes("padel") ||
    name.includes("sports") ||
    name.includes("arena") ||
    name.includes("club") ||
    name.includes("gym") ||
    name.includes("fitness") ||
    name.includes("turf")
  ) {
    return { category: "sports", label: "Sports & Social Club" };
  }

  if (
    vibes.includes("nights") ||
    vibes.includes("music") ||
    name.includes("rooftop") ||
    name.includes("lounge") ||
    name.includes("bar") ||
    name.includes("beats") ||
    name.includes("night")
  ) {
    return { category: "nightlife", label: "Rooftop & Nightlife" };
  }

  return { category: "casual", label: "Cafe & Casual Dining" };
}

export default function CreatePartnerOfferModal({
  isOpen,
  onClose,
  onCreated,
  profile,
}: CreatePartnerOfferModalProps) {
  const businessName = profile.business_name || profile.full_name || "Partner Venue";
  const venueCity = profile.city || "Karachi";
  const autoCategory = getAutoCategoryFromProfile(profile);

  const [selectedType, setSelectedType] = useState(DEAL_TYPES[0].id);
  const [title, setTitle] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [terms, setTerms] = useState("Show Solo-No-More member badge to server before billing.");
  const [validDaysHours, setValidDaysHours] = useState("Monday – Thursday: 4:00 PM – 10:00 PM");
  const category = autoCategory.category;
  const [tableSlots, setTableSlots] = useState(4);
  const [scheduledDate, setScheduledDate] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentDealConfig = DEAL_TYPES.find((d) => d.id === selectedType) || DEAL_TYPES[0];

  // Image auto-compressor
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/webp", 0.82));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const compressed = await compressImage(file);
      setImageUrl(compressed);
    } catch {
      setError("Failed to process uploaded image. Please try another image.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!title.trim()) {
      setError("Please provide an offer title.");
      setIsLoading(false);
      return;
    }

    if (!dealValue.trim()) {
      setError("Please specify the deal value or discount perk.");
      setIsLoading(false);
      return;
    }

    // Build structured promo description
    const fullDescription = [
      `🏷️ DEAL: [${currentDealConfig.badge}] ${dealValue.trim()}`,
      `⏰ VALIDITY: ${validDaysHours.trim()}`,
      `📋 INSTRUCTIONS: ${terms.trim()}`,
      `📍 VENUE: ${businessName} (${venueCity})`,
    ].join("\n\n");

    let finalMapsUrl = googleMapsUrl.trim();
    if (!finalMapsUrl) {
      const q = encodeURIComponent(`${businessName}, ${venueCity}`);
      finalMapsUrl = `https://www.google.com/maps/search/?api=1&query=${q}`;
    }

    const res = await createBeacon({
      title: title.trim(),
      description: fullDescription,
      category,
      visibility_mode: "stranger",
      total_slots: Math.min(Math.max(Number(tableSlots) || 4, 1), 10),
      location_name: businessName,
      city: venueCity,
      scheduled_at: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
      google_maps_url: finalMapsUrl,
      image_url: imageUrl || undefined,
      is_partner_offer: true,
    });

    if (!res.success) {
      setError(res.error);
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      onCreated();
      onClose();
    }, 1200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 overflow-y-auto"
      style={{
        background: "rgba(4, 2, 7, 0.85)",
        backdropFilter: "blur(18px)",
      }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[96vh] rounded-2xl sm:rounded-3xl border border-[#FF6F26]/30 overflow-hidden shadow-[0_20px_70px_rgba(0,0,0,0.85),0_0_40px_rgba(255,111,38,0.2)] flex flex-col my-auto"
        style={{
          background: "linear-gradient(180deg, #160e1d 0%, #0e0914 100%)",
        }}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#FF6F26]/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF6F26] to-[#FF5A1F] flex items-center justify-center text-white shadow-lg shadow-[#FF6F26]/30">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FFA05C] bg-[#FF6F26]/15 px-2 py-0.5 rounded-full border border-[#FF6F26]/30">
                  Venue Partner Form
                </span>
                <span className="text-xs text-zinc-400 font-medium">· Locked Location</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                Broadcast Partner Promo Offer
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/25 border border-white/20 hover:border-rose-500/40 flex items-center gap-1.5 text-white transition-all cursor-pointer shadow-md group shrink-0"
          >
            <X className="w-4 h-4 text-white group-hover:text-rose-400 shrink-0" strokeWidth={2.5} style={{ color: "#FFFFFF" }} />
            <span className="text-xs font-bold text-white group-hover:text-rose-300">Close</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 space-y-4 sm:space-y-5 max-h-[calc(96vh-80px)] overflow-y-auto custom-scrollbar">
          {/* Locked Venue Information Strip */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-[#FF8A3D]" />
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                  Broadcasting As Verified Venue
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-white">
                  {businessName}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300">
              <MapPin className="w-3.5 h-3.5 text-[#FF6F26]" />
              <span>{venueCity}</span>
            </div>
          </div>

          {/* Offer Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              1. Select Promotion Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DEAL_TYPES.map((deal) => {
                const Icon = deal.icon;
                const isSelected = selectedType === deal.id;
                return (
                  <button
                    key={deal.id}
                    type="button"
                    onClick={() => setSelectedType(deal.id)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? "bg-gradient-to-br from-[#FF6F26]/20 to-transparent border-[#FF6F26] shadow-[0_0_15px_rgba(255,111,38,0.25)]"
                        : "bg-white/[0.02] border-white/10 hover:border-white/20 text-zinc-400"
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-2 ${isSelected ? "text-[#FF8A3D]" : "text-zinc-400"}`} />
                    <span className="text-xs font-bold text-white block">{deal.label}</span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">{deal.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Offer Title & Specific Deal Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>Offer Headline</span>
                <span className="text-[10px] text-zinc-500">e.g. Weekend Squad Brunch</span>
              </label>
              <input
                type="text"
                required
                maxLength={80}
                placeholder="e.g. Flat 20% Off Squad Platters"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6F26] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>Deal Perk / Value</span>
                <span className="text-[10px] text-[#FFA05C]">Badge Value</span>
              </label>
              <input
                type="text"
                required
                maxLength={70}
                placeholder={currentDealConfig.defaultPlaceholder}
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6F26] transition-colors"
              />
            </div>
          </div>

          {/* Valid Days/Hours & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#FF6F26]" />
                <span>Validity Window & Days</span>
              </label>
              <input
                type="text"
                maxLength={90}
                placeholder="e.g. Mon–Thu, 4 PM – 10 PM"
                value={validDaysHours}
                onChange={(e) => setValidDaysHours(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6F26] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#FF6F26]" />
                <span>Squad Table Capacity (Seats)</span>
              </label>
              <div className="flex items-center gap-2">
                {[2, 4, 6, 8, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTableSlots(num)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      tableSlots === num
                        ? "bg-[#FF6F26] text-white shadow-md shadow-[#FF6F26]/30"
                        : "bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Auto-Locked Venue Vibe Category */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-3 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF8A3D]" />
              <span className="text-xs font-semibold text-zinc-300">
                Venue Category: <span className="text-white font-bold">{autoCategory.label}</span>
              </span>
            </div>
            <span className="text-[10px] text-zinc-500">
              (Auto-locked from your venue profile)
            </span>
          </div>

          {/* Featured Date / Meetup Day (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#FF6F26]" />
              <span>Featured Date / Meetup Day (Optional)</span>
            </label>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-[#FF6F26] transition-colors"
            />
          </div>

          {/* Redemption Terms & Google Maps Pin */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>Redemption Instructions for Members</span>
              <span className="text-[10px] text-zinc-500">Printed on digital pass</span>
            </label>
            <input
              type="text"
              maxLength={140}
              placeholder="e.g. Show active Solo-No-More member badge to manager upon seated."
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6F26] transition-colors"
            />
          </div>

          {/* Google Maps link (Optional override) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>Google Maps Venue Link (Optional)</span>
              <span className="text-[10px] text-zinc-500">Auto-generated if left empty</span>
            </label>
            <input
              type="url"
              placeholder="https://maps.google.com/..."
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6F26] transition-colors"
            />
          </div>

          {/* Promo Banner Image Upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>Venue Promo Banner (Photo of Dish, Drinks or Space)</span>
              <span className="text-[10px] text-[#FFA05C]">Auto-compressed WebP</span>
            </label>
            <div className="relative border-2 border-dashed border-white/15 hover:border-[#FF6F26]/50 rounded-2xl p-4 text-center transition-all bg-white/[0.02]">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {imageUrl ? (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Promo Preview"
                    className="max-h-36 mx-auto rounded-xl object-cover border border-white/10 shadow-lg"
                  />
                  <span className="text-[11px] text-[#FFA05C] font-semibold block">
                    ✓ Image optimized. Click or drag to replace.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                  <Upload className="w-5 h-5 text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-300">
                    Click or drag photo of your food, cafe, or space
                  </span>
                  <span className="text-[10px] text-zinc-500">PNG, JPG, or WEBP up to 10MB</span>
                </div>
              )}
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="rounded-2xl bg-white/[0.02] border border-[#FF6F26]/20 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#FFA05C] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Live Radar Preview (How Members See It)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#FF6F26]/20 text-[#FFA05C] border border-[#FF6F26]/30">
                VERIFIED PARTNER RADAR
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-extrabold text-white">
                  {title || "Flat 20% Off Squad Platters"}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                  <span className="text-[#FF8A3D] font-bold">
                    {businessName}
                  </span>
                  <span>·</span>
                  <span>{venueCity}</span>
                  <span>·</span>
                  <span className="text-zinc-300 font-semibold">{tableSlots} Seats</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                {currentDealConfig.badge}
              </span>
            </div>
          </div>

          {/* Error & Success Alerts */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Offer published! Now live on Karachi & citywide radars.</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full py-3.5 px-5 rounded-2xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white hover:brightness-110 shadow-[0_0_25px_rgba(255,111,38,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Publishing to Member Radar...</span>
              ) : success ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Promo Live on Feed!</span>
                </>
              ) : (
                <>
                  <Tag className="w-4 h-4" />
                  <span>Broadcast Promo Offer to Members</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
