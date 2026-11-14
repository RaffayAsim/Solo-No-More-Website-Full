import CityPage from "@/components/seo/CityPage";
import { CITY_PAGES } from "@/lib/seo-content";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 600; // events refresh every 10 minutes

export const metadata = pageMetadata({
  title: CITY_PAGES.lahore.title,
  description: CITY_PAGES.lahore.description,
  path: "/lahore",
});

export default function LahorePage() {
  return <CityPage city="lahore" />;
}
