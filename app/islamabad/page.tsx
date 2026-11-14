import CityPage from "@/components/seo/CityPage";
import { CITY_PAGES } from "@/lib/seo-content";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 600; // events refresh every 10 minutes

export const metadata = pageMetadata({
  title: CITY_PAGES.islamabad.title,
  description: CITY_PAGES.islamabad.description,
  path: "/islamabad",
});

export default function IslamabadPage() {
  return <CityPage city="islamabad" />;
}
