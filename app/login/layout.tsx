import { NOINDEX } from "@/lib/seo";

// Private screen: kept out of search results. The page itself is unchanged.
export const metadata = { title: "Log in | Solo-No-More", ...NOINDEX };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
