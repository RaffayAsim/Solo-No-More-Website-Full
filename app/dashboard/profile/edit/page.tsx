import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import ProfileEditClient from "./ProfileEditClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit Profile — Solo-No-More",
  description: "Customize your personal identity, CNIC verification & contact details in real-time.",
};

export default async function DashboardProfileEditPage({
  searchParams,
}: {
  searchParams?: Promise<{ notice?: string }> | { notice?: string };
}) {
  const result = await getSessionUserSecurely();
  if ("error" in result || !result.userId) {
    redirect("/login");
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const notice = resolvedParams?.notice;

  const userEmail = result.email || "member@solonomore.com";
  const userMetadata = result.user_metadata || {};

  const { data: profile } = await (supabaseAdmin
    .from("profiles") as any)
    .select("*")
    .eq("id", result.userId)
    .maybeSingle();

  if (!profile) {
    redirect("/dashboard/profile");
  }

  const initialProfile = {
    id: result.userId,
    full_name: profile.full_name || userMetadata.full_name || "",
    phone: profile.phone || userMetadata.phone || "",
    city: profile.city || "Karachi",
    gender: profile.gender || userMetadata.gender || "Male",
    date_of_birth: profile.date_of_birth || userMetadata.date_of_birth || "",
    cnic: profile.cnic || userMetadata.cnic || "",
    emergency_contact_name: profile.emergency_contact_name || userMetadata.emergency_contact_name || "",
    emergency_contact_phone: profile.emergency_contact_phone || userMetadata.emergency_contact_phone || "",
    instagram_username: (profile.instagram_username || userMetadata.instagram_username || "").replace(/^@/, ""),
    cnic_picture_url: profile.cnic_picture_url || userMetadata.cnic_picture_url || "",
    instagram_screenshot_url: profile.instagram_screenshot_url || userMetadata.instagram_screenshot_url || profile.social_link || "",
    photo_url: profile.photo_url || userMetadata.photo_url || profile.avatar_url || userMetadata.avatar_url || "",
    bio: profile.bio || userMetadata.bio || "",
    vibe_tags: Array.isArray(profile.vibe_tags) && profile.vibe_tags.length > 0 ? profile.vibe_tags : ["Techno & House"],
    is_profile_complete: Boolean(profile.is_profile_complete),
  };

  return <ProfileEditClient initialProfile={initialProfile} email={userEmail} notice={notice} />;
}
