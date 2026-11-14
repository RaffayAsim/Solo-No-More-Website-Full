import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Blog posts live in the existing `platform_settings` key/value table, one row per post
 * (key = "blog:<slug>"), so no database migration is needed.
 */
export interface BlogPost {
  slug: string;
  title: string;
  /** Short summary: shown on the blog list and used as the search-result description. */
  excerpt: string;
  /** Body in simple text formatting: blank line = new paragraph, "## " heading, "- " list item, [text](url) links, **bold**. */
  body: string;
  coverImage: string | null;
  city: string | null;
  tags: string[];
  author: string;
  published: boolean;
  publishedAt: string | null;
  updatedAt: string;
}

const PREFIX = "blog:";

export function slugify(input: string): string {
  return String(input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function toPost(row: any): BlogPost | null {
  const v = row?.value;
  if (!v || typeof v !== "object" || !v.slug || !v.title) return null;
  return {
    slug: String(v.slug),
    title: String(v.title),
    excerpt: String(v.excerpt || ""),
    body: String(v.body || ""),
    coverImage: v.coverImage ? String(v.coverImage) : null,
    city: v.city ? String(v.city) : null,
    tags: Array.isArray(v.tags) ? v.tags.map(String) : [],
    author: String(v.author || "Solo-No-More Team"),
    published: v.published === true,
    publishedAt: v.publishedAt || null,
    updatedAt: v.updatedAt || row.updated_at || new Date().toISOString(),
  };
}

/** Newest first. Drafts only when asked (admin screens). */
export async function listBlogPosts(opts: { includeDrafts?: boolean } = {}): Promise<BlogPost[]> {
  try {
    const { data, error } = await (supabaseAdmin.from("platform_settings") as any)
      .select("key, value, updated_at")
      .like("key", `${PREFIX}%`)
      .limit(1000);
    if (error || !data) return [];
    return (data as any[])
      .map(toPost)
      .filter((p): p is BlogPost => !!p && (opts.includeDrafts || p.published))
      .sort((a, b) => (b.publishedAt || b.updatedAt).localeCompare(a.publishedAt || a.updatedAt));
  } catch {
    return [];
  }
}

export async function getBlogPost(slug: string, opts: { includeDrafts?: boolean } = {}): Promise<BlogPost | null> {
  if (!slug || slug.length > 100) return null;
  try {
    const { data } = await (supabaseAdmin.from("platform_settings") as any)
      .select("key, value, updated_at")
      .eq("key", PREFIX + slug)
      .maybeSingle();
    const post = data ? toPost(data) : null;
    return post && (opts.includeDrafts || post.published) ? post : null;
  } catch {
    return null;
  }
}

export async function writeBlogPost(post: BlogPost): Promise<{ error?: string }> {
  const { error } = await (supabaseAdmin.from("platform_settings") as any).upsert({
    key: PREFIX + post.slug,
    value: post,
    updated_at: new Date().toISOString(),
  });
  return error ? { error: error.message } : {};
}

export async function removeBlogPost(slug: string): Promise<{ error?: string }> {
  const { error } = await (supabaseAdmin.from("platform_settings") as any).delete().eq("key", PREFIX + slug);
  return error ? { error: error.message } : {};
}
