import LandingPageClient from "@/components/LandingPageClient";
import { getReviewWallDataAction } from "@/app/actions/review-wall";

export const revalidate = 0;

export const metadata = {
  title: "Solo-No-More — Preview Landing",
  description: "Internal preview of the full Solo-No-More landing page.",
};

export default async function PreviewLandingPage() {
  const reviewWallData = await getReviewWallDataAction();
  return <LandingPageClient reviewWallData={reviewWallData} />;
}
