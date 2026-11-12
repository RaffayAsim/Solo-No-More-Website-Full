import "server-only";

/**
 * Server-only image storage.
 *
 * Uploaded images (payment proofs, application photos) are written to private
 * Supabase Storage buckets and referenced in the database as
 * `storage://<bucket>/<path>`. They are only ever served through short-lived signed
 * URLs generated for someone who is allowed to see them.
 *
 * If the bucket does not exist yet (migration not run), the original data URL is
 * kept inline so nothing is lost — exactly how the app behaved before.
 */
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const PAYMENT_PROOFS_BUCKET = "payment-proofs";
export const MEMBER_UPLOADS_BUCKET = "member-uploads";
/** Public bucket for non-sensitive images shown across the app (avatars, beacon and event art). */
export const PUBLIC_MEDIA_BUCKET = "public-media";

const STORAGE_PREFIX = "storage://";
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function parseImageDataUrl(
  value: string | null | undefined
): { mime: string; ext: string; buffer: Buffer } | null {
  if (!value || typeof value !== "string") return null;
  const match = /^data:([a-zA-Z0-9.+/-]+);base64,(.+)$/.exec(value.trim());
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const ext = ALLOWED_MIME[mime];
  if (!ext) return null;
  try {
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) return null;
    return { mime, ext, buffer };
  } catch {
    return null;
  }
}

/**
 * Stores an image data URL in a private bucket.
 * Returns a `storage://` reference, or the original data URL if storage is unavailable.
 * Returns null when the value is not a valid image.
 */
export async function storeImageDataUrl(
  bucket: string,
  folder: string,
  dataUrl: string | null | undefined
): Promise<string | null> {
  const parsed = parseImageDataUrl(dataUrl);
  if (!parsed) return null;

  const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, "_").replace(/^\/+|\/+$/g, "");
  const path = `${safeFolder}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${parsed.ext}`;

  try {
    const { error } = await supabaseAdmin.storage.from(bucket).upload(path, parsed.buffer, {
      contentType: parsed.mime,
      upsert: false,
    });
    if (!error) return `${STORAGE_PREFIX}${bucket}/${path}`;
    console.error(`[storage] Upload to "${bucket}" failed, keeping image inline:`, error.message);
  } catch (err) {
    console.error(`[storage] Upload to "${bucket}" threw, keeping image inline:`, err);
  }
  return dataUrl!.trim();
}

/**
 * Turns a stored reference into something an <img> can load.
 * `storage://` references become signed URLs; anything else is returned unchanged.
 */
export async function resolveStoredImage(
  value: string | null | undefined,
  expiresInSeconds = 60 * 60
): Promise<string | null> {
  if (!value) return null;
  if (!value.startsWith(STORAGE_PREFIX)) return value;

  const rest = value.slice(STORAGE_PREFIX.length);
  const slash = rest.indexOf("/");
  if (slash <= 0) return null;
  const bucket = rest.slice(0, slash);
  const path = rest.slice(slash + 1);

  try {
    const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

/**
 * Stores a (non-sensitive) image in a public bucket and returns its public URL.
 * Falls back to the original data URL if storage is unavailable; returns null if
 * the value is not a valid image.
 */
export async function storePublicImageDataUrl(
  bucket: string,
  folder: string,
  dataUrl: string | null | undefined
): Promise<string | null> {
  const ref = await storeImageDataUrl(bucket, folder, dataUrl);
  if (!ref || !ref.startsWith(STORAGE_PREFIX)) return ref;
  const path = ref.slice(STORAGE_PREFIX.length + bucket.length + 1);
  try {
    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
    if (data?.publicUrl) return data.publicUrl;
  } catch {}
  return dataUrl!.trim();
}

export function isImageDataUrl(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:image/");
}

/**
 * True for a temporary signed link produced by resolveStoredImage(). Forms echo these
 * back when the user did not change the image — they must never be saved, because the
 * link expires. Callers should keep the existing stored value instead.
 */
export function isSignedStorageUrl(value: unknown): boolean {
  return typeof value === "string" && value.includes("/storage/v1/object/sign/");
}
