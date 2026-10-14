import React from "react";
import { getAllAdminBookingsAction } from "@/app/actions/admin-bookings";
import AdminBookingsClient from "./AdminBookingsClient";

export const revalidate = 0;

export default async function AdminBookingsPage() {
  const allBookings = await getAllAdminBookingsAction();
  const memberOnlyBookings = allBookings.filter(
    (b) => !b.is_guest && !b.tier?.toLowerCase().includes("guest") && !b.is_open_event
  );

  return <AdminBookingsClient initialBookings={memberOnlyBookings} />;
}
