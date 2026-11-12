"use server";

import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdminStatus } from "@/app/actions/admin";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { findAuthUserByEmail, isDuplicateUserError, isValidEmail } from "@/lib/server/auth-users";
import {
  MEMBER_UPLOADS_BUCKET,
  PAYMENT_PROOFS_BUCKET,
  isImageDataUrl,
  parseImageDataUrl,
  resolveStoredImage,
  storeImageDataUrl,
} from "@/lib/server/storage";
import { ANNUAL_SUFFIX, APPLICATION_PACKAGES, getApplicationPackageAmountPkr } from "@/lib/payment-config";
import { isAdminEmail } from "@/lib/server/auth";
import { bankDetailRows, notifyAdminByEmail, sendEmail } from "@/lib/server/email";
import { getSiteUrl } from "@/lib/server/site-url";
import { activateSubscription } from "@/lib/server/subscriptions";

export type ApplicationStatus =
  | "pending_admin_approval"
  | "payment_pending"
  | "payment_submitted"
  | "approved"
  | "credentials_created"
  | "rejected";

export interface MemberApplicationRecord {
  id: string;
  type: "member" | "partner";
  username: string;
  email: string;
  fullName: string;
  phone: string;
  city: string;
  gender: string;
  vibe: string;
  dateOfBirth: string;
  cnic: string;
  emergencyName: string;
  emergencyPhone: string;
  instagram?: string;
  interests: string[];
  photoUrl?: string;
  packageSelected: string;
  packagePricePkr: number;
  partnerBusinessName?: string;
  partnerCategory?: string;
  partnerPerks?: string;
  status: ApplicationStatus;
  paymentMethod?: string;
  transactionRef?: string;
  paymentProofUrl?: string;
  paymentSubmittedAt?: string;
  adminNotes?: string;
  inviteToken?: string;
  createdAt: string;
  updatedAt: string;
}

const TABLE = "membership_applications";
const MIGRATION_HINT =
  "Applications are temporarily unavailable. (Admin: run the latest Supabase migration — phase18.)";

function clean(value: unknown, max = 200): string {
  return String(value ?? "").trim().slice(0, max);
}

