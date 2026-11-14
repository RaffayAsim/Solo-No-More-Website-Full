import Link from "next/link";
import { ACTIVITY_KEYS, ACTIVITY_PAGES, CITY_KEYS, CITY_PAGES } from "@/lib/seo-content";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs, Card, CtaRow, Eyebrow, H1, H2, SeoShell, bodyText } from "@/components/seo/SeoPageParts";

export const metadata = pageMetadata({
  title: "Things to Do With New People in Karachi, Lahore & Islamabad | Solo-No-More",
  description:
    "Padel, chai runs, food walks, gigs and game nights — find vetted people to do them with in Karachi, Lahore and Islamabad.",
  path: "/things-to-do",
});

export default function ThingsToDoPage() {
  return (
    <SeoShell>
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Things to do", path: "/things-to-do" }]} />
      <Eyebrow>Things to do</Eyebrow>
      <H1>Things to do with new people — pick your plan</H1>
      <p style={{ ...bodyText, maxWidth: "780px", margin: "0 0 16px" }}>
        Whatever you want to do, someone in your city wants to do it too. Choose an activity to see how members find each
        other for it on Solo-No-More.
      </p>
      <CtaRow />

      <H2>Activities</H2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>
        {ACTIVITY_KEYS.map((k) => (
          <Link key={k} href={`/things-to-do/${k}`} style={{ textDecoration: "none", color: "inherit" }}>
            <Card>
              <div style={{ fontWeight: 900, fontSize: "18px", marginBottom: "6px" }}>{ACTIVITY_PAGES[k].name}</div>
              <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>{ACTIVITY_PAGES[k].description}</p>
            </Card>
          </Link>
        ))}
      </div>

      <H2>By city</H2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", ...bodyText }}>
        {CITY_KEYS.map((k) => (
          <Link key={k} href={`/${k}`} style={{ color: "#FF8A3D", fontWeight: 800 }}>Things to do in {CITY_PAGES[k].name} →</Link>
        ))}
      </div>
    </SeoShell>
  );
}
