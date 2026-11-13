"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import OverlapFeatureCards from "./OverlapFeatureCards";
import BeaconSimulator from "./BeaconSimulator";
import SignUpDropdown from "./SignUpDropdown";
import { supabase } from "@/lib/supabase/client";
import EventQuickPreviewModal, { EventPreviewData } from "./events/EventQuickPreviewModal";
import type { PublicBeaconSummary, PublicEventSummary } from "@/app/actions/public-events";
import BeaconQuickPreviewModal, { BeaconPreviewData } from "./beacons/BeaconQuickPreviewModal";
import {
  Sparkles,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Camera,
  MessageSquare,
  Zap,
  Flame,
  Ticket,
  Clock,
  Compass,
  Crown,
  Smartphone,
  Radio,
  ChevronLeft,
  ChevronRight,
  Mail,
  Smile,
  Music,
  Utensils,
  QrCode,
  Play,
} from "lucide-react";

function InstagramIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

// ─── TRENDING TEMPLATES DATA (AUTHENTIC IMAGE 3 CLONE: CHAI, DRIVE, PADEL, CRICKET, ROOFTOP) ───

export interface TrendingTemplateItem {
  id: string;
  name: string;
  category: string;
  badge: string;
  headline: string;
  subtext: string;
  location: string;
  time: string;
  posterImg: string;
  cardCanvasBg: string;
  accent: string;
  posterBadge: string;
}

// Visual style per beacon category (cards are built from REAL beacons — no sample data).
const BEACON_CARD_STYLE: Record<string, { label: string; posterImg: string; cardCanvasBg: string; accent: string; posterBadge: string }> = {
  sports: {
    label: "Sports & Padel",
    posterImg: "/images/beacon-padel.jpg",
    cardCanvasBg: "radial-gradient(ellipse at 50% 50%, rgba(255, 90, 31, 0.28) 0%, rgba(7, 26, 18, 0.95) 75%), linear-gradient(135deg, #072218 0%, #03110C 100%)",
    accent: "#FF5A1F",
    posterBadge: "SPORTS",
  },
  casual: {
    label: "Chai & Casual",
    posterImg: "/images/beacon-chai.jpg",
    cardCanvasBg: "radial-gradient(ellipse at 50% 50%, rgba(255, 120, 40, 0.35) 0%, rgba(28, 14, 6, 0.95) 75%), linear-gradient(135deg, #241107 0%, #150904 100%)",
    accent: "#FF8A3D",
    posterBadge: "CHAI & CASUAL",
  },
  nightlife: {
    label: "Nightlife",
    posterImg: "/images/hero-rooftop.jpg",
    cardCanvasBg: "radial-gradient(ellipse at 50% 50%, rgba(255, 90, 31, 0.3) 0%, rgba(30, 10, 22, 0.95) 75%), linear-gradient(135deg, #270D1E 0%, #13050E 100%)",
    accent: "#FF5A1F",
    posterBadge: "NIGHTLIFE",
  },
};

function beaconToCard(b: PublicBeaconSummary): TrendingTemplateItem {
  const style = BEACON_CARD_STYLE[b.category] || BEACON_CARD_STYLE.casual;
  const when = b.scheduled_at
    ? new Date(b.scheduled_at).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Karachi" })
    : "Time TBD";
  const left = Math.max(0, b.total_slots - b.filled_slots);
  return {
    id: b.id,
    name: b.title,
    category: style.label,
    badge: left > 0 ? `${left} spot${left === 1 ? "" : "s"} left` : "Squad full",
    headline: b.title.toUpperCase(),
    subtext: `Hosted by ${b.host_first_name}${b.location_name ? " · " + b.location_name : ""}`,
    location: b.location_name || b.city,
    time: when,
    posterImg: b.image_url || style.posterImg,
    cardCanvasBg: style.cardCanvasBg,
    accent: style.accent,
    posterBadge: style.posterBadge,
  };
}

// ─── ANIMATED REVIEWS & PRESS DATA (PARTNERS & COMMUNITY MEMBERS) ────────────

// Mosaic layout for the 9 Review Wall tiles (same layout as before; content comes from the admin wall).
const WALL_TILE_LAYOUT: { span: string; fallbackImg: string }[] = [
  { span: "col-span-12 sm:col-span-6 lg:col-span-4 row-span-2", fallbackImg: "/images/beach-bonfire.jpg" },
  { span: "col-span-12 sm:col-span-6 lg:col-span-3 row-span-2", fallbackImg: "/images/padel-squad.jpg" },
  { span: "col-span-12 sm:col-span-12 lg:col-span-5 row-span-1", fallbackImg: "/images/acoustic-jam.jpg" },
  { span: "col-span-12 sm:col-span-6 lg:col-span-3 row-span-1", fallbackImg: "/images/chai-cafe.jpg" },
  { span: "col-span-12 sm:col-span-6 lg:col-span-2 row-span-1", fallbackImg: "/images/beacon-chai.jpg" },
  { span: "col-span-12 sm:col-span-6 lg:col-span-3 row-span-1", fallbackImg: "/images/beacon-padel.jpg" },
  { span: "col-span-6 sm:col-span-3 lg:col-span-2 row-span-1", fallbackImg: "/images/hero-rooftop.jpg" },
  { span: "col-span-6 sm:col-span-3 lg:col-span-2 row-span-1", fallbackImg: "/images/beacon-now-26.jpg" },
  { span: "col-span-12 sm:col-span-12 lg:col-span-5 row-span-1", fallbackImg: "/images/hero-image.jpg" },
];

// Feature grid — each item is a feature that exists in the product today.
const PRODUCT_FEATURES: { title: string; text: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { title: "Beacons in seconds", text: "Post a hangout with the spots you need, the budget split and an icebreaker question.", icon: Radio },
  { title: "You approve the squad", text: "See who wants to join and accept or decline — only approved members get the details.", icon: CheckCircle2 },
  { title: "Vetted members", text: "CNIC and Instagram checks before anyone can join a hangout or book a pass.", icon: ShieldCheck },
  { title: "Event passes", text: "Book a pass, pay by bank transfer and get a QR pass once payment is verified.", icon: Ticket },
  { title: "Door scanner", text: "Hosts scan QR or short codes at the door — duplicate and unpaid passes are refused.", icon: QrCode },
  { title: "Squad chat", text: "Coordinate timings and meeting points with your approved squad.", icon: MessageSquare },
  { title: "Shared memories", text: "After the meetup, the squad can add photos to the hangout's album.", icon: Camera },
  { title: "Host & sell tickets", text: "Partners and artists get a dashboard to publish events, approve guests and track sales.", icon: Users },
];

// Example scenarios for the "How people use Solo-No-More" section (illustrative — no names or ratings).
const HOW_PEOPLE_USE: { title: string; where: string; story: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { title: "Doubles padel, short one player", where: "DHA, Karachi", story: "Post a beacon for one open spot, approve someone with a matching vibe, and play the same evening.", icon: Zap },
  { title: "Late-night chai run", where: "Clifton, Karachi", story: "New to the city and want company for chai? Join an open hangout instead of going alone.", icon: Utensils },
  { title: "A gig you didn't want to miss", where: "Gulberg, Lahore", story: "Book a pass, pay by bank transfer, and meet a vetted squad at the door.", icon: Music },
  { title: "Weekend hike crew", where: "Margalla Hills, Islamabad", story: "Hosts set the plan, the budget split and how many people can join.", icon: Compass },
  { title: "Board games after work", where: "Any city", story: "Small, approved groups — no awkward group chats, no randoms showing up.", icon: Smile },
  { title: "Hosting your own event", where: "Partners & artists", story: "Sell tickets, approve guests and check passes at the door from one dashboard.", icon: Ticket },
];

// Trust strip: only facts the product actually enforces (no press quotes or invented reviews).
const TRUST_POINTS: { text: string; label: string }[] = [
  { text: "Every member is vetted with CNIC and social checks before they can join a hangout.", label: "VETTED COMMUNITY" },
  { text: "Hosts approve who joins their squad — no randoms showing up.", label: "HOST APPROVAL" },
  { text: "Payments are verified by our team before a pass becomes active.", label: "VERIFIED PAYMENTS" },
  { text: "Pay by simple bank transfer and share your receipt on WhatsApp.", label: "LOCAL PAYMENTS" },
  { text: "No-show strikes keep plans reliable for everyone.", label: "ANTI-FLAKE POLICY" },
  { text: "Hangouts in Karachi, Lahore and Islamabad — events open to all cities.", label: "MADE FOR PAKISTAN" },
];

// ─── TABS & EVENT DATA ───────────────────────────────────────────────────────


export interface BeaconSimulatorItem {
  id: string;
  category: "sports" | "casual" | "nightlife";
  categoryLabel: string;
  categoryGlyph: string;
  title: string;
  host: string;
  hostRole: string;
  hostAvatar: string;
  location: string;
  addressDetail: string;
  time: string;
  date: string;
  description: string;
  poster: string;
  totalSlots: number;
  filledSlots: number;
  gradientBg: string;
}

