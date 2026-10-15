"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import {
  serializeEventDescription,
  parseEventDescription,
  EventRichMetadata,
  EventTierPackage,
  EventOrganizerInfo,
  EventPerformerLineup,
  isEventConcluded,
} from "@/lib/event-metadata";

export type EventClaimResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Helper to securely get current logged-in user ID via Server Session cookie.
 */
async function getUserIdSecurely(): Promise<{ userId: string } | { error: string }> {
  const result = await getSessionUserSecurely();
  if ("error" in result) {
    return { error: result.error };
  }
  return { userId: result.userId };
}

/**
 * Server Action: Claim a free VIP ticket to an Official Event (Family Tier only).
 */
export async function claimTicket(eventId: string): Promise<EventClaimResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }
  const userId = authCheck.userId;

  // 1. Fetch user subscription tier and role to enforce authorization
  const { data: profile, error: profileError } = await (supabaseAdmin
    .from("profiles") as any)
    .select("subscription_tier, is_partner")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return { success: false, error: "Profile not found." };
  }

  if (profile.is_partner || profile.subscription_tier === "admin" || profile.subscription_tier === "artist") {
    return {
      success: false,
      error: "Partner, artist, and admin accounts cannot claim event passes. Please use a verified personal member account.",
    };
  }

  if (profile.subscription_tier !== "family") {
    return {
      success: false,
      error: "Official VIP ticket claims are exclusive to the Family Tier. Please upgrade to claim your free pass.",
    };
  }

  // 2. Fetch event to verify capacity and scheduled time
  const { data: event, error: eventError } = await (supabaseAdmin
    .from("official_events") as any)
    .select("max_capacity, scheduled_at")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return { success: false, error: "Official event not found." };
  }

  // Prevent booking tickets for past events
  if (new Date(event.scheduled_at).getTime() < Date.now()) {
    return {
      success: false,
      error: "This event has already taken place. Ticket bookings are closed.",
    };
  }

  // 3. Count currently claimed active tickets
  const { count, error: countError } = await (supabaseAdmin
    .from("event_tickets") as any)
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("ticket_status", "active");

  if (countError) {
    return { success: false, error: "Failed to verify event capacity." };
  }

  if (count !== null && count >= event.max_capacity) {
    return { success: false, error: "This event is fully booked." };
  }

  // 4. Insert ticket record. Enforces unique constraint (event_id, user_id)
  const { error: insertError } = await (supabaseAdmin
    .from("event_tickets") as any)
    .insert({
      event_id: eventId,
      user_id: userId,
      ticket_status: "active",
    });

  if (insertError) {
    if (insertError.message?.toLowerCase().includes("duplicate") ||
        insertError.message?.toLowerCase().includes("unique")) {
      return { success: false, error: "You have already claimed a VIP ticket for this event." };
    }
    return { success: false, error: "Failed to claim ticket. Please try again." };
  }

  return { success: true };
}

export interface SubmitEventTicketPaymentInput {
  eventId: string;
  amountPkr: number;
  paymentMethod: "raast" | "sadapay" | "bank_transfer";
  transactionRef: string;
}

/**
 * Server Action: Submit Raast / SadaPay / Bank Transfer payment proof for Event Ticket purchase.
 */
