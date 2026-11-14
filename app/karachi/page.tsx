import CityPage from "@/components/seo/CityPage";
import { CITY_PAGES } from "@/lib/seo-content";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 600; // events refresh every 10 minutes

export const metadata = pageMetadata({
  title: CITY_PAGES.karachi.title,
  description: CITY_PAGES.karachi.description,
  path: "/karachi",
});

export default function KarachiPage() {
  return <CityPage city="karachi" />;
}
