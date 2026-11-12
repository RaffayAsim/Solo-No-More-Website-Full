"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdminStatus } from "@/app/actions/admin";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { parseEventDescription } from "@/lib/event-metadata";
import { formatPkt } from "@/lib/time";
import { resolveStoredImage } from "@/lib/server/storage";
import { isUuid } from "@/lib/server/auth";

export interface AdditionalAttendee {
  name: string;
  email: string;
  status: string;
  gender: string;
  entry: string;
  pair_code: string;
}

export interface MemberBookingRecord {
  id: string; // event_tickets.id (UUID) — the real ticket this row controls
  qr_id: string; // e.g. "QHQ-619379"
  event_id: string; // e.g. "1106"
  event_name: string; // e.g. "VibeFest 2.0"
  event_date: string; // e.g. "6/1/2026"
  booking_type: "Couple" | "Single";
  tier: string; // e.g. "Couple Pass" | "Single Pass"
  name: string; // e.g. "Abdul Raffay"
  email: string; // e.g. "raffay.asim6@gmail.com"
  phone: string; // e.g. "03332877852"
  partner_payment?: string; // e.g. "Invitee needs to pay"
  status: "Confirm" | "Pending" | "Cancelled" | "Attended";
  user_status: string; // "Confirm"
  invite_progress?: string; // "1/1 accepted" | "N/A"
  cnic: string; // e.g. "12345-6789012-3"
  car_number: string; // e.g. "N/A"
  price: number; // e.g. 5000
  venue: string; // e.g. "Defence Authority Creek Club, DHA Phase 8, Karachi"
  payment_screenshot_url?: string;
  created_at: string; // e.g. "6/1/2026, 9:37:37 PM"
  additional_attendee?: AdditionalAttendee;
  is_guest?: boolean;
  is_open_event?: boolean;
}

type BookingStatus = MemberBookingRecord["status"];

function toBookingStatus(ticketStatus: string): BookingStatus {
  if (ticketStatus === "pending") return "Pending";
  if (ticketStatus === "scanned" || ticketStatus === "admitted") return "Attended";
  if (ticketStatus === "cancelled") return "Cancelled";
  return "Confirm";
}

/**
 * Server Action: Every real booking (event ticket) on the platform, newest first.
 * This reads straight from the database — there is no sample data mixed in.
 */
