import LandingPageClient from "@/components/LandingPageClient";
import { getReviewWallDataAction } from "@/app/actions/review-wall";
import { getPublicBeaconsAction, getPublicEventsAction } from "@/app/actions/public-events";

export const revalidate = 0; // Live reload on every page load as requested

export const metadata = {
  title: "Solo-No-More — Find Your People IRL in Karachi",
  description:
    "Never go out alone again. Join squads for padel, chai runs, gigs and rooftop hangs across Karachi — or host your own in seconds.",
};

export default async function LandingPage() {
  // Real data only: live beacons (per city — beacons are local) and upcoming events (all cities).
  const [reviewWallData, liveEvents, karachi, lahore, islamabad] = await Promise.all([
    getReviewWallDataAction(),
    getPublicEventsAction(),
    getPublicBeaconsAction("Karachi"),
    getPublicBeaconsAction("Lahore"),
    getPublicBeaconsAction("Islamabad"),
  ]);
  return (
    <LandingPageClient
      reviewWallData={reviewWallData}
      liveEvents={liveEvents}
      liveBeacons={{ Karachi: karachi, Lahore: lahore, Islamabad: islamabad }}
    />
  );
}