function newApplicationId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}_${crypto.randomBytes(9).toString("hex")}`;
}

/** Normalises the chosen package to a known label ("Solo Pass Pro" / "Solo Pass Pro (Annual)"). */
function packageLabel(name: string, billingCycle?: string): string {
  const base = name.endsWith(ANNUAL_SUFFIX) ? name.slice(0, -ANNUAL_SUFFIX.length) : name;
  const pkg = APPLICATION_PACKAGES[base];
  const wantsAnnual = billingCycle === "annual" || name.endsWith(ANNUAL_SUFFIX);
  return wantsAnnual && pkg?.annualTotal ? `${base}${ANNUAL_SUFFIX}` : base;
}

function packagePrice(label: string, clientPrice: unknown): number {
  const known = getApplicationPackageAmountPkr(label);
  if (known !== null) return known;
  return Math.max(0, Math.round(Number(clientPrice) || 0));
}

function mapRow(d: any): MemberApplicationRecord {
  return {
    id: d.id,
    type: d.type || "member",
    username: d.username || "",
    email: d.email || "",
    fullName: d.full_name || "",
    phone: d.phone || "",
    city: d.city || "",
    gender: d.gender || "",
    vibe: d.vibe || "",
    dateOfBirth: d.date_of_birth || "",
    cnic: d.cnic || "",
    emergencyName: d.emergency_name || "",
    emergencyPhone: d.emergency_phone || "",
    instagram: d.instagram || undefined,
    interests: d.interests || [],
    photoUrl: d.photo_url || undefined,
    packageSelected: d.package_selected || "",
    packagePricePkr: Number(d.package_price_pkr || 0),
    partnerBusinessName: d.partner_business_name || undefined,
    partnerCategory: d.partner_category || undefined,
    partnerPerks: d.partner_perks || undefined,
    status: d.status,
    paymentMethod: d.payment_method || undefined,
    transactionRef: d.transaction_ref || undefined,
    paymentProofUrl: d.payment_proof_url || undefined,
    paymentSubmittedAt: d.payment_submitted_at || undefined,
    adminNotes: d.admin_notes || undefined,
    inviteToken: d.invite_token || undefined,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  };
}

/**
 * What the applicant's own status/payment page may see. Identity documents, contact
 * details and admin notes never leave the server through the public lookups.
 */
function toPublicRecord(full: MemberApplicationRecord): MemberApplicationRecord {
  return {
    id: full.id,
    type: full.type,
    username: full.username,
    email: full.email,
    fullName: full.fullName,
    phone: "",
    city: full.city,
    gender: "",
    vibe: "",
    dateOfBirth: "",
    cnic: "",
    emergencyName: "",
    emergencyPhone: "",
    interests: [],
    packageSelected: full.packageSelected,
    packagePricePkr: full.packagePricePkr,
    status: full.status,
    paymentMethod: full.paymentMethod,
    transactionRef: full.transactionRef,
    // The credential link is only revealed once the application is approved.
    inviteToken: full.status === "approved" ? full.inviteToken : undefined,
    createdAt: full.createdAt,
    updatedAt: full.updatedAt,
  };
}

async function loadApplicationById(id: string): Promise<MemberApplicationRecord | null> {
  if (!id || typeof id !== "string" || id.length > 120) return null;
  const { data } = await (supabaseAdmin.from(TABLE) as any).select("*").eq("id", id).maybeSingle();
  return data ? mapRow(data) : null;
}

async function loadApplicationByToken(token: string): Promise<MemberApplicationRecord | null> {
  if (!token || typeof token !== "string" || token.length < 20 || token.length > 200) return null;
  const { data } = await (supabaseAdmin.from(TABLE) as any)
    .select("*")
    .eq("invite_token", token)
    .maybeSingle();
  return data ? mapRow(data) : null;
}

/** An email may only have one application in progress at a time. */
async function hasOpenApplication(email: string): Promise<boolean> {
  const { data } = await (supabaseAdmin.from(TABLE) as any)
    .select("id")
    .ilike("email", email.replace(/[%_]/g, "\\$&"))
    .in("status", ["pending_admin_approval", "payment_pending", "payment_submitted", "approved"])
    .limit(1);
  return !!data && data.length > 0;
}

function firstNameOf(fullName: string): string {
  return (fullName || "").trim().split(/\s+/)[0] || "there";
}

/**
 * Marks an application approved, creates its one-time credential link and emails it.
 * Returns the token so the admin screen can also show/copy the link.
 */
async function issueInviteAndEmail(
  app: MemberApplicationRecord
): Promise<{ success: boolean; inviteToken?: string; emailSent?: boolean; error?: string }> {
  const inviteToken = `token_${crypto.randomBytes(24).toString("hex")}`;
  const { error } = await (supabaseAdmin.from(TABLE) as any)
    .update({
      status: "approved",
      invite_token: inviteToken,
      updated_at: new Date().toISOString(),
    })
    .eq("id", app.id);
  if (error) return { success: false, error: "Failed to approve the application." };

  const siteUrl = await getSiteUrl();
  const emailSent = await sendEmail({
    to: app.email,
    subject: "You're in — create your Solo-No-More password",
    heading: "Welcome to Solo-No-More",
    paragraphs: [
      `Hi ${firstNameOf(app.fullName)},`,
      app.packagePricePkr > 0
        ? `Your payment for ${app.packageSelected} has been verified and your membership is approved.`
        : `Your application for ${app.packageSelected} has been approved.`,
      "Use the button below to choose your password. After that you can log in with this email address.",
    ],
    button: { label: "Create my password", url: `${siteUrl}/create-credentials?token=${inviteToken}` },
    footnote: "This link is personal to you and works once. Please do not forward it.",
  });

  return { success: true, inviteToken, emailSent };
}

/**
 * Submit a Member Application
 */
export async function submitMemberApplicationAction(formData: {
  username: string;
  email: string;
  fullName: string;
  phone: string;
  city: string;
  gender: string;
  vibe: string;
  dateOfBirth: string;
  cnic: string;
  emergencyName: string;
  emergencyPhone: string;
  instagram?: string;
  interests: string[];
  photoUrl?: string;
  packageSelected: string;
  packagePricePkr: number;
  billingCycle?: "monthly" | "annual";
}): Promise<{ success: boolean; applicationId?: string; error?: string }> {
  try {
    const email = clean(formData.email).toLowerCase();
    const fullName = clean(formData.fullName, 120);
    if (!isValidEmail(email)) return { success: false, error: "Please enter a valid email address." };
    if (!fullName) return { success: false, error: "Full name is required." };
    if (!clean(formData.phone, 30)) return { success: false, error: "Phone number is required." };
    if (!clean(formData.cnic, 30)) return { success: false, error: "CNIC is required." };
    if (isAdminEmail(email)) return { success: false, error: "This email address cannot be used." };

    if (await hasOpenApplication(email)) {
      return {
        success: false,
        error: "An application with this email is already in progress. Please check your status link or contact support.",
      };
    }

    const id = newApplicationId("app_");
    const packageSelected = packageLabel(clean(formData.packageSelected, 80) || "Solo Pass Pro", formData.billingCycle);

    let photoRef: string | null = null;
    if (isImageDataUrl(formData.photoUrl)) {
      photoRef = await storeImageDataUrl(MEMBER_UPLOADS_BUCKET, `applications/${id}`, formData.photoUrl);
      if (!photoRef) return { success: false, error: "Your photo could not be read. Please upload a JPG or PNG under 3 MB." };
    }

    const now = new Date().toISOString();
    const { error: dbError } = await (supabaseAdmin.from(TABLE) as any).insert({
      id,
      type: "member",
      username: clean(formData.username, 60),
      email,
      full_name: fullName,
      phone: clean(formData.phone, 30),
      city: clean(formData.city, 60) || "Karachi",
      gender: clean(formData.gender, 40),
      vibe: clean(formData.vibe, 500),
      date_of_birth: clean(formData.dateOfBirth, 20),
      cnic: clean(formData.cnic, 30),
      emergency_name: clean(formData.emergencyName, 120),
      emergency_phone: clean(formData.emergencyPhone, 30),
      instagram: clean(formData.instagram, 80) || null,
      interests: (Array.isArray(formData.interests) ? formData.interests : []).slice(0, 20).map((i) => clean(i, 40)),
      photo_url: photoRef,
      package_selected: packageSelected,
      package_price_pkr: packagePrice(packageSelected, formData.packagePricePkr),
      status: "pending_admin_approval",
      created_at: now,
      updated_at: now,
    });

    if (dbError) {
      console.error("[submitMemberApplicationAction] Insert failed:", dbError.message);
      return { success: false, error: MIGRATION_HINT };
    }

    const siteUrl = await getSiteUrl();
    await sendEmail({
      to: email,
      subject: "We received your Solo-No-More application",
      heading: "Application received",
      paragraphs: [
        `Hi ${firstNameOf(fullName)},`,
        `Thanks for applying for ${packageSelected}. Our team reviews every application personally — this usually takes 24 to 48 hours.`,
        "You will get another email as soon as there is a decision. You can also check your status any time with the button below.",
      ],
      details: [
        { label: "Package", value: packageSelected },
        { label: "Application ID", value: id },
      ],
      button: { label: "Check application status", url: `${siteUrl}/pay/${id}` },
    });
    await notifyAdminByEmail(
      "New membership application",
      [`${fullName} (${email}) applied for ${packageSelected}.`],
      { label: "Review applications", url: `${siteUrl}/admin/users` }
    );

    return { success: true, applicationId: id };
  } catch (err: any) {
    console.error("[submitMemberApplicationAction] error:", err);
    return { success: false, error: "Failed to submit application. Please try again." };
  }
}

/**
 * Submit a Partner Application
 */
export async function submitPartnerApplicationAction(formData: {
  username?: string;
  email: string;
  fullName: string;
  phone: string;
  city: string;
  partnerBusinessName: string;
  partnerCategory: string;
  partnerPerks?: string;
  packageSelected?: string;
  packagePricePkr?: number;
}): Promise<{ success: boolean; applicationId?: string; error?: string }> {
  try {
    const email = clean(formData.email).toLowerCase();
    if (!isValidEmail(email)) return { success: false, error: "Please enter a valid email address." };
    if (!clean(formData.fullName)) return { success: false, error: "Contact name is required." };
    if (!clean(formData.partnerBusinessName)) return { success: false, error: "Business name is required." };
    if (isAdminEmail(email)) return { success: false, error: "This email address cannot be used." };

    if (await hasOpenApplication(email)) {
      return {
        success: false,
        error: "An application with this email is already in progress. Please check your status link or contact support.",
      };
    }

    const id = newApplicationId("app_part_");
    const packageSelected = clean(formData.packageSelected, 80) || "Partner Residency";
    const now = new Date().toISOString();

    const { error: dbError } = await (supabaseAdmin.from(TABLE) as any).insert({
      id,
      type: "partner",
      username: clean(formData.username, 60) || email.split("@")[0],
      email,
      full_name: clean(formData.fullName, 120),
      phone: clean(formData.phone, 30),
      city: clean(formData.city, 60) || "Karachi",
      gender: "partner",
      vibe: clean(formData.partnerCategory, 120),
      interests: [clean(formData.partnerCategory, 40)].filter(Boolean),
      partner_business_name: clean(formData.partnerBusinessName, 120),
      partner_category: clean(formData.partnerCategory, 120),
      partner_perks: clean(formData.partnerPerks, 1000) || null,
      package_selected: packageSelected,
      package_price_pkr: packagePrice(packageSelected, formData.packagePricePkr),
      status: "pending_admin_approval",
      created_at: now,
      updated_at: now,
    });

    if (dbError) {
      console.error("[submitPartnerApplicationAction] Insert failed:", dbError.message);
      return { success: false, error: MIGRATION_HINT };
    }

    const siteUrl = await getSiteUrl();
    await sendEmail({
      to: email,
      subject: "We received your Solo-No-More partner application",
      heading: "Partner application received",
      paragraphs: [
        `Hi ${firstNameOf(clean(formData.fullName, 120))},`,
        `Thanks for applying to list ${clean(formData.partnerBusinessName, 120)} on Solo-No-More. Our partnerships team will review it and email you with the next step.`,
      ],
      details: [{ label: "Application ID", value: id }],
      button: { label: "Check application status", url: `${siteUrl}/pay/${id}` },
    });
    await notifyAdminByEmail(
      "New partner application",
      [`${clean(formData.partnerBusinessName, 120)} — ${clean(formData.fullName, 120)} (${email}).`],
      { label: "Review applications", url: `${siteUrl}/admin/users` }
    );

    return { success: true, applicationId: id };
  } catch (err: any) {
    return { success: false, error: "Failed to submit partner application. Please try again." };
  }
}

/**
 * Get all applications for Admin
 */
export async function getAllApplicationsAction(): Promise<MemberApplicationRecord[]> {
  try {
    await verifyAdminStatus("members.view");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return [];
  }

  try {
    const { data } = await (supabaseAdmin.from(TABLE) as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    const records: MemberApplicationRecord[] = (data || []).map(mapRow);
    // Uploaded images live in private storage — give the admin short-lived links.
    return await Promise.all(
      records.map(async (r) => ({
        ...r,
        photoUrl: (await resolveStoredImage(r.photoUrl)) || undefined,
        paymentProofUrl: (await resolveStoredImage(r.paymentProofUrl)) || undefined,
      }))
    );
  } catch {
    return [];
  }
}

/**
 * Get single application by ID (public: used by the applicant's payment/status page).
 * Returns a reduced record — no CNIC, phone, emergency contact or admin notes.
 */
export async function getApplicationByIdAction(id: string): Promise<MemberApplicationRecord | null> {
  try {
    const full = await loadApplicationById(id);
    return full ? toPublicRecord(full) : null;
  } catch {
    return null;
  }
}

/**
 * Get single application by inviteToken (public: used by the credential setup page).
 */
export async function getApplicationByTokenAction(token: string): Promise<MemberApplicationRecord | null> {
  try {
    const full = await loadApplicationByToken(token);
    if (!full) return null;
    return { ...toPublicRecord(full), inviteToken: undefined };
  } catch {
    return null;
  }
}

/**
 * Admin approves initial application and triggers payment instructions
 */
export async function adminApproveApplicationAction(
  id: string,
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdminStatus("members.manage");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const app = await loadApplicationById(id);
  if (!app) return { success: false, error: "Application not found." };
  if (app.status !== "pending_admin_approval" && app.status !== "rejected") {
    return { success: false, error: "This application is already past the review stage." };
  }

  // Free packages have nothing to pay: approve and send the password link straight away.
  if (!(app.packagePricePkr > 0)) {
    const issued = await issueInviteAndEmail(app);
    return issued.success ? { success: true } : { success: false, error: issued.error };
  }

  const { data, error } = await (supabaseAdmin.from(TABLE) as any)
    .update({
      status: "payment_pending",
      admin_notes: clean(adminNotes, 500) || "Approved for membership payment verification.",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .in("status", ["pending_admin_approval", "rejected"])
    .select("id");

  if (error) return { success: false, error: "Failed to approve application." };
  if (!data || data.length === 0) {
    return { success: false, error: "Application not found, or it is already past the review stage." };
  }

  const siteUrl = await getSiteUrl();
  await sendEmail({
    to: app.email,
    subject: "Your Solo-No-More application is approved — complete your payment",
    heading: "You're approved! One step left",
    paragraphs: [
      `Hi ${firstNameOf(app.fullName)},`,
      `Good news — your application for ${app.packageSelected} has been approved. To activate it, transfer the amount below to our bank account.`,
      "After paying: (1) open the button below and upload a screenshot of the transfer, and (2) send the same screenshot to our WhatsApp number for confirmation. Once we verify it, we will email you a link to create your password.",
    ],
    details: bankDetailRows(app.packagePricePkr, app.id),
    button: { label: "Upload payment screenshot", url: `${siteUrl}/pay/${app.id}` },
  });

  return { success: true };
}

/**
 * Applicant submits bank payment proof (screenshot & transaction ID)
 */
export async function submitApplicationPaymentAction(
  id: string,
  payment: {
    transactionRef: string;
    paymentMethod: string;
    proofImageUrl?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const app = await loadApplicationById(id);
    if (!app) return { success: false, error: "Application not found." };
    if (app.status !== "payment_pending") {
      return {
        success: false,
        error:
          app.status === "payment_submitted"
            ? "Payment proof was already submitted and is awaiting verification."
            : "This application is not awaiting payment.",
      };
    }

    if (!parseImageDataUrl(payment.proofImageUrl)) {
      return { success: false, error: "Please upload a screenshot of your payment (JPG or PNG, under 3 MB)." };
    }
    const proofRef = await storeImageDataUrl(PAYMENT_PROOFS_BUCKET, `applications/${app.id}`, payment.proofImageUrl);
    if (!proofRef) {
      return { success: false, error: "The screenshot could not be read. Please upload it again." };
    }

    const { data, error } = await (supabaseAdmin.from(TABLE) as any)
      .update({
        status: "payment_submitted",
        transaction_ref: clean(payment.transactionRef, 64) || "N/A",
        payment_method: clean(payment.paymentMethod, 40) || "bank_transfer",
        payment_proof_url: proofRef,
        payment_submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", app.id)
      .eq("status", "payment_pending")
      .select("id");

    if (error || !data || data.length === 0) {
      return { success: false, error: "Failed to submit payment details. Please try again." };
    }

    const siteUrl = await getSiteUrl();
    await sendEmail({
      to: app.email,
      subject: "We received your payment proof",
      heading: "Payment proof received",
      paragraphs: [
        `Hi ${firstNameOf(app.fullName)},`,
        `Thanks — we have your payment screenshot for ${app.packageSelected}. Our team will check it against the bank statement, usually within a few hours.`,
        "As soon as it is verified you will receive an email with a link to create your password.",
      ],
    });
    await notifyAdminByEmail(
      "Membership payment proof to verify",
      [`${app.fullName} (${app.email}) uploaded payment proof for ${app.packageSelected} — PKR ${app.packagePricePkr.toLocaleString("en-US")}.`],
      { label: "Verify payment", url: `${siteUrl}/admin/users` }
    );
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Failed to submit payment details. Please try again." };
  }
}

/**
 * Admin verifies the payment and issues the credential setup link
 */
export async function adminVerifyPaymentAndIssueInviteAction(
  id: string
): Promise<{ success: boolean; inviteToken?: string; emailSent?: boolean; error?: string }> {
  try {
    await verifyAdminStatus("payments.verify");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Payment verification permission required." };
  }

  const app = await loadApplicationById(id);
  if (!app) return { success: false, error: "Application not found." };
  if (app.status === "credentials_created") {
    return { success: false, error: "This member has already created their account." };
  }
  if (app.status === "approved" && app.inviteToken) {
    return { success: true, inviteToken: app.inviteToken };
  }
  if (app.status !== "payment_submitted" && app.status !== "payment_pending") {
    return { success: false, error: "Approve the application first — it has not reached the payment stage." };
  }

  const issued = await issueInviteAndEmail(app);
  if (!issued.success) return { success: false, error: issued.error || "Failed to verify payment." };
  return { success: true, inviteToken: issued.inviteToken, emailSent: issued.emailSent };
}

/**
 * Applicant finalizes their credentials (password) and activates their account
 */
export async function setupMemberCredentialsAction(data: {
  token: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const app = await loadApplicationByToken(data.token);
    if (!app) {
      return { success: false, error: "Invalid or expired credential link." };
    }
    if (app.status === "credentials_created") {
      return { success: false, error: "Account credentials have already been configured. Please log in directly." };
    }
    if (app.status !== "approved") {
      return { success: false, error: "This application has not been approved yet." };
    }
    if (!data.password || data.password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters." };
    }

    // Determine tier from package selected
    const pkg = (app.packageSelected || "").toLowerCase();
    const isPartner = app.type === "partner";
    let tier = "member";
    if (isPartner || pkg.includes("partner")) tier = "partner";
    else if (pkg.includes("vip") || pkg.includes("inner circle")) tier = "family";
    else if (pkg.includes("explorer") || pkg.includes("scout")) tier = "none";

    const socialLink = app.instagram ? `https://instagram.com/${app.instagram.replace(/^@/, "")}` : "";

    const { data: created, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: app.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: app.fullName,
        username: app.username,
        phone: app.phone,
        city: app.city,
      },
    });

    let userId = created?.user?.id || null;
    if (authError) {
      if (!isDuplicateUserError(authError.message)) {
        return { success: false, error: authError.message };
      }
      // The applicant already had a (guest) login with this email. Their existing
      // password stays as it is — the invite link must not be able to reset it.
      const existing = await findAuthUserByEmail(app.email);
      userId = existing?.id || null;
    }

    if (!userId) {
      return { success: false, error: "Could not activate the account. Please contact support." };
    }

    const { data: currentProfile } = await (supabaseAdmin.from("profiles") as any)
      .select("subscription_tier")
      .eq("id", userId)
      .maybeSingle();

    const profileUpdate: any = {
      id: userId,
      full_name: app.fullName,
      phone: app.phone || null,
      bio: app.vibe || "Vetted Solo-No-More Member",
      social_link: socialLink || null,
      account_status: "approved",
      is_partner: isPartner,
      business_name: app.partnerBusinessName || null,
      is_guest: false,
    };
    // Never downgrade an admin who happened to apply with their own email.
    if (currentProfile?.subscription_tier !== "admin") profileUpdate.subscription_tier = tier;
    if (["Karachi", "Lahore", "Islamabad"].includes(app.city)) profileUpdate.city = app.city;
    if (app.gender && app.gender !== "partner") profileUpdate.gender = app.gender;
    if (app.dateOfBirth) profileUpdate.date_of_birth = app.dateOfBirth;
    if (app.cnic) profileUpdate.cnic = app.cnic;
    if (app.emergencyName) profileUpdate.emergency_contact_name = app.emergencyName;
    if (app.emergencyPhone) profileUpdate.emergency_contact_phone = app.emergencyPhone;
    if (app.instagram) profileUpdate.instagram_username = app.instagram.replace(/^@/, "");
    if (app.interests?.length) profileUpdate.vibe_tags = app.interests.slice(0, 10);

    const { error: profileErr } = await (supabaseAdmin.from("profiles") as any).upsert(profileUpdate);
    if (profileErr) {
      console.error("[setupMemberCredentialsAction] Profile upsert failed:", profileErr);
      return { success: false, error: "Your login was created but the profile could not be activated. Please contact support." };
    }

    // Paid packages start their billing period now (monthly or annual).
    if (currentProfile?.subscription_tier !== "admin" && (tier === "member" || tier === "family") && app.packagePricePkr > 0) {
      const cycle = app.packageSelected.endsWith(ANNUAL_SUFFIX) ? "annual" : "monthly";
      const activated = await activateSubscription(userId, tier, cycle);
      if (!activated.success) console.error("[setupMemberCredentialsAction] Subscription activation failed:", activated.error);
    }

    const siteUrl = await getSiteUrl();
    await sendEmail({
      to: app.email,
      subject: "Your Solo-No-More account is ready",
      heading: "Your account is ready",
      paragraphs: [
        `Hi ${firstNameOf(app.fullName)},`,
        "Your password is set and your account is active. Log in with this email address to complete your profile and start joining hangouts.",
      ],
      button: { label: "Log in", url: `${siteUrl}/login` },
    });

    await (supabaseAdmin.from(TABLE) as any)
      .update({
        status: "credentials_created",
        invite_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", app.id);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to set credentials." };
  }
}
