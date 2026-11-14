import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private screens and personal pages stay out of search results.
        disallow: [
          "/dashboard",
          "/admin",
          "/admin-login",
          "/api/",
          "/pay/",
          "/create-credentials",
          "/login",
          "/beacon/",
          "/b/",
          "/e/",
          "/preview-landing",
          "/join",
          "/waitlist",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
