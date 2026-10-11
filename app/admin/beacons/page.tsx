import React from "react";
import { getAllBeaconsForAdminAction } from "@/app/actions/admin";
import AdminBeaconsClient from "./AdminBeaconsClient";

export const revalidate = 0;

export default async function AdminBeaconsPage() {
  const res = await getAllBeaconsForAdminAction();
  const beacons = res.success ? res.data || [] : [];

  return <AdminBeaconsClient initialBeacons={beacons} />;
}
