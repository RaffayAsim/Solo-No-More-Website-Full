"use server";

import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdminStatus } from "@/app/actions/admin";
import { PUBLIC_MEDIA_BUCKET, isImageDataUrl, storePublicImageDataUrl } from "@/lib/server/storage";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { fetchInstagramPreview, instagramPostCode } from "@/lib/server/instagram-preview";

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

const REVIEW_WALL_SLOT_COUNT = 9;
const OFFICIAL_HANDLE = "@solonomore.pk";
const OFFICIAL_INSTAGRAM = "https://www.instagram.com/solonomore.pk/";
const DEFAULT_SLOT_IMAGES = ["/images/beach-bonfire.jpg","/images/padel-squad.jpg","/images/acoustic-jam.jpg","/images/chai-cafe.jpg","/images/beacon-chai.jpg","/images/beacon-padel.jpg","/images/hero-rooftop.jpg","/images/beacon-now-26.jpg","/images/hero-image.jpg"];

function defaultSlot(i: number): ReviewWallSlot {
  return {
    id: `slot-${i + 1}`,
    slot: i + 1,
    label: `Slot ${i + 1}${i < 2 ? " — Featured video" : ""}`,
    type: i < 2 ? "reel" : "post",
    url: OFFICIAL_INSTAGRAM,
    image_url: DEFAULT_SLOT_IMAGES[i],
    author: OFFICIAL_HANDLE,
    venue: "",
  };
}

// Neutral defaults (no invented handles, captions or like counts) until the admin fills the wall.
const DEFAULT_REVIEW_WALL: ReviewWallData = {
  heading: "Stories from the Squad",
  tagline: `Tag ${OFFICIAL_HANDLE} on Instagram to get featured on the Review Wall`,
  slots: Array.from({ length: REVIEW_WALL_SLOT_COUNT }, (_, i) => defaultSlot(i)),
};

/** Always returns exactly REVIEW_WALL_SLOT_COUNT slots (older saves had 6). */
function normalizeWall(data: ReviewWallData): ReviewWallData {
  const slots = Array.from({ length: REVIEW_WALL_SLOT_COUNT }, (_, i) => {
    const saved = data.slots?.[i];
    if (!saved) return defaultSlot(i);
    const slot = { ...defaultSlot(i), ...saved, id: `slot-${i + 1}`, slot: i + 1 };
    // Older saves used "@solonomore"; the official account is @solonomore.pk.
    if (slot.author === "@solonomore") slot.author = OFFICIAL_HANDLE;
    if (/^https:\/\/(www\.)?instagram\.com\/solonomore\/?$/i.test(slot.url)) slot.url = OFFICIAL_INSTAGRAM;
    return slot;
  });
  const tagline = (data.tagline || DEFAULT_REVIEW_WALL.tagline).replace(/@solonomore(?![.\w])/g, OFFICIAL_HANDLE);
  return { heading: data.heading || DEFAULT_REVIEW_WALL.heading, tagline, slots };
}

/**
 * Get Review Wall data for home page and admin (Cloud first with local file fallback)
 */
export async function getReviewWallDataAction(): Promise<ReviewWallData> {
  try {
    const { data, error } = await (supabaseAdmin.from("platform_settings") as any)
      .select("value")
      .eq("key", "review_wall")
      .single();

    if (!error && data?.value && Array.isArray(data.value.slots)) {
      return normalizeWall(data.value as ReviewWallData);
    }
  } catch (err) {
    // Database query failed or table not created yet, fall back to file/default
  }

  // Read-only fallback to the bundled file (used until the wall is first saved to the database).
  try {
    if (fs.existsSync(REVIEW_WALL_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(REVIEW_WALL_FILE, "utf-8"));
      if (parsed && Array.isArray(parsed.slots)) return normalizeWall(parsed as ReviewWallData);
    }
  } catch {}

  return DEFAULT_REVIEW_WALL;
}

/**
 * Save Review Wall settings from Admin panel
 */
export async function saveReviewWallDataAction(
  data: ReviewWallData
): Promise<{ success: boolean; error?: string; warning?: string }> {
  try {
    await verifyAdminStatus("root");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  if (!data || !Array.isArray((data as any).slots)) {
    return { success: false, error: "Invalid review wall data." };
  }

  // Clean every slot: Instagram links only, short handle/caption, uploaded photos moved to storage
  // (so the saved settings stay small and the public page loads normal image URLs).
  const clean = (v: unknown, max: number) => String(v ?? "").replace(/[\r\n]/g, " ").trim().slice(0, max);
  const previous = await getReviewWallDataAction();
  const notFetched: number[] = [];
  const slots: ReviewWallSlot[] = [];
  for (const [i, raw] of normalizeWall(data).slots.entries()) {
    const url = clean(raw.url, 300);
    if (url && !/^https:\/\/(www\.)?instagram\.com\//i.test(url)) {
      return { success: false, error: `Slot ${i + 1}: the link must be an Instagram link (https://www.instagram.com/...).` };
    }
    let image = clean(raw.image_url, 3_000_000);
    let author = clean(raw.author, 40);
    let type: "reel" | "post" = raw.type === "reel" ? "reel" : "post";

    // A post/reel link pulls its own picture — unless the admin uploaded a photo for this slot,
    // or the link and picture are unchanged since the last save.
    const post = instagramPostCode(url);
    const linkChanged = previous.slots[i]?.url !== url;
    const usingPlaceholder = !image || DEFAULT_SLOT_IMAGES.includes(image);
    if (post && !isImageDataUrl(image) && (usingPlaceholder || linkChanged)) {
      const preview = await fetchInstagramPreview(url);
      if (preview) {
        image = preview.imageDataUrl;
        type = preview.kind;
        if (preview.author && (!author || author === OFFICIAL_HANDLE || author === "@solonomore")) author = preview.author;
      } else {
        notFetched.push(i + 1);
        if (linkChanged && !usingPlaceholder) image = DEFAULT_SLOT_IMAGES[i];
      }
    }

    if (isImageDataUrl(image)) {
      const stored = await storePublicImageDataUrl(PUBLIC_MEDIA_BUCKET, "review-wall", image);
      if (!stored) return { success: false, error: `Slot ${i + 1}: the photo could not be saved. Try a smaller image (under 3 MB).` };
      image = stored;
    }
    if (author && !author.startsWith("@")) author = "@" + author;
    slots.push({
      ...raw,
      type,
      url: url || OFFICIAL_INSTAGRAM,
      image_url: image || DEFAULT_SLOT_IMAGES[i],
      author: author || OFFICIAL_HANDLE,
      venue: clean(raw.venue, 60),
    });
  }
  data = { heading: clean(data.heading, 80), tagline: clean(data.tagline, 140), slots };

  const { error } = await (supabaseAdmin.from("platform_settings") as any).upsert({
    key: "review_wall",
    value: data,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[saveReviewWallDataAction] Save failed:", error);
    return {
      success: false,
      error: "Could not save the review wall. Make sure the latest Supabase migration (phase18) has been run.",
    };
  }

  return {
    success: true,
    warning: notFetched.length
      ? `Saved. Instagram did not return a picture for slot ${notFetched.join(", ")} — make sure the post is public, or upload a photo for that slot.`
      : undefined,
  };
}
