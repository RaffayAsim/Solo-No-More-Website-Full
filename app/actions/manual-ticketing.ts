"use server";

import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdminStatus } from "@/app/actions/admin";
import { getAllApplicationsAction } from "@/app/actions/member-applications";
import { getAllAdminBookingsAction, MemberBookingRecord } from "@/app/actions/admin-bookings";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export interface ManualUserOption {
  id: string;
  name: string;
  email: string;
  phone?: string;
  username?: string;
}

export interface ManualEventOption {
  id: string;
  title: string;
  scheduled_at: string;
  formatted_date: string;
  ticket_price?: number;
  venue_name?: string;
  city?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const BOOKINGS_FILE = path.join(DATA_DIR, "admin_bookings.json");

/**
 * Fetch all available users (profiles + auth users + applications + bookings)
 */
export async function getManualTicketingDataAction(): Promise<{
  users: ManualUserOption[];
  events: ManualEventOption[];
}> {
  try {
    await verifyAdminStatus();
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { users: [], events: [] };
  }

  // 1. Fetch Events
  const { data: dbEvents } = await (supabaseAdmin
    .from("official_events") as any)
    .select("id, title, scheduled_at, ticket_price, venue_name, city")
    .order("scheduled_at", { ascending: false });

  const events: ManualEventOption[] = (dbEvents || []).map((e: any) => {
    let formattedDate = "";
    if (e.scheduled_at) {
      try {
        const d = new Date(e.scheduled_at);
        formattedDate = d.toISOString().split("T")[0]; // YYYY-MM-DD format as in Image 2
      } catch {
        formattedDate = e.scheduled_at;
      }
    }
    return {
      id: String(e.id),
      title: e.title || "Untitled Event",
      scheduled_at: e.scheduled_at,
      formatted_date: formattedDate,
      ticket_price: Number(e.ticket_price || 0),
      venue_name: e.venue_name || "",
      city: e.city || "Karachi",
    };
  });

  // 2. Fetch Users from profiles, auth, and bookings
  const userMap = new Map<string, ManualUserOption>();

  // A. Profiles
  const { data: profiles } = await (supabaseAdmin
    .from("profiles") as any)
    .select("id, full_name, phone, city");

  // B. Auth Users
  try {
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
    if (authData && authData.users) {
      for (const u of authData.users) {
        const email = u.email || "";
        const profile = (profiles || []).find((p: any) => p.id === u.id);
        const name = profile?.full_name || u.user_metadata?.full_name || email.split("@")[0] || "User";
        userMap.set(u.id, {
          id: u.id,
          name,
          email,
          phone: profile?.phone || u.user_metadata?.phone || "",
        });
      }
    }
  } catch (err) {
    console.error("Error listing auth users:", err);
  }

  // C. Fallback/Seed from admin bookings to make sure known sample users exist
  try {
    const bookings = await getAllAdminBookingsAction();
    for (const b of bookings) {
      if (b.email) {
        const existingKey = Array.from(userMap.values()).find(
          (u) => u.email.toLowerCase() === b.email.toLowerCase()
        );
        if (!existingKey) {
          const fakeId = "user-" + b.id;
          userMap.set(fakeId, {
            id: fakeId,
            name: b.name || "Member User",
            email: b.email,
            phone: b.phone || "",
          });
        }
      }
    }
  } catch (err) {
    console.error("Error loading bookings for users:", err);
  }

  // D. Applications
  try {
    const apps = await getAllApplicationsAction();
    for (const a of apps) {
      if (a.email) {
        const existing = Array.from(userMap.values()).find(
          (u) => u.email.toLowerCase() === a.email.toLowerCase()
        );
        if (!existing) {
          const fakeId = "app-" + a.id;
          userMap.set(fakeId, {
            id: fakeId,
            name: a.fullName || a.username || "Applicant",
            email: a.email,
            phone: a.phone || "",
            username: a.username,
          });
        }
      }
    }
  } catch (err) {
    console.error("Error loading apps for users:", err);
  }

  const users = Array.from(userMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return { users, events };
}

/**
 * Assign a ticket to an existing user
 */
export async function adminAssignExistingUserTicketAction(params: {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  eventId: string;
  eventTitle: string;
  eventDate?: string;
  passType: string;
  ticketStatus: "Confirm" | "Pending";
}): Promise<{ success: boolean; error?: string; ticketId?: string }> {
  try {
    await verifyAdminStatus();
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  if (!params.eventId) {
    return { success: false, error: "Please select an event." };
  }
  if (!params.userEmail && !params.userId) {
    return { success: false, error: "Please select a user." };
  }

  const qrId = `QHQ-${Math.floor(100000 + Math.random() * 900000)}`;
  const bookingId = String(Date.now().toString().slice(-4));

  // 1. If valid UUID user_id and UUID event_id, insert into event_tickets
  const isValidUuid = (s: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

  if (isValidUuid(params.userId) && isValidUuid(params.eventId)) {
    try {
      await (supabaseAdmin.from("event_tickets") as any).upsert({
        event_id: params.eventId,
        user_id: params.userId,
        ticket_status: params.ticketStatus === "Confirm" ? "active" : "pending",
      });
    } catch (e) {
      console.error("Warning: event_tickets upsert error:", e);
    }
  }

  // 2. Add to admin_bookings.json so it reflects in Member Bookings table & statistics
  try {
    let records: MemberBookingRecord[] = [];
    if (fs.existsSync(BOOKINGS_FILE)) {
      const raw = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      records = JSON.parse(raw);
    }

    const newRecord: MemberBookingRecord = {
      id: bookingId,
      qr_id: qrId,
      event_id: params.eventId,
      event_name: params.eventTitle,
      event_date: params.eventDate || new Date().toLocaleDateString("en-US"),
      booking_type: params.passType.toLowerCase().includes("couple") ? "Couple" : "Single",
      tier: params.passType,
      name: params.userName,
      email: params.userEmail,
      phone: params.userPhone || "03000000000",
      status: params.ticketStatus,
      user_status: "Confirm",
      invite_progress: "N/A",
      cnic: "42101-0000000-0",
      car_number: "N/A",
      price: params.passType.toLowerCase().includes("couple") ? 5000 : 2500,
      venue: "Official Venue",
      created_at: new Date().toLocaleString("en-US"),
    };

    records.unshift(newRecord);
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving manual booking record:", err);
  }

  return { success: true, ticketId: qrId };
}

/**
 * Create a new user AND assign ticket in one step
 */
export async function adminCreateUserAndAssignTicketAction(params: {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  role: string;
  password?: string;
  city?: string;
  eventId: string;
  eventTitle: string;
  eventDate?: string;
  passType?: string;
}): Promise<{ success: boolean; error?: string; userId?: string; qrId?: string }> {
  try {
    await verifyAdminStatus();
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  if (!params.fullName?.trim() || !params.email?.trim()) {
    return { success: false, error: "Full Name and Email are required." };
  }

  const generatedPassword = params.password && params.password.length >= 6
    ? params.password
    : "SoloNoMore2026!";

  // 1. Create or retrieve Auth User
  let userId: string | null = null;
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: params.email.trim(),
    password: generatedPassword,
    email_confirm: true,
    user_metadata: {
      full_name: params.fullName.trim(),
      username: params.username?.trim() || params.email.split("@")[0],
      phone: params.phone?.trim() || "",
      city: params.city?.trim() || "Karachi",
      gender: params.gender || "male",
    },
  });

  if (authError) {
    if (
      authError.message.toLowerCase().includes("already registered") ||
      authError.message.toLowerCase().includes("duplicate")
    ) {
      const { data: userLookup } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = userLookup.users.find(
        (u) => u.email?.toLowerCase() === params.email.trim().toLowerCase()
      );
      if (existingUser) {
        userId = existingUser.id;
      } else {
        return { success: false, error: authError.message };
      }
    } else {
      return { success: false, error: authError.message };
    }
  } else {
    userId = authData?.user?.id || null;
  }

  // Map role to subscription_tier
  let tier = "member";
  if (params.role.toLowerCase().includes("guest")) tier = "guest";
  else if (params.role.toLowerCase().includes("partner")) tier = "partner";
  else if (params.role.toLowerCase().includes("admin")) tier = "admin";

  // 2. Upsert Profile
  if (userId) {
    try {
      await (supabaseAdmin.from("profiles") as any).upsert({
        id: userId,
        full_name: params.fullName.trim(),
        phone: params.phone?.trim() || null,
        city: params.city?.trim() || "Karachi",
        subscription_tier: tier,
        account_status: "approved",
      });
    } catch (e) {
      console.error("Profile upsert notice:", e);
    }
  }

  // 3. Assign Ticket if event provided
  let qrId = "";
  if (params.eventId) {
    qrId = `QHQ-${Math.floor(100000 + Math.random() * 900000)}`;
    const bookingId = String(Date.now().toString().slice(-4));

    const isValidUuid = (s: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

    if (userId && isValidUuid(userId) && isValidUuid(params.eventId)) {
      try {
        await (supabaseAdmin.from("event_tickets") as any).upsert({
          event_id: params.eventId,
          user_id: userId,
          ticket_status: "active",
        });
      } catch (e) {
        console.error("Warning: event_tickets upsert error:", e);
      }
    }

    // Save to bookings json
    try {
      let records: MemberBookingRecord[] = [];
      if (fs.existsSync(BOOKINGS_FILE)) {
        const raw = fs.readFileSync(BOOKINGS_FILE, "utf-8");
        records = JSON.parse(raw);
      }

      const passType = params.passType || "Single Pass";
      const newRecord: MemberBookingRecord = {
        id: bookingId,
        qr_id: qrId,
        event_id: params.eventId,
        event_name: params.eventTitle || "Official Event",
        event_date: params.eventDate || new Date().toLocaleDateString("en-US"),
        booking_type: passType.toLowerCase().includes("couple") ? "Couple" : "Single",
        tier: passType,
        name: params.fullName.trim(),
        email: params.email.trim(),
        phone: params.phone?.trim() || "03000000000",
        status: "Confirm",
        user_status: "Confirm",
        invite_progress: "N/A",
        cnic: "42101-0000000-0",
        car_number: "N/A",
        price: 2500,
        venue: "Official Venue",
        created_at: new Date().toLocaleString("en-US"),
      };

      records.unshift(newRecord);
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(records, null, 2), "utf-8");
    } catch (err) {
      console.error("Error appending manual booking:", err);
    }
  }

  return { success: true, userId: userId || undefined, qrId: qrId || undefined };
}
