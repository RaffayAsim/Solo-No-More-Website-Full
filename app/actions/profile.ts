"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import { revalidatePath } from "next/cache";
import { checkProfileCompleteness } from "@/lib/profile-completeness";

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  bio?: string;
  social_link?: string;
  city?: string;
  avatar_icon?: string;
  avatar_url?: string;
  photo_url?: string;
  cnic?: string;
  address?: string;
  gender?: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_name?: string;
  emergency_phone?: string;
  instagram_username?: string;
  instagram?: string;
  cnic_picture_url?: string;
  vibe_tags?: string[];
  interests?: string[];
  is_active_seeker?: boolean;
}

export type UpdateProfileResult =
  | { success: true; isComplete: boolean; missingCount: number }
  | { success: false; error: string };

export async function updateProfileAction(
  data: UpdateProfileInput
): Promise<UpdateProfileResult> {
  const auth = await getSessionUserSecurely();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  const fName = data.firstName || data.first_name;
  const lName = data.lastName || data.last_name;
  const computedFullName =
    fName || lName
      ? `${fName || ""} ${lName || ""}`.trim()
      : data.full_name?.trim();

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (computedFullName !== undefined) updatePayload.full_name = computedFullName;
  if (fName !== undefined) updatePayload.first_name = fName.trim();
  if (lName !== undefined) updatePayload.last_name = lName.trim();
  if (data.phone !== undefined) updatePayload.phone = data.phone.trim();
  if (data.bio !== undefined) updatePayload.bio = data.bio.trim();
  if (data.social_link !== undefined) updatePayload.social_link = data.social_link.trim();
  if (data.city !== undefined) updatePayload.city = data.city.trim();
  if (data.avatar_icon !== undefined) updatePayload.avatar_icon = data.avatar_icon;
  if (data.avatar_url !== undefined) updatePayload.avatar_url = data.avatar_url;
  if (data.photo_url !== undefined) updatePayload.photo_url = data.photo_url;
  if (data.cnic !== undefined) updatePayload.cnic = data.cnic.trim();
  if (data.address !== undefined) updatePayload.address = data.address.trim();
  if (data.gender !== undefined) updatePayload.gender = data.gender.trim();
  if (data.date_of_birth !== undefined) updatePayload.date_of_birth = data.date_of_birth.trim();
  
  const emergencyName = data.emergency_contact_name || data.emergency_name;
  if (emergencyName !== undefined) {
    updatePayload.emergency_contact_name = emergencyName.trim();
  }

  const emergencyPhone = data.emergency_contact_phone || data.emergency_phone;
  if (emergencyPhone !== undefined) {
    updatePayload.emergency_contact_phone = emergencyPhone.trim();
  }

  const insta = data.instagram_username || data.instagram;
  if (insta !== undefined) {
    updatePayload.instagram_username = insta.trim();
  }

  if (data.cnic_picture_url !== undefined) updatePayload.cnic_picture_url = data.cnic_picture_url;
  
  const vibes = data.vibe_tags || data.interests;
  if (vibes !== undefined) updatePayload.vibe_tags = vibes;

  if (data.is_active_seeker !== undefined) {
    updatePayload.is_active_seeker = data.is_active_seeker;
    updatePayload.seeker_updated_at = new Date().toISOString();
  }

  // Fetch current profile to calculate full completeness merge
  const { data: currentProfile } = await (supabaseAdmin.from("profiles") as any)
    .select("*")
    .eq("id", auth.userId)
    .maybeSingle();

  const mergedProfile = {
    ...(currentProfile || {}),
    ...updatePayload,
  };

  const completeness = checkProfileCompleteness(mergedProfile);
  updatePayload.is_profile_complete = completeness.isComplete;

  // Update profiles table
  const { error: profileError } = await (supabaseAdmin.from("profiles") as any)
    .update(updatePayload)
    .eq("id", auth.userId);

  if (profileError) {
    console.error("[updateProfileAction] Error:", profileError);
    return { success: false, error: profileError.message };
  }

  // Persist extended verification fields in auth user metadata
  try {
    await supabaseAdmin.auth.admin.updateUserById(auth.userId, {
      user_metadata: {
        first_name: fName,
        last_name: lName,
        full_name: computedFullName,
        phone: data.phone,
        cnic: data.cnic,
        address: data.address,
        gender: data.gender,
        date_of_birth: data.date_of_birth,
        emergency_contact_name: emergencyName,
        emergency_contact_phone: emergencyPhone,
        instagram_username: insta,
        cnic_picture_url: data.cnic_picture_url,
        avatar_url: data.avatar_url || data.photo_url,
        bio: data.bio,
        is_profile_complete: completeness.isComplete,
      },
    });
  } catch (authMetaErr) {
    console.warn("[updateProfileAction] Metadata update warning:", authMetaErr);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/profile/${auth.userId}`);
  return {
    success: true,
    isComplete: completeness.isComplete,
    missingCount: completeness.missingFields.length,
  };
}
