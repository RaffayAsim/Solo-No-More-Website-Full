"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import OverlapFeatureCards from "./OverlapFeatureCards";
import BeaconSimulator from "./BeaconSimulator";
import ScrollToTopButton from "./ScrollToTopButton";
import SignUpDropdown from "./SignUpDropdown";
import { supabase } from "@/lib/supabase/client";
import EventQuickPreviewModal, { EventPreviewData } from "./events/EventQuickPreviewModal";
import BeaconQuickPreviewModal, { BeaconPreviewData } from "./beacons/BeaconQuickPreviewModal";
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
  Eye,
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
  Music,
  Utensils,
  QrCode,
  Play,
  Video,
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
    quote: "Hangouts nationwide are officially back.",
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
    quote: "How Gen-Z nationwide is ditching algorithms for real scenes.",
    source: "PROPAKISTANI",
    type: "partner",
    tag: "COMMUNITY REPORT",
    stars: 5,
  },
  {
    quote: "The antidote to social isolation and flaky plans nationwide.",
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
    role: "Night Scene Explorer",
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

export const MEMBERS_ONLY_EVENTS: MembersOnlyEventItem[] = [
  {
    id: "safari-tourist-train",
    category: "trips",
    title: "Safari Tourist Train",
    curator: "Solo-No-More Official Excursion",
    date: "2026-06-09 • 8:00 PM",
    location: "Safari Tourist Train Rawalpindi to...",
    price: "PKR 4,500",
    publicPrice: "PKR 6,000",
    spotsLeft: "50 left",
    spotsRemaining: 50,
    totalSpots: 60,
    image: "/images/event-safari-train.jpg",
    hotBadge: "HOT",
    perkBadge: "Scenic Vista Railcar Pass",
    membersOnly: true,
  },
  {
    id: "drift-fest-karachi",
    category: "motorsports",
    title: "Drift Fest Karachi",
    curator: "Apex Racing × Solo-No-More",
    date: "2026-06-03 • 8:00 PM",
    location: "Omni Karting Circuit",
    price: "PKR Rs 1,500",
    publicPrice: "PKR 2,500",
    spotsLeft: "38 left",
    spotsRemaining: 38,
    totalSpots: 50,
    image: "/images/beacon-now-26.jpg",
    hotBadge: "HOT",
    perkBadge: "Pitlane & Karting Pass",
    membersOnly: true,
  },
  {
    id: "chaand-raat-bnc",
    category: "culture",
    title: "Chaand Raat by BnC Offline",
    curator: "BnC Offline × Solo-No-More",
    date: "2026-03-20 • 12:00 AM",
    location: "Third Culture Coffee",
    price: "PKR 2,500/-",
    publicPrice: "PKR 3,500",
    spotsLeft: "50 left",
    spotsRemaining: 50,
    totalSpots: 70,
    image: "/images/beacon-chai.jpg",
    hotBadge: "HOT",
    perkBadge: "Henna & Elaichi Chai Bar",
    membersOnly: true,
  },
  {
    id: "scene-92-desi-cultural",
    category: "music",
    title: "Scene 92 – A Desi Cultural...",
    curator: "Arts Council Karachi Stage",
    date: "2026-02-13 • 7:00 PM - 12:00 AM",
    location: "Studio 1, Arts Council",
    price: "PKR 4,000/-",
    publicPrice: "PKR 5,500",
    spotsLeft: "50 left",
    spotsRemaining: 50,
    totalSpots: 80,
    image: "/images/acoustic-jam.jpg",
    hotBadge: "HOT",
    perkBadge: "Full DJ Lineup Pass",
    membersOnly: true,
  },
  {
    id: "midnight-supercars",
    category: "motorsports",
    title: "Supercars & Midnight Run",
    curator: "Velocity Convoy Karachi",
    date: "2026-04-18 • 10:30 PM",
    location: "Emaar Oceanfront Promenade",
    price: "PKR 3,500/-",
    publicPrice: "PKR 5,000",
    spotsLeft: "18 left",
    spotsRemaining: 18,
    totalSpots: 30,
    image: "/images/hero-rooftop.jpg",
    hotBadge: "HOT",
    perkBadge: "Oceanfront VIP Convoy",
    membersOnly: true,
  },
  {
    id: "pro-am-padel",
    category: "culture",
    title: "Pro-Am Padel Invitational",
    curator: "Legends Arena Padel",
    date: "2026-05-02 • 9:00 PM",
    location: "Legends Arena Karachi",
    price: "PKR 2,200/-",
    publicPrice: "PKR 3,200",
    spotsLeft: "12 left",
    spotsRemaining: 12,
    totalSpots: 24,
    image: "/images/padel-squad.jpg",
    hotBadge: "HOT",
    perkBadge: "Court Racquets & Drinks",
    membersOnly: true,
  },
  {
    id: "loft-acoustics",
    category: "music",
    title: "Secret Loft Acoustics Vol. 4",
    curator: "Indie Acoustic Sessions",
    date: "2026-05-20 • 8:30 PM",
    location: "DHA Phase 5 Loft Studio",
    price: "PKR 3,000/-",
    publicPrice: "PKR 4,200",
    spotsLeft: "25 left",
    spotsRemaining: 25,
    totalSpots: 40,
    image: "/images/beach-bonfire.jpg",
    hotBadge: "HOT",
    perkBadge: "Unplugged Acoustic Jam",
    membersOnly: true,
  },
  {
    id: "retro-arcade",
    category: "culture",
    title: "Neon Arcade & Vinyl Night",
    curator: "Retro Underground Karachi",
    date: "2026-06-12 • 9:00 PM",
    location: "Old City Retro Lounge",
    price: "PKR 1,800/-",
    publicPrice: "PKR 2,800",
    spotsLeft: "30 left",
    spotsRemaining: 30,
    totalSpots: 50,
    image: "/images/chai-cafe.jpg",
    hotBadge: "HOT",
    perkBadge: "Unlimited Arcade Tokens",
    membersOnly: true,
  },
];

export default function LandingPageClient({
  reviewWallData,
}: {
  reviewWallData?: any;
} = {}) {
  const [activeCategory, setActiveCategory] = useState<EventCategory>("birthday");
  const [activeRsvp, setActiveRsvp] = useState<"going" | "maybe" | "cantGo" | null>("going");
  const [selectedTemplate, setSelectedTemplate] = useState<TrendingTemplateItem>(TEMPLATES[0]);
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

  const openEventPreview = (event: MembersOnlyEventItem) => {
    const priceNum = parseInt(event.price.replace(/[^0-9]/g, "")) || 2500;
    const publicPriceNum = parseInt(event.publicPrice.replace(/[^0-9]/g, "")) || 3500;
    setPreviewEvent({
      id: event.id,
      title: event.title,
      description: `${event.title} curated by ${event.curator}. Verified members-only IRL community experience. Includes ${event.perkBadge}.`,
      venue_name: event.location,
      location: event.location,
      date: event.date,
      flyer_image_url: event.image,
      price: event.price,
      category: event.category,
      tag: event.hotBadge || "MEMBERS ONLY",
      capacity: event.totalSpots,
      joined: event.totalSpots - event.spotsRemaining,
      hostName: event.curator,
      metadata: {
        is_members_only: true,
        tier_packages: [
          { id: "member_tier", name: "Member Tier Pass", price: priceNum, perks: event.perkBadge },
          { id: "guest_tier", name: "Guest Pass", price: publicPriceNum, perks: "Standard Admission" },
        ],
      },
    });
  };

  const openBeaconPreview = (tmpl: TrendingTemplateItem) => {
    const cat =
      tmpl.category.toLowerCase().includes("padel") || tmpl.category.toLowerCase().includes("cricket")
        ? "sports"
        : tmpl.category.toLowerCase().includes("chai")
        ? "casual"
        : "nightlife";

    setPreviewBeacon({
      id: tmpl.id,
      title: tmpl.name,
      category: cat,
      location_name: tmpl.subtext,
      location: tmpl.location,
      time: tmpl.time,
      date: "Tonight",
      total_slots: 8,
      filled_slots: 5,
      description: `${tmpl.headline} — ${tmpl.name}. Join verified squad members at ${tmpl.location}. Real people showing up.`,
      hostName: "Verified Squad Host",
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
        const currentIndex = TEMPLATES.findIndex((t) => t.id === prev.id);
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
  }, [isInteracting, isDragging]);

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
              <span>14 SQUADS HANGING OUT TONIGHT NATIONWIDE</span>
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
              <Radio className="w-3.5 h-3.5 text-[#FF5A1F] animate-pulse" /> LIVE RADAR NATIONWIDE
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
              Real-world scenes broadcasting nationwide. Scroll or drag with cursor to explore.
            </p>
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
            {TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplate.id === tmpl.id;
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
        aria-label="Press and Reviews Ticker"
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
                <span>MEMBERS ONLY</span>
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
                Members Only Events
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
                Premium access experiences curated for members.
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
            {MEMBERS_ONLY_EVENTS.map((event) => {
              const isFav = !!eventFavorites[event.id];
              return (
                <div
                  key={event.id}
                  onClick={() => openEventPreview(event)}
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

      {/* ── 8. "POWERFUL FEATURES, EASY EVENTS" (FULL-SCREEN, ROUNDED CORNERS TOP & BOTTOM, ORANGE GRADIENT & DOTTED TEXTURE) ── */}
      <section
        id="powerful-features-section"
        style={{
          width: "100%",
          borderRadius: "clamp(32px, 4vw, 56px) clamp(32px, 4vw, 56px) 0 0",
          background:
            "radial-gradient(ellipse at 50% 0%, #FF6F3A 0%, #FF5A1F 35%, #E64808 70%, #B83200 100%)",
          color: "#FFFFFF",
          padding: "70px min(4vw, 48px) 100px",
          marginTop: "24px",
          marginBottom: "0px",
          position: "relative",
          overflow: "hidden",
          border: "1.5px solid rgba(255, 255, 255, 0.22)",
          borderBottom: "none",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.45)",
        }}
      >
        {/* Subtle Geometric Dotted Texture Overlay (Matching Orange Gradient Texture) */}
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

        {/* Soft atmospheric overlay */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at 15% 25%, rgba(255, 255, 255, 0.12) 0%, transparent 40%), radial-gradient(circle at 85% 75%, rgba(0, 0, 0, 0.25) 0%, transparent 50%)",
          }}
        />

        <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 1 }}>
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
                textShadow: "0 4px 24px rgba(0, 0, 0, 0.35)",
              }}
            >
              Powerful features, easy events
            </h2>
          </div>

          {/* ─── 3 Feature Cards Grid (BLACK & ORANGE THEMED) ─── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
              gap: "28px",
              marginBottom: "110px",
            }}
          >
            {/* Card 1: Find a time that works */}
            <div
              style={{
                background: "linear-gradient(180deg, #130D1B 0%, #0E0817 100%)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "24px",
                boxShadow: "0 20px 45px rgba(0, 0, 0, 0.65)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
              }}
              className="hover:border-[#FF5A1F]/60 hover:-translate-y-1.5 transition-all duration-300"
            >
              {/* Card 1 Visual: High-Tech Group Availability & Consensus Radar */}
              <div
                style={{
                  height: "290px",
                  background: "radial-gradient(circle at 50% 15%, rgba(255, 90, 31, 0.22) 0%, rgba(35, 17, 54, 0.45) 50%, #0B0813 100%)",
                  position: "relative",
                  overflow: "hidden",
                  padding: "16px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Subtle ambient sparkles */}
                <span style={{ position: "absolute", top: "14px", left: "16px", color: "#FF5A1F", fontSize: "14px", opacity: 0.8 }}>✦</span>
                <span style={{ position: "absolute", top: "24px", right: "20px", color: "#FF8A3D", fontSize: "12px", opacity: 0.7 }}>✦</span>
                <span style={{ position: "absolute", bottom: "16px", left: "20px", color: "rgba(255,255,255,0.2)", fontSize: "10px" }}>•</span>

                {/* Glassmorphic Consensus Radar Card */}
                <div
                  style={{
                    width: "100%",
                    maxWidth: "320px",
                    background: "rgba(18, 12, 26, 0.94)",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    borderRadius: "20px",
                    padding: "14px 14px 12px",
                    boxShadow: "0 18px 40px rgba(0, 0, 0, 0.65), 0 0 24px rgba(255, 90, 31, 0.12)",
                    backdropFilter: "blur(14px)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "9px",
                  }}
                >
                  {/* Top Poll Info Bar */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Calendar className="w-3.5 h-3.5 text-[#FF8A3D]" />
                      <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#FF8A3D", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        Group Poll Consensus
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 8px #22C55E" }} />
                      <span style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.7)", fontWeight: 600 }}>14 Voted</span>
                    </div>
                  </div>

                  {/* Option 1: Top Consensus Match */}
                  <div
                    style={{
                      border: "1.5px solid rgba(255, 90, 31, 0.55)",
                      background: "linear-gradient(135deg, rgba(255, 90, 31, 0.16) 0%, rgba(24, 15, 34, 0.85) 100%)",
                      borderRadius: "14px",
                      padding: "9px 11px",
                      boxShadow: "0 4px 16px rgba(255, 90, 31, 0.18)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {/* Date block */}
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          background: "rgba(255, 90, 31, 0.22)",
                          border: "1px solid rgba(255, 90, 31, 0.45)",
                          borderRadius: "10px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ fontSize: "8px", fontWeight: 800, color: "#FF8A3D", letterSpacing: "0.08em", lineHeight: 1 }}>FRI</span>
                        <span style={{ fontSize: "16px", fontWeight: 900, color: "#FFFFFF", lineHeight: 1.1 }}>24</span>
                      </div>

                      {/* Middle Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "12px", fontWeight: 800, color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            Rooftop Sunset 🌅
                          </span>
                          <span style={{ fontSize: "9px", fontWeight: 700, color: "#FF8A3D" }}>12 can go</span>
                        </div>
                        {/* Progress Bar */}
                        <div style={{ height: "4px", background: "rgba(255, 255, 255, 0.12)", borderRadius: "999px", margin: "5px 0 3px", overflow: "hidden" }}>
                          <div style={{ width: "86%", height: "100%", background: "linear-gradient(90deg, #FF5A1F, #FF8A3D)", borderRadius: "999px" }} />
                        </div>
                        <div style={{ fontSize: "9px", color: "rgba(255, 255, 255, 0.65)" }}>8:30 PM • 86% agreement</div>
                      </div>

                      {/* Right Checkmark */}
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(34, 197, 94, 0.18)", border: "1px solid rgba(34, 197, 94, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Check className="w-3 h-3 text-[#22C55E]" />
                      </div>
                    </div>
                  </div>

                  {/* Option 2: Alternative Date */}
                  <div
                    style={{
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      background: "rgba(255, 255, 255, 0.03)",
                      borderRadius: "14px",
                      padding: "8px 11px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {/* Date block */}
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "10px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ fontSize: "8px", fontWeight: 800, color: "#9CA3AF", letterSpacing: "0.08em", lineHeight: 1 }}>SAT</span>
                        <span style={{ fontSize: "15px", fontWeight: 800, color: "#E5E7EB", lineHeight: 1.1 }}>25</span>
                      </div>

                      {/* Middle Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#D1D5DB", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            Late Drive & Chai ☕
                          </span>
                          <span style={{ fontSize: "9px", fontWeight: 600, color: "#9CA3AF" }}>6 can go</span>
                        </div>
                        {/* Progress Bar */}
                        <div style={{ height: "4px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "999px", margin: "4px 0 3px", overflow: "hidden" }}>
                          <div style={{ width: "43%", height: "100%", background: "rgba(255, 255, 255, 0.4)", borderRadius: "999px" }} />
                        </div>
                        <div style={{ fontSize: "9px", color: "rgba(255, 255, 255, 0.5)" }}>10:00 PM • 43% agreement</div>
                      </div>
                    </div>
                  </div>

                  {/* Micro Footer Notice */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", paddingTop: "2px" }}>
                    <Sparkles className="w-3 h-3 text-[#FF8A3D]" />
                    <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#FF8A3D" }}>Best match automatically scheduled for Friday</span>
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
                    border: "1.5px solid rgba(255, 90, 31, 0.4)",
                    color: "#FF8A3D",
                    fontSize: "14px",
                    fontWeight: 700,
                    padding: "12px 18px",
                    borderRadius: "999px",
                    textAlign: "center",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    transition: "all 0.2s ease",
                  }}
                  className="hover:bg-[#FF5A1F] hover:text-white hover:shadow-[0_4px_22px_rgba(255,90,31,0.4)] transition-all"
                >
                  Try it ↗
                </Link>
              </div>
            </div>

            {/* Card 2: Get answers upfront */}
            <div
              style={{
                background: "linear-gradient(180deg, #130D1B 0%, #0E0817 100%)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "24px",
                boxShadow: "0 20px 45px rgba(0, 0, 0, 0.65)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
              }}
              className="hover:border-[#FF5A1F]/60 hover:-translate-y-1.5 transition-all duration-300"
            >
              {/* Card 2 Visual: Interactive Event Customizer & Guest Preference Feed */}
              <div
                style={{
                  height: "290px",
                  background: "radial-gradient(circle at 60% 25%, rgba(225, 29, 72, 0.16) 0%, rgba(255, 90, 31, 0.14) 45%, #0C0814 100%)",
                  position: "relative",
                  overflow: "hidden",
                  padding: "16px 14px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                }}
              >
                {/* Host Question Header Card */}
                <div
                  style={{
                    width: "100%",
                    maxWidth: "320px",
                    background: "linear-gradient(135deg, rgba(255, 90, 31, 0.18) 0%, rgba(22, 14, 30, 0.95) 100%)",
                    border: "1.5px solid rgba(255, 90, 31, 0.45)",
                    borderRadius: "14px",
                    padding: "9px 12px",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.55), 0 0 18px rgba(255, 90, 31, 0.12)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #FF5A1F, #D63900)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "9px",
                          fontWeight: 800,
                          color: "#FFF",
                        }}
                      >
                        H
                      </div>
                      <span style={{ fontSize: "10px", fontWeight: 800, color: "#FF8A3D", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        Host Question
                      </span>
                    </div>
                    <span style={{ fontSize: "9px", color: "rgba(255, 255, 255, 0.6)", fontWeight: 600 }}>Required for RSVP</span>
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 800, color: "#FFFFFF" }}>
                    &quot;What should we prep for the squad?&quot; 📝
                  </div>
                </div>

                {/* Response 1: Dietary */}
                <div
                  style={{
                    width: "100%",
                    maxWidth: "320px",
                    background: "rgba(20, 14, 28, 0.88)",
                    border: "1px solid rgba(34, 197, 94, 0.35)",
                    borderRadius: "12px",
                    padding: "7px 11px",
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #22C55E, #15803D)",
                      color: "#FFF",
                      fontSize: "11px",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    S
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "8.5px", fontWeight: 800, color: "#4ADE80", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Dietary • Sarah K.
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      Gluten-free & strictly vegetarian 🥗
                    </div>
                  </div>
                  <Check className="w-3.5 h-3.5 text-[#4ADE80] shrink-0" />
                </div>

                {/* Response 2: Playlist */}
                <div
                  style={{
                    width: "100%",
                    maxWidth: "320px",
                    background: "rgba(20, 14, 28, 0.88)",
                    border: "1px solid rgba(255, 90, 31, 0.4)",
                    borderRadius: "12px",
                    padding: "7px 11px",
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)",
                    backdropFilter: "blur(10px)",
                    transform: "translateX(8px)",
                  }}
                >
                  <div
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #FF5A1F, #C2410C)",
                      color: "#FFF",
                      fontSize: "11px",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    T
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "8.5px", fontWeight: 800, color: "#FF8A3D", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Song Request • Taha M.
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      Kaytranada & Keinemusik vibes 🎵
                    </div>
                  </div>
                  <Check className="w-3.5 h-3.5 text-[#FF8A3D] shrink-0" />
                </div>

                {/* Response 3: Theme / Contribution */}
                <div
                  style={{
                    width: "100%",
                    maxWidth: "320px",
                    background: "rgba(20, 14, 28, 0.88)",
                    border: "1px solid rgba(168, 85, 247, 0.35)",
                    borderRadius: "12px",
                    padding: "7px 11px",
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)",
                    backdropFilter: "blur(10px)",
                    transform: "translateX(-6px)",
                  }}
                >
                  <div
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #A855F7, #7E22CE)",
                      color: "#FFF",
                      fontSize: "11px",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    Z
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "8.5px", fontWeight: 800, color: "#C084FC", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Bringing • Zainab
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      Ginger mocktails & matcha bites 🍹
                    </div>
                  </div>
                  <Check className="w-3.5 h-3.5 text-[#C084FC] shrink-0" />
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
                    border: "1.5px solid rgba(255, 90, 31, 0.4)",
                    color: "#FF8A3D",
                    fontSize: "14px",
                    fontWeight: 700,
                    padding: "12px 18px",
                    borderRadius: "999px",
                    textAlign: "center",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    transition: "all 0.2s ease",
                  }}
                  className="hover:bg-[#FF5A1F] hover:text-white hover:shadow-[0_4px_22px_rgba(255,90,31,0.4)] transition-all"
                >
                  Try it ↗
                </Link>
              </div>
            </div>

            {/* Card 3: Collect payments */}
            <div
              style={{
                background: "linear-gradient(180deg, #130D1B 0%, #0E0817 100%)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "24px",
                boxShadow: "0 20px 45px rgba(0, 0, 0, 0.65)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
              }}
              className="hover:border-[#FF5A1F]/60 hover:-translate-y-1.5 transition-all duration-300"
            >
              {/* Card 3 Visual: Luxury Digital Event Pass & Instant Split-Pay Module */}
              <div
                style={{
                  height: "290px",
                  background: "radial-gradient(circle at 50% 35%, rgba(255, 90, 31, 0.22) 0%, rgba(45, 18, 10, 0.3) 50%, #0B060F 100%)",
                  position: "relative",
                  overflow: "hidden",
                  padding: "16px 14px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Layer 1: Luxury Digital Ticket Pass (Angled behind) */}
                <div
                  style={{
                    width: "92%",
                    maxWidth: "300px",
                    background: "linear-gradient(135deg, rgba(255, 120, 60, 0.16) 0%, rgba(22, 12, 32, 0.95) 100%)",
                    border: "1.2px solid rgba(255, 110, 40, 0.45)",
                    borderRadius: "16px",
                    padding: "10px 14px 8px",
                    transform: "translateY(-14px) rotate(-2deg)",
                    boxShadow: "0 14px 34px rgba(0, 0, 0, 0.7), 0 0 25px rgba(255, 90, 31, 0.18)",
                    position: "relative",
                  }}
                >
                  {/* Left & Right stub notches */}
                  <div style={{ position: "absolute", left: "-7px", top: "50%", width: "12px", height: "12px", borderRadius: "50%", background: "#0B060F", transform: "translateY(-50%)" }} />
                  <div style={{ position: "absolute", right: "-7px", top: "50%", width: "12px", height: "12px", borderRadius: "50%", background: "#0B060F", transform: "translateY(-50%)" }} />

                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2px" }}>
                    <span style={{ fontSize: "8.5px", fontWeight: 800, color: "#FF8A3D", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      SOLO-NO-MORE VIP PASS
                    </span>
                    <span style={{ fontSize: "8.5px", fontWeight: 700, color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>#0842</span>
                  </div>

                  {/* Title & Meta */}
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#FFFFFF" }}>Rooftop Afterhours 🪩</div>
                  <div style={{ fontSize: "9.5px", color: "rgba(255, 255, 255, 0.7)" }}>Sat, Oct 25 • 10:00 PM • PKR 3,500</div>

                  {/* Perforated Divider & Barcode lines */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px dashed rgba(255,255,255,0.22)", paddingTop: "5px", marginTop: "5px" }}>
                    <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "12px" }}>
                      <span style={{ width: "2px", height: "12px", background: "#FF8A3D" }} />
                      <span style={{ width: "1px", height: "9px", background: "#FF8A3D" }} />
                      <span style={{ width: "3px", height: "12px", background: "#FF8A3D" }} />
                      <span style={{ width: "1px", height: "7px", background: "#FF8A3D" }} />
                      <span style={{ width: "2px", height: "12px", background: "#FF8A3D" }} />
                      <span style={{ width: "1px", height: "10px", background: "#FF8A3D" }} />
                      <span style={{ width: "3px", height: "12px", background: "#FF8A3D" }} />
                      <span style={{ width: "2px", height: "12px", background: "#FF8A3D" }} />
                      <span style={{ width: "1px", height: "8px", background: "#FF8A3D" }} />
                    </div>
                    <span style={{ fontSize: "7.5px", fontWeight: 800, letterSpacing: "0.12em", color: "#FF8A3D" }}>VERIFIED ENTRY TICKET</span>
                  </div>
                </div>

                {/* Layer 2: Instant Split-Pay Settlement Card (Floating Forward) */}
                <div
                  style={{
                    width: "96%",
                    maxWidth: "310px",
                    background: "rgba(16, 10, 22, 0.95)",
                    border: "1.5px solid rgba(255, 255, 255, 0.16)",
                    borderRadius: "15px",
                    padding: "10px 14px",
                    transform: "translateY(8px) rotate(1.5deg)",
                    boxShadow: "0 18px 42px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.5)",
                    backdropFilter: "blur(14px)",
                  }}
                >
                  {/* Top Row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <CreditCard className="w-3.5 h-3.5 text-[#FF8A3D]" />
                      <span style={{ fontSize: "11px", fontWeight: 800, color: "#FFFFFF" }}>Instant Split-Pay</span>
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: 800, color: "#22C55E", display: "flex", alignItems: "center", gap: "3px" }}>
                      <Check className="w-3 h-3" /> Auto-Collected
                    </span>
                  </div>

                  {/* Amount Display */}
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "4px 0 6px" }}>
                    <div style={{ display: "flex", alignItems: "baseline" }}>
                      <span style={{ fontSize: "21px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.03em" }}>PKR 3,500</span>
                      <span style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.55)", marginLeft: "4px" }}>/ guest</span>
                    </div>
                    <span style={{ fontSize: "9px", fontWeight: 600, color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: "999px" }}>
                      Safepay • Cards
                    </span>
                  </div>

                  {/* Live Settlement Feed */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "9.5px", color: "#9CA3AF", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "5px" }}>
                    <span style={{ color: "#E5E7EB" }}>✓ Maya R. (PKR 3,500)</span>
                    <span>•</span>
                    <span style={{ color: "#E5E7EB" }}>✓ Liam T. (PKR 3,500)</span>
                    <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 6px #22C55E" }} />
                  </div>
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
                    border: "1.5px solid rgba(255, 90, 31, 0.4)",
                    color: "#FF8A3D",
                    fontSize: "14px",
                    fontWeight: 700,
                    padding: "12px 18px",
                    borderRadius: "999px",
                    textAlign: "center",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    transition: "all 0.2s ease",
                  }}
                  className="hover:bg-[#FF5A1F] hover:text-white hover:shadow-[0_4px_22px_rgba(255,90,31,0.4)] transition-all"
                >
                  Try it ↗
                </Link>
              </div>
            </div>
          </div>

          {/* ─── SUB-FEATURE BANNERS (ELEVATED OBSIDIAN PARTY CARDS WITH HIGH DYNAMIC ENERGY) ─── */}

          {/* Sub-row 1 Banner Card: Send invites on any platform */}
          <div
            style={{
              background: "linear-gradient(145deg, #130D1C 0%, #0A0612 100%)",
              border: "1.5px solid rgba(255, 255, 255, 0.18)",
              borderRadius: "32px",
              padding: "42px 36px",
              boxShadow: "0 28px 70px rgba(0, 0, 0, 0.55), 0 0 45px rgba(255, 90, 31, 0.08)",
              marginBottom: "36px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Subtle radial ambient glow inside card */}
            <div
              style={{
                position: "absolute",
                top: "-30%",
                left: "-10%",
                width: "450px",
                height: "450px",
                background: "radial-gradient(circle, rgba(255, 90, 31, 0.12) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
                gap: "48px",
                alignItems: "center",
                position: "relative",
                zIndex: 2,
              }}
            >
              {/* Visual Box (Left): High-Fidelity Holographic RSVP Pass with Layered Floating App Badges */}
              <div
                style={{
                  background: "radial-gradient(ellipse at 50% 50%, rgba(255, 90, 31, 0.22) 0%, rgba(18, 10, 24, 0.95) 70%), #0D0714",
                  borderRadius: "28px",
                  height: "380px",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1.5px solid rgba(255, 90, 31, 0.35)",
                  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7), 0 0 35px rgba(255, 90, 31, 0.15)",
                  overflow: "hidden",
                }}
              >
                {/* Floating Instagram Close Friends Share Badge (Top Left) */}
                <div
                  style={{
                    position: "absolute",
                    top: "18px",
                    left: "22px",
                    background: "rgba(18, 10, 26, 0.92)",
                    border: "1.5px solid #FF5A1F",
                    borderRadius: "14px",
                    padding: "7px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 8px 24px rgba(255, 90, 31, 0.25)",
                    transform: "rotate(-8deg)",
                    zIndex: 5,
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div style={{ width: "22px", height: "22px", borderRadius: "6px", background: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Share2 className="w-3 h-3 text-white" />
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "#FFFFFF" }}>IG Close Friends</span>
                </div>

                {/* Floating Brand Badge (Top Right) */}
                <div
                  style={{
                    position: "absolute",
                    top: "18px",
                    right: "22px",
                    background: "#120A16",
                    border: "2px solid #FF5A1F",
                    padding: "6px 12px",
                    boxShadow: "3px 3px 0 #FF5A1F",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    fontWeight: 900,
                    color: "#FFFFFF",
                    transform: "rotate(4deg)",
                    zIndex: 5,
                  }}
                >
                  <span style={{ fontSize: "14px", fontWeight: 900, color: "#FF5A1F" }}>✦</span> solo-no-more
                </div>

                {/* Floating Interactive Cursor (Bottom Left) */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "24px",
                    left: "26px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    zIndex: 5,
                    transform: "rotate(-12deg)",
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="#FF5A1F" style={{ width: "28px", height: "28px", filter: "drop-shadow(2px 2px 0 #000)" }}>
                    <polygon points="2,2 2,22 8,16 14,22 17,19 11,13 19,13" />
                  </svg>
                  <span style={{ background: "#FF5A1F", color: "#FFFFFF", fontSize: "10px", fontWeight: 800, padding: "2px 7px", borderRadius: "999px" }}>
                    1-Tap RSVP
                  </span>
                </div>

                {/* Floating WhatsApp Squad Chat Drop (Bottom Right) */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "22px",
                    right: "24px",
                    background: "rgba(14, 26, 18, 0.94)",
                    border: "1.5px solid #25D366",
                    borderRadius: "12px",
                    padding: "7px 12px",
                    boxShadow: "0 8px 24px rgba(37, 211, 102, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    transform: "rotate(6deg)",
                    zIndex: 5,
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#25D366", boxShadow: "0 0 6px #25D366" }} />
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "#FFFFFF" }}>WhatsApp Squad (14)</span>
                </div>

                {/* Floating Neon Hearts & Sparkles */}
                <span style={{ position: "absolute", top: "72px", left: "28%", color: "#FF5A1F", fontSize: "16px", zIndex: 4 }}>♥</span>
                <span style={{ position: "absolute", top: "120px", left: "18%", color: "#FF8A3D", fontSize: "13px", zIndex: 4 }}>♥</span>
                <span style={{ position: "absolute", bottom: "80px", right: "22%", color: "#FF5A1F", fontSize: "15px", zIndex: 4 }}>♥</span>
                <span style={{ position: "absolute", top: "85px", right: "20%", color: "#FFB088", fontSize: "12px", zIndex: 4 }}>✦</span>

                {/* Central Holographic RSVP Pass */}
                <div
                  style={{
                    width: "220px",
                    background: "linear-gradient(155deg, rgba(32, 16, 42, 0.95) 0%, rgba(16, 8, 22, 0.98) 100%)",
                    borderRadius: "18px",
                    boxShadow: "0 18px 45px rgba(0, 0, 0, 0.8), 0 0 25px rgba(255, 90, 31, 0.25)",
                    overflow: "hidden",
                    border: "1.5px solid rgba(255, 90, 31, 0.45)",
                    textAlign: "center",
                    position: "relative",
                    zIndex: 3,
                  }}
                >
                  {/* Top Header Tag */}
                  <div style={{ background: "rgba(255, 90, 31, 0.14)", padding: "7px 10px", borderBottom: "1px solid rgba(255, 90, 31, 0.3)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "9px", fontWeight: 800, color: "#FF8A3D", letterSpacing: "0.08em" }}>SOLO-NO-MORE PASS</span>
                    <span style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>LIVE</span>
                  </div>

                  {/* Artwork / Party Card Body */}
                  <div style={{ padding: "14px 12px 10px", background: "linear-gradient(180deg, #2A1308 0%, #150905 100%)", position: "relative" }}>
                    {/* Retro Dove / Party Emblem */}
                    <div style={{ height: "70px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg viewBox="0 0 100 70" style={{ width: "75%", height: "100%" }}>
                        <path d="M20,40 C28,25 45,18 65,20 C55,12 40,9 25,15 C15,19 8,26 20,40 Z" fill="#FFFFFF" stroke="#FF5A1F" strokeWidth="1.5" />
                        <path d="M25,35 C35,33 52,33 70,37 C80,39 88,35 92,29 C85,41 72,49 55,51 C42,53 30,47 25,35 Z" fill="#FFFFFF" stroke="#FF5A1F" strokeWidth="1.5" />
                        <path d="M22,39 Q14,50 18,59" fill="none" stroke="#FF5A1F" strokeWidth="2" />
                        <rect x="12" y="56" width="22" height="12" fill="#FEF08A" stroke="#FF5A1F" strokeWidth="1" rx="2" />
                        <text x="14" y="64" fontSize="4.5" fontWeight="bold" fill="#000">you&apos;re invited</text>
                      </svg>
                    </div>

                    {/* Party Details */}
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF", marginTop: "4px" }}>RSVP to my party</div>
                    <div style={{ fontSize: "11px", color: "#FF8A3D", fontWeight: 800, marginTop: "2px" }}>solonomore.com</div>
                    <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.6)", marginTop: "3px" }}>24 Attending • Nationwide</div>
                  </div>

                  {/* Barcode & Share Link Stub */}
                  <div style={{ background: "#0A050E", padding: "8px 10px", borderTop: "1px dashed rgba(255, 255, 255, 0.18)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "11px" }}>
                      <span style={{ width: "2px", height: "11px", background: "#FF8A3D" }} />
                      <span style={{ width: "1px", height: "8px", background: "#FF8A3D" }} />
                      <span style={{ width: "2.5px", height: "11px", background: "#FF8A3D" }} />
                      <span style={{ width: "1px", height: "6px", background: "#FF8A3D" }} />
                      <span style={{ width: "2px", height: "11px", background: "#FF8A3D" }} />
                      <span style={{ width: "1.5px", height: "9px", background: "#FF8A3D" }} />
                    </div>
                    <span style={{ fontSize: "8.5px", color: "#22C55E", fontWeight: 800, display: "flex", alignItems: "center", gap: "3px" }}>
                      <Check className="w-2.5 h-2.5" /> Instant Share
                    </span>
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
                    color: "rgba(255, 255, 255, 0.75)",
                    lineHeight: 1.5,
                    margin: "0 0 24px",
                    maxWidth: "460px",
                  }}
                >
                  Share anywhere: Email, Text, Instagram, WhatsApp, phone contacts and more. Guests don&apos;t even need an app to RSVP.
                </p>

                {/* Feature Value Props Pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "28px" }}>
                  <span style={{ background: "rgba(255, 90, 31, 0.12)", border: "1px solid rgba(255, 90, 31, 0.3)", color: "#FF8A3D", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 700 }}>
                    ⚡ 1-Tap WhatsApp Blast
                  </span>
                  <span style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#FFFFFF", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 700 }}>
                    📲 No App Required for Guests
                  </span>
                  <span style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#FFFFFF", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 700 }}>
                    🔒 Secret Venue Protection
                  </span>
                </div>

                <Link
                  href="/apply"
                  style={{
                    background: "#FF5A1F",
                    color: "#FFFFFF",
                    fontSize: "15px",
                    fontWeight: 800,
                    padding: "14px 34px",
                    borderRadius: "999px",
                    textDecoration: "none",
                    display: "inline-block",
                    letterSpacing: "-0.01em",
                    boxShadow: "0 8px 26px rgba(255, 90, 31, 0.4)",
                    transition: "all 0.2s ease",
                  }}
                  className="hover:bg-[#FF7A45] hover:scale-105 transition-all cursor-pointer"
                >
                  Create event
                </Link>
              </div>
            </div>
          </div>

          {/* Sub-row 2 Banner Card: Get a shareable photo album (IMAGE 1 ELEVATED EXACT MATCH) */}
          <div
            style={{
              background: "linear-gradient(145deg, #130D1C 0%, #0A0612 100%)",
              border: "1.5px solid rgba(255, 255, 255, 0.18)",
              borderRadius: "32px",
              padding: "42px 36px",
              boxShadow: "0 28px 70px rgba(0, 0, 0, 0.55), 0 0 45px rgba(255, 90, 31, 0.08)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Subtle radial ambient glow inside card */}
            <div
              style={{
                position: "absolute",
                top: "-20%",
                right: "-10%",
                width: "450px",
                height: "450px",
                background: "radial-gradient(circle, rgba(255, 90, 31, 0.14) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
                gap: "48px",
                alignItems: "center",
                position: "relative",
                zIndex: 2,
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
                    color: "rgba(255, 255, 255, 0.75)",
                    lineHeight: 1.5,
                    margin: "0 0 24px",
                    maxWidth: "460px",
                  }}
                >
                  Look back on memories and add your snaps to the album — guests can add too!
                </p>

                {/* Feature Value Props Pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "28px" }}>
                  <span style={{ background: "rgba(255, 90, 31, 0.12)", border: "1px solid rgba(255, 90, 31, 0.3)", color: "#FF8A3D", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 700 }}>
                    📸 Original 4K Quality
                  </span>
                  <span style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#FFFFFF", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 700 }}>
                    ⚡ Guests Upload Without Signup
                  </span>
                  <span style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#FFFFFF", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 700 }}>
                    🔒 Private Link for Your Crew
                  </span>
                </div>

                <Link
                  href="/apply"
                  style={{
                    background: "#FF5A1F",
                    color: "#FFFFFF",
                    fontSize: "15px",
                    fontWeight: 800,
                    padding: "14px 34px",
                    borderRadius: "999px",
                    textDecoration: "none",
                    display: "inline-block",
                    letterSpacing: "-0.01em",
                    boxShadow: "0 8px 26px rgba(255, 90, 31, 0.4)",
                    transition: "all 0.2s ease",
                  }}
                  className="hover:bg-[#FF7A45] hover:scale-105 transition-all cursor-pointer"
                >
                  Create event
                </Link>
              </div>

              {/* Visual Box (Right): Flash photography album with reaction pills (IMAGE 1 EXACT DESIGN) */}
              <div
                style={{
                  height: "380px",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Top Speech Bubble Pill: "Add your photos to the album ⚡" (Tilted Pill from Image 1) */}
                <div
                  style={{
                    position: "absolute",
                    top: "14px",
                    left: "14px",
                    background: "rgba(24, 14, 28, 0.95)",
                    border: "1.5px solid rgba(255, 90, 31, 0.5)",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 800,
                    padding: "9px 18px",
                    borderRadius: "999px",
                    boxShadow: "0 12px 28px rgba(0, 0, 0, 0.7), 0 0 20px rgba(255, 90, 31, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    zIndex: 10,
                    transform: "rotate(-5deg)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <span>Add your photos to the album</span>
                  <span style={{ color: "#FF8A3D" }}>⚡</span>
                </div>

                {/* Photo Collage Grid (Image 1 Exact 2x2 Layout) */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    width: "320px",
                    height: "310px",
                  }}
                >
                  {/* Photo 1 (Top Left): Girls Laughing */}
                  <div
                    style={{
                      position: "relative",
                      borderRadius: "16px",
                      overflow: "hidden",
                      border: "1.5px solid rgba(255,255,255,0.14)",
                      boxShadow: "0 10px 24px rgba(0,0,0,0.65)",
                    }}
                    className="hover:scale-[1.03] transition-transform duration-300"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/partiful-photo-girls.jpg"
                      alt="Party moment"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  {/* Photo 2 (Top Right): Padel squad with Heart Reaction Badge */}
                  <div
                    style={{
                      position: "relative",
                      borderRadius: "16px",
                      overflow: "hidden",
                      border: "1.5px solid rgba(255,255,255,0.14)",
                      boxShadow: "0 10px 24px rgba(0,0,0,0.65)",
                    }}
                    className="hover:scale-[1.03] transition-transform duration-300"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/padel-squad.jpg"
                      alt="Party friend squad"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    {/* Floating Heart reaction badge (Image 1 Match: ❤️ 12) */}
                    <div
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "8px",
                        background: "rgba(18, 12, 22, 0.94)",
                        border: "1.2px solid rgba(255, 90, 31, 0.5)",
                        color: "#FFFFFF",
                        padding: "3px 9px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 800,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      <span>❤️</span> 12
                    </div>
                  </div>

                  {/* Photo 3 (Bottom Left): Chai Cafe with Smiling Reaction Badge */}
                  <div
                    style={{
                      position: "relative",
                      borderRadius: "16px",
                      overflow: "hidden",
                      border: "1.5px solid rgba(255,255,255,0.14)",
                      boxShadow: "0 10px 24px rgba(0,0,0,0.65)",
                    }}
                    className="hover:scale-[1.03] transition-transform duration-300"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/chai-cafe.jpg"
                      alt="Party hangout"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    {/* Floating In-Love reaction badge (Image 1 Match: 😍 8) */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "10px",
                        left: "8px",
                        background: "rgba(18, 12, 22, 0.94)",
                        border: "1.2px solid rgba(255, 90, 31, 0.5)",
                        color: "#FFFFFF",
                        padding: "3px 9px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 800,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      <span>😍</span> 8
                    </div>
                  </div>

                  {/* Photo 4 (Bottom Right): Rooftop Party with +20 overlay & Fire Reaction Badge */}
                  <div
                    style={{
                      position: "relative",
                      borderRadius: "16px",
                      overflow: "hidden",
                      border: "1.5px solid rgba(255,255,255,0.14)",
                      boxShadow: "0 10px 24px rgba(0,0,0,0.65)",
                    }}
                    className="hover:scale-[1.03] transition-transform duration-300"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/hero-rooftop.jpg"
                      alt="More party photos"
                      style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(2.5px) brightness(0.65)" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#FFFFFF",
                        fontSize: "22px",
                        fontWeight: 900,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      +20
                    </div>
                    {/* Floating Fire reaction badge (Image 1 Match: 🔥 13) */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "8px",
                        left: "10px",
                        background: "rgba(18, 12, 22, 0.94)",
                        border: "1.2px solid rgba(255, 90, 31, 0.5)",
                        color: "#FFFFFF",
                        padding: "3px 9px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 800,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      <span>🔥</span> 13
                    </div>
                  </div>
                </div>
              </div>
            </div>
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

      {/* ── 9. "REAL REVIEWS, FROM REAL USERS" (ANIMATED DYNAMIC MARQUEE SHOWCASE) ─── */}
      <section
        id="reviews-section"
        style={{
          background: "#060408",
          color: "#FFFFFF",
          padding: "96px 24px 100px",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          position: "relative",
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
        {/* Scoped Keyframes to guarantee 100% animation execution */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes reviewScrollUp {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
          @keyframes reviewScrollDown {
            0% { transform: translateY(-50%); }
            100% { transform: translateY(0); }
          }
          .review-track-up {
            animation: reviewScrollUp 24s linear infinite !important;
            will-change: transform;
          }
          .review-track-down {
            animation: reviewScrollDown 28s linear infinite !important;
            will-change: transform;
          }
          .reviews-marquee-box:hover .review-track-up,
          .reviews-marquee-box:hover .review-track-down {
            animation-play-state: paused !important;
          }
        `}} />

        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
            gap: "54px",
            alignItems: "center",
          }}
        >
          {/* Left Column: Rating Badge, Clean Aligned Heading, Subtitle & CTA */}
          <div style={{ maxWidth: "460px" }}>
            {/* Rating pill */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                border: "1px solid rgba(255, 90, 31, 0.4)",
                background: "rgba(255, 90, 31, 0.12)",
                padding: "6px 16px",
                borderRadius: "999px",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", gap: "2px", color: "#FF9500", fontSize: "13px" }}>
                {"★★★★★"}
              </div>
              <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#FFFFFF" }}>
                5.0 • 217K Verified Ratings
              </span>
            </div>

            {/* Display Heading (Cleanly Aligned) */}
            <h2
              style={{
                fontFamily: "var(--font-display), system-ui, sans-serif",
                fontSize: "clamp(34px, 4.4vw, 54px)",
                fontWeight: 800,
                letterSpacing: "-0.035em",
                color: "#FFFFFF",
                lineHeight: 1.1,
                margin: "0 0 16px",
              }}
            >
              Real reviews, from<br />real users
            </h2>

            {/* Description */}
            <p
              style={{
                fontSize: "17px",
                color: "rgba(255, 255, 255, 0.72)",
                lineHeight: 1.55,
                margin: "0 0 28px",
              }}
            >
              Don&apos;t just take our word for it. See what our growing party community has to say.
            </p>

            {/* Rounded Pill CTA Button */}
            <Link
              href="/apply"
              style={{
                background: "#FF5A1F",
                color: "#FFFFFF",
                fontSize: "15px",
                fontWeight: 800,
                padding: "14px 34px",
                borderRadius: "999px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                letterSpacing: "-0.01em",
                boxShadow: "0 8px 24px rgba(255, 90, 31, 0.35)",
                transition: "all 0.2s ease",
              }}
              className="hover:bg-[#FF7A45] hover:scale-105 transition-all cursor-pointer"
            >
              <span>Try it out</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right Column: Animated Dual-Column Review Marquee with Top & Bottom Fade Mask */}
          <div
            className="reviews-marquee-box"
            style={{
              height: "440px",
              position: "relative",
              overflow: "hidden",
              maskImage: "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                height: "100%",
              }}
            >
              {/* Animated Track 1 (Upward Scroll) */}
              <div
                className="review-track-up"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {/* Review 1 */}
                <div style={{ background: "linear-gradient(145deg, #130D1C 0%, #0A0612 100%)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "18px", padding: "18px 20px", boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)" }} className="hover:border-[#FF5A1F]/50 transition-colors">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF" }}>A must</span>
                    <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)" }}>May 29 • r3boi</span>
                  </div>
                  <div style={{ color: "#FF9500", fontSize: "12px", marginBottom: "8px" }}>★★★★★</div>
                  <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45, margin: 0 }}>
                    I don&apos;t even hang out with my friends if they don&apos;t send me the Solo-No-More link first.
                  </p>
                </div>

                {/* Review 3 */}
                <div style={{ background: "linear-gradient(145deg, #130D1C 0%, #0A0612 100%)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "18px", padding: "18px 20px", boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)" }} className="hover:border-[#FF5A1F]/50 transition-colors">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF" }}>Best App Ever</span>
                    <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)" }}>Mar 25 • charleigh</span>
                  </div>
                  <div style={{ color: "#FF9500", fontSize: "12px", marginBottom: "8px" }}>★★★★★</div>
                  <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45, margin: 0 }}>
                    If Solo-No-More has one million users I am one. The group planning vibe and ease is unmatched.
                  </p>
                </div>

                {/* Review 5 */}
                <div style={{ background: "linear-gradient(145deg, #130D1C 0%, #0A0612 100%)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "18px", padding: "18px 20px", boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)" }} className="hover:border-[#FF5A1F]/50 transition-colors">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF" }}>The rare *perfect* app</span>
                    <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)" }}>Jun 11 • LibertyLikes</span>
                  </div>
                  <div style={{ color: "#FF9500", fontSize: "12px", marginBottom: "8px" }}>★★★★★</div>
                  <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45, margin: 0 }}>
                    Solo-No-More sets out to do one thing — coordinate parties with zero friction. And it does that perfectly.
                  </p>
                </div>

                {/* Review 7 */}
                <div style={{ background: "linear-gradient(145deg, #130D1C 0%, #0A0612 100%)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "18px", padding: "18px 20px", boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)" }} className="hover:border-[#FF5A1F]/50 transition-colors">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF" }}>I love Solo-No-More</span>
                    <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)" }}>Nov 18 • Juliette Legault</span>
                  </div>
                  <div style={{ color: "#FF9500", fontSize: "12px", marginBottom: "8px" }}>★★★★★</div>
                  <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45, margin: 0 }}>
                    Helped me coordinate a rooftop party for my bf. I love how it makes planning social nights so easy!
                  </p>
                </div>

                {/* ── DUPLICATE SET 1 FOR PERFECT SEAMLESS INFINITE LOOP ── */}
                <div style={{ background: "linear-gradient(145deg, #130D1C 0%, #0A0612 100%)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "18px", padding: "18px 20px", boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)" }} className="hover:border-[#FF5A1F]/50 transition-colors">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF" }}>A must</span>
                    <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)" }}>May 29 • r3boi</span>
                  </div>
                  <div style={{ color: "#FF9500", fontSize: "12px", marginBottom: "8px" }}>★★★★★</div>
                  <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45, margin: 0 }}>
                    I don&apos;t even hang out with my friends if they don&apos;t send me the Solo-No-More link first.
                  </p>
                </div>

                <div style={{ background: "linear-gradient(145deg, #130D1C 0%, #0A0612 100%)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "18px", padding: "18px 20px", boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)" }} className="hover:border-[#FF5A1F]/50 transition-colors">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF" }}>Best App Ever</span>
                    <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)" }}>Mar 25 • charleigh</span>
                  </div>
                  <div style={{ color: "#FF9500", fontSize: "12px", marginBottom: "8px" }}>★★★★★</div>
                  <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45, margin: 0 }}>
                    If Solo-No-More has one million users I am one. The group planning vibe and ease is unmatched.
                  </p>
                </div>

                <div style={{ background: "linear-gradient(145deg, #130D1C 0%, #0A0612 100%)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "18px", padding: "18px 20px", boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)" }} className="hover:border-[#FF5A1F]/50 transition-colors">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF" }}>The rare *perfect* app</span>
                    <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)" }}>Jun 11 • LibertyLikes</span>
                  </div>
                  <div style={{ color: "#FF9500", fontSize: "12px", marginBottom: "8px" }}>★★★★★</div>
                  <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45, margin: 0 }}>
                    Solo-No-More sets out to do one thing — coordinate parties with zero friction. And it does that perfectly.
                  </p>
                </div>

                <div style={{ background: "linear-gradient(145deg, #130D1C 0%, #0A0612 100%)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "18px", padding: "18px 20px", boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)" }} className="hover:border-[#FF5A1F]/50 transition-colors">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF" }}>I love Solo-No-More</span>
                    <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)" }}>Nov 18 • Juliette Legault</span>
                  </div>
                  <div style={{ color: "#FF9500", fontSize: "12px", marginBottom: "8px" }}>★★★★★</div>
                  <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45, margin: 0 }}>
                    Helped me coordinate a rooftop party for my bf. I love how it makes planning social nights so easy!
                  </p>
                </div>
              </div>

              {/* Animated Track 2 (Offset Downward Scroll) */}
              <div
                className="review-track-down"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {/* Review 2 */}
                <div style={{ background: "linear-gradient(145deg, #130D1C 0%, #0A0612 100%)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "18px", padding: "18px 20px", boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)" }} className="hover:border-[#FF5A1F]/50 transition-colors">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF" }}>Best Party App</span>
                    <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)" }}>Nov 14 • MarpZilla</span>
                  </div>
                  <div style={{ color: "#FF9500", fontSize: "12px", marginBottom: "8px" }}>★★★★★</div>
                  <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45, margin: 0 }}>
                    By far the best app for events. Puts old event planners or evites to shame.
                  </p>
                </div>

                {/* Review 4 */}
                <div style={{ background: "linear-gradient(145deg, #130D1C 0%, #0A0612 100%)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "18px", padding: "18px 20px", boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)" }} className="hover:border-[#FF5A1F]/50 transition-colors">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF" }}>100% free & cute</span>
                    <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)" }}>Nov 7 • Tlackshots</span>
                  </div>
                  <div style={{ color: "#FF9500", fontSize: "12px", marginBottom: "8px" }}>★★★★★</div>
                  <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45, margin: 0 }}>
                    I LOVE THIS APP! It&apos;s cute, modern, and innovative. The RSVP flow is effortless.
                  </p>
                </div>

                {/* Review 6 */}
                <div style={{ background: "linear-gradient(145deg, #130D1C 0%, #0A0612 100%)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "18px", padding: "18px 20px", boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)" }} className="hover:border-[#FF5A1F]/50 transition-colors">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF" }}>Best friend planner</span>
                    <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)" }}>Nov 3 • PartyPlanner</span>
                  </div>
                  <div style={{ color: "#FF9500", fontSize: "12px", marginBottom: "8px" }}>★★★★★</div>
                  <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45, margin: 0 }}>
                    I rarely write reviews. This app is so great that I specifically came here to tell everyone.
                  </p>
                </div>

                {/* Review 8 */}
                <div style={{ background: "linear-gradient(145deg, #130D1C 0%, #0A0612 100%)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "18px", padding: "18px 20px", boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)" }} className="hover:border-[#FF5A1F]/50 transition-colors">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF" }}>Changed my life</span>
                    <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)" }}>Oct 26 • xjoejoex121</span>
                  </div>
                  <div style={{ color: "#FF9500", fontSize: "12px", marginBottom: "8px" }}>★★★★★</div>
                  <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45, margin: 0 }}>
                    Made so many great memories with friends because of this app. 10/10 recommendation!
                  </p>
                </div>

                {/* ── DUPLICATE SET 2 FOR PERFECT SEAMLESS INFINITE LOOP ── */}
                <div style={{ background: "linear-gradient(145deg, #130D1C 0%, #0A0612 100%)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "18px", padding: "18px 20px", boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)" }} className="hover:border-[#FF5A1F]/50 transition-colors">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF" }}>Best Party App</span>
                    <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)" }}>Nov 14 • MarpZilla</span>
                  </div>
                  <div style={{ color: "#FF9500", fontSize: "12px", marginBottom: "8px" }}>★★★★★</div>
                  <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45, margin: 0 }}>
                    By far the best app for events. Puts old event planners or evites to shame.
                  </p>
                </div>

                <div style={{ background: "linear-gradient(145deg, #130D1C 0%, #0A0612 100%)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "18px", padding: "18px 20px", boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)" }} className="hover:border-[#FF5A1F]/50 transition-colors">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF" }}>100% free & cute</span>
                    <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)" }}>Nov 7 • Tlackshots</span>
                  </div>
                  <div style={{ color: "#FF9500", fontSize: "12px", marginBottom: "8px" }}>★★★★★</div>
                  <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45, margin: 0 }}>
                    I LOVE THIS APP! It&apos;s cute, modern, and innovative. The RSVP flow is effortless.
                  </p>
                </div>

                <div style={{ background: "linear-gradient(145deg, #130D1C 0%, #0A0612 100%)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "18px", padding: "18px 20px", boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)" }} className="hover:border-[#FF5A1F]/50 transition-colors">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF" }}>Best friend planner</span>
                    <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)" }}>Nov 3 • PartyPlanner</span>
                  </div>
                  <div style={{ color: "#FF9500", fontSize: "12px", marginBottom: "8px" }}>★★★★★</div>
                  <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45, margin: 0 }}>
                    I rarely write reviews. This app is so great that I specifically came here to tell everyone.
                  </p>
                </div>

                <div style={{ background: "linear-gradient(145deg, #130D1C 0%, #0A0612 100%)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "18px", padding: "18px 20px", boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)" }} className="hover:border-[#FF5A1F]/50 transition-colors">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF" }}>Changed my life</span>
                    <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)" }}>Oct 26 • xjoejoex121</span>
                  </div>
                  <div style={{ color: "#FF9500", fontSize: "12px", marginBottom: "8px" }}>★★★★★</div>
                  <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45, margin: 0 }}>
                    Made so many great memories with friends because of this app. 10/10 recommendation!
                  </p>
                </div>
              </div>
            </div>
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

          {/* ── STANDARD-SIZE PHOTO & VIDEO COLLAGE (TIGHT MOSAIC GRID: FEW LARGE, FEW MEDIUM, FEW SMALL) ── */}
          <div className="grid grid-cols-12 gap-3.5 mb-10 text-left auto-rows-[200px] md:auto-rows-[225px]">
            {/* 1. LARGE FEATURE PHOTO TILE: (Col 1-4, Row 1-2) */}
            <a
              href={rSlots[0]?.url || "https://www.instagram.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-12 sm:col-span-6 lg:col-span-4 row-span-2 rounded-3xl overflow-hidden relative group transition-all duration-300 hover:border-[#FF5A1F] hover:shadow-[0_18px_45px_rgba(255,90,31,0.3)] block cursor-pointer"
              style={{
                border: "1.2px solid rgba(255, 255, 255, 0.14)",
                background: "#140A0D",
              }}
            >
              {/* Full Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rSlots[0]?.image_url || "/images/beach-bonfire.jpg"}
                alt="French Beach Bonfire Gathering"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Cinematic Vignette Overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(14,6,9,0.72) 0%, rgba(14,6,9,0.1) 40%, rgba(14,6,9,0.85) 100%)",
                  pointerEvents: "none",
                }}
              />

              {/* Floating Top Elements */}
              <div style={{ position: "absolute", top: "14px", left: "14px", right: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(10, 6, 8, 0.8)", backdropFilter: "blur(12px)", padding: "5px 12px 5px 6px", borderRadius: "999px", border: "1px solid rgba(255, 255, 255, 0.14)" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#FF5A1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#FFF" }}>
                    D
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#FFFFFF", display: "flex", alignItems: "center", gap: "4px" }}>
                    @danish_beaches <Check className="w-3 h-3 text-[#FF5A1F]" />
                  </span>
                </div>

                <span style={{ fontSize: "10px", fontWeight: 800, color: "#FF8A3D", background: "rgba(255,90,31,0.22)", border: "1px solid rgba(255,90,31,0.45)", padding: "4px 10px", borderRadius: "999px" }}>
                  🔥 FEATURED
                </span>
              </div>

              {/* Center Audio Track Badge */}
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 2, pointerEvents: "none" }}>
                <div style={{ background: "rgba(10, 6, 8, 0.82)", backdropFilter: "blur(12px)", padding: "6px 14px", borderRadius: "999px", fontSize: "11.5px", fontWeight: 700, color: "#FF8A3D", border: "1px solid rgba(255,90,31,0.4)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Music className="w-3.5 h-3.5 text-[#FF5A1F]" />
                  <span>Channo (Acoustic Jam) • 0:42</span>
                </div>
              </div>

              {/* Floating Bottom Info & Likes */}
              <div style={{ position: "absolute", bottom: "14px", left: "14px", right: "14px", zIndex: 2 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ background: "rgba(10, 6, 8, 0.82)", backdropFilter: "blur(12px)", padding: "5px 12px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, color: "#FFFFFF", display: "flex", alignItems: "center", gap: "5px", border: "1px solid rgba(255, 255, 255, 0.12)" }}>
                    <MapPin className="w-3 h-3 text-[#FF5A1F]" />
                    <span>French Beach Hut #42</span>
                  </div>
                  <div style={{ background: "rgba(10, 6, 8, 0.82)", backdropFilter: "blur(12px)", padding: "5px 12px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, color: "#FFFFFF", border: "1px solid rgba(255, 255, 255, 0.12)" }}>
                    ❤️ 384
                  </div>
                </div>
              </div>
            </a>

            {/* 2. TALL VIDEO REEL TILE: (Col 5-7, Row 1-2) */}
            <a
              href={rSlots[1]?.url || "https://www.instagram.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-12 sm:col-span-6 lg:col-span-3 row-span-2 rounded-3xl overflow-hidden relative group transition-all duration-300 hover:border-[#FF5A1F] hover:shadow-[0_18px_45px_rgba(255,90,31,0.3)] block cursor-pointer"
              style={{
                border: "1.2px solid rgba(255, 255, 255, 0.14)",
                background: "#081410",
              }}
            >
              {/* Full Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rSlots[1]?.image_url || "/images/padel-squad.jpg"}
                alt="Velocity Padel Squad Reel"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(8,20,16,0.72) 0%, rgba(8,20,16,0.1) 40%, rgba(8,20,16,0.85) 100%)",
                  pointerEvents: "none",
                }}
              />

              {/* Floating Top Elements */}
              <div style={{ position: "absolute", top: "14px", left: "14px", right: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(10, 6, 8, 0.8)", backdropFilter: "blur(12px)", padding: "5px 12px 5px 6px", borderRadius: "999px", border: "1px solid rgba(255, 255, 255, 0.14)" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#FF5A1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#FFF" }}>
                    S
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#FFFFFF", display: "flex", alignItems: "center", gap: "4px" }}>
                    @sara_speed <Check className="w-3 h-3 text-[#FF5A1F]" />
                  </span>
                </div>

                <span style={{ fontSize: "10px", fontWeight: 800, color: "#FFFFFF", background: "rgba(255,90,31,0.9)", padding: "4px 10px", borderRadius: "999px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  REEL 0:15
                </span>
              </div>

              {/* Center Glowing Play Button */}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "rgba(18, 9, 7, 0.85)",
                    border: "2px solid rgba(255, 90, 31, 0.8)",
                    boxShadow: "0 0 25px rgba(255, 90, 31, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.25s ease",
                  }}
                  className="group-hover:scale-110 group-hover:bg-[#FF5A1F] text-white"
                >
                  <Play className="w-6 h-6 fill-white text-white ml-0.5" />
                </div>
              </div>

              {/* Floating Bottom Info */}
              <div style={{ position: "absolute", bottom: "14px", left: "14px", right: "14px", zIndex: 2 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ background: "rgba(10, 6, 8, 0.82)", backdropFilter: "blur(12px)", padding: "5px 12px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, color: "#FFFFFF", border: "1px solid rgba(255, 255, 255, 0.12)" }}>
                    📍 Velocity Clifton
                  </div>
                  <div style={{ background: "rgba(10, 6, 8, 0.82)", backdropFilter: "blur(12px)", padding: "5px 12px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, color: "#FF8A3D", border: "1px solid rgba(255,90,31,0.3)" }}>
                    ★ 2.4k views
                  </div>
                </div>
              </div>
            </a>

            {/* 3. MEDIUM WIDE PHOTO/VIDEO TILE: (Col 8-12, Row 1) */}
            <a
              href={rSlots[2]?.url || "https://www.instagram.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-12 sm:col-span-12 lg:col-span-5 row-span-1 rounded-3xl overflow-hidden relative group transition-all duration-300 hover:border-[#FF5A1F] hover:shadow-[0_18px_45px_rgba(255,90,31,0.3)] block cursor-pointer"
              style={{
                border: "1.2px solid rgba(255, 255, 255, 0.14)",
                background: "#160C14",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rSlots[2]?.image_url || "/images/acoustic-jam.jpg"}
                alt="Secret Loft Acoustic Session"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(16,8,14,0.72) 0%, rgba(16,8,14,0.1) 40%, rgba(16,8,14,0.85) 100%)",
                  pointerEvents: "none",
                }}
              />

              {/* Floating Top Elements */}
              <div style={{ position: "absolute", top: "12px", left: "14px", right: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(10, 6, 8, 0.8)", backdropFilter: "blur(12px)", padding: "4px 12px 4px 6px", borderRadius: "999px", border: "1px solid rgba(255, 255, 255, 0.14)" }}>
                  <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#FF5A1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10.5px", fontWeight: 800, color: "#FFF" }}>
                    Z
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#FFFFFF" }}>@zayd_khi</span>
                </div>

                <span style={{ fontSize: "10px", fontWeight: 800, color: "#FF8A3D", background: "rgba(255,90,31,0.22)", border: "1px solid rgba(255,90,31,0.45)", padding: "4px 10px", borderRadius: "999px" }}>
                  🎸 LIVE ACOUSTICS
                </span>
              </div>

              {/* Center Play Icon */}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "50%",
                    background: "rgba(18, 9, 7, 0.82)",
                    border: "2px solid rgba(255, 90, 31, 0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.25s ease",
                  }}
                  className="group-hover:scale-110 group-hover:bg-[#FF5A1F] text-white"
                >
                  <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                </div>
              </div>

              {/* Floating Bottom Info */}
              <div style={{ position: "absolute", bottom: "12px", left: "14px", right: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
                <div style={{ background: "rgba(10, 6, 8, 0.82)", backdropFilter: "blur(12px)", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, color: "#FFFFFF", border: "1px solid rgba(255, 255, 255, 0.12)" }}>
                  📍 Secret Loft Phase 5
                </div>
                <div style={{ background: "rgba(10, 6, 8, 0.82)", backdropFilter: "blur(12px)", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, color: "#FFFFFF", border: "1px solid rgba(255, 255, 255, 0.12)" }}>
                  ❤️ 445
                </div>
              </div>
            </a>

            {/* 4. MEDIUM PHOTO TILE: (Col 8-10, Row 2) */}
            <a
              href={rSlots[3]?.url || "https://www.instagram.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-12 sm:col-span-6 lg:col-span-3 row-span-1 rounded-3xl overflow-hidden relative group transition-all duration-300 hover:border-[#FF5A1F] hover:shadow-[0_18px_45px_rgba(255,90,31,0.3)] block cursor-pointer"
              style={{
                border: "1.2px solid rgba(255, 255, 255, 0.14)",
                background: "#160C10",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rSlots[3]?.image_url || "/images/chai-cafe.jpg"}
                alt="Chai Cafe Boardgames"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(16,8,10,0.72) 0%, rgba(16,8,10,0.1) 40%, rgba(16,8,10,0.85) 100%)",
                  pointerEvents: "none",
                }}
              />

              <div style={{ position: "absolute", top: "12px", left: "12px", right: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(10, 6, 8, 0.8)", backdropFilter: "blur(12px)", padding: "4px 10px 4px 6px", borderRadius: "999px", border: "1px solid rgba(255, 255, 255, 0.14)" }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#FF5A1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#FFF" }}>
                    A
                  </div>
                  <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#FFFFFF" }}>@alizeh_vibe</span>
                </div>
                <InstagramIcon className="w-3.5 h-3.5 text-[#FF5A1F]" />
              </div>

              <div style={{ position: "absolute", bottom: "12px", left: "12px", right: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
                <div style={{ background: "rgba(10, 6, 8, 0.82)", backdropFilter: "blur(12px)", padding: "4px 10px", borderRadius: "999px", fontSize: "10.5px", fontWeight: 700, color: "#FFFFFF" }}>
                  📍 Alamgir Clifton
                </div>
                <div style={{ background: "rgba(10, 6, 8, 0.82)", backdropFilter: "blur(12px)", padding: "4px 10px", borderRadius: "999px", fontSize: "10.5px", fontWeight: 700, color: "#FFFFFF" }}>
                  ❤️ 198
                </div>
              </div>
            </a>

            {/* 5. SMALL SNAPSHOT TILE: (Col 11-12, Row 2) */}
            <a
              href={rSlots[4]?.url || "https://www.instagram.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-12 sm:col-span-6 lg:col-span-2 row-span-1 rounded-3xl overflow-hidden relative group transition-all duration-300 hover:border-[#FF5A1F] hover:shadow-[0_18px_45px_rgba(255,90,31,0.3)] block cursor-pointer"
              style={{
                border: "1.2px solid rgba(255, 255, 255, 0.14)",
                background: "#160C10",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rSlots[4]?.image_url || "/images/beacon-chai.jpg"}
                alt="Frere Hall Chai Run"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(16,8,10,0.72) 0%, rgba(16,8,10,0.1) 40%, rgba(16,8,10,0.85) 100%)",
                  pointerEvents: "none",
                }}
              />

              <div style={{ position: "absolute", top: "12px", left: "12px", right: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(10, 6, 8, 0.8)", backdropFilter: "blur(12px)", padding: "4px 10px 4px 6px", borderRadius: "999px", border: "1px solid rgba(255, 255, 255, 0.14)" }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#FF5A1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#FFF" }}>
                    H
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "#FFFFFF" }}>@hamza_clicks</span>
                </div>
              </div>

              <div style={{ position: "absolute", bottom: "12px", left: "12px", right: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
                <div style={{ background: "rgba(10, 6, 8, 0.82)", backdropFilter: "blur(12px)", padding: "4px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, color: "#FFFFFF" }}>
                  📍 Frere Hall
                </div>
                <div style={{ background: "rgba(10, 6, 8, 0.82)", backdropFilter: "blur(12px)", padding: "4px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, color: "#FFFFFF" }}>
                  ❤️ 142
                </div>
              </div>
            </a>

            {/* 6. VIDEO REEL TILE: (Col 1-3, Row 3) */}
            <a
              href={rSlots[5]?.url || "https://www.instagram.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-12 sm:col-span-6 lg:col-span-3 row-span-1 rounded-3xl overflow-hidden relative group transition-all duration-300 hover:border-[#FF5A1F] hover:shadow-[0_18px_45px_rgba(255,90,31,0.3)] block cursor-pointer"
              style={{
                border: "1.2px solid rgba(255, 255, 255, 0.14)",
                background: "#0E1210",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rSlots[5]?.image_url || "/images/beacon-padel.jpg"}
                alt="Legends Arena Match"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(8,18,14,0.72) 0%, rgba(8,18,14,0.1) 40%, rgba(8,18,14,0.85) 100%)",
                  pointerEvents: "none",
                }}
              />

              <div style={{ position: "absolute", top: "12px", left: "12px", right: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(10, 6, 8, 0.8)", backdropFilter: "blur(12px)", padding: "4px 10px 4px 6px", borderRadius: "999px", border: "1px solid rgba(255, 255, 255, 0.14)" }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#FF5A1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#FFF" }}>
                    B
                  </div>
                  <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#FFFFFF" }}>@bilal_smash</span>
                </div>
                <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#FFFFFF", background: "rgba(255,90,31,0.9)", padding: "3px 8px", borderRadius: "999px" }}>
                  🎥 MATCH
                </span>
              </div>

              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: "rgba(18, 9, 7, 0.82)",
                    border: "2px solid rgba(255, 90, 31, 0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  className="group-hover:scale-110 group-hover:bg-[#FF5A1F] text-white transition-transform"
                >
                  <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                </div>
              </div>

              <div style={{ position: "absolute", bottom: "12px", left: "12px", right: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
                <div style={{ background: "rgba(10, 6, 8, 0.82)", backdropFilter: "blur(12px)", padding: "4px 8px", borderRadius: "999px", fontSize: "10.5px", fontWeight: 700, color: "#FFFFFF" }}>
                  📍 Legends Arena
                </div>
                <div style={{ background: "rgba(10, 6, 8, 0.82)", backdropFilter: "blur(12px)", padding: "4px 8px", borderRadius: "999px", fontSize: "10.5px", fontWeight: 700, color: "#FFFFFF" }}>
                  ❤️ 215
                </div>
              </div>
            </a>

            {/* 7. SMALL SNAPSHOT: Sunset Rooftop BBQ (Col 4-5, Row 3) */}
            <div
              className="col-span-6 sm:col-span-3 lg:col-span-2 row-span-1 rounded-3xl overflow-hidden relative group transition-all duration-300 hover:border-[#FF5A1F] hover:shadow-[0_18px_45px_rgba(255,90,31,0.3)]"
              style={{
                border: "1.2px solid rgba(255, 255, 255, 0.14)",
                background: "#160C10",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero-rooftop.jpg"
                alt="Sunset Rooftop BBQ"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(16,8,10,0.72) 0%, rgba(16,8,10,0.1) 40%, rgba(16,8,10,0.85) 100%)",
                  pointerEvents: "none",
                }}
              />

              <div style={{ position: "absolute", top: "12px", left: "12px", right: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(10, 6, 8, 0.8)", backdropFilter: "blur(12px)", padding: "4px 10px 4px 6px", borderRadius: "999px", border: "1px solid rgba(255, 255, 255, 0.14)" }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#FF5A1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#FFF" }}>
                    M
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "#FFFFFF" }}>@maya.khi</span>
                </div>
              </div>

              <div style={{ position: "absolute", bottom: "12px", left: "12px", right: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
                <div style={{ background: "rgba(10, 6, 8, 0.82)", backdropFilter: "blur(12px)", padding: "4px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, color: "#FFFFFF" }}>
                  📍 Phase 6
                </div>
                <div style={{ background: "rgba(10, 6, 8, 0.82)", backdropFilter: "blur(12px)", padding: "4px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, color: "#FFFFFF" }}>
                  ❤️ 267
                </div>
              </div>
            </div>

            {/* 8. SMALL SNAPSHOT: Burns Road Night Crawl (Col 6-7, Row 3) */}
            <div
              className="col-span-6 sm:col-span-3 lg:col-span-2 row-span-1 rounded-3xl overflow-hidden relative group transition-all duration-300 hover:border-[#FF5A1F] hover:shadow-[0_18px_45px_rgba(255,90,31,0.3)]"
              style={{
                border: "1.2px solid rgba(255, 255, 255, 0.14)",
                background: "#160C10",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/partiful-photo-girls.jpg"
                alt="Burns Road Street Food"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(16,8,10,0.72) 0%, rgba(16,8,10,0.1) 40%, rgba(16,8,10,0.85) 100%)",
                  pointerEvents: "none",
                }}
              />

              <div style={{ position: "absolute", top: "12px", left: "12px", right: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(10, 6, 8, 0.8)", backdropFilter: "blur(12px)", padding: "4px 10px 4px 6px", borderRadius: "999px", border: "1px solid rgba(255, 255, 255, 0.14)" }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#FF5A1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#FFF" }}>
                    N
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "#FFFFFF" }}>@nida_eats</span>
                </div>
              </div>

              <div style={{ position: "absolute", bottom: "12px", left: "12px", right: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
                <div style={{ background: "rgba(10, 6, 8, 0.82)", backdropFilter: "blur(12px)", padding: "4px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, color: "#FFFFFF" }}>
                  📍 Burns Road
                </div>
                <div style={{ background: "rgba(10, 6, 8, 0.82)", backdropFilter: "blur(12px)", padding: "4px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, color: "#FFFFFF" }}>
                  ❤️ 188
                </div>
              </div>
            </div>

            {/* 9. MEDIUM WIDE VIDEO REEL TILE: Warehouse DJ Set (Col 8-12, Row 3) */}
            <div
              className="col-span-12 sm:col-span-12 lg:col-span-5 row-span-1 rounded-3xl overflow-hidden relative group transition-all duration-300 hover:border-[#FF5A1F] hover:shadow-[0_18px_45px_rgba(255,90,31,0.3)]"
              style={{
                border: "1.2px solid rgba(255, 255, 255, 0.14)",
                background: "#160C14",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/beacon-now-26.jpg"
                alt="Warehouse Underground Music"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(16,8,14,0.72) 0%, rgba(16,8,14,0.1) 40%, rgba(16,8,14,0.85) 100%)",
                  pointerEvents: "none",
                }}
              />

              <div style={{ position: "absolute", top: "12px", left: "14px", right: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(10, 6, 8, 0.8)", backdropFilter: "blur(12px)", padding: "4px 12px 4px 6px", borderRadius: "999px", border: "1px solid rgba(255, 255, 255, 0.14)" }}>
                  <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#FF5A1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10.5px", fontWeight: 800, color: "#FFF" }}>
                    O
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#FFFFFF" }}>@omar_now</span>
                </div>

                <span style={{ fontSize: "10px", fontWeight: 800, color: "#FF8A3D", background: "rgba(255,90,31,0.22)", border: "1px solid rgba(255,90,31,0.45)", padding: "4px 10px", borderRadius: "999px" }}>
                  🎵 DJ SET
                </span>
              </div>

              {/* Center Play Icon */}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "50%",
                    background: "rgba(18, 9, 7, 0.82)",
                    border: "2px solid rgba(255, 90, 31, 0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.25s ease",
                  }}
                  className="group-hover:scale-110 group-hover:bg-[#FF5A1F] text-white"
                >
                  <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                </div>
              </div>

              <div style={{ position: "absolute", bottom: "12px", left: "14px", right: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
                <div style={{ background: "rgba(10, 6, 8, 0.82)", backdropFilter: "blur(12px)", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, color: "#FFFFFF", border: "1px solid rgba(255, 255, 255, 0.12)" }}>
                  📍 Warehouse 10 Korangi
                </div>
                <div style={{ background: "rgba(10, 6, 8, 0.82)", backdropFilter: "blur(12px)", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, color: "#FFFFFF", border: "1px solid rgba(255, 255, 255, 0.12)" }}>
                  ❤️ 320
                </div>
              </div>
            </div>
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
