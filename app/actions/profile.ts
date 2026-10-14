"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import { revalidatePath } from "next/cache";

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  full_name?: string;
  phone?: string;
  bio?: string;
  social_link?: string;
  city?: string;
  avatar_icon?: string;
  avatar_url?: string;
  cnic?: string;
  address?: string;
  gender?: string;
  cnic_picture_url?: string;
  vibe_tags?: string[];
  is_active_seeker?: boolean;
}

export type UpdateProfileResult =
  | { success: true }
  | { success: false; error: string };

export async function updateProfileAction(
  data: UpdateProfileInput
): Promise<UpdateProfileResult> {
  const auth = await getSessionUserSecurely();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  const computedFullName =
    data.firstName || data.lastName
      ? `${data.firstName || ""} ${data.lastName || ""}`.trim()
      : data.full_name?.trim();

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (computedFullName !== undefined) updatePayload.full_name = computedFullName;
  if (data.phone !== undefined) updatePayload.phone = data.phone.trim();
  if (data.bio !== undefined) updatePayload.bio = data.bio.trim();
  if (data.social_link !== undefined) updatePayload.social_link = data.social_link.trim();
  if (data.city !== undefined) updatePayload.city = data.city.trim();
  if (data.avatar_icon !== undefined) updatePayload.avatar_icon = data.avatar_icon;
  if (data.vibe_tags !== undefined) updatePayload.vibe_tags = data.vibe_tags;
  if (data.is_active_seeker !== undefined) {
    updatePayload.is_active_seeker = data.is_active_seeker;
    updatePayload.seeker_updated_at = new Date().toISOString();
  }

  // Update profiles table
  const { error: profileError } = await (supabaseAdmin.from("profiles") as any)
    .update(updatePayload)
    .eq("id", auth.userId);

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  // Persist extended verification fields in auth user metadata
  try {
    await supabaseAdmin.auth.admin.updateUserById(auth.userId, {
      user_metadata: {
        first_name: data.firstName,
        last_name: data.lastName,
        full_name: computedFullName,
        phone: data.phone,
        cnic: data.cnic,
        address: data.address,
        gender: data.gender,
        cnic_picture_url: data.cnic_picture_url,
        avatar_url: data.avatar_url,
        bio: data.bio,
      },
    });
  } catch {}

  revalidatePath("/dashboard");
  revalidatePath(`/profile/${auth.userId}`);
  return { success: true };
}
