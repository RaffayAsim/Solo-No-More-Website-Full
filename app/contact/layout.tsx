import { pageMetadata } from "@/lib/seo";

// Search/social metadata only — the page itself is unchanged.
export const metadata = pageMetadata({
  title: "Contact Solo-No-More — WhatsApp, Email & Support",
  description: "Questions about membership, events, partnerships or payments? Reach the Solo-No-More team on WhatsApp or email.",
  path: "/contact",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