export async function submitEventTicketPaymentAction(
  input: SubmitEventTicketPaymentInput
): Promise<EventClaimResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }
  const userId = authCheck.userId;

  if (!input.transactionRef || !input.transactionRef.trim()) {
    return { success: false, error: "Transaction Reference / TID is required." };
  }

  // Check role restrictions: Partners, Admins, Artists cannot purchase attendee passes
  const { data: userProfile } = await (supabaseAdmin
    .from("profiles") as any)
    .select("subscription_tier, is_partner")
    .eq("id", userId)
    .single();

  if (userProfile?.is_partner || userProfile?.subscription_tier === "admin" || userProfile?.subscription_tier === "artist") {
    return {
      success: false,
      error: "Partner, artist, and admin accounts cannot purchase event tickets as attendees.",
    };
  }

  // 1. Fetch event to verify capacity, title and scheduled time
  const { data: event, error: eventError } = await (supabaseAdmin
    .from("official_events") as any)
    .select("title, max_capacity, scheduled_at")
    .eq("id", input.eventId)
    .single();

  if (eventError || !event) {
    return { success: false, error: "Official event not found." };
  }

  // Prevent booking tickets for past events
  if (new Date(event.scheduled_at).getTime() < Date.now()) {
    return {
      success: false,
      error: "This event has already taken place. Ticket bookings are closed.",
    };
  }

  // 2. Count active tickets
  const { count } = await (supabaseAdmin
    .from("event_tickets") as any)
    .select("*", { count: "exact", head: true })
    .eq("event_id", input.eventId)
    .eq("ticket_status", "active");

  if (count !== null && count >= event.max_capacity) {
    return { success: false, error: "This event is already fully booked." };
  }

  // 3. Record payment submission
  const { error: insertError } = await (supabaseAdmin
    .from("payment_submissions") as any)
    .insert({
      user_id: userId,
      amount_pkr: input.amountPkr,
      tier_requested: `event_ticket:${input.eventId}`,
      payment_method: input.paymentMethod,
      transaction_ref: input.transactionRef.trim(),
      status: "pending",
    });

  if (insertError) {
    if (!insertError.message?.includes("schema cache") && !insertError.message?.includes("does not exist")) {
      return { success: false, error: "Failed to record payment proof. Please try again." };
    }
  }

  // 4. Notify user
  try {
    const { writeNotification } = await import("@/app/actions/notifications");
    await writeNotification(
      userId,
      "spot_available" as any,
      "🎟 TICKET PROOF RECEIVED",
      `Your transaction TID (${input.transactionRef.trim()}) for "${event.title}" is queued for verification.`
    );
  } catch {}

  return { success: true };
}

/**
 * Developer Testing Action: Simulate instant ticket booking.
 */
export async function buyTicketDevInstantAction(eventId: string): Promise<EventClaimResult> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }
  const userId = authCheck.userId;

  // Check role restrictions: Partners, Admins, Artists cannot purchase attendee passes
  const { data: userProfile } = await (supabaseAdmin
    .from("profiles") as any)
    .select("subscription_tier, is_partner")
    .eq("id", userId)
    .single();

  if (userProfile?.is_partner || userProfile?.subscription_tier === "admin" || userProfile?.subscription_tier === "artist") {
    return {
      success: false,
      error: "Partner, artist, and admin accounts cannot purchase event tickets as attendees.",
    };
  }

  const { error } = await (supabaseAdmin
    .from("event_tickets") as any)
    .upsert({
      event_id: eventId,
      user_id: userId,
      ticket_status: "active",
    }, { onConflict: "event_id,user_id" });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export interface CreateArtistEventInput {
  title: string;
  description?: string;
  venue_name: string;
  price: number;
  max_capacity: number;
  scheduled_at: string;
}

/**
 * Server Action: Create an artist / promoter ticketed event (artist_split).
 */
export async function createArtistEventAction(
  input: CreateArtistEventInput
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }

  if (!input.title?.trim()) {
    return { success: false, error: "Event title is required." };
  }

  const { data, error } = await (supabaseAdmin
    .from("official_events") as any)
    .insert({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      venue_name: input.venue_name?.trim() || "Karachi Venue",
      event_type: "artist_split",
      price: Number(input.price) || 0,
      max_capacity: Number(input.max_capacity) || 100,
      scheduled_at: input.scheduled_at,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message || "Failed to list artist event." };
  }

  return { success: true, eventId: data?.id };
}

/**
 * Server Action: Check in / admit a ticket holder at the event gate.
 */
export async function checkInAttendeeAction(
  ticketId: string
): Promise<{ success: boolean; error?: string }> {
  const authCheck = await getUserIdSecurely();
  if ("error" in authCheck) {
    return { success: false, error: authCheck.error };
  }

  const { error } = await (supabaseAdmin
    .from("event_tickets") as any)
    .update({ ticket_status: "scanned" })
    .eq("id", ticketId);

  if (error) {
    return { success: false, error: "Failed to admit attendee." };
  }

  return { success: true };
}

