"use client";

import SiteNavbar from "./SiteNavbar";

/** Public subpages use the same navbar as the home page. */
export default function SubpageNavbar({ activePage }: { activePage?: string }) {
  return <SiteNavbar activePage={activePage} />;
}
