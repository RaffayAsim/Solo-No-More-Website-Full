import React from "react";
import { getReviewWallDataAction } from "@/app/actions/review-wall";
import ReviewWallClient from "./ReviewWallClient";

export const revalidate = 0; // Fresh review wall data on every admin view

export default async function AdminReviewWallPage() {
  const data = await getReviewWallDataAction();

  return <ReviewWallClient initialData={data} />;
}
