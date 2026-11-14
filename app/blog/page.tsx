import Link from "next/link";
import { listBlogPosts } from "@/lib/server/blog";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs, Eyebrow, H1, SeoShell, bodyText } from "@/components/seo/SeoPageParts";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Solo-No-More Blog — Guides to Going Out & Meeting People in Pakistan",
  description:
    "City guides, hangout ideas and tips for meeting new people in Karachi, Lahore and Islamabad, from the Solo-No-More team.",
  path: "/blog",
});

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-PK", { timeZone: "Asia/Karachi", day: "numeric", month: "long", year: "numeric" }) : "";

export default async function BlogIndexPage() {
  const posts = await listBlogPosts();

  return (
    <SeoShell>
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }]} />
      <Eyebrow>The Solo-No-More blog</Eyebrow>
      <H1>Guides to going out — and never going alone</H1>
      <p style={{ ...bodyText, maxWidth: "760px", margin: "0 0 36px" }}>
        City guides, hangout ideas and honest tips for meeting new people in Karachi, Lahore and Islamabad.
      </p>

      {posts.length === 0 ? (
        <p style={bodyText}>New articles are on the way. Follow us on Instagram @solonomore.pk in the meantime.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "18px" }}>
          {posts.map((p) => (
            <article key={p.slug} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Link href={`/blog/${p.slug}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                {p.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.coverImage} alt={p.title} loading="lazy" style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", display: "block" }} />
                )}
                <div style={{ padding: "18px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 800, color: "#FFA05C", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {[p.city, fmt(p.publishedAt)].filter(Boolean).join(" · ")}
                  </div>
                  <h2 style={{ fontSize: "19px", fontWeight: 900, margin: "0 0 8px", lineHeight: 1.3 }}>{p.title}</h2>
                  <p style={{ margin: 0, fontSize: "14.5px", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>{p.excerpt}</p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </SeoShell>
  );
}
