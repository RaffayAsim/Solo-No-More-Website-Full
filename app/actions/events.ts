"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import { getAdminAccess, getEventAccess, getProfileRole, isArtistProfile, isRootAdmin, isUuid } from "@/lib/server/auth";
import { pktDateTimeToIso } from "@/lib/time";
import { PUBLIC_MEDIA_BUCKET, isImageDataUrl, storePublicImageDataUrl } from "@/lib/server/storage";
import { writeNotification } from "@/lib/server/notify";
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
    .select("max_capacity, scheduled_at, description")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return { success: false, error: "Official event not found." };
  }

  const claimMeta = parseEventDescription(event.description || "").metadata;
  if (claimMeta?.status === "draft" || claimMeta?.status === "pending_review") {
    return { success: false, error: "This event is not open for booking yet." };
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
    .neq("ticket_status", "cancelled");

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
      payment_status: "paid",
      payment_method: "family_pass",
      amount_paid_pkr: 0,
      tier_name: "Family VIP Pass",
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

/**
 * Server Action: Check in / admit a ticket holder at the event gate (manual button).
 * Only admins, the event's creator, or a delegated gate manager may do this, and only
 * for passes whose payment has been verified.
 */
export async function checkInAttendeeAction(
  ticketId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isUuid(ticketId)) {
    return { success: false, error: "Invalid ticket." };
  }

  const { data: ticket } = await (supabaseAdmin.from("event_tickets") as any)
    .select("id, event_id, ticket_status, payment_status")
    .eq("id", ticketId)
    .maybeSingle();

  if (!ticket) {
    return { success: false, error: "Ticket not found." };
  }

  const access = await getEventAccess(ticket.event_id, "events.door_scanner");
  if (!access.ok) {
    return { success: false, error: access.error || "Unauthorized." };
  }

  if (ticket.ticket_status === "scanned") {
    return { success: false, error: "This pass was already checked in." };
  }
  if (ticket.ticket_status !== "active" || !isTicketPaid(ticket)) {
    return { success: false, error: "This pass is not confirmed yet (payment not verified)." };
  }

  const { data: updated, error } = await (supabaseAdmin
    .from("event_tickets") as any)
    .update({ ticket_status: "scanned" })
    .eq("id", ticketId)
    .eq("ticket_status", "active")
    .select("id");

  if (error) {
    return { success: false, error: "Failed to admit attendee." };
  }
  if (!updated || updated.length === 0) {
    return { success: false, error: "This pass was already checked in." };
  }

  return { success: true };
}

/**
 * A pass counts as paid when its payment was verified. Rows created before payment
 * tracking existed have no payment_status and are treated as paid.
 */
