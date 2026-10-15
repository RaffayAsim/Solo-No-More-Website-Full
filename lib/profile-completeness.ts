/**
 * Profile Completeness & Mandatory Verification Logic (Extracted from QHQ Architecture).
 * Enforces that all members and guests must provide verified safety & identity details
 * before participating in Beacons (hosting/joining) or Events.
 */

export interface MissingField {
  key: string;
  label: string;
  category: "personal" | "safety" | "vibe";
  hint: string;
}

export interface ProfileCompletenessResult {
  isComplete: boolean;
  missingFields: MissingField[];
  completionPercentage: number;
  filledCount: number;
  totalCount: number;
}

export const MANDATORY_PROFILE_FIELDS: MissingField[] = [
  {
    key: "full_name",
    label: "Full Name",
    category: "personal",
    hint: "Your legal full name for door check-in & verification",
  },
  {
    key: "phone",
    label: "Phone Number",
    category: "personal",
    hint: "Reachable mobile / WhatsApp contact",
  },
  {
    key: "city",
    label: "City",
    category: "personal",
    hint: "City where you are active (Karachi, Lahore, Islamabad)",
  },
  {
    key: "gender",
    label: "Gender",
    category: "personal",
    hint: "Male, Female, or Non-Binary",
  },
  {
    key: "date_of_birth",
    label: "Date of Birth",
    category: "personal",
    hint: "18+ age verification for night experiences",
  },
  {
    key: "cnic",
    label: "CNIC / National ID",
    category: "safety",
    hint: "13-digit identity number (e.g. 42101-1234567-1)",
  },
  {
    key: "emergency_contact_name",
    label: "Emergency Contact Name",
    category: "safety",
    hint: "Name of parent, spouse, or trusted family/friend",
  },
  {
    key: "emergency_contact_phone",
    label: "Emergency Contact Phone",
    category: "safety",
    hint: "Direct reachable emergency phone line",
  },
  {
    key: "instagram_username",
    label: "Instagram Username",
    category: "safety",
    hint: "Social profile handle for community safety vetting",
  },
  {
    key: "vibe_tags",
    label: "Vibes & Interests",
    category: "vibe",
    hint: "Select at least 1 music, social, or nightlife vibe",
  },
  {
    key: "avatar_url",
    label: "Profile Headshot",
    category: "vibe",
    hint: "A clear real photo for door verification & squad recognition",
  },
];

export function checkProfileCompleteness(profile: Record<string, any> | null | undefined): ProfileCompletenessResult {
  if (!profile) {
    return {
      isComplete: false,
      missingFields: MANDATORY_PROFILE_FIELDS,
      completionPercentage: 0,
      filledCount: 0,
      totalCount: MANDATORY_PROFILE_FIELDS.length,
    };
  }

  const missingFields: MissingField[] = [];
  let filledCount = 0;

  for (const field of MANDATORY_PROFILE_FIELDS) {
    let hasValue = false;

    if (field.key === "full_name") {
      const val = profile.full_name || (profile.first_name && profile.last_name ? `${profile.first_name} ${profile.last_name}` : null);
      hasValue = typeof val === "string" && val.trim().length >= 3;
    } else if (field.key === "phone") {
      const val = profile.phone;
      hasValue = typeof val === "string" && val.trim().length >= 7;
    } else if (field.key === "city") {
      const val = profile.city;
      hasValue = typeof val === "string" && val.trim().length > 0;
    } else if (field.key === "gender") {
      const val = profile.gender;
      hasValue = typeof val === "string" && val.trim().length > 0;
    } else if (field.key === "date_of_birth") {
      const val = profile.date_of_birth;
      hasValue = typeof val === "string" && val.trim().length >= 4;
    } else if (field.key === "cnic") {
      const val = profile.cnic;
      hasValue = typeof val === "string" && val.trim().length >= 8;
    } else if (field.key === "emergency_contact_name") {
      const val = profile.emergency_contact_name || profile.emergency_name;
      hasValue = typeof val === "string" && val.trim().length >= 2;
    } else if (field.key === "emergency_contact_phone") {
      const val = profile.emergency_contact_phone || profile.emergency_phone;
      hasValue = typeof val === "string" && val.trim().length >= 7;
    } else if (field.key === "instagram_username") {
      const val = profile.instagram_username || profile.instagram || profile.social_link;
      hasValue = typeof val === "string" && val.trim().length >= 2;
    } else if (field.key === "vibe_tags") {
      const val = profile.vibe_tags || profile.interests;
      hasValue = Array.isArray(val) && val.length > 0;
    } else if (field.key === "avatar_url") {
      const val = profile.avatar_url || profile.photo_url || profile.avatar_icon;
      hasValue = typeof val === "string" && val.trim().length > 0;
    }

    if (hasValue) {
      filledCount++;
    } else {
      missingFields.push(field);
    }
  }

  const totalCount = MANDATORY_PROFILE_FIELDS.length;
  const completionPercentage = Math.round((filledCount / totalCount) * 100);

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    completionPercentage,
    filledCount,
    totalCount,
  };
}
