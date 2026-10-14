import React from "react";
import { getAllApplicationsAction } from "@/app/actions/member-applications";
import AdminApplicationsClient from "./AdminApplicationsClient";

export const revalidate = 0; // Disable static caching so modifications are live

export default async function AdminApplicationsPage() {
  const applications = await getAllApplicationsAction();

  return <AdminApplicationsClient initialApplications={applications} />;
}
