import React from "react";
import { verifyAdminStatus } from "@/app/actions/admin";
import { getReviewWallDataAction } from "@/app/actions/review-wall";
import ReviewWallClient from "./ReviewWallClient";

export const revalidate = 0; // Fresh review wall data on every admin view

export default async function AdminReviewWallPage() {
  // Each admin page checks access itself — the layout guard is not re-run on every navigation.
  await verifyAdminStatus();

  const data = await getReviewWallDataAction();

  return <ReviewWallClient initialData={data} />;
}