export interface SaveRichEventInput {
  id?: string;
  title: string;
  status: "published" | "draft" | "pending_review";
  description: string;
  eventDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  venueName: string;
  fullAddress?: string;
  tierPackages: EventTierPackage[];
  partnerCollaboration?: string;
  featureImage?: string;
  sliderImages?: string[];
  attendingLabel?: string;
  capacityLimit: number;
  visibility: "members_only" | "public" | "invite_only";
  audience: "all" | "females_only" | "couples" | "vip_members";
  publishDate?: string;
  organizer?: EventOrganizerInfo | null;
  importantInfo: string[];
  lineups: EventPerformerLineup[];
  creatorType?: "admin" | "artist" | "partner";
  eventCategory?: "open_event" | "community_event";
}

/**
 * Server Action: Unified Rich Event Create & Update (Used by Admin, Artist & Partner).
 */
export async function saveRichEventAction(
  input: SaveRichEventInput
): Promise<{ success: boolean; eventId?: string; isPendingVerification?: boolean; error?: string }> {
  const auth = await getSessionUserSecurely();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }
  const userId = auth.userId;
  const userEmail = auth.email?.toLowerCase() || "";

  // 1. Check user roles
  const authorizedEmails = [
    (process.env.ADMIN_EMAIL || "").toLowerCase(),
    "raffay.asim6@gmail.com",
    "admin@solonomore.com",
    "vibe.tester@solonomore.com",
  ].filter(Boolean);

  const { data: userProfile } = await (supabaseAdmin.from("profiles") as any)
    .select("full_name, subscription_tier, is_partner, business_name")
    .eq("id", userId)
    .single();

  const isAdmin = authorizedEmails.includes(userEmail) || userProfile?.subscription_tier === "admin";
  const isPartner = !!userProfile?.is_partner;
  const isArtist = userProfile?.subscription_tier === "family" || !!userProfile?.business_name;

  if (!isAdmin && !isPartner && !isArtist) {
    return { success: false, error: "Only Admins, Partners, and Artists can create events." };
  }

  if (!input.title?.trim()) {
    return { success: false, error: "Event title is required." };
  }
  if (!input.eventDate) {
    return { success: false, error: "Event date is required." };
  }

  // Determine final status & creator type
  let finalStatus: "published" | "draft" | "pending_review" = input.status || "published";
  let creatorType: "admin" | "artist" | "partner" = "admin";

  if (!isAdmin) {
    // 3rd-party events created by artists or partners must go to admin verification queue
    finalStatus = "pending_review";
    creatorType = isPartner ? "partner" : "artist";
  } else {
    creatorType = input.creatorType || "admin";
  }

  // Construct scheduled_at timestamp
  const timeStr = input.startTime ? input.startTime.padStart(5, "0") : "20:00";
  const scheduledAt = new Date(`${input.eventDate}T${timeStr}:00`).toISOString();

  // Construct metadata
  const meta: EventRichMetadata = {
    status: finalStatus,
    full_address: input.fullAddress || "",
    start_time: input.startTime || "20:00",
    end_time: input.endTime || "23:30",
    tier_packages: input.tierPackages && input.tierPackages.length > 0
      ? input.tierPackages
      : [{ id: "tier-1", name: "General Admission", price: 2500, spots: 100 }],
    partner_id: input.partnerCollaboration && input.partnerCollaboration !== "No partner" ? input.partnerCollaboration : "",
    partner_name: input.partnerCollaboration || "No partner",
    feature_image: input.featureImage || "",
    slider_images: input.sliderImages || [],
    attending_label: input.attendingLabel || "253 people attending",
    visibility: input.visibility || "members_only",
    audience: input.audience || "all",
    publish_date: input.publishDate || "",
    event_category: input.eventCategory || (input.visibility === "public" ? "open_event" : "community_event"),
    organizer:
      input.organizer && input.organizer.name?.trim()
        ? {
            name: input.organizer.name.trim(),
            tagline: input.organizer.tagline?.trim() || "",
            avatarUrl: input.organizer.avatarUrl || "",
          }
        : input.organizer === null
        ? undefined
        : undefined,
    important_info: input.importantInfo && input.importantInfo.length > 0
      ? input.importantInfo
      : ["Strictly 18+ with physical CNIC required at check-in"],
    lineups: input.lineups || [],
    creator_type: creatorType,
    creator_id: userId,
    creator_name: userProfile?.full_name || userProfile?.business_name || (isAdmin ? "Solo-No-More Admin" : "Artist / Partner"),
  };

  const serializedDescription = serializeEventDescription(input.description || "", meta);
  const primaryPrice = meta.tier_packages?.[0]?.price ?? 0;
  const capacity = Number(input.capacityLimit) || 100;
  const eventType = creatorType === "artist" || creatorType === "partner" ? "artist_split" : "platform_owned";

  if (input.id) {
    const { error } = await (supabaseAdmin.from("official_events") as any)
      .update({
        title: input.title.trim(),
        description: serializedDescription,
        venue_name: input.venueName?.trim() || "Karachi Venue",
        price: primaryPrice,
        max_capacity: capacity,
        scheduled_at: scheduledAt,
        event_type: eventType,
      })
      .eq("id", input.id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, eventId: input.id, isPendingVerification: finalStatus === "pending_review" };
  } else {
    const { data, error } = await (supabaseAdmin.from("official_events") as any)
      .insert({
        title: input.title.trim(),
        description: serializedDescription,
        venue_name: input.venueName?.trim() || "Karachi Venue",
        price: primaryPrice,
        max_capacity: capacity,
        scheduled_at: scheduledAt,
        event_type: eventType,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, eventId: data?.id, isPendingVerification: finalStatus === "pending_review" };
  }
}

