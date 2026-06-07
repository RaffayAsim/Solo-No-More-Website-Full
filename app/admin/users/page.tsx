import React from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import UserVettingClient from "./UserVettingClient";

export const revalidate = 0; // Disable static caching so modifications are live

export default async function UserVettingPage() {
  // 1. Fetch user profiles from database
  const { data: profiles } = await (supabaseAdmin
    .from("profiles") as any)
    .select("*");

  // 2. Fetch auth user records to map email addresses
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const emailsMap = new Map(users.map((u) => [u.id, u.email]));

  const profilesList = profiles || [];

  // Sort: 'pending_vetting' profiles are placed at the absolute top, followed by 'suspended', then other statuses
  const sortedProfiles = [...profilesList].sort((a, b) => {
    if (a.account_status === "pending_vetting" && b.account_status !== "pending_vetting") return -1;
    if (a.account_status !== "pending_vetting" && b.account_status === "pending_vetting") return 1;
    if (a.account_status === "suspended" && b.account_status !== "suspended") return -1;
    if (a.account_status !== "suspended" && b.account_status === "suspended") return 1;
    return 0;
  });

  // Compile full user vetting record rows
  const mappedUsers = sortedProfiles.map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: emailsMap.get(p.id) || "No Registered Email",
    bio: p.bio,
    social_link: p.social_link,
    subscription_tier: p.subscription_tier,
    account_status: p.account_status,
    no_show_strikes: p.no_show_strikes || 0,
    is_partner: p.is_partner || false,
    business_name: p.business_name || null,
  }));

  return <UserVettingClient initialUsers={mappedUsers} />;
}
