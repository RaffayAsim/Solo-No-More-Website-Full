import React from "react";
import { getManualTicketingDataAction } from "@/app/actions/manual-ticketing";
import ManualTicketingClient from "./ManualTicketingClient";

export const revalidate = 0; // Disable static cache for live admin tools

export default async function ManualTicketingPage() {
  const { users, events } = await getManualTicketingDataAction();

  return (
    <ManualTicketingClient
      initialUsers={users || []}
      initialEvents={events || []}
    />
  );
}
