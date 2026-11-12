"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdminStatus } from "@/app/actions/admin";
import { getAllApplicationsAction } from "@/app/actions/member-applications";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import crypto from "crypto";
import { isUuid } from "@/lib/server/auth";
import {
  findAuthUserByEmail,
  generateTempPassword,
  isDuplicateUserError,
  isValidEmail,
  listAllAuthUsers,
} from "@/lib/server/auth-users";
import { parseEventDescription } from "@/lib/event-metadata";

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

function makeManualQrId(): string {
  // 10 random hex chars: unguessable and effectively collision-free
  return `QHQ-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

/** Price of a pass type for an event, taken from the event's own tiers. */
function resolvePassPrice(event: any, passType: string): number {
  const base = Number(event?.price) || 0;
  const hasRichMeta = (event?.description || "").includes("SNM_EVENT_META");
  const tiers = hasRichMeta ? parseEventDescription(event.description).metadata.tier_packages || [] : [];
  const match = tiers.find((t: any) => String(t.name || "").toLowerCase() === (passType || "").toLowerCase());
  const single = match ? Number(match.price) || 0 : base;
  return (passType || "").toLowerCase().includes("couple") && !match ? single * 2 : single;
}

async function insertManualTicket(params: {
  eventId: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  userPhone?: string;
  passType: string;
  confirmed: boolean;
}): Promise<{ success: boolean; error?: string; qrId?: string }> {
  if (!isUuid(params.eventId)) {
    return { success: false, error: "Please select a valid event." };
  }

  const { data: event } = await (supabaseAdmin.from("official_events") as any)
    .select("id, title, price, description, max_capacity")
    .eq("id", params.eventId)
    .maybeSingle();
  if (!event) return { success: false, error: "Event not found." };

  if (params.userId) {
    const { data: existing } = await (supabaseAdmin.from("event_tickets") as any)
      .select("id")
      .eq("event_id", params.eventId)
      .eq("user_id", params.userId)
      .neq("ticket_status", "cancelled")
      .limit(1);
    if (existing && existing.length > 0) {
      return { success: false, error: "This user already has a pass for this event." };
    }
  }

  const { count } = await (supabaseAdmin.from("event_tickets") as any)
    .select("id", { count: "exact", head: true })
    .eq("event_id", params.eventId)
    .neq("ticket_status", "cancelled");
  if (count !== null && count >= Number(event.max_capacity || 0)) {
    return { success: false, error: "This event is at full capacity." };
  }

  const qrId = makeManualQrId();
  const { error } = await (supabaseAdmin.from("event_tickets") as any).insert({
    event_id: params.eventId,
    user_id: params.userId,
    ticket_status: params.confirmed ? "active" : "pending",
    // An admin issuing a confirmed pass by hand vouches for the payment.
    payment_status: params.confirmed ? "paid" : "pending",
    payment_method: "manual_admin",
    is_guest_entry: !params.userId,
    qr_id: qrId,
    user_name: params.userName,
    user_email: params.userEmail || null,
    user_phone: params.userPhone || null,
    tier_name: params.passType || "Single Pass",
    is_couple_booking: (params.passType || "").toLowerCase().includes("couple"),
    amount_paid_pkr: resolvePassPrice(event, params.passType),
  });

  if (error) {
    console.error("[manual-ticketing] Ticket insert failed:", error);
    return {
      success: false,
      error: /duplicate|unique/i.test(error.message || "")
        ? "This user already has a pass for this event."
        : "Could not create the pass. If this keeps happening, run the latest Supabase migration (phase18).",
    };
  }

  return { success: true, qrId };
}

/**
 * Fetch events and selectable users for the manual ticketing desk.
 */
export async function getManualTicketingDataAction(): Promise<{
  users: ManualUserOption[];
  events: ManualEventOption[];
}> {
  try {
    await verifyAdminStatus("bookings.approve");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { users: [], events: [] };
  }

  // 1. Events
  const { data: dbEvents } = await (supabaseAdmin
    .from("official_events") as any)
    .select("id, title, scheduled_at, price, venue_name")
    .order("scheduled_at", { ascending: false });

  const events: ManualEventOption[] = (dbEvents || []).map((e: any) => ({
    id: String(e.id),
    title: e.title || "Untitled Event",
    scheduled_at: e.scheduled_at,
    // Calendar date in Pakistan time, YYYY-MM-DD
    formatted_date: e.scheduled_at
      ? new Date(e.scheduled_at).toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" })
      : "",
    ticket_price: Number(e.price || 0),
    venue_name: e.venue_name || "",
    city: "Karachi",
  }));

  // 2. Users: every auth account, enriched with profile details
  const userMap = new Map<string, ManualUserOption>();

  const [{ data: profiles }, authUsers] = await Promise.all([
    (supabaseAdmin.from("profiles") as any).select("id, full_name, phone"),
    listAllAuthUsers().catch(() => [] as any[]),
  ]);
  const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));

  for (const u of authUsers) {
    const email = u.email || "";
    const profile = profileMap.get(u.id);
    userMap.set(u.id, {
      id: u.id,
      name: profile?.full_name || u.user_metadata?.full_name || email.split("@")[0] || "User",
      email,
      phone: profile?.phone || u.user_metadata?.phone || "",
    });
  }

  // 3. Applicants who do not have an account yet (issued as guest passes)
  try {
    const apps = await getAllApplicationsAction();
    const knownEmails = new Set(Array.from(userMap.values()).map((u) => u.email.toLowerCase()));
    for (const a of apps) {
      if (a.email && !knownEmails.has(a.email.toLowerCase())) {
        knownEmails.add(a.email.toLowerCase());
        userMap.set("app-" + a.id, {
          id: "app-" + a.id,
          name: a.fullName || a.username || "Applicant",
          email: a.email,
          phone: a.phone || "",
          username: a.username,
        });
      }
    }
  } catch (err) {
    if (isRedirectError(err)) throw err;
  }

  const users = Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name));
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
    await verifyAdminStatus("bookings.approve");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Booking approval permission required." };
  }

  if (!params.eventId) {
    return { success: false, error: "Please select an event." };
  }
  if (!params.userEmail && !params.userId) {
    return { success: false, error: "Please select a user." };
  }

  const result = await insertManualTicket({
    eventId: params.eventId,
    userId: isUuid(params.userId) ? params.userId : null,
    userName: (params.userName || "").trim().slice(0, 120) || "Attendee",
    userEmail: (params.userEmail || "").trim().toLowerCase(),
    userPhone: params.userPhone?.trim(),
    passType: params.passType || "Single Pass",
    confirmed: params.ticketStatus === "Confirm",
  });

  if (!result.success) return { success: false, error: result.error };
  return { success: true, ticketId: result.qrId };
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
}): Promise<{ success: boolean; error?: string; userId?: string; qrId?: string; tempPassword?: string }> {
  let admin: { isRoot: boolean };
  try {
    admin = await verifyAdminStatus("bookings.approve");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: "Unauthorized. Booking approval permission required." };
  }

  if (!params.fullName?.trim() || !params.email?.trim()) {
    return { success: false, error: "Full Name and Email are required." };
  }
  if (!isValidEmail(params.email)) {
    return { success: false, error: "Please enter a valid email address." };
  }
  if (params.password && params.password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  const roleLower = (params.role || "").toLowerCase();
  if (roleLower.includes("admin") && !admin.isRoot) {
    return { success: false, error: "Only the platform owner can create admin accounts." };
  }

  // No shared default password — generate a unique one-off when none was chosen.
  const tempPassword = params.password ? undefined : generateTempPassword();

  // 1. Create or retrieve Auth User
  let userId: string | null = null;
  let createdNew = false;
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: params.email.trim(),
    password: params.password || tempPassword!,
    email_confirm: true,
    user_metadata: {
      full_name: params.fullName.trim(),
      username: params.username?.trim() || params.email.split("@")[0],
      phone: params.phone?.trim() || "",
      city: params.city?.trim() || "Karachi",
    },
  });

  if (authError) {
    if (isDuplicateUserError(authError.message)) {
      const existingUser = await findAuthUserByEmail(params.email);
      if (!existingUser) return { success: false, error: authError.message };
      userId = existingUser.id;
    } else {
      return { success: false, error: authError.message };
    }
  } else {
    userId = authData?.user?.id || null;
    createdNew = !!userId;
  }

  // 2. Profile — only set role/tier on accounts created right now. An existing
  //    member's tier and status are never overwritten from the ticketing desk.
  if (userId && createdNew) {
    const isGuest = roleLower.includes("guest");
    const isPartner = roleLower.includes("partner");
    const tier = roleLower.includes("admin") ? "admin" : isGuest ? "none" : isPartner ? "partner" : "member";
    const { error: profileErr } = await (supabaseAdmin.from("profiles") as any).upsert({
      id: userId,
      full_name: params.fullName.trim(),
      phone: params.phone?.trim() || null,
      city: ["Karachi", "Lahore", "Islamabad"].includes(params.city?.trim() || "") ? params.city!.trim() : "Karachi",
      gender: params.gender || null,
      subscription_tier: tier,
      is_partner: isPartner,
      is_guest: isGuest,
      account_status: "approved",
    });
    if (profileErr) console.error("[manual-ticketing] Profile upsert failed:", profileErr);
  }

  // 3. Assign Ticket if event provided
  let qrId: string | undefined;
  if (params.eventId) {
    const result = await insertManualTicket({
      eventId: params.eventId,
      userId,
      userName: params.fullName.trim().slice(0, 120),
      userEmail: params.email.trim().toLowerCase(),
      userPhone: params.phone?.trim(),
      passType: params.passType || "Single Pass",
      confirmed: true,
    });
    if (!result.success) {
      return {
        success: false,
        error: `${createdNew ? "The account was created, but the pass was not: " : ""}${result.error}`,
        userId: userId || undefined,
        tempPassword: createdNew ? tempPassword : undefined,
      };
    }
    qrId = result.qrId;
  }

  return {
    success: true,
    userId: userId || undefined,
    qrId,
    tempPassword: createdNew ? tempPassword : undefined,
  };
}