export const SIMULATOR_BEACONS: BeaconSimulatorItem[] = [
  {
    id: "padel",
    category: "sports",
    categoryLabel: "SPORTS",
    categoryGlyph: "🎾",
    title: "Midnight Blue Court Padel Smash",
    host: "Aisha M.",
    hostRole: "Padel Captain · 8 Matches",
    hostAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces",
    location: "Velocity Padel, Clifton",
    addressDetail: "Court 2, Marine Drive, Clifton, Karachi",
    time: "10:00 PM",
    date: "Tonight",
    description: "Friendly doubles tournament under stadium floodlights. Racquets provided! Losers buy chai afterwards.",
    poster: "/images/beacon-padel.jpg",
    totalSlots: 8,
    filledSlots: 6,
    gradientBg: "radial-gradient(ellipse at 75% 45%, rgba(0, 229, 255, 0.28) 0%, rgba(255, 90, 31, 0.25) 35%, rgba(7, 25, 18, 0.98) 75%), linear-gradient(135deg, #071912 0%, #06150F 100%)",
  },
  {
    id: "chai",
    category: "casual",
    categoryLabel: "CASUAL",
    categoryGlyph: "☕",
    title: "Late Night Chai & Paratha Run",
    host: "Zain K.",
    hostRole: "Community Lead · DHA",
    hostAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces",
    location: "Chai Shai, DHA Phase 6",
    addressDetail: "Main Saba Commercial, DHA Phase 6, Karachi",
    time: "11:00 PM",
    date: "Tonight",
    description: "Talking tech startups, creative design, and city life over hot elaichi chai and nutella parathas. Everyone welcome!",
    poster: "/images/beacon-chai.jpg",
    totalSlots: 16,
    filledSlots: 14,
    gradientBg: "radial-gradient(ellipse at 75% 45%, rgba(255, 90, 31, 0.38) 0%, rgba(234, 88, 12, 0.25) 35%, rgba(30, 18, 8, 0.98) 75%), linear-gradient(135deg, #1E1208 0%, #150D05 100%)",
  },
  {
    id: "birthday",
    category: "nightlife",
    categoryLabel: "NIGHTLIFE",
    categoryGlyph: "🎂",
    title: "26th Birthday Bash",
    host: "Sarah K.",
    hostRole: "Birthday Host · Clifton",
    hostAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces",
    location: "Secret Rooftop, Clifton Block 4",
    addressDetail: "Block 4 Rooftop, Clifton, Karachi",
    time: "6:00 PM",
    date: "Friday, April 5",
    description: "Celebrate the end of being on my parents health insurance! DJ set, finger foods, BYOB.",
    poster: "/images/beacon-now-26.jpg",
    totalSlots: 20,
    filledSlots: 16,
    gradientBg: "radial-gradient(ellipse at 75% 45%, rgba(217, 70, 239, 0.35) 0%, rgba(249, 115, 22, 0.28) 35%, rgba(15, 14, 23, 0.98) 75%), linear-gradient(135deg, #181424 0%, #100E17 100%)",
  },
  {
    id: "gig",
    category: "nightlife",
    categoryLabel: "NIGHTLIFE",
    categoryGlyph: "🪩",
    title: "Secret Warehouse Techno Session",
    host: "DJ Rumi",
    hostRole: "Curator · District 19",
    hostAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces",
    location: "District 19, Korangi Industrial",
    addressDetail: "Plot 19, Sector 23, Korangi Industrial, Karachi",
    time: "10:30 PM",
    date: "Saturday",
    description: "Underground deep house and modular synth sets. Exclusive guestlist vetted beforehand; QR pass verified via Raast.",
    poster: "/images/hero-rooftop.jpg",
    totalSlots: 50,
    filledSlots: 42,
    gradientBg: "radial-gradient(ellipse at 75% 45%, rgba(147, 51, 234, 0.35) 0%, rgba(255, 90, 31, 0.22) 35%, rgba(19, 17, 26, 0.98) 75%), linear-gradient(135deg, #13111A 0%, #0E0C13 100%)",
  },
];

type EventCategory = "birthday" | "padel" | "chai" | "gig" | "dinner" | "games";


export interface MembersOnlyEventItem {
  id: string;
  category: "trips" | "motorsports" | "culture" | "music";
  title: string;
  curator: string;
  date: string;
  location: string;
  price: string;
  publicPrice: string;
  spotsLeft: string;
  spotsRemaining: number;
  totalSpots: number;
  image: string;
  hotBadge: string;
  perkBadge: string;
  membersOnly: boolean;
}

// Event cards are built from REAL upcoming events (no sample data).
function eventToCard(ev: PublicEventSummary): MembersOnlyEventItem {
  const left = Math.max(0, (ev.max_capacity || 0) - (ev.joined_count || 0));
  const price = ev.price > 0 ? `PKR ${ev.price.toLocaleString("en-US")}` : "Free";
  return {
    id: ev.id,
    category: "culture",
    title: ev.title,
    curator: "Solo-No-More",
    date: new Date(ev.scheduled_at).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Karachi" }),
    location: ev.venue_name || ev.address || "Venue TBA",
    price,
    publicPrice: price,
    spotsLeft: ev.max_capacity ? (left > 0 ? `${left} spots left` : "Sold out") : "Open",
    spotsRemaining: left,
    totalSpots: ev.max_capacity || 0,
    image: ev.flyer_image_url || "/images/hero-rooftop.jpg",
    hotBadge: ev.members_only ? "MEMBERS ONLY" : "OPEN TO ALL",
    perkBadge: "",
    membersOnly: ev.members_only,
  };
}

export type LiveBeaconsByCity = Record<"Karachi" | "Lahore" | "Islamabad", PublicBeaconSummary[]>;

