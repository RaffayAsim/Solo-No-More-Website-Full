import { pageMetadata } from "@/lib/seo";

// Search/social metadata only — the page itself is unchanged.
export const metadata = pageMetadata({
  title: "Sell Event Tickets in Pakistan — QR Passes & Door Scanner | Solo-No-More",
  description: "Artists, organisers and venues: list your event, sell passes in PKR and scan guests at the door with Solo-No-More.",
  path: "/sell-tickets",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
