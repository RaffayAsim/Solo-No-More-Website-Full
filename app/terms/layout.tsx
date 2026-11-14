import { pageMetadata } from "@/lib/seo";

// Search/social metadata only — the page itself is unchanged.
export const metadata = pageMetadata({
  title: "Terms of Service | Solo-No-More",
  description: "The terms that apply when you use Solo-No-More, join hangouts or book events.",
  path: "/terms",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
