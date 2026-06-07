import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Solo No More",
    short_name: "SoloNoMore",
    description: "Find Your Vibe IRL - Genuine real-world connections and coordination.",
    start_url: "/",
    id: "/",
    scope: "/",
    lang: "en",
    dir: "ltr",
    display: "standalone",
    background_color: "#0d0e12",
    theme_color: "#7c3aed",
    orientation: "portrait-primary",
    categories: ["social", "lifestyle"],
    prefer_related_applications: false,
    related_applications: [],
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    screenshots: [
      {
        src: "/screenshot-mobile.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
        label: "Solo No More - Mobile Dashboard",
      },
      {
        src: "/screenshot-desktop.png",
        sizes: "1920x1080",
        type: "image/png",
        form_factor: "wide",
        label: "Solo No More - Desktop App",
      },
    ],
    shortcuts: [
      {
        name: "Explore Beacons",
        short_name: "Beacons",
        url: "/dashboard",
        description: "Find active beacons and squads near you",
        icons: [{ src: "/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "My Profile",
        short_name: "Profile",
        url: "/profile/me",
        description: "View and edit your profile card",
        icons: [{ src: "/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  };
}
