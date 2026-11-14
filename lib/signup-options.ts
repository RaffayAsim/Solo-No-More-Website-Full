/**
 * Option lists shared by the public signup form (/apply) and the admin user screens,
 * so an admin always sees and edits the same choices the applicant picked from.
 */
export const SIGNUP_CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Other"] as const;

export const SIGNUP_GENDERS = ["Male", "Female", "Non-Binary", "Prefer not to say"] as const;

export const SIGNUP_INTERESTS = [
  "Music",
  "Comedy",
  "Theatre",
  "Sports",
  "Food & Dining",
  "Art & Culture",
  "Nightlife",
  "Festivals",
  "Networking",
] as const;
