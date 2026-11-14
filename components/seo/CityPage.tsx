import Link from "next/link";
import { getPublicEventsAction } from "@/app/actions/public-events";
import { listBlogPosts } from "@/lib/server/blog";
import { ACTIVITY_KEYS, ACTIVITY_PAGES, CITY_KEYS, CITY_PAGES, type CityKey } from "@/lib/seo-content";
import { PKT_TIME_ZONE } from "@/lib/time";
import { Breadcrumbs, Card, CtaRow, Eyebrow, FaqSection, H1, H2, SeoShell, bodyText } from "./SeoPageParts";

const STEPS = [
  { t: "Apply once", d: "Sign up and get reviewed by our team — every member is vetted before joining hangouts." },
  { t: "Drop or join a beacon", d: "Post what you want to do and when, or ask to join a plan someone else posted." },
  { t: "Meet in public", d: "The host approves who comes, the squad chat sorts the details, and you meet at a public spot." },
];

export default async function CityPage({ city }: { city: CityKey }) {
  const c = CITY_PAGES[city];
  const [events, posts] = await Promise.all([getPublicEventsAction(), listBlogPosts()]);
  const needle = c.name.toLowerCase();
  const cityEvents = events
    .filter((e) => `${e.address || ""} ${e.venue_name || ""} ${e.title}`.toLowerCase().includes(needle))
    .slice(0, 6);
  const cityPosts = posts.filter((p) => p.city === c.name).slice(0, 4);

  return (
    <SeoShell>
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: c.name, path: `/${city}` }]} />
      <Eyebrow>Solo-No-More in {c.name}</Eyebrow>
      <H1>{c.h1}</H1>
      {c.intro.map((p, i) => (
        <p key={i} style={{ ...bodyText, maxWidth: "780px", margin: "0 0 16px" }}>{p}</p>
      ))}
      <CtaRow />

      <H2>Upcoming events in {c.name}</H2>
      {cityEvents.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
          {cityEvents.map((e) => (
            <Link key={e.id} href={`/events/${e.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <Card>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#FFA05C", marginBottom: "6px" }}>
                  {new Date(e.scheduled_at).toLocaleString("en-PK", { timeZone: PKT_TIME_ZONE, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                </div>
                <div style={{ fontWeight: 900, fontSize: "17px", marginBottom: "6px" }}>{e.title}</div>
                <div style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.65)" }}>
                  {e.venue_name || e.address || c.name} · {e.price > 0 ? `PKR ${e.price.toLocaleString("en-US")}` : "Free"}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p style={bodyText}>
          No {c.name} events are listed right now — new ones appear here as soon as they go live. Meanwhile, see{" "}
          <Link href="/events" style={{ color: "#FF8A3D" }}>all upcoming events</Link>.
        </p>
      )}

      <H2>Popular things to do in {c.name}</H2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
        {c.spots.map((s) => (
          <Card key={s.area}>
            <h3 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 800 }}>{s.area}</h3>
            <p style={{ margin: 0, fontSize: "14.5px", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>{s.idea}</p>
          </Card>
        ))}
      </div>

      <H2>How Solo-No-More works in {c.name}</H2>
      <ol style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px", listStyle: "none", padding: 0, margin: 0 }}>
        {STEPS.map((s, i) => (
          <li key={s.t}>
            <Card>
              <div style={{ fontSize: "13px", fontWeight: 900, color: "#FF5A1F", marginBottom: "6px" }}>STEP {i + 1}</div>
              <div style={{ fontWeight: 900, fontSize: "17px", marginBottom: "6px" }}>{s.t}</div>
              <p style={{ margin: 0, fontSize: "14.5px", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>{s.d}</p>
            </Card>
          </li>
        ))}
      </ol>

      <H2>Find people for…</H2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {ACTIVITY_KEYS.map((a) => (
          <Link key={a} href={`/things-to-do/${a}`} style={{ padding: "10px 16px", border: "1px solid rgba(255,90,31,0.45)", color: "#FFA05C", fontWeight: 800, fontSize: "14px", textDecoration: "none" }}>
            {ACTIVITY_PAGES[a].name}
          </Link>
        ))}
      </div>

      {cityPosts.length > 0 && (
        <>
          <H2>{c.name} guides</H2>
          <ul style={{ ...bodyText, margin: 0, paddingLeft: "20px" }}>
            {cityPosts.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} style={{ color: "#FF8A3D" }}>{p.title}</Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <FaqSection items={c.faq} heading={`${c.name}: frequently asked questions`} />

      <H2>Other cities</H2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", ...bodyText }}>
        {CITY_KEYS.filter((k) => k !== city).map((k) => (
          <Link key={k} href={`/${k}`} style={{ color: "#FF8A3D", fontWeight: 800 }}>Things to do in {CITY_PAGES[k].name} →</Link>
        ))}
        <Link href="/blog" style={{ color: "rgba(255,255,255,0.75)" }}>Read the blog →</Link>
      </div>
    </SeoShell>
  );
}
