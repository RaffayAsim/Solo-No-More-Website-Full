"use server";

import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdminStatus } from "@/app/actions/admin";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { UnifiedUserRecord } from "@/app/admin/users/UserVettingClient";

const DATA_DIR = path.join(process.cwd(), "data");
const GUEST_FILE = path.join(DATA_DIR, "guest_users.json");

const INITIAL_GUESTS: UnifiedUserRecord[] = [
  {
    id: "guest-101",
    source: "profile",
    fullName: "Hamza Farooq",
    firstName: "Hamza",
    lastName: "Farooq",
    displayName: "Hamza Farooq",
    username: "HamzaExplorer",
    email: "hamza.explorer@gmail.com",
    phone: "0300 1234567",
    role: "guest",
    status: "approved",
    subscriptionTier: "guest",
    registeredDate: "6/1/2026",
    createdAtIso: "2026-06-01T12:00:00Z",
    city: "Karachi",
    address: "DHA Phase 6, Karachi",
    cnic: "42201-1122334-5",
    bio: "Exploring Karachi social scene on Free Trial",
    profilePictureUrl: "",
    cnicPictureUrl: "",
    instagramScreenshots: [],
    instagram: "instagram.com/hamza.explorer",
    packageSelected: "Explorer (Free Trial)",
  },
  {
    id: "guest-102",
    source: "profile",
    fullName: "Sara Ahmed",
    firstName: "Sara",
    lastName: "Ahmed",
    displayName: "Sara Ahmed",
    username: "SaraExplorer",
    email: "sara.ahmed@yahoo.com",
    phone: "0321 9876543",
    role: "guest",
    status: "approved",
    subscriptionTier: "guest",
    registeredDate: "6/2/2026",
    createdAtIso: "2026-06-02T15:30:00Z",
    city: "Karachi",
    address: "Clifton Block 2, Karachi",
    cnic: "42101-5566778-9",
    bio: "Attending open music events and art walks",
    profilePictureUrl: "",
    cnicPictureUrl: "",
    instagramScreenshots: [],
    instagram: "instagram.com/sara.ahmed",
    packageSelected: "Explorer (Free Trial)",
  },
  {
    id: "guest-103",
    source: "profile",
    fullName: "Bilal Tariq",
    firstName: "Bilal",
    lastName: "Tariq",
    displayName: "Bilal Tariq",
    username: "BilalExplorer",
    email: "bilal.tariq99@gmail.com",
    phone: "0333 4455667",
    role: "guest",
    status: "approved",
    subscriptionTier: "guest",
    registeredDate: "6/4/2026",
    createdAtIso: "2026-06-04T10:15:00Z",
    city: "Karachi",
    address: "Gulshan-e-Iqbal Block 5, Karachi",
    cnic: "42301-7788990-1",
    bio: "Solo explorer looking for open workshops and concerts",
    profilePictureUrl: "",
    cnicPictureUrl: "",
    instagramScreenshots: [],
    instagram: "instagram.com/bilal.explorer",
    packageSelected: "Explorer (Free Trial)",
  },
];

function readLocalGuests(): UnifiedUserRecord[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(GUEST_FILE)) {
      fs.writeFileSync(GUEST_FILE, JSON.stringify(INITIAL_GUESTS, null, 2), "utf-8");
      return INITIAL_GUESTS;
    }
    const data = fs.readFileSync(GUEST_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : INITIAL_GUESTS;
  } catch (err) {
    console.error("Error reading local guest users:", err);
    return INITIAL_GUESTS;
  }
}

function writeLocalGuests(guests: UnifiedUserRecord[]): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(GUEST_FILE, JSON.stringify(guests, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing local guest users:", err);
    return false;
  }
}

export async function getAllGuestUsersAction(): Promise<UnifiedUserRecord[]> {
  try {
    const localGuests = readLocalGuests();
    // Also fetch any guest-tier profiles from Supabase if available
    try {
      const { data: dbGuests } = await (supabaseAdmin.from("profiles") as any)
        .select("*")
        .or("subscription_tier.eq.guest,subscription_tier.eq.free,subscription_tier.ilike.%guest%");

      if (dbGuests && dbGuests.length > 0) {
        const localEmails = new Set(localGuests.map((g) => g.email.toLowerCase()));
        for (const p of dbGuests) {
          const email = p.email || `${p.id}@guest.solonomore.com`;
          if (!localEmails.has(email.toLowerCase())) {
            const rawName = p.full_name || "Guest User";
            const parts = rawName.split(" ");
            localGuests.push({
              id: p.id,
              source: "profile",
              fullName: rawName,
              firstName: parts[0] || "",
              lastName: parts.slice(1).join(" ") || "",
              displayName: rawName,
              username: (p.username || email.split("@")[0] || "guest").replace(/^@/, ""),
              email,
              phone: p.phone || "N/A",
              role: "guest",
              status: p.account_status === "suspended" ? "suspended" : "approved",
              subscriptionTier: "guest",
              registeredDate: new Date(p.created_at || Date.now()).toLocaleDateString("en-US"),
              createdAtIso: p.created_at || new Date().toISOString(),
              city: p.city || "Karachi",
              address: p.city ? `DHA, ${p.city}` : "Karachi, Pakistan",
              cnic: "N/A",
              bio: p.bio || "Explorer on Free Trial",
              profilePictureUrl: p.avatar_icon || "",
              cnicPictureUrl: "",
              instagramScreenshots: [],
              instagram: p.social_link || "",
              packageSelected: "Explorer (Free Trial)",
            });
          }
        }
      }
    } catch {}

    return localGuests;
  } catch (err) {
    console.error("Failed to get guest users:", err);
    return INITIAL_GUESTS;
  }
}

export async function updateGuestUserStatusAction(
  guestId: string,
  newStatus: "approved" | "pending" | "payment_pending" | "suspended" | "rejected"
) {
  try {
    await verifyAdminStatus();
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const list = readLocalGuests();
  const idx = list.findIndex((g) => g.id === guestId);
  if (idx !== -1) {
    list[idx].status = newStatus;
    writeLocalGuests(list);
  }

  // Also try DB update if applicable
  try {
    await (supabaseAdmin.from("profiles") as any)
      .update({ account_status: newStatus })
      .eq("id", guestId);
  } catch {}

  revalidatePath("/admin/guests");
  return { success: true };
}

export async function saveGuestUserDetailsAction(input: {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  username: string;
  email: string;
  phone?: string;
  city?: string;
  status: "approved" | "pending" | "payment_pending" | "suspended" | "rejected";
  bio?: string;
}) {
  try {
    await verifyAdminStatus();
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const list = readLocalGuests();
  const idx = list.findIndex((g) => g.id === input.id);
  const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`.trim() || input.displayName;

  if (idx !== -1) {
    list[idx] = {
      ...list[idx],
      fullName,
      firstName: input.firstName,
      lastName: input.lastName,
      displayName: input.displayName || fullName,
      username: input.username.replace(/^@/, ""),
      email: input.email,
      phone: input.phone || list[idx].phone,
      city: input.city || list[idx].city,
      status: input.status,
      bio: input.bio || list[idx].bio,
    };
    writeLocalGuests(list);
  }

  revalidatePath("/admin/guests");
  return { success: true };
}

export async function deleteGuestUserAction(guestId: string) {
  try {
    await verifyAdminStatus();
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const list = readLocalGuests();
  const filtered = list.filter((g) => g.id !== guestId);
  writeLocalGuests(filtered);

  revalidatePath("/admin/guests");
  return { success: true };
}
