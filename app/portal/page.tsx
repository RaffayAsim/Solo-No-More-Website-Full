import { Suspense } from "react";
import PortalClient from "./PortalClient";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Partner & Artist Portal — Apply or Sign In | Solo-No-More",
  description: "Venues, cafés, brands and artists: apply to work with Solo-No-More or sign in to your partner or artist hub.",
  path: "/portal",
});

export default function PortalPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#060408" }} />}>
      <PortalClient />
    </Suspense>
  );
}