export async function getAllAdminBookingsAction(): Promise<MemberBookingRecord[]> {
  try {
    await verifyAdminStatus("bookings.view");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return [];
  }

  const { data: tickets, error } = await (supabaseAdmin.from("event_tickets") as any)
    .select(`
      *,
      official_events:event_id (id, title, venue_name, scheduled_at, price, description),
      profiles:user_id (id, full_name, phone, cnic, account_status, is_guest)
    `)
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error || !Array.isArray(tickets)) {
    console.error("[getAllAdminBookingsAction] Query failed:", error);
    return [];
  }

  // Payment proof screenshots, keyed by booking reference
  const proofByRef = new Map<string, string>();
  try {
    const refs = Array.from(new Set(tickets.map((t: any) => t.payment_reference).filter(Boolean))).slice(0, 300);
    if (refs.length > 0) {
      const { data: subs } = await (supabaseAdmin.from("payment_submissions") as any)
        .select("booking_ref, proof_image_url, created_at")
        .in("booking_ref", refs)
        .order("created_at", { ascending: true });
      for (const sub of subs || []) {
        if (sub.booking_ref && sub.proof_image_url) proofByRef.set(sub.booking_ref, sub.proof_image_url);
      }
    }
  } catch {}

  // Group couple bookings so each row can show its companion
  const byRef = new Map<string, any[]>();
  for (const t of tickets) {
    const key = t.pair_code || "";
    if (!key) continue;
    byRef.set(key, [...(byRef.get(key) || []), t]);
  }

  return Promise.all(
    tickets.map(async (t: any) => {
      const ev = t.official_events || {};
      const pf = t.profiles || {};
      const { metadata } = parseEventDescription(ev.description || "");
      const companion = t.pair_code
        ? (byRef.get(t.pair_code) || []).find((o: any) => o.id !== t.id)
        : null;
      const proofRef = t.payment_reference ? proofByRef.get(t.payment_reference) : undefined;

      const record: MemberBookingRecord = {
        id: t.id,
        qr_id: t.qr_id || String(t.id).slice(0, 8).toUpperCase(),
        event_id: ev.id ? String(ev.id).slice(0, 8) : "",
        event_name: ev.title || "Event",
        event_date: formatPkt(ev.scheduled_at, { month: "numeric", day: "numeric", year: "numeric" }),
        booking_type: t.is_couple_booking ? "Couple" : "Single",
        tier: t.tier_name || (t.is_couple_booking ? "Couple Pass" : "Single Pass"),
        name: t.user_name || pf.full_name || "Attendee",
        email: t.user_email || "",
        phone: t.user_phone || pf.phone || "",
        partner_payment:
          t.payment_status === "paid"
            ? "Paid"
            : t.payment_status === "submitted"
            ? "Proof submitted — awaiting verification"
            : t.payment_status === "rejected"
            ? "Payment rejected"
            : "Awaiting payment",
        status: toBookingStatus(t.ticket_status),
        user_status: pf.account_status === "suspended" ? "Suspended" : "Confirm",
        invite_progress: t.is_couple_booking ? (companion ? "1/1 added" : "0/1 added") : "N/A",
        cnic: pf.cnic || "N/A",
        car_number: "N/A",
        price: Number(t.amount_paid_pkr ?? ev.price ?? 0),
        venue: ev.venue_name || "",
        payment_screenshot_url: (await resolveStoredImage(proofRef)) || undefined,
        created_at: formatPkt(t.created_at, {
          month: "numeric",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
        is_guest: !!t.is_guest_entry || !!pf.is_guest || !t.user_id,
        is_open_event: metadata?.visibility === "public" || metadata?.event_category === "open_event",
      };

      if (companion) {
        record.additional_attendee = {
          name: companion.user_name || "Companion",
          email: companion.user_email || "",
          status: toBookingStatus(companion.ticket_status),
          gender: "",
          entry: companion.ticket_status === "scanned" ? "Checked in" : "Not checked in",
          pair_code: t.pair_code,
        };
      }
      return record;
    })
  );
}

/**
 * Server Action: Change a booking's status from the admin table.
 * "Confirm" marks the pass as paid and valid at the door.
 */
export async function updateBookingStatusAction(
  bookingId: string,
  newStatus: "Confirm" | "Pending" | "Cancelled" | "Attended"
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdminStatus("bookings.approve");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Booking approval permission required." };
  }

  if (!isUuid(bookingId)) {
    return { success: false, error: "Booking not found." };
  }

  const update: Record<string, string> | null =
    newStatus === "Confirm"
      ? { ticket_status: "active", payment_status: "paid" }
      : newStatus === "Pending"
      ? { ticket_status: "pending" }
      : newStatus === "Attended"
      ? { ticket_status: "scanned" }
      : newStatus === "Cancelled"
      ? { ticket_status: "cancelled" }
      : null;

  if (!update) return { success: false, error: "Invalid status." };

  const { data, error } = await (supabaseAdmin.from("event_tickets") as any)
    .update(update)
    .eq("id", bookingId)
    .select("id");

  if (error) {
    console.error("[updateBookingStatusAction] Update failed:", error);
    return { success: false, error: "Could not update the booking. Please try again." };
  }
  if (!data || data.length === 0) {
    return { success: false, error: "Booking not found." };
  }

  return { success: true };
}

/**
 * Server Action: Permanently delete a booking record.
 */
export async function deleteBookingAction(
  bookingId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdminStatus("bookings.approve");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Booking approval permission required." };
  }

  if (!isUuid(bookingId)) {
    return { success: false, error: "Booking not found." };
  }

  const { error } = await (supabaseAdmin.from("event_tickets") as any).delete().eq("id", bookingId);
  if (error) {
    return { success: false, error: "Could not delete the booking. Please try again." };
  }

  return { success: true };
}