export default function LandingPageClient({
  reviewWallData,
  liveEvents = [],
  liveBeacons = { Karachi: [], Lahore: [], Islamabad: [] },
}: {
  reviewWallData?: any;
  liveEvents?: PublicEventSummary[];
  liveBeacons?: LiveBeaconsByCity;
} = {}) {
  // Beacons are local: the website shows one city at a time. Events are shown for every city.
  const [beaconCity, setBeaconCity] = useState<keyof LiveBeaconsByCity>("Karachi");
  const TEMPLATES: TrendingTemplateItem[] = (liveBeacons[beaconCity] || []).map(beaconToCard);
  const totalLiveBeacons = liveBeacons.Karachi.length + liveBeacons.Lahore.length + liveBeacons.Islamabad.length;
  const [activeCategory, setActiveCategory] = useState<EventCategory>("birthday");
  const [activeRsvp, setActiveRsvp] = useState<"going" | "maybe" | "cantGo" | null>("going");
  const [selectedTemplate, setSelectedTemplate] = useState<TrendingTemplateItem | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const rSlots = reviewWallData?.slots || [];

  // Members Only Events State (Category Filters & Favorites)
  const [eventCategoryFilter, setEventCategoryFilter] = useState<string>("all");
  const [eventFavorites, setEventFavorites] = useState<Record<string, boolean>>({});
  const toggleEventFavorite = (id: string) => {
    setEventFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Preview Modals State
  const [previewEvent, setPreviewEvent] = useState<EventPreviewData | null>(null);
  const [previewBeacon, setPreviewBeacon] = useState<BeaconPreviewData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);



  const openBeaconPreview = (tmpl: TrendingTemplateItem) => {
    // Real data for the preview: look the beacon up by id.
    const real = (liveBeacons[beaconCity] || []).find((b) => b.id === tmpl.id);
    if (!real) return;
    setPreviewBeacon({
      id: real.id,
      title: real.title,
      category: real.category,
      location_name: real.location_name || real.city,
      location: real.location_name || real.city,
      time: tmpl.time,
      date: real.scheduled_at
        ? new Date(real.scheduled_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "Asia/Karachi" })
        : "Date TBD",
      total_slots: real.total_slots,
      filled_slots: real.filled_slots,
      description: real.description || `${real.title} in ${real.location_name || real.city}.`,
      hostName: real.host_first_name,
    });
  };

  // Beacons Carousel Ref & Cursor Drag Scroll State
  const carouselRef = useRef<HTMLDivElement>(null);
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-selection cycling animation for Beacon Cards (Cycles one-by-one smoothly)
  useEffect(() => {
    if (isInteracting || isDragging) return;

    const interval = setInterval(() => {
      setSelectedTemplate((prev) => {
        if (TEMPLATES.length === 0) return prev;
        const currentIndex = prev ? TEMPLATES.findIndex((t) => t.id === prev.id) : -1;
        const nextIndex = (currentIndex + 1) % TEMPLATES.length;
        const nextTemplate = TEMPLATES[nextIndex];

        // Smoothly scroll the carousel track to bring the active card into view
        if (carouselRef.current) {
          const cardWidth = 330 + 16;
          const targetScroll = nextIndex * cardWidth;
          carouselRef.current.scrollTo({
            left: targetScroll,
            behavior: "smooth",
          });
        }

        return nextTemplate;
      });
    }, 3200);

    return () => clearInterval(interval);
  }, [isInteracting, isDragging, beaconCity, TEMPLATES.length]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    isDownRef.current = true;
    setIsDragging(true);
    startXRef.current = e.pageX - carouselRef.current.offsetLeft;
    scrollLeftRef.current = carouselRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDownRef.current = false;
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    isDownRef.current = false;
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDownRef.current || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    carouselRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!carouselRef.current) return;
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
      carouselRef.current.scrollLeft += e.deltaY;
    }
  };

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = direction === "left" ? -350 : 350;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Real App Simulator State (Mobile & Desktop Mockup Showcase)
  const [deviceVersion, setDeviceVersion] = useState<"desktop" | "mobile">("desktop");
  const [simulatorAction, setSimulatorAction] = useState<"create" | "join">("create");

  // Create Mode Simulator State
  const [createCategory, setCreateCategory] = useState<"sports" | "casual" | "nightlife">("sports");
  const [createTitle, setCreateTitle] = useState("Midnight Blue Court Padel Smash");
  const [createLocation, setCreateLocation] = useState("Velocity Padel, Clifton");
  const [createSlots, setCreateSlots] = useState(4);
  const [createTime, setCreateTime] = useState("Tonight · 10:00 PM");
  const [beaconBroadcasted, setBeaconBroadcasted] = useState(false);

  // Join Mode Simulator State
  const [activeBeaconId, setActiveBeaconId] = useState<string>("padel");
  const [userJoinedStatus, setUserJoinedStatus] = useState<Record<string, "going" | "maybe" | "cantGo" | null>>({
    padel: null,
    birthday: "going",
    chai: null,
    gig: null,
  });
  const [openChatInMockup, setOpenChatInMockup] = useState(false);
  const [simulatedChatMsgs, setSimulatedChatMsgs] = useState([
    { from: "Aisha (Host)", text: "Welcome to the squad! Court 2 is reserved under Solo No More.", time: "9:42 PM" },
    { from: "Zain", text: "Got 2 extra racquets in my car if anyone needs!", time: "9:44 PM" },
  ]);
  const [simChatInput, setSimChatInput] = useState("");

  const handleSendSimChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simChatInput.trim()) return;
    setSimulatedChatMsgs((prev) => [
      ...prev,
      { from: "You", text: simChatInput.trim(), time: "Just now" },
    ]);
    setSimChatInput("");
  };


  const handleNavClick = (category?: EventCategory, targetSection: string = "events-section") => {
    if (category) {
      setActiveCategory(category);
    }
    const element = document.getElementById(targetSection);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSelectSimCategory = (cat: "sports" | "casual" | "nightlife") => {
    setCreateCategory(cat);
    if (cat === "sports") {
      setCreateTitle("Midnight Blue Court Padel Smash");
      setCreateLocation("Velocity Padel, Clifton");
      setCreateTime("Tonight · 10:00 PM");
      setCreateSlots(4);
    } else if (cat === "casual") {
      setCreateTitle("Late Night Chai & Paratha Run");
      setCreateLocation("Chai Shai, DHA Phase 6");
      setCreateTime("Tonight · 11:00 PM");
      setCreateSlots(6);
    } else {
      setCreateTitle("Secret Rooftop Techno Session");
      setCreateLocation("District 19, Korangi");
      setCreateTime("Saturday · 10:30 PM");
      setCreateSlots(15);
    }
    setBeaconBroadcasted(false);
  };

  const handleSimRsvpClick = (beaconId: string, choice: "going" | "maybe" | "cantGo") => {
    setUserJoinedStatus((prev) => ({
      ...prev,
      [beaconId]: prev[beaconId] === choice ? null : choice,
    }));
  };

  const currentSimulatorBeacon = SIMULATOR_BEACONS.find((b) => b.id === activeBeaconId) || SIMULATOR_BEACONS[0];
  const activeJoinRsvp = userJoinedStatus[activeBeaconId];
  const joinGoingCount = currentSimulatorBeacon.filledSlots + (activeJoinRsvp === "going" ? 1 : 0);
  const joinSlotsRemaining = Math.max(0, currentSimulatorBeacon.totalSlots - joinGoingCount);

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
      {/* ── 2. NAVBAR (MATCHING SUBPAGES, NON-STICKY) ── */}
      {/* ── 2. NAVBAR (MATCHING SUBPAGES, NON-STICKY) ── */}
      <header
        className="px-3 py-3 sm:px-6 sm:py-5 md:px-10 w-full flex items-center justify-between gap-2 sm:gap-4 relative z-[60]"
        style={{
          background: "transparent",
        }}
      >
        {/* Left: Brand Logo on far-left edge */}
        <Link href="/" style={{ textDecoration: "none" }} className="flex items-center shrink-0 cursor-pointer group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="solo-no-more"
            className="h-9 sm:h-11 md:h-12 lg:h-[52px] w-auto object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-[0_2px_14px_rgba(255,90,31,0.4)]"
          />
        </Link>

        {/* Center: Clean Subpage-matching Navbar Links */}
        <nav className="hidden xl:flex items-center gap-1">
          {[
            { href: "/events", label: "Browse Events" },
            { href: "/how-it-works", label: "How Beacon Works" },
            { href: "/memberships", label: "Memberships" },
            { href: "/partners", label: "Partners" },
            { href: "/sell-tickets", label: "Sell Tickets" },
            { href: "/about", label: "About" },
            { href: "/contact", label: "Contact" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "13.5px",
                textShadow: "0 1px 4px rgba(0, 0, 0, 0.95)",
                textDecoration: "none",
                padding: "8px 13px",
                borderRadius: "8px",
                letterSpacing: "-0.01em",
                transition: "all 0.15s ease",
              }}
              className="hover:bg-white/10 hover:text-[#FF8A3D] active:scale-95 cursor-pointer"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <Link
            href="/login"
            style={{
              background: "rgba(18, 18, 24, 0.78)",
              border: "1px solid rgba(255, 255, 255, 0.22)",
              color: "#FFFFFF",
              fontWeight: 800,
              textDecoration: "none",
              borderRadius: "8px",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.3)",
              transition: "background 0.15s ease, transform 0.15s ease",
            }}
            className="hover:bg-white/20 active:scale-95 cursor-pointer inline-flex items-center text-xs sm:text-[13.5px] px-2.5 py-1.5 sm:px-4 sm:py-2 whitespace-nowrap shrink-0"
          >
            Sign In
          </Link>
          <SignUpDropdown />
        </div>
      </header>

      {/* ── 3. HERO SECTION (TEXTURED FILM GRAIN + ORANGE/BLACK GRADIENT + USER PHOTO) ── */}
      <section
        className="relative overflow-hidden flex items-center bg-[#050507] pt-8 pb-12 sm:pt-14 sm:pb-10 md:pt-20 md:pb-14 md:min-h-[clamp(580px,85vh,760px)]"
      >
        {/* Photography Layer: Hero Image with optimized mobile positioning */}
        <div
          className="absolute inset-0 md:left-auto md:right-0 md:top-0 md:bottom-0 md:w-[70%]"
          style={{
            backgroundImage: "url('/images/hero-image.jpg')",
            backgroundPosition: "top 20% right",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Desktop: High-Drama Horizontal Split Light Streak */}
        <div
          className="hidden md:block absolute inset-0 pointer-events-none"
          style={{
            background: `
              linear-gradient(to right,
                #000000 0%,
                #000000 18%,
                #070301 26%,
                #230b02 33%,
                rgba(235, 75, 20, 0.90) 41%,
                rgba(255, 90, 31, 0.40) 49%,
                transparent 62%
              ),
              radial-gradient(ellipse 50% 75% at 24% 48%, rgba(255, 90, 31, 0.65) 0%, transparent 65%),
              radial-gradient(ellipse 40% 55% at 8% 20%, rgba(217, 70, 15, 0.65) 0%, transparent 65%)
            `,
            zIndex: 2,
          }}
        />

        {/* Mobile: Full-Cover Ambient Vignette with Warm Orange Light & High-Contrast Backdrop */}
        <div
          className="block md:hidden absolute inset-0 pointer-events-none"
          style={{
            background: `
              linear-gradient(180deg,
                rgba(5, 5, 7, 0.45) 0%,
                rgba(18, 9, 5, 0.55) 20%,
                rgba(5, 5, 7, 0.88) 55%,
                #050507 92%
              ),
              radial-gradient(ellipse 90% 50% at 50% 12%, rgba(255, 90, 31, 0.40) 0%, transparent 70%)
            `,
            zIndex: 2,
          }}
        />

        {/* 100% Monochrome Analog Film Grain (Desaturated Black & White Noise — Zero Color Tint) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='partifulGrain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23partifulGrain)' opacity='0.3'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            mixBlendMode: "overlay",
            opacity: 0.35,
            pointerEvents: "none",
            zIndex: 4,
          }}
        />

        {/* Left Column Content Container (Edge-to-Edge Layout: Aligns across left) */}
        <div
          className="relative z-10 w-full px-5 py-4 sm:px-8 sm:py-6 md:px-12 md:py-10"
        >
          <div style={{ maxWidth: "620px" }}>
            
            {/* Live Community Pulse Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255, 111, 38, 0.14)",
                border: "1px solid rgba(255, 111, 38, 0.35)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                padding: "6px 14px",
                borderRadius: "9999px",
                fontSize: "11.5px",
                fontWeight: 800,
                color: "#FFA05C",
                letterSpacing: "0.03em",
                marginBottom: "16px",
                boxShadow: "0 4px 16px rgba(255, 90, 31, 0.2)",
              }}
            >
              <span className="w-2 h-2 rounded-full bg-[#3DDC97] animate-pulse" style={{ boxShadow: "0 0 10px #3DDC97" }} />
              <span>{totalLiveBeacons > 0 ? `${totalLiveBeacons} LIVE HANGOUT${totalLiveBeacons === 1 ? "" : "S"} TO JOIN RIGHT NOW` : "EARLY BIRD PASSES NOW OPEN"}</span>
            </div>

            {/* Headline: Clean 2-Line Architecture Across Mobile & Desktop */}
            <h1
              style={{
                fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
                fontSize: "clamp(24px, 6.4vw, 76px)",
                fontWeight: 900,
                letterSpacing: "-0.035em",
                lineHeight: 1.1,
                color: "#FFFFFF",
                margin: "0 0 16px",
                textShadow: "0 3px 20px rgba(0, 0, 0, 0.8)",
              }}
            >
              <span className="block whitespace-normal xs:whitespace-nowrap sm:whitespace-normal">
                Never go out alone again.
              </span>
              <span
                className="block"
                style={{
                  background: "linear-gradient(135deg, #FF9447 0%, #FF5A1F 55%, #E6450A 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Find your people IRL.
              </span>
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: "clamp(13.5px, 2vw, 19px)",
                lineHeight: 1.55,
                color: "rgba(255, 255, 255, 0.92)",
                fontWeight: 600,
                maxWidth: "520px",
                margin: "0 0 22px",
                textShadow: "0 2px 12px rgba(0, 0, 0, 0.85)",
              }}
            >
              Join vetted squads for padel, chai runs, rooftop gigs, and beach sunsets nationwide — or host your own in 10 seconds. Real people showing up.
            </p>

            {/* CTA Buttons (Sunset Orange Gradient + Glass Secondary) */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <Link
                href="/early-bird"
                style={{
                  background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 45%, #E6450A 100%)",
                  color: "#FFFFFF",
                  fontSize: "14.5px",
                  fontWeight: 800,
                  padding: "12px 24px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  boxShadow: "0 8px 25px rgba(255, 90, 31, 0.45)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
                className="hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Early Bird VIP ➔</span>
              </Link>

              <Link
                href="/apply"
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#FFFFFF",
                  fontSize: "14.5px",
                  fontWeight: 700,
                  padding: "12px 22px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "background 0.15s ease, transform 0.15s ease",
                }}
                className="hover:bg-white/15 active:scale-95 cursor-pointer"
              >
                <span>Join Squad</span>
              </Link>

              <Link
                href="/dashboard"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: "14.5px",
                  fontWeight: 600,
                  padding: "12px 20px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                className="hover:bg-white/10 active:scale-95 cursor-pointer"
              >
                <span>Explore Radar</span>
              </Link>
            </div>

            {/* Mobile Community Stats Bar */}
            <div
              className="flex md:hidden items-center gap-4 mt-6 pt-4 border-t border-white/10"
              style={{ maxWidth: "420px" }}
            >
              <div>
                <div style={{ fontSize: "18px", fontWeight: 900, color: "#FFA05C" }}>500+</div>
                <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(255, 255, 255, 0.6)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Vetted Members</div>
              </div>
              <div style={{ width: "1px", height: "24px", background: "rgba(255, 255, 255, 0.15)" }} />
              <div>
                <div style={{ fontSize: "18px", fontWeight: 900, color: "#FFFFFF" }}>14</div>
                <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(255, 255, 255, 0.6)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Tonight's Squads</div>
              </div>
              <div style={{ width: "1px", height: "24px", background: "rgba(255, 255, 255, 0.15)" }} />
              <div>
                <div style={{ fontSize: "18px", fontWeight: 900, color: "#3DDC97" }}>0%</div>
                <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(255, 255, 255, 0.6)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Ghosting Rate</div>
              </div>
            </div>

          </div>
        </div>

        {/* ── 90's COMPACT SCENE MEETUP TICKET PASS (Slim, Doesn't Block Characters) ── */}
        <div
          style={{
            position: "absolute",
            bottom: "22px",
            right: "26px",
            width: "295px",
            maxWidth: "calc(100vw - 36px)",
            zIndex: 25,
            transform: "rotate(-1.5deg)",
            transition: "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s ease",
          }}
          className="hover:rotate-0 hover:scale-[1.03] cursor-pointer hidden md:block"
        >
          {/* Ticket Body Container */}
          <div
            style={{
              position: "relative",
              background: "linear-gradient(135deg, rgba(20, 17, 26, 0.96) 0%, rgba(10, 9, 14, 0.98) 100%)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              boxShadow: "0 20px 50px -10px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 120, 40, 0.15)",
              display: "grid",
              gridTemplateColumns: "1fr 78px",
              overflow: "hidden",
            }}
          >
            {/* Top Cutout Notch (Perforation junction) */}
            <div
              style={{
                position: "absolute",
                top: "-6px",
                right: "72px",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "#050507",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                zIndex: 30,
              }}
            />
            {/* Bottom Cutout Notch (Perforation junction) */}
            <div
              style={{
                position: "absolute",
                bottom: "-6px",
                right: "72px",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "#050507",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                zIndex: 30,
              }}
            />

            {/* Left: Main Ticket Pass */}
            <div
              style={{
                padding: "11px 13px",
                borderRight: "2px dashed rgba(255, 255, 255, 0.2)",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              {/* Top Retro Stamp & Serial */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: "8.5px",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    color: "#FFA05C",
                    textTransform: "uppercase",
                  }}
                >
                  ★ ADMIT ONE • #09428
                </span>
                <span
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.16)",
                    padding: "1px 5px",
                    borderRadius: "3px",
                    fontSize: "7.5px",
                    fontWeight: 800,
                    color: "#FFFFFF",
                    letterSpacing: "0.04em",
                  }}
                >
                  90S PASS
                </span>
              </div>

              {/* Main Headline */}
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
                    fontSize: "12.5px",
                    fontWeight: 900,
                    lineHeight: 1.15,
                    letterSpacing: "-0.02em",
                    color: "#FFFFFF",
                    margin: 0,
                  }}
                >
                  PLAN YOUR NEXT SCENE MEETUP
                </div>
                <div
                  style={{
                    fontSize: "9.5px",
                    fontWeight: 600,
                    color: "rgba(255, 255, 255, 0.7)",
                    marginTop: "2px",
                  }}
                >
                  Rooftop Sessions × Night Padel
                </div>
              </div>

              {/* Event Metadata Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "4px 8px",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "6px 8px",
                  borderRadius: "6px",
                }}
              >
                <div>
                  <div style={{ color: "rgba(255, 255, 255, 0.45)", fontSize: "7.5px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    DATE
                  </div>
                  <div style={{ color: "#FFFFFF", fontWeight: 800, fontSize: "9px" }}>
                    THIS SAT • 9:30P
                  </div>
                </div>
                <div>
                  <div style={{ color: "rgba(255, 255, 255, 0.45)", fontSize: "7.5px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    ZONE
                  </div>
                  <div style={{ color: "#FFFFFF", fontWeight: 800, fontSize: "9px" }}>
                    CLIFTON / DHA-8
                  </div>
                </div>
                <div>
                  <div style={{ color: "rgba(255, 255, 255, 0.45)", fontSize: "7.5px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    POLICY
                  </div>
                  <div style={{ color: "#C8FF00", fontWeight: 800, fontSize: "9px" }}>
                    Vetted • Solo OK
                  </div>
                </div>
                <div>
                  <div style={{ color: "rgba(255, 255, 255, 0.45)", fontSize: "7.5px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    CAPACITY
                  </div>
                  <div style={{ color: "#FFA05C", fontWeight: 800, fontSize: "9px" }}>
                    16 SPOTS
                  </div>
                </div>
              </div>

              {/* Guests Stack & Status */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "1px" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {[
                    "/images/hero-image.jpg",
                    "/images/padel-squad.jpg",
                    "/images/chai-cafe.jpg",
                  ].map((src, i) => (
                    <div
                      key={i}
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: "1.5px solid #050507",
                        marginLeft: i === 0 ? 0 : "-4px",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="Guest" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                  <span style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255, 255, 255, 0.8)", marginLeft: "6px" }}>
                    RSVP open
                  </span>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "8.5px", color: "#C8FF00", fontWeight: 700 }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#C8FF00" }} />
                  <span>RSVP Active</span>
                </div>
              </div>
            </div>

            {/* Right: Tear-off Stub */}
            <div
              style={{
                padding: "10px 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(255, 255, 255, 0.02)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: "7.5px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: "rgba(255, 255, 255, 0.45)",
                  textTransform: "uppercase",
                }}
              >
                STUB
              </div>

              {/* Vintage 90s Barcode Graphic */}
              <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                <svg width="54" height="26" viewBox="0 0 78 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="0" width="3" height="38" fill="white" fillOpacity="0.85" />
                  <rect x="7" y="0" width="1.5" height="38" fill="white" fillOpacity="0.85" />
                  <rect x="11" y="0" width="4" height="38" fill="white" fillOpacity="0.85" />
                  <rect x="17" y="0" width="2" height="38" fill="white" fillOpacity="0.85" />
                  <rect x="21" y="0" width="5" height="38" fill="white" fillOpacity="0.85" />
                  <rect x="28" y="0" width="1.5" height="38" fill="white" fillOpacity="0.85" />
                  <rect x="32" y="0" width="3" height="38" fill="white" fillOpacity="0.85" />
                  <rect x="37" y="0" width="4.5" height="38" fill="white" fillOpacity="0.85" />
                  <rect x="44" y="0" width="1.5" height="38" fill="white" fillOpacity="0.85" />
                  <rect x="48" y="0" width="3" height="38" fill="white" fillOpacity="0.85" />
                  <rect x="53" y="0" width="2" height="38" fill="white" fillOpacity="0.85" />
                  <rect x="57" y="0" width="4" height="38" fill="white" fillOpacity="0.85" />
                  <rect x="63" y="0" width="1.5" height="38" fill="white" fillOpacity="0.85" />
                  <rect x="67" y="0" width="3.5" height="38" fill="white" fillOpacity="0.85" />
                  <rect x="73" y="0" width="2" height="38" fill="white" fillOpacity="0.85" />
                </svg>
                <span
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: "7px",
                    letterSpacing: "1px",
                    color: "rgba(255, 255, 255, 0.5)",
                  }}
                >
                  *942801*
                </span>
              </div>

              {/* Exact Partiful Style Button (Solid white, black text, 6px radius) */}
              <Link
                href="/apply"
                style={{
                  background: "#FFFFFF",
                  color: "#000000",
                  fontSize: "10px",
                  fontWeight: 800,
                  padding: "5px 6px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  width: "100%",
                  textAlign: "center",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.35)",
                  display: "block",
                  transition: "all 0.15s ease",
                }}
                className="hover:bg-gray-100 hover:scale-105 active:scale-95 cursor-pointer"
              >
                Claim Pass
              </Link>
            </div>
          </div>
        </div>

      </section>


      {/* ── SECTION FINISHED DIVIDER LINE ── */}
      <div
        className="w-full flex justify-center py-2 px-4 sm:py-4 sm:px-6 relative z-10"
        aria-hidden="true"
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1180px",
            height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 20%, rgba(255, 90, 31, 0.35) 50%, rgba(255, 255, 255, 0.15) 80%, transparent 100%)",
          }}
        />
      </div>

      {/* ── MARQUEE ANNOUNCEMENT BANNER (AUTHENTIC ORANGE & BLACK TICKING STRIP) ── */}
      <div
        className="pf-marquee-wrap"
        role="region"
        aria-label="Live Announcement Ticker"
        style={{
          background: "linear-gradient(90deg, #FF6B35 0%, #FF5A1F 45%, #EA580C 85%, #FF5A1F 100%)",
          color: "#000000",
          borderTop: "2.5px solid #000000",
          borderBottom: "2.5px solid #000000",
        }}
      >
        <div className="pf-marquee-content">
          <span className="inline-flex items-center gap-2 font-black text-black">
            <span className="pf-ticker-badge">
              <span className="pf-ticker-dot" /> LIVE TICKER
            </span>
            <span>REAL-WORLD SOCIAL DISCOVERY NATIONWIDE</span>
          </span>
          <span className="text-black font-black select-none">✦</span>
          <span className="inline-flex items-center gap-2 font-black text-black">
            <span className="pf-ticker-badge">⚡ 60-SEC RSVP</span>
            <span>THE FASTEST WAY TO HOST &amp; JOIN IRL MEETUPS</span>
          </span>
          <span className="text-black font-black select-none">●</span>
          <span className="inline-flex items-center gap-2 font-black text-black">
            <span className="pf-ticker-badge">🎾 SCENES</span>
            <span>PADEL · CHAI RUNS · ROOFTOP SETS · BOARDGAMES · CO-WORKING</span>
          </span>
          <span className="text-black font-black select-none">✦</span>
          <span className="inline-flex items-center gap-2 font-black text-black">
            <span className="pf-ticker-badge">🛡️ 100% VETTED</span>
            <span>REAL VETTED SQUADS · ZERO FOLLOWER ALGORITHMS · ZERO GHOSTING</span>
          </span>
          <span className="text-black font-black select-none">★</span>
          <span className="inline-flex items-center gap-2 font-black text-black">
            <span className="pf-ticker-badge">📍 LOCAL HOTSPOTS</span>
            <span>KARACHI · LAHORE · ISLAMABAD · NATIONWIDE</span>
          </span>
          <span className="text-black font-black select-none">●</span>
          <span className="inline-flex items-center gap-2 font-black text-black">
            <span className="pf-ticker-badge">🔥 SOLO NO MORE</span>
            <span>STOP SCROLLING · MEET YOUR PEOPLE IN REAL LIFE</span>
          </span>
        </div>

        <div className="pf-marquee-content" aria-hidden="true">
          <span className="inline-flex items-center gap-2 font-black text-black">
            <span className="pf-ticker-badge">
              <span className="pf-ticker-dot" /> LIVE TICKER
            </span>
            <span>REAL-WORLD SOCIAL DISCOVERY NATIONWIDE</span>
          </span>
          <span className="text-black font-black select-none">✦</span>
          <span className="inline-flex items-center gap-2 font-black text-black">
            <span className="pf-ticker-badge">⚡ 60-SEC RSVP</span>
            <span>THE FASTEST WAY TO HOST &amp; JOIN IRL MEETUPS</span>
          </span>
          <span className="text-black font-black select-none">●</span>
          <span className="inline-flex items-center gap-2 font-black text-black">
            <span className="pf-ticker-badge">🎾 SCENES</span>
            <span>PADEL · CHAI RUNS · ROOFTOP SETS · BOARDGAMES · CO-WORKING</span>
          </span>
          <span className="text-black font-black select-none">✦</span>
          <span className="inline-flex items-center gap-2 font-black text-black">
            <span className="pf-ticker-badge">🛡️ 100% VETTED</span>
            <span>REAL VETTED SQUADS · ZERO FOLLOWER ALGORITHMS · ZERO GHOSTING</span>
          </span>
          <span className="text-black font-black select-none">★</span>
          <span className="inline-flex items-center gap-2 font-black text-black">
            <span className="pf-ticker-badge">📍 LOCAL HOTSPOTS</span>
            <span>KARACHI · LAHORE · ISLAMABAD · NATIONWIDE</span>
          </span>
          <span className="text-black font-black select-none">●</span>
          <span className="inline-flex items-center gap-2 font-black text-black">
            <span className="pf-ticker-badge">🔥 SOLO NO MORE</span>
            <span>STOP SCROLLING · MEET YOUR PEOPLE IN REAL LIFE</span>
          </span>
        </div>
      </div>


      {/* ── SECTION FINISHED DIVIDER LINE ── */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          padding: "16px 24px",
          position: "relative",
          zIndex: 10,
        }}
        aria-hidden="true"
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1180px",
            height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 20%, rgba(255, 90, 31, 0.35) 50%, rgba(255, 255, 255, 0.15) 80%, transparent 100%)",
          }}
        />
      </div>

      {/* ── 4. TRENDING BEACONS (ENLARGED FULL-WIDTH INVITE POSTERS & CURSOR SCROLL) ─── */}
      <section
        id="templates-section"
        style={{
          padding: "70px 0 80px",
          width: "100%",
          maxWidth: "100%",
          margin: 0,
          boxSizing: "border-box",
          overflow: "hidden",
          background: "#060408",
          position: "relative",
        }}
      >
        {/* Subtle Geometric Dotted Texture Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.18) 1.25px, transparent 1.25px)",
            backgroundSize: "22px 22px",
            backgroundPosition: "center",
            pointerEvents: "none",
            zIndex: 0,
            opacity: 0.85,
          }}
          aria-hidden="true"
        />
        {/* Header: Trending Beacons */}
        <div
          style={{
            padding: "0 clamp(24px, 5vw, 64px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "26px",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255, 90, 31, 0.12)",
                border: "1px solid rgba(255, 90, 31, 0.3)",
                padding: "4px 12px",
                borderRadius: "0px",
                fontSize: "11px",
                fontWeight: 800,
                color: "#FF8A3D",
                marginBottom: "10px",
                letterSpacing: "0.06em",
              }}
            >
              <Radio className="w-3.5 h-3.5 text-[#FF5A1F] animate-pulse" /> LIVE IN {beaconCity.toUpperCase()}
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display), system-ui, sans-serif",
                fontSize: "clamp(30px, 4.5vw, 50px)",
                fontWeight: 900,
                letterSpacing: "-0.035em",
                margin: "0 0 6px",
                color: "#FFFFFF",
                lineHeight: 1.1,
              }}
            >
              Trending Beacons
            </h2>
            <p
              style={{
                fontSize: "16.5px",
                color: "rgba(255, 255, 255, 0.7)",
                margin: 0,
                fontWeight: 500,
              }}
            >
              Open hangouts hosted by members in {beaconCity}. Beacons are local — pick your city.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {(["Karachi", "Lahore", "Islamabad"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setBeaconCity(c);
                    setSelectedTemplate(null);
                    carouselRef.current?.scrollTo({ left: 0 });
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition ${
                    beaconCity === c
                      ? "bg-[#FF5A1F] border-[#FF5A1F] text-white"
                      : "bg-white/[0.04] border-white/15 text-white/75 hover:bg-white/10"
                  }`}
                >
                  {c} ({liveBeacons[c].length})
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Controls: Perfectly Centered Buttons + Drag Hint */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12.5px", color: "rgba(255, 255, 255, 0.55)", fontWeight: 700, marginRight: "4px", display: "inline-flex", alignItems: "center", gap: "4px" }} className="hidden sm:inline-flex">
              Drag with cursor ⇄
            </span>
            <button
              type="button"
              onClick={() => {
                scrollCarousel("left");
                setIsInteracting(true);
              }}
              aria-label="Previous beacon"
              className="pf-image3-nav-btn"
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                margin: 0,
              }}
            >
              <ChevronLeft className="w-5 h-5 shrink-0" style={{ display: "block", margin: "auto" }} />
            </button>
            <button
              type="button"
              onClick={() => {
                scrollCarousel("right");
                setIsInteracting(true);
              }}
              aria-label="Next beacon"
              className="pf-image3-nav-btn"
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                margin: 0,
              }}
            >
              <ChevronRight className="w-5 h-5 shrink-0" style={{ display: "block", margin: "auto" }} />
            </button>
          </div>
        </div>

        {/* Horizontal Track of Poster Cards (Enlarged Size: 330px x 480px + Auto-selection) */}
        <div className="pf-beacons-carousel-container">
          <div
            ref={carouselRef}
            className="pf-beacons-track"
            onMouseEnter={() => setIsInteracting(true)}
            onMouseLeave={() => {
              setIsInteracting(false);
              handleMouseLeave();
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onWheel={handleWheel}
            style={{ padding: "16px clamp(24px, 5vw, 64px) 28px" }}
          >
            {TEMPLATES.length === 0 && (
              <div
                className="flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-white/20 bg-white/[0.03] px-8"
                style={{ flex: "1 0 100%", minHeight: "260px" }}
              >
                <Radio className="w-7 h-7 text-[#FF5A1F] mb-3" />
                <h3 className="text-lg font-bold text-white">No live beacons in {beaconCity} yet</h3>
                <p className="text-sm text-white/65 mt-1.5 max-w-md">
                  Be the first to host one — or grab an Early Bird pass and get notified when your city lights up.
                </p>
                <div className="flex flex-wrap gap-3 justify-center mt-5">
                  <Link href="/early-bird" className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#FF5A1F] text-white hover:brightness-110 transition">
                    Get Early Bird pass
                  </Link>
                  <Link href="/apply" className="px-4 py-2 rounded-lg text-sm font-semibold bg-white/[0.06] text-white border border-white/15 hover:bg-white/10 transition">
                    Join Solo-No-More
                  </Link>
                </div>
              </div>
            )}
            {TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplate?.id === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => {
                    setSelectedTemplate(tmpl);
                    setIsInteracting(true);
                    openBeaconPreview(tmpl);
                  }}
                  className={`pf-beacon-poster-card ${isSelected ? "is-active-beacon" : ""} cursor-pointer group`}
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    height: "480px",
                    width: "330px",
                    flex: "0 0 330px",
                    borderRadius: "0px",
                    transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                    cursor: "pointer",
                  }}
                >
                  {/* Active Beacon Selection Badge */}
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        top: "14px",
                        right: "14px",
                        zIndex: 15,
                        background: "rgba(255, 90, 31, 0.94)",
                        backdropFilter: "blur(8px)",
                        color: "#FFFFFF",
                        fontSize: "10px",
                        fontWeight: 900,
                        padding: "3px 9px",
                        borderRadius: "999px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        boxShadow: "0 4px 14px rgba(255, 90, 31, 0.65)",
                        letterSpacing: "0.05em",
                      }}
                    >
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FFFFFF" }} className="animate-pulse" />
                      <span>SELECTED</span>
                    </div>
                  )}
                  {/* Background Flyer Image */}
                  <img
                    src={tmpl.posterImg}
                    alt={tmpl.headline}
                    className="pf-beacon-poster-image"
                    draggable={false}
                  />

                  {/* Dark Vignette Overlay for Crisp Typography */}
                  <div className="pf-beacon-poster-gradient" />

                  {/* Bottom Content on Poster (Pinned to absolute bottom 0, Sharp Corners) */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      zIndex: 10,
                      padding: "26px 20px 22px",
                      textAlign: "left",
                      background: "linear-gradient(to top, rgba(0, 0, 0, 0.98) 0%, rgba(5, 3, 8, 0.92) 60%, rgba(5, 3, 8, 0.7) 80%, transparent 100%)",
                    }}
                  >
                    {/* Badge Pill with Sharp Corners */}
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        background: "rgba(0, 0, 0, 0.8)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        border: "1px solid rgba(255, 255, 255, 0.25)",
                        padding: "5px 12px",
                        borderRadius: "0px",
                        fontSize: "11.5px",
                        fontWeight: 800,
                        color: "#FFA578",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        marginBottom: "10px",
                      }}
                    >
                      {tmpl.posterBadge}
                    </div>

                    {/* Headline */}
                    <div
                      style={{
                        fontFamily: "var(--font-display), system-ui, sans-serif",
                        fontSize: "20px",
                        fontWeight: 900,
                        color: "#FFFFFF",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.2,
                        marginBottom: "8px",
                        textShadow: "0 2px 10px rgba(0, 0, 0, 0.95)",
                      }}
                    >
                      {tmpl.headline}
                    </div>

                    {/* Location: Pure High-Contrast White Text + Vivid Glowing Orange Pin */}
                    <div
                      style={{
                        fontSize: "13.5px",
                        fontWeight: 800,
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "11px",
                        textShadow: "0 1px 8px rgba(0, 0, 0, 0.95)",
                      }}
                    >
                      <MapPin className="w-4 h-4 text-[#FF5A1F] flex-shrink-0" />
                      <span>{tmpl.subtext}</span>
                    </div>

                    {/* Date & Time: Vivid Green Dot & Bright Pure White Text */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderTop: "1px solid rgba(255, 255, 255, 0.22)",
                        paddingTop: "11px",
                        fontSize: "12.5px",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 800 }}>
                        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#27C93F", boxShadow: "0 0 8px #27C93F" }} />
                        <span style={{ color: "#FFFFFF" }}>{tmpl.time}</span>
                      </span>
                      <span style={{ color: "rgba(255, 255, 255, 0.75)", fontWeight: 700, fontSize: "11.5px" }}>
                        Tap to preview
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Small Centered Action Banner (Vibrant Orange Background + Sharp Corners) */}
        <div
          style={{
            maxWidth: "480px",
            margin: "34px auto 0",
            padding: "8px 10px 8px 22px",
            background: "linear-gradient(135deg, #FF6B35 0%, #FF5A1F 100%)",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            borderRadius: "0px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
            boxShadow: "0 14px 40px -8px rgba(255, 90, 31, 0.65), 0 0 24px rgba(255, 90, 31, 0.4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <span style={{ fontSize: "16px" }}>⚡</span>
            <span
              style={{
                fontSize: "14.5px",
                fontWeight: 900,
                color: "#000000",
                letterSpacing: "-0.01em",
              }}
            >
              Create your own beacon now
            </span>
          </div>

          <Link
            href="/apply"
            style={{
              background: "#000000",
              color: "#FFFFFF",
              fontSize: "13.5px",
              fontWeight: 900,
              padding: "10px 22px",
              borderRadius: "0px",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.35)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              flexShrink: 0,
              transition: "transform 0.15s ease, background 0.15s ease",
            }}
            className="hover:bg-neutral-900 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>Create invite</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>


      {/* ── SECTION FINISHED DIVIDER LINE ── */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          padding: "16px 24px",
          position: "relative",
          zIndex: 10,
        }}
        aria-hidden="true"
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1180px",
            height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 20%, rgba(255, 90, 31, 0.35) 50%, rgba(255, 255, 255, 0.15) 80%, transparent 100%)",
          }}
        />
      </div>

      {/* ── 5. REAL-TIME BEACON SIMULATOR (LIVE RADAR + BROADCASTER + PHONE PREVIEW) ── */}
      <BeaconSimulator />

      {/* ── SECTION FINISHED DIVIDER LINE ── */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          padding: "16px 24px",
          position: "relative",
          zIndex: 10,
        }}
        aria-hidden="true"
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1180px",
            height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 20%, rgba(255, 90, 31, 0.35) 50%, rgba(255, 255, 255, 0.15) 80%, transparent 100%)",
          }}
        />
      </div>

      {/* ── 5. PLAIN ANIMATED REVIEWS & PRESS TICKER (MOVED ABOVE MEMBERS ONLY EVENTS) ─── */}
      <section
        id="reviews-section"
        className="pf-plain-reviews-wrap"
        style={{ borderBottom: "none", background: "#060408", marginBottom: "24px", position: "relative", overflow: "hidden" }}
        aria-label="Why members trust Solo-No-More"
      >
        {/* Subtle Geometric Dotted Texture Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.18) 1.25px, transparent 1.25px)",
            backgroundSize: "22px 22px",
            backgroundPosition: "center",
            pointerEvents: "none",
            zIndex: 0,
            opacity: 0.85,
          }}
          aria-hidden="true"
        />
        <div className="pf-plain-reviews-track">
          {[...TRUST_POINTS, ...TRUST_POINTS].map((item, idx) => {
            const quoteText = item.text;
            const sourceText = item.label;
            return (
              <div key={idx} className="pf-plain-review-item">
                <div className="pf-plain-review-quote">
                  {quoteText}
                </div>
                <div className="pf-plain-review-source">
                  {sourceText}
                </div>
              </div>
            );
          })}
        </div>
      </section>


      {/* ── SECTION FINISHED DIVIDER LINE ── */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          padding: "16px 24px",
          position: "relative",
          zIndex: 10,
        }}
        aria-hidden="true"
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1180px",
            height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 20%, rgba(255, 90, 31, 0.35) 50%, rgba(255, 255, 255, 0.15) 80%, transparent 100%)",
          }}
        />
      </div>

      {/* ── 6. "MEMBERS ONLY EVENTS" SECTION (FULL-SCREEN, ROUNDED CORNERS TOP & BOTTOM, ORANGE GRADIENT & DOTTED TEXTURE) ── */}
      <section
        id="members-only-events-section"
        style={{
          width: "100%",
          borderRadius: "clamp(32px, 4vw, 56px) clamp(32px, 4vw, 56px) 0 0",
          background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 40%, #E6450A 75%, #BD3000 100%)",
          padding: "70px min(4vw, 48px) 75px",
          marginTop: "24px",
          marginBottom: "0px",
          position: "relative",
          overflow: "hidden",
          border: "1.5px solid rgba(255, 255, 255, 0.22)",
          borderBottom: "none",
        }}
      >
        {/* Subtle Geometric Dotted Texture Overlay (Only on Members Only Orange Gradient) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.24) 1.25px, transparent 1.25px)",
              backgroundSize: "22px 22px",
              backgroundPosition: "center",
              pointerEvents: "none",
              zIndex: 1,
              opacity: 0.85,
            }}
            aria-hidden="true"
          />

          {/* Subtle Ambient Radial Lighting for Depth & Shine on Orange Gradient */}
          <div
            style={{
              position: "absolute",
              top: "-15%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "900px",
              height: "500px",
              background: "radial-gradient(ellipse at 50% 25%, rgba(255, 255, 255, 0.22) 0%, transparent 65%)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />

          {/* Top-Right Decorative White Starburst Accent */}
          <div
            style={{
              position: "absolute",
              top: "32px",
              right: "min(4vw, 48px)",
              width: "36px",
              height: "36px",
              color: "#FFFFFF",
              opacity: 0.9,
              pointerEvents: "none",
              zIndex: 1,
            }}
            className="animate-[spin_20s_linear_infinite]"
          >
          <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
            <path d="M12 0L13.8 8.2L20.5 3.5L16.8 11.2L24 12L16.8 12.8L20.5 20.5L13.8 15.8L12 24L10.2 15.8L3.5 20.5L7.2 12.8L0 12L7.2 11.2L3.5 3.5L10.2 8.2Z" />
          </svg>
        </div>

        <div style={{ maxWidth: "1560px", margin: "0 auto", position: "relative", zIndex: 2 }}>
          {/* Header Row: Pill, Title, Subtitle + View All Events Button */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: "24px",
              marginBottom: "42px",
            }}
          >
            <div style={{ textAlign: "left", maxWidth: "800px" }}>
              {/* Flame Pill Badge: 🔥 MEMBERS ONLY */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  fontSize: "12px",
                  fontWeight: 900,
                  letterSpacing: "0.14em",
                  color: "#FFFFFF",
                  marginBottom: "14px",
                  textTransform: "uppercase",
                  background: "rgba(18, 9, 14, 0.75)",
                  border: "1px solid rgba(255, 255, 255, 0.28)",
                  padding: "6px 16px",
                  borderRadius: "999px",
                  boxShadow: "0 4px 18px rgba(0, 0, 0, 0.25)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Flame className="w-3.5 h-3.5 text-[#FFA05C] fill-[#FFA05C]" />
                <span>UPCOMING</span>
              </div>

              {/* Headline: Members Only Events (Crisp White with High Contrast) */}
              <h2
                style={{
                  fontFamily: "var(--font-display), system-ui, sans-serif",
                  fontSize: "clamp(34px, 4.6vw, 60px)",
                  fontWeight: 900,
                  letterSpacing: "-0.035em",
                  color: "#FFFFFF",
                  lineHeight: 1.15,
                  margin: "0 0 10px",
                  textShadow: "0 3px 18px rgba(0, 0, 0, 0.3)",
                }}
              >
                Upcoming Events
              </h2>

              {/* Subtitle (Crisp White/Cream with High Contrast) */}
              <p
                style={{
                  fontSize: "16.5px",
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.95)",
                  margin: 0,
                  lineHeight: 1.5,
                  textShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
                }}
              >
                Curated events across Pakistan — open to every city.
              </p>
            </div>

            {/* Top-Right CTA Pill: [ View All Events → ] */}
            <div>
              <Link
                href="/events"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "rgba(18, 9, 14, 0.85)",
                  border: "1.5px solid rgba(255, 255, 255, 0.28)",
                  color: "#FFFFFF",
                  fontSize: "13.5px",
                  fontWeight: 800,
                  padding: "11px 24px",
                  borderRadius: "999px",
                  textDecoration: "none",
                  transition: "all 0.25s ease",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 6px 20px rgba(0, 0, 0, 0.35)",
                }}
                className="hover:scale-105 hover:bg-[#12090E] hover:border-white"
              >
                <span>View All Events</span>
                <ArrowRight className="w-4 h-4 text-[#FFA05C]" />
              </Link>
            </div>
          </div>

          {/* ── 4-COLUMN CARDS GRID (LARGER DEEP ONYX CARDS STANDING OUT SHARPLY ON ORANGE) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {liveEvents.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-4 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-white/40 bg-black/25 px-8 py-12">
                <Calendar className="w-7 h-7 text-white mb-3" />
                <h3 className="text-lg font-bold text-white">No events yet — the first one drops soon</h3>
                <p className="text-sm text-white/80 mt-1.5 max-w-md">Early Bird members hear about new events first.</p>
                <div className="flex flex-wrap gap-3 justify-center mt-5">
                  <Link href="/early-bird" className="px-4 py-2 rounded-lg text-sm font-semibold bg-black text-white hover:bg-black/80 transition">
                    Get Early Bird pass
                  </Link>
                  <Link href="/apply" className="px-4 py-2 rounded-lg text-sm font-semibold bg-white/15 text-white border border-white/30 hover:bg-white/25 transition">
                    Join Solo-No-More
                  </Link>
                </div>
              </div>
            )}
            {liveEvents.map(eventToCard).map((event) => {
              const isFav = !!eventFavorites[event.id];
              return (
                <div
                  key={event.id}
                  onClick={() => { window.location.href = `/events/${event.id}`; }}
                  className="group rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_28px_65px_rgba(0,0,0,0.65)] cursor-pointer"
                  style={{
                    background: "linear-gradient(180deg, #170C14 0%, #10060C 100%)",
                    border: "1.5px solid rgba(255, 255, 255, 0.15)",
                    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.45)",
                    padding: "15px 15px 22px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                >
                  {/* Larger Thumbnail Container (Height: 275px) */}
                  <div
                    style={{
                      position: "relative",
                      height: "275px",
                      borderRadius: "18px",
                      overflow: "hidden",
                      background: "#080408",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={event.image}
                      alt={event.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                      className="group-hover:scale-105"
                    />

                    {/* Gradient Overlay for badges contrast */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(180deg, rgba(8,4,8,0.58) 0%, transparent 40%, rgba(8,4,8,0.7) 100%)",
                        pointerEvents: "none",
                      }}
                    />

                    {/* Top-Left: 🔥 HOT Badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        left: "12px",
                        background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)",
                        color: "#FFFFFF",
                        fontSize: "11px",
                        fontWeight: 900,
                        letterSpacing: "0.08em",
                        padding: "5px 12px",
                        borderRadius: "999px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        boxShadow: "0 4px 14px rgba(255, 90, 31, 0.5)",
                        zIndex: 2,
                      }}
                    >
                      <Flame className="w-3.5 h-3.5 fill-white text-white" />
                      <span>HOT</span>
                    </div>

                    {/* Top-Right: Members Only Frosted Pill */}
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        background: "rgba(18, 10, 16, 0.78)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        color: "#FFFFFF",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "5px 13px",
                        borderRadius: "999px",
                        zIndex: 2,
                      }}
                    >
                      Members Only
                    </div>
                  </div>

                  {/* Card Body Details */}
                  <div style={{ paddingTop: "16px", flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      {/* Event Title */}
                      <h3
                        style={{
                          fontFamily: "var(--font-display), system-ui, sans-serif",
                          fontSize: "19px",
                          fontWeight: 800,
                          color: "#FFFFFF",
                          margin: "0 0 10px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={event.title}
                      >
                        {event.title}
                      </h3>

                      {/* Date & Time Row */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "13px",
                          color: "rgba(255, 255, 255, 0.65)",
                          margin: "0 0 7px",
                        }}
                      >
                        <Calendar className="w-3.5 h-3.5 text-[#FFA05C] shrink-0" />
                        <span>{event.date}</span>
                      </div>

                      {/* Location Row */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "13px",
                          color: "rgba(255, 255, 255, 0.65)",
                          margin: "0 0 18px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={event.location}
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#FFA05C] shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>

                    {/* Bottom Price & Urgency Left Row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: "14px",
                        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-display), system-ui, sans-serif",
                          fontSize: "20px",
                          fontWeight: 900,
                          color: "#FFA05C",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {event.price}
                      </span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "12.5px",
                          fontWeight: 700,
                          color: "rgba(255, 205, 130, 0.95)",
                        }}
                      >
                        <Clock className="w-3.5 h-3.5 text-[#FFA05C]" />
                        <span>{event.spotsLeft}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      

      {/* ── SECTION FINISHED DIVIDER LINE ── */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          padding: "16px 24px",
          position: "relative",
          zIndex: 10,
        }}
        aria-hidden="true"
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1180px",
            height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 20%, rgba(255, 90, 31, 0.35) 50%, rgba(255, 255, 255, 0.15) 80%, transparent 100%)",
          }}
        />
      </div>

            {/* ── 7. "WE'RE NOT LIKE OTHER INVITES" (DYNAMIC ON-SCROLL OVERLAPPING ORANGE GRADIENT CARDS) ───────── */}
      <OverlapFeatureCards />

{/* ── SECTION FINISHED DIVIDER LINE ── */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          padding: "16px 24px",
          position: "relative",
          zIndex: 10,
        }}
        aria-hidden="true"
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1180px",
            height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 20%, rgba(255, 90, 31, 0.35) 50%, rgba(255, 255, 255, 0.15) 80%, transparent 100%)",
          }}
        />
      </div>

      {/* ── 8. "POWERFUL FEATURES, EASY EVENTS" — only features that exist in the product ── */}
      <section id="powerful-features-section" className="relative px-6 py-20 sm:py-24" style={{ background: "#060408" }}>
        <div className="mx-auto max-w-[1180px]">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#FF5A1F]/35 bg-[#FF5A1F]/10 px-3 py-1 text-[11px] font-bold tracking-wider text-[#FFA05C]">
                <Zap className="w-3.5 h-3.5" /> FEATURES
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-white">Powerful features, easy events</h2>
              <p className="mt-3 text-base text-white/65">
                Everything you need to find your people, plan the hangout and get through the door — in one place.
              </p>
            </div>
            <Link
              href="/apply"
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#FF5A1F] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Get started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCT_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#FF5A1F]/40 hover:bg-white/[0.05]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF5A1F]/15 text-[#FF8A3D]">
                    <Icon className="w-5 h-5" />
                  </span>
                  <h3 className="mt-4 text-[15px] font-bold text-white">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/60">{feature.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* ── SECTION FINISHED DIVIDER LINE ── */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          padding: "16px 24px",
          position: "relative",
          zIndex: 10,
        }}
        aria-hidden="true"
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1180px",
            height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 20%, rgba(255, 90, 31, 0.35) 50%, rgba(255, 255, 255, 0.15) 80%, transparent 100%)",
          }}
        />
      </div>

      {/* ── 9. "HOW PEOPLE USE SOLO-NO-MORE" — example scenarios (no names, ratings or invented reviews) ─── */}
      <section id="how-people-use-section" className="relative px-6 py-20 sm:py-24" style={{ background: "#060408" }}>
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#FF5A1F]/35 bg-[#FF5A1F]/10 px-3 py-1 text-[11px] font-bold tracking-wider text-[#FFA05C]">
              <Sparkles className="w-3.5 h-3.5" /> HOW IT WORKS IN REAL LIFE
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-white">How people use Solo-No-More</h2>
            <p className="mt-3 text-base text-white/65">
              A few of the plans members can make. Real stories from our Early Birds will appear here as the community grows.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {HOW_PEOPLE_USE.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-[#FF5A1F]/40">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF5A1F]/15 text-[#FF8A3D]">
                      <Icon className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="text-[15px] font-bold text-white">{item.title}</div>
                      <div className="text-xs text-white/50">{item.where}</div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-white/70">{item.story}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* ── SECTION FINISHED DIVIDER LINE ── */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          padding: "16px 24px",
          position: "relative",
          zIndex: 10,
        }}
        aria-hidden="true"
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1180px",
            height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 20%, rgba(255, 90, 31, 0.35) 50%, rgba(255, 255, 255, 0.15) 80%, transparent 100%)",
          }}
        />
      </div>

      {/* ── 11. "STORIES FROM THE SQUAD" (PURE PHOTO & VIDEO COLLAGE - STANDARD SIZE) ── */}
      <section
        id="review-wall-section"
        style={{
          padding: "90px min(4vw, 48px) 100px",
          width: "100%",
          textAlign: "center",
          background: "#060408",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle Geometric Dotted Texture Overlay (Zero Orange Shade) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.18) 1.25px, transparent 1.25px)",
            backgroundSize: "22px 22px",
            backgroundPosition: "center",
            pointerEvents: "none",
            zIndex: 0,
            opacity: 0.85,
          }}
          aria-hidden="true"
        />

        <div style={{ maxWidth: "1540px", margin: "0 auto", position: "relative", zIndex: 2 }}>
          {/* Top Pill Badge: [ 📷 REVIEW WALL ] */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(28, 14, 10, 0.85)",
              border: "1px solid rgba(255, 90, 31, 0.4)",
              padding: "7px 20px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.12em",
              color: "#FF8A3D",
              marginBottom: "16px",
              boxShadow: "0 4px 18px rgba(255, 90, 31, 0.2)",
            }}
          >
            <InstagramIcon className="w-3.5 h-3.5 text-[#FF5A1F]" />
            <span>REVIEW WALL</span>
          </div>

          {/* Main Headline: Stories from the Squad */}
          <h2
            style={{
              fontFamily: "var(--font-display), system-ui, sans-serif",
              fontSize: "clamp(34px, 4.8vw, 60px)",
              fontWeight: 900,
              letterSpacing: "-0.035em",
              color: "#FFFFFF",
              lineHeight: 1.15,
              margin: "0 0 14px",
            }}
          >
            {reviewWallData?.heading || (
              <>
                Stories from the{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Squad
                </span>
              </>
            )}
          </h2>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "16px",
              color: "rgba(255, 255, 255, 0.72)",
              margin: "0 0 20px",
            }}
          >
            {reviewWallData?.tagline || "Tag @solonomore on Instagram to get featured on the Review Wall"}
          </p>

          {/* Pill Toggle Button: [ STORIES FROM THE LAST EVENT ] */}
          <div style={{ marginBottom: "38px" }}>
            <span
              style={{
                display: "inline-block",
                background: "rgba(255, 90, 31, 0.12)",
                border: "1px solid rgba(255, 90, 31, 0.45)",
                color: "#FF8A3D",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.14em",
                padding: "7px 22px",
                borderRadius: "999px",
                textTransform: "uppercase",
                boxShadow: "0 0 24px rgba(255, 90, 31, 0.22)",
              }}
            >
              Stories from the last event
            </span>
          </div>

          {/* ── PHOTO & VIDEO COLLAGE — every tile comes from the admin Review Wall (Admin → Review Wall) ── */}
          <div className="grid grid-cols-12 gap-3.5 mb-10 text-left auto-rows-[200px] md:auto-rows-[225px]">
            {WALL_TILE_LAYOUT.map((layout, i) => {
              const slot = rSlots[i] || {};
              const img = slot.image_url || layout.fallbackImg;
              const handle = (slot.author || "@solonomore").trim();
              const caption = (slot.venue || "").trim();
              const isReel = slot.type === "reel";
              return (
                <a
                  key={i}
                  href={slot.url || "https://www.instagram.com/solonomore"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${layout.span} rounded-3xl overflow-hidden relative group border border-white/15 bg-[#160C10] transition-all duration-300 hover:border-[#FF5A1F]`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={caption || "Solo-No-More on Instagram"}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden="true" />
                  {isReel && (
                    <span className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur" aria-label="Video">
                      <Play className="w-3.5 h-3.5 text-white fill-white" />
                    </span>
                  )}
                  <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                      <InstagramIcon className="w-3 h-3" /> {handle}
                    </span>
                    {caption && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white/85 backdrop-blur">
                        <MapPin className="w-3 h-3 text-[#FF5A1F]" /> {caption}
                      </span>
                    )}
                  </div>
                </a>
              );
            })}
          </div>

          {/* Bottom Pill Action: [ 📷 Tag @solonomore on your post and we'll showcase you here! ] */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(24, 12, 10, 0.9)",
                border: "1px solid rgba(255, 90, 31, 0.45)",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 700,
                padding: "12px 28px",
                borderRadius: "999px",
                textDecoration: "none",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5), 0 0 22px rgba(255, 90, 31, 0.2)",
                transition: "all 0.25s ease",
              }}
              className="hover:scale-105 hover:border-[#FF5A1F] hover:shadow-[0_10px_32px_rgba(255,90,31,0.4)]"
            >
              <InstagramIcon className="w-4 h-4 text-[#FF5A1F]" />
              <span>Tag @solonomore on your post and we&apos;ll showcase you here!</span>
            </a>
          </div>
        </div>
      </section>


      {/* ── SECTION FINISHED DIVIDER LINE ── */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          padding: "16px 24px",
          position: "relative",
          zIndex: 10,
        }}
        aria-hidden="true"
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1180px",
            height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 20%, rgba(255, 90, 31, 0.35) 50%, rgba(255, 255, 255, 0.15) 80%, transparent 100%)",
          }}
        />
      </div>

      {/* ── 11. SPICY HIGH-ENERGY ORANGE CTA SECTION ── */}
      <section
        id="party-cta-section"
        style={{
          width: "100%",
          borderRadius: "clamp(32px, 4vw, 56px) clamp(32px, 4vw, 56px) 0 0",
          background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 40%, #E6450A 75%, #BD3000 100%)",
          padding: "100px min(4vw, 48px) 80px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          marginTop: "24px",
        }}
      >
        {/* Subtle Geometric Dotted Texture Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.24) 1.25px, transparent 1.25px)",
            backgroundSize: "22px 22px",
            backgroundPosition: "center",
            pointerEvents: "none",
            zIndex: 1,
            opacity: 0.85,
          }}
          aria-hidden="true"
        />

        <div style={{ maxWidth: "820px", margin: "0 auto", position: "relative", zIndex: 2 }}>
          {/* Bold, Commanding Display Headline */}
          <h2
            style={{
              fontFamily: "var(--font-display), system-ui, sans-serif",
              fontSize: "clamp(38px, 5.5vw, 68px)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: "#FFFFFF",
              lineHeight: 1.08,
              margin: "0 0 18px",
              textShadow: "0 3px 25px rgba(0, 0, 0, 0.22)",
            }}
          >
            Let&apos;s get the party started.
          </h2>

          {/* Punchy Subtitle with High Legibility */}
          <p
            style={{
              fontSize: "clamp(17px, 2.2vw, 21px)",
              color: "rgba(255, 255, 255, 0.95)",
              fontWeight: 500,
              lineHeight: 1.5,
              maxWidth: "600px",
              margin: "0 auto 42px",
              textShadow: "0 2px 10px rgba(0, 0, 0, 0.15)",
            }}
          >
            Find us on any browser, iPhone, and Android. Zero ghosting, pure human connection.
          </p>

          {/* CTA Action Buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "18px",
            }}
          >
            <Link
              href="/apply"
              style={{
                background: "#0E0714",
                color: "#FFFFFF",
                fontSize: "16px",
                fontWeight: 800,
                padding: "16px 40px",
                borderRadius: "999px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                letterSpacing: "-0.01em",
                boxShadow: "0 14px 40px rgba(0, 0, 0, 0.45)",
                transition: "all 0.25s ease",
              }}
              className="hover:scale-105 hover:bg-[#1A0E24] cursor-pointer"
            >
              <Users className="w-4 h-4 text-[#FF8A3D]" />
              <span>Join community</span>
            </Link>

            <Link
              href="/apply"
              style={{
                background: "rgba(255, 255, 255, 0.96)",
                color: "#0E0714",
                fontSize: "16px",
                fontWeight: 800,
                padding: "16px 40px",
                borderRadius: "999px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                letterSpacing: "-0.01em",
                boxShadow: "0 14px 35px rgba(0, 0, 0, 0.18)",
                transition: "all 0.25s ease",
              }}
              className="hover:scale-105 hover:bg-white cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-[#FF5A1F]" />
              <span>Create your event</span>
            </Link>
          </div>

          <div
            style={{
              marginTop: "32px",
              fontSize: "13px",
              fontWeight: 700,
              color: "rgba(255, 255, 255, 0.9)",
              letterSpacing: "0.02em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <span>⚡</span>
            <span>420+ real gatherings live this weekend nationwide</span>
          </div>
        </div>
      </section>


      {/* ── SECTION FINISHED DIVIDER LINE ── */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          padding: "16px 24px",
          position: "relative",
          zIndex: 10,
        }}
        aria-hidden="true"
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1180px",
            height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 20%, rgba(255, 90, 31, 0.35) 50%, rgba(255, 255, 255, 0.15) 80%, transparent 100%)",
          }}
        />
      </div>

      {/* ── 12. OLD STYLE OF FOOTER (BLACK BG & DOTTED TEXTURE - 100% READABLE) ── */}
      <footer
        style={{
          background: "#060408",
          color: "#FFFFFF",
          padding: "64px min(5vw, 64px) 44px",
          position: "relative",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          overflow: "hidden",
        }}
      >
        {/* Subtle Geometric Dotted Texture Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.18) 1.25px, transparent 1.25px)",
            backgroundSize: "22px 22px",
            backgroundPosition: "center",
            pointerEvents: "none",
            zIndex: 0,
            opacity: 0.85,
          }}
          aria-hidden="true"
        />

        {/* Giant Faint Background Watermark Text */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "clamp(90px, 15vw, 220px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            color: "rgba(255, 255, 255, 0.03)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            userSelect: "none",
            zIndex: 0,
            fontFamily: "var(--font-display), system-ui, sans-serif",
            lineHeight: 1,
          }}
        >
          SOLO NO MORE
        </div>

        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
            width: "100%",
          }}
        >
          {/* Main 4 Columns Grid (Direct Open Layout, Zero Dark Card Box) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "clamp(36px, 4vw, 56px)",
              marginBottom: "48px",
              width: "100%",
            }}
          >
            {/* Column 1: Brand Box & Bio & Instagram */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div
                  style={{
                    background: "#1A0E08",
                    border: "2px solid #FF5A1F",
                    boxShadow: "0 0 18px rgba(255, 90, 31, 0.4), inset 0 0 10px rgba(255, 90, 31, 0.2)",
                    borderRadius: "10px",
                    padding: "6px 12px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: "20px",
                    color: "#FF5A1F",
                    letterSpacing: "0.05em",
                  }}
                >
                  SNM
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-display), system-ui, sans-serif",
                      fontSize: "20px",
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                      color: "#FFFFFF",
                      lineHeight: 1.1,
                    }}
                  >
                    SOLO-NO-MORE
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      letterSpacing: "0.18em",
                      color: "#FF8A3D",
                      marginTop: "3px",
                    }}
                  >
                    GATHERINGS
                  </div>
                </div>
              </div>

              <p
                style={{
                  fontSize: "14px",
                  color: "rgba(255, 255, 255, 0.7)",
                  lineHeight: 1.6,
                  margin: "0 0 24px",
                  maxWidth: "360px",
                }}
              >
                Your gateway to exclusive events, premium experiences, and unforgettable moments nationwide. Join the revolution.
              </p>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  border: "1.2px solid rgba(255, 255, 255, 0.22)",
                  background: "rgba(255, 255, 255, 0.08)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  transition: "all 0.2s ease",
                  textDecoration: "none",
                }}
                className="hover:border-[#FF5A1F] hover:text-[#FF5A1F] hover:shadow-[0_0_16px_rgba(255,90,31,0.45)]"
                aria-label="Instagram"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  marginBottom: "20px",
                }}
              >
                <Ticket className="w-4 h-4 text-[#FF5A1F]" />
                <span>Explore</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", color: "rgba(255, 255, 255, 0.7)" }}>
                <Link href="/events" className="hover:text-[#FF8A3D] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Browse Events</Link>
                <Link href="/how-it-works" className="hover:text-[#FF8A3D] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>How Beacon Works</Link>
                <Link href="/memberships" className="hover:text-[#FF8A3D] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Memberships &amp; Packages</Link>
                <Link href="/about" className="hover:text-[#FF8A3D] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>About Our Mission</Link>
                <Link href="/contact" className="hover:text-[#FF8A3D] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Contact Us</Link>
              </div>
            </div>

            {/* Column 3: Partners & Legal */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  marginBottom: "20px",
                }}
              >
                <Crown className="w-4 h-4 text-[#FF5A1F]" />
                <span>Partners &amp; Legal</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", color: "rgba(255, 255, 255, 0.7)" }}>
                <Link href="/partners" className="hover:text-[#FF8A3D] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Partner Registration</Link>
                <Link href="/sell-tickets" className="hover:text-[#FF8A3D] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Sell Your Tickets &amp; Host</Link>
                <Link href="/terms" className="hover:text-[#FF8A3D] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Terms of Service</Link>
                <Link href="/privacy-and-refund" className="hover:text-[#FF8A3D] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Privacy &amp; Refund Policy</Link>
              </div>
            </div>

            {/* Column 4: Get in Touch */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  marginBottom: "20px",
                }}
              >
                <Music className="w-4 h-4 text-[#FF5A1F]" />
                <span>Get in Touch</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "14px", color: "rgba(255, 255, 255, 0.7)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Mail className="w-4 h-4 text-[#FF5A1F] shrink-0" />
                  <a href="mailto:thesolonomore@gmail.com" style={{ color: "inherit", textDecoration: "none" }} className="hover:text-[#FF8A3D] transition-colors">
                    thesolonomore@gmail.com
                  </a>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Smartphone className="w-4 h-4 text-[#FF5A1F] shrink-0" />
                  <a href="tel:03332877852" style={{ color: "inherit", textDecoration: "none" }} className="hover:text-[#FF8A3D] transition-colors">
                    03332877852
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div
            style={{
              paddingTop: "24px",
              borderTop: "1px solid rgba(255, 255, 255, 0.12)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "18px",
              fontSize: "13px",
              color: "rgba(255, 255, 255, 0.6)",
            }}
          >
            <div>© 2026 Solo-No-More. All rights reserved. Find Your People IRL.</div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            </div>
          </div>
        </div>
      </footer>

      {/* ── QHQ STYLE QUICK PREVIEW MODALS ── */}
      {previewEvent && (
        <EventQuickPreviewModal
          isOpen={!!previewEvent}
          onClose={() => setPreviewEvent(null)}
          event={previewEvent}
          isLoggedIn={isLoggedIn}
        />
      )}
      {previewBeacon && (
        <BeaconQuickPreviewModal
          isOpen={!!previewBeacon}
          onClose={() => setPreviewBeacon(null)}
          beacon={previewBeacon}
          isLoggedIn={isLoggedIn}
        />
      )}
    </div>
  );
}
