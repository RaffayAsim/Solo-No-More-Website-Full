"use client";

import { useState, useEffect, useRef } from "react";
import { createBeacon } from "@/app/actions/beacons";
import type { BeaconCategory, BeaconVisibility } from "@/lib/supabase/types";
import {
  Radio,
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Globe,
  Lock,
  X,
  Upload,
  Clock,
  Building,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Flame,
  Activity,
  Plus,
  Minus,
  Coins,
  HelpCircle,
  Navigation,
  ExternalLink,
  Compass,
  Search,
  Check,
} from "lucide-react";
import { BUDGET_TIERS, formatBeaconDescription } from "@/lib/beaconBudget";
import {
  searchLocalHotspots,
  fetchOnlinePlaces,
  type PlaceSuggestion,
} from "@/lib/locationPlaces";

interface CreateBeaconModalProps {
  onClose: () => void;
  onCreated: () => void;
  isPartner?: boolean;
  defaultCity?: string;
}

const CATEGORIES: {
  value: BeaconCategory;
  label: string;
  icon: typeof Activity;
}[] = [
  {
    value: "sports",
    label: "Sports & Fitness",
    icon: Activity,
  },
  {
    value: "casual",
    label: "Coffee & Casual",
    icon: Coffee,
  },
  {
    value: "nightlife",
    label: "Nightlife & Beats",
    icon: Flame,
  },
];

