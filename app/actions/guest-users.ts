"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdminStatus } from "@/app/actions/admin";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { UnifiedUserRecord } from "@/app/admin/users/UserVettingClient";

const GUEST_STATUS_MAP: Record<string, string> = {
  approved: "approved",
  pending: "pending_vetting",
  payment_pending: "pending_vetting",
  suspended: "suspended",
  rejected: "rejected",
};

export async function getAllGuestUsersAction(): Promise<UnifiedUserRecord[]> {
  try {
    await verifyAdminStatus("members.view");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return [];
  }

  try {
    // 1. Fetch live guest-tier profiles from Supabase first
    const guestList: UnifiedUserRecord[] = [];
    const seenEmails = new Set<string>();

    try {
      const { data: dbGuests } = await (supabaseAdmin.from("profiles") as any)
        .select("*")
        .or("is_guest.eq.true,subscription_tier.eq.guest,subscription_tier.eq.free,subscription_tier.eq.none")
        .order("created_at", { ascending: false });

      if (dbGuests && dbGuests.length > 0) {
        for (const p of dbGuests) {
          const email = (p.email || `${p.id}@guest.solonomore.com`).toLowerCase();
          if (!seenEmails.has(email)) {
            seenEmails.add(email);
            const rawName = p.full_name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Guest Explorer";
            const parts = rawName.split(" ");
            guestList.push({
              id: p.id,
              source: "profile",
              fullName: rawName,
              firstName: p.first_name || parts[0] || "",
              lastName: p.last_name || parts.slice(1).join(" ") || "",
              displayName: rawName,
              username: (p.username || p.instagram_username || email.split("@")[0] || "guest").replace(/^@/, ""),
              email: p.email || email,
              phone: p.phone || "N/A",
              role: "guest",
              status: p.account_status === "pending_vetting" ? "pending" : (p.account_status || "pending"),
              subscriptionTier: "guest",
              registeredDate: new Date(p.created_at || Date.now()).toLocaleDateString("en-US"),
              createdAtIso: p.created_at || new Date().toISOString(),
              city: p.city || "Karachi",
              address: p.city ? `DHA, ${p.city}` : "Karachi, Pakistan",
              cnic: p.cnic || "N/A",
              bio: p.bio || "Explorer on Free Trial",
              profilePictureUrl: p.avatar_icon || p.photo_url || "",
              cnicPictureUrl: p.cnic_picture_url || "",
              instagramScreenshots: [],
              instagram: p.social_link || p.instagram_username || "",
              packageSelected: "Explorer (Free Trial)",
            });
          }
        }
      }
    } catch (dbErr) {
      console.warn("[getAllGuestUsersAction] Supabase query warning:", dbErr);
    }

    return guestList;
  } catch (err) {
    console.error("Failed to get guest users:", err);
    return [];
  }
}

export async function updateGuestUserStatusAction(
  guestId: string,
  newStatus: "approved" | "pending" | "payment_pending" | "suspended" | "rejected"
) {
  try {
    await verifyAdminStatus("members.manage");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  // 1. Update in Supabase Database
  try {
    await (supabaseAdmin.from("profiles") as any)
      .update({ account_status: GUEST_STATUS_MAP[newStatus] || "pending_vetting", updated_at: new Date().toISOString() })
      .eq("id", guestId);
  } catch (dbErr) {
    console.warn("[updateGuestUserStatusAction] Supabase update warning:", dbErr);
  }

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
    await verifyAdminStatus("members.manage");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`.trim() || input.displayName;

  // 1. Update in Supabase
  try {
    await (supabaseAdmin.from("profiles") as any)
      .update({
        full_name: fullName,
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim(),
        phone: input.phone || null,
        city: input.city || "Karachi",
        account_status: GUEST_STATUS_MAP[input.status] || "pending_vetting",
        bio: input.bio || null,
        instagram_username: input.username.replace(/^@/, ""),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id);
  } catch (dbErr) {
    console.warn("[saveGuestUserDetailsAction] Supabase update warning:", dbErr);
  }

  revalidatePath("/admin/guests");
  return { success: true };
}

export async function deleteGuestUserAction(guestId: string) {
  try {
    await verifyAdminStatus("members.manage");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  // 1. Soft-delete or suspend in Supabase
  try {
    await (supabaseAdmin.from("profiles") as any)
      .update({ account_status: "suspended", updated_at: new Date().toISOString() })
      .eq("id", guestId);
  } catch (dbErr) {
    console.warn("[deleteGuestUserAction] Supabase error:", dbErr);
  }

  revalidatePath("/admin/guests");
  return { success: true };
}
