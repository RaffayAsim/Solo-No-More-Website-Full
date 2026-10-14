import React from "react";
import { getAllAdminBookingsAction } from "@/app/actions/admin-bookings";
import GuestBookingsClient from "./GuestBookingsClient";

export const revalidate = 0; // Fresh ledger data

export default async function AdminGuestBookingsPage() {
  const allBookings = await getAllAdminBookingsAction();
  // Filter exclusively for guest bookings on open events
  const guestBookings = allBookings.filter(
    (b) => !!b.is_guest || b.tier?.toLowerCase().includes("guest") || !!b.is_open_event
  );

  return <GuestBookingsClient initialBookings={guestBookings} />;
}
