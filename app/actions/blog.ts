"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { verifyAdminStatus } from "@/app/actions/admin";
import { BlogPost, getBlogPost, listBlogPosts, removeBlogPost, slugify, writeBlogPost } from "@/lib/server/blog";
import { PUBLIC_MEDIA_BUCKET, isImageDataUrl, storePublicImageDataUrl } from "@/lib/server/storage";

async function requireAdmin(): Promise<string | null> {
  try {
    await verifyAdminStatus("root");
    return null;
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return "Unauthorized. Admin privileges required.";
  }
}

export async function getAdminBlogPostsAction(): Promise<BlogPost[]> {
  if (await requireAdmin()) return [];
  return listBlogPosts({ includeDrafts: true });
}

export interface BlogPostInput {
  title: string;
  slug?: string;
  excerpt: string;
  body: string;
  /** A data: URL (new upload), an existing https URL, or empty. */
  coverImage?: string | null;
  city?: string | null;
  tags?: string[];
  author?: string;
  published: boolean;
}

/** Create or update a post. `originalSlug` is the post being edited (its URL may change). */
export async function saveBlogPostAction(
  input: BlogPostInput,
  originalSlug?: string
): Promise<{ success: true; slug: string } | { success: false; error: string }> {
  const denied = await requireAdmin();
  if (denied) return { success: false, error: denied };

  const title = String(input.title || "").trim().slice(0, 140);
  const excerpt = String(input.excerpt || "").trim().replace(/\s+/g, " ").slice(0, 300);
  const body = String(input.body || "").replace(/\r\n/g, "\n").trim().slice(0, 60_000);
  const slug = slugify(input.slug || title);
  if (title.length < 8) return { success: false, error: "Please write a title of at least 8 characters." };
  if (excerpt.length < 40) return { success: false, error: "Please write a summary of at least 40 characters (it shows in Google results)." };
  if (body.length < 200) return { success: false, error: "The article is too short — write at least a few paragraphs." };
  if (!slug) return { success: false, error: "Please choose a web address (slug) for the post." };

  if (slug !== originalSlug && (await getBlogPost(slug, { includeDrafts: true }))) {
    return { success: false, error: `Another post already uses the address /blog/${slug}. Change the title or slug.` };
  }
  const previous = originalSlug ? await getBlogPost(originalSlug, { includeDrafts: true }) : null;

  let coverImage: string | null = String(input.coverImage || "").trim() || null;
  if (coverImage && isImageDataUrl(coverImage)) {
    const stored = await storePublicImageDataUrl(PUBLIC_MEDIA_BUCKET, "blog", coverImage);
    if (!stored || isImageDataUrl(stored)) return { success: false, error: "The cover image could not be saved. Try a smaller JPG or PNG." };
    coverImage = stored;
  } else if (coverImage && !/^https:\/\//i.test(coverImage) && !coverImage.startsWith("/images/")) {
    coverImage = null;
  }

  const now = new Date().toISOString();
  const post: BlogPost = {
    slug,
    title,
    excerpt,
    body,
    coverImage,
    city: input.city && ["Karachi", "Lahore", "Islamabad"].includes(input.city) ? input.city : null,
    tags: (input.tags || []).map((t) => String(t).trim().slice(0, 30)).filter(Boolean).slice(0, 8),
    author: String(input.author || "Solo-No-More Team").trim().slice(0, 60) || "Solo-No-More Team",
    published: input.published === true,
    // The first time a post goes live it gets its publish date; edits keep it.
    publishedAt: input.published ? previous?.publishedAt || now : previous?.publishedAt || null,
    updatedAt: now,
  };

  const saved = await writeBlogPost(post);
  if (saved.error) return { success: false, error: "Could not save the post. Please try again." };
  if (originalSlug && originalSlug !== slug) await removeBlogPost(originalSlug);

  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
  return { success: true, slug };
}

export async function deleteBlogPostAction(slug: string): Promise<{ success: boolean; error?: string }> {
  const denied = await requireAdmin();
  if (denied) return { success: false, error: denied };
  const res = await removeBlogPost(slug);
  if (res.error) return { success: false, error: "Could not delete the post." };
  revalidatePath("/blog");
  return { success: true };
}
