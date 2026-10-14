"use server";

import fs from "fs";
import path from "path";
import { verifyAdminStatus } from "@/app/actions/admin";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export interface ReviewWallSlot {
  id: string;
  slot: number;
  label: string;
  type: "reel" | "post";
  url: string;
  image_url: string;
  author?: string;
  venue?: string;
  likes?: number;
}

export interface ReviewWallData {
  heading: string;
  tagline: string;
  slots: ReviewWallSlot[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const REVIEW_WALL_FILE = path.join(DATA_DIR, "review_wall.json");

const DEFAULT_REVIEW_WALL: ReviewWallData = {
  heading: "Stories from the Squad",
  tagline: "Tag @qhq on Instagram to get featured on the Review Wall",
  slots: [
    {
      id: "slot-1",
      slot: 1,
      label: "Slot 1 — Featured video",
      type: "reel",
      url: "https://www.instagram.com/reel/C7r8V9zN1_X/",
      image_url: "/images/beach-bonfire.jpg",
      author: "@danish_beaches",
      venue: "French Beach Hut #42",
      likes: 384,
    },
    {
      id: "slot-2",
      slot: 2,
      label: "Slot 2 — Featured video",
      type: "reel",
      url: "https://www.instagram.com/reel/C8k2L5pM9_Z/",
      image_url: "/images/padel-squad.jpg",
      author: "@sara_speed",
      venue: "Velocity Padel Arena",
      likes: 512,
    },
    {
      id: "slot-3",
      slot: 3,
      label: "Slot 3 — Instagram post",
      type: "post",
      url: "https://www.instagram.com/p/C9m3X4vK8_A/",
      image_url: "/images/acoustic-jam.jpg",
      author: "@zainab_tunes",
      venue: "Chai Shai Rooftop",
      likes: 296,
    },
    {
      id: "slot-4",
      slot: 4,
      label: "Slot 4 — Instagram post",
      type: "post",
      url: "https://www.instagram.com/p/C-n7P2wR1_B/",
      image_url: "/images/event-safari-train.jpg",
      author: "@bilal_adventures",
      venue: "Safari Tourist Train",
      likes: 420,
    },
    {
      id: "slot-5",
      slot: 5,
      label: "Slot 5 — Instagram post",
      type: "post",
      url: "https://www.instagram.com/p/C1a4B8kL5_C/",
      image_url: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&auto=format&fit=crop&q=80",
      author: "@hamza_clicks",
      venue: "District 19",
      likes: 345,
    },
    {
      id: "slot-6",
      slot: 6,
      label: "Slot 6 — Instagram post",
      type: "post",
      url: "https://www.instagram.com/p/C2b5C9mN6_D/",
      image_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
      author: "@alina_vibe",
      venue: "Cafe Flo Patio",
      likes: 489,
    },
  ],
};

function ensureDataFile(): ReviewWallData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(REVIEW_WALL_FILE)) {
    fs.writeFileSync(REVIEW_WALL_FILE, JSON.stringify(DEFAULT_REVIEW_WALL, null, 2), "utf-8");
    return DEFAULT_REVIEW_WALL;
  }
  try {
    const raw = fs.readFileSync(REVIEW_WALL_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.slots)) {
      return parsed;
    }
    fs.writeFileSync(REVIEW_WALL_FILE, JSON.stringify(DEFAULT_REVIEW_WALL, null, 2), "utf-8");
    return DEFAULT_REVIEW_WALL;
  } catch (err) {
    console.error("Error reading review_wall.json:", err);
    return DEFAULT_REVIEW_WALL;
  }
}

/**
 * Get Review Wall data for home page and admin
 */
export async function getReviewWallDataAction(): Promise<ReviewWallData> {
  return ensureDataFile();
}

/**
 * Save Review Wall settings from Admin panel
 */
export async function saveReviewWallDataAction(
  data: ReviewWallData
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdminStatus();
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(REVIEW_WALL_FILE, JSON.stringify(data, null, 2), "utf-8");
    return { success: true };
  } catch (err: any) {
    console.error("Error saving review wall data:", err);
    return { success: false, error: err.message || "Failed to save review wall settings." };
  }
}
