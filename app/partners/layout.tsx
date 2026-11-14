import { pageMetadata } from "@/lib/seo";

// Search/social metadata only — the page itself is unchanged.
export const metadata = pageMetadata({
  title: "Partner With Solo-No-More — Cafés, Venues, Courts & Brands",
  description: "Bring vetted squads to your café, rooftop, padel court or venue. Offer member perks and list events with Solo-No-More.",
  path: "/partners",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
