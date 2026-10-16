import React from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAllApplicationsAction } from "@/app/actions/member-applications";
import UserVettingClient, { UnifiedUserRecord } from "./UserVettingClient";

export const revalidate = 0; // Disable static caching so modifications are live

function formatDeterministicDate(d: string | number | Date | null | undefined): string {
  if (!d) return "5/31/2026";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "5/31/2026";
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()}`;
}

function getValidImageUrl(url: any): string {
  if (typeof url === "string") {
    const trimmed = url.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:") || trimmed.startsWith("/")) {
      return trimmed;
    }
  }
  return "";
}

export default async function UserVettingPage() {
  // 1. Fetch user profiles from database
  const { data: profiles } = await (supabaseAdmin
    .from("profiles") as any)
    .select("*");

  // 2. Fetch auth user records to map email addresses & created_at
  const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers();
  const authUsersMap = new Map(authUsers.map((u) => [u.id, u]));

  // 3. Fetch all membership applications (pending queries, vetting requests)
  let applications: any[] = [];
  try {
    applications = await getAllApplicationsAction();
  } catch (err) {
    console.error("Failed to load applications for user vetting:", err);
  }

  // Create an email lookup for applications
  const appByEmail = new Map<string, any>();
  for (const app of applications) {
    if (app.email) {
      appByEmail.set(app.email.toLowerCase().trim(), app);
    }
  }

  const profilesList = profiles || [];
  const processedEmails = new Set<string>();
  const unifiedList: UnifiedUserRecord[] = [];

  // 1. Map all registered auth profiles (Paid & Approved members)
  for (const p of profilesList) {
    const authUser = authUsersMap.get(p.id);
    const email = authUser?.email || "No Registered Email";
    const app = appByEmail.get(email.toLowerCase().trim());
    processedEmails.add(email.toLowerCase().trim());

    // Extract first and last name
    const rawName = (p.full_name || app?.fullName || "Member User").trim();
    const parts = rawName.split(" ");
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";

    // Username formatted as @KazimNoor
    let cleanUsername = app?.username || email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") || "KazimNoor";
    if (cleanUsername.startsWith("@")) cleanUsername = cleanUsername.substring(1);

    // Registration date formatted deterministically
    const createdAt = p.created_at || authUser?.created_at || app?.createdAt || "2026-05-31T00:00:00.000Z";
    const regDate = formatDeterministicDate(createdAt);

    // Account status mapping
    let status: "approved" | "pending" | "payment_pending" | "suspended" | "rejected" = "approved";
    if (p.account_status === "suspended") status = "suspended";
    else if (p.account_status === "rejected") status = "rejected";
    else if (p.account_status === "pending_vetting") {
      status = app?.status === "payment_pending" ? "payment_pending" : "pending";
    } else {
      status = "approved";
    }

    // Role
    let role = "member";
    if (p.subscription_tier === "admin") role = "admin";
    else if (p.is_partner) role = "partner";

    const profilePic = getValidImageUrl(p.photo_url) || getValidImageUrl(p.avatar_url) || getValidImageUrl(app?.photoUrl);

    unifiedList.push({
      id: p.id,
      applicationId: app?.id,
      source: "profile",
      fullName: rawName,
      firstName: p.first_name || firstName,
      lastName: p.last_name || lastName,
      displayName: rawName,
      username: cleanUsername,
      email,
      phone: p.phone || app?.phone || "",
      role,
      status,
      subscriptionTier: p.subscription_tier || "member",
      registeredDate: regDate,
      createdAtIso: createdAt,
      city: p.city || app?.city || "Karachi",
      address: app?.city ? `DHA Phase 6, ${app.city}` : "Karachi, Pakistan",
      cnic: p.cnic || app?.cnic || "",
      gender: p.gender || "Male",
      dateOfBirth: p.date_of_birth || "",
      emergencyContactName: p.emergency_contact_name || app?.emergencyContactName || "",
      emergencyContactPhone: p.emergency_contact_phone || app?.emergencyContactPhone || "",
      instagramUsername: (p.instagram_username || p.social_link || app?.instagram || "").replace(/^@/, ""),
      bio: p.bio || app?.vibe || "",
      profilePictureUrl: profilePic,
      avatarIcon: p.avatar_icon || "👾",
      cnicPictureUrl: p.cnic_picture_url || "",
      instagramScreenshotUrl: p.instagram_screenshot_url || p.social_link || (app?.instagramScreenshots && app.instagramScreenshots[0]) || "",
      vibeTags: Array.isArray(p.vibe_tags) && p.vibe_tags.length > 0 ? p.vibe_tags : ["Techno & House"],
      isProfileComplete: Boolean(p.is_profile_complete),
      instagramScreenshots: [],
      instagram: p.instagram_username || p.social_link || app?.instagram || "",
      packageSelected: app?.packageSelected || "Solo Pass Pro",
      paymentMethod: app?.paymentMethod,
      transactionRef: app?.transactionRef,
      inviteToken: app?.inviteToken,
    });
  }

  // 2. Also map any new member application queries that haven't registered an auth account yet
  for (const app of applications) {
    const appEmail = (app.email || "").toLowerCase().trim();
    if (!processedEmails.has(appEmail)) {
      processedEmails.add(appEmail);

      const rawName = (app.fullName || "Applicant").trim();
      const parts = rawName.split(" ");
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";

      let cleanUsername = app.username || appEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") || "user";
      if (cleanUsername.startsWith("@")) cleanUsername = cleanUsername.substring(1);

      const createdAt = app.createdAt || "2026-05-31T00:00:00.000Z";
      const regDate = formatDeterministicDate(createdAt);

      let status: "approved" | "pending" | "payment_pending" | "suspended" | "rejected" = "pending";
      if (app.status === "approved" || app.status === "credentials_created") status = "approved";
      else if (app.status === "payment_pending") status = "payment_pending";
      else if (app.status === "rejected") status = "rejected";
      else status = "pending";

      unifiedList.push({
        id: app.id,
        applicationId: app.id,
        source: "application",
        fullName: rawName,
        firstName,
        lastName,
        displayName: rawName,
        username: cleanUsername,
        email: app.email,
        phone: app.phone || "",
        role: app.type === "partner" ? "partner" : "member",
        status,
        subscriptionTier: app.packageSelected?.toLowerCase().includes("vip") ? "family" : "member",
        registeredDate: regDate,
        createdAtIso: createdAt,
        city: app.city || "Karachi",
        address: `${app.city || "Karachi"}, Pakistan`,
        cnic: app.cnic || "",
        gender: "Male",
        dateOfBirth: "",
        emergencyContactName: app.emergencyContactName || "",
        emergencyContactPhone: app.emergencyContactPhone || "",
        instagramUsername: (app.instagram || "").replace(/^@/, ""),
        bio: app.vibe || "",
        profilePictureUrl: getValidImageUrl(app.photoUrl),
        avatarIcon: "👾",
        cnicPictureUrl: "",
        instagramScreenshotUrl: (app.instagramScreenshots && app.instagramScreenshots[0]) || "",
        vibeTags: ["Techno & House"],
        isProfileComplete: false,
        instagramScreenshots: [],
        instagram: app.instagram || "",
        packageSelected: app.packageSelected || "Solo Pass Pro",
        paymentMethod: app.paymentMethod,
        transactionRef: app.transactionRef,
        inviteToken: app.inviteToken,
      });
    }
  }

  // Exclude all Guest/Explorer users from Member Users
  const isGuest = (u: UnifiedUserRecord) =>
    u.role?.toLowerCase().includes("guest") ||
    u.role?.toLowerCase().includes("explorer") ||
    u.subscriptionTier?.toLowerCase() === "guest" ||
    u.subscriptionTier?.toLowerCase() === "free" ||
    u.packageSelected?.toLowerCase().includes("explorer") ||
    u.packageSelected?.toLowerCase().includes("free trial");

  const memberOnlyList = unifiedList.filter((u) => !isGuest(u));

  // Sort: Pending applicants at the top, then sort by newest date
  memberOnlyList.sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime();
  });

  return <UserVettingClient initialUsers={memberOnlyList} />;
}
