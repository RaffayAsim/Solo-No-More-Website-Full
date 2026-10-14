/**
 * Location autocomplete & Places lookup for Solo-No-More Beacons
 * Pre-seeded with popular social hotspots for Karachi, Lahore, and Islamabad,
 * plus optional live geocoding fallback for any custom address.
 */

export interface PlaceSuggestion {
  id: string;
  name: string;
  area: string;
  city: string;
  mapsUrl: string;
  address?: string;
}

export const POPULAR_HOTSPOTS: PlaceSuggestion[] = [
  // ─── KARACHI ───
  {
    id: "khi-espresso-dha6",
    name: "Espresso DHA Phase 6",
    area: "Khayaban-e-Shahbaz, DHA Phase 6",
    city: "Karachi",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Espresso+DHA+Phase+6+Karachi",
  },
  {
    id: "khi-espresso-tipu",
    name: "Espresso Tipu Sultan",
    area: "Tipu Sultan Road, PECHS",
    city: "Karachi",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Espresso+Tipu+Sultan+Karachi",
  },
  {
    id: "khi-butlers-zamzama",
    name: "Butler's Chocolate Cafe",
    area: "Zamzama Boulevard, DHA Phase 5",
    city: "Karachi",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Butlers+Chocolate+Cafe+Zamzama+Karachi",
  },
  {
    id: "khi-gloria-dha",
    name: "Gloria Jean's Coffees",
    area: "Khayaban-e-Shahbaz, DHA Phase 6",
    city: "Karachi",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Gloria+Jeans+Shahbaz+DHA+Karachi",
  },
  {
    id: "khi-coffee-wagera-clifton",
    name: "Coffee Wagera",
    area: "Block 4, Clifton",
    city: "Karachi",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Coffee+Wagera+Clifton+Karachi",
  },
  {
    id: "khi-floc-zamzama",
    name: "FLOC (For the Love of Coffee)",
    area: "Zamzama Commercial, DHA Phase 5",
    city: "Karachi",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=FLOC+Zamzama+Karachi",
  },
  {
    id: "khi-dolmen-clifton",
    name: "Dolmen Mall Clifton",
    area: "Marine Drive, Block 4, Clifton",
    city: "Karachi",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Dolmen+Mall+Clifton+Karachi",
  },
  {
    id: "khi-lucky-one",
    name: "Lucky One Mall",
    area: "Rashid Minhas Road, Federal B Area",
    city: "Karachi",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Lucky+One+Mall+Karachi",
  },
  {
    id: "khi-sunset-club",
    name: "Sunset Club",
    area: "Khayaban-e-Jabal, DHA Phase 2",
    city: "Karachi",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Sunset+Club+DHA+Phase+2+Karachi",
  },
  {
    id: "khi-port-grand",
    name: "Port Grand Food Village",
    area: "Native Jetty Bridge, Keamari",
    city: "Karachi",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Port+Grand+Karachi",
  },
  {
    id: "khi-mews-clifton",
    name: "Mews Cafe",
    area: "E-Street, Block 4, Clifton",
    city: "Karachi",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Mews+Cafe+E+Street+Clifton+Karachi",
  },
  {
    id: "khi-koel-clifton",
    name: "Koel Cafe",
    area: "Block 4, Clifton",
    city: "Karachi",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Koel+Cafe+Clifton+Karachi",
  },
  {
    id: "khi-chop-chop-badar",
    name: "Chop Chop Wok",
    area: "Badar Commercial, DHA Phase 5",
    city: "Karachi",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Chop+Chop+Wok+Badar+Commercial+Karachi",
  },
  {
    id: "khi-burns-road",
    name: "Burns Road Food Street",
    area: "Saddar Town",
    city: "Karachi",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Burns+Road+Food+Street+Karachi",
  },
  {
    id: "khi-seaview",
    name: "Seaview Beach / Nishat Commercial",
    area: "DHA Phase 8 / Seaview",
    city: "Karachi",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Seaview+Beach+Karachi",
  },
  {
    id: "khi-dha-golf",
    name: "DHA Country & Golf Club",
    area: "Zulfiqar Street, DHA Phase 8",
    city: "Karachi",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=DHA+Golf+Club+Karachi",
  },

  // ─── LAHORE ───
  {
    id: "lhr-mm-alam",
    name: "M.M. Alam Road",
    area: "Gulberg III",
    city: "Lahore",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=MM+Alam+Road+Gulberg+Lahore",
  },
  {
    id: "lhr-raya-fairways",
    name: "Defence Raya Fairways",
    area: "DHA Phase 6",
    city: "Lahore",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Defence+Raya+Fairways+DHA+6+Lahore",
  },
  {
    id: "lhr-packages-mall",
    name: "Packages Mall",
    area: "Walton Road",
    city: "Lahore",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Packages+Mall+Lahore",
  },
  {
    id: "lhr-emporium-mall",
    name: "Emporium Mall",
    area: "Johar Town",
    city: "Lahore",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Emporium+Mall+Lahore",
  },
  {
    id: "lhr-gloria-gulberg",
    name: "Gloria Jean's Coffees",
    area: "Kasuri Road, Gulberg III",
    city: "Lahore",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Gloria+Jeans+Kasuri+Road+Gulberg+Lahore",
  },
  {
    id: "lhr-second-cup-dha",
    name: "Second Cup Coffee",
    area: "Sector CCA, DHA Phase 5",
    city: "Lahore",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Second+Cup+DHA+Phase+5+Lahore",
  },
  {
    id: "lhr-jade-cafe",
    name: "Jade Cafe by ChinaTown",
    area: "Gulberg III",
    city: "Lahore",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Jade+Cafe+Gulberg+Lahore",
  },
  {
    id: "lhr-haveli-fort",
    name: "Haveli Restaurant",
    area: "Fort Road Food Street, Old City",
    city: "Lahore",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Haveli+Restaurant+Fort+Road+Lahore",
  },
  {
    id: "lhr-mall-one",
    name: "Mall 1",
    area: "Main Boulevard, Gulberg III",
    city: "Lahore",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Mall+1+Main+Boulevard+Gulberg+Lahore",
  },
  {
    id: "lhr-y-block-dha",
    name: "Y-Block Market",
    area: "DHA Phase 3",
    city: "Lahore",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Y+Block+DHA+Phase+3+Lahore",
  },

  // ─── ISLAMABAD ───
  {
    id: "isb-secret-sky",
    name: "Secret Sky Cafe",
    area: "F-7 Markaz",
    city: "Islamabad",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Secret+Sky+Cafe+F-7+Islamabad",
  },
  {
    id: "isb-beverly-centre",
    name: "Beverly Centre",
    area: "Nazim-ud-din Road, Blue Area, F-6/1",
    city: "Islamabad",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Beverly+Centre+Blue+Area+Islamabad",
  },
  {
    id: "isb-kohsar-market",
    name: "Kohsar Market",
    area: "Sector F-6/3",
    city: "Islamabad",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Kohsar+Market+F-6+Islamabad",
  },
  {
    id: "isb-monal",
    name: "Monal Restaurant",
    area: "Pir Sohawa, Margalla Hills",
    city: "Islamabad",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Monal+Restaurant+Islamabad",
  },
  {
    id: "isb-centaurus",
    name: "The Centaurus Mall",
    area: "Jinnah Avenue, F-8",
    city: "Islamabad",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Centaurus+Mall+Islamabad",
  },
  {
    id: "isb-chaaye-khana-f6",
    name: "Chaaye Khana",
    area: "Super Market, F-6 Markaz",
    city: "Islamabad",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Chaaye+Khana+F-6+Islamabad",
  },
  {
    id: "isb-burning-brownie",
    name: "Burning Brownie",
    area: "Beverly Centre, Blue Area",
    city: "Islamabad",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Burning+Brownie+Beverly+Centre+Islamabad",
  },
  {
    id: "isb-f11-markaz",
    name: "F-11 Markaz",
    area: "Sector F-11",
    city: "Islamabad",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=F-11+Markaz+Islamabad",
  },
  {
    id: "isb-trail-5",
    name: "Margalla Hills Trail 5",
    area: "Sector E-7 / Margalla Road",
    city: "Islamabad",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Trail+5+Margalla+Hills+Islamabad",
  },
  {
    id: "isb-lake-view",
    name: "Lake View Park",
    area: "Murree Road, Rawal Lake",
    city: "Islamabad",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Lake+View+Park+Islamabad",
  },
];

