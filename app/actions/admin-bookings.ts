"use server";

import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdminStatus } from "@/app/actions/admin";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export interface AdditionalAttendee {
  name: string;
  email: string;
  status: string;
  gender: string;
  entry: string;
  pair_code: string;
}

export interface MemberBookingRecord {
  id: string; // e.g. "160"
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

const DATA_DIR = path.join(process.cwd(), "data");
const BOOKINGS_FILE = path.join(DATA_DIR, "admin_bookings.json");

const INITIAL_SEED_BOOKINGS: MemberBookingRecord[] = [
  {
    id: "160",
    qr_id: "QHQ-619379",
    event_id: "1106",
    event_name: "VibeFest 2.0",
    event_date: "6/1/2026",
    booking_type: "Couple",
    tier: "Couple Pass",
    name: "Abdul Raffay",
    email: "raffay.asim6@gmail.com",
    phone: "03332877852",
    partner_payment: "Invitee needs to pay",
    status: "Confirm",
    user_status: "Confirm",
    invite_progress: "1/1 accepted",
    cnic: "12345-6789012-3",
    car_number: "N/A",
    price: 5000,
    venue: "Defence Authority Creek Club, DHA Phase 8, Karachi",
    payment_screenshot_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80",
    created_at: "6/1/2026, 9:37:37 PM",
    additional_attendee: {
      name: "Kazim Noor",
      email: "office.leadgen986@gmail.com",
      status: "Confirm",
      gender: "male",
      entry: "Couple Entry",
      pair_code: "421065",
    },
  },
  {
    id: "158",
    qr_id: "QHQ-742918",
    event_id: "1092",
    event_name: "Drift Fest Karachi",
    event_date: "6/1/2026",
    booking_type: "Couple",
    tier: "Couple Pass",
    name: "Kazim Noor",
    email: "office.leadgen986@gmail.com",
    phone: "+92 334 0005566",
    partner_payment: "Paid by Host",
    status: "Confirm",
    user_status: "Confirm",
    invite_progress: "1/1 accepted",
    cnic: "42101-9876543-1",
    car_number: "ABC-789",
    price: 8000,
    venue: "Karachi Port Trust Raceway, Karachi",
    payment_screenshot_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80",
    created_at: "6/1/2026, 12:57:50 AM",
    additional_attendee: {
      name: "Ayesha Khan",
      email: "ayesha.k@gmail.com",
      status: "Confirm",
      gender: "female",
      entry: "Couple Entry",
      pair_code: "719402",
    },
  },
  {
    id: "157",
    qr_id: "QHQ-315682",
    event_id: "1088",
    event_name: "Safari Tourist Train",
    event_date: "5/31/2026",
    booking_type: "Single",
    tier: "Single Pass",
    name: "Abdul Raffay",
    email: "raffay.asim6@gmail.com",
    phone: "03332877852",
    status: "Confirm",
    user_status: "Confirm",
    invite_progress: "N/A",
    cnic: "12345-6789012-3",
    car_number: "N/A",
    price: 3500,
    venue: "Karachi Cantt Railway Station Platform 1",
    payment_screenshot_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80",
    created_at: "5/31/2026, 10:11:46 PM",
  },
  {
    id: "156",
    qr_id: "QHQ-893612",
    event_id: "1106",
    event_name: "VibeFest 2.0",
    event_date: "5/31/2026",
    booking_type: "Single",
    tier: "Single Pass",
    name: "Raffay User",
    email: "abdul.raffay@quantumarc.us",
    phone: "03152597927",
    status: "Confirm",
    user_status: "Confirm",
    invite_progress: "N/A",
    cnic: "98765-4321098-7",
    car_number: "N/A",
    price: 12000,
    venue: "Defence Authority Creek Club, DHA Phase 8, Karachi",
    payment_screenshot_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80",
    created_at: "5/31/2026, 10:10:49 PM",
  },
  {
    id: "155",
    qr_id: "QHQ-449102",
    event_id: "1108",
    event_name: "Sunset Music Jam (Open Event)",
    event_date: "6/2/2026",
    booking_type: "Single",
    tier: "Guest Pass",
    name: "Hamza Farooq",
    email: "hamza.explorer@gmail.com",
    phone: "03001234567",
    status: "Confirm",
    user_status: "Confirm",
    invite_progress: "N/A",
    cnic: "42201-1122334-5",
    car_number: "N/A",
    price: 1500,
    venue: "Clifton Beach Arena, Karachi",
    payment_screenshot_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80",
    created_at: "6/2/2026, 4:15:20 PM",
    is_guest: true,
    is_open_event: true,
  },
  {
    id: "154",
    qr_id: "QHQ-982134",
    event_id: "1110",
    event_name: "Open Mic & Poetry Night (Open Event)",
    event_date: "6/3/2026",
    booking_type: "Single",
    tier: "Guest Pass",
    name: "Sara Ahmed",
    email: "sara.ahmed@yahoo.com",
    phone: "03219876543",
    status: "Confirm",
    user_status: "Confirm",
    invite_progress: "N/A",
    cnic: "42101-5566778-9",
    car_number: "N/A",
    price: 1000,
    venue: "District 19 Cultural Space, Karachi",
    payment_screenshot_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80",
    created_at: "6/3/2026, 8:22:10 PM",
    is_guest: true,
    is_open_event: true,
  },
];

function ensureDataFile(): MemberBookingRecord[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BOOKINGS_FILE)) {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(INITIAL_SEED_BOOKINGS, null, 2), "utf-8");
    return INITIAL_SEED_BOOKINGS;
  }
  try {
    const raw = fs.readFileSync(BOOKINGS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    // If empty, re-seed
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(INITIAL_SEED_BOOKINGS, null, 2), "utf-8");
    return INITIAL_SEED_BOOKINGS;
  } catch (err) {
    console.error("Error reading admin_bookings.json:", err);
    return INITIAL_SEED_BOOKINGS;
  }
}