/**
 * Server Action: Admin verifies and publishes a third-party event submitted by an artist or partner.
 */
export async function verifyAndPublishEventAction(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await getSessionUserSecurely();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }
  const userEmail = auth.email?.toLowerCase() || "";
  const authorizedEmails = [
    (process.env.ADMIN_EMAIL || "").toLowerCase(),
    "raffay.asim6@gmail.com",
    "admin@solonomore.com",
    "vibe.tester@solonomore.com",
  ].filter(Boolean);

  const { data: userProfile } = await (supabaseAdmin.from("profiles") as any)
    .select("subscription_tier")
    .eq("id", auth.userId)
    .single();

  const isAdmin = authorizedEmails.includes(userEmail) || userProfile?.subscription_tier === "admin";
  if (!isAdmin) {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const { data: event, error: fetchErr } = await (supabaseAdmin.from("official_events") as any)
    .select("description")
    .eq("id", eventId)
    .single();

  if (fetchErr || !event) {
    return { success: false, error: "Event not found." };
  }

  const { cleanDescription, metadata } = parseEventDescription(event.description);
  metadata.status = "published";
  metadata.verification_notes = "Verified & Approved by Admin Ops";

  const updatedDescription = serializeEventDescription(cleanDescription, metadata);

  const { error: updateErr } = await (supabaseAdmin.from("official_events") as any)
    .update({ description: updatedDescription })
    .eq("id", eventId);

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  return { success: true };
}

/**
 * Server Action: Delete official event (Admin only).
 */
