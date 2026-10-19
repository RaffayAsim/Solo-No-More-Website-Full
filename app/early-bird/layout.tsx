import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Early Bird VIP Pass | Solo-No-More — Find Your Vibe IRL",
  description:
    "Join Solo-No-More before our official launch. Claim your early bird founding member pass, choose your vibes, and unlock exclusive IRL squad meetups.",
  openGraph: {
    title: "Solo-No-More — Early Bird VIP Access",
    description: "Never go out alone again. Claim your early bird spot to join vetted IRL squads for padel, chai runs, and rooftop hangs.",
    images: [{ url: "/images/hero-image.jpg" }],
  },
};

export default function EarlyBirdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
