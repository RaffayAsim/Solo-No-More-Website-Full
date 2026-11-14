import { Suspense } from "react";
import PortalClient from "./PortalClient";

export const metadata = {
  title: "Partner & Artist Portal — Solo-No-More",
  description: "Venues, brands and artists: apply to work with Solo-No-More or sign in to your hub.",
};

export default function PortalPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#060408" }} />}>
      <PortalClient />
    </Suspense>
  );
}
