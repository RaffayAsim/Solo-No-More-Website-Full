import React from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAllApplicationsAction } from "@/app/actions/member-applications";
import UserVettingClient, { UnifiedUserRecord } from "./UserVettingClient";

export const revalidate = 0; // Disable static caching so modifications are live

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

    // Registration date formatted like "5/31/2026"
    const createdAt = p.created_at || authUser?.created_at || app?.createdAt || new Date().toISOString();
    const regDate = new Date(createdAt).toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });

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

    unifiedList.push({
      id: p.id,
      applicationId: app?.id,
      source: "profile",
      fullName: rawName,
      firstName,
      lastName,
      displayName: rawName,
      username: cleanUsername,
      email,
      phone: p.phone || app?.phone || "0300 1234567",
      role,
      status,
      subscriptionTier: p.subscription_tier || "member",
      registeredDate: regDate,
      createdAtIso: createdAt,
      city: p.city || app?.city || "Karachi",
      address: app?.city ? `DHA Phase 6, ${app.city}` : "Karachi, Pakistan",
      cnic: app?.cnic || "42101-1234567-1",
      bio: p.bio || app?.vibe || "Active community explorer",
      profilePictureUrl: p.avatar_icon || app?.photoUrl || "",
      cnicPictureUrl: "",
      instagramScreenshots: [],
      instagram: p.social_link || app?.instagram || "",
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

      const createdAt = app.createdAt || new Date().toISOString();
      const regDate = new Date(createdAt).toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      });

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
        phone: app.phone || "0300 1234567",
        role: app.type === "partner" ? "partner" : "member",
        status,
        subscriptionTier: app.packageSelected?.toLowerCase().includes("vip") ? "family" : "member",
        registeredDate: regDate,
        createdAtIso: createdAt,
        city: app.city || "Karachi",
        address: `${app.city || "Karachi"}, Pakistan`,
        cnic: app.cnic || "42101-1234567-1",
        bio: app.vibe || "New community applicant",
        profilePictureUrl: app.photoUrl || "",
        cnicPictureUrl: "",
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