/**
 * Filter popular hotspots matching a query string and optional city
 */
export function searchLocalHotspots(query: string, city?: string): PlaceSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    if (city) {
      return POPULAR_HOTSPOTS.filter((h) => h.city.toLowerCase() === city.toLowerCase()).slice(0, 6);
    }
    return POPULAR_HOTSPOTS.slice(0, 6);
  }

  const cityMatches = city
    ? POPULAR_HOTSPOTS.filter((h) => h.city.toLowerCase() === city.toLowerCase())
    : POPULAR_HOTSPOTS;

  return cityMatches
    .filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.area.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q)
    )
    .slice(0, 6);
}

/**
 * Fetch online places suggestions via Photon OpenStreetMap API
 */
export async function fetchOnlinePlaces(query: string, city?: string): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const fullSearch = city ? `${q}, ${city}, Pakistan` : `${q}, Pakistan`;
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(fullSearch)}&limit=5`,
      { signal: AbortSignal.timeout(2500) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data || !Array.isArray(data.features)) return [];

    interface PhotonFeature {
      properties?: {
        name?: string;
        street?: string;
        district?: string;
        suburb?: string;
        city?: string;
      };
      geometry?: {
        coordinates?: [number, number];
      };
    }

    return (data.features as PhotonFeature[]).map((f, idx: number) => {
      const p = f.properties || {};
      const name = p.name || p.street || q;
      const area = [p.street, p.district || p.suburb, p.city || city || "Pakistan"]
        .filter(Boolean)
        .join(", ");
      const coords = f.geometry?.coordinates; // [lon, lat]
      const mapsUrl = coords && coords.length === 2
        ? `https://www.google.com/maps?q=${coords[1]},${coords[0]}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ", " + (city || "Pakistan"))}`;

      return {
        id: `photon-${idx}-${encodeURIComponent(name)}`,
        name,
        area: area || city || "Pakistan",
        city: p.city || city || "Pakistan",
        mapsUrl,
      };
    });
  } catch {
    return [];
  }
}
