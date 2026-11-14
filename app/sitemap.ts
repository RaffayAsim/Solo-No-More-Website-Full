import type { MetadataRoute } from "next";
import { getPublicEventsAction } from "@/app/actions/public-events";
import { listBlogPosts } from "@/lib/server/blog";
import { ACTIVITY_KEYS, CITY_KEYS } from "@/lib/seo-content";
import { SITE_URL } from "@/lib/seo";

// Rebuilt at most once an hour, so new events and blog posts are picked up automatically.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  const fixed: MetadataRoute.Sitemap = [
    page("/", 1, "daily"),
    page("/events", 0.9, "daily"),
    ...CITY_KEYS.map((c) => page(`/${c}`, 0.9, "daily")),
    page("/memberships", 0.8, "monthly"),
    page("/how-it-works", 0.8, "monthly"),
    page("/things-to-do", 0.7, "monthly"),
    ...ACTIVITY_KEYS.map((a) => page(`/things-to-do/${a}`, 0.7, "monthly")),
    page("/blog", 0.7, "daily"),
    page("/early-bird", 0.7, "weekly"),
    page("/apply", 0.6, "monthly"),
    page("/partners", 0.6, "monthly"),
    page("/sell-tickets", 0.6, "monthly"),
    page("/portal", 0.5, "monthly"),
    page("/about", 0.5, "monthly"),
    page("/contact", 0.5, "yearly"),
    page("/terms", 0.2, "yearly"),
    page("/privacy-and-refund", 0.2, "yearly"),
  ];

  const [events, posts] = await Promise.all([getPublicEventsAction().catch(() => []), listBlogPosts().catch(() => [])]);

  return [
    ...fixed,
    ...events.map((e) => ({ url: `${SITE_URL}/events/${e.id}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    ...posts.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
