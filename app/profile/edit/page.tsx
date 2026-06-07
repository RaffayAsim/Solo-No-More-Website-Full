import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import ProfileEditClient from "./ProfileEditClient";
import { getSessionUserSecurely } from "@/lib/supabase/session";

export const metadata = {
  title: "Edit Vibe Profile — Solo-No-More",
  description: "Customize your public Vibe Profile details in real-time.",
};

/**
 * Securely get the logged in user ID via server cookie
 */
async function getSessionUser() {
  const result = await getSessionUserSecurely();
  if ("error" in result) return null;
  return { id: result.userId, email: result.email, user_metadata: result.user_metadata };
}

export default async function ProfileEditPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch the current user's profile details using supabaseAdmin to bypass RLS
  const { data: profile } = await (supabaseAdmin
    .from("profiles") as any)
    .select("id, full_name, bio, social_link, city, avatar_icon, is_partner, business_name, vibe_tags, is_active_seeker")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/dashboard");
  }

  return <ProfileEditClient initialProfile={profile} />;
}
