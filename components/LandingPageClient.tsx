"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import {
  Sparkles,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Camera,
  MessageSquare,
  Send,
  Zap,
  Flame,
  Ticket,
  Clock,
  Compass,
  Crown,
  Smartphone,
  Laptop,
  Radio,
  Search,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
  Star,
  Quote,
  Mic,
  Mail,
  DollarSign,
  Heart,
  Smile,
} from "lucide-react";

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

const TEMPLATES: TrendingTemplateItem[] = [
  {
    id: "chai-run",
    name: "Midnight Chai & Paratha",
    category: "Chai Run",
    badge: "LATE NIGHT",
    headline: "CHAI & PARATHA",
    subtext: "Quetta Alamgir · Clifton",
    location: "Block 4, Clifton",
    time: "Tonight · 11:30 PM",
    posterImg: "/images/beacon-chai.jpg",
    cardCanvasBg: "radial-gradient(ellipse at 50% 50%, rgba(255, 120, 40, 0.35) 0%, rgba(28, 14, 6, 0.95) 75%), linear-gradient(135deg, #241107 0%, #150904 100%)",
    accent: "#FF8A3D",
    posterBadge: "☕ CHAI RUN",
  },
  {
    id: "long-drive",
    name: "Long Drive to French Beach",
    category: "Long Drive",
    badge: "MIDNIGHT CRUISE",
    headline: "LONG DRIVE PLAN",
    subtext: "Do Darya to French Beach",
    location: "Do Darya Coastal Highway",
    time: "Saturday · 1:00 AM",
    posterImg: "/images/hero-image.jpg",
    cardCanvasBg: "radial-gradient(ellipse at 50% 50%, rgba(255, 90, 31, 0.3) 0%, rgba(15, 8, 26, 0.95) 75%), linear-gradient(135deg, #1C0F2B 0%, #0D0616 100%)",
    accent: "#FF5A1F",
    posterBadge: "🚗 MIDNIGHT DRIVE",
  },
  {
    id: "night-padel",
    name: "2v2 Night Padel Showdown",
    category: "Padel",
    badge: "COURT LIGHTS",
    headline: "NIGHT PADEL MATCH",
    subtext: "Smash Club DHA Phase 8",
    location: "DHA Phase 8, Karachi",
    time: "Tonight · 9:30 PM",
    posterImg: "/images/beacon-padel.jpg",
    cardCanvasBg: "radial-gradient(ellipse at 50% 50%, rgba(255, 90, 31, 0.28) 0%, rgba(7, 26, 18, 0.95) 75%), linear-gradient(135deg, #072218 0%, #03110C 100%)",
    accent: "#FF5A1F",
    posterBadge: "🎾 2v2 VETTED",
  },
  {
    id: "indoor-cricket",
    name: "Indoor Turf Cricket Night",
    category: "Indoor Cricket",
    badge: "TURF FLOODLIGHTS",
    headline: "TAPE-BALL SIXES",
    subtext: "Gulshan Arena Under Lights",
    location: "Gulshan-e-Iqbal Turf",
    time: "Sunday · 10:00 PM",
    posterImg: "/images/padel-squad.jpg",
    cardCanvasBg: "radial-gradient(ellipse at 50% 50%, rgba(255, 120, 30, 0.32) 0%, rgba(26, 14, 6, 0.95) 75%), linear-gradient(135deg, #241307 0%, #120803 100%)",
    accent: "#FFA05C",
    posterBadge: "🏏 TAPE-BALL SIXES",
  },
  {
    id: "rooftop-baithak",
    name: "Acoustic Rooftop Baithak",
    category: "Rooftop Baithak",
    badge: "FAIRY LIGHTS",
    headline: "ROOFTOP BAITHAK",
    subtext: "Acoustic Jam & Banter",
    location: "PECHS Block 6 Rooftop",
    time: "Friday · 9:00 PM",
    posterImg: "/images/hero-rooftop.jpg",
    cardCanvasBg: "radial-gradient(ellipse at 50% 50%, rgba(255, 90, 31, 0.3) 0%, rgba(30, 10, 22, 0.95) 75%), linear-gradient(135deg, #270D1E 0%, #13050E 100%)",
    accent: "#FF5A1F",
    posterBadge: "🎸 ACOUSTIC JAM",
  },
  {
    id: "quarter-life",
    name: "Quarter-Life Crisis / Birthday",
    category: "House Party",
    badge: "CHROME & NEON",
    headline: "QUARTER-LIFE CRISIS",
    subtext: "26th Birthday Bash & Cake",
    location: "DHA Phase 5, Karachi",
    time: "Saturday · 10:00 PM",
    posterImg: "/images/beacon-now-26.jpg",
    cardCanvasBg: "radial-gradient(ellipse at 50% 50%, rgba(255, 80, 140, 0.3) 0%, rgba(32, 8, 22, 0.95) 75%), linear-gradient(135deg, #2E0B1F 0%, #15040E 100%)",
    accent: "#FF6647",
    posterBadge: "🎂 BIRTHDAY BASH",
  },
];

// ─── ANIMATED REVIEWS & PRESS DATA (PARTNERS & COMMUNITY MEMBERS) ────────────

const PRESS_PARTNER_REVIEWS = [
  {
    quote: "The meetup platform replacing dead group chats.",
    source: "TECHCRUNCH",
    type: "partner",
    tag: "GLOBAL TECH PRESS",
    stars: 5,
  },
  {
    quote: "The IRL invite platform everyone is obsessed with.",
    source: "VOGUE",
    type: "partner",
    tag: "CULTURE & LIFESTYLE",
    stars: 5,
  },
  {
    quote: "Hangouts in Karachi are officially back.",
    source: "DAWN IMAGES",
    type: "partner",
    tag: "LOCAL SPOTLIGHT",
    stars: 5,
  },
  {
    quote: "Frictionless, beautiful, and actually fun.",
    source: "THE VERGE",
    type: "partner",
    tag: "TECH EDITORIAL",
    stars: 5,
  },
  {
    quote: "How Gen-Z in Karachi is ditching algorithms for real scenes.",
    source: "PROPAKISTANI",
    type: "partner",
    tag: "COMMUNITY REPORT",
    stars: 5,
  },
  {
    quote: "The antidote to Karachi's social isolation and flaky plans.",
    source: "THE EXPRESS TRIBUNE",
    type: "partner",
    tag: "CULTURE DESK",
    stars: 5,
  },
];

const COMMUNITY_HOST_REVIEWS = [
  {
    quote: "Hosted 18 padel sessions on Solo No More. Never had an awkward flake or court fee dispute.",
    author: "Bilal Khan",
    handle: "@bilalpadel",
    role: "DHA Padel Host (18 sessions)",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces",
    stars: 5,
    zone: "Clifton Phase 8",
  },
  {
    quote: "Found my entire creative circle here in two weeks. Group chats are completely dead for me now.",
    author: "Ayesha Malik",
    handle: "@ayeshamk",
    role: "Sunset Chai Club Host",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces",
    stars: 5,
    zone: "Clifton",
  },
  {
    quote: "Dropped a beacon for an acoustic rooftop jam at 6 PM. Had 14 curated people singing by 9 PM.",
    author: "Daniyal Raza",
    handle: "@daniyalr",
    role: "PECHS Rooftop Host",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces",
    stars: 5,
    zone: "PECHS Block 6",
  },
  {
    quote: "Guest vetting and Raast split make hosting so stress-free. 10/10 vibe every single time.",
    author: "Mahnoor Sheikh",
    handle: "@mahnoors",
    role: "Boardgames & Coffee Host",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=faces",
    stars: 5,
    zone: "E-Street DHA",
  },
  {
    quote: "Midnight chai runs and 10k midnight runs are actually happening now. Instant RSVP changes everything.",
    author: "Hamza Tariq",
    handle: "@hamzat",
    role: "Karachi Night Runner",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop&crop=faces",
    stars: 5,
    zone: "Sea View / DHA",
  },
];

// ─── TABS & EVENT DATA ───────────────────────────────────────────────────────

