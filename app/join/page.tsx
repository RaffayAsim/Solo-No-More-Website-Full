import EarlyBirdPage from "../early-bird/page";

export const metadata = {
  // Same page as /early-bird — point search engines there.
  alternates: { canonical: "/early-bird" },
  robots: { index: false, follow: true },
  title: "Join Solo-No-More — Early Bird VIP Access",
  description:
    "Claim your Early Bird Founder Pass before our official launch. Select your vibes, connect with curated squads, and never go out alone again.",
};

export default function JoinPage() {
  return <EarlyBirdPage />;
}