function isTicketPaid(ticket: { payment_status?: string | null }): boolean {
  return !ticket.payment_status || ticket.payment_status === "paid";
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
  const sessionUser = { userId, email: auth.email };

  // 1. Who is saving?
  const userProfile = await getProfileRole(userId);
  const adminAccess = await getAdminAccess("events.manage");
  const isAdmin = adminAccess.ok || (await isRootAdmin(sessionUser, userProfile));
  const isPartner = !!userProfile?.is_partner;
  const isArtist = isArtistProfile(userProfile);

  if (!isAdmin && !isPartner && !isArtist) {
    return { success: false, error: "Only Admins, Partners, and Artists can create events." };
  }
  if (!isAdmin && userProfile?.account_status !== "approved") {
    return { success: false, error: "Your account must be approved before you can list events." };
  }

  if (!input.title?.trim()) {
    return { success: false, error: "Event title is required." };
  }
  if (!input.eventDate) {
    return { success: false, error: "Event date is required." };
  }

  // Date & time are entered in Pakistan time; the server runs in UTC.
  const scheduledAt = pktDateTimeToIso(input.eventDate, input.startTime);
  if (!scheduledAt) {
    return { success: false, error: "Please enter a valid event date and start time." };
  }

  // 2. When editing, load the existing event and make sure the caller may touch it.
  let existingMeta: EventRichMetadata | null = null;
  if (input.id) {
    if (!isUuid(input.id)) {
      return { success: false, error: "Event not found." };
    }
    const { data: existing } = await (supabaseAdmin.from("official_events") as any)
      .select("id, description")
      .eq("id", input.id)
      .maybeSingle();
    if (!existing) {
      return { success: false, error: "Event not found." };
    }
    const hadRichMeta = (existing.description || "").includes("SNM_EVENT_META");
    existingMeta = hadRichMeta ? parseEventDescription(existing.description).metadata : null;

    if (!isAdmin && existingMeta?.creator_id !== userId) {
      return { success: false, error: "Unauthorized: you can only edit events you created." };
    }
  }

  // 3. Tiers — sanitise what the browser sent
  const cleanTiers: EventTierPackage[] = (Array.isArray(input.tierPackages) ? input.tierPackages : [])
    .filter((t) => t && String(t.name || "").trim())
    .slice(0, 12)
    .map((t, idx) => ({
      id: String(t.id || `tier-${idx + 1}`).slice(0, 60),
      name: String(t.name).trim().slice(0, 80),
      price: Math.max(0, Math.round(Number(t.price) || 0)),
      spots: Number(t.spots) > 0 ? Math.round(Number(t.spots)) : undefined,
      perks: t.perks ? String(t.perks).slice(0, 300) : undefined,
    }));
  if (cleanTiers.length === 0) {
    return { success: false, error: "Add at least one pass tier with a name and price." };
  }

  const capacity = Math.round(Number(input.capacityLimit) || 0);
  if (capacity < 1 || capacity > 100000) {
    return { success: false, error: "Capacity must be between 1 and 100,000." };
  }

  // 4. Status & ownership
  //    - Admins choose the status and never take ownership away from the original creator.
  //    - Artists/partners always go (back) to the admin review queue.
  let finalStatus: "published" | "draft" | "pending_review";
  let creatorType: "admin" | "artist" | "partner";
  let creatorId: string;
  let creatorName: string;

  if (isAdmin) {
    finalStatus = ["published", "draft", "pending_review"].includes(input.status) ? input.status : "published";
    creatorType = existingMeta?.creator_type || input.creatorType || "admin";
    creatorId = existingMeta?.creator_id || userId;
    creatorName =
      existingMeta?.creator_name || userProfile?.full_name || userProfile?.business_name || "Solo-No-More Admin";
  } else {
    finalStatus = "pending_review";
    creatorType = isPartner ? "partner" : "artist";
    creatorId = userId;
    creatorName = userProfile?.business_name || userProfile?.full_name || "Artist / Partner";
  }

  // Artwork goes to storage. Keeping base64 images inside the description made every
  // event row megabytes large and slowed down every page that lists events.
  const publicize = async (value: string | undefined | null): Promise<string> => {
    if (!value) return "";
    if (!isImageDataUrl(value)) return value;
    return (await storePublicImageDataUrl(PUBLIC_MEDIA_BUCKET, `events/${creatorId}`, value)) || "";
  };
  const featureImage = await publicize(input.featureImage);
  const sliderImages = (
    await Promise.all((Array.isArray(input.sliderImages) ? input.sliderImages : []).slice(0, 8).map(publicize))
  ).filter(Boolean);
  const organizerAvatar = await publicize(input.organizer?.avatarUrl);
  const lineups = await Promise.all(
    (Array.isArray(input.lineups) ? input.lineups : []).slice(0, 20).map(async (l) => ({
      ...l,
      imageUrl: l?.imageUrl ? await publicize(l.imageUrl) : l?.imageUrl,
    }))
  );

  const meta: EventRichMetadata = {
    status: finalStatus,
    full_address: input.fullAddress || "",
    start_time: input.startTime || "20:00",
    end_time: input.endTime || "23:30",
    tier_packages: cleanTiers,
    partner_id: input.partnerCollaboration && input.partnerCollaboration !== "No partner" ? input.partnerCollaboration : "",
    partner_name: input.partnerCollaboration || "No partner",
    feature_image: featureImage,
    slider_images: sliderImages,
    attending_label: input.attendingLabel || "",
    visibility: input.visibility || "members_only",
    audience: input.audience || "all",
    publish_date: input.publishDate || "",
    event_category: input.eventCategory || (input.visibility === "public" ? "open_event" : "community_event"),
    organizer:
      input.organizer && input.organizer.name?.trim()
        ? {
            name: input.organizer.name.trim(),
            tagline: input.organizer.tagline?.trim() || "",
            avatarUrl: organizerAvatar,
          }
        : undefined,
    important_info: input.importantInfo && input.importantInfo.length > 0
      ? input.importantInfo
      : ["Strictly 18+ with physical CNIC required at check-in"],
    lineups,
    creator_type: creatorType,
    creator_id: creatorId,
    creator_name: creatorName,
    verification_notes: existingMeta?.verification_notes,
  };

  const serializedDescription = serializeEventDescription(input.description || "", meta);
  // The headline price is the cheapest tier ("from PKR …").
  const primaryPrice = Math.min(...cleanTiers.map((t) => t.price));
  const eventType = creatorType === "artist" || creatorType === "partner" ? "artist_split" : "platform_owned";

  const row = {
    title: input.title.trim().slice(0, 200),
    description: serializedDescription,
    venue_name: input.venueName?.trim() || "Karachi Venue",
    price: primaryPrice,
    max_capacity: capacity,
    scheduled_at: scheduledAt,
    event_type: eventType,
  };

  if (input.id) {
    const { error } = await (supabaseAdmin.from("official_events") as any).update(row).eq("id", input.id);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, eventId: input.id, isPendingVerification: finalStatus === "pending_review" };
  }

  const { data, error } = await (supabaseAdmin.from("official_events") as any)
    .insert(row)
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, eventId: data?.id, isPendingVerification: finalStatus === "pending_review" };
}

