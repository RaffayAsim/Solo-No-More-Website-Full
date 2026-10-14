import LandingPageClient from "@/components/LandingPageClient";
import { getReviewWallDataAction } from "@/app/actions/review-wall";

export const revalidate = 0; // Live reload on every page load as requested

export const metadata = {
  title: "Solo-No-More — Find Your Vibe IRL",
  description:
    "An invite-only community for Gen Z who want genuine, real-world connection. Apply for membership today.",
};

export default async function LandingPage() {
  const reviewWallData = await getReviewWallDataAction();
  return <LandingPageClient reviewWallData={reviewWallData} />;
}
