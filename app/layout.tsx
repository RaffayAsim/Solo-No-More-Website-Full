import type { Metadata } from "next";
import { Press_Start_2P, VT323, IBM_Plex_Mono, Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";
import "./skin-party.css";

// ── Party Skin Fonts (default) ───────────────────────────────────────────────
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
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
  title: "Solo-No-More — Find Your People IRL in Karachi",
  description:
    "Never go out alone again. Join squads for padel, chai runs, gigs and rooftop hangs across Karachi — or host your own in seconds.",
};

// Applies the saved skin before first paint so there's no flash of the wrong theme.
const skinBootScript = `
  try {
    var s = localStorage.getItem('snm-skin');
    if (s === 'partiful' || s === 'light' || s === 'dark') {
      document.documentElement.setAttribute('data-theme', s);
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
      className={`${bricolage.variable} ${dmSans.variable} ${pressStart2P.variable} ${vt323.variable} ${ibmPlexMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: skinBootScript }} />
      </head>
      <body className="min-h-full font-mono antialiased transition-colors duration-300" suppressHydrationWarning>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('PWA Service Worker registered:', reg.scope);
                  }).catch(function(err) {
                    console.log('PWA Service Worker registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
