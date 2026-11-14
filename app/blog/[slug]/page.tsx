import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPost, listBlogPosts } from "@/lib/server/blog";
import { renderBlogBody, blogPlainText } from "@/lib/blog-format";
import { SITE_NAME, SITE_URL, jsonLd, pageMetadata } from "@/lib/seo";
import { Breadcrumbs, CtaRow, Eyebrow, SeoShell } from "@/components/seo/SeoPageParts";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Article not found | Solo-No-More", robots: { index: false } };
  return pageMetadata({
    title: `${post.title} | Solo-No-More`,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    image: post.coverImage,
    type: "article",
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const words = blogPlainText(post.body).split(" ").length;
  const minutes = Math.max(1, Math.round(words / 220));
  const published = post.publishedAt || post.updatedAt;
  const more = (await listBlogPosts()).filter((p) => p.slug !== post.slug).slice(0, 3);
  const cityPath = post.city ? `/${post.city.toLowerCase()}` : null;

  const article = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage ? [post.coverImage] : [`${SITE_URL}/opengraph-image`],
    datePublished: published,
    dateModified: post.updatedAt,
    author: { "@type": "Organization", name: post.author || SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512x512.png` } },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    wordCount: words,
  };

  return (
    <SeoShell>
      <article style={{ maxWidth: "760px", margin: "0 auto" }}>
        <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }]} />
        <Eyebrow>
          {[post.city, new Date(published).toLocaleDateString("en-PK", { timeZone: "Asia/Karachi", day: "numeric", month: "long", year: "numeric" }), `${minutes} min read`]
            .filter(Boolean)
            .join(" · ")}
        </Eyebrow>
        <h1 style={{ fontSize: "clamp(28px, 4.5vw, 44px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.15, margin: "0 0 16px" }}>{post.title}</h1>
        <p style={{ fontSize: "18px", lineHeight: 1.6, color: "rgba(255,255,255,0.8)", margin: "0 0 28px" }}>{post.excerpt}</p>
        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImage} alt={post.title} style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", display: "block", marginBottom: "32px" }} />
        )}
        <div style={{ fontSize: "17px", lineHeight: 1.8, color: "rgba(255,255,255,0.82)" }}>{renderBlogBody(post.body)}</div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: "40px", paddingTop: "28px" }}>
          <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.8)", margin: "0 0 14px" }}>
            Ready to stop going out alone?{cityPath && (
              <> See what&apos;s happening in <Link href={cityPath} style={{ color: "#FF8A3D" }}>{post.city}</Link>.</>
            )}
          </p>
          <CtaRow />
        </div>

        {more.length > 0 && (
          <div style={{ marginTop: "48px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 900, margin: "0 0 14px" }}>More from the blog</h2>
            <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "16px" }}>
              {more.map((p) => (
                <li key={p.slug}>
                  <Link href={`/blog/${p.slug}`} style={{ color: "#FF8A3D" }}>{p.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(article) }} />
    </SeoShell>
  );
}