export async function deleteRichEventAction(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await getSessionUserSecurely();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }
  const userEmail = auth.email?.toLowerCase() || "";
  const authorizedEmails = [
    (process.env.ADMIN_EMAIL || "").toLowerCase(),
    "raffay.asim6@gmail.com",
    "admin@solonomore.com",
    "vibe.tester@solonomore.com",
  ].filter(Boolean);

  const { data: userProfile } = await (supabaseAdmin.from("profiles") as any)
    .select("subscription_tier")
    .eq("id", auth.userId)
    .single();

  const isAdmin = authorizedEmails.includes(userEmail) || userProfile?.subscription_tier === "admin";
  if (!isAdmin) {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const { error } = await (supabaseAdmin.from("official_events") as any)
    .delete()
    .eq("id", eventId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}export interface EventBookingRecord {
  ticketId: string;
  eventId: string;
  userId: string;
  ticketStatus: "pending" | "active" | "admitted" | "cancelled" | "scanned";
  createdAt: string;
  passerName: string;
  passCity: string | null;
  passCode: string; // first 8 chars of ticketId uppercased
  tier: string;
}

/**
 * Server Action: Fetch all tickets for events owned/created by the current user (artist or partner).
 * Each event must have creator_id matching the session user in its metadata.
 */
export async function getEventBookingsForOwnerAction(): Promise<{
  success: boolean;
  bookings: EventBookingRecord[];
  error?: string;
}> {
  const auth = await getSessionUserSecurely();
  if ("error" in auth) {
    return { success: false, bookings: [], error: auth.error };
  }
  const userId = auth.userId;

  try {
    // 1. Fetch all events, filter those where creator_id === userId via metadata
    const { data: allEvents } = await (supabaseAdmin.from("official_events") as any)
      .select("id, title, description, price")
      .order("scheduled_at", { ascending: false });

    const ownedEventIds: string[] = [];
    const eventTierMap: Map<string, string> = new Map();

    for (const ev of allEvents || []) {
      try {
        const { metadata } = parseEventDescription(ev.description);
        if (metadata.creator_id === userId) {
          ownedEventIds.push(ev.id);
          const tier = metadata.tier_packages?.[0]?.name || "General Admission";
          eventTierMap.set(ev.id, tier);
        }
      } catch {}
    }

    if (ownedEventIds.length === 0) {
      return { success: true, bookings: [] };
    }

    // 2. Fetch tickets for owned events with member profiles
    const { data: tickets, error } = await (supabaseAdmin.from("event_tickets") as any)
      .select(`
        id,
        event_id,
        user_id,
        ticket_status,
        created_at,
        profiles:user_id (
          full_name,
          city
        )
      `)
      .in("event_id", ownedEventIds)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, bookings: [], error: error.message };
    }

    const bookings: EventBookingRecord[] = (tickets || []).map((t: any) => ({
      ticketId: t.id,
      eventId: t.event_id,
      userId: t.user_id,
      ticketStatus: t.ticket_status as EventBookingRecord["ticketStatus"],
      createdAt: t.created_at,
      passerName: t.profiles?.full_name || "Solo Member",
      passCity: t.profiles?.city || null,
      passCode: String(t.id).slice(0, 8).toUpperCase(),
      tier: eventTierMap.get(t.event_id) || "General Admission",
    }));

    return { success: true, bookings };
  } catch (err: any) {
    return { success: false, bookings: [], error: err.message || "Failed to fetch bookings." };
  }
}

/**
 * Server Action: Approve a pending booking for an event owned by the current user.
 * Only the event creator (artist/partner) can approve their own event bookings.
 */
export async function approveTicketByOwnerAction(
  ticketId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await getSessionUserSecurely();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }
  const userId = auth.userId;

  try {
    // 1. Get the ticket to find the event
    const { data: ticket, error: ticketErr } = await (supabaseAdmin.from("event_tickets") as any)
      .select("id, event_id, ticket_status")
      .eq("id", ticketId)
      .single();

    if (ticketErr || !ticket) {
      return { success: false, error: "Ticket not found." };
    }

    // 2. Verify this event belongs to the current user
    const { data: ev, error: evErr } = await (supabaseAdmin.from("official_events") as any)
      .select("id, description")
      .eq("id", ticket.event_id)
      .single();

    if (evErr || !ev) {
      return { success: false, error: "Event not found." };
    }

    const { metadata } = parseEventDescription(ev.description);
    if (metadata.creator_id !== userId) {
      return { success: false, error: "Unauthorized: You are not the creator of this event." };
    }

    // 3. Approve ticket (pending → active)
    const { error: updateErr } = await (supabaseAdmin.from("event_tickets") as any)
      .update({ ticket_status: "active" })
      .eq("id", ticketId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // 4. Notify member
    try {
      const { writeNotification } = await import("@/app/actions/notifications");
      await writeNotification(
        ticket.user_id,
        "spot_available" as any,
        "🎟 TICKET APPROVED",
        `Your booking for this event has been approved by the host. See you at the door!`
      );
    } catch {}

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to approve ticket." };
  }
}

/**
 * Server Action: Reject/cancel a booking for an event owned by the current user.
 */
export async function rejectTicketByOwnerAction(
  ticketId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await getSessionUserSecurely();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }
  const userId = auth.userId;

  try {
    const { data: ticket, error: ticketErr } = await (supabaseAdmin.from("event_tickets") as any)
      .select("id, event_id, user_id")
      .eq("id", ticketId)
      .single();

    if (ticketErr || !ticket) {
      return { success: false, error: "Ticket not found." };
    }

    const { data: ev, error: evErr } = await (supabaseAdmin.from("official_events") as any)
      .select("id, description")
      .eq("id", ticket.event_id)
      .single();

    if (evErr || !ev) {
      return { success: false, error: "Event not found." };
    }

    const { metadata } = parseEventDescription(ev.description);
    if (metadata.creator_id !== userId) {
      return { success: false, error: "Unauthorized: You are not the creator of this event." };
    }

    const { error: updateErr } = await (supabaseAdmin.from("event_tickets") as any)
      .update({ ticket_status: "cancelled" })
      .eq("id", ticketId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to reject ticket." };
  }
}

