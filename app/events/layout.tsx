import { pageMetadata } from "@/lib/seo";

// Search/social metadata only — the page itself is unchanged.
export const metadata = pageMetadata({
  title: "Upcoming Events in Karachi, Lahore & Islamabad — Book Passes | Solo-No-More",
  description: "Browse upcoming Solo-No-More events — gigs, padel, food walks and socials in Karachi, Lahore and Islamabad. Book a pass online and scan in at the door.",
  path: "/events",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
