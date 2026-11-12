import "server-only";

/**
 * Absolute base URL of the site, for links placed in emails.
 * Uses NEXT_PUBLIC_SITE_URL when set; otherwise the host of the current request.
 */
import { headers } from "next/headers";

export async function getSiteUrl(): Promise<string> {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");
  if (/^https?:\/\//i.test(configured)) return configured;

  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host");
    if (host && /^[a-zA-Z0-9.:-]+$/.test(host)) {
      const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
      return `${proto === "http" ? "http" : "https"}://${host}`;
    }
  } catch {}

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
