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
    .update({ ticket_status: "admitted" })
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
}