/**
 * Server Action: Admin verifies and publishes a third-party event submitted by an artist or partner.
 */
export async function verifyAndPublishEventAction(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  const adminAccess = await getAdminAccess("events.manage");
  if (!adminAccess.ok) {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }
  if (!isUuid(eventId)) {
    return { success: false, error: "Event not found." };
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
  const adminAccess = await getAdminAccess("events.manage");
  if (!adminAccess.ok) {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }
  if (!isUuid(eventId)) {
    return { success: false, error: "Event not found." };
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
        payment_status,
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
 * Server Action: Event owner confirms a booking on their own event.
 *
 * Money for paid passes is collected by the platform, so an owner can never turn an
 * unpaid booking into a valid pass — that only happens when an admin verifies the
 * payment proof. Owners can confirm bookings that are already paid (or free).
 */
export async function approveTicketByOwnerAction(
  ticketId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isUuid(ticketId)) return { success: false, error: "Ticket not found." };

  try {
    const { data: ticket } = await (supabaseAdmin.from("event_tickets") as any)
      .select("id, event_id, user_id, ticket_status, payment_status, amount_paid_pkr")
      .eq("id", ticketId)
      .maybeSingle();

    if (!ticket) {
      return { success: false, error: "Ticket not found." };
    }

    const access = await getEventAccess(ticket.event_id, "bookings.approve");
    if (!access.ok) {
      return { success: false, error: access.error || "Unauthorized." };
    }

    if (ticket.ticket_status !== "pending") {
      return { success: false, error: "This booking is not waiting for approval." };
    }
    if (ticket.payment_status !== "paid") {
      return {
        success: false,
        error: "This booking is awaiting payment verification by Solo-No-More admin. It activates automatically once the payment is approved.",
      };
    }

    const { error: updateErr } = await (supabaseAdmin.from("event_tickets") as any)
      .update({ ticket_status: "active" })
      .eq("id", ticketId)
      .eq("ticket_status", "pending");

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    if (ticket.user_id) {
      await writeNotification(
        ticket.user_id,
        "spot_available" as any,
        "🎟 TICKET APPROVED",
        `Your booking for "${access.event?.title || "this event"}" has been approved by the host. See you at the door!`
      );
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to approve ticket." };
  }
}

/**
 * Server Action: Reject/cancel a booking for an event the caller manages.
 */
export async function rejectTicketByOwnerAction(
  ticketId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isUuid(ticketId)) return { success: false, error: "Ticket not found." };

  try {
    const { data: ticket } = await (supabaseAdmin.from("event_tickets") as any)
      .select("id, event_id, user_id, ticket_status")
      .eq("id", ticketId)
      .maybeSingle();

    if (!ticket) {
      return { success: false, error: "Ticket not found." };
    }

    const access = await getEventAccess(ticket.event_id, "bookings.approve");
    if (!access.ok) {
      return { success: false, error: access.error || "Unauthorized." };
    }

    if (ticket.ticket_status === "scanned") {
      return { success: false, error: "This guest has already been admitted." };
    }

    const { error: updateErr } = await (supabaseAdmin.from("event_tickets") as any)
      .update({ ticket_status: "cancelled" })
      .eq("id", ticketId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    if (ticket.user_id) {
      await writeNotification(
        ticket.user_id,
        "spot_available" as any,
        "✕ BOOKING CANCELLED",
        `Your booking for "${access.event?.title || "this event"}" was cancelled by the host. Contact support if you already paid.`
      );
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
    /** True only when the payment was verified by Solo-No-More admin. */
    paymentVerified?: boolean;
  };
}

/**
 * Server Action: Bullet-proof ticket verification and gate admission for Door Scanner.
 * Strictly verifies ticket against currentEventId, prevents duplicate entries, and validates approval status.
 */
const TICKET_SCAN_SELECT = `
  id,
  event_id,
  ticket_status,
  payment_status,
  created_at,
  user_name,
  qr_id,
  profiles:user_id (
    full_name,
    city
  ),
  official_events:event_id (
    id,
    title
  )
`;

/**
 * Finds a ticket from whatever was scanned or typed at the door:
 *  - the ticket's UUID (member QR codes)
 *  - its printed QR id (manual / guest passes, e.g. TKT-AB12C-9F8E7D6C5B or QHQ-123456)
 *  - the first 8+ characters of the UUID (the short pass code shown on the pass)
 *
 * Each form is looked up with its own exact query. Mixing them in one filter fails,
 * because comparing a non-UUID string against the UUID id column is a database error.
 */
async function findTicketByCode(code: string, currentEventId: string): Promise<any | null> {
  const table = () => supabaseAdmin.from("event_tickets") as any;

  if (isUuid(code)) {
    const { data } = await table().select(TICKET_SCAN_SELECT).eq("id", code.toLowerCase()).maybeSingle();
    if (data) return data;
  }

  // Printed QR ids — exact match, case-insensitive. Only safe characters ever reach the query.
  if (/^[A-Za-z0-9_-]{4,64}$/.test(code)) {
    const { data } = await table().select(TICKET_SCAN_SELECT).ilike("qr_id", code).limit(2);
    if (data && data.length === 1) return data[0];
    if (data && data.length > 1) {
      // Same printed id on more than one pass: prefer the one for this event.
      return data.find((t: any) => t.event_id === currentEventId) || data[0];
    }
  }

  // Short pass code = leading characters of the ticket UUID. UUIDs sort as text ranges,
  // so a prefix lookup becomes a range query on the id column (no text casting needed).
  const hex = code.replace(/-/g, "").toLowerCase();
  if (/^[0-9a-f]{8,31}$/.test(hex)) {
    const pad = (fill: string) => {
      const full = (hex + fill.repeat(32)).slice(0, 32);
      return `${full.slice(0, 8)}-${full.slice(8, 12)}-${full.slice(12, 16)}-${full.slice(16, 20)}-${full.slice(20)}`;
    };
    const { data } = await table()
      .select(TICKET_SCAN_SELECT)
      .eq("event_id", currentEventId)
      .gte("id", pad("0"))
      .lte("id", pad("f"))
      .limit(2);
    if (data && data.length === 1) return data[0];
  }

  return null;
}

/**
 * Server Action: Ticket verification and gate admission for the Door Scanner.
 * Verifies the pass belongs to this event, that its payment was verified, and admits
 * it exactly once (two scanners racing on the same pass cannot both succeed).
 */
export async function verifyAndCheckInTicketAction({
  scannedCode,
  currentEventId,
}: {
  scannedCode: string;
  currentEventId: string;
}): Promise<VerifyTicketResult> {
  if (!isUuid(currentEventId)) {
    return { success: false, verdict: "not_found", message: "No event selected for scanning." };
  }

  // 1. Scanner authorization: admins, the event creator, or a delegated gate manager.
  const access = await getEventAccess(currentEventId, "events.door_scanner");
  if (!access.ok) {
    return {
      success: false,
      verdict: "not_found",
      message: access.user
        ? "Unauthorized: You do not have door-scanner credentials for this event."
        : "Unauthorized scanner session. Please sign in again.",
    };
  }

  // 2. Clean and parse the scanned code
  let ticketId = String(scannedCode || "").trim().slice(0, 600);

  // JSON encoded QR codes: { ticketId, eventId }
  try {
    if (ticketId.startsWith("{") && ticketId.endsWith("}")) {
      const parsed = JSON.parse(ticketId);
      if (parsed.ticketId) ticketId = String(parsed.ticketId);
      else if (parsed.id) ticketId = String(parsed.id);
      else if (parsed.qr_id) ticketId = String(parsed.qr_id);
    }
  } catch {}

  // URL format: https://.../?id=...
  if (ticketId.includes("id=")) {
    try {
      const url = new URL(ticketId.startsWith("http") ? ticketId : `https://x.invalid/${ticketId}`);
      ticketId = url.searchParams.get("id") || url.searchParams.get("ticketId") || ticketId;
    } catch {}
  }

  // Strip prefixes like "TICKET #", "PASS #", etc.
  ticketId = ticketId.replace(/^(ticket|pass)\s*#?:?\s*/i, "").trim();

  // 3. Look the ticket up
  const ticketRecord = ticketId ? await findTicketByCode(ticketId, currentEventId) : null;

  if (!ticketRecord) {
    return {
      success: false,
      verdict: "not_found",
      message: `Invalid Pass (${ticketId.slice(0, 14)}). No matching booking exists on the system.`,
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
    paymentVerified: isTicketPaid(ticketRecord),
  };

  // 4. EVENT MISMATCH CHECK
  if (ticketRecord.event_id !== currentEventId) {
    return {
      success: false,
      verdict: "wrong_event",
      message: `WRONG EVENT! This ticket is for "${targetEventTitle}", not this event. Entry Denied.`,
      ticket: ticketPayload,
    };
  }

  // 5. DUPLICATE CHECK
  if (ticketRecord.ticket_status === "scanned") {
    return {
      success: false,
      verdict: "already_admitted",
      message: `DUPLICATE SCAN! Pass for ${attendeeName} was ALREADY checked in. Entry Denied.`,
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

  // 7. PAYMENT / APPROVAL CHECK — an unverified payment never gets through the door
  if (ticketRecord.ticket_status !== "active" || !isTicketPaid(ticketRecord)) {
    return {
      success: false,
      verdict: "pending_approval",
      message: `PAYMENT NOT VERIFIED! Booking for ${attendeeName} has not been confirmed by admin yet. Entry Denied.`,
      ticket: ticketPayload,
    };
  }

  // 8. VALID -> ADMIT, atomically (only an 'active' pass can flip to 'scanned')
  const { data: admitted, error: updateErr } = await (supabaseAdmin.from("event_tickets") as any)
    .update({ ticket_status: "scanned" })
    .eq("id", ticketRecord.id)
    .eq("ticket_status", "active")
    .select("id");

  if (updateErr) {
    return {
      success: false,
      verdict: "not_found",
      message: `Database error updating admission: ${updateErr.message}`,
      ticket: ticketPayload,
    };
  }

  if (!admitted || admitted.length === 0) {
    return {
      success: false,
      verdict: "already_admitted",
      message: `DUPLICATE SCAN! Pass for ${attendeeName} was just checked in on another scanner. Entry Denied.`,
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
