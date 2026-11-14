import React from "react";
import { getAllApplicationsAction } from "@/app/actions/member-applications";
import AdminApplicationsClient from "./AdminApplicationsClient";

export const revalidate = 0; // Disable static caching so modifications are live

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; filter?: string }>;
}) {
  const [applications, params] = await Promise.all([getAllApplicationsAction(), searchParams]);

  return (
    <AdminApplicationsClient
      initialApplications={applications}
      initialSelectedId={typeof params.id === "string" ? params.id : undefined}
      initialFilter={typeof params.filter === "string" ? params.filter : undefined}
    />
  );
}
