import { pageMetadata } from "@/lib/seo";

// Search/social metadata only — the page itself is unchanged.
export const metadata = pageMetadata({
  title: "About Solo-No-More — Why We're Building Pakistan's IRL Squad Community",
  description: "Solo-No-More helps people in Karachi, Lahore and Islamabad find others to go out with — vetted members, host-approved hangouts and public meetups.",
  path: "/about",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
