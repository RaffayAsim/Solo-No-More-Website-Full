import { pageMetadata } from "@/lib/seo";

// Search/social metadata only — the page itself is unchanged.
export const metadata = pageMetadata({
  title: "Join Solo-No-More — Apply for Membership or Sign Up as a Guest",
  description: "Sign up free as a guest or apply for a vetted Solo-No-More membership to host and join hangouts in Karachi, Lahore and Islamabad.",
  path: "/apply",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
