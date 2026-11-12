"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/server/auth";
import { isValidEmail } from "@/lib/server/auth-users";

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
  const email = (formData.email || "").trim().toLowerCase();
  const password = formData.password || "";
  const fullName = (formData.fullName || "").trim().slice(0, 80);
  const socialLink = (formData.socialLink || "").trim().slice(0, 255);
  const bio = (formData.bio || "").trim().slice(0, 300);
  const city = ["Karachi", "Lahore", "Islamabad"].includes(formData.city || "") ? formData.city : "Karachi";

  if (!isValidEmail(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }
  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }
  if (!fullName) {
    return { success: false, error: "Please enter your full name." };
  }
  // Staff addresses can never be self-registered.
  if (isAdminEmail(email)) {
    return { success: false, error: "This email address cannot be used to sign up." };
  }

  // Public sign-up always creates a regular, un-vetted Explorer account. Partner and
  // artist access is only ever granted by an admin after review.
  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Skip email confirmation — vetting is the real gate
    user_metadata: {
      full_name: fullName,
      social_link: socialLink,
      bio,
      city,
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
