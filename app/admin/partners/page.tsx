import React from "react";
import { getAdminPartnersDataAction } from "@/app/actions/partners";
import AdminPartnersClient from "./AdminPartnersClient";

export const revalidate = 0; // Disable static cache for live admin tools

export default async function AdminPartnersPage() {
  const { partners, approvedMembers } = await getAdminPartnersDataAction();

  return (
    <AdminPartnersClient
      initialPartners={partners || []}
      initialApprovedMembers={approvedMembers || []}
    />
  );
}
