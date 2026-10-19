import EarlyBirdPage from "@/app/early-bird/page";

export const revalidate = 0;

export const metadata = {
  title: "Solo-No-More — Early Bird VIP Access",
  description:
    "Join Solo-No-More before our official launch. Claim your early bird founding member pass, choose your vibes, and unlock exclusive IRL squad meetups in Karachi.",
  openGraph: {
    title: "Solo-No-More — Early Bird VIP Access",
    description: "Never go out alone again. Claim your early bird spot to join vetted IRL squads for padel, chai runs, and rooftop hangs.",
    images: [{ url: "/images/hero-image.jpg" }],
  },
};

export default function Home() {
  return <EarlyBirdPage />;
}
