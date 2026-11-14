import { pageMetadata } from "@/lib/seo";

// Search/social metadata only — the page itself is unchanged.
export const metadata = pageMetadata({
  title: "Memberships & Pricing — Solo Pass Pro from PKR 1,999/month | Solo-No-More",
  description: "Compare Solo-No-More plans: free guest signup, Solo Pass Pro and Founder Circle VIP. Monthly and annual billing in PKR.",
  path: "/memberships",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
