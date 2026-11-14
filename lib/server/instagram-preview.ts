import "server-only";

/**
 * Reads the picture and account handle of a PUBLIC Instagram post or reel from
 * Instagram's own embed page (https://www.instagram.com/p/<code>/embed/) — the page
 * Instagram provides for showing posts on other websites. No login, no API key.
 *
 * Instagram's image links expire after a while, so callers should store a copy of
 * the image (see review-wall.ts) instead of saving the link.
 */

const POST_PATH = /instagram\.com\/(?:[A-Za-z0-9._]+\/)?(p|reels?|tv)\/([A-Za-z0-9_-]{5,40})/i;
const MAX_BYTES = 3 * 1024 * 1024;

export function instagramPostCode(url: string): { kind: "post" | "reel"; code: string } | null {
  const m = POST_PATH.exec(url || "");
  if (!m) return null;
  return { kind: /^reel/i.test(m[1]) ? "reel" : "post", code: m[2] };
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#0?64;/g, "@")
    .replace(/&quot;/g, '"')
    .replace(/&#x2F;/gi, "/")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal, redirect: "follow", cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Returns the post's image as a data URL plus the author's @handle, or null when the
 * post is private/deleted or Instagram did not answer.
 */
export async function fetchInstagramPreview(
  postUrl: string
): Promise<{ imageDataUrl: string; author?: string; kind: "post" | "reel" } | null> {
  const parsed = instagramPostCode(postUrl);
  if (!parsed) return null;
  const segment = parsed.kind === "reel" ? "reel" : "p";

  try {
    const page = await fetchWithTimeout(`https://www.instagram.com/${segment}/${parsed.code}/embed/`, 10_000);
    if (!page.ok) return null;
    const html = await page.text();

    // <img class="EmbeddedMediaImage" alt="Instagram post shared by @handle" src="...">
    const tag = /<img[^>]*class="EmbeddedMediaImage"[^>]*>/i.exec(html)?.[0];
    const src = tag && /\ssrc="([^"]+)"/i.exec(tag)?.[1];
    if (!src) return null;
    const alt = tag ? decodeHtml(/\salt="([^"]*)"/i.exec(tag)?.[1] || "") : "";
    const handle = /@([A-Za-z0-9._]{1,30})/.exec(alt)?.[1];

    const imageUrl = decodeHtml(src);
    if (!/^https:\/\/[^/]+\.(cdninstagram\.com|fbcdn\.net)\//i.test(imageUrl)) return null;
    const img = await fetchWithTimeout(imageUrl, 10_000);
    const type = (img.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!img.ok || !/^image\/(jpeg|png|webp)$/.test(type)) return null;
    const buffer = Buffer.from(await img.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_BYTES) return null;

    return {
      imageDataUrl: `data:${type};base64,${buffer.toString("base64")}`,
      author: handle ? `@${handle}` : undefined,
      kind: parsed.kind,
    };
  } catch {
    return null;
  }
}
