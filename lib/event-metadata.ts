export interface EventTierPackage {
  id: string;
  name: string;
  price: number;
  spots?: number;
  perks?: string;
}

export interface EventOrganizerInfo {
  name: string;
  tagline: string;
  avatarUrl: string;
}

export interface EventPerformerLineup {
  name: string;
  role: string;
  time: string;
  imageUrl?: string;
}

export interface EventRichMetadata {
  status: "published" | "draft" | "pending_review";
  full_address?: string;
  start_time?: string;
  end_time?: string;
  tier_packages?: EventTierPackage[];
  partner_id?: string;
  partner_name?: string;
  feature_image?: string;
  slider_images?: string[];
  attending_label?: string;
  visibility?: "members_only" | "public" | "invite_only";
  audience?: "all" | "females_only" | "couples" | "vip_members";
  publish_date?: string;
  organizer?: EventOrganizerInfo;
  important_info?: string[];
  lineups?: EventPerformerLineup[];
  creator_type?: "admin" | "artist" | "partner";
  creator_id?: string;
  creator_name?: string;
  verification_notes?: string;
  event_category?: "open_event" | "community_event";
  is_members_only?: boolean;
  access_type?: string;
}

const METADATA_PREFIX = "<!--SNM_EVENT_META_V1-->";

/**
 * Serializes user description text and rich metadata safely into the database text description field.
 */
export function serializeEventDescription(
  cleanDescription: string,
  metadata: EventRichMetadata
): string {
  const metaJson = JSON.stringify(metadata);
  const clean = (cleanDescription || "").trim();
  return `${clean}\n\n${METADATA_PREFIX}${metaJson}`;
}

/**
 * Parses the raw description from the database and returns the clean text and all rich metadata.
 */
export function parseEventDescription(rawDescription: string | null | undefined): {
  cleanDescription: string;
  metadata: EventRichMetadata;
} {
  const defaultMeta: EventRichMetadata = {
    status: "published",
    full_address: "",
    start_time: "20:00",
    end_time: "23:30",
    tier_packages: [
      { id: "tier-1", name: "General Admission", price: 2500, spots: 100 }
    ],
    partner_id: "",
    partner_name: "No partner",
    feature_image: "",
    slider_images: [],
    attending_label: "253 people attending",
    visibility: "members_only",
    audience: "all",
    publish_date: "",
    organizer: {
      name: "BnC Offline",
      tagline: "Redefining music culture in social spaces 🎧",
      avatarUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80",
    },
    important_info: [
      "Strictly 18+ only with physical CNIC required at check-in",
      "No outside food, beverages or glassware permitted inside venue",
      "Dress Code: Smart Casual & Chic — vibe check strictly observed",
    ],
    lineups: [
      { name: "DJ Neon Vibe", role: "Deep House / Melodic Techno", time: "10:00 PM - 12:00 AM" }
    ],
    creator_type: "admin",
  };

  if (!rawDescription) {
    return { cleanDescription: "", metadata: defaultMeta };
  }

  const metaIdx = rawDescription.indexOf(METADATA_PREFIX);
  if (metaIdx === -1) {
    return { cleanDescription: rawDescription.trim(), metadata: defaultMeta };
  }

  const cleanDescription = rawDescription.slice(0, metaIdx).trim();
  const jsonStr = rawDescription.slice(metaIdx + METADATA_PREFIX.length).trim();

  try {
    const parsed = JSON.parse(jsonStr) as Partial<EventRichMetadata>;
    return {
      cleanDescription,
      metadata: {
        ...defaultMeta,
        ...parsed,
        organizer:
          parsed.organizer === null || ("organizer" in parsed && !parsed.organizer?.name?.trim())
            ? undefined
            : parsed.organizer && parsed.organizer.name?.trim()
            ? {
                name: parsed.organizer.name.trim(),
                tagline: parsed.organizer.tagline || "",
                avatarUrl: parsed.organizer.avatarUrl || "",
              }
            : defaultMeta.organizer,
        tier_packages: parsed.tier_packages && parsed.tier_packages.length > 0
          ? parsed.tier_packages
          : defaultMeta.tier_packages,
        important_info: parsed.important_info && parsed.important_info.length > 0
          ? parsed.important_info
          : defaultMeta.important_info,
        lineups: parsed.lineups && parsed.lineups.length > 0
          ? parsed.lineups
          : defaultMeta.lineups,
      },
    };
  } catch {
    return { cleanDescription, metadata: defaultMeta };
  }
}

/**
 * Checks whether an event date/time has already passed.
 */
export function isEventConcluded(scheduledAt: string): boolean {
  if (!scheduledAt) return false;
  return new Date(scheduledAt).getTime() < Date.now();
}
