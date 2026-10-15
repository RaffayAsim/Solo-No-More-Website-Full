"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  Clock,
  MapPin,
  Image as ImageIcon,
  Users,
  Eye,
  Ticket,
  AlertCircle,
  CheckCircle2,
  Building2,
  Music,
  Info,
  Layers,
  Navigation,
  Check,
  ExternalLink,
} from "lucide-react";
import {
  IconX,
  IconPlus,
  IconTrash,
  IconSparkles,
  IconUpload,
  IconImage,
  IconCamera,
} from "@/components/icons/AppIcons";
import {
  EventRichMetadata,
  EventTierPackage,
  EventOrganizerInfo,
  EventPerformerLineup,
  parseEventDescription,
} from "@/lib/event-metadata";
import {
  searchLocalHotspots,
  fetchOnlinePlaces,
  type PlaceSuggestion,
} from "@/lib/locationPlaces";
import { saveRichEventAction, SaveRichEventInput } from "@/app/actions/events";
import type { OfficialEvent } from "@/lib/supabase/types";

// Client-side HTML5 Canvas Image Auto-Compressor
function compressImage(file: File, maxWidth = 1920, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        try {
          const dataUrl = canvas.toDataURL("image/webp", quality);
          resolve(dataUrl);
        } catch {
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

interface EventCreateEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: OfficialEvent | null;
  onSuccess: () => void;
  workspaceTitle?: string;
  isPartnerOrArtist?: boolean;
}

export default function EventCreateEditModal({
  isOpen,
  onClose,
  eventToEdit,
  onSuccess,
  workspaceTitle = "Admin workspace",
  isPartnerOrArtist = false,
}: EventCreateEditModalProps) {
  // Client portal mounted state
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Form fields
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"published" | "draft" | "pending_review">(
    isPartnerOrArtist ? "pending_review" : "published"
  );
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("20:00");
  const [endTime, setEndTime] = useState("23:30");
  const [venueName, setVenueName] = useState("");
  const [fullAddress, setFullAddress] = useState("");

  // Google Maps Hotspot Autocomplete State
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<PlaceSuggestion[]>(() =>
    searchLocalHotspots("", "Karachi")
  );
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const locationWrapperRef = React.useRef<HTMLDivElement>(null);

  // Tier Packages
  const [tierPackages, setTierPackages] = useState<EventTierPackage[]>([
    { id: "tier-1", name: "General Admission", price: 2500, spots: 100 },
  ]);

  // Partner collaboration
  const [partnerCollaboration, setPartnerCollaboration] = useState("No partner");

  // Media
  const [featureImage, setFeatureImage] = useState("");
  const [sliderImages, setSliderImages] = useState<string[]>([]);

  // Capacity & Labels
  const [attendingLabel, setAttendingLabel] = useState("253 people attending");
  const [capacityLimit, setCapacityLimit] = useState(100);

  // Visibility & Audience
  const [visibility, setVisibility] = useState<"members_only" | "public" | "invite_only">("members_only");
  const [eventCategory, setEventCategory] = useState<"open_event" | "community_event">("community_event");
  const [audience, setAudience] = useState<"all" | "females_only" | "couples" | "vip_members">("all");
  const [publishDate, setPublishDate] = useState("");

  // Organizer info & toggle
  const [includeOrganizer, setIncludeOrganizer] = useState(true);
  const [organizerName, setOrganizerName] = useState("BnC Offline");
  const [organizerTagline, setOrganizerTagline] = useState("Redefining music culture in social spaces 🎧");
  const [organizerAvatarUrl, setOrganizerAvatarUrl] = useState("https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80");

  // Important Info
  const [importantInfo, setImportantInfo] = useState<string[]>([
    "Physical CNIC required for age verification at venue entrance",
    "Strictly 18+ event — zero tolerance vibe enforcement",
    "Dress code: Smart Casual & Chic",
  ]);

  // Lineups
  const [lineups, setLineups] = useState<EventPerformerLineup[]>([
    { name: "DJ Neon Vibe", role: "Deep House / Melodic Techno", time: "10:00 PM - 12:00 AM" },
  ]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Banner & Organizer File Upload State & Refs (Declared unconditionally at top of component)
  const bannerFileRef = React.useRef<HTMLInputElement>(null);
  const organizerFileRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingOrganizer, setIsUploadingOrganizer] = useState(false);

  // Live autocomplete places effect
  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      const localMatches = searchLocalHotspots(venueName, "Karachi");
      if (!isCancelled) {
        setLocationSuggestions(localMatches);
      }

      if (venueName.trim().length >= 2) {
        setIsSearchingOnline(true);
        try {
          const online = await fetchOnlinePlaces(venueName, "Karachi");
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
  }, [venueName]);

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
    const q = encodeURIComponent(`${venueName.trim()}, Karachi`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${q}`;
    setGoogleMapsUrl(mapsUrl);
    setSelectedPlace({
      id: "custom",
      name: venueName.trim(),
      area: "Karachi",
      city: "Karachi",
      mapsUrl,
    });
    if (!fullAddress.trim()) {
      setFullAddress(`${venueName.trim()}, Karachi`);
    }
    setIsLocationDropdownOpen(false);
  };

  // Populate data when editing an event
  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title || "");
      setVenueName(eventToEdit.venue_name || "");
      setCapacityLimit(eventToEdit.max_capacity || 100);

      // Extract date and start time
      if (eventToEdit.scheduled_at) {
        const d = new Date(eventToEdit.scheduled_at);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const min = String(d.getMinutes()).padStart(2, "0");
        setEventDate(`${yyyy}-${mm}-${dd}`);
        setStartTime(`${hh}:${min}`);
      }

      // Parse rich metadata from description
      const { cleanDescription, metadata } = parseEventDescription(eventToEdit.description);
      setDescription(cleanDescription);
      setStatus(isPartnerOrArtist ? "pending_review" : metadata.status || "published");
      setFullAddress(metadata.full_address || "");
      setEndTime(metadata.end_time || "23:30");
      setTierPackages(
        metadata.tier_packages && metadata.tier_packages.length > 0
          ? metadata.tier_packages
          : [{ id: "tier-1", name: "General Admission", price: Number(eventToEdit.price) || 2500, spots: eventToEdit.max_capacity }]
      );
      setPartnerCollaboration(metadata.partner_name || "No partner");
      setFeatureImage(metadata.feature_image || "");
      setSliderImages(metadata.slider_images || []);
      setAttendingLabel(metadata.attending_label || "253 people attending");
      setVisibility(metadata.visibility || "members_only");
      setEventCategory(metadata.event_category || (metadata.visibility === "public" ? "open_event" : "community_event"));
      setAudience(metadata.audience || "all");
      setPublishDate(metadata.publish_date || "");
      if (metadata.organizer && metadata.organizer.name?.trim()) {
        setIncludeOrganizer(true);
        setOrganizerName(metadata.organizer.name);
        setOrganizerTagline(metadata.organizer.tagline || "");
        setOrganizerAvatarUrl(metadata.organizer.avatarUrl || "");
      } else {
        setIncludeOrganizer(false);
        setOrganizerName("");
        setOrganizerTagline("");
        setOrganizerAvatarUrl("");
      }
      if (metadata.important_info && metadata.important_info.length > 0) {
        setImportantInfo(metadata.important_info);
      }
      if (metadata.lineups && metadata.lineups.length > 0) {
        setLineups(metadata.lineups);
      }
    } else {
      // Defaults for brand new event
      setTitle("");
      setDescription("");
      setStatus(isPartnerOrArtist ? "pending_review" : "published");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const dd = String(tomorrow.getDate()).padStart(2, "0");
      setEventDate(`${yyyy}-${mm}-${dd}`);
      setStartTime("20:00");
      setEndTime("23:30");
      setVenueName("");
      setFullAddress("");
      setGoogleMapsUrl("");
      setSelectedPlace(null);
      setTierPackages([{ id: `tier-${Date.now()}`, name: "General Admission", price: 2500, spots: 100 }]);
      setPartnerCollaboration("No partner");
      setFeatureImage("");
      setSliderImages([]);
      setAttendingLabel("253 people attending");
      setCapacityLimit(100);
      setVisibility("members_only");
      setEventCategory("community_event");
      setAudience("all");
      setPublishDate("");
      setIncludeOrganizer(true);
      setOrganizerName("BnC Offline");
      setOrganizerTagline("Redefining music culture in social spaces 🎧");
      setOrganizerAvatarUrl("https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80");
      setImportantInfo([
        "Physical CNIC required for age verification at venue entrance",
        "Strictly 18+ event — zero tolerance vibe enforcement",
        "Dress code: Smart Casual & Chic",
      ]);
      setLineups([{ name: "DJ Neon Vibe", role: "Deep House / Melodic Techno", time: "10:00 PM - 12:00 AM" }]);
    }
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [eventToEdit, isOpen, isPartnerOrArtist]);

  // Character and Word Counter
  const charCount = description.length;
  const wordCount = description.trim() === "" ? 0 : description.trim().split(/\s+/).length;

  // Tier package handlers
  const handleAddTier = () => {
    setTierPackages((prev) => [
      ...prev,
      { id: `tier-${Date.now()}`, name: "VIP Lounge Pass", price: 5000, spots: 30 },
    ]);
  };

  const handleUpdateTier = (index: number, field: keyof EventTierPackage, value: any) => {
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

  // Slider image handlers
  const handleAddSliderImage = () => {
    setSliderImages((prev) => [...prev, ""]);
  };

  const handleUpdateSliderImage = (index: number, url: string) => {
    setSliderImages((prev) => {
      const updated = [...prev];
      updated[index] = url;
      return updated;
    });
  };

  const handleRemoveSliderImage = (index: number) => {
    setSliderImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Important Info handlers
  const handleAddImportantInfo = () => {
    setImportantInfo((prev) => [...prev, ""]);
  };

  const handleUpdateImportantInfo = (index: number, text: string) => {
    setImportantInfo((prev) => {
      const updated = [...prev];
      updated[index] = text;
      return updated;
    });
  };

  const handleRemoveImportantInfo = (index: number) => {
    setImportantInfo((prev) => prev.filter((_, i) => i !== index));
  };

  // Banner, Organizer & Performer File Upload Handlers
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingBanner(true);
      setErrorMsg(null);
      const compressed = await compressImage(file, 1920, 0.82);
      setFeatureImage(compressed);
    } catch {
      setErrorMsg("Failed to process banner image. Please select another image.");
    } finally {
      setIsUploadingBanner(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleOrganizerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingOrganizer(true);
      setErrorMsg(null);
      const compressed = await compressImage(file, 600, 0.85);
      setOrganizerAvatarUrl(compressed);
    } catch {
      setErrorMsg("Failed to process organizer photo.");
    } finally {
      setIsUploadingOrganizer(false);
      if (e.target) e.target.value = "";
    }
  };

  const handlePerformerUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 500, 0.85);
      setLineups((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], imageUrl: compressed };
        return copy;
      });
    } catch {
      setErrorMsg("Failed to process performer photo.");
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  // Lineup handlers
  const handleAddPerformer = () => {
    setLineups((prev) => [
      ...prev,
      { name: "", role: "Live DJ / Vocalist", time: "11:00 PM - 01:00 AM", imageUrl: "" },
    ]);
  };

  const handleUpdatePerformer = (index: number, field: keyof EventPerformerLineup, val: string) => {
    setLineups((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleRemovePerformer = (index: number) => {
    setLineups((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload: SaveRichEventInput = {
      id: eventToEdit?.id,
      title,
      status,
      description,
      eventDate,
      startTime,
      endTime,
      venueName: venueName || "Karachi Venue",
      fullAddress,
      tierPackages,
      partnerCollaboration,
      featureImage,
      sliderImages: sliderImages.filter((img) => img.trim() !== ""),
      attendingLabel,
      capacityLimit,
      visibility,
      eventCategory,
      audience,
      publishDate,
      organizer:
        includeOrganizer && organizerName.trim()
          ? {
              name: organizerName.trim(),
              tagline: organizerTagline.trim(),
              avatarUrl: organizerAvatarUrl,
            }
          : null,
      importantInfo: importantInfo.filter((item) => item.trim() !== ""),
      lineups: lineups.filter((l) => l.name.trim() !== ""),
      creatorType: isPartnerOrArtist ? "artist" : "admin",
    };

    try {
      const res = await saveRichEventAction(payload);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to save event");
      } else {
        if (res.isPendingVerification) {
          setSuccessMsg("✓ Event submitted to Admin Ops for review! Once verified, it will go live on the official board.");
        } else {
          setSuccessMsg(eventToEdit ? "✓ Event updated and published live!" : "✓ Official Event created and published live!");
        }
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred while saving event.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/90 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-4xl max-h-[96vh] rounded-2xl sm:rounded-3xl border border-[#FF6F26]/35 flex flex-col shadow-[0_24px_80px_rgba(0,0,0,0.95)] overflow-hidden relative"
        style={{
          background: "linear-gradient(180deg, #160E1D 0%, #0A0610 100%)",
        }}
      >
        {/* ── 1. MODAL HEADER ────────────────────────────────────────────── */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#FF8A3D",
                  background: "rgba(255, 111, 38, 0.15)",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255, 111, 38, 0.3)",
                }}
              >
                {workspaceTitle}
              </span>
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 900, color: "#FFFFFF", margin: 0, letterSpacing: "-0.02em" }}>
              {eventToEdit ? "Edit Event" : "Add Event"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              borderRadius: "10px",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            className="hover:bg-white/20 hover:border-white/40"
          >
            <IconX size={18} color="#FFFFFF" />
          </button>
        </div>

        {/* ── 2. SCROLLABLE FORM BODY ────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="p-3.5 sm:p-6 overflow-y-auto flex flex-col gap-4 sm:gap-5 custom-tabs-scrollbar"
        >
          {errorMsg && (
            <div
              style={{
                background: "rgba(255, 59, 48, 0.15)",
                border: "1px solid rgba(255, 59, 48, 0.4)",
                color: "#FF3B30",
                padding: "12px 16px",
                borderRadius: "12px",
                fontSize: "12.5px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                background: "rgba(39, 201, 63, 0.15)",
                border: "1px solid rgba(39, 201, 63, 0.4)",
                color: "#27C93F",
                padding: "12px 16px",
                borderRadius: "12px",
                fontSize: "12.5px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section: Title & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3 sm:gap-3.5">
            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.75)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                Title *
              </label>
              <input
                type="text"
                required
                placeholder="Event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "12px",
                  color: "#FFFFFF",
                  fontSize: "13.5px",
                  outline: "none",
                }}
                className="focus:border-[#FF6F26]"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.75)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                Verification Status
              </label>
              {isPartnerOrArtist ? (
                <div
                  style={{
                    padding: "9px 12px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: 700, color: "#FFFFFF" }}>
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: status === "published" ? "#27C93F" : status === "draft" ? "#8E8E93" : "#FFB300",
                          boxShadow: status === "published" ? "0 0 8px #27C93F" : status === "pending_review" ? "0 0 6px #FFB300" : "none",
                        }}
                      />
                      {status === "published" ? "Live on Radar" : status === "draft" ? "Draft Saved" : "Pending Admin Review"}
                    </span>
                    <span style={{ fontSize: "9.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase" }}>
                      Admin Only
                    </span>
                  </div>
                  <span style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.45)" }}>
                    {status === "published" ? "Approved by Admin Ops" : "Admin approval required"}
                  </span>
                </div>
              ) : (
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#1E1428",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "12px",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    outline: "none",
                  }}
                >
                  <option value="published">Publish (Live)</option>
                  <option value="draft">Draft</option>
                  <option value="pending_review">Pending Verification</option>
                </select>
              )}
            </div>
          </div>

          {/* Section: Description with Chars & Words counter */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <label style={{ fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.75)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Description
              </label>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255, 255, 255, 0.5)" }}>
                Chars: {charCount} • Words: {wordCount}
              </span>
            </div>
            <textarea
              rows={4}
              placeholder="Event description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "12px",
                color: "#FFFFFF",
                fontSize: "13px",
                outline: "none",
                lineHeight: 1.5,
              }}
              className="focus:border-[#FF6F26]"
            />
          </div>

          {/* Section: Event Date, Start Time, End Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5">
            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.75)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                Event Date *
              </label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "#1E1428",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "12px",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.75)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "#1E1428",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "12px",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.75)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "#1E1428",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "12px",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Section: Venue Name & Full Address with Google Maps Autocomplete */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
            {/* Venue Name with Dropdown */}
            <div ref={locationWrapperRef} style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.75)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <MapPin className="w-3.5 h-3.5 text-[#FF6F26]" />
                  <span>Event Venue / Hotspot *</span>
                </label>
                {selectedPlace && (
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "#27C93F", display: "flex", alignItems: "center", gap: "4px", background: "rgba(39, 201, 63, 0.12)", padding: "2px 7px", borderRadius: "6px", border: "1px solid rgba(39, 201, 63, 0.25)" }}>
                    <Check className="w-3 h-3" />
                    <span>Map Pin Linked</span>
                  </span>
                )}
              </div>

              <div style={{ position: "relative" }}>
                <MapPin className="w-4 h-4 text-[#FF6F26] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Type venue or search hotspots (e.g. Espresso, District 19...)"
                  value={venueName}
                  onChange={(e) => {
                    setVenueName(e.target.value);
                    setSelectedPlace(null);
                    setIsLocationDropdownOpen(true);
                  }}
                  onFocus={() => setIsLocationDropdownOpen(true)}
                  style={{
                    width: "100%",
                    padding: "10px 14px 10px 34px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "12px",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    outline: "none",
                  }}
                  className="focus:border-[#FF6F26]"
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
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "rgba(255, 255, 255, 0.4)",
                      cursor: "pointer",
                      padding: "2px",
                    }}
                  >
                    <IconX size={14} color="#8E8E93" />
                  </button>
                )}
              </div>

              {/* Google Maps Dropdown Suggestions */}
              {isLocationDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 9999,
                    marginTop: "6px",
                    background: "#140e1b",
                    border: "1px solid rgba(255, 255, 255, 0.16)",
                    borderRadius: "14px",
                    boxShadow: "0 14px 35px rgba(0,0,0,0.85)",
                    maxHeight: "220px",
                    overflowY: "auto",
                    backdropFilter: "blur(16px)",
                  }}
                >
                  {/* Custom typed option */}
                  {venueName.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={handleCustomLocationChoose}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        textAlign: "left",
                        background: "rgba(255, 111, 38, 0.1)",
                        border: "none",
                        borderBottom: "1px solid rgba(255, 111, 38, 0.2)",
                        color: "#FFFFFF",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                        <Navigation className="w-3.5 h-3.5 text-[#FF6F26] shrink-0" />
                        <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          Use &ldquo;{venueName.trim()}&rdquo;
                        </span>
                      </div>
                      <span style={{ fontSize: "10px", color: "#FFA05C", background: "rgba(255, 111, 38, 0.2)", padding: "2px 6px", borderRadius: "5px", flexShrink: 0 }}>
                        Auto Pin 📍
                      </span>
                    </button>
                  )}

                  {/* Suggestion list */}
                  {locationSuggestions.length > 0 ? (
                    locationSuggestions.map((place) => (
                      <button
                        type="button"
                        key={place.id}
                        onClick={() => handleSelectPlace(place)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          textAlign: "left",
                          background: "transparent",
                          border: "none",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                          color: "#FFFFFF",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: "12px",
                          transition: "background 0.15s ease",
                        }}
                        className="hover:bg-white/10"
                      >
                        <div style={{ overflow: "hidden" }}>
                          <div style={{ fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {place.name}
                          </div>
                          <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.5)" }}>
                            {place.area ? `${place.area}, ${place.city}` : place.city}
                          </div>
                        </div>
                        <span style={{ fontSize: "9.5px", color: "#FF8A3D", flexShrink: 0, marginLeft: "8px" }}>
                          📍 Pin
                        </span>
                      </button>
                    ))
                  ) : (
                    <div style={{ padding: "12px", textAlign: "center", fontSize: "11px", color: "rgba(255, 255, 255, 0.4)" }}>
                      {isSearchingOnline ? "Searching Google Places..." : "No local hotspots found. Click Auto Pin above."}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Full Address Input with Map Link */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.75)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Full Address / Directions
                </label>
                {googleMapsUrl && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "10px", color: "#FF8A3D", display: "inline-flex", alignItems: "center", gap: "3px", textDecoration: "none" }}
                    className="hover:underline"
                  >
                    <span>View on Maps</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              <input
                type="text"
                placeholder="e.g., Street 12, Block 4, Clifton, Karachi"
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "12px",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  outline: "none",
                }}
                className="focus:border-[#FF6F26]"
              />
            </div>
          </div>

          {/* Section: Tier Packages */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#FFFFFF" }}>Tier Packages</span>
                <p style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.55)", margin: "2px 0 0" }}>
                  Configure ticket pricing levels (General, VIP Lounge, Early Bird)
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddTier}
                style={{
                  background: "rgba(255, 111, 38, 0.15)",
                  border: "1px solid rgba(255, 111, 38, 0.35)",
                  color: "#FF8A3D",
                  padding: "6px 14px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <IconPlus size={14} color="#FF8A3D" />
                <span>Add Tier</span>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {tierPackages.map((tier, idx) => (
                <div
                  key={tier.id || idx}
                  className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_36px] gap-2.5 items-center p-3 rounded-xl border border-white/10 bg-white/[0.03]"
                >
                  <input
                    type="text"
                    placeholder="Tier Name (e.g. General Admission)"
                    value={tier.name}
                    onChange={(e) => handleUpdateTier(idx, "name", e.target.value)}
                    style={{
                      padding: "8px 12px",
                      background: "rgba(0, 0, 0, 0.3)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "8px",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Price (PKR)"
                    value={tier.price}
                    onChange={(e) => handleUpdateTier(idx, "price", Number(e.target.value))}
                    style={{
                      padding: "8px 12px",
                      background: "rgba(0, 0, 0, 0.3)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "8px",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Capacity Spots"
                    value={tier.spots || ""}
                    onChange={(e) => handleUpdateTier(idx, "spots", Number(e.target.value))}
                    style={{
                      padding: "8px 12px",
                      background: "rgba(0, 0, 0, 0.3)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "8px",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTier(idx)}
                    disabled={tierPackages.length <= 1}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: tierPackages.length <= 1 ? "rgba(255, 255, 255, 0.2)" : "#FF3B30",
                      cursor: tierPackages.length <= 1 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconTrash size={16} color={tierPackages.length <= 1 ? "rgba(255, 255, 255, 0.2)" : "#FF3B30"} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Partner Collaboration */}
          <div>
            <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.75)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
              Partner Collaboration (optional)
            </label>
            <input
              type="text"
              placeholder="No partner (or type partner name)"
              value={partnerCollaboration}
              onChange={(e) => setPartnerCollaboration(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "12px",
                color: "#FFFFFF",
                fontSize: "13px",
                outline: "none",
              }}
              className="focus:border-[#FF6F26]"
            />
          </div>

          {/* Section: Event Banner Upload Card (No URLs accepted) */}
          <div
            style={{
              background: "linear-gradient(180deg, rgba(255, 111, 38, 0.06) 0%, rgba(18, 10, 26, 0.6) 100%)",
              border: "1px solid rgba(255, 111, 38, 0.28)",
              borderRadius: "16px",
              padding: "20px",
            }}
          >
            {/* Header with Dimensions Guidelines */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <IconImage size={18} color="#FF8A3D" />
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF" }}>Event Banner</span>
                  <span style={{ fontSize: "10px", fontWeight: 800, background: "rgba(255, 111, 38, 0.2)", color: "#FF8A3D", border: "1px solid rgba(255, 111, 38, 0.4)", padding: "2px 7px", borderRadius: "6px" }}>
                    MAIN FLYER
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", margin: "4px 0 0" }}>
                  Featured at the top of the event listing, invite cards, and VIP ticket passes.
                </p>
              </div>

              {/* Dimensions Badges */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#FFFFFF", background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.15)", padding: "3px 8px", borderRadius: "6px" }}>
                  📐 Recommended: 1920 × 1080 px (16:9)
                </span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255, 255, 255, 0.7)", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "3px 8px", borderRadius: "6px" }}>
                  JPG, PNG, WebP (Max 5MB)
                </span>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={bannerFileRef}
              accept="image/png, image/jpeg, image/webp"
              onChange={handleBannerUpload}
              style={{ display: "none" }}
            />

            {/* Banner Preview or Upload Dropzone */}
            {featureImage ? (
              <div
                style={{
                  position: "relative",
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid rgba(255, 111, 38, 0.4)",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
                  aspectRatio: "16 / 9",
                  maxHeight: "260px",
                  width: "100%",
                  background: "#08040C",
                }}
              >
                <img
                  src={featureImage}
                  alt="Event Banner Preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                {/* Overlay Action Bar */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 40%, rgba(0,0,0,0.85) 100%)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        color: "#FFFFFF",
                        background: "rgba(0, 0, 0, 0.65)",
                        backdropFilter: "blur(8px)",
                        padding: "4px 10px",
                        borderRadius: "8px",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                      }}
                    >
                      ✓ Banner Attached
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => bannerFileRef.current?.click()}
                        disabled={isUploadingBanner}
                        style={{
                          background: "rgba(255, 255, 255, 0.15)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(255, 255, 255, 0.3)",
                          borderRadius: "8px",
                          padding: "6px 12px",
                          color: "#FFFFFF",
                          fontSize: "11.5px",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                        className="hover:bg-white/30"
                      >
                        <IconUpload size={14} color="#FFFFFF" />
                        <span>Change Banner</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeatureImage("")}
                        title="Remove Banner"
                        style={{
                          background: "rgba(255, 59, 48, 0.25)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(255, 59, 48, 0.4)",
                          borderRadius: "8px",
                          padding: "6px 10px",
                          color: "#FF3B30",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconTrash size={14} color="#FF3B30" />
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.75)", fontWeight: 600 }}>
                    Optimal 16:9 Widescreen · Ready for mobile &amp; desktop flyers
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => bannerFileRef.current?.click()}
                style={{
                  border: "2px dashed rgba(255, 111, 38, 0.38)",
                  borderRadius: "14px",
                  background: "rgba(255, 111, 38, 0.02)",
                  padding: "36px 20px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                className="hover:border-[#FF6F26] hover:bg-[#FF6F26]/5"
              >
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "14px",
                    background: "rgba(255, 111, 38, 0.12)",
                    border: "1px solid rgba(255, 111, 38, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <IconUpload size={24} color="#FF8A3D" />
                </div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF", marginBottom: "4px" }}>
                  {isUploadingBanner ? "Processing banner..." : "Upload Event Banner"}
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.55)", marginBottom: "14px" }}>
                  Click to choose image file. Recommended 1920 × 1080 px (16:9 ratio) or 1200 × 675 px.
                </div>
                <button
                  type="button"
                  style={{
                    background: "linear-gradient(135deg, #FF6F26, #FF4400)",
                    border: "none",
                    color: "#FFFFFF",
                    padding: "8px 18px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 800,
                    pointerEvents: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 4px 14px rgba(255, 111, 38, 0.35)",
                  }}
                >
                  <IconUpload size={14} color="#FFFFFF" />
                  <span>Choose Banner File</span>
                </button>
              </div>
            )}
          </div>

          {/* Section: Attending Label & Capacity Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.75)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                Attending People Label
              </label>
              <input
                type="text"
                placeholder="253 people attending"
                value={attendingLabel}
                onChange={(e) => setAttendingLabel(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "12px",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  outline: "none",
                }}
                className="focus:border-[#FF6F26]"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.75)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                Capacity Limit
              </label>
              <input
                type="number"
                min={1}
                value={capacityLimit}
                onChange={(e) => setCapacityLimit(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "12px",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  outline: "none",
                }}
                className="focus:border-[#FF6F26]"
              />
            </div>
          </div>

          {/* Section: Access Model, Visibility, Audience, Publish Date */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "#FF8A3D", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                Event Model / Access
              </label>
              <select
                value={eventCategory}
                onChange={(e) => {
                  const val = e.target.value as "open_event" | "community_event";
                  setEventCategory(val);
                  if (val === "open_event") setVisibility("public");
                }}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "#1E1428",
                  border: "1px solid rgba(255, 111, 38, 0.4)",
                  borderRadius: "12px",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: 700,
                  outline: "none",
                }}
              >
                <option value="community_event">Community Based (Paid Members Only)</option>
                <option value="open_event">Open Event (Explorers &amp; Guests Allowed)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.75)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                Event Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "#1E1428",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "12px",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  outline: "none",
                }}
              >
                <option value="members_only">Members Only</option>
                <option value="public">Public</option>
                <option value="invite_only">Invite Only</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.75)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                Audience
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as any)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "#1E1428",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "12px",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  outline: "none",
                }}
              >
                <option value="all">All</option>
                <option value="females_only">Females Only</option>
                <option value="couples">Couples</option>
                <option value="vip_members">VIP Members</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255, 255, 255, 0.75)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                Publish Date (optional)
              </label>
              <input
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "#1E1428",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "12px",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Section: Organizer Information (Removable) */}
          {includeOrganizer ? (
            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "16px",
                padding: "18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
                <div>
                  <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#FFFFFF" }}>Organizer Information</span>
                  <p style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.55)", margin: "2px 0 0" }}>
                    Brand identity presented to members on the event flyer &amp; host profile
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#FFFFFF", background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.15)", padding: "3px 8px", borderRadius: "6px" }}>
                    📐 Logo: 400 × 400 px
                  </span>
                  <button
                    type="button"
                    onClick={() => setIncludeOrganizer(false)}
                    style={{
                      background: "rgba(255, 59, 48, 0.12)",
                      border: "1px solid rgba(255, 59, 48, 0.35)",
                      color: "#FF3B30",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      fontSize: "11.5px",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                    title="Remove organizer branding from this event"
                  >
                    <IconTrash size={13} color="#FF3B30" />
                    <span>Remove Organizer</span>
                  </button>
                </div>
              </div>

              {/* Hidden Organizer File Input */}
              <input
                type="file"
                ref={organizerFileRef}
                accept="image/png, image/jpeg, image/webp"
                onChange={handleOrganizerUpload}
                style={{ display: "none" }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_1.2fr] gap-3 sm:gap-3.5 items-center">
                {/* Organizer Logo/Photo Upload & Preview */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(255, 255, 255, 0.6)", marginBottom: "6px" }}>
                    Organizer Photo
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      onClick={() => organizerFileRef.current?.click()}
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "14px",
                        border: organizerAvatarUrl ? "1px solid rgba(255, 111, 38, 0.45)" : "1px dashed rgba(255, 255, 255, 0.25)",
                        background: "rgba(255, 255, 255, 0.04)",
                        overflow: "hidden",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        flexShrink: 0,
                      }}
                      title="Click to upload organizer photo"
                      className="hover:border-[#FF6F26]"
                    >
                      {organizerAvatarUrl ? (
                        <img src={organizerAvatarUrl} alt="Organizer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <IconCamera size={20} color="rgba(255, 255, 255, 0.5)" />
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <button
                        type="button"
                        onClick={() => organizerFileRef.current?.click()}
                        disabled={isUploadingOrganizer}
                        style={{
                          background: "rgba(255, 255, 255, 0.08)",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          borderRadius: "8px",
                          padding: "5px 10px",
                          color: "#FFFFFF",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                        className="hover:bg-white/15"
                      >
                        <IconUpload size={12} color="#FFFFFF" />
                        <span>{organizerAvatarUrl ? "Change Photo" : "Upload Photo"}</span>
                      </button>
                      {organizerAvatarUrl && (
                        <button
                          type="button"
                          onClick={() => setOrganizerAvatarUrl("")}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#FF3B30",
                            fontSize: "10.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                            textAlign: "left",
                            padding: "2px",
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Organizer Name */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(255, 255, 255, 0.6)", marginBottom: "6px" }}>
                    Organizer Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BnC Offline"
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "rgba(0, 0, 0, 0.3)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "10px",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                    }}
                  />
                </div>

                {/* Organizer Tagline */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(255, 255, 255, 0.6)", marginBottom: "6px" }}>
                    Organizer Tagline
                  </label>
                  <input
                    type="text"
                    placeholder="Redefining music culture in social spaces 🎧"
                    value={organizerTagline}
                    onChange={(e) => setOrganizerTagline(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "rgba(0, 0, 0, 0.3)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "10px",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px dashed rgba(255, 255, 255, 0.18)",
                borderRadius: "16px",
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#FFFFFF" }}>
                  Organizer Section Omitted
                </div>
                <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.5)", marginTop: "2px" }}>
                  This event will display without separate host organization branding.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIncludeOrganizer(true);
                  if (!organizerName) setOrganizerName("BnC Offline");
                }}
                style={{
                  background: "rgba(255, 111, 38, 0.15)",
                  border: "1px solid rgba(255, 111, 38, 0.35)",
                  color: "#FF8A3D",
                  padding: "6px 14px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <IconPlus size={14} color="#FF8A3D" />
                <span>+ Add Organizer</span>
              </button>
            </div>
          )}

          {/* Section: Important Information */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#FFFFFF" }}>Important Information</span>
                <p style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.55)", margin: "2px 0 0" }}>
                  Venue rules, security requirements &amp; door SOPs
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddImportantInfo}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#FFFFFF",
                  padding: "6px 12px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <IconPlus size={14} color="#FFFFFF" />
                <span>Add Item</span>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {importantInfo.map((info, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="text"
                    placeholder="e.g. Physical CNIC required at check-in"
                    value={info}
                    onChange={(e) => handleUpdateImportantInfo(idx, e.target.value)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      background: "rgba(0, 0, 0, 0.3)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "8px",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImportantInfo(idx)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#FF3B30",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconTrash size={16} color="#FF3B30" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Lineups */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
              <div>
                <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#FFFFFF" }}>Lineups</span>
                <p style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.55)", margin: "2px 0 0" }}>
                  Scheduled artists, live DJs and performers roster with optional artist photos
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#FFFFFF", background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.15)", padding: "3px 8px", borderRadius: "6px" }}>
                  📐 Artist Photo: 400 × 400 px
                </span>
                <button
                  type="button"
                  onClick={handleAddPerformer}
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#FFFFFF",
                    padding: "6px 12px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  className="hover:bg-white/15"
                >
                  <IconPlus size={14} color="#FFFFFF" />
                  <span>Add Performer</span>
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {lineups.map((perf, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-[auto_1.2fr_1.2fr_1fr_36px] gap-2.5 items-center p-2.5 rounded-xl border border-white/10 bg-black/30"
                >
                  {/* Performer Photo Upload Thumbnail */}
                  <div style={{ position: "relative" }}>
                    <input
                      type="file"
                      id={`lineup-photo-${idx}`}
                      accept="image/png, image/jpeg, image/webp"
                      onChange={(e) => handlePerformerUpload(idx, e)}
                      style={{ display: "none" }}
                    />
                    <label
                      htmlFor={`lineup-photo-${idx}`}
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "10px",
                        border: perf.imageUrl ? "1px solid rgba(255, 111, 38, 0.45)" : "1px dashed rgba(255, 255, 255, 0.25)",
                        background: "rgba(255, 255, 255, 0.05)",
                        overflow: "hidden",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: 0,
                      }}
                      title="Click to upload performer photo (400x400)"
                      className="hover:border-[#FF6F26]"
                    >
                      {perf.imageUrl ? (
                        <img src={perf.imageUrl} alt={perf.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <IconCamera size={16} color="rgba(255, 255, 255, 0.45)" />
                      )}
                    </label>
                  </div>

                  <input
                    type="text"
                    placeholder="Performer Name (e.g. DJ Vibe)"
                    value={perf.name}
                    onChange={(e) => handleUpdatePerformer(idx, "name", e.target.value)}
                    style={{
                      padding: "8px 12px",
                      background: "rgba(0, 0, 0, 0.3)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "8px",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Role / Genre (e.g. Techno)"
                    value={perf.role}
                    onChange={(e) => handleUpdatePerformer(idx, "role", e.target.value)}
                    style={{
                      padding: "8px 12px",
                      background: "rgba(0, 0, 0, 0.3)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "8px",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Time Slot (e.g. 10PM - 12AM)"
                    value={perf.time}
                    onChange={(e) => handleUpdatePerformer(idx, "time", e.target.value)}
                    style={{
                      padding: "8px 12px",
                      background: "rgba(0, 0, 0, 0.3)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "8px",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePerformer(idx)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#FF3B30",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title="Remove Performer"
                  >
                    <IconTrash size={16} color="#FF3B30" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── 3. FORM FOOTER ACTIONS ────────────────────────────────────── */}
          <div className="border-t border-white/10 pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: "10px 20px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 26px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #FF6F26 0%, #FF4400 100%)",
                border: "none",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                boxShadow: "0 4px 18px rgba(255, 111, 38, 0.45)",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <IconSparkles size={16} color="#FFFFFF" />
              <span>
                {loading
                  ? "Saving Event..."
                  : isPartnerOrArtist
                  ? "Submit Event for Verification"
                  : eventToEdit
                  ? "Update Event"
                  : "Create Event"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