export const GUEST_AVATARS = [
  { name: "Omar", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces" },
  { name: "Ayla", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces" },
  { name: "Bilal", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces" },
  { name: "Zara", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=faces" },
  { name: "Hamza", img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop&crop=faces" },
  { name: "Fatima", img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&h=120&fit=crop&crop=faces" },
  { name: "Daniyal", img: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&h=120&fit=crop&crop=faces" },
];

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

const EVENT_PREVIEWS: Record<
  EventCategory,
  {
    title: string;
    date: string;
    time: string;
    host: string;
    hostRole: string;
    hostAvatar: string;
    location: string;
    addressDetail: string;
    description: string;
    goingCount: number;
    maybeCount: number;
    cantGoCount: number;
    flyerBadge: string;
    flyerColor: string;
    defaultPoster: string;
    gradientBg: string;
  }
> = {
  birthday: {
    title: "26th Birthday Bash",
    date: "Friday, April 5",
    time: "6:00pm",
    host: "Sarah K.",
    hostRole: "Birthday Host · Clifton",
    hostAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces",
    location: "RSVP to see location",
    addressDetail: "Secret Rooftop, Clifton Block 4, Karachi",
    description: "Celebrate the end of being on my parents health insurance!",
    goingCount: 16,
    maybeCount: 2,
    cantGoCount: 0,
    flyerBadge: "NOW 26",
    flyerColor: "#FF4D2D",
    defaultPoster: "/images/beacon-now-26.jpg",
    gradientBg: "radial-gradient(ellipse at 75% 45%, rgba(217, 70, 239, 0.35) 0%, rgba(249, 115, 22, 0.28) 35%, rgba(15, 14, 23, 0.98) 75%), linear-gradient(135deg, #181424 0%, #100E17 100%)",
  },
  padel: {
    title: "Midnight Blue Court Padel Smash",
    date: "Tomorrow, Oct 14",
    time: "10:00pm",
    host: "Aisha M.",
    hostRole: "Padel Captain · 8 Matches",
    hostAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces",
    location: "Velocity Padel, Clifton",
    addressDetail: "Court 2, Marine Drive, Clifton, Karachi",
    description: "Friendly doubles tournament under stadium floodlights. Racquets and balls provided! Losers buy the chai afterwards.",
    goingCount: 8,
    maybeCount: 3,
    cantGoCount: 1,
    flyerBadge: "10 PM",
    flyerColor: "#FF5A1F",
    defaultPoster: "/images/beacon-padel.jpg",
    gradientBg: "radial-gradient(ellipse at 75% 45%, rgba(0, 229, 255, 0.28) 0%, rgba(255, 90, 31, 0.25) 35%, rgba(7, 25, 18, 0.98) 75%), linear-gradient(135deg, #071912 0%, #06150F 100%)",
  },
  chai: {
    title: "Late Night Chai & Paratha Run",
    date: "Tonight, Oct 13",
    time: "11:00pm",
    host: "Zain K.",
    hostRole: "Community Lead · DHA",
    hostAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces",
    location: "Chai Shai, DHA Phase 6",
    addressDetail: "Main Saba Commercial, DHA Phase 6, Karachi",
    description: "Talking tech startups, creative design, and city life over hot elaichi chai and nutella parathas. Everyone welcome!",
    goingCount: 14,
    maybeCount: 5,
    cantGoCount: 0,
    flyerBadge: "CHAI RUN",
    flyerColor: "#FF8A3D",
    defaultPoster: "/images/beacon-chai.jpg",
    gradientBg: "radial-gradient(ellipse at 75% 45%, rgba(255, 90, 31, 0.38) 0%, rgba(234, 88, 12, 0.25) 35%, rgba(30, 18, 8, 0.98) 75%), linear-gradient(135deg, #1E1208 0%, #150D05 100%)",
  },
  gig: {
    title: "Secret Warehouse Techno Session",
    date: "Saturday, Oct 18",
    time: "10:30pm",
    host: "DJ Rumi",
    hostRole: "Curator · District 19",
    hostAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces",
    location: "District 19, Korangi Industrial, Karachi",
    addressDetail: "Plot 19, Sector 23, Korangi Industrial, Karachi",
    description: "Underground deep house and modular synth sets. Exclusive guestlist vetted beforehand; QR pass verified via Raast.",
    goingCount: 42,
    maybeCount: 12,
    cantGoCount: 4,
    flyerBadge: "LIVE SET",
    flyerColor: "#FF5A1F",
    defaultPoster: "/images/hero-rooftop.jpg",
    gradientBg: "radial-gradient(ellipse at 75% 45%, rgba(147, 51, 234, 0.35) 0%, rgba(255, 90, 31, 0.22) 35%, rgba(19, 17, 26, 0.98) 75%), linear-gradient(135deg, #13111A 0%, #0E0C13 100%)",
  },
  dinner: {
    title: "Burns Road Midnight Food Crawl",
    date: "Sunday, Oct 19",
    time: "7:00pm",
    host: "Mariam S.",
    hostRole: "Food Enthusiast · Saddar",
    hostAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=faces",
    location: "Burns Road, Saddar, Karachi",
    addressDetail: "Waheed Kabab Lane, Burns Road, Saddar, Karachi",
    description: "Waheed Fry Kabab, steaming Delhi Rabri, and fresh lassi. Comfortable walking shoes and big appetite required!",
    goingCount: 11,
    maybeCount: 4,
    cantGoCount: 1,
    flyerBadge: "FOOD CRAWL",
    flyerColor: "#FF4D2D",
    defaultPoster: "/images/chai-cafe.jpg",
    gradientBg: "radial-gradient(ellipse at 75% 45%, rgba(255, 90, 31, 0.32) 0%, rgba(234, 88, 12, 0.2) 35%, rgba(26, 13, 8, 0.98) 75%), linear-gradient(135deg, #1A0D08 0%, #120A06 100%)",
  },
  games: {
    title: "Catan & Secret Hitler Strategy Night",
    date: "Saturday, Oct 25",
    time: "8:00pm",
    host: "Bilal T.",
    hostRole: "Boardgame Master · Clifton",
    hostAvatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop&crop=faces",
    location: "Deli, E-Street, Clifton",
    addressDetail: "Plot 4/A, E-Street, Block 4, Clifton, Karachi",
    description: "Strategy board games in a relaxed coffee lounge. Beginners welcomed, rules explained in 5 minutes over iced espresso.",
    goingCount: 6,
    maybeCount: 2,
    cantGoCount: 0,
    flyerBadge: "GAME NIGHT",
    flyerColor: "#00E5FF",
    defaultPoster: "/images/beacon-now-26.jpg",
    gradientBg: "radial-gradient(ellipse at 75% 45%, rgba(59, 130, 246, 0.3) 0%, rgba(255, 90, 31, 0.25) 35%, rgba(15, 23, 42, 0.98) 75%), linear-gradient(135deg, #091319 0%, #071015 100%)",
  },
};

export default function LandingPageClient() {
  const [activeCategory, setActiveCategory] = useState<EventCategory>("birthday");
  const [activeRsvp, setActiveRsvp] = useState<"going" | "maybe" | "cantGo" | null>("going");
  const [selectedTemplate, setSelectedTemplate] = useState<TrendingTemplateItem>(TEMPLATES[0]);

  // Beacons Carousel Ref & Cursor Drag Scroll State
  const carouselRef = useRef<HTMLDivElement>(null);
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

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
      const scrollAmount = direction === "left" ? -300 : 300;
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
      
      {/* ── 2. NAVBAR (EDGE-TO-EDGE, 100% TRANSPARENT, CLICKABLE TABS, NO SKIN BUTTON) ── */}
      <header
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          background: "transparent",
          padding: "20px 48px",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left: Brand Logo on far-left edge */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }} className="cursor-pointer">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.6))" }}>
            <path d="M14 3C8.477 3 4 7.477 4 13C4 16.866 6.189 20.216 9.4 21.895L7.8 25L13.5 24.2C13.666 24.215 13.832 24.223 14 24.223C19.523 24.223 24 19.746 24 14.223C24 8.7 19.523 3 14 3Z" fill="white" />
            <circle cx="14" cy="13" r="4" fill="#FF5A1F" />
          </svg>
          <span
            style={{
              fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: "26px",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: "#FFFFFF",
              textShadow: "0 2px 10px rgba(0, 0, 0, 0.8)",
            }}
          >
            solo-no-more
          </span>
        </Link>

        {/* Center: Interactive, Clickable Navbar Tabs */}
        <nav className="hidden lg:flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleNavClick("gig")}
            style={{
              color: "#FFA05C",
              fontWeight: 800,
              fontSize: "14px",
              textShadow: "0 1px 4px rgba(0, 0, 0, 0.95), 0 2px 10px rgba(0, 0, 0, 0.75)",
              background: "transparent",
              border: "none",
              padding: "8px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              letterSpacing: "-0.01em",
              transition: "all 0.15s ease",
            }}
            className="hover:bg-white/10 active:scale-95 cursor-pointer"
          >
            Halloween
          </button>
          <button
            type="button"
            onClick={() => handleNavClick("birthday")}
            style={{
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "14px",
              textShadow: "0 1px 4px rgba(0, 0, 0, 0.95), 0 2px 10px rgba(0, 0, 0, 0.75)",
              background: "transparent",
              border: "none",
              padding: "8px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              letterSpacing: "-0.01em",
              transition: "all 0.15s ease",
            }}
            className="hover:bg-white/10 active:scale-95 cursor-pointer"
          >
            Birthdays
          </button>
          <button
            type="button"
            onClick={() => handleNavClick("dinner")}
            style={{
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "14px",
              textShadow: "0 1px 4px rgba(0, 0, 0, 0.95), 0 2px 10px rgba(0, 0, 0, 0.75)",
              background: "transparent",
              border: "none",
              padding: "8px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              letterSpacing: "-0.01em",
              transition: "all 0.15s ease",
            }}
            className="hover:bg-white/10 active:scale-95 cursor-pointer"
          >
            Dinners
          </button>
          <button
            type="button"
            onClick={() => handleNavClick("gig")}
            style={{
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "14px",
              textShadow: "0 1px 4px rgba(0, 0, 0, 0.95), 0 2px 10px rgba(0, 0, 0, 0.75)",
              background: "transparent",
              border: "none",
              padding: "8px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              letterSpacing: "-0.01em",
              transition: "all 0.15s ease",
            }}
            className="hover:bg-white/10 active:scale-95 cursor-pointer"
          >
            Housewarmings
          </button>
          <Link
            href="/dashboard/partner"
            style={{
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "14px",
              textShadow: "0 1px 4px rgba(0, 0, 0, 0.95), 0 2px 10px rgba(0, 0, 0, 0.75)",
              textDecoration: "none",
              padding: "8px 14px",
              borderRadius: "8px",
              letterSpacing: "-0.01em",
              transition: "all 0.15s ease",
            }}
            className="hover:bg-white/10 active:scale-95 cursor-pointer"
          >
            For Orgs
          </Link>
          <Link
            href="/dashboard/upgrade"
            style={{
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "14px",
              textShadow: "0 1px 4px rgba(0, 0, 0, 0.95), 0 2px 10px rgba(0, 0, 0, 0.75)",
              textDecoration: "none",
              padding: "8px 14px",
              borderRadius: "8px",
              letterSpacing: "-0.01em",
              transition: "all 0.15s ease",
            }}
            className="hover:bg-white/10 active:scale-95 cursor-pointer"
          >
            Sell Tickets
          </Link>
          <button
            type="button"
            onClick={() => handleNavClick(activeCategory, "events-section")}
            style={{
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "14px",
              textShadow: "0 1px 4px rgba(0, 0, 0, 0.95), 0 2px 10px rgba(0, 0, 0, 0.75)",
              background: "transparent",
              border: "none",
              padding: "8px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              letterSpacing: "-0.01em",
              transition: "all 0.15s ease",
            }}
            className="hover:bg-white/10 active:scale-95 cursor-pointer"
          >
            Explore
          </button>
        </nav>

        {/* Right Action Buttons (NO SKIN BUTTON, 8px Partiful Style Login + Create) */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          <Link
            href="/login"
            style={{
              background: "rgba(18, 18, 24, 0.78)",
              border: "1px solid rgba(255, 255, 255, 0.22)",
              color: "#FFFFFF",
              fontSize: "14px",
              fontWeight: 800,
              textDecoration: "none",
              padding: "8px 20px",
              borderRadius: "8px",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.3)",
              transition: "background 0.15s ease, transform 0.15s ease",
            }}
            className="hover:bg-white/20 active:scale-95 cursor-pointer"
          >
            Login
          </Link>
          <Link
            href="/apply"
            style={{
              background: "#FFFFFF",
              color: "#000000",
              fontSize: "14px",
              fontWeight: 800,
              padding: "8px 22px",
              borderRadius: "8px",
              textDecoration: "none",
              boxShadow: "0 4px 18px rgba(0, 0, 0, 0.35)",
              transition: "transform 0.15s ease, background 0.15s ease",
            }}
            className="hover:bg-gray-100 hover:scale-105 active:scale-95 cursor-pointer"
          >
            Create
          </Link>
        </div>
      </header>

      {/* ── 3. HERO SECTION (TEXTURED FILM GRAIN + ORANGE/BLACK GRADIENT + USER PHOTO) ── */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          minHeight: "720px",
          display: "flex",
          alignItems: "center",
          background: "#050507",
          paddingTop: "100px",
        }}
      >
        {/* Right Photography Layer: User's Hero Image (Extended width so left person is fully inside frame) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: "70%",
            backgroundImage: "url('/images/hero-image.jpg')",
            backgroundPosition: "center right",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Pure Black and Orange Atmospheric Gradient Overlay (Shifted left so left person in photo is clearly visible) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
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
            pointerEvents: "none",
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
          style={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            padding: "40px 48px 80px",
          }}
        >
          <div style={{ maxWidth: "600px" }}>
            
            {/* Rating Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255, 255, 255, 0.16)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                padding: "6px 14px",
                borderRadius: "9999px",
                fontSize: "13px",
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "0.02em",
                marginBottom: "24px",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
              }}
            >
              <span style={{ fontSize: "14px", letterSpacing: "2px", color: "#FFA578" }}>★★★★★</span>
              <span>200k+ ratings</span>
            </div>

            {/* Giant Headline: "Parties are back" (Exact Partiful Font & Weight) */}
            <h1
              style={{
                fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
                fontSize: "clamp(58px, 8.5vw, 102px)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 0.94,
                color: "#FFFFFF",
                margin: "0 0 20px",
              }}
            >
              Parties<br />
              are back
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: "clamp(18px, 2.2vw, 22px)",
                lineHeight: 1.45,
                color: "rgba(255, 255, 255, 0.94)",
                fontWeight: 600,
                maxWidth: "460px",
                margin: "0 0 34px",
              }}
            >
              The easiest way to get your guests on the same page
            </p>

            {/* CTA Button (Exact Partiful Style: White background, Black text, 8px radius) */}
            <Link
              href="/apply"
              style={{
                background: "#FFFFFF",
                color: "#000000",
                fontSize: "16px",
                fontWeight: 800,
                padding: "14px 28px",
                borderRadius: "8px",
                textDecoration: "none",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.45)",
                display: "inline-block",
                transition: "transform 0.15s ease, background 0.15s ease",
              }}
              className="hover:bg-gray-100 hover:scale-105 active:scale-95 cursor-pointer"
            >
              Create invite
            </Link>

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
                    SAT 25 OCT • 9:30P
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
                    12/16 (4 Left)
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
                    +11 joined
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
            <span>REAL-WORLD SOCIAL DISCOVERY IN KARACHI</span>
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
            <span>REAL KARACHI SQUADS · ZERO FOLLOWER ALGORITHMS · ZERO GHOSTING</span>
          </span>
          <span className="text-black font-black select-none">★</span>
          <span className="inline-flex items-center gap-2 font-black text-black">
            <span className="pf-ticker-badge">📍 LOCAL HOTSPOTS</span>
            <span>CLIFTON · DHA · PECHS · KARACHI</span>
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
            <span>REAL-WORLD SOCIAL DISCOVERY IN KARACHI</span>
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
            <span>REAL KARACHI SQUADS · ZERO FOLLOWER ALGORITHMS · ZERO GHOSTING</span>
          </span>
          <span className="text-black font-black select-none">★</span>
          <span className="inline-flex items-center gap-2 font-black text-black">
            <span className="pf-ticker-badge">📍 LOCAL HOTSPOTS</span>
            <span>CLIFTON · DHA · PECHS · KARACHI</span>
          </span>
          <span className="text-black font-black select-none">●</span>
          <span className="inline-flex items-center gap-2 font-black text-black">
            <span className="pf-ticker-badge">🔥 SOLO NO MORE</span>
            <span>STOP SCROLLING · MEET YOUR PEOPLE IN REAL LIFE</span>
          </span>
        </div>
      </div>

      {/* ── 4. REAL-TIME INTERACTIVE APP SIMULATOR (DESKTOP & MOBILE MOCKUPS) ───── */}
      <section
        id="events-section"
        style={{
          padding: "90px 20px 100px",
          maxWidth: "1240px",
          margin: "0 auto",
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* Section Pill Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            background: "rgba(255, 90, 31, 0.12)",
            border: "1px solid rgba(255, 90, 31, 0.3)",
            padding: "5px 14px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 800,
            color: "#FF5A1F",
            marginBottom: "16px",
            letterSpacing: "0.04em",
          }}
        >
          <Sparkles className="w-3.5 h-3.5" /> REAL-TIME APP SIMULATOR
        </div>

        {/* Heading & Subtitle */}
        <h2
          style={{
            fontFamily: "var(--font-display), system-ui, sans-serif",
            fontSize: "clamp(32px, 5vw, 54px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            margin: "0 0 14px",
            color: "#FFFFFF",
            lineHeight: 1.15,
          }}
        >
          Drop a Beacon. Meet in Real Life.
        </h2>

        <p
          style={{
            fontSize: "17.5px",
            color: "rgba(255, 255, 255, 0.65)",
            margin: "0 auto 36px",
            maxWidth: "620px",
            fontWeight: 500,
          }}
        >
          Experience both ways Solo No More works: broadcast your own IRL scene in 60 seconds, or discover and join active squads across Karachi.
        </p>

        {/* Clean Integrated Control Bar: Workflow Selector + Device Selector */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            flexWrap: "wrap",
            padding: "6px 10px",
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            backdropFilter: "blur(12px)",
            marginBottom: "40px",
          }}
        >
          {/* Workflow Mode Tabs */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(0, 0, 0, 0.5)", padding: "4px", borderRadius: "10px" }}>
            <button
              type="button"
              onClick={() => { setSimulatorAction("create"); setBeaconBroadcasted(false); }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                background: simulatorAction === "create" ? "linear-gradient(135deg, #FF6B35, #FF5A1F)" : "transparent",
                color: simulatorAction === "create" ? "#FFFFFF" : "rgba(255, 255, 255, 0.7)",
                transition: "all 0.18s ease",
                boxShadow: simulatorAction === "create" ? "0 4px 14px rgba(255, 90, 31, 0.4)" : "none",
              }}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>1. How Users Create Beacons</span>
            </button>

            <button
              type="button"
              onClick={() => setSimulatorAction("join")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                background: simulatorAction === "join" ? "linear-gradient(135deg, #FF6B35, #FF5A1F)" : "transparent",
                color: simulatorAction === "join" ? "#FFFFFF" : "rgba(255, 255, 255, 0.7)",
                transition: "all 0.18s ease",
                boxShadow: simulatorAction === "join" ? "0 4px 14px rgba(255, 90, 31, 0.4)" : "none",
              }}
            >
              <Users className="w-3.5 h-3.5" />
              <span>2. How Users Join Beacons</span>
            </button>
          </div>

          <div style={{ width: "1px", height: "24px", background: "rgba(255, 255, 255, 0.15)" }} className="hidden sm:block" />

          {/* Device Showcase Switcher */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(0, 0, 0, 0.5)", padding: "4px", borderRadius: "10px" }}>
            <button
              type="button"
              onClick={() => setDeviceVersion("desktop")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                background: deviceVersion === "desktop" ? "rgba(255, 255, 255, 0.18)" : "transparent",
                color: deviceVersion === "desktop" ? "#FFFFFF" : "rgba(255, 255, 255, 0.65)",
                transition: "all 0.15s ease",
              }}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Desktop Web View</span>
            </button>

            <button
              type="button"
              onClick={() => setDeviceVersion("mobile")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                background: deviceVersion === "mobile" ? "rgba(255, 255, 255, 0.18)" : "transparent",
                color: deviceVersion === "mobile" ? "#FFFFFF" : "rgba(255, 255, 255, 0.65)",
                transition: "all 0.15s ease",
              }}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Phone View</span>
            </button>
          </div>
        </div>

        {/* ── VERSION 1: DESKTOP WEB STUDIO WINDOW MOCKUP ── */}
        {deviceVersion === "desktop" && (
          <div className="pf-desktop-window">
            {/* Window Browser Titlebar with Traffic Lights */}
            <div className="pf-window-titlebar">
              <div className="pf-window-dots">
                <span className="pf-window-dot red" />
                <span className="pf-window-dot yellow" />
                <span className="pf-window-dot green" />
              </div>

              <div className="pf-window-url">
                <span style={{ color: "#27C93F", fontSize: "10px" }}>🔒</span>
                <span>solonomore.com/karachi/{simulatorAction === "create" ? "host" : "radar"}</span>
                <span style={{ color: "#FF5A1F", fontWeight: 800, fontSize: "10px", marginLeft: "8px" }}>
                  ● LIVE KARACHI RADAR
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "rgba(255, 255, 255, 0.6)" }}>
                <span style={{ background: "rgba(255, 90, 31, 0.2)", color: "#FF8A3D", padding: "2px 8px", borderRadius: "4px", fontWeight: 800 }}>
                  CLIFTON · DHA
                </span>
              </div>
            </div>

            {/* Desktop Mockup Interior Container */}
            <div style={{ background: "#0B0912", minHeight: "560px", color: "#FFFFFF" }}>
              {/* Desktop Internal Navigation */}
              <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                  <span style={{ color: "#FF5A1F", fontWeight: 900, fontSize: "18px", letterSpacing: "-0.03em" }}>
                    solo-no-more
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "13px", fontWeight: 700 }}>
                    <span style={{ color: simulatorAction === "join" ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)", borderBottom: simulatorAction === "join" ? "2px solid #FF5A1F" : "none", paddingBottom: "4px" }}>
                      Live Radar Feed
                    </span>
                    <span style={{ color: simulatorAction === "create" ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)", borderBottom: simulatorAction === "create" ? "2px solid #FF5A1F" : "none", paddingBottom: "4px" }}>
                      Drop a Beacon
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#27C93F" }} />
                  <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", fontWeight: 600 }}>14 Members Active Near You</span>
                </div>
              </div>

              {/* ── DESKTOP FLOW A: HOW TO CREATE A BEACON (INTERACTIVE STUDIO) ── */}
              {simulatorAction === "create" && (
                <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "28px", padding: "32px 36px" }}>
                  {/* Left Column: Interactive Form Controls */}
                  <div>
                    <div style={{ marginBottom: "20px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 900, color: "#FF5A1F", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        STEP 1 OF 2 · BROADCAST STUDIO
                      </span>
                      <h3 style={{ fontSize: "22px", fontWeight: 800, margin: "4px 0 6px", color: "#FFFFFF" }}>
                        What scene are you creating?
                      </h3>
                      <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.65)", margin: 0 }}>
                        Click a category below to test how hosts set up real meetups in 60 seconds:
                      </p>
                    </div>

                    {/* Vibe / Category Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "22px" }}>
                      {[
                        { id: "sports", glyph: "🎾", label: "Sports & Padel", sub: "Padel, gym, turf" },
                        { id: "casual", glyph: "☕", label: "Chai & Food", sub: "Cafes, chai runs" },
                        { id: "nightlife", glyph: "⚡", label: "Nightlife & Gigs", sub: "Rooftops, warehouse" },
                      ].map((item) => {
                        const isSelected = createCategory === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectSimCategory(item.id as "sports" | "casual" | "nightlife")}
                            style={{
                              padding: "14px 12px",
                              borderRadius: "12px",
                              background: isSelected ? "rgba(255, 90, 31, 0.18)" : "rgba(255, 255, 255, 0.04)",
                              border: isSelected ? "2px solid #FF5A1F" : "1px solid rgba(255, 255, 255, 0.1)",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              textAlign: "center",
                            }}
                          >
                            <div style={{ fontSize: "24px", marginBottom: "4px" }}>{item.glyph}</div>
                            <div style={{ fontSize: "13px", fontWeight: 800, color: isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.85)" }}>{item.label}</div>
                            <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.5)", marginTop: "2px" }}>{item.sub}</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Scene Title Input */}
                    <div style={{ marginBottom: "18px" }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255, 255, 255, 0.8)", marginBottom: "6px" }}>
                        Beacon Title
                      </label>
                      <input
                        type="text"
                        value={createTitle}
                        onChange={(e) => { setCreateTitle(e.target.value); setBeaconBroadcasted(false); }}
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          borderRadius: "10px",
                          background: "rgba(255, 255, 255, 0.06)",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          color: "#FFFFFF",
                          fontSize: "14px",
                          fontWeight: 700,
                          outline: "none",
                        }}
                      />
                    </div>

                    {/* Venue & Slots Row */}
                    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "12px", marginBottom: "26px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255, 255, 255, 0.8)", marginBottom: "6px" }}>
                          Venue / Location
                        </label>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "10px", padding: "10px 12px" }}>
                          <MapPin className="w-4 h-4 text-[#FF5A1F]" />
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF" }}>{createLocation}</span>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255, 255, 255, 0.8)", marginBottom: "6px" }}>
                          Slots Needed
                        </label>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "10px", padding: "8px 12px" }}>
                          <button
                            type="button"
                            onClick={() => setCreateSlots((s) => Math.max(2, s - 1))}
                            style={{ width: "24px", height: "24px", borderRadius: "4px", background: "rgba(255,255,255,0.1)", border: "none", color: "#FFF", cursor: "pointer", fontWeight: 800 }}
                          >
                            -
                          </button>
                          <span style={{ fontSize: "14px", fontWeight: 800, color: "#FF5A1F" }}>{createSlots} spots</span>
                          <button
                            type="button"
                            onClick={() => setCreateSlots((s) => Math.min(20, s + 1))}
                            style={{ width: "24px", height: "24px", borderRadius: "4px", background: "rgba(255,255,255,0.1)", border: "none", color: "#FFF", cursor: "pointer", fontWeight: 800 }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Big Action Button */}
                    {!beaconBroadcasted ? (
                      <button
                        type="button"
                        onClick={() => setBeaconBroadcasted(true)}
                        style={{
                          width: "100%",
                          padding: "14px",
                          borderRadius: "12px",
                          background: "linear-gradient(135deg, #FF6B35, #FF5A1F)",
                          color: "#FFFFFF",
                          fontWeight: 900,
                          fontSize: "15px",
                          border: "none",
                          cursor: "pointer",
                          boxShadow: "0 8px 25px rgba(255, 90, 31, 0.45)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          transition: "all 0.15s ease",
                        }}
                        className="hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Radio className="w-4 h-4 animate-pulse" />
                        <span>🚀 Broadcast Beacon to Karachi (Free)</span>
                      </button>
                    ) : (
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          type="button"
                          onClick={() => setBeaconBroadcasted(false)}
                          style={{
                            flex: 1,
                            padding: "12px",
                            borderRadius: "10px",
                            background: "rgba(255, 255, 255, 0.1)",
                            color: "#FFFFFF",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            fontWeight: 700,
                            fontSize: "13px",
                            cursor: "pointer",
                          }}
                        >
                          ✏️ Edit Beacon
                        </button>
                        <button
                          type="button"
                          onClick={() => setSimulatorAction("join")}
                          style={{
                            flex: 1.5,
                            padding: "12px",
                            borderRadius: "10px",
                            background: "#27C93F",
                            color: "#000000",
                            border: "none",
                            fontWeight: 900,
                            fontSize: "13px",
                            cursor: "pointer",
                            boxShadow: "0 4px 15px rgba(39, 201, 63, 0.4)",
                          }}
                        >
                          🎟️ View as Guest (Test Joining) →
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Live Output & Radar Pulse Stage */}
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                    {!beaconBroadcasted ? (
                      /* Live Preview Card */
                      <div
                        style={{
                          width: "100%",
                          borderRadius: "20px",
                          background: "radial-gradient(ellipse at 70% 40%, rgba(255, 90, 31, 0.25) 0%, rgba(18, 14, 25, 0.98) 75%)",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          padding: "24px",
                          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 800, background: "rgba(255, 90, 31, 0.2)", color: "#FF8A3D", padding: "3px 10px", borderRadius: "6px" }}>
                            PREVIEW CARD
                          </span>
                          <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)" }}>{createTime}</span>
                        </div>

                        <div style={{ width: "100%", height: "170px", borderRadius: "14px", overflow: "hidden", marginBottom: "16px", background: "#000" }}>
                          <img
                            src={createCategory === "sports" ? "/images/beacon-padel.jpg" : createCategory === "casual" ? "/images/beacon-chai.jpg" : "/images/beacon-now-26.jpg"}
                            alt="Beacon flyer"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>

                        <h4 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 8px", color: "#FFFFFF" }}>{createTitle}</h4>
                        <div style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.7)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <MapPin className="w-3.5 h-3.5 text-[#FF5A1F]" />
                          <span>{createLocation}</span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "12px", fontSize: "12px" }}>
                          <span style={{ color: "#27C93F", fontWeight: 700 }}>● Ready to broadcast</span>
                          <span style={{ color: "#FF8A3D", fontWeight: 800 }}>{createSlots} spots open</span>
                        </div>
                      </div>
                    ) : (
                      /* Live Radar Celebration Screen */
                      <div
                        style={{
                          width: "100%",
                          borderRadius: "20px",
                          background: "radial-gradient(circle, rgba(255, 90, 31, 0.25) 0%, rgba(11, 9, 18, 0.98) 75%)",
                          border: "2px solid #FF5A1F",
                          padding: "36px 24px",
                          textAlign: "center",
                          position: "relative",
                          overflow: "hidden",
                          boxShadow: "0 0 50px rgba(255, 90, 31, 0.35)",
                        }}
                      >
                        {/* Radar Waves Animation */}
                        <div style={{ position: "relative", width: "100px", height: "100px", margin: "0 auto 20px", display: "grid", placeItems: "center" }}>
                          <div className="pf-radar-wave" style={{ width: "100px", height: "100px" }} />
                          <div className="pf-radar-wave" style={{ width: "70px", height: "70px", animationDelay: "0.6s" }} />
                          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#FF5A1F", display: "grid", placeItems: "center", zIndex: 10, boxShadow: "0 0 20px #FF5A1F" }}>
                            <Radio className="w-6 h-6 text-black" />
                          </div>
                        </div>

                        <span style={{ fontSize: "11px", fontWeight: 900, background: "#27C93F", color: "#000", padding: "3px 10px", borderRadius: "4px", letterSpacing: "0.08em" }}>
                          LIVE IN CLIFTON
                        </span>

                        <h4 style={{ fontSize: "20px", fontWeight: 900, margin: "12px 0 6px", color: "#FFFFFF" }}>
                          Beacon is Live on Radar!
                        </h4>

                        <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.75)", margin: "0 0 18px" }}>
                          ⚡ 14 nearby Karachi members notified instantly. Attendees are RSVPing now.
                        </p>

                        <div style={{ background: "rgba(0, 0, 0, 0.6)", padding: "10px 14px", borderRadius: "8px", fontSize: "12px", fontFamily: "monospace", color: "#FF8A3D", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span>solonomore.com/b/padel-clifton</span>
                          <span style={{ color: "#FFF", fontSize: "11px", background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px" }}>Link Ready</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── DESKTOP FLOW B: HOW TO JOIN A BEACON (INTERACTIVE GUEST EXPERIENCE) ── */}
              {simulatorAction === "join" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "28px", padding: "32px 36px" }}>
                  {/* Left Column: Karachi Radar Feed of Active Beacons */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255, 255, 255, 0.8)" }}>
                        KARACHI RADAR FEED (4 LIVE)
                      </span>
                      <span style={{ fontSize: "11px", color: "#27C93F", fontWeight: 700 }}>● Auto-refreshing</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {SIMULATOR_BEACONS.map((beacon) => {
                        const isSelected = activeBeaconId === beacon.id;
                        const rsvp = userJoinedStatus[beacon.id];
                        return (
                          <div
                            key={beacon.id}
                            onClick={() => setActiveBeaconId(beacon.id)}
                            style={{
                              padding: "14px",
                              borderRadius: "14px",
                              background: isSelected ? "rgba(255, 90, 31, 0.15)" : "rgba(255, 255, 255, 0.04)",
                              border: isSelected ? "2px solid #FF5A1F" : "1px solid rgba(255, 255, 255, 0.1)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <img src={beacon.poster} alt={beacon.title} style={{ width: "52px", height: "52px", borderRadius: "10px", objectFit: "cover" }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                                <span style={{ fontSize: "10px", fontWeight: 800, color: "#FF5A1F" }}>{beacon.categoryGlyph} {beacon.categoryLabel}</span>
                                <span style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.5)" }}>· {beacon.date}</span>
                              </div>
                              <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {beacon.title}
                              </div>
                              <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.6)", marginTop: "2px" }}>
                                {beacon.location} · {beacon.totalSlots - beacon.filledSlots} spots left
                              </div>
                            </div>
                            {rsvp === "going" && (
                              <span style={{ fontSize: "11px", fontWeight: 900, background: "#27C93F", color: "#000", padding: "2px 8px", borderRadius: "4px" }}>
                                JOINED
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Interactive Guest Beacon Card & 3 Circular RSVP Discs */}
                  <div
                    style={{
                      borderRadius: "24px",
                      background: currentSimulatorBeacon.gradientBg,
                      border: "1px solid rgba(255, 255, 255, 0.18)",
                      padding: "30px",
                      boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      {/* Top Meta Tag */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 800, color: "#FF8A3D", background: "rgba(255, 90, 31, 0.2)", padding: "3px 10px", borderRadius: "6px" }}>
                          {currentSimulatorBeacon.categoryGlyph} {currentSimulatorBeacon.categoryLabel} MEETUP
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF" }}>
                          {currentSimulatorBeacon.date} · {currentSimulatorBeacon.time}
                        </span>
                      </div>

                      {/* Title & Host */}
                      <h3 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 10px", color: "#FFFFFF", lineHeight: 1.2 }}>
                        {currentSimulatorBeacon.title}
                      </h3>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", fontSize: "13.5px" }}>
                        <Crown className="w-4 h-4 text-[#FFB800]" />
                        <span>Hosted by</span>
                        <img src={currentSimulatorBeacon.hostAvatar} alt={currentSimulatorBeacon.host} style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }} />
                        <span style={{ fontWeight: 800, color: "#FFFFFF" }}>{currentSimulatorBeacon.host}</span>
                        <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.5)" }}>({currentSimulatorBeacon.hostRole})</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "18px", fontSize: "13px", color: "rgba(255, 255, 255, 0.8)" }}>
                        <MapPin className="w-4 h-4 text-[#FF5A1F]" />
                        <span>{currentSimulatorBeacon.addressDetail}</span>
                      </div>

                      <p style={{ fontSize: "13.5px", color: "rgba(255, 255, 255, 0.8)", lineHeight: 1.5, margin: "0 0 24px" }}>
                        {currentSimulatorBeacon.description}
                      </p>

                      {/* Guest List Avatar Row */}
                      <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.12)", paddingTop: "16px", marginBottom: "22px" }}>
                        <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.65)", marginBottom: "8px", fontWeight: 700 }}>
                          {joinGoingCount} Members Going · {joinSlotsRemaining} Spots Left
                        </div>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          {GUEST_AVATARS.slice(0, 5).map((av, idx) => (
                            <img key={idx} src={av.img} alt={av.name} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", marginLeft: idx === 0 ? 0 : "-8px", border: "2px solid #000" }} />
                          ))}
                          {activeJoinRsvp === "going" && (
                            <span style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#FF5A1F", border: "2px solid #FFF", display: "grid", placeItems: "center", fontSize: "10px", fontWeight: 900, color: "#FFF", marginLeft: "-8px", zIndex: 10 }}>
                              YOU
                            </span>
                          )}
                          <span style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "grid", placeItems: "center", fontSize: "11px", fontWeight: 800, marginLeft: "-8px" }}>
                            +{currentSimulatorBeacon.filledSlots - 5}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* The 3 Circular RSVP Discs */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", marginBottom: "16px" }}>
                        <button
                          type="button"
                          onClick={() => handleSimRsvpClick(currentSimulatorBeacon.id, "going")}
                          className={`pf-rsvp-circle-btn ${activeJoinRsvp === "going" ? "selected-going" : ""}`}
                          title="Going"
                        >
                          <span style={{ fontSize: "20px" }}>👍</span>
                          <span style={{ fontSize: "11px", fontWeight: 800, color: "#111827" }}>Going</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSimRsvpClick(currentSimulatorBeacon.id, "maybe")}
                          className={`pf-rsvp-circle-btn ${activeJoinRsvp === "maybe" ? "selected-maybe" : ""}`}
                          title="Maybe"
                        >
                          <span style={{ fontSize: "20px" }}>🤔</span>
                          <span style={{ fontSize: "11px", fontWeight: 800, color: "#111827" }}>Maybe</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSimRsvpClick(currentSimulatorBeacon.id, "cantGo")}
                          className={`pf-rsvp-circle-btn ${activeJoinRsvp === "cantGo" ? "selected-cantgo" : ""}`}
                          title="Can't go"
                        >
                          <span style={{ fontSize: "20px" }}>🥺</span>
                          <span style={{ fontSize: "11px", fontWeight: 800, color: "#111827" }}>Can&apos;t</span>
                        </button>
                      </div>

                      {/* Interactive Chat Unlock Button */}
                      {activeJoinRsvp === "going" && (
                        <div style={{ animation: "fadeIn 0.2s ease" }}>
                          <button
                            type="button"
                            onClick={() => setOpenChatInMockup((o) => !o)}
                            style={{
                              width: "100%",
                              padding: "10px",
                              borderRadius: "10px",
                              background: "rgba(255, 255, 255, 0.12)",
                              border: "1px solid rgba(255, 255, 255, 0.25)",
                              color: "#FFFFFF",
                              fontWeight: 800,
                              fontSize: "13px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                            }}
                          >
                            <MessageSquare className="w-4 h-4 text-[#FF5A1F]" />
                            <span>{openChatInMockup ? "Hide Squad Chat" : `💬 Open Squad Chat (${joinGoingCount} members)`}</span>
                          </button>

                          {/* Embedded Live Chat Drawer inside Mockup */}
                          {openChatInMockup && (
                            <div style={{ marginTop: "12px", background: "rgba(0, 0, 0, 0.6)", borderRadius: "12px", padding: "14px", border: "1px solid rgba(255, 255, 255, 0.15)" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px", maxHeight: "120px", overflowY: "auto" }}>
                                {simulatedChatMsgs.map((msg, idx) => (
                                  <div key={idx} style={{ fontSize: "12px", lineHeight: 1.4 }}>
                                    <span style={{ fontWeight: 800, color: "#FF8A3D" }}>{msg.from}: </span>
                                    <span style={{ color: "#FFFFFF" }}>{msg.text}</span>
                                  </div>
                                ))}
                              </div>
                              <form onSubmit={handleSendSimChat} style={{ display: "flex", gap: "8px" }}>
                                <input
                                  type="text"
                                  placeholder="Type a message to the squad..."
                                  value={simChatInput}
                                  onChange={(e) => setSimChatInput(e.target.value)}
                                  style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", background: "rgba(255, 255, 255, 0.1)", border: "none", color: "#FFF", fontSize: "12px", outline: "none" }}
                                />
                                <button type="submit" style={{ padding: "8px 14px", borderRadius: "6px", background: "#FF5A1F", border: "none", color: "#FFF", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}>
                                  Send
                                </button>
                              </form>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── VERSION 2: MOBILE PHONE IPHONE 16 PRO MOCKUP ── */}
        {deviceVersion === "mobile" && (
          <div className="pf-phone-mockup">
            {/* Top Status Bar & Dynamic Island */}
            <div style={{ padding: "12px 24px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#FFFFFF", fontSize: "12px", fontWeight: 700 }}>
              <span>9:41</span>
              {/* Dynamic Island Pill with Live Status */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#000000", padding: "4px 12px", borderRadius: "999px", border: "1px solid rgba(255, 255, 255, 0.15)" }}>
                <span className="w-2 h-2 rounded-full bg-[#FF5A1F] animate-pulse" />
                <span style={{ fontSize: "10px", fontWeight: 800, color: "#FF5A1F" }}>
                  {beaconBroadcasted ? "BEACON LIVE" : "KARACHI RADAR"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span>5G</span>
                <span>●</span>
              </div>
            </div>

            {/* Mobile App Navigation Bar */}
            <div style={{ padding: "8px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <span style={{ color: "#FF5A1F", fontWeight: 900, fontSize: "16px" }}>solo-no-more</span>
              <div style={{ fontSize: "11px", fontWeight: 800, background: "rgba(255, 255, 255, 0.1)", padding: "3px 9px", borderRadius: "6px", color: "#FFFFFF" }}>
                {simulatorAction === "create" ? "HOST MODE" : "RADAR MODE"}
              </div>
            </div>

            {/* Phone Screen Scrollable Content Body */}
            <div style={{ padding: "18px 18px 28px", background: "#0D0A14", minHeight: "560px", textAlign: "left" }}>
              {/* MOBILE FLOW A: CREATE A BEACON */}
              {simulatorAction === "create" && (
                <div>
                  {!beaconBroadcasted ? (
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 900, color: "#FF5A1F", letterSpacing: "0.08em" }}>
                        DROP A BEACON (KARACHI)
                      </span>
                      <h4 style={{ fontSize: "18px", fontWeight: 800, margin: "4px 0 14px", color: "#FFFFFF" }}>
                        Select Meetup Vibe
                      </h4>

                      {/* Vibe Selection Pills */}
                      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                        {[
                          { id: "sports", label: "🎾 Sports" },
                          { id: "casual", label: "☕ Chai" },
                          { id: "nightlife", label: "⚡ Night" },
                        ].map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => handleSelectSimCategory(v.id as "sports" | "casual" | "nightlife")}
                            style={{
                              flex: 1,
                              padding: "10px 4px",
                              borderRadius: "10px",
                              fontSize: "12px",
                              fontWeight: 800,
                              cursor: "pointer",
                              background: createCategory === v.id ? "#FF5A1F" : "rgba(255,255,255,0.06)",
                              color: "#FFFFFF",
                              border: "none",
                            }}
                          >
                            {v.label}
                          </button>
                        ))}
                      </div>

                      {/* Scene Title Input */}
                      <div style={{ marginBottom: "14px" }}>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.7)", display: "block", marginBottom: "4px" }}>
                          Scene Title
                        </label>
                        <input
                          type="text"
                          value={createTitle}
                          onChange={(e) => setCreateTitle(e.target.value)}
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#FFF", fontSize: "13px", fontWeight: 700 }}
                        />
                      </div>

                      {/* Venue & Slots Preview */}
                      <div style={{ background: "rgba(255,255,255,0.05)", padding: "12px", borderRadius: "10px", marginBottom: "20px", fontSize: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", color: "#FFF", fontWeight: 700 }}>
                          <MapPin className="w-3.5 h-3.5 text-[#FF5A1F]" />
                          <span>{createLocation}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.6)" }}>
                          <span>{createTime}</span>
                          <span style={{ color: "#FF8A3D", fontWeight: 800 }}>{createSlots} spots open</span>
                        </div>
                      </div>

                      {/* Broadcast CTA */}
                      <button
                        type="button"
                        onClick={() => setBeaconBroadcasted(true)}
                        style={{
                          width: "100%",
                          padding: "13px",
                          borderRadius: "12px",
                          background: "linear-gradient(135deg, #FF6B35, #FF5A1F)",
                          color: "#FFFFFF",
                          fontWeight: 900,
                          fontSize: "14px",
                          border: "none",
                          cursor: "pointer",
                          boxShadow: "0 6px 20px rgba(255, 90, 31, 0.4)",
                        }}
                      >
                        ⚡ Broadcast Live Beacon (Free)
                      </button>
                    </div>
                  ) : (
                    /* Mobile Radar Broadcast Screen */
                    <div style={{ textAlign: "center", padding: "24px 8px" }}>
                      <div style={{ position: "relative", width: "80px", height: "80px", margin: "0 auto 16px", display: "grid", placeItems: "center" }}>
                        <div className="pf-radar-wave" style={{ width: "80px", height: "80px" }} />
                        <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#FF5A1F", display: "grid", placeItems: "center", zIndex: 10 }}>
                          <Radio className="w-5 h-5 text-black" />
                        </div>
                      </div>

                      <span style={{ fontSize: "10px", fontWeight: 900, background: "#27C93F", color: "#000", padding: "2px 8px", borderRadius: "4px" }}>
                        BROADCASTING IN CLIFTON
                      </span>
                      <h4 style={{ fontSize: "17px", fontWeight: 800, margin: "10px 0 6px", color: "#FFF" }}>
                        Your Beacon is Live!
                      </h4>
                      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", margin: "0 0 20px" }}>
                        14 nearby members in Clifton & DHA alerted.
                      </p>

                      <button
                        type="button"
                        onClick={() => setSimulatorAction("join")}
                        style={{
                          width: "100%",
                          padding: "12px",
                          borderRadius: "10px",
                          background: "#27C93F",
                          color: "#000",
                          fontWeight: 900,
                          fontSize: "13px",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        🎟️ Test Joining This Beacon →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* MOBILE FLOW B: JOIN A BEACON */}
              {simulatorAction === "join" && (
                <div>
                  <div style={{ width: "100%", height: "190px", borderRadius: "14px", overflow: "hidden", marginBottom: "14px", boxShadow: "0 10px 30px rgba(0,0,0,0.6)" }}>
                    <img src={currentSimulatorBeacon.poster} alt={currentSimulatorBeacon.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>

                  <h4 style={{ fontSize: "18px", fontWeight: 800, color: "#FFFFFF", margin: "0 0 6px", lineHeight: 1.25 }}>
                    {currentSimulatorBeacon.title}
                  </h4>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#FF8A3D", marginBottom: "10px" }}>
                    {currentSimulatorBeacon.date} · {currentSimulatorBeacon.time}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", fontSize: "12px", color: "rgba(255,255,255,0.85)" }}>
                    <Crown className="w-3.5 h-3.5 text-[#FFB800]" />
                    <span>Hosted by</span>
                    <img src={currentSimulatorBeacon.hostAvatar} alt={currentSimulatorBeacon.host} style={{ width: "18px", height: "18px", borderRadius: "50%" }} />
                    <span style={{ fontWeight: 800, color: "#FFF" }}>{currentSimulatorBeacon.host}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", fontSize: "11.5px", color: "rgba(255,255,255,0.7)" }}>
                    <MapPin className="w-3.5 h-3.5 text-[#FF5A1F]" />
                    <span>{currentSimulatorBeacon.location}</span>
                  </div>

                  {/* Attendees Stack */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "10px" }}>
                    <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#FFF" }}>
                      {joinGoingCount} Going · {joinSlotsRemaining} Left
                    </span>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {GUEST_AVATARS.slice(0, 3).map((av, idx) => (
                        <img key={idx} src={av.img} alt={av.name} style={{ width: "22px", height: "22px", borderRadius: "50%", marginLeft: idx === 0 ? 0 : "-6px", border: "1.5px solid #000" }} />
                      ))}
                      <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", fontSize: "9px", fontWeight: 800, display: "grid", placeItems: "center", marginLeft: "-6px" }}>+9</span>
                    </div>
                  </div>

                  {/* The 3 Circular Reaction Discs in Mobile Thumb Zone */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", gap: "12px", marginBottom: "18px" }}>
                    <button
                      type="button"
                      onClick={() => handleSimRsvpClick(currentSimulatorBeacon.id, "going")}
                      className={`pf-rsvp-circle-btn ${activeJoinRsvp === "going" ? "selected-going" : ""}`}
                      style={{ width: "60px", height: "60px" }}
                    >
                      <span style={{ fontSize: "17px" }}>👍</span>
                      <span style={{ fontSize: "10px", fontWeight: 800, color: "#111827" }}>Going</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSimRsvpClick(currentSimulatorBeacon.id, "maybe")}
                      className={`pf-rsvp-circle-btn ${activeJoinRsvp === "maybe" ? "selected-maybe" : ""}`}
                      style={{ width: "60px", height: "60px" }}
                    >
                      <span style={{ fontSize: "17px" }}>🤔</span>
                      <span style={{ fontSize: "10px", fontWeight: 800, color: "#111827" }}>Maybe</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSimRsvpClick(currentSimulatorBeacon.id, "cantGo")}
                      className={`pf-rsvp-circle-btn ${activeJoinRsvp === "cantGo" ? "selected-cantgo" : ""}`}
                      style={{ width: "60px", height: "60px" }}
                    >
                      <span style={{ fontSize: "17px" }}>🥺</span>
                      <span style={{ fontSize: "10px", fontWeight: 800, color: "#111827" }}>Can&apos;t</span>
                    </button>
                  </div>

                  {/* Bottom Action Button */}
                  <Link
                    href="/signup"
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "center",
                      padding: "12px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #FF6B35, #FF5A1F)",
                      color: "#FFFFFF",
                      fontWeight: 900,
                      fontSize: "13px",
                      textDecoration: "none",
                      boxShadow: "0 6px 20px rgba(255, 90, 31, 0.4)",
                    }}
                  >
                    ⚡ Claim Your Spot in Karachi
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── 5. PLAIN ANIMATED REVIEWS & PRESS TICKER (EXACT ORIGINAL STYLE, ANIMATED) ─── */}
      <section
        id="reviews-section"
        className="pf-plain-reviews-wrap"
        aria-label="Press and Reviews Ticker"
      >
        <div className="pf-plain-reviews-track">
          {[...PRESS_PARTNER_REVIEWS, ...COMMUNITY_HOST_REVIEWS, ...PRESS_PARTNER_REVIEWS, ...COMMUNITY_HOST_REVIEWS].map((item, idx) => {
            const quoteText = "quote" in item ? item.quote : "";
            const sourceText = "source" in item ? item.source : "author" in item ? `${(item as any).author} · ${(item as any).role}` : "";
            return (
              <div key={idx} className="pf-plain-review-item">
                <div className="pf-plain-review-quote">
                  &ldquo;{quoteText}&rdquo;
                </div>
                <div className="pf-plain-review-source">
                  {sourceText}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 6. TRENDING BEACONS (FULL-WIDTH, WOW-FACTOR POSTER CARDS & CURSOR SCROLL) ─── */}
      <section
        id="templates-section"
        style={{
          padding: "70px 0 80px",
          width: "100%",
          maxWidth: "100%",
          margin: 0,
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
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
              <Radio className="w-3.5 h-3.5 text-[#FF5A1F] animate-pulse" /> LIVE KARACHI RADAR
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
              Real-world scenes broadcasting across Karachi. Scroll or drag with cursor to explore.
            </p>
          </div>

          {/* Navigation Controls: Sharp-Corner Buttons + Drag Hint */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)", fontWeight: 700, marginRight: "4px" }} className="hidden sm:inline">
              Drag with cursor ⇄
            </span>
            <button
              type="button"
              onClick={() => scrollCarousel("left")}
              aria-label="Previous beacon"
              className="pf-image3-nav-btn"
              style={{ borderRadius: "0px" }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel("right")}
              aria-label="Next beacon"
              className="pf-image3-nav-btn"
              style={{ borderRadius: "0px" }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Track of Poster Cards (Sharp Corners & Full Edge-to-Edge) */}
        <div className="pf-beacons-carousel-container">
          <div
            ref={carouselRef}
            className="pf-beacons-track"
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onWheel={handleWheel}
            style={{ padding: "16px clamp(24px, 5vw, 64px) 28px" }}
          >
            {TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplate.id === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`pf-beacon-poster-card ${isSelected ? "is-active-beacon" : ""}`}
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    height: "390px",
                    width: "270px",
                    flex: "0 0 270px",
                    borderRadius: "0px",
                  }}
                >
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
                      padding: "24px 18px 20px",
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
                        padding: "4px 10px",
                        borderRadius: "0px",
                        fontSize: "11px",
                        fontWeight: 800,
                        color: "#FFA578",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        marginBottom: "8px",
                      }}
                    >
                      {tmpl.posterBadge}
                    </div>

                    {/* Headline */}
                    <div
                      style={{
                        fontFamily: "var(--font-display), system-ui, sans-serif",
                        fontSize: "18px",
                        fontWeight: 900,
                        color: "#FFFFFF",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.2,
                        marginBottom: "6px",
                        textShadow: "0 2px 10px rgba(0, 0, 0, 0.95)",
                      }}
                    >
                      {tmpl.headline}
                    </div>

                    {/* Location: Pure High-Contrast White Text + Vivid Glowing Orange Pin */}
                    <div
                      style={{
                        fontSize: "12.5px",
                        fontWeight: 800,
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "9px",
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
                        paddingTop: "9px",
                        fontSize: "12px",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 800 }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#27C93F", boxShadow: "0 0 8px #27C93F" }} />
                        <span style={{ color: "#FFFFFF" }}>{tmpl.time}</span>
                      </span>
                      <span style={{ color: "rgba(255, 255, 255, 0.75)", fontWeight: 700, fontSize: "11px" }}>
                        Tap to select
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

      {/* ── 7. "WE'RE NOT LIKE OTHER INVITES" (EXACT 3-ROW PARTIFUL CLONE - DARK & ORANGE THEME) ───────── */}
      <section
        id="features-section"
        style={{
          background: "#060408",
          color: "#FFFFFF",
          padding: "110px 24px 120px",
          width: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Electric party sunset atmospheric background auras */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at 88% 12%, rgba(255, 90, 31, 0.18) 0%, transparent 48%), radial-gradient(circle at 10% 48%, rgba(255, 138, 61, 0.14) 0%, transparent 44%), radial-gradient(circle at 90% 82%, rgba(255, 90, 31, 0.16) 0%, transparent 48%)",
            zIndex: 0,
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "1180px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "120px",
          }}
        >
          {/* Section Header */}
          <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto -20px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255, 90, 31, 0.12)",
                border: "1px solid rgba(255, 90, 31, 0.3)",
                padding: "5px 14px",
                borderRadius: "0px",
                fontSize: "11px",
                fontWeight: 800,
                color: "#FF8A3D",
                letterSpacing: "0.08em",
                marginBottom: "16px",
              }}
            >
              PURPOSE-BUILT FOR REAL GATHERINGS
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display), system-ui, sans-serif",
                fontSize: "clamp(34px, 5vw, 56px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "#FFFFFF",
                margin: "0 0 14px",
                lineHeight: 1.1,
              }}
            >
              We&apos;re not like other invites
            </h2>
            <p style={{ fontSize: "18px", color: "#A39EAC", margin: "0 auto", lineHeight: 1.55 }}>
              Everything you need to host without awkward group chats, flaky guestlists, or cash confusion.
            </p>
          </div>

          {/* ════ ROW 1: "New! Sell tickets for your event 🎟️" (Image 1 Clone - Orange Theme + Close Overlap) ════ */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "48px",
              alignItems: "center",
            }}
          >
            {/* Left Column: Text & CTA */}
            <div style={{ maxWidth: "520px" }}>
              <h3
                style={{
                  fontFamily: "var(--font-display), system-ui, sans-serif",
                  fontSize: "clamp(30px, 3.8vw, 44px)",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  letterSpacing: "-0.03em",
                  margin: "0 0 16px",
                  lineHeight: 1.15,
                }}
              >
                New! Sell tickets for your event 🎟️
              </h3>
              <p
                style={{
                  fontSize: "clamp(17px, 2vw, 20px)",
                  color: "#A39EAC",
                  lineHeight: 1.45,
                  margin: "0 0 28px",
                  fontWeight: 500,
                }}
              >
                Add ticket tiers, use QR code check-in, and track sales — all in one place.
              </p>
              <Link
                href="/apply"
                style={{
                  background: "#FFFFFF",
                  color: "#000000",
                  fontSize: "15px",
                  fontWeight: 800,
                  padding: "13px 28px",
                  borderRadius: "0px",
                  textDecoration: "none",
                  display: "inline-block",
                  boxShadow: "0 4px 20px rgba(255, 90, 31, 0.25)",
                  transition: "background 0.15s ease, transform 0.15s ease",
                }}
                className="hover:bg-neutral-100 hover:scale-105 active:scale-95 cursor-pointer"
              >
                Get started
              </Link>
            </div>

            {/* Right Column: Two Angled Tickets Close & Overlapping (Orange & Obsidian Website Theme) */}
            <div
              style={{
                position: "relative",
                minHeight: "440px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Ticket 1: Vibrant Sunset Orange Gradient Pass (underneath, tilted left, close overlap) */}
              <div
                style={{
                  width: "245px",
                  height: "465px",
                  borderRadius: "18px",
                  background: "linear-gradient(145deg, #FF7A45 0%, #FF5A1F 45%, #D63900 100%)",
                  boxShadow: "0 22px 55px rgba(0, 0, 0, 0.7), 0 0 35px rgba(255, 90, 31, 0.3)",
                  transform: "rotate(-7deg)",
                  position: "relative",
                  padding: "16px 14px 30px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  flexShrink: 0,
                  zIndex: 1,
                  marginRight: "-75px",
                  transition: "transform 0.3s ease",
                  border: "1px solid rgba(255, 255, 255, 0.35)",
                }}
              >
                {/* Top Notch Cutout matching black bg */}
                <div
                  style={{
                    position: "absolute",
                    top: "-1px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "22px",
                    height: "11px",
                    background: "#060408",
                    borderBottomLeftRadius: "12px",
                    borderBottomRightRadius: "12px",
                  }}
                />

                {/* QR Code Container */}
                <div
                  style={{
                    background: "#FFFFFF",
                    borderRadius: "12px",
                    padding: "12px",
                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", display: "block" }}>
                      {/* Top-Left Finder */}
                      <rect x="6" y="6" width="24" height="24" fill="#000" rx="3" />
                      <rect x="10" y="10" width="16" height="16" fill="#fff" rx="1.5" />
                      <rect x="14" y="14" width="8" height="8" fill="#000" rx="1" />
                      {/* Top-Right Finder */}
                      <rect x="70" y="6" width="24" height="24" fill="#000" rx="3" />
                      <rect x="74" y="10" width="16" height="16" fill="#fff" rx="1.5" />
                      <rect x="78" y="14" width="8" height="8" fill="#000" rx="1" />
                      {/* Bottom-Left Finder */}
                      <rect x="6" y="70" width="24" height="24" fill="#000" rx="3" />
                      <rect x="10" y="74" width="16" height="16" fill="#fff" rx="1.5" />
                      <rect x="14" y="78" width="8" height="8" fill="#000" rx="1" />
                      {/* Alignment Pattern */}
                      <rect x="68" y="68" width="14" height="14" fill="#000" rx="2" />
                      <rect x="71" y="71" width="8" height="8" fill="#fff" rx="1" />
                      <rect x="73" y="73" width="4" height="4" fill="#000" />
                      {/* Matrix Bits */}
                      <g fill="#000">
                        <rect x="34" y="8" width="4" height="4" /><rect x="42" y="8" width="4" height="4" /><rect x="50" y="8" width="4" height="4" /><rect x="58" y="8" width="4" height="4" />
                        <rect x="8" y="34" width="4" height="4" /><rect x="8" y="42" width="4" height="4" /><rect x="8" y="50" width="4" height="4" /><rect x="8" y="58" width="4" height="4" />
                        <rect x="34" y="16" width="4" height="3" /><rect x="42" y="16" width="6" height="3" /><rect x="52" y="16" width="4" height="3" /><rect x="60" y="16" width="5" height="3" />
                        <rect x="34" y="24" width="6" height="4" /><rect x="44" y="24" width="4" height="4" /><rect x="52" y="24" width="6" height="4" /><rect x="62" y="24" width="3" height="4" />
                        <rect x="6" y="36" width="4" height="4" /><rect x="14" y="36" width="5" height="4" /><rect x="23" y="36" width="4" height="4" />
                        <rect x="6" y="46" width="5" height="4" /><rect x="15" y="46" width="3" height="4" /><rect x="22" y="46" width="5" height="4" />
                        <rect x="6" y="56" width="4" height="4" /><rect x="14" y="56" width="4" height="4" /><rect x="22" y="56" width="4" height="4" />
                        <rect x="70" y="36" width="5" height="4" /><rect x="79" y="36" width="4" height="4" /><rect x="87" y="36" width="5" height="4" />
                        <rect x="74" y="45" width="4" height="4" /><rect x="82" y="45" width="5" height="4" /><rect x="91" y="45" width="3" height="4" />
                        <rect x="70" y="54" width="4" height="4" /><rect x="78" y="54" width="5" height="4" /><rect x="87" y="54" width="4" height="4" />
                        <rect x="34" y="70" width="4" height="4" /><rect x="42" y="70" width="5" height="4" /><rect x="51" y="70" width="4" height="4" /><rect x="59" y="70" width="5" height="4" />
                        <rect x="36" y="78" width="5" height="4" /><rect x="45" y="78" width="3" height="4" /><rect x="52" y="78" width="6" height="4" /><rect x="62" y="78" width="3" height="4" />
                        <rect x="34" y="86" width="4" height="4" /><rect x="42" y="86" width="5" height="4" /><rect x="51" y="86" width="4" height="4" /><rect x="59" y="86" width="5" height="4" />
                        <rect x="70" y="86" width="5" height="4" /><rect x="79" y="86" width="4" height="4" /><rect x="87" y="86" width="5" height="4" />
                      </g>
                    </svg>
                    {/* Center Partiful ? Badge */}
                    <div
                      style={{
                        position: "absolute",
                        width: "30%",
                        height: "30%",
                        background: "#FFFFFF",
                        borderRadius: "50%",
                        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: "18px", fontWeight: 900, color: "#FF5A1F", lineHeight: 1 }}>?</span>
                    </div>
                  </div>
                </div>

                {/* Perforation Dashed Line */}
                <div style={{ borderTop: "1.5px dashed rgba(255, 255, 255, 0.4)", margin: "14px -14px 10px" }} />

                {/* Stub Text with ample bottom clearance */}
                <div style={{ color: "#FFFFFF", textAlign: "left", paddingLeft: "4px", paddingBottom: "14px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.2 }}>Mod Ref Night</div>
                  <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.9)", fontWeight: 500, marginBottom: "8px" }}>General Admission</div>
                  <div style={{ fontSize: "9px", letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.75)", fontWeight: 700 }}>DATE</div>
                  <div style={{ fontSize: "12px", fontWeight: 800, color: "#FFFFFF", marginBottom: "6px" }}>October 2</div>
                  <div style={{ fontSize: "9px", letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.75)", fontWeight: 700 }}>TIME</div>
                  <div style={{ fontSize: "12px", fontWeight: 800, color: "#FFFFFF" }}>11:00 PM EST</div>
                </div>

                {/* Bottom Notch Cutout matching black bg */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "-1px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "22px",
                    height: "11px",
                    background: "#060408",
                    borderTopLeftRadius: "12px",
                    borderTopRightRadius: "12px",
                  }}
                />
              </div>

              {/* Ticket 2: Deep Obsidian Black Pass with Electric Orange Accents (in front, tilted right, tight overlap) */}
              <div
                style={{
                  width: "245px",
                  height: "465px",
                  borderRadius: "18px",
                  background: "linear-gradient(155deg, #18121F 0%, #100C16 50%, #251006 100%)",
                  boxShadow: "0 28px 65px rgba(0, 0, 0, 0.8), 0 0 35px rgba(255, 90, 31, 0.25)",
                  transform: "rotate(6deg)",
                  position: "relative",
                  padding: "16px 14px 30px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  flexShrink: 0,
                  zIndex: 2,
                  transition: "transform 0.3s ease",
                  border: "1.5px solid rgba(255, 90, 31, 0.45)",
                }}
              >
                {/* Top Notch Cutout matching black bg */}
                <div
                  style={{
                    position: "absolute",
                    top: "-1px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "22px",
                    height: "11px",
                    background: "#060408",
                    borderBottomLeftRadius: "12px",
                    borderBottomRightRadius: "12px",
                  }}
                />

                {/* QR Code Container */}
                <div
                  style={{
                    background: "#FFFFFF",
                    borderRadius: "12px",
                    padding: "12px",
                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", display: "block" }}>
                      {/* Top-Left Finder */}
                      <rect x="6" y="6" width="24" height="24" fill="#000" rx="3" />
                      <rect x="10" y="10" width="16" height="16" fill="#fff" rx="1.5" />
                      <rect x="14" y="14" width="8" height="8" fill="#000" rx="1" />
                      {/* Top-Right Finder */}
                      <rect x="70" y="6" width="24" height="24" fill="#000" rx="3" />
                      <rect x="74" y="10" width="16" height="16" fill="#fff" rx="1.5" />
                      <rect x="78" y="14" width="8" height="8" fill="#000" rx="1" />
                      {/* Bottom-Left Finder */}
                      <rect x="6" y="70" width="24" height="24" fill="#000" rx="3" />
                      <rect x="10" y="74" width="16" height="16" fill="#fff" rx="1.5" />
                      <rect x="14" y="78" width="8" height="8" fill="#000" rx="1" />
                      {/* Alignment Pattern */}
                      <rect x="68" y="68" width="14" height="14" fill="#000" rx="2" />
                      <rect x="71" y="71" width="8" height="8" fill="#fff" rx="1" />
                      <rect x="73" y="73" width="4" height="4" fill="#000" />
                      {/* Matrix Bits */}
                      <g fill="#000">
                        <rect x="34" y="8" width="4" height="4" /><rect x="42" y="8" width="4" height="4" /><rect x="50" y="8" width="4" height="4" /><rect x="58" y="8" width="4" height="4" />
                        <rect x="8" y="34" width="4" height="4" /><rect x="8" y="42" width="4" height="4" /><rect x="8" y="50" width="4" height="4" /><rect x="8" y="58" width="4" height="4" />
                        <rect x="34" y="16" width="5" height="3" /><rect x="42" y="16" width="5" height="3" /><rect x="51" y="16" width="4" height="3" /><rect x="60" y="16" width="5" height="3" />
                        <rect x="34" y="24" width="5" height="4" /><rect x="43" y="24" width="5" height="4" /><rect x="52" y="24" width="5" height="4" /><rect x="61" y="24" width="4" height="4" />
                        <rect x="6" y="36" width="4" height="4" /><rect x="14" y="36" width="5" height="4" /><rect x="23" y="36" width="4" height="4" />
                        <rect x="6" y="46" width="5" height="4" /><rect x="15" y="46" width="3" height="4" /><rect x="22" y="46" width="5" height="4" />
                        <rect x="6" y="56" width="4" height="4" /><rect x="14" y="56" width="4" height="4" /><rect x="22" y="56" width="4" height="4" />
                        <rect x="70" y="36" width="5" height="4" /><rect x="79" y="36" width="4" height="4" /><rect x="87" y="36" width="5" height="4" />
                        <rect x="74" y="45" width="4" height="4" /><rect x="82" y="45" width="5" height="4" /><rect x="91" y="45" width="3" height="4" />
                        <rect x="70" y="54" width="4" height="4" /><rect x="78" y="54" width="5" height="4" /><rect x="87" y="54" width="4" height="4" />
                        <rect x="34" y="70" width="4" height="4" /><rect x="42" y="70" width="5" height="4" /><rect x="51" y="70" width="4" height="4" /><rect x="59" y="70" width="5" height="4" />
                        <rect x="36" y="78" width="5" height="4" /><rect x="45" y="78" width="3" height="4" /><rect x="52" y="78" width="6" height="4" /><rect x="62" y="78" width="3" height="4" />
                        <rect x="34" y="86" width="4" height="4" /><rect x="42" y="86" width="5" height="4" /><rect x="51" y="86" width="4" height="4" /><rect x="59" y="86" width="5" height="4" />
                        <rect x="70" y="86" width="5" height="4" /><rect x="79" y="86" width="4" height="4" /><rect x="87" y="86" width="5" height="4" />
                      </g>
                    </svg>
                    <div
                      style={{
                        position: "absolute",
                        width: "30%",
                        height: "30%",
                        background: "#FFFFFF",
                        borderRadius: "50%",
                        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: "18px", fontWeight: 900, color: "#FF5A1F", lineHeight: 1 }}>?</span>
                    </div>
                  </div>
                </div>

                {/* Perforation Dashed Line */}
                <div style={{ borderTop: "1.5px dashed rgba(255, 90, 31, 0.35)", margin: "14px -14px 10px" }} />

                {/* Stub Text with ample bottom clearance */}
                <div style={{ color: "#FFFFFF", textAlign: "left", paddingLeft: "4px", paddingBottom: "14px", position: "relative" }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.2 }}>Backyard Open Mic Night</div>
                  <div style={{ fontSize: "12px", color: "#FF8A3D", fontWeight: 600, marginBottom: "8px" }}>General Admission</div>
                  <div style={{ fontSize: "9px", letterSpacing: "0.06em", color: "rgba(255, 160, 92, 0.8)", fontWeight: 700 }}>DATE</div>
                  <div style={{ fontSize: "12px", fontWeight: 800, color: "#FFFFFF", marginBottom: "6px" }}>December 14</div>
                  <div style={{ fontSize: "9px", letterSpacing: "0.06em", color: "rgba(255, 160, 92, 0.8)", fontWeight: 700 }}>TIME</div>
                  <div style={{ fontSize: "12px", fontWeight: 800, color: "#FFFFFF" }}>11:00 AM EST</div>
                  <span style={{ position: "absolute", right: "6px", bottom: "14px", fontSize: "14px", fontWeight: 900, color: "#FF5A1F" }}>?</span>
                </div>

                {/* Bottom Notch Cutout matching black bg */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "-1px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "22px",
                    height: "11px",
                    background: "#060408",
                    borderTopLeftRadius: "12px",
                    borderTopRightRadius: "12px",
                  }}
                />
              </div>
            </div>
          </div>

          {/* ════ ROW 2: "See who's going 👀" (Image 2 Clone - Upgraded Glassmorphic RSVP Card + Close Overlap) ════ */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "48px",
              alignItems: "center",
            }}
          >
            {/* Left Column: Overlapping RSVP Card (Upgraded Frosted Obsidian) & Chat Card (Light) with Close Overlap */}
            <div
              style={{
                position: "relative",
                minHeight: "440px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Card A: Upgraded Frosted Obsidian RSVP Card (behind, tilted left, close overlap) */}
              <div
                style={{
                  width: "270px",
                  borderRadius: "22px",
                  background: "linear-gradient(145deg, rgba(28, 20, 36, 0.96) 0%, rgba(18, 14, 24, 0.98) 100%)",
                  border: "1.5px solid rgba(255, 90, 31, 0.28)",
                  boxShadow: "0 24px 55px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 90, 31, 0.15)",
                  transform: "rotate(-6deg)",
                  padding: "20px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  flexShrink: 0,
                  zIndex: 1,
                  marginRight: "-65px",
                  transition: "transform 0.3s ease",
                }}
              >
                {/* Sleek Top Status Bar */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: 800, color: "#FFA05C", letterSpacing: "0.08em" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#27C93F", boxShadow: "0 0 8px #27C93F", display: "inline-block" }} />
                    LIVE GUESTLIST
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "rgba(255, 255, 255, 0.5)", background: "rgba(255, 255, 255, 0.08)", padding: "2px 6px", borderRadius: "4px" }}>
                    32 GOING
                  </span>
                </div>

                {/* RSVP Row 1: Joy */}
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    alt="Joy"
                    style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #FF5A1F" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF", marginBottom: "6px" }}>
                      Joy +1 <span style={{ fontWeight: 500, color: "rgba(255, 255, 255, 0.85)" }}>rsvped Going</span> 👍
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          background: "rgba(255, 90, 31, 0.22)",
                          border: "1px solid rgba(255, 90, 31, 0.4)",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 800,
                          color: "#FFA05C",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        🎉 2
                      </span>
                      <MessageSquare className="w-3.5 h-3.5 text-orange-300" />
                      <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.6)", fontWeight: 600 }}>Reply</span>
                    </div>
                  </div>
                </div>

                {/* RSVP Row 2: Jojo */}
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                    alt="Jojo"
                    style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid rgba(255, 255, 255, 0.25)" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF", marginBottom: "6px" }}>
                      Jojo <span style={{ fontWeight: 500, color: "rgba(255, 255, 255, 0.85)" }}>rsvped Maybe</span> 🤔
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          background: "rgba(255, 255, 255, 0.12)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#FFFFFF",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        🤝 4
                      </span>
                      <MessageSquare className="w-3.5 h-3.5 text-orange-300" />
                      <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.6)", fontWeight: 600 }}>Reply</span>
                    </div>
                  </div>
                </div>

                {/* RSVP Row 3: Jackie */}
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <img
                    src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80"
                    alt="Jackie"
                    style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #FFA05C" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF", marginBottom: "6px" }}>
                      Jackie <span style={{ fontWeight: 500, color: "rgba(255, 255, 255, 0.85)" }}>rsvped Going</span> 🥳
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          background: "rgba(255, 59, 48, 0.22)",
                          border: "1px solid rgba(255, 59, 48, 0.4)",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#FF7575",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        ❤️ 3
                      </span>
                      <span
                        style={{
                          background: "rgba(255, 149, 0, 0.22)",
                          border: "1px solid rgba(255, 149, 0, 0.4)",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#FFA05C",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        🔥 2
                      </span>
                      <MessageSquare className="w-3.5 h-3.5 text-orange-300" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card B: Light Comment Feed Card (front, tilted right, tight overlap) */}
              <div
                style={{
                  width: "290px",
                  borderRadius: "22px",
                  background: "linear-gradient(175deg, #FFFFFF 0%, #F5FBF9 50%, #E8F7F3 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.8)",
                  boxShadow: "0 28px 65px rgba(0, 0, 0, 0.55), 0 4px 18px rgba(0, 0, 0, 0.15)",
                  transform: "rotate(4deg)",
                  padding: "20px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  flexShrink: 0,
                  zIndex: 2,
                  transition: "transform 0.3s ease",
                }}
              >
                {/* Comment 1: sammy */}
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <img
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80"
                    alt="sammy"
                    style={{ width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "12.5px", fontWeight: 800, color: "#111827", marginBottom: "2px" }}>
                      sammy <span style={{ fontWeight: 500, color: "#9CA3AF", fontSize: "11px" }}>15m</span>
                    </div>
                    <div style={{ fontSize: "12.5px", color: "#1F2937", lineHeight: 1.35, marginBottom: "6px" }}>
                      🚨 SOS can anyone bring more drinks + snacks?
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          background: "#E8EDFB",
                          border: "1px solid #D1DCF8",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#1E40AF",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        🍿 6
                      </span>
                      <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                      <span style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: 600 }}>Reply</span>
                    </div>
                  </div>
                </div>

                {/* Comment 2: Ryan */}
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
                    alt="Ryan"
                    style={{ width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "12.5px", fontWeight: 800, color: "#111827", marginBottom: "2px" }}>
                      Ryan <span style={{ fontWeight: 500, color: "#9CA3AF", fontSize: "11px" }}>6m</span>
                    </div>
                    <div style={{ fontSize: "12.5px", color: "#1F2937", lineHeight: 1.35, marginBottom: "6px" }}>
                      omw with some seltzers and drinks 🍻
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          background: "#E8EDFB",
                          border: "1px solid #D1DCF8",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#1E40AF",
                        }}
                      >
                        🧃 8
                      </span>
                      <span
                        style={{
                          background: "#E8F5E9",
                          border: "1px solid #C8E6C9",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#2E7D32",
                        }}
                      >
                        🥑 4
                      </span>
                      <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Comment 3: Luis */}
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <img
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
                    alt="Luis"
                    style={{ width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "12.5px", fontWeight: 800, color: "#111827", marginBottom: "2px" }}>
                      Luis <span style={{ fontWeight: 500, color: "#9CA3AF", fontSize: "11px" }}>2m</span>
                    </div>
                    <div style={{ fontSize: "12.5px", color: "#1F2937", lineHeight: 1.35, marginBottom: "6px" }}>
                      I have popcorn + preztels
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          background: "#E8EDFB",
                          border: "1px solid #D1DCF8",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#1E40AF",
                        }}
                      >
                        🍿 3
                      </span>
                      <span
                        style={{
                          background: "#FFF3E0",
                          border: "1px solid #FFE0B2",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#E65100",
                        }}
                      >
                        🥨 2
                      </span>
                      <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Bottom Input: Avatar + "Leave a comment" */}
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                  <img
                    src="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=80&auto=format&fit=crop&q=80"
                    alt="Me"
                    style={{ width: "26px", height: "26px", borderRadius: "50%", objectFit: "cover" }}
                  />
                  <div
                    style={{
                      flex: 1,
                      background: "#F1F3F5",
                      borderRadius: "999px",
                      padding: "8px 14px",
                      fontSize: "12px",
                      color: "#9CA3AF",
                    }}
                  >
                    Leave a comment
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Text & CTA */}
            <div style={{ maxWidth: "520px" }}>
              <h3
                style={{
                  fontFamily: "var(--font-display), system-ui, sans-serif",
                  fontSize: "clamp(30px, 3.8vw, 44px)",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  letterSpacing: "-0.03em",
                  margin: "0 0 16px",
                  lineHeight: 1.15,
                }}
              >
                See who&apos;s going 👀
              </h3>
              <p
                style={{
                  fontSize: "clamp(17px, 2vw, 20px)",
                  color: "#A39EAC",
                  lineHeight: 1.45,
                  margin: "0 0 12px",
                  fontWeight: 500,
                }}
              >
                Stalk the guest list, leave comments, reply to friends, and add reactions.
              </p>
              <p
                style={{
                  fontSize: "clamp(17px, 2vw, 20px)",
                  color: "#FF8A3D",
                  lineHeight: 1.45,
                  margin: "0 0 28px",
                  fontWeight: 600,
                }}
              >
                Keep the party going.
              </p>
              <Link
                href="/apply"
                style={{
                  background: "#FFFFFF",
                  color: "#000000",
                  fontSize: "15px",
                  fontWeight: 800,
                  padding: "13px 28px",
                  borderRadius: "0px",
                  textDecoration: "none",
                  display: "inline-block",
                  boxShadow: "0 4px 20px rgba(255, 90, 31, 0.25)",
                  transition: "background 0.15s ease, transform 0.15s ease",
                }}
                className="hover:bg-neutral-100 hover:scale-105 active:scale-95 cursor-pointer"
              >
                Create event
              </Link>
            </div>
          </div>

          {/* ════ ROW 3: "Text Blast your guests" (Image 3 Clone - Vibrant Sunset Orange Header) ════ */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "48px",
              alignItems: "center",
            }}
          >
            {/* Left Column: Text & CTA */}
            <div style={{ maxWidth: "520px" }}>
              <h3
                style={{
                  fontFamily: "var(--font-display), system-ui, sans-serif",
                  fontSize: "clamp(30px, 3.8vw, 44px)",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  letterSpacing: "-0.03em",
                  margin: "0 0 16px",
                  lineHeight: 1.15,
                }}
              >
                Text Blast your guests
              </h3>
              <p
                style={{
                  fontSize: "clamp(17px, 2vw, 20px)",
                  color: "#A39EAC",
                  lineHeight: 1.45,
                  margin: "0 0 14px",
                  fontWeight: 500,
                }}
              >
                Running late, need more drinks, 10 people texting you asking how to get in?
              </p>
              <p
                style={{
                  fontSize: "clamp(17px, 2vw, 20px)",
                  color: "#FF8A3D",
                  lineHeight: 1.45,
                  margin: "0 0 28px",
                  fontWeight: 600,
                }}
              >
                Send updates to everyone at once.
              </p>
              <Link
                href="/apply"
                style={{
                  background: "#FFFFFF",
                  color: "#000000",
                  fontSize: "15px",
                  fontWeight: 800,
                  padding: "13px 28px",
                  borderRadius: "0px",
                  textDecoration: "none",
                  display: "inline-block",
                  boxShadow: "0 4px 20px rgba(255, 90, 31, 0.25)",
                  transition: "background 0.15s ease, transform 0.15s ease",
                }}
                className="hover:bg-neutral-100 hover:scale-105 active:scale-95 cursor-pointer"
              >
                Create event
              </Link>
            </div>

            {/* Right Column: iOS iMessage Mockup with Vibrant Sunset Orange Header & Megaphone */}
            <div
              style={{
                maxWidth: "400px",
                width: "100%",
                margin: "0 auto",
                position: "relative",
              }}
            >
              {/* Phone Card Frame */}
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: "24px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 28px 70px rgba(0, 0, 0, 0.75), 0 0 40px rgba(255, 90, 31, 0.18)",
                  overflow: "visible",
                  position: "relative",
                }}
              >
                {/* Vibrant Sunset Orange Header (Updated from Light Blue) */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #FF6B35 0%, #FF5A1F 60%, #E64A19 100%)",
                    height: "90px",
                    borderTopLeftRadius: "23px",
                    borderTopRightRadius: "23px",
                    position: "relative",
                  }}
                />

                {/* Popout Host Avatar with Megaphone & Comic Action Lines */}
                <div
                  style={{
                    position: "absolute",
                    top: "32px",
                    left: "22px",
                    zIndex: 10,
                  }}
                >
                  <div style={{ position: "relative" }}>
                    {/* Host Avatar with Themed Border */}
                    <img
                      src="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=160&auto=format&fit=crop&q=80"
                      alt="Host"
                      style={{
                        width: "70px",
                        height: "70px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "3.5px solid #FF5A1F",
                        boxShadow: "0 8px 22px rgba(0, 0, 0, 0.35)",
                        display: "block",
                      }}
                    />

                    {/* Megaphone angled forward */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "-2px",
                        right: "-12px",
                        fontSize: "24px",
                        transform: "rotate(-12deg)",
                        filter: "drop-shadow(0 4px 10px rgba(255, 90, 31, 0.4))",
                      }}
                    >
                      📣
                    </div>

                    {/* Comic action sound lines radiating into the chat in warm sunset orange */}
                    <svg
                      viewBox="0 0 50 50"
                      style={{
                        position: "absolute",
                        left: "64px",
                        top: "16px",
                        width: "40px",
                        height: "40px",
                        pointerEvents: "none",
                        overflow: "visible",
                      }}
                    >
                      <path d="M4 14 L-4 12" stroke="#FFA05C" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M12 8 L8 -2" stroke="#FFA05C" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M22 6 L24 -4" stroke="#FFA05C" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M28 12 L38 4" stroke="#FFA05C" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M30 20 L40 18" stroke="#FFA05C" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* iMessage Chat Body */}
                <div
                  style={{
                    padding: "44px 20px 18px",
                    background: "#FFFFFF",
                    borderBottomLeftRadius: "23px",
                    borderBottomRightRadius: "23px",
                  }}
                >
                  {/* Timestamp */}
                  <div
                    style={{
                      textAlign: "center",
                      color: "#8E8E93",
                      fontSize: "11px",
                      fontWeight: 500,
                      marginBottom: "16px",
                    }}
                  >
                    Today 6:00 PM
                  </div>

                  {/* Message Bubble 1 */}
                  <div
                    style={{
                      background: "#E9E9EB",
                      borderRadius: "18px",
                      padding: "12px 16px",
                      color: "#000000",
                      fontSize: "13.5px",
                      lineHeight: 1.4,
                      marginBottom: "10px",
                      maxWidth: "88%",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    }}
                  >
                    The host of Birthday Bash sent you a Text Blast 📣
                  </div>

                  {/* Message Bubble 2 */}
                  <div
                    style={{
                      background: "#E9E9EB",
                      borderRadius: "18px",
                      padding: "12px 16px",
                      color: "#000000",
                      fontSize: "13.5px",
                      lineHeight: 1.4,
                      marginBottom: "24px",
                      maxWidth: "88%",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    }}
                  >
                    Hey!! Buzz #2 when you arrive 🥳 Can&apos;t wait to celebrate!
                  </div>

                  {/* iMessage Input Bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                    <div
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        background: "#E5E5EA",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#8E8E93",
                        fontSize: "18px",
                        fontWeight: 300,
                        cursor: "default",
                      }}
                    >
                      +
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: "36px",
                        borderRadius: "999px",
                        border: "1px solid #D1D1D6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 14px",
                        background: "#FFFFFF",
                      }}
                    >
                      <span style={{ color: "#8E8E93", fontSize: "14px" }}>iMessage</span>
                      <Mic className="w-4 h-4 text-[#8E8E93]" />
                    </div>
                  </div>

                  {/* iPhone Home Indicator */}
                  <div
                    style={{
                      width: "134px",
                      height: "5px",
                      background: "#000000",
                      borderRadius: "999px",
                      margin: "0 auto",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. "POWERFUL FEATURES, EASY EVENTS" (BLACK & ORANGE THEMED CLONE) ── */}
      <section
        id="powerful-features-section"
        style={{
          background: "#060408",
          color: "#FFFFFF",
          padding: "96px 24px 100px",
          position: "relative",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Main Section Header */}
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2
              style={{
                fontFamily: "var(--font-display), system-ui, sans-serif",
                fontSize: "clamp(34px, 4.8vw, 56px)",
                fontWeight: 800,
                letterSpacing: "-0.035em",
                color: "#FFFFFF",
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              Powerful features, easy events
            </h2>
          </div>

          {/* ─── 3 Feature Cards Grid (BLACK & ORANGE THEMED) ─── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "28px",
              marginBottom: "110px",
            }}
          >
            {/* Card 1: Find a time that works */}
            <div
              style={{
                background: "#120D1A",
                border: "1px solid rgba(255, 255, 255, 0.09)",
                boxShadow: "0 14px 40px rgba(0, 0, 0, 0.6)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                transition: "transform 0.2s ease, border-color 0.2s ease",
              }}
              className="hover:border-[#FF5A1F]/50 hover:-translate-y-1 transition-all"
            >
              {/* Card 1 Visual: Dark phone poll UI with orange & purple confetti */}
              <div
                style={{
                  height: "280px",
                  background: "radial-gradient(circle at 50% 20%, #2E1547 0%, #110B1E 65%, #0A0612 100%)",
                  position: "relative",
                  overflow: "hidden",
                  padding: "16px 14px 0",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {/* Floating confetti bits */}
                <span style={{ position: "absolute", top: "18px", left: "20px", color: "#FF5A1F", fontSize: "16px", transform: "rotate(-15deg)" }}>✦</span>
                <span style={{ position: "absolute", top: "34px", right: "26px", color: "#FF8A3D", fontSize: "14px", transform: "rotate(25deg)" }}>✦</span>
                <span style={{ position: "absolute", bottom: "40px", left: "18px", color: "#FF5A1F", fontSize: "12px" }}>•</span>
                <span style={{ position: "absolute", top: "60px", right: "16px", color: "#FBBF24", fontSize: "13px" }}>★</span>

                {/* Phone Mockup Frame */}
                <div
                  style={{
                    width: "260px",
                    background: "#0E0A17",
                    border: "2px solid rgba(255, 255, 255, 0.18)",
                    borderBottom: "none",
                    borderTopLeftRadius: "28px",
                    borderTopRightRadius: "28px",
                    padding: "12px 10px 0",
                    boxShadow: "0 -8px 24px rgba(0, 0, 0, 0.6)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Phone notch */}
                  <div style={{ width: "70px", height: "4px", background: "#3A3347", borderRadius: "999px", margin: "0 auto 10px" }} />
                  
                  {/* Poll Title */}
                  <div style={{ textAlign: "center", fontSize: "12px", fontWeight: 700, color: "rgba(255, 255, 255, 0.6)", marginBottom: "10px" }}>
                    Find a Time
                  </div>

                  {/* 3 Poll Options Carousel / Row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr 1fr", gap: "6px", marginBottom: "14px" }}>
                    {/* Option 1 */}
                    <div style={{ background: "#1C1628", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "8px 6px", textAlign: "center" }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "#E5E7EB", whiteSpace: "nowrap" }}>Pasta Dinner</div>
                      <div style={{ fontSize: "8.5px", color: "#9CA3AF" }}>This Friday</div>
                      <div style={{ fontSize: "7.5px", color: "#6B7280", marginTop: "4px" }}>6 Will Go • 1 Maybe</div>
                    </div>

                    {/* Option 2 (Selected - Most Popular in Vibrant Orange) */}
                    <div
                      style={{
                        background: "#1E1226",
                        borderRadius: "10px",
                        padding: "8px 6px",
                        textAlign: "center",
                        boxShadow: "0 4px 18px rgba(255, 90, 31, 0.35)",
                        border: "2px solid #FF5A1F",
                        transform: "scale(1.04)",
                        zIndex: 2,
                      }}
                    >
                      <div style={{ display: "inline-block", background: "#FF5A1F", color: "#FFF", fontSize: "7px", fontWeight: 900, padding: "1px 5px", borderRadius: "999px", marginBottom: "2px" }}>
                        🏆 MOST POPULAR
                      </div>
                      <div style={{ fontSize: "11px", fontWeight: 800, color: "#FFFFFF", whiteSpace: "nowrap" }}>House party 🍷</div>
                      <div style={{ fontSize: "9px", color: "#FF8A3D", fontWeight: 700 }}>This Saturday</div>
                      <div style={{ fontSize: "8px", color: "#FF5A1F", fontWeight: 800, marginTop: "2px" }}>8 Will Go • 1 Maybe</div>
                    </div>

                    {/* Option 3 */}
                    <div style={{ background: "#1C1628", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "8px 6px", textAlign: "center" }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "#E5E7EB", whiteSpace: "nowrap" }}>Brunch 🥂</div>
                      <div style={{ fontSize: "8.5px", color: "#9CA3AF" }}>Next Sunday</div>
                      <div style={{ fontSize: "7.5px", color: "#6B7280", marginTop: "4px" }}>4 Will Go • 0 Maybe</div>
                    </div>
                  </div>

                  {/* Responses Footer inside phone */}
                  <div style={{ background: "rgba(255, 255, 255, 0.05)", borderRadius: "8px", padding: "6px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#FF5A1F", color: "#FFF", fontSize: "9px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>L</div>
                      <span style={{ fontSize: "9.5px", color: "#E5E7EB", fontWeight: 600 }}>Luis Ocampo</span>
                    </div>
                    <span style={{ fontSize: "8.5px", color: "#9CA3AF" }}>Ally K. +1</span>
                  </div>
                </div>
              </div>

              {/* Card 1 Text & Action */}
              <div style={{ padding: "24px 22px 22px", display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#FFFFFF", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
                    Find a time that works
                  </h3>
                  <p style={{ fontSize: "15px", color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.4, margin: "0 0 20px" }}>
                    Poll your guests before selecting a date
                  </p>
                </div>
                <Link
                  href="/apply"
                  style={{
                    background: "rgba(255, 90, 31, 0.12)",
                    border: "1px solid rgba(255, 90, 31, 0.45)",
                    color: "#FF8A3D",
                    fontSize: "14px",
                    fontWeight: 700,
                    padding: "12px 16px",
                    borderRadius: "0px",
                    textAlign: "center",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                  className="hover:bg-[#FF5A1F] hover:text-white transition-colors"
                >
                  Try it ↗
                </Link>
              </div>
            </div>

            {/* Card 2: Get answers upfront */}
            <div
              style={{
                background: "#120D1A",
                border: "1px solid rgba(255, 255, 255, 0.09)",
                boxShadow: "0 14px 40px rgba(0, 0, 0, 0.6)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                transition: "transform 0.2s ease, border-color 0.2s ease",
              }}
              className="hover:border-[#FF5A1F]/50 hover:-translate-y-1 transition-all"
            >
              {/* Card 2 Visual: Dietary question bubbles with dusk wine & ember gradient */}
              <div
                style={{
                  height: "280px",
                  background: "radial-gradient(circle at 60% 40%, #3B1622 0%, #1E0E1B 50%, #0D0814 100%)",
                  position: "relative",
                  overflow: "hidden",
                  padding: "24px 18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-around",
                }}
              >
                {/* Bubble 1: Gluten-free with avatar */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", alignSelf: "flex-start", transform: "translateX(10px)" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#FF5A1F", color: "#FFF", fontSize: "13px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.4)" }}>
                    S
                  </div>
                  <div style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "#FFFFFF", fontSize: "13px", fontWeight: 700, padding: "8px 16px", borderRadius: "999px", boxShadow: "0 4px 14px rgba(0, 0, 0, 0.3)", backdropFilter: "blur(6px)" }}>
                    I&apos;m gluten-free!
                  </div>
                </div>

                {/* Central main question bubble with Orange Glow */}
                <div
                  style={{
                    background: "rgba(18, 12, 22, 0.95)",
                    border: "1.5px solid rgba(255, 90, 31, 0.5)",
                    backdropFilter: "blur(8px)",
                    color: "#FFFFFF",
                    fontSize: "15px",
                    fontWeight: 800,
                    padding: "12px 20px",
                    borderRadius: "18px",
                    textAlign: "center",
                    alignSelf: "center",
                    boxShadow: "0 8px 24px rgba(255, 90, 31, 0.2)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Have any dietary restrictions?
                </div>

                {/* Bubble 2: Yes vegetarian with avatar & crown */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", alignSelf: "flex-end", transform: "translateX(-8px)" }}>
                  <div style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "#FFFFFF", fontSize: "13px", fontWeight: 700, padding: "8px 16px", borderRadius: "999px", boxShadow: "0 4px 14px rgba(0, 0, 0, 0.3)", backdropFilter: "blur(6px)" }}>
                    yes! vegetarian 🥦
                  </div>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#E11D48", color: "#FFF", fontSize: "13px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    <span style={{ position: "absolute", top: "-8px", left: "8px", fontSize: "12px" }}>👑</span>
                    M
                  </div>
                </div>
              </div>

              {/* Card 2 Text & Action */}
              <div style={{ padding: "24px 22px 22px", display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#FFFFFF", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
                    Get answers upfront
                  </h3>
                  <p style={{ fontSize: "15px", color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.4, margin: "0 0 20px" }}>
                    Ask your guests about diets, playlists, or party themes.
                  </p>
                </div>
                <Link
                  href="/apply"
                  style={{
                    background: "rgba(255, 90, 31, 0.12)",
                    border: "1px solid rgba(255, 90, 31, 0.45)",
                    color: "#FF8A3D",
                    fontSize: "14px",
                    fontWeight: 700,
                    padding: "12px 16px",
                    borderRadius: "0px",
                    textAlign: "center",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                  className="hover:bg-[#FF5A1F] hover:text-white transition-colors"
                >
                  Try it ↗
                </Link>
              </div>
            </div>

            {/* Card 3: Collect payments (Black & Orange Theme) */}
            <div
              style={{
                background: "#120D1A",
                border: "1px solid rgba(255, 255, 255, 0.09)",
                boxShadow: "0 14px 40px rgba(0, 0, 0, 0.6)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                transition: "transform 0.2s ease, border-color 0.2s ease",
              }}
              className="hover:border-[#FF5A1F]/50 hover:-translate-y-1 transition-all"
            >
              {/* Card 3 Visual: Floating gold bills and vibrant sunset orange ticket roll */}
              <div
                style={{
                  height: "280px",
                  background: "radial-gradient(circle at 50% 50%, #3A1B0B 0%, #1A0D06 50%, #09050C 100%)",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Floating gold currency bills */}
                <div
                  style={{
                    position: "absolute",
                    top: "22px",
                    left: "18px",
                    width: "82px",
                    height: "46px",
                    background: "rgba(251, 191, 36, 0.15)",
                    border: "1px solid rgba(251, 191, 36, 0.5)",
                    borderRadius: "4px",
                    transform: "rotate(-25deg)",
                    boxShadow: "0 8px 18px rgba(0,0,0,0.4)",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: "10px", fontWeight: 900, color: "#FBBF24" }}>100</span>
                  <DollarSign className="w-4 h-4 text-[#FBBF24]" />
                  <span style={{ fontSize: "10px", fontWeight: 900, color: "#FBBF24" }}>$</span>
                </div>

                <div
                  style={{
                    position: "absolute",
                    top: "30px",
                    right: "22px",
                    width: "74px",
                    height: "42px",
                    background: "rgba(251, 191, 36, 0.12)",
                    border: "1px solid rgba(251, 191, 36, 0.45)",
                    borderRadius: "4px",
                    transform: "rotate(28deg)",
                    boxShadow: "0 8px 18px rgba(0,0,0,0.4)",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: "9px", fontWeight: 900, color: "#FBBF24" }}>100</span>
                  <DollarSign className="w-3.5 h-3.5 text-[#FBBF24]" />
                  <span style={{ fontSize: "9px", fontWeight: 900, color: "#FBBF24" }}>$</span>
                </div>

                {/* 3D Vibrant Sunset Orange Rolled Event Admission Tickets */}
                <div
                  style={{
                    width: "160px",
                    height: "110px",
                    position: "relative",
                    transform: "rotate(-10deg)",
                    filter: "drop-shadow(0 14px 32px rgba(255, 90, 31, 0.5))",
                  }}
                >
                  {/* Rolled spool cylinder */}
                  <div
                    style={{
                      width: "130px",
                      height: "75px",
                      background: "linear-gradient(135deg, #FF7A45 0%, #FF5A1F 55%, #D63900 100%)",
                      borderRadius: "14px",
                      border: "2px solid rgba(255, 255, 255, 0.45)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#FFFFFF",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ position: "absolute", top: "4px", left: "6px", right: "6px", borderTop: "1px dashed rgba(255,255,255,0.7)" }} />
                    <div style={{ fontSize: "28px", fontWeight: 900, color: "#FFFFFF", lineHeight: 1 }}>?</div>
                    <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.15em", color: "#FFE4D6", marginTop: "2px" }}>
                      ADMISSION TICKET
                    </div>
                    <div style={{ position: "absolute", bottom: "4px", left: "6px", right: "6px", borderBottom: "1px dashed rgba(255,255,255,0.7)" }} />
                  </div>

                  {/* Ribbon curl tail */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-8px",
                      right: "-12px",
                      width: "80px",
                      height: "44px",
                      background: "linear-gradient(135deg, #FF5A1F 0%, #D63900 100%)",
                      borderRadius: "8px",
                      transform: "rotate(18deg)",
                      zIndex: -1,
                      border: "1.5px solid rgba(255, 255, 255, 0.35)",
                    }}
                  />
                </div>
              </div>

              {/* Card 3 Text & Action */}
              <div style={{ padding: "24px 22px 22px", display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#FFFFFF", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
                    Collect payments
                  </h3>
                  <p style={{ fontSize: "15px", color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.4, margin: "0 0 20px" }}>
                    Sell tickets or request money from guests
                  </p>
                </div>
                <Link
                  href="/apply"
                  style={{
                    background: "rgba(255, 90, 31, 0.12)",
                    border: "1px solid rgba(255, 90, 31, 0.45)",
                    color: "#FF8A3D",
                    fontSize: "14px",
                    fontWeight: 700,
                    padding: "12px 16px",
                    borderRadius: "0px",
                    textAlign: "center",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                  className="hover:bg-[#FF5A1F] hover:text-white transition-colors"
                >
                  Try it ↗
                </Link>
              </div>
            </div>
          </div>

          {/* ─── SUB-FEATURE ROWS (BLACK & ORANGE THEMED) ─── */}

          {/* Sub-row 1: Send invites on any platform */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "48px",
              alignItems: "center",
              marginBottom: "110px",
            }}
          >
            {/* Visual Box (Left): Illustrated card with vintage dove and pixel retro stickers in Black & Orange theme */}
            <div
              style={{
                background: "linear-gradient(145deg, #1C0F18 0%, #120A14 50%, #200E06 100%)",
                borderRadius: "28px",
                height: "360px",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255, 90, 31, 0.3)",
                boxShadow: "0 18px 45px rgba(0, 0, 0, 0.7), 0 0 35px rgba(255, 90, 31, 0.15)",
                overflow: "hidden",
              }}
            >
              {/* Floating Instagram Pixel Icon (Top Left in Black & Orange) */}
              <div
                style={{
                  position: "absolute",
                  top: "24px",
                  left: "30px",
                  width: "44px",
                  height: "44px",
                  background: "#0E0714",
                  border: "2px solid #FF5A1F",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 18px rgba(255, 90, 31, 0.25)",
                  transform: "rotate(-10deg)",
                }}
              >
                <div style={{ width: "24px", height: "24px", border: "2.5px solid #FF8A3D", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: "8px", height: "8px", border: "2px solid #FF8A3D", borderRadius: "50%" }} />
                </div>
              </div>

              {/* Floating Partiful Pixel Bubble (Top Right with Orange Glow) */}
              <div
                style={{
                  position: "absolute",
                  top: "22px",
                  right: "26px",
                  background: "#120A16",
                  border: "2.5px solid #FF5A1F",
                  padding: "6px 12px",
                  boxShadow: "3px 3px 0 #FF5A1F",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 900,
                  color: "#FFFFFF",
                  transform: "rotate(4deg)",
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: 900, color: "#FF5A1F" }}>?</span> partiful
              </div>

              {/* Floating Pixel Arrow (Bottom Left) */}
              <div
                style={{
                  position: "absolute",
                  bottom: "32px",
                  left: "32px",
                  width: "36px",
                  height: "36px",
                  transform: "rotate(-20deg)",
                }}
              >
                <svg viewBox="0 0 24 24" fill="#FF5A1F" style={{ width: "100%", height: "100%", filter: "drop-shadow(2px 2px 0 #000)" }}>
                  <polygon points="2,2 2,22 8,16 14,22 17,19 11,13 19,13" />
                </svg>
              </div>

              {/* Floating Envelope Icon (Bottom Right with Orange Border) */}
              <div
                style={{
                  position: "absolute",
                  bottom: "26px",
                  right: "34px",
                  background: "#120A16",
                  border: "2px solid #FF5A1F",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  boxShadow: "3px 3px 0 #FF5A1F",
                  transform: "rotate(8deg)",
                }}
              >
                <Mail className="w-5 h-5 text-[#FF8A3D]" />
              </div>

              {/* Floating Scattered Orange Hearts */}
              <span style={{ position: "absolute", top: "60px", left: "30%", color: "#FF5A1F", fontSize: "16px" }}>♥</span>
              <span style={{ position: "absolute", top: "110px", left: "22%", color: "#FF8A3D", fontSize: "13px" }}>♥</span>
              <span style={{ position: "absolute", bottom: "90px", right: "20%", color: "#FF5A1F", fontSize: "15px" }}>♥</span>
              <span style={{ position: "absolute", top: "140px", right: "24%", color: "#FFB088", fontSize: "12px" }}>♥</span>

              {/* Central Vintage Dove Artwork Card with Orange Sky */}
              <div
                style={{
                  width: "190px",
                  background: "#160D1A",
                  borderRadius: "14px",
                  boxShadow: "0 12px 30px rgba(0, 0, 0, 0.6)",
                  overflow: "hidden",
                  border: "2px solid rgba(255, 90, 31, 0.4)",
                  textAlign: "center",
                }}
              >
                {/* Sky & Dove Canvas */}
                <div style={{ height: "150px", background: "linear-gradient(180deg, #32160A 0%, #180B05 100%)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {/* Flying vintage dove SVG */}
                  <svg viewBox="0 0 100 80" style={{ width: "85%", height: "85%" }}>
                    <path
                      d="M20,45 C28,30 45,22 65,24 C55,15 40,12 25,18 C15,22 8,30 20,45 Z"
                      fill="#FFFFFF"
                      stroke="#FF5A1F"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M25,40 C35,38 52,38 70,42 C80,44 88,40 92,34 C85,46 72,54 55,56 C42,58 30,52 25,40 Z"
                      fill="#FFFFFF"
                      stroke="#FF5A1F"
                      strokeWidth="1.5"
                    />
                    {/* Ribbon in beak */}
                    <path d="M22,44 Q14,56 18,65" fill="none" stroke="#FF5A1F" strokeWidth="2" />
                    <rect x="12" y="62" width="18" height="12" fill="#FEF08A" stroke="#FF5A1F" strokeWidth="1" rx="2" />
                    <text x="14" y="70" fontSize="5" fontWeight="bold" fill="#000">you&apos;re invited</text>
                  </svg>
                </div>
                {/* RSVP to my party card stub */}
                <div style={{ background: "#0D0812", padding: "10px 8px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 800, color: "#FFFFFF" }}>RSVP to my party</div>
                  <div style={{ fontSize: "10px", color: "#FF8A3D", fontWeight: 600 }}>partiful.com</div>
                </div>
              </div>
            </div>

            {/* Content (Right) */}
            <div style={{ paddingLeft: "8px" }}>
              <h3
                style={{
                  fontFamily: "var(--font-display), system-ui, sans-serif",
                  fontSize: "clamp(28px, 3.5vw, 42px)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "#FFFFFF",
                  lineHeight: 1.15,
                  margin: "0 0 16px",
                }}
              >
                Send invites on any platform 📫
              </h3>
              <p
                style={{
                  fontSize: "17px",
                  color: "rgba(255, 255, 255, 0.7)",
                  lineHeight: 1.5,
                  margin: "0 0 28px",
                  maxWidth: "460px",
                }}
              >
                Share anywhere: Email, Text, Instagram, WhatsApp, phone contacts and more.
              </p>
              <Link
                href="/apply"
                style={{
                  background: "#FF5A1F",
                  color: "#FFFFFF",
                  fontSize: "15px",
                  fontWeight: 800,
                  padding: "14px 34px",
                  borderRadius: "0px",
                  textDecoration: "none",
                  display: "inline-block",
                  letterSpacing: "-0.01em",
                  boxShadow: "0 8px 24px rgba(255, 90, 31, 0.35)",
                }}
                className="hover:bg-[#FF7A45] transition-colors cursor-pointer"
              >
                Create event
              </Link>
            </div>
          </div>

          {/* Sub-row 2: Get a shareable photo album */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "48px",
              alignItems: "center",
            }}
          >
            {/* Content (Left) */}
            <div style={{ paddingRight: "8px" }}>
              <h3
                style={{
                  fontFamily: "var(--font-display), system-ui, sans-serif",
                  fontSize: "clamp(28px, 3.5vw, 42px)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "#FFFFFF",
                  lineHeight: 1.15,
                  margin: "0 0 16px",
                }}
              >
                Get a shareable photo album 🤳
              </h3>
              <p
                style={{
                  fontSize: "17px",
                  color: "rgba(255, 255, 255, 0.7)",
                  lineHeight: 1.5,
                  margin: "0 0 28px",
                  maxWidth: "460px",
                }}
              >
                Look back on memories and add your snaps to the album—guests can add too!
              </p>
              <Link
                href="/apply"
                style={{
                  background: "#FF5A1F",
                  color: "#FFFFFF",
                  fontSize: "15px",
                  fontWeight: 800,
                  padding: "14px 34px",
                  borderRadius: "0px",
                  textDecoration: "none",
                  display: "inline-block",
                  letterSpacing: "-0.01em",
                  boxShadow: "0 8px 24px rgba(255, 90, 31, 0.35)",
                }}
                className="hover:bg-[#FF7A45] transition-colors cursor-pointer"
              >
                Create event
              </Link>
            </div>

            {/* Visual Box (Right): Flash photography album with reaction pills */}
            <div
              style={{
                height: "360px",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Top Speech Bubble Pill: "Add your photos to the album ⚡" in Dark Theme */}
              <div
                style={{
                  position: "absolute",
                  top: "14px",
                  left: "14px",
                  background: "#180E1C",
                  border: "1px solid rgba(255, 90, 31, 0.45)",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: 800,
                  padding: "9px 18px",
                  borderRadius: "999px",
                  boxShadow: "0 10px 24px rgba(0, 0, 0, 0.6)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  zIndex: 10,
                  transform: "rotate(-5deg)",
                }}
              >
                <span>Add your photos to the album</span>
                <span style={{ color: "#FF8A3D" }}>⚡</span>
              </div>

              {/* Photo Collage Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  width: "310px",
                  height: "300px",
                }}
              >
                {/* Photo 1 (Top Left) */}
                <div style={{ position: "relative", borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 20px rgba(0,0,0,0.6)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/partiful-photo-girls.jpg" alt="Party moment" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>

                {/* Photo 2 (Top Right) */}
                <div style={{ position: "relative", borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 20px rgba(0,0,0,0.6)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/padel-squad.jpg" alt="Party friend squad" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {/* Floating Heart reaction badge */}
                  <div style={{ position: "absolute", top: "10px", right: "8px", background: "rgba(18, 12, 22, 0.92)", border: "1px solid rgba(255, 90, 31, 0.4)", color: "#FFFFFF", padding: "3px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 800, boxShadow: "0 4px 10px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>❤️</span> 12
                  </div>
                </div>

                {/* Photo 3 (Bottom Left) */}
                <div style={{ position: "relative", borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 20px rgba(0,0,0,0.6)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/chai-cafe.jpg" alt="Party dancing" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {/* Floating In-Love reaction badge */}
                  <div style={{ position: "absolute", bottom: "10px", left: "8px", background: "rgba(18, 12, 22, 0.92)", border: "1px solid rgba(255, 90, 31, 0.4)", color: "#FFFFFF", padding: "3px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 800, boxShadow: "0 4px 10px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>😍</span> 8
                  </div>
                </div>

                {/* Photo 4 (Bottom Right with +20 overlay) */}
                <div style={{ position: "relative", borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 20px rgba(0,0,0,0.6)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/hero-rooftop.jpg" alt="More party photos" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(2px) brightness(0.7)" }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontSize: "20px", fontWeight: 900 }}>
                    +20
                  </div>
                  {/* Floating Fire reaction badge */}
                  <div style={{ position: "absolute", bottom: "-6px", left: "14px", background: "rgba(18, 12, 22, 0.92)", border: "1px solid rgba(255, 90, 31, 0.4)", color: "#FFFFFF", padding: "3px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 800, boxShadow: "0 4px 10px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>🔥</span> 13
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. "REAL REVIEWS, FROM REAL USERS" (BLACK & ORANGE THEMED CLONE) ─── */}
      <section
        id="reviews-section"
        style={{
          background: "#060408",
          color: "#FFFFFF",
          padding: "96px 24px 110px",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          position: "relative",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "54px",
            alignItems: "flex-start",
          }}
        >
          {/* Left Column: Rating Badge, Heading, Subtitle & CTA */}
          <div style={{ maxWidth: "460px" }}>
            {/* Rating pill */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                border: "1px solid rgba(255, 90, 31, 0.35)",
                background: "rgba(255, 255, 255, 0.05)",
                padding: "6px 14px",
                borderRadius: "999px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                marginBottom: "24px",
              }}
            >
              <div style={{ display: "flex", gap: "2px", color: "#FF9500", fontSize: "13px" }}>
                {"★★★★★"}
              </div>
              <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#FFFFFF" }}>
                5.0 • 217K Ratings
              </span>
            </div>

            {/* Display Heading */}
            <h2
              style={{
                fontFamily: "var(--font-display), system-ui, sans-serif",
                fontSize: "clamp(34px, 4.4vw, 54px)",
                fontWeight: 800,
                letterSpacing: "-0.035em",
                color: "#FFFFFF",
                lineHeight: 1.08,
                margin: "0 0 16px",
              }}
            >
              Real reviews, from<br />real users
            </h2>

            {/* Description */}
            <p
              style={{
                fontSize: "18px",
                color: "rgba(255, 255, 255, 0.7)",
                lineHeight: 1.5,
                margin: "0 0 32px",
              }}
            >
              Don&apos;t just take our word for it. See what our users say.
            </p>

            {/* Sharp Orange CTA Button */}
            <Link
              href="/apply"
              style={{
                background: "#FF5A1F",
                color: "#FFFFFF",
                fontSize: "15px",
                fontWeight: 800,
                padding: "14px 36px",
                borderRadius: "0px",
                textDecoration: "none",
                display: "inline-block",
                letterSpacing: "-0.01em",
                boxShadow: "0 8px 24px rgba(255, 90, 31, 0.35)",
              }}
              className="hover:bg-[#FF7A45] transition-colors cursor-pointer"
            >
              Try it out
            </Link>
          </div>

          {/* Right Column: 8 User Reviews in 2-Column Dark Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "16px",
            }}
          >
            {/* Review 1 */}
            <div
              style={{
                background: "#110D18",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "14px",
                padding: "18px 20px",
                boxShadow: "0 4px 18px rgba(0, 0, 0, 0.5)",
              }}
              className="hover:border-[#FF5A1F]/40 transition-colors"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                <span style={{ fontSize: "14.5px", fontWeight: 800, color: "#FFFFFF" }}>A must</span>
                <span style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.45)" }}>May 29 • r3boi</span>
              </div>
              <div style={{ color: "#FF8A3D", fontSize: "12px", marginBottom: "8px" }}>★★★★★</div>
              <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45, margin: 0 }}>
                I don&apos;t even hang out with my friends if they don&apos;t send me the partiful first
              </p>
            </div>

            {/* Review 2 */}
            <div
              style={{
                background: "#110D18",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "14px",
                padding: "18px 20px",
                boxShadow: "0 4px 18px rgba(0, 0, 0, 0.5)",
              }}
              className="hover:border-[#FF5A1F]/40 transition-colors"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                <span style={{ fontSize: "14.5px", fontWeight: 800, color: "#FFFFFF" }}>Best Party/Event App</span>
                <span style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.45)" }}>Nov 14 • MarpZilla</span>
              </div>
              <div style={{ color: "#FF8A3D", fontSize: "12px", marginBottom: "8px" }}>★★★★★</div>
              <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45, margin: 0 }}>
                By far the best app for events. Puts Facebook events or evite to shame.
              </p>
            </div>

            {/* Review 3 */}
            <div
              style={{
                background: "#110D18",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "14px",
                padding: "18px 20px",
                boxShadow: "0 4px 18px rgba(0, 0, 0, 0.5)",
              }}
              className="hover:border-[#FF5A1F]/40 transition-colors"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                <span style={{ fontSize: "14.5px", fontWeight: 800, color: "#FFFFFF" }}>Best App Ever</span>
                <span style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.45)" }}>Mar 25 • ch_ch_charleigh</span>
              </div>
              <div style={{ color: "#FF8A3D", fontSize: "12px", marginBottom: "8px" }}>★★★★★</div>
              <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45, margin: 0 }}>
                If partiful has one million users I am one. If partiful has one thousand users I am one. If partiful has one hundred user I am one. If partiful has no users then I am not around anymore.
              </p>
            </div>

            {/* Review 4 */}
            <div
              style={{
                background: "#110D18",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "14px",
                padding: "18px 20px",
                boxShadow: "0 4px 18px rgba(0, 0, 0, 0.5)",
              }}
              className="hover:border-[#FF5A1F]/40 transition-colors"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                <span style={{ fontSize: "14.5px", fontWeight: 800, color: "#FFFFFF" }}>Finally a good app that&apos;s 100% free</span>
                <span style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.45)" }}>Nov 7 • Tlackshots girl</span>
              </div>
              <div style={{ color: "#FF8A3D", fontSize: "12px", marginBottom: "8px" }}>★★★★★</div>
              <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45, margin: 0 }}>
                I LOVE THIS APP! It&apos;s 100% free, it&apos;s cute, and innovative! I love that you cna change the theme, the backrounds, add a link for the address and get RSVP&apos;s...
              </p>
            </div>

            {/* Review 5 */}
            <div
              style={{
                background: "#110D18",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "14px",
                padding: "18px 20px",
                boxShadow: "0 4px 18px rgba(0, 0, 0, 0.5)",
              }}
              className="hover:border-[#FF5A1F]/40 transition-colors"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                <span style={{ fontSize: "14.5px", fontWeight: 800, color: "#FFFFFF" }}>The rare *perfect* app</span>
                <span style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.45)" }}>Jun 11 • LibertyLikes</span>
              </div>
              <div style={{ color: "#FF8A3D", fontSize: "12px", marginBottom: "8px" }}>★★★★★</div>
              <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45, margin: 0 }}>
                So many apps try to do too many things and does any one of those things just okay. Partiful sets out to be one thing - the best way to coordinate a party or event. And it is that one thing perfectly.
              </p>
            </div>

            {/* Review 6 */}
            <div
              style={{
                background: "#110D18",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "14px",
                padding: "18px 20px",
                boxShadow: "0 4px 18px rgba(0, 0, 0, 0.5)",
              }}
              className="hover:border-[#FF5A1F]/40 transition-colors"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                <span style={{ fontSize: "14.5px", fontWeight: 800, color: "#FFFFFF" }}>The BEST way to wrangle your friends</span>
                <span style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.45)" }}>Nov 3 • Some party planner</span>
              </div>
              <div style={{ color: "#FF8A3D", fontSize: "12px", marginBottom: "8px" }}>★★★★★</div>
              <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45, margin: 0 }}>
                I rarely write reviews. This app is so great that I specifically came here to tell you about it.
              </p>
            </div>

            {/* Review 7 */}
            <div
              style={{
                background: "#110D18",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "14px",
                padding: "18px 20px",
                boxShadow: "0 4px 18px rgba(0, 0, 0, 0.5)",
              }}
              className="hover:border-[#FF5A1F]/40 transition-colors"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                <span style={{ fontSize: "14.5px", fontWeight: 800, color: "#FFFFFF" }}>I love partiful</span>
                <span style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.45)" }}>Nov 18 • Juliette Legault</span>
              </div>
              <div style={{ color: "#FF8A3D", fontSize: "12px", marginBottom: "8px" }}>★★★★★</div>
              <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45, margin: 0 }}>
                helped me coordinate a surprise party for my bf. I love it so much it amkes planning parties so easy !!!
              </p>
            </div>

            {/* Review 8 */}
            <div
              style={{
                background: "#110D18",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "14px",
                padding: "18px 20px",
                boxShadow: "0 4px 18px rgba(0, 0, 0, 0.5)",
              }}
              className="hover:border-[#FF5A1F]/40 transition-colors"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                <span style={{ fontSize: "14.5px", fontWeight: 800, color: "#FFFFFF" }}>Changed my life</span>
                <span style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.45)" }}>Oct 26 • xjoejoex121</span>
              </div>
              <div style={{ color: "#FF8A3D", fontSize: "12px", marginBottom: "8px" }}>★★★★★</div>
              <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45, margin: 0 }}>
                Made so many great memories with friends because of this app. 10/10
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. "PHOTO DROPS FROM THE PARTY" (CANDID FLASH PHOTOGRAPHY GALLERY) ── */}
      <section
        id="photo-drops-section"
        style={{
          padding: "90px 20px 100px",
          maxWidth: "1240px",
          margin: "0 auto",
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: "44px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255, 77, 45, 0.1)",
              border: "1px solid rgba(255, 77, 45, 0.25)",
              padding: "4px 12px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 800,
              color: "#FF8A6E",
              marginBottom: "14px",
            }}
          >
            <Camera className="w-3.5 h-3.5 text-[#FF4D2D]" /> CANDID FLASH GALLERY
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display), system-ui, sans-serif",
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              margin: "0 0 10px",
            }}
          >
            Photo drops from the party
          </h2>
          <p style={{ fontSize: "16px", color: "var(--text-secondary)", margin: 0 }}>
            Real moments from real squads across Karachi.
          </p>
        </div>

        {/* 3 Real Photography Cards Gallery */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "28px" }}>
          <div style={{ borderRadius: "26px", overflow: "hidden", position: "relative", height: "350px", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/hero-rooftop.jpg" alt="Rooftop party Karachi" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", bottom: "16px", left: "16px", background: "rgba(9, 8, 14, 0.85)", backdropFilter: "blur(10px)", border: "1px solid rgba(255, 255, 255, 0.15)", padding: "7px 16px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
              <MapPin className="w-3.5 h-3.5 text-[#FF5A1F]" />
              <span>Rooftop Sunset · DHA Phase 6</span>
            </div>
          </div>

          <div style={{ borderRadius: "26px", overflow: "hidden", position: "relative", height: "350px", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/padel-squad.jpg" alt="Padel night match" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", bottom: "16px", left: "16px", background: "rgba(9, 8, 14, 0.85)", backdropFilter: "blur(10px)", border: "1px solid rgba(255, 255, 255, 0.15)", padding: "7px 16px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
              <Zap className="w-3.5 h-3.5 text-[#FF5A1F]" />
              <span>Midnight Padel · Velocity Clifton</span>
            </div>
          </div>

          <div style={{ borderRadius: "26px", overflow: "hidden", position: "relative", height: "350px", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/chai-cafe.jpg" alt="Chai and games hangout" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", bottom: "16px", left: "16px", background: "rgba(9, 8, 14, 0.85)", backdropFilter: "blur(10px)", border: "1px solid rgba(255, 255, 255, 0.15)", padding: "7px 16px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
              <Flame className="w-3.5 h-3.5 text-[#FF8A3D]" />
              <span>Boardgames & Chai · E-Street</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 11. FOOTER (BLACK & ORANGE THEMED CLONE OF IMAGE 5) ─────────────── */}
      <footer
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          background: "#060408",
          color: "#FFFFFF",
          padding: "72px 24px 44px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "48px",
            marginBottom: "56px",
          }}
        >
          {/* Left Brand: Iconic Partiful Logo in Black & Orange */}
          <div style={{ minWidth: "160px" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                textDecoration: "none",
                color: "#FFFFFF",
              }}
            >
              {/* Partiful ? Logo Emblem with Orange Border & Symbol */}
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  border: "2.5px solid #FF5A1F",
                  background: "#120A16",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "17px",
                  color: "#FF5A1F",
                  lineHeight: 1,
                  boxShadow: "0 2px 8px rgba(255, 90, 31, 0.3)",
                }}
              >
                ?
              </div>
              <span
                style={{
                  fontFamily: "var(--font-display), system-ui, sans-serif",
                  fontSize: "24px",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: "#FFFFFF",
                }}
              >
                partiful
              </span>
            </Link>
          </div>

          {/* Right Navigation: 5 Distinct Columns (Image 5 Layout in Dark Theme) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "36px",
              flexGrow: 1,
              maxWidth: "880px",
            }}
          >
            {/* Column 1: Download */}
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF", marginBottom: "16px" }}>
                Download
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "rgba(255, 255, 255, 0.65)" }}>
                <a href="#download" className="hover:text-[#FF5A1F] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>App on iOS</a>
                <a href="#download" className="hover:text-[#FF5A1F] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>App on Android</a>
              </div>
            </div>

            {/* Column 2: Company */}
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF", marginBottom: "16px" }}>
                Company
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "rgba(255, 255, 255, 0.65)" }}>
                <a href="#about" className="hover:text-[#FF5A1F] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>About</a>
                <a href="#press" className="hover:text-[#FF5A1F] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Press</a>
                <a href="#careers" className="hover:text-[#FF5A1F] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Careers</a>
                <a href="#terms" className="hover:text-[#FF5A1F] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Terms & Conditions</a>
                <a href="#privacy" className="hover:text-[#FF5A1F] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Privacy Policy</a>
                <a href="#cookies" className="hover:text-[#FF5A1F] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Cookie Policy</a>
                <a href="#community" className="hover:text-[#FF5A1F] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Community Guidelines</a>
              </div>
            </div>

            {/* Column 3: Product */}
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF", marginBottom: "16px" }}>
                Product
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "rgba(255, 255, 255, 0.65)" }}>
                <a href="#organizers" className="hover:text-[#FF5A1F] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>For Organizers</a>
                <a href="#tickets" className="hover:text-[#FF5A1F] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Sell Tickets</a>
                <a href="#events-section" className="hover:text-[#FF5A1F] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Explore Events</a>
                <a href="#blog" className="hover:text-[#FF5A1F] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Blog</a>
              </div>
            </div>

            {/* Column 4: Socials */}
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF", marginBottom: "16px" }}>
                Socials
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "rgba(255, 255, 255, 0.65)" }}>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#FF5A1F] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Instagram</a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#FF5A1F] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Twitter</a>
                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#FF5A1F] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>TikTok</a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#FF5A1F] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>LinkedIn</a>
                <a href="https://substack.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#FF5A1F] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Substack</a>
              </div>
            </div>

            {/* Column 5: Support */}
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF", marginBottom: "16px" }}>
                Support
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "rgba(255, 255, 255, 0.65)" }}>
                <a href="#contact" className="hover:text-[#FF5A1F] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Contact</a>
                <a href="#help" className="hover:text-[#FF5A1F] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>Help Center</a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Sub-Bar: Copyright + Skin Switcher */}
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            paddingTop: "24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            fontSize: "12.5px",
            color: "rgba(255, 255, 255, 0.45)",
          }}
        >
          <div>© 2026 Partiful / Solo-No-More. All rights reserved.</div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>Visual Skin:</span>
            <ThemeToggle />
          </div>
        </div>
      </footer>

    </div>
  );
}
