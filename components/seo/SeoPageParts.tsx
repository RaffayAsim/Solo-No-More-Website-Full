import Link from "next/link";
import SubpageNavbar from "@/components/SubpageNavbar";
import SubpageFooter from "@/components/SubpageFooter";
import type { FaqItem } from "@/lib/seo-content";
import { SITE_URL, jsonLd } from "@/lib/seo";

/** Same dark shell, navbar and footer as the other public subpages. */
export function SeoShell({ children, activePage }: { children: React.ReactNode; activePage?: string }) {
  return (
    <div style={{ background: "#060408", minHeight: "100vh", color: "#FFFFFF", position: "relative" }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "520px",
          background: "radial-gradient(ellipse 60% 60% at 50% 0%, rgba(255, 90, 31, 0.16), transparent 75%)",
          pointerEvents: "none",
        }}
      />
      <SubpageNavbar activePage={activePage} />
      <main style={{ position: "relative", maxWidth: "1080px", margin: "0 auto", padding: "40px clamp(16px, 4vw, 40px) 80px" }}>{children}</main>
      <SubpageFooter />
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#FFA05C", marginBottom: "12px" }}>
      {children}
    </div>
  );
}

export function H1({ children }: { children: React.ReactNode }) {
  return (
    <h1 style={{ fontSize: "clamp(30px, 5vw, 52px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.12, margin: "0 0 18px", maxWidth: "860px" }}>
      {children}
    </h1>
  );
}

export function H2({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 900, letterSpacing: "-0.02em", margin: "56px 0 18px" }}>
      {children}
    </h2>
  );
}

export const bodyText: React.CSSProperties = { fontSize: "16.5px", lineHeight: 1.75, color: "rgba(255,255,255,0.78)" };

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", padding: "20px" }}>{children}</div>
  );
}

export function CtaRow() {
  const base: React.CSSProperties = { padding: "13px 22px", fontWeight: 800, fontSize: "14.5px", textDecoration: "none", display: "inline-block" };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "8px" }}>
      <Link href="/apply" style={{ ...base, background: "#FF5A1F", color: "#fff" }}>Join Solo-No-More</Link>
      <Link href="/events" style={{ ...base, border: "1px solid rgba(255,255,255,0.25)", color: "#fff" }}>Browse events</Link>
      <Link href="/how-it-works" style={{ ...base, color: "rgba(255,255,255,0.75)" }}>How it works →</Link>
    </div>
  );
}

/** Visible FAQ plus matching FAQPage structured data (Google requires the answers to be on the page). */
export function FaqSection({ items, heading = "Frequently asked questions" }: { items: FaqItem[]; heading?: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <section>
      <H2 id="faq">{heading}</H2>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {items.map((f) => (
          <details key={f.q} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", padding: "16px 18px" }}>
            <summary style={{ cursor: "pointer", fontWeight: 800, fontSize: "16px" }}>{f.q}</summary>
            <p style={{ ...bodyText, margin: "12px 0 0", fontSize: "15.5px" }}>{f.a}</p>
          </details>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
    </section>
  );
}

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE_URL}${it.path}` })),
  };
  return (
    <nav aria-label="Breadcrumb" style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", marginBottom: "20px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {items.map((it, i) => (
        <span key={it.path}>
          {i < items.length - 1 ? (
            <>
              <Link href={it.path} style={{ color: "rgba(255,255,255,0.7)" }}>{it.name}</Link>
              <span aria-hidden> / </span>
            </>
          ) : (
            <span aria-current="page" style={{ color: "#fff" }}>{it.name}</span>
          )}
        </span>
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
    </nav>
  );
}
