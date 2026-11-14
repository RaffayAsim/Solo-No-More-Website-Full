import { pageMetadata } from "@/lib/seo";

// Search/social metadata only — the page itself is unchanged.
export const metadata = pageMetadata({
  title: "How Solo-No-More Works — Beacons, Vetting & Safe Meetups",
  description: "Post a beacon for what you want to do, approve who joins, and meet vetted people in public places. Here's how Solo-No-More works, step by step.",
  path: "/how-it-works",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
