import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join Solo-No-More — Early Bird VIP Access",
  description:
    "Claim your Early Bird Founder Pass before our official launch. Select your vibes, connect with curated squads, and never go out alone again.",
};

export default function JoinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
