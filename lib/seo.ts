import type { Metadata } from "next";

/** Public address of the site — used for canonical links, sitemap and structured data. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://solonomore.online").replace(/\/$/, "");
export const SITE_NAME = "Solo-No-More";
export const INSTAGRAM_URL = "https://www.instagram.com/solonomore.pk/";
export const CONTACT_EMAIL = "thesolonomore@gmail.com";
export const CONTACT_PHONE = "+92-333-2877852";
export const SEO_CITIES = ["Karachi", "Lahore", "Islamabad"] as const;

/**
 * Title, description, canonical URL and social cards for one public page.
 * The share image comes from app/opengraph-image.tsx unless `image` is given.
 */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  noindex?: boolean;
  type?: "website" | "article";
}): Metadata {
  const url = `${SITE_URL}${opts.path === "/" ? "" : opts.path}`;
  // Setting openGraph on a page replaces the inherited one, so always name an image:
  // the page's own (e.g. an event flyer) or the branded card from app/opengraph-image.tsx.
  const images = [
    opts.image
      ? { url: opts.image }
      : { url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: "Solo-No-More — Never go out alone again" },
  ];
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: SITE_NAME,
      locale: "en_PK",
      type: opts.type || "website",
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
    ...(opts.noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

/** Private screens (account, admin, payment links): never shown in search results. */
export const NOINDEX: Metadata = { robots: { index: false, follow: false } };

/** Renders a JSON-LD structured-data block. Data is serialised safely for a <script> tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
