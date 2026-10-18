import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Press_Start_2P, VT323, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import "./skin-party.css";

// ── Exact Partiful Typography (Plus Jakarta Sans site-wide) ───────────────
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const plusJakartaBody = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

// ── Nokia Soul Fonts (Nokia Classic + Synthwave skins) ───────────────────────
const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-lcd",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Solo-No-More — Find Your People IRL Nationwide",
  description:
    "Never go out alone again. Join squads for padel, chai runs, gigs and rooftop hangs across cities nationwide — or host your own in seconds.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

// Locks the skin to the modern website theme ('partiful')
const skinBootScript = `
  try {
    document.documentElement.setAttribute('data-theme', 'partiful');
    localStorage.setItem('snm-skin', 'partiful');

    // Instant Web & Desktop Cache Purge
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        var hadWorker = false;
        for (var r of registrations) {
          r.unregister();
          hadWorker = true;
        }
        if (hadWorker && !sessionStorage.getItem('snm_cache_reset_v3')) {
          sessionStorage.setItem('snm_cache_reset_v3', '1');
          window.location.reload();
        }
      });
    }

    if ('caches' in window) {
      caches.keys().then(function(keys) {
        keys.forEach(function(k) { caches.delete(k); });
      });
    }
  } catch (e) {}
`;


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="partiful"
      className={`${plusJakarta.variable} ${plusJakartaBody.variable} ${pressStart2P.variable} ${vt323.variable} ${ibmPlexMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: skinBootScript }} />
      </head>
      <body className="min-h-full font-sans antialiased transition-colors duration-300" suppressHydrationWarning>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (var r of registrations) {
                      r.unregister();
                    }
                  });
                }
                if ('caches' in window) {
                  caches.keys().then(function(keys) {
                    keys.forEach(function(k) { caches.delete(k); });
                  });
                }
              } catch (e) {}
            `,
          }}
        />
      </body>
    </html>
  );
}
