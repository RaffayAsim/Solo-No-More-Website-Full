import Link from "next/link";
import { notFound } from "next/navigation";
import { ACTIVITY_KEYS, ACTIVITY_PAGES, CITY_KEYS, CITY_PAGES, type ActivityKey } from "@/lib/seo-content";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs, Card, CtaRow, Eyebrow, FaqSection, H1, H2, SeoShell, bodyText } from "@/components/seo/SeoPageParts";

export const dynamicParams = false;

export function generateStaticParams() {
  return ACTIVITY_KEYS.map((activity) => ({ activity }));
}

export async function generateMetadata({ params }: { params: Promise<{ activity: string }> }) {
  const { activity } = await params;
  const a = ACTIVITY_PAGES[activity as ActivityKey];
  if (!a) return {};
  return pageMetadata({ title: a.title, description: a.description, path: `/things-to-do/${activity}` });
}

export default async function ActivityPage({ params }: { params: Promise<{ activity: string }> }) {
  const { activity } = await params;
  const a = ACTIVITY_PAGES[activity as ActivityKey];
  if (!a) notFound();

  return (
    <SeoShell>
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Things to do", path: "/things-to-do" }, { name: a.name, path: `/things-to-do/${activity}` }]} />
      <Eyebrow>Things to do · {a.name}</Eyebrow>
      <H1>{a.h1}</H1>
      {a.intro.map((p, i) => (
        <p key={i} style={{ ...bodyText, maxWidth: "780px", margin: "0 0 16px" }}>{p}</p>
      ))}
      <CtaRow />

      <H2>Tips for a great {a.name.toLowerCase()} beacon</H2>
      <ul style={{ ...bodyText, paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
        {a.tips.map((t) => <li key={t}>{t}</li>)}
      </ul>

      <H2>{a.name} by city</H2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
        {CITY_KEYS.map((k) => (
          <Link key={k} href={`/${k}`} style={{ textDecoration: "none", color: "inherit" }}>
            <Card>
              <div style={{ fontWeight: 900, fontSize: "17px", marginBottom: "4px" }}>{CITY_PAGES[k].name}</div>
              <div style={{ fontSize: "14px", color: "#FFA05C" }}>Things to do in {CITY_PAGES[k].name} →</div>
            </Card>
          </Link>
        ))}
      </div>

      <FaqSection items={a.faq} />

      <H2>More ways to find your people</H2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {ACTIVITY_KEYS.filter((k) => k !== activity).map((k) => (
          <Link key={k} href={`/things-to-do/${k}`} style={{ padding: "10px 16px", border: "1px solid rgba(255,90,31,0.45)", color: "#FFA05C", fontWeight: 800, fontSize: "14px", textDecoration: "none" }}>
            {ACTIVITY_PAGES[k].name}
          </Link>
        ))}
      </div>
    </SeoShell>
  );
}
