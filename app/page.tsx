import LandingPageClient from "@/components/LandingPageClient";
import { getReviewWallDataAction } from "@/app/actions/review-wall";

export const revalidate = 0; // Live reload on every page load as requested

export const metadata = {
  title: "Solo-No-More — Find Your People IRL in Karachi",
  description:
    "Never go out alone again. Join squads for padel, chai runs, gigs and rooftop hangs across Karachi — or host your own in seconds.",
};

export default async function LandingPage() {
  const reviewWallData = await getReviewWallDataAction();
  return <LandingPageClient reviewWallData={reviewWallData} />;
}
