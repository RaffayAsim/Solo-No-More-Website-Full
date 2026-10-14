import React from "react";
import { getAdminArtistsDataAction } from "@/app/actions/artists";
import AdminArtistsClient from "./AdminArtistsClient";

export const revalidate = 0; // Disable static cache for live admin tools

export default async function AdminArtistsPage() {
  const { artists, approvedMembers, stats } = await getAdminArtistsDataAction();

  return (
    <AdminArtistsClient
      initialArtists={artists || []}
      initialApprovedMembers={approvedMembers || []}
      stats={stats}
    />
  );
}
