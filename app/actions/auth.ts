"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";

export type SignUpResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Server Action: Create a new applicant account.
 *
 * We use the admin client with email_confirm: true so users can log in
 * immediately — email confirmation is redundant in a manually-vetted app.
 * Account access is still gated by account_status = 'pending_vetting'.
 */
export async function signUpAction(formData: {
  email: string;
  password: string;
  fullName: string;
  socialLink: string;
  bio: string;
  city?: string;
  isPartner?: boolean;
  businessName?: string;
}): Promise<SignUpResult> {
  const { email, password, fullName, socialLink, bio, city, isPartner, businessName } = formData;

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Skip email confirmation — vetting is the real gate
    user_metadata: {
      full_name: fullName,
      social_link: socialLink,
      bio,
      city: city || "Karachi",
      is_partner: isPartner || false,
      business_name: isPartner ? businessName : undefined,
    },
  });

  if (error) {
    // Surface friendly messages for common cases
    if (error.message.toLowerCase().includes("already registered") || 
        error.message.toLowerCase().includes("already been registered") ||
        error.message.toLowerCase().includes("duplicate")) {
      return { success: false, error: "An account with this email already exists. Try signing in instead." };
    }
    return { success: false, error: error.message };
  }

  return { success: true };
}
