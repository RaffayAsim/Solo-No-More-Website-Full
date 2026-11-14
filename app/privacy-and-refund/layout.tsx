import { pageMetadata } from "@/lib/seo";

// Search/social metadata only — the page itself is unchanged.
export const metadata = pageMetadata({
  title: "Privacy & Refund Policy | Solo-No-More",
  description: "How Solo-No-More handles your personal data, and our refund policy for memberships and event passes.",
  path: "/privacy-and-refund",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
