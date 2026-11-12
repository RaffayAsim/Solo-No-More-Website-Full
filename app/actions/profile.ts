"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import {
  MEMBER_UPLOADS_BUCKET,
  PUBLIC_MEDIA_BUCKET,
  isImageDataUrl,
  isSignedStorageUrl,
  storeImageDataUrl,
  storePublicImageDataUrl,
} from "@/lib/server/storage";
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
  instagram_screenshot_url?: string;
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
  // An unchanged private image comes back from the form as its temporary view link:
  // leave the stored value untouched in that case.
  if (isSignedStorageUrl(data.cnic_picture_url)) data = { ...data, cnic_picture_url: undefined };
  if (isSignedStorageUrl(data.instagram_screenshot_url)) data = { ...data, instagram_screenshot_url: undefined };

  // Images are written to storage; the profile row keeps a URL / storage reference.
  // (Profile photo is public; CNIC and Instagram proof are private, admin-only.)
  let userPhoto = data.photo_url || data.avatar_url;
  if (isImageDataUrl(userPhoto)) {
    userPhoto = (await storePublicImageDataUrl(PUBLIC_MEDIA_BUCKET, `avatars/${auth.userId}`, userPhoto)) || undefined;
  }
  if (userPhoto !== undefined) {
    updatePayload.photo_url = userPhoto;
  }
  if (isImageDataUrl(data.cnic_picture_url)) {
    const stored = await storeImageDataUrl(MEMBER_UPLOADS_BUCKET, `cnic/${auth.userId}`, data.cnic_picture_url);
    if (!stored) return { success: false, error: "Your CNIC photo could not be read. Please upload a JPG or PNG under 3 MB." };
    data = { ...data, cnic_picture_url: stored };
  }
  if (isImageDataUrl(data.instagram_screenshot_url)) {
    const stored = await storeImageDataUrl(MEMBER_UPLOADS_BUCKET, `instagram/${auth.userId}`, data.instagram_screenshot_url);
    if (!stored) return { success: false, error: "Your Instagram screenshot could not be read. Please upload a JPG or PNG under 3 MB." };
    data = { ...data, instagram_screenshot_url: stored };
  }
  if (isImageDataUrl(data.avatar_icon)) {
    const stored = await storePublicImageDataUrl(PUBLIC_MEDIA_BUCKET, `avatars/${auth.userId}`, data.avatar_icon);
    data = { ...data, avatar_icon: stored || undefined };
  }
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
  
  if (data.instagram_screenshot_url !== undefined) {
    updatePayload.instagram_screenshot_url = data.instagram_screenshot_url;
  }
  
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

  // Update profiles table with resilient schema cache error recovery
  let currentPayload = { ...updatePayload };
  let profileError: any = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await (supabaseAdmin.from("profiles") as any)
      .update(currentPayload)
      .eq("id", auth.userId);

    profileError = res.error;
    if (!profileError) break;

    const errMsg = profileError.message || "";
    const match = errMsg.match(/Could not find the '([^']+)' column of 'profiles' in the schema cache/i);
    if (match && match[1]) {
      const missingCol = match[1];
      console.warn(`[updateProfileAction] Column '${missingCol}' missing in profiles schema cache. Removing and retrying.`);
      
      // If photo_url is missing, retry with avatar_url if userPhoto was provided
      if (missingCol === "photo_url" && userPhoto && !currentPayload.avatar_url) {
        currentPayload.avatar_url = userPhoto;
      }
      
      // Until the column exists (migration not run yet), keep the proof reachable.
      if (missingCol === "instagram_screenshot_url" && !currentPayload.social_link && data.instagram_screenshot_url) {
        currentPayload.social_link = data.instagram_screenshot_url;
      }

      delete currentPayload[missingCol];
      continue;
    }

    break;
  }

  if (profileError) {
    console.error("[updateProfileAction] Error:", profileError);
    return { success: false, error: profileError.message };
  }

  // Keep only small text fields in auth metadata. user_metadata is embedded in every
  // session token, so images and identity numbers must never be stored there — and any
  // that older versions saved are cleared here.
  try {
    await supabaseAdmin.auth.admin.updateUserById(auth.userId, {
      user_metadata: {
        first_name: fName,
        last_name: lName,
        full_name: computedFullName,
        is_profile_complete: completeness.isComplete,
        cnic: null,
        address: null,
        cnic_picture_url: null,
        instagram_screenshot_url: null,
        avatar_url: null,
        photo_url: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        bio: null,
      },
    });
  } catch (authMetaErr) {
    console.warn("[updateProfileAction] Metadata update warning:", authMetaErr);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/profile/edit");
  revalidatePath(`/profile/${auth.userId}`);
  return {
    success: true,
    isComplete: completeness.isComplete,
    missingCount: completeness.missingFields.length,
  };
}
