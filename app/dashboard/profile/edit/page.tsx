import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import ProfileEditClient from "./ProfileEditClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit Profile — Solo-No-More",
  description: "Customize your personal identity, CNIC verification & contact details in real-time.",
};

export default async function DashboardProfileEditPage() {
  const result = await getSessionUserSecurely();
  if ("error" in result || !result.userId) {
    redirect("/login");
  }

  const userEmail = result.email || "member@solonomore.com";
  const userMetadata = result.user_metadata || {};

  const { data: profile } = await (supabaseAdmin
    .from("profiles") as any)
    .select("id, full_name, phone, bio, social_link, city, avatar_icon, is_partner, business_name, vibe_tags, is_active_seeker")
    .eq("id", result.userId)
    .single();

  if (!profile) {
    redirect("/dashboard/profile");
  }

  const initialProfile = {
    id: result.userId,
    full_name: profile?.full_name || userMetadata.full_name || "",
    first_name: userMetadata.first_name || "",
    last_name: userMetadata.last_name || "",
    phone: profile?.phone || userMetadata.phone || "",
    cnic: userMetadata.cnic || "",
    address: userMetadata.address || "",
    gender: userMetadata.gender || "Male",
    cnic_picture_url: userMetadata.cnic_picture_url || "",
    avatar_url: userMetadata.avatar_url || "",
    avatar_icon: profile?.avatar_icon || "👤",
    bio: profile?.bio || userMetadata.bio || "",
    social_link: profile?.social_link || "",
    city: profile?.city || "Karachi",
    vibe_tags: profile?.vibe_tags || userMetadata.vibe_tags || ["Techno & House", "Late Night Chai", "Padel & Sports"],
    is_partner: profile?.is_partner || false,
    business_name: profile?.business_name || "",
    is_active_seeker: profile?.is_active_seeker || false,
  };

  return <ProfileEditClient initialProfile={initialProfile} email={userEmail} />;
}
