import React from "react";
import { getPaymentSubmissionsAction } from "@/app/actions/billing";
import AdminPaymentsClient from "./AdminPaymentsClient";

export const revalidate = 0;

export default async function AdminPaymentsPage() {
  const res = await getPaymentSubmissionsAction();
  const payments = res.success ? res.data || [] : [];

  return <AdminPaymentsClient initialPayments={payments} />;
}
