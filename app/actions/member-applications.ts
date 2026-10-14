"use server";

import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdminStatus } from "@/app/actions/admin";

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

const DATA_DIR = path.join(process.cwd(), "data");
const APPLICATIONS_FILE = path.join(DATA_DIR, "member_applications.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(APPLICATIONS_FILE)) {
    fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify([]), "utf-8");
  }
}

function getLocalApplications(): MemberApplicationRecord[] {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(APPLICATIONS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("[member-applications] Failed to read local store:", err);
    return [];
  }
}

function saveLocalApplications(apps: MemberApplicationRecord[]) {
  try {
    ensureDataFile();
    fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify(apps, null, 2), "utf-8");
  } catch (err) {
    console.error("[member-applications] Failed to save local store:", err);
  }
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
}): Promise<{ success: boolean; applicationId?: string; error?: string }> {
  try {
    const id = "app_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
    const newRecord: MemberApplicationRecord = {
      id,
      type: "member",
      ...formData,
      status: "pending_admin_approval",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Save to local persistent JSON
    const local = getLocalApplications();
    local.unshift(newRecord);
    saveLocalApplications(local);

    // 2. Also try inserting into Supabase if table exists
    try {
      await (supabaseAdmin.from("membership_applications") as any).insert({
        id: newRecord.id,
        type: newRecord.type,
        username: newRecord.username,
        email: newRecord.email,
        full_name: newRecord.fullName,
        phone: newRecord.phone,
        city: newRecord.city,
        gender: newRecord.gender,
        vibe: newRecord.vibe,
        date_of_birth: newRecord.dateOfBirth,
        cnic: newRecord.cnic,
        emergency_name: newRecord.emergencyName,
        emergency_phone: newRecord.emergencyPhone,
        instagram: newRecord.instagram,
        interests: newRecord.interests,
        photo_url: newRecord.photoUrl,
        package_selected: newRecord.packageSelected,
        package_price_pkr: newRecord.packagePricePkr,
        status: newRecord.status,
        created_at: newRecord.createdAt,
        updated_at: newRecord.updatedAt,
      });
    } catch {
      // Supabase table may not exist yet, local store handles it
    }

    return { success: true, applicationId: id };
  } catch (err: any) {
    console.error("[submitMemberApplicationAction] error:", err);
    return { success: false, error: err.message || "Failed to submit application." };
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
    const id = "app_part_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
    const newRecord: MemberApplicationRecord = {
      id,
      type: "partner",
      username: formData.username || formData.email.split("@")[0],
      email: formData.email,
      fullName: formData.fullName,
      phone: formData.phone,
      city: formData.city,
      gender: "partner",
      vibe: formData.partnerCategory,
      dateOfBirth: "",
      cnic: "",
      emergencyName: "",
      emergencyPhone: "",
      interests: [formData.partnerCategory],
      partnerBusinessName: formData.partnerBusinessName,
      partnerCategory: formData.partnerCategory,
      partnerPerks: formData.partnerPerks,
      packageSelected: formData.packageSelected || "Partner Residency",
      packagePricePkr: formData.packagePricePkr || 0,
      status: "pending_admin_approval",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const local = getLocalApplications();
    local.unshift(newRecord);
    saveLocalApplications(local);

    try {
      await (supabaseAdmin.from("membership_applications") as any).insert({
        id: newRecord.id,
        type: newRecord.type,
        username: newRecord.username,
        email: newRecord.email,
        full_name: newRecord.fullName,
        phone: newRecord.phone,
        city: newRecord.city,
        partner_business_name: newRecord.partnerBusinessName,
        partner_category: newRecord.partnerCategory,
        partner_perks: newRecord.partnerPerks,
        package_selected: newRecord.packageSelected,
        package_price_pkr: newRecord.packagePricePkr,
        status: newRecord.status,
        created_at: newRecord.createdAt,
        updated_at: newRecord.updatedAt,
      });
    } catch {}

    return { success: true, applicationId: id };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to submit partner application." };
  }
}

/**
 * Get all applications for Admin
 */
export async function getAllApplicationsAction(): Promise<MemberApplicationRecord[]> {
  try {
    await verifyAdminStatus();
  } catch {
    // If not verified admin, return empty
    return [];
  }

  // Check Supabase first, merge with local store
  const local = getLocalApplications();
  try {
    const { data } = await (supabaseAdmin.from("membership_applications") as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      // Map supabase rows to MemberApplicationRecord
      const mappedDb: MemberApplicationRecord[] = data.map((d: any) => ({
        id: d.id,
        type: d.type || "member",
        username: d.username,
        email: d.email,
        fullName: d.full_name,
        phone: d.phone,
        city: d.city,
        gender: d.gender,
        vibe: d.vibe,
        dateOfBirth: d.date_of_birth,
        cnic: d.cnic,
        emergencyName: d.emergency_name,
        emergencyPhone: d.emergency_phone,
        instagram: d.instagram,
        interests: d.interests || [],
        photoUrl: d.photo_url,
        packageSelected: d.package_selected,
        packagePricePkr: Number(d.package_price_pkr || 0),
        partnerBusinessName: d.partner_business_name,
        partnerCategory: d.partner_category,
        partnerPerks: d.partner_perks,
        status: d.status,
        paymentMethod: d.payment_method,
        transactionRef: d.transaction_ref,
        paymentProofUrl: d.payment_proof_url,
        paymentSubmittedAt: d.payment_submitted_at,
        adminNotes: d.admin_notes,
        inviteToken: d.invite_token,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));

      // Combine with local, deduplicate by id
      const combined = [...mappedDb];
      local.forEach((loc) => {
        if (!combined.some((c) => c.id === loc.id)) {
          combined.push(loc);
        }
      });
      return combined;
    }
  } catch {}

  return local;
}

/**
 * Get single application by ID (Public for payment and status check)
 */
export async function getApplicationByIdAction(id: string): Promise<MemberApplicationRecord | null> {
  const local = getLocalApplications();
  const match = local.find((a) => a.id === id);
  if (match) return match;

  try {
    const { data } = await (supabaseAdmin.from("membership_applications") as any)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (data) {
      return {
        id: data.id,
        type: data.type || "member",
        username: data.username,
        email: data.email,
        fullName: data.full_name,
        phone: data.phone,
        city: data.city,
        gender: data.gender,
        vibe: data.vibe,
        dateOfBirth: data.date_of_birth,
        cnic: data.cnic,
        emergencyName: data.emergency_name,
        emergencyPhone: data.emergency_phone,
        instagram: data.instagram,
        interests: data.interests || [],
        photoUrl: data.photo_url,
        packageSelected: data.package_selected,
        packagePricePkr: Number(data.package_price_pkr || 0),
        partnerBusinessName: data.partner_business_name,
        partnerCategory: data.partner_category,
        partnerPerks: data.partner_perks,
        status: data.status,
        paymentMethod: data.payment_method,
        transactionRef: data.transaction_ref,
        paymentProofUrl: data.payment_proof_url,
        paymentSubmittedAt: data.payment_submitted_at,
        adminNotes: data.admin_notes,
        inviteToken: data.invite_token,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }
  } catch {}

  return null;
}

/**
 * Get single application by inviteToken (for credential setup)
 */
export async function getApplicationByTokenAction(token: string): Promise<MemberApplicationRecord | null> {
  const local = getLocalApplications();
  const match = local.find((a) => a.inviteToken === token);
  if (match) return match;

  try {
    const { data } = await (supabaseAdmin.from("membership_applications") as any)
      .select("*")
      .eq("invite_token", token)
      .maybeSingle();

    if (data) {
      return {
        id: data.id,
        type: data.type || "member",
        username: data.username,
        email: data.email,
        fullName: data.full_name,
        phone: data.phone,
        city: data.city,
        gender: data.gender,
        vibe: data.vibe,
        dateOfBirth: data.date_of_birth,
        cnic: data.cnic,
        emergencyName: data.emergency_name,
        emergencyPhone: data.emergency_phone,
        instagram: data.instagram,
        interests: data.interests || [],
        photoUrl: data.photo_url,
        packageSelected: data.package_selected,
        packagePricePkr: Number(data.package_price_pkr || 0),
        status: data.status,
        inviteToken: data.invite_token,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }
  } catch {}

  return null;
}

/**
 * Admin approves initial application and triggers payment instructions
 */
export async function adminApproveApplicationAction(
  id: string,
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdminStatus();

    const local = getLocalApplications();
    const idx = local.findIndex((a) => a.id === id);
    if (idx !== -1) {
      local[idx].status = "payment_pending";
      local[idx].adminNotes = adminNotes || "Approved for membership payment verification.";
      local[idx].updatedAt = new Date().toISOString();
      saveLocalApplications(local);
    }

    try {
      await (supabaseAdmin.from("membership_applications") as any)
        .update({
          status: "payment_pending",
          admin_notes: adminNotes || "Approved for membership payment verification.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    } catch {}

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to approve application." };
  }
}

/**
 * User submits manual bank payment proof (screenshot & TID)
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
    const local = getLocalApplications();
    const idx = local.findIndex((a) => a.id === id);
    if (idx !== -1) {
      local[idx].status = "payment_submitted";
      local[idx].transactionRef = payment.transactionRef;
      local[idx].paymentMethod = payment.paymentMethod;
      local[idx].paymentProofUrl = payment.proofImageUrl;
      local[idx].paymentSubmittedAt = new Date().toISOString();
      local[idx].updatedAt = new Date().toISOString();
      saveLocalApplications(local);
    }

    try {
      await (supabaseAdmin.from("membership_applications") as any)
        .update({
          status: "payment_submitted",
          transaction_ref: payment.transactionRef,
          payment_method: payment.paymentMethod,
          payment_proof_url: payment.proofImageUrl,
          payment_submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    } catch {}

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to submit payment details." };
  }
}

/**
 * Admin verifies manual payment and issues the credential setup link
 */
export async function adminVerifyPaymentAndIssueInviteAction(
  id: string
): Promise<{ success: boolean; inviteToken?: string; error?: string }> {
  try {
    await verifyAdminStatus();

    const inviteToken = "token_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);

    const local = getLocalApplications();
    const idx = local.findIndex((a) => a.id === id);
    if (idx !== -1) {
      local[idx].status = "approved";
      local[idx].inviteToken = inviteToken;
      local[idx].updatedAt = new Date().toISOString();
      saveLocalApplications(local);
    }

    try {
      await (supabaseAdmin.from("membership_applications") as any)
        .update({
          status: "approved",
          invite_token: inviteToken,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    } catch {}

    return { success: true, inviteToken };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to verify payment." };
  }
}

/**
 * User finalizes their credentials (password) and activates their account
 */
export async function setupMemberCredentialsAction(data: {
  token: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const app = await getApplicationByTokenAction(data.token);
    if (!app) {
      return { success: false, error: "Invalid or expired credential link." };
    }

    if (app.status === "credentials_created") {
      return { success: false, error: "Account credentials have already been configured. Please log in directly." };
    }

    // Determine tier from package selected
    let tier = "member";
    const pkg = (app.packageSelected || "").toLowerCase();
    if (pkg.includes("vip") || pkg.includes("inner circle")) {
      tier = "family"; // mapped to VIP
    } else if (app.type === "partner" || pkg.includes("partner")) {
      tier = "partner";
    }

    // Create user in Supabase auth
    const { error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: app.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: app.fullName,
        username: app.username,
        phone: app.phone,
        city: app.city,
        gender: app.gender,
        vibe: app.vibe,
        social_link: app.instagram ? `https://instagram.com/${app.instagram.replace("@", "")}` : "",
        is_partner: app.type === "partner",
        business_name: app.partnerBusinessName,
      },
    });

    if (authError) {
      if (
        !authError.message.toLowerCase().includes("already registered") &&
        !authError.message.toLowerCase().includes("duplicate")
      ) {
        return { success: false, error: authError.message };
      }
    }

    // Fetch user id to update profile
    const { data: userLookup } = await supabaseAdmin.auth.admin.listUsers();
    const createdUser = userLookup.users.find((u) => u.email?.toLowerCase() === app.email.toLowerCase());

    if (createdUser) {
      await (supabaseAdmin.from("profiles") as any)
        .update({
          full_name: app.fullName,
          phone: app.phone,
          bio: app.vibe || "Vetted Solo-No-More Member",
          social_link: app.instagram ? `https://instagram.com/${app.instagram.replace("@", "")}` : null,
          subscription_tier: tier,
          account_status: "approved",
          is_partner: app.type === "partner",
          business_name: app.partnerBusinessName || null,
        })
        .eq("id", createdUser.id);
    }

    // Update status in application
    const local = getLocalApplications();
    const idx = local.findIndex((a) => a.id === app.id);
    if (idx !== -1) {
      local[idx].status = "credentials_created";
      local[idx].updatedAt = new Date().toISOString();
      saveLocalApplications(local);
    }

    try {
      await (supabaseAdmin.from("membership_applications") as any)
        .update({
          status: "credentials_created",
          updated_at: new Date().toISOString(),
        })
        .eq("id", app.id);
    } catch {}

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to set credentials." };
  }
}