export interface VerifyTicketResult {
  success: boolean;
  verdict:
    | "valid_admitted"
    | "already_admitted"
    | "wrong_event"
    | "pending_approval"
    | "cancelled"
    | "not_found";
  message: string;
  ticket?: {
    id: string;
    event_id: string;
    ticket_status: string;
    created_at: string;
    attendeeName: string;
    attendeeCity?: string;
    targetEventTitle?: string;
  };
}

/**
 * Server Action: Bullet-proof ticket verification and gate admission for Door Scanner.
 * Strictly verifies ticket against currentEventId, prevents duplicate entries, and validates approval status.
 */
export async function verifyAndCheckInTicketAction({
  scannedCode,
  currentEventId,
}: {
  scannedCode: string;
  currentEventId: string;
}): Promise<VerifyTicketResult> {
  const auth = await getSessionUserSecurely();
  if ("error" in auth) {
    return { success: false, verdict: "not_found", message: "Unauthorized scanner session." };
  }

  // 1. Clean and parse scanned code
  let ticketId = scannedCode.trim();
  let candidateEventId: string | null = null;

  // Handle JSON encoded QR codes: { ticketId, eventId }
  try {
    if (ticketId.startsWith("{") && ticketId.endsWith("}")) {
      const parsed = JSON.parse(ticketId);
      if (parsed.ticketId) ticketId = String(parsed.ticketId);
      else if (parsed.id) ticketId = String(parsed.id);
      if (parsed.eventId) candidateEventId = String(parsed.eventId);
      else if (parsed.event_id) candidateEventId = String(parsed.event_id);
    }
  } catch {}

  // Handle URL format: https://.../?id=...&event_id=...
  if (ticketId.includes("id=")) {
    try {
      const url = new URL(ticketId.startsWith("http") ? ticketId : `https://x.com/${ticketId}`);
      ticketId = url.searchParams.get("id") || ticketId;
      if (!candidateEventId) candidateEventId = url.searchParams.get("event_id") || url.searchParams.get("eventId");
    } catch {}
  }

  // Strip prefixes like "TICKET #", "PASS #", etc.
  ticketId = ticketId.replace(/^(ticket|pass)\s*#?:?\s*/i, "").trim();

  // 1. Scanner Authorization Check
  const scannerEmail = auth.email?.toLowerCase() || "";
  const authorizedAdminEmails = [
    (process.env.ADMIN_EMAIL || "").toLowerCase(),
    "raffay.asim6@gmail.com",
    "admin@solonomore.com",
    "subadmin@solonomore.com",
    "vibe.tester@solonomore.com",
  ].filter(Boolean);

  const { data: scannerProfile } = await (supabaseAdmin.from("profiles") as any)
    .select("subscription_tier, is_partner")
    .eq("id", auth.userId)
    .maybeSingle();

  const isScannerAdmin = authorizedAdminEmails.includes(scannerEmail) || scannerProfile?.subscription_tier === "admin";

  // Check event ownership if not global admin
  if (!isScannerAdmin) {
    const { data: targetEv } = await (supabaseAdmin.from("official_events") as any)
      .select("description")
      .eq("id", currentEventId)
      .maybeSingle();

    if (targetEv) {
      const { metadata } = parseEventDescription(targetEv.description || "");
      const isOwner = metadata?.creator_id === auth.userId;
      // Also check delegated team managers
      let isDelegated = false;
      try {
        const { getTeamDelegationsAction } = await import("@/app/actions/team-permissions");
        const delegations = await getTeamDelegationsAction();
        if (
          delegations?.some(
            (m: any) =>
              m.manager_user_id === auth.userId &&
              m.status === "active" &&
              m.permissions?.includes("events.door_scanner") &&
              (m.type === "sub_admin" || m.delegator_id === metadata?.creator_id)
          )
        ) {
          isDelegated = true;
        }
      } catch {}

      if (!isOwner && !isDelegated && scannerProfile?.subscription_tier !== "manager") {
        return {
          success: false,
          verdict: "not_found",
          message: "Unauthorized: You do not have door-scanner credentials for this event venue.",
        };
      }
    }
  }

  // 2. Fetch ticket from Supabase (by exact ID, exact qr_id, or prefix match)
  let ticketRecord: any = null;
  const { data: exactMatch } = await (supabaseAdmin.from("event_tickets") as any)
    .select(`
      id,
      event_id,
      ticket_status,
      created_at,
      user_name,
      qr_id,
      profiles:user_id (
        full_name,
        city
      ),
      official_events:event_id (
        id,
        title,
        description
      )
    `)
    .or(`id.eq.${ticketId},qr_id.eq.${ticketId}`)
    .maybeSingle();

  if (exactMatch) {
    ticketRecord = exactMatch;
  } else if (ticketId.length >= 6) {
    const { data: prefixMatches } = await (supabaseAdmin.from("event_tickets") as any)
      .select(`
        id,
        event_id,
        ticket_status,
        created_at,
        user_name,
        qr_id,
        profiles:user_id (
          full_name,
          city
        ),
        official_events:event_id (
          id,
          title,
          description
        )
      `)
      .or(`id.ilike.${ticketId}%,qr_id.ilike.${ticketId}%`)
      .limit(1);

    if (prefixMatches && prefixMatches.length > 0) {
      ticketRecord = prefixMatches[0];
    }
  }

  if (!ticketRecord) {
    return {
      success: false,
      verdict: "not_found",
      message: `Invalid Pass QR (${ticketId.slice(0, 10)}). No matching booking exists on the system.`,
    };
  }

  const attendeeName = ticketRecord.user_name || ticketRecord.profiles?.full_name || "Verified Attendee";
  const attendeeCity = ticketRecord.profiles?.city || "Karachi";
  const targetEventTitle = ticketRecord.official_events?.title || "Another Event";

  const ticketPayload = {
    id: ticketRecord.id,
    event_id: ticketRecord.event_id,
    ticket_status: ticketRecord.ticket_status,
    created_at: ticketRecord.created_at,
    attendeeName,
    attendeeCity,
    targetEventTitle,
  };

  // 3. BULLET-PROOF EVENT MISMATCH CHECK
  if (ticketRecord.event_id !== currentEventId) {
    return {
      success: false,
      verdict: "wrong_event",
      message: `WRONG EVENT! This ticket is for "${targetEventTitle}", not this event. Entry Denied.`,
      ticket: ticketPayload,
    };
  }

  // 4. DUPLICATE CHECK
  if (ticketRecord.ticket_status === "admitted" || ticketRecord.ticket_status === "scanned") {
    return {
      success: false,
      verdict: "already_admitted",
      message: `DUPLICATE SCAN! Pass for ${attendeeName} was ALREADY checked in. Entry Denied.`,
      ticket: ticketPayload,
    };
  }

  // 5. PENDING APPROVAL CHECK
  if (ticketRecord.ticket_status === "pending") {
    return {
      success: false,
      verdict: "pending_approval",
      message: `PENDING APPROVAL! Booking for ${attendeeName} is not yet approved by the host.`,
      ticket: ticketPayload,
    };
  }

  // 6. CANCELLED CHECK
  if (ticketRecord.ticket_status === "cancelled") {
    return {
      success: false,
      verdict: "cancelled",
      message: `VOID TICKET! Booking for ${attendeeName} was cancelled or refunded. Entry Denied.`,
      ticket: ticketPayload,
    };
  }

  // 7. VALID & CLEARED -> ADMIT ATTENDEE!
  const { error: updateErr } = await (supabaseAdmin.from("event_tickets") as any)
    .update({ ticket_status: "scanned" })
    .eq("id", ticketRecord.id);

  if (updateErr) {
    return {
      success: false,
      verdict: "not_found",
      message: `Database error updating admission: ${updateErr.message}`,
      ticket: ticketPayload,
    };
  }

  return {
    success: true,
    verdict: "valid_admitted",
    message: `ACCESS GRANTED! Welcome, ${attendeeName}.`,
    ticket: {
      ...ticketPayload,
      ticket_status: "scanned",
    },
  };
}