function writeDataFile(records: MemberBookingRecord[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing admin_bookings.json:", err);
  }
}

/**
 * Server Action: Get all member bookings unified across file store & database.
 */
export async function getAllAdminBookingsAction(): Promise<MemberBookingRecord[]> {
  try {
    await verifyAdminStatus();
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return [];
  }

  // 1. Fetch file-stored bookings
  const localBookings = ensureDataFile();

  // 2. Query Supabase event_tickets with joined events & profiles
  let dbBookings: MemberBookingRecord[] = [];
  try {
    const { data: tickets, error } = await (supabaseAdmin.from("event_tickets") as any)
      .select(`
        id,
        ticket_status,
        created_at,
        event_id,
        user_id,
        official_events:event_id(id, title, venue, scheduled_at, price_pkr, ticket_price),
        profiles:user_id(id, full_name, email, phone, cnic, account_status)
      `)
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(tickets)) {
      dbBookings = tickets.map((t: any, idx: number) => {
        const idNum = String(100 + idx);
        const ev = t.official_events || {};
        const pf = t.profiles || {};
        const dateObj = t.created_at ? new Date(t.created_at) : new Date();
        const dateFormatted = `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear()}`;
        const timeFormatted = dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });

        // Map ticket_status to dropdown state
        let normalizedStatus: "Confirm" | "Pending" | "Cancelled" | "Attended" = "Confirm";
        if (t.ticket_status === "pending") normalizedStatus = "Pending";
        else if (t.ticket_status === "admitted") normalizedStatus = "Attended";
        else if (t.ticket_status === "cancelled") normalizedStatus = "Cancelled";

        return {
          id: idNum,
          qr_id: `QHQ-${Math.floor(100000 + Math.random() * 900000)}`,
          event_id: ev.id ? String(ev.id).slice(0, 6) : "1106",
          event_name: ev.title || "Community Event",
          event_date: dateFormatted,
          booking_type: "Single",
          tier: "Single Pass",
          name: pf.full_name || "Member Attendee",
          email: pf.email || "attendee@solo-no-more.com",
          phone: pf.phone || "03001234567",
          status: normalizedStatus,
          user_status: "Confirm",
          invite_progress: "N/A",
          cnic: pf.cnic || "42101-0000000-0",
          car_number: "N/A",
          price: ev.price_pkr || ev.ticket_price || 3500,
          venue: ev.venue || "Karachi Venue",
          created_at: `${dateFormatted}, ${timeFormatted}`,
        };
      });
    }
  } catch (err) {
    console.error("Error fetching Supabase event_tickets:", err);
  }

  // Merge unique by id or combination
  const mergedMap = new Map<string, MemberBookingRecord>();
  localBookings.forEach((b) => mergedMap.set(b.id, b));
  dbBookings.forEach((b) => {
    if (!mergedMap.has(b.id)) {
      mergedMap.set(b.id, b);
    }
  });

  return Array.from(mergedMap.values()).sort((a, b) => {
    const numA = parseInt(a.id, 10);
    const numB = parseInt(b.id, 10);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numB - numA;
    }
    return b.id.localeCompare(a.id);
  });
}

/**
 * Server Action: Update booking status directly from dropdown or modal.
 */
export async function updateBookingStatusAction(
  bookingId: string,
  newStatus: "Confirm" | "Pending" | "Cancelled" | "Attended"
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdminStatus();
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const records = ensureDataFile();
  const index = records.findIndex((r) => r.id === bookingId);
  if (index >= 0) {
    records[index].status = newStatus;
    records[index].user_status = newStatus;
    writeDataFile(records);
  }

  // Also attempt Supabase update if matching UUID or event_tickets id
  try {
    await (supabaseAdmin.from("event_tickets") as any)
      .update({
        ticket_status:
          newStatus === "Confirm"
            ? "active"
            : newStatus === "Pending"
            ? "pending"
            : newStatus === "Attended"
            ? "admitted"
            : "cancelled",
      })
      .eq("id", bookingId);
  } catch {}

  return { success: true };
}

/**
 * Server Action: Delete a booking record.
 */
export async function deleteBookingAction(
  bookingId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdminStatus();
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const records = ensureDataFile();
  const filtered = records.filter((r) => r.id !== bookingId);
  writeDataFile(filtered);

  try {
    await (supabaseAdmin.from("event_tickets") as any).delete().eq("id", bookingId);
  } catch {}

  return { success: true };
}