export default function CreateBeaconModal({
  onClose,
  onCreated,
  isPartner = false,
  defaultCity = "Karachi",
}: CreateBeaconModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budgetTier, setBudgetTier] = useState(BUDGET_TIERS[0].label);
  const [customQuestion, setCustomQuestion] = useState("");
  const [category, setCategory] = useState<BeaconCategory>("casual");
  const [visibility, setVisibility] = useState<BeaconVisibility>("stranger");
  const [slots, setSlots] = useState(3);
  const [location, setLocation] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>(() =>
    searchLocalHotspots("", defaultCity)
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const locationWrapperRef = useRef<HTMLDivElement>(null);

  const [scheduledAt, setScheduledAt] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [imageUrl, setImageUrl] = useState("");
  const [isPartnerOffer, setIsPartnerOffer] = useState(false);

  // Live autocomplete places effect
  useEffect(() => {
    // 1. Instant local matching (0ms lag)
    const localMatches = searchLocalHotspots(location, city);
    setSuggestions(localMatches);

    // 2. Online search fallback
    if (location.trim().length >= 2) {
      const timer = setTimeout(async () => {
        setIsSearchingOnline(true);
        try {
          const online = await fetchOnlinePlaces(location, city);
          if (online && online.length > 0) {
            setSuggestions((prev) => {
              const combined = [...prev];
              for (const item of online) {
                if (!combined.some((c) => c.name.toLowerCase() === item.name.toLowerCase())) {
                  combined.push(item);
                }
              }
              return combined.slice(0, 8);
            });
          }
        } finally {
          setIsSearchingOnline(false);
        }
      }, 250);

      return () => clearTimeout(timer);
    }
  }, [location, city]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        locationWrapperRef.current &&
        !locationWrapperRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPlace = (place: PlaceSuggestion) => {
    setLocation(place.name);
    setGoogleMapsUrl(place.mapsUrl);
    setSelectedPlace(place);
    setIsDropdownOpen(false);
  };

  const handleCustomLocationChoose = () => {
    if (!location.trim()) return;
    const q = encodeURIComponent(`${location.trim()}, ${city}`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${q}`;
    setGoogleMapsUrl(mapsUrl);
    setSelectedPlace({
      id: "custom",
      name: location.trim(),
      area: city,
      city,
      mapsUrl,
    });
    setIsDropdownOpen(false);
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Client-side HTML5 Canvas Image Auto-Compressor
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 600;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.65);
          resolve(dataUrl);
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
      setError("Failed to auto-compress uploaded image banner.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const fullDescription = formatBeaconDescription(
      description,
      budgetTier,
      customQuestion
    );

    let finalMapsUrl = googleMapsUrl.trim();
    if (!finalMapsUrl && location.trim()) {
      const q = encodeURIComponent(`${location.trim()}, ${city}`);
      finalMapsUrl = `https://www.google.com/maps/search/?api=1&query=${q}`;
    }

    const result = await createBeacon({
      title,
      description: fullDescription || undefined,
      category,
      visibility_mode: visibility,
      total_slots: slots,
      location_name: location.trim(),
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      google_maps_url: finalMapsUrl || undefined,
      city,
      image_url: imageUrl || undefined,
      is_partner_offer: isPartnerOffer,
    });

    if (!result.success) {
      setError(result.error);
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
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      style={{ zIndex: 99999, paddingTop: "40px", paddingBottom: "40px" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-[#0B080E] border border-white/[0.16] shadow-2xl shadow-black/90 flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.1] bg-white/[0.03]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF6F26]/15 text-[#FF6F26] border border-[#FF6F26]/30 flex items-center justify-center">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isPartnerOffer ? "Broadcast Partner Offer" : "Post a Beacon"}
              </h2>
              <p className="text-[11px] text-neutral-400">
                Broadcast your real-time matching frequency
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.08] hover:bg-white/[0.2] border border-white/20 text-white transition-all cursor-pointer shrink-0 group"
          >
            <span className="text-white text-base font-black leading-none select-none group-hover:scale-110 transition-transform" style={{ color: "#ffffff", fontSize: "16px", lineHeight: 1 }}>
              ✕
            </span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Beacon Title *
            </label>
            <input
              id="beacon-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
              placeholder="e.g. Padel match at Sunset Club, Midnight Chai run..."
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF6F26] transition-colors"
            />
            <div className="text-[10px] text-neutral-500 mt-1 text-right">
              {title.length}/60 chars
            </div>
          </div>

          {/* Beacon Vibe & Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Meetup Description &amp; Vibe
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are the plans? Who is this for? Any hangout rules?"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:border-[#FF6F26] transition-colors resize-none"
            />
          </div>

          {/* Budget / Barter Pact */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Meetup Budget / Barter Pact</span>
            </label>
            <select
              value={budgetTier}
              onChange={(e) => setBudgetTier(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#0E0B12] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF6F26] transition-colors"
            >
              {BUDGET_TIERS.map((tier) => (
                <option key={tier.id} value={tier.label}>
                  {tier.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-neutral-400 mt-1">
              Clear upfront expectations ensure comfortable, zero-awkwardness meetups for all members.
            </p>
          </div>

          {/* Host Icebreaker Question (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#FF6F26]" />
              <span>Host Icebreaker Question (Optional)</span>
            </label>
            <input
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder="e.g. Favorite chai spot? Or skill to share if barter?"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:border-[#FF6F26] transition-colors"
            />
          </div>

          {/* Partner Offer Toggle */}
          {isPartner && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <input
                id="partner-offer-toggle"
                type="checkbox"
                checked={isPartnerOffer}
                onChange={(e) => setIsPartnerOffer(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
              <label htmlFor="partner-offer-toggle" className="text-xs font-semibold text-emerald-400 cursor-pointer">
                Mark as Business Partner Promo Offer
              </label>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                    category === value
                      ? "bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white border-transparent shadow-lg shadow-[#FF6F26]/20"
                      : "bg-white/[0.03] border-white/10 text-neutral-300 hover:bg-white/[0.06]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Banner Image */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Banner Image (Auto-Compressed)
            </label>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="banner-image-file"
              />
              <label
                htmlFor="banner-image-file"
                className="flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-dashed border-white/20 text-xs font-medium text-neutral-300 cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4 text-[#FF6F26]" />
                <span>{imageUrl ? "✓ Banner Attached (Replace)" : "Upload Banner Image"}</span>
              </label>

              <input
                type="text"
                placeholder="Or paste an image URL..."
                value={imageUrl.startsWith("data:") ? "" : imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF6F26] transition-colors"
              />
            </div>
            {imageUrl && (
              <div className="mt-2.5 rounded-xl overflow-hidden border border-white/10 relative h-28">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Visibility Mode */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Visibility Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  value: "stranger" as BeaconVisibility,
                  label: "Stranger Mode",
                  sub: "Open to all members",
                  icon: Globe,
                },
                {
                  value: "friend" as BeaconVisibility,
                  label: "Friend Mode",
                  sub: "Accepted friends only",
                  icon: Lock,
                },
              ].map(({ value, label, sub, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setVisibility(value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    visibility === value
                      ? "bg-white/[0.08] border-[#FF6F26] text-white"
                      : "bg-white/[0.02] border-white/10 text-neutral-400 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-white">
                    <Icon className="w-3.5 h-3.5 text-[#FF6F26]" />
                    <span>{label}</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1">{sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* City Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Beacon Region / City
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#0E0B12] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF6F26] transition-colors"
            >
              <option value="Karachi">Karachi</option>
              <option value="Lahore">Lahore</option>
              <option value="Islamabad">Islamabad</option>
            </select>
          </div>

          {/* Slot Counter */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Open Slots (Capacity)
            </label>
            <div className="flex items-center gap-4">
              <div className="flex items-center rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSlots((s) => Math.max(1, s - 1))}
                  className="px-3.5 py-2.5 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Decrease slots"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-bold text-white text-sm">
                  {slots}
                </span>
                <button
                  type="button"
                  onClick={() => setSlots((s) => Math.min(10, s + 1))}
                  className="px-3.5 py-2.5 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Increase slots"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i < slots ? "bg-[#FF6F26]" : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1.5">
              {slots} {slots === 1 ? "person" : "people"} joining you
            </p>
          </div>

          {/* Location with Live Google Maps Autocomplete Dropdown */}
          <div ref={locationWrapperRef} className="relative">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FF6F26]" />
                <span>Meetup Location</span>
              </label>
              {selectedPlace && (
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Check className="w-2.5 h-2.5" />
                  <span>Map Pin Linked</span>
                </span>
              )}
            </div>

            <div className="relative">
              <MapPin className="w-4 h-4 text-[#FF6F26] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="beacon-location"
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setSelectedPlace(null);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Type venue or area (e.g. Espresso, Beverly Centre, Clifton...)"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF6F26] transition-colors"
                autoComplete="off"
              />
              {location && (
                <button
                  type="button"
                  onClick={() => {
                    setLocation("");
                    setGoogleMapsUrl("");
                    setSelectedPlace(null);
                    setIsDropdownOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Menu for Google Maps Place Selection (In-flow so it never clips) */}
            {isDropdownOpen && (
              <div className="mt-2 bg-[#120E1A] border border-white/15 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-white/5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                {/* Custom Typed Option */}
                {location.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={handleCustomLocationChoose}
                    className="w-full px-4 py-2.5 text-left bg-[#FF6F26]/10 hover:bg-[#FF6F26]/20 flex items-center justify-between gap-3 transition-colors border-b border-[#FF6F26]/20"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Navigation className="w-4 h-4 text-[#FF6F26] shrink-0" />
                      <div className="text-xs font-bold text-white truncate">
                        Use &ldquo;{location.trim()}&rdquo;
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#FFA05C] bg-[#FF6F26]/20 px-2 py-0.5 rounded-md shrink-0">
                      Auto Pin 📍
                    </span>
                  </button>
                )}

                {/* Hotspot & Geocoded Suggestions */}
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectPlace(item)}
                    className="w-full px-4 py-2.5 text-left hover:bg-white/10 flex items-start gap-3 transition-colors group"
                  >
                    <div className="w-6 h-6 rounded-lg bg-white/5 text-[#FF6F26] border border-white/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#FF6F26]/15 group-hover:border-[#FF6F26]/30 transition-colors">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-[#FFA05C] transition-colors truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate">
                        {item.area}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-zinc-500 group-hover:text-zinc-300 uppercase tracking-wider shrink-0 mt-1">
                      Select Pin ↗
                    </span>
                  </button>
                ))}

                {isSearchingOnline && (
                  <div className="px-4 py-2 text-[11px] text-zinc-400 italic flex items-center gap-2">
                    <Search className="w-3 h-3 animate-spin text-[#FF6F26]" />
                    <span>Searching Google Maps places...</span>
                  </div>
                )}
              </div>
            )}

            {/* Selected Place Badge */}
            {selectedPlace ? (
              <div className="mt-2 flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-emerald-500/20 text-xs">
                <div className="flex items-center gap-2 text-zinc-300 min-w-0">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[11px] truncate">
                    Pinned: <strong className="text-white">{selectedPlace.name}</strong> ({selectedPlace.area})
                  </span>
                </div>
                <a
                  href={selectedPlace.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-[#FFA05C] hover:underline shrink-0 ml-2"
                >
                  View on Maps ↗
                </a>
              </div>
            ) : (
              <p className="text-[10px] text-neutral-400 mt-1.5">
                Type your spot and pick from the dropdown to automatically lock in the exact Google Maps pin.
              </p>
            )}
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#FF6F26]" />
              <span>Date &amp; Time</span>
            </label>
            <input
              id="beacon-datetime"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF6F26] transition-colors [color-scheme:dark]"
            />
          </div>

          {/* Error display */}
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 transition-colors"
            >
              Cancel
            </button>
            <button
              id="post-beacon-submit"
              type="submit"
              disabled={isLoading || success}
              className="py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white shadow-lg shadow-[#FF6F26]/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {success ? "✓ Posted!" : isLoading ? "Posting..." : "Post Beacon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
