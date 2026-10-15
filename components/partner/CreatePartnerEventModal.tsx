"use client";

import { useState, useEffect, useRef } from "react";
import { saveRichEventAction } from "@/app/actions/events";
import type { Profile } from "@/lib/supabase/types";
import type {
  EventTierPackage,
  EventOrganizerInfo,
  EventPerformerLineup,
} from "@/lib/event-metadata";
import {
  searchLocalHotspots,
  fetchOnlinePlaces,
  type PlaceSuggestion,
} from "@/lib/locationPlaces";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Ticket,
  Upload,
  Sparkles,
  Check,
  AlertCircle,
  CheckCircle2,
  X,
  Building2,
  Globe,
  Lock,
  Plus,
  Trash2,
  Music,
  Navigation,
  ExternalLink,
} from "lucide-react";

interface CreatePartnerEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  profile: Profile;
}

// Client-side WebP image compressor
function compressEventImage(file: File): Promise<string> {
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
}

export default function CreatePartnerEventModal({
  isOpen,
  onClose,
  onCreated,
  profile,
}: CreatePartnerEventModalProps) {
  const businessName = profile.business_name || profile.full_name || "Partner Venue";
  const venueCity = profile.city || "Karachi";

  // Basic Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("19:30");
  const [endTime, setEndTime] = useState("22:30");

  // Location selection with Google Maps Autocomplete
  const [venueName, setVenueName] = useState(businessName);
  const [fullAddress, setFullAddress] = useState(`${businessName}, ${venueCity}`);
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<PlaceSuggestion[]>(() =>
    searchLocalHotspots("", venueCity)
  );
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const locationWrapperRef = useRef<HTMLDivElement>(null);

  // Live autocomplete places effect
  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      const localMatches = searchLocalHotspots(venueName, venueCity);
      if (!isCancelled) {
        setLocationSuggestions(localMatches);
      }

      if (venueName.trim().length >= 2) {
        setIsSearchingOnline(true);
        try {
          const online = await fetchOnlinePlaces(venueName, venueCity);
          if (!isCancelled && online && online.length > 0) {
            setLocationSuggestions((prev) => {
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
          if (!isCancelled) {
            setIsSearchingOnline(false);
          }
        }
      }
    }, 100);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [venueName, venueCity]);

  // Click outside to close location dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        locationWrapperRef.current &&
        !locationWrapperRef.current.contains(e.target as Node)
      ) {
        setIsLocationDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPlace = (place: PlaceSuggestion) => {
    setVenueName(place.name);
    setFullAddress(place.address || `${place.name}, ${place.area}, ${place.city}`);
    setGoogleMapsUrl(place.mapsUrl);
    setSelectedPlace(place);
    setIsLocationDropdownOpen(false);
  };

  const handleCustomLocationChoose = () => {
    if (!venueName.trim()) return;
    const q = encodeURIComponent(`${venueName.trim()}, ${venueCity}`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${q}`;
    setGoogleMapsUrl(mapsUrl);
    setSelectedPlace({
      id: "custom",
      name: venueName.trim(),
      area: venueCity,
      city: venueCity,
      mapsUrl,
    });
    if (!fullAddress.trim()) {
      setFullAddress(`${venueName.trim()}, ${venueCity}`);
    }
    setIsLocationDropdownOpen(false);
  };

  // Visibility: "members_only" | "public" (Open Event)
  const [visibility, setVisibility] = useState<"members_only" | "public">("members_only");

  // 1. TIER SELECTION STATE
  const [tierPackages, setTierPackages] = useState<EventTierPackage[]>([
    {
      id: "tier-1",
      name: "General Admission",
      price: 1500,
      spots: 50,
      perks: "Standard admission & confirmed table / space",
    },
  ]);

  const handleAddTier = () => {
    setTierPackages((prev) => [
      ...prev,
      {
        id: `tier-${Date.now()}`,
        name: prev.length === 1 ? "VIP Pass" : `Tier ${prev.length + 1}`,
        price: 2500,
        spots: 25,
        perks: "Priority entry & welcome beverage",
      },
    ]);
  };

  const handleUpdateTier = <K extends keyof EventTierPackage>(
    index: number,
    field: K,
    value: EventTierPackage[K]
  ) => {
    setTierPackages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveTier = (index: number) => {
    if (tierPackages.length <= 1) return;
    setTierPackages((prev) => prev.filter((_, i) => i !== index));
  };

  // 2. ORGANIZATION / HOST BRAND SELECTION STATE
  const [includeOrganizer, setIncludeOrganizer] = useState(true);
  const [organizerName, setOrganizerName] = useState(
    profile.business_name || profile.full_name || "Partner Venue"
  );
  const [organizerTagline, setOrganizerTagline] = useState(
    `Verified Venue Host in ${venueCity}`
  );
  const [organizerAvatarUrl, setOrganizerAvatarUrl] = useState(
    profile.avatar_icon ||
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80"
  );

  const handleOrganizerPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressEventImage(file);
      setOrganizerAvatarUrl(compressed);
    } catch {
      setError("Failed to process organizer logo. Please try another image.");
    }
  };

  // 3. LINEUP / PERFORMER SELECTION STATE
  const [lineups, setLineups] = useState<EventPerformerLineup[]>([]);

  const handleAddPerformer = () => {
    setLineups((prev) => [
      ...prev,
      {
        name: "",
        role: "Live Set / DJ",
        time: "8:00 PM – 10:00 PM",
        imageUrl: "",
      },
    ]);
  };

  const handleUpdatePerformer = (
    index: number,
    field: keyof EventPerformerLineup,
    value: string
  ) => {
    setLineups((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemovePerformer = (index: number) => {
    setLineups((prev) => prev.filter((_, i) => i !== index));
  };

  // Banner & Submission State
  const [featureImage, setFeatureImage] = useState("");
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

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const compressed = await compressEventImage(file);
      setFeatureImage(compressed);
    } catch {
      setError("Failed to process banner image. Please try another image.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!title.trim()) {
      setError("Event title is required.");
      setIsLoading(false);
      return;
    }

    if (!eventDate) {
      setError("Event date is required.");
      setIsLoading(false);
      return;
    }

    // Validate Tiers
    if (tierPackages.length === 0) {
      setError("At least one ticket tier is required.");
      setIsLoading(false);
      return;
    }

    for (let i = 0; i < tierPackages.length; i++) {
      if (!tierPackages[i].name.trim()) {
        setError(`Tier #${i + 1} must have a name.`);
        setIsLoading(false);
        return;
      }
    }

    const calculatedCapacity = tierPackages.reduce(
      (sum, t) => sum + (Number(t.spots) || 0),
      0
    );
    const validCapacity = calculatedCapacity > 0 ? calculatedCapacity : 60;

    const formattedTiers: EventTierPackage[] = tierPackages.map((t, idx) => ({
      id: t.id || `tier-${idx + 1}`,
      name: t.name.trim(),
      price: Math.max(Number(t.price) || 0, 0),
      spots: Math.max(Number(t.spots) || 1, 1),
      perks: t.perks?.trim() || undefined,
    }));

    const validLineups: EventPerformerLineup[] = lineups
      .filter((l) => l.name.trim().length > 0)
      .map((l) => ({
        name: l.name.trim(),
        role: l.role.trim() || "Performer",
        time: l.time.trim() || "Schedule TBA",
        imageUrl: l.imageUrl || undefined,
      }));

    try {
      const res = await saveRichEventAction({
        title: title.trim(),
        description:
          description.trim() ||
          `Official brand event hosted at ${businessName}.`,
        eventDate,
        startTime,
        endTime,
        venueName: venueName.trim() || businessName,
        fullAddress: fullAddress.trim() || `${businessName}, ${venueCity}`,
        tierPackages: formattedTiers,
        partnerCollaboration: businessName,
        featureImage: featureImage || undefined,
        capacityLimit: validCapacity,
        visibility,
        audience: "all",
        status: "pending_review",
        creatorType: "partner",
        eventCategory:
          visibility === "members_only" ? "community_event" : "open_event",
        organizer: includeOrganizer
          ? {
              name: organizerName.trim() || businessName,
              tagline:
                organizerTagline.trim() || `Verified Venue Host in ${venueCity}`,
              avatarUrl: organizerAvatarUrl,
            }
          : null,
        importantInfo: [
          "Present your digital Solo-No-More ticket pass at the venue entrance.",
          "Strictly for verified guests and squads.",
        ],
        lineups: validLineups,
      });

      if (!res.success) {
        setError(res.error || "Failed to create event.");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onCreated();
        onClose();
      }, 1400);
    } catch {
      setError("Connection error occurred while publishing event.");
      setIsLoading(false);
    }
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
        className="relative w-full max-w-3xl max-h-[96vh] rounded-2xl sm:rounded-3xl border border-purple-500/30 overflow-hidden shadow-[0_20px_70px_rgba(0,0,0,0.85),0_0_40px_rgba(147,51,234,0.2)] flex flex-col my-auto"
        style={{
          background: "linear-gradient(180deg, #150d1e 0%, #0d0815 100%)",
        }}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-600/15 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-full border border-purple-500/30">
                  Dedicated Partner Event
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  · Locked Location
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                Host Brand / Venue Event
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/25 border border-white/20 hover:border-rose-500/40 flex items-center gap-1.5 text-white transition-all cursor-pointer shadow-md group shrink-0"
          >
            <X
              className="w-4 h-4 text-white group-hover:text-rose-400 shrink-0"
              strokeWidth={2.5}
              style={{ color: "#FFFFFF" }}
            />
            <span className="text-xs font-bold text-white group-hover:text-rose-300">
              Close
            </span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-3.5 sm:p-6 space-y-4 sm:space-y-5 max-h-[calc(96vh-85px)] overflow-y-auto custom-scrollbar"
        >
          {/* Status & Verification Indicator (Admin Controlled) */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                  Verification Status (Admin Controlled)
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-white">
                  ● Pending Admin Review
                </span>
              </div>
            </div>
            <div className="text-[11px] text-zinc-400 font-medium">
              Status is verified &amp; activated by Admin ops only
            </div>
          </div>

          {/* Venue & Location with Google Maps Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div ref={locationWrapperRef} className="relative space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-400" />
                  <span>Venue / Hotspot *</span>
                </label>
                {selectedPlace && (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <Check className="w-2.5 h-2.5" />
                    <span>Map Pin Linked</span>
                  </span>
                )}
              </div>

              <div className="relative">
                <MapPin className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="Type venue name or search hotspots..."
                  value={venueName}
                  onChange={(e) => {
                    setVenueName(e.target.value);
                    setSelectedPlace(null);
                    setIsLocationDropdownOpen(true);
                  }}
                  onFocus={() => setIsLocationDropdownOpen(true)}
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  autoComplete="off"
                />
                {venueName && (
                  <button
                    type="button"
                    onClick={() => {
                      setVenueName("");
                      setGoogleMapsUrl("");
                      setSelectedPlace(null);
                      setIsLocationDropdownOpen(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {isLocationDropdownOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#150d1e] border border-white/15 rounded-xl shadow-2xl max-h-52 overflow-y-auto divide-y divide-white/5 backdrop-blur-xl">
                  {venueName.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={handleCustomLocationChoose}
                      className="w-full px-3.5 py-2 text-left bg-purple-500/10 hover:bg-purple-500/20 flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Navigation className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="font-bold text-white truncate">Use &ldquo;{venueName.trim()}&rdquo;</span>
                      </div>
                      <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded shrink-0">
                        Auto Pin 📍
                      </span>
                    </button>
                  )}

                  {locationSuggestions.map((place) => (
                    <button
                      type="button"
                      key={place.id}
                      onClick={() => handleSelectPlace(place)}
                      className="w-full px-3.5 py-2 text-left hover:bg-white/10 flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="truncate">
                        <div className="font-bold text-white truncate">{place.name}</div>
                        <div className="text-[10px] text-zinc-400 truncate">{place.area ? `${place.area}, ${place.city}` : place.city}</div>
                      </div>
                      <span className="text-[10px] text-purple-400 shrink-0 ml-2">📍 Pin</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Full Address / Area
                </label>
                {googleMapsUrl && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-purple-300 hover:underline flex items-center gap-1"
                  >
                    <span>View Map</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              <input
                type="text"
                placeholder="e.g. Plot 12-C, Khayaban-e-Seher, Phase 6, DHA"
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Event Visibility: Members Only vs Open Event */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              1. Event Access & Visibility
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility("members_only")}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  visibility === "members_only"
                    ? "bg-purple-600/20 border-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                    : "bg-white/[0.02] border-white/10 text-zinc-400 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Lock
                    className={`w-4 h-4 ${
                      visibility === "members_only"
                        ? "text-purple-300"
                        : "text-zinc-400"
                    }`}
                  />
                  <span className="text-xs font-bold text-white">
                    Members Only Event
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 leading-tight">
                  Exclusive to vetted Solo-No-More members looking for high-trust plans.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVisibility("public")}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  visibility === "public"
                    ? "bg-cyan-500/20 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    : "bg-white/[0.02] border-white/10 text-zinc-400 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Globe
                    className={`w-4 h-4 ${
                      visibility === "public"
                        ? "text-cyan-300"
                        : "text-zinc-400"
                    }`}
                  />
                  <span className="text-xs font-bold text-white">Open Event</span>
                </div>
                <span className="text-[11px] text-zinc-400 leading-tight">
                  Open community event featured on the public discovery calendar.
                </span>
              </button>
            </div>
          </div>

          {/* Event Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Event Title
            </label>
            <input
              type="text"
              required
              maxLength={90}
              placeholder="e.g. Acoustic Live Jam & Squad Dinner, Padel Social Mixer..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Event Date, Start Time & End Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>Event Date</span>
              </label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>Start Time</span>
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>End Time</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Event Description & Ambiance
            </label>
            <textarea
              rows={3}
              maxLength={400}
              placeholder="What to expect, vibes, seating, parking, or special tasting inclusions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* SECTION 1: TIER SELECTION & TICKET PACKAGES                      */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-purple-400" />
                  <span>Ticket Tiers & Guest Packages</span>
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Configure admission tiers (e.g. Early Bird, VIP Squad Table, General Entry).
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddTier}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-purple-300" />
                <span>+ Add Tier</span>
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              {tierPackages.map((tier, idx) => (
                <div
                  key={tier.id || idx}
                  className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5 hover:border-purple-500/30 transition-all"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                    {/* Tier Name */}
                    <div className="sm:col-span-5 space-y-1">
                      <label className="text-[10px] uppercase font-bold text-zinc-400">
                        Tier Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. General Admission, VIP Squad Table"
                        value={tier.name}
                        onChange={(e) =>
                          handleUpdateTier(idx, "name", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* Price in PKR */}
                    <div className="sm:col-span-3 space-y-1">
                      <label className="text-[10px] uppercase font-bold text-zinc-400">
                        Price (PKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        placeholder="0 = Free"
                        value={tier.price}
                        onChange={(e) =>
                          handleUpdateTier(
                            idx,
                            "price",
                            Math.max(Number(e.target.value) || 0, 0)
                          )
                        }
                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* Spots */}
                    <div className="sm:col-span-3 space-y-1">
                      <label className="text-[10px] uppercase font-bold text-zinc-400">
                        Capacity Spots
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="50"
                        value={tier.spots || ""}
                        onChange={(e) =>
                          handleUpdateTier(
                            idx,
                            "spots",
                            Math.max(Number(e.target.value) || 0, 1)
                          )
                        }
                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* Delete Tier Button */}
                    <div className="sm:col-span-1 flex items-end justify-center pt-3 sm:pt-4">
                      <button
                        type="button"
                        onClick={() => handleRemoveTier(idx)}
                        disabled={tierPackages.length <= 1}
                        title={
                          tierPackages.length <= 1
                            ? "Minimum 1 tier required"
                            : "Remove Tier"
                        }
                        className={`p-2 rounded-lg transition-all ${
                          tierPackages.length <= 1
                            ? "text-zinc-600 cursor-not-allowed"
                            : "text-rose-400 hover:bg-rose-500/20 hover:text-rose-300"
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Optional Perks Line */}
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Included Perks (e.g. 1 Welcome drink, front row seating, confirmed table)"
                      value={tier.perks || ""}
                      onChange={(e) =>
                        handleUpdateTier(idx, "perks", e.target.value)
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-black/20 border border-white/5 text-[11px] text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* SECTION 2: ORGANIZATION & HOST BRAND IDENTITY (REMOVABLE)        */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {includeOrganizer ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-purple-400" />
                    <span>Host Organization & Brand Identity</span>
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Brand identity presented to members on the event flyer and digital ticket passes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludeOrganizer(false)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all flex items-center gap-1 cursor-pointer"
                  title="Remove organizer branding from this event"
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  <span>Remove Organizer</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-1">
                {/* Organizer Logo / Photo */}
                <div className="sm:col-span-3 flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                    {organizerAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={organizerAvatarUrl}
                        alt={organizerName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-zinc-500" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleOrganizerPhotoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      title="Upload host logo or photo"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] uppercase font-bold text-purple-300 block">
                      Host Logo
                    </label>
                    <label className="text-[10px] text-zinc-400 hover:text-white cursor-pointer underline block">
                      Change Logo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleOrganizerPhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Organization Name */}
                <div className="sm:col-span-4 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">
                    Organizer / Host Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arena Padel Club"
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Tagline */}
                <div className="sm:col-span-5 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">
                    Brand Tagline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Redefining sports & social culture 🎾"
                    value={organizerTagline}
                    onChange={(e) => setOrganizerTagline(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-dashed border-white/20 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white block">
                  Organizer Branding Omitted
                </span>
                <span className="text-[11px] text-zinc-400">
                  This event will be published without separate organizer information.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIncludeOrganizer(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-purple-300" />
                <span>+ Add Organizer</span>
              </button>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* SECTION 3: PERFORMER & ARTIST LINEUP SELECTION                  */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-purple-400" />
                  <span>Artists, DJs & Performer Lineup</span>
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Add featured DJs, acoustic musicians, or tournament hosts for this event.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddPerformer}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-purple-300" />
                <span>+ Add Performer</span>
              </button>
            </div>

            {lineups.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-zinc-500">
                No performers added yet. Click{" "}
                <span className="text-purple-300 font-semibold">
                  &ldquo;+ Add Performer&rdquo;
                </span>{" "}
                to showcase artists, guest speakers, or DJs.
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                {lineups.map((perf, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 hover:border-purple-500/30 transition-all"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      {/* Performer Name */}
                      <div className="sm:col-span-4 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-zinc-400">
                          Artist / Host Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. DJ Neon Vibe"
                          value={perf.name}
                          onChange={(e) =>
                            handleUpdatePerformer(idx, "name", e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* Role / Genre */}
                      <div className="sm:col-span-4 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-zinc-400">
                          Role / Genre
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Melodic Techno / Resident DJ"
                          value={perf.role}
                          onChange={(e) =>
                            handleUpdatePerformer(idx, "role", e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* Set Time */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-zinc-400">
                          Set Time Slot
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 10:00 PM – 12:00 AM"
                          value={perf.time}
                          onChange={(e) =>
                            handleUpdatePerformer(idx, "time", e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* Delete Performer Button */}
                      <div className="sm:col-span-1 flex items-end justify-center pt-3 sm:pt-4">
                        <button
                          type="button"
                          onClick={() => handleRemovePerformer(idx)}
                          className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Banner Image Upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>Event Feature Banner</span>
              <span className="text-[10px] text-purple-400">
                Auto-compressed WebP
              </span>
            </label>
            <div className="relative border-2 border-dashed border-white/15 hover:border-purple-500/50 rounded-2xl p-4 text-center transition-all bg-white/[0.02]">
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {featureImage ? (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featureImage}
                    alt="Event Banner"
                    className="max-h-36 mx-auto rounded-xl object-cover border border-white/10 shadow-lg"
                  />
                  <span className="text-[11px] text-purple-300 font-semibold block">
                    ✓ Image optimized. Click or drag to replace.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                  <Upload className="w-5 h-5 text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-300">
                    Click or drag high-res event flyer or venue photo
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    PNG, JPG, or WEBP up to 10MB
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Event submitted successfully! Digital passes are now live.
              </span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full py-3.5 px-5 rounded-2xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:brightness-110 shadow-[0_0_25px_rgba(147,51,234,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Publishing Event...</span>
              ) : success ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Event Live on Calendar!</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>Publish Partner Event</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
