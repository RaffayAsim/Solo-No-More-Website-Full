import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Read .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [k, ...v] = trimmed.split("=");
    const key = k.trim();
    const val = v.join("=").trim().replace(/^["']|["']$/g, "");
    if (key === "NEXT_PUBLIC_SUPABASE_URL") supabaseUrl = val;
    if (key === "SUPABASE_SERVICE_ROLE_KEY") serviceRoleKey = val;
  }
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ACCOUNTS = [
  {
    roleName: "Admin Profile",
    email: "admin@solonomore.com",
    password: "Admin@SoloNoMore2026!#",
    profile: {
      full_name: "Admin Commander",
      bio: "Platform Operations, Vetting Lead & Security Administrator.",
      social_link: "https://instagram.com/solonomore.admin",
      city: "Karachi",
      avatar_icon: "⚡",
      subscription_tier: "admin",
      account_status: "approved",
      is_partner: false,
      business_name: null,
      vibe_tags: ["Admin", "Security", "Karachi Operations"],
      is_active_seeker: false,
    },
  },
  {
    roleName: "Member Profile",
    email: "member@solonomore.com",
    password: "Member@SoloVibe2026!#",
    profile: {
      full_name: "Zainab Ahmed",
      bio: "Padel fanatic, weekend chai explorer & social foodie in Karachi.",
      social_link: "https://instagram.com/zainab.vibe",
      city: "Karachi",
      avatar_icon: "🔥",
      subscription_tier: "member",
      account_status: "approved",
      is_partner: false,
      business_name: null,
      vibe_tags: ["Padel", "Chai Runs", "Electronic Music"],
      is_active_seeker: true,
    },
  },
  {
    roleName: "Artist Partner Profile",
    email: "artist@solonomore.com",
    password: "Artist@RaveTrack2026!#",
    profile: {
      full_name: "Bilal K. (DJ Synapse)",
      bio: "Resident Touring DJ & Underground Techno Producer across Karachi circuits.",
      social_link: "https://instagram.com/djsynapse.live",
      city: "Karachi",
      avatar_icon: "🎧",
      subscription_tier: "member",
      account_status: "approved",
      is_partner: true,
      business_name: "DJ Synapse Music",
      vibe_tags: ["DJ Sessions", "Live Sets", "Secret Raves"],
      is_active_seeker: false,
    },
  },
  {
    roleName: "Business Partner Profile",
    email: "partner@solonomore.com",
    password: "Partner@KarachiVenue2026!#",
    profile: {
      full_name: "Farhan Malik (Arena Padel)",
      bio: "Premier indoor padel club, artisanal cafe & community tournament arena in DHA Phase 6.",
      social_link: "https://instagram.com/arenapadel.khi",
      city: "Karachi",
      avatar_icon: "🏟️",
      subscription_tier: "member",
      account_status: "approved",
      is_partner: true,
      business_name: "Arena Padel & Social Club",
      vibe_tags: ["Padel", "Cafe", "Tournament Lounge"],
      is_active_seeker: false,
    },
  },
];

async function seedProfiles() {
  console.log("==> Creating & syncing requested test profiles in Supabase...");

  // 1. Fetch existing auth users to avoid duplicates
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    console.error("Error listing users:", listError);
    process.exit(1);
  }

  const existingUsers = usersData?.users || [];

  for (const item of ACCOUNTS) {
    let userId = null;
    const existing = existingUsers.find((u) => u.email?.toLowerCase() === item.email.toLowerCase());

    if (existing) {
      console.log(`[FOUND] ${item.roleName} (${item.email}) - updating credentials...`);
      userId = existing.id;
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: item.password,
        email_confirm: true,
        user_metadata: {
          full_name: item.profile.full_name,
          city: item.profile.city,
          is_partner: item.profile.is_partner,
          business_name: item.profile.business_name,
        },
      });
      if (updateError) console.error(`Error updating auth user ${item.email}:`, updateError);
    } else {
      console.log(`[CREATING] ${item.roleName} (${item.email})...`);
      const { data: newAuth, error: createError } = await supabase.auth.admin.createUser({
        email: item.email,
        password: item.password,
        email_confirm: true,
        user_metadata: {
          full_name: item.profile.full_name,
          city: item.profile.city,
          is_partner: item.profile.is_partner,
          business_name: item.profile.business_name,
        },
      });

      if (createError) {
        console.error(`Error creating auth user ${item.email}:`, createError);
        continue;
      }
      userId = newAuth.user.id;
    }

    if (!userId) continue;

    // Upsert Profile row
    const profilePayload = {
      id: userId,
      ...item.profile,
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" });

    if (profileError) {
      console.error(`Error upserting profile for ${item.email}:`, profileError);
    } else {
      console.log(`[SUCCESS] Profile verified for ${item.roleName} (${item.email})`);
    }
  }

  console.log("\n==> All 4 profiles created successfully!");
}

seedProfiles();
