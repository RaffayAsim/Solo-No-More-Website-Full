import { NOINDEX } from "@/lib/seo";

// Personal payment page: kept out of search results. The page itself is unchanged.
export const metadata = { title: "Membership payment | Solo-No-More", ...NOINDEX };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
