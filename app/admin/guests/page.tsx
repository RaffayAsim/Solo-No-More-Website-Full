import React from "react";
import { getAllGuestUsersAction } from "@/app/actions/guest-users";
import GuestUsersClient from "./GuestUsersClient";

export const revalidate = 0; // Fresh live guest data

export default async function AdminGuestsPage() {
  const guests = await getAllGuestUsersAction();

  return <GuestUsersClient initialGuests={guests} />;
}
