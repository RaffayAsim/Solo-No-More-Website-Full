"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdminStatus } from "@/app/actions/admin";
import { getSessionUserSecurely } from "@/lib/supabase/session";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getEventAccess, isUuid } from "@/lib/server/auth";
import { isValidEmail, listAllAuthUsers } from "@/lib/server/auth-users";
import { parseEventDescription } from "@/lib/event-metadata";
import { formatPkt } from "@/lib/time";
import { PUBLIC_MEDIA_BUCKET, isImageDataUrl, storePublicImageDataUrl } from "@/lib/server/storage";

export interface ArtistRecord {
  id: string;
  name: string;
  stage_name: string;
  email: string;
  phone: string;
  genre: string;
  status: "approved" | "active" | "pending" | "suspended";
  registered: string;
  total_gigs: number;
  tickets_sold: number;
  gross_revenue_pkr: number;
  payout_rate: number; // e.g. 92%
  avatar_url?: string;
  social_handle?: string;
  bio?: string;
}

export interface ApprovedMemberOption {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

/**
 * Fetch real artists telemetry and roster from Supabase database
 */
export async function getAdminArtistsDataAction(): Promise<{
  artists: ArtistRecord[];
  approvedMembers: ApprovedMemberOption[];
  stats: {
    totalArtists: number;
    activeGigs: number;
    totalTicketsSold: number;
    totalArtistPayoutsPkr: number;
  };
}> {
  try {
    await verifyAdminStatus("artists.manage");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return {
      artists: [],
      approvedMembers: [],
      stats: {
        totalArtists: 0,
        activeGigs: 0,
        totalTicketsSold: 0,
        totalArtistPayoutsPkr: 0,
      },
    };
  }

  try {
    // 1. Fetch profiles
    const { data: profiles, error: pErr } = await (supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false }) as any);

    // 2. Fetch auth users (all pages)
    const authUsers: any[] = await listAllAuthUsers().catch(() => []);
    const authMap = new Map(authUsers.map((u) => [u.id, u]));

    // 3. Fetch events and their tickets to compute real figures
    const [{ data: events }, { data: tickets }] = await Promise.all([
      (supabaseAdmin.from("official_events") as any).select("id, title, price, description, scheduled_at"),
      (supabaseAdmin.from("event_tickets") as any).select("event_id, ticket_status, payment_status, amount_paid_pkr"),
    ]);

    const eventsByCreator = new Map<string, any[]>();
    for (const ev of events || []) {
      const creatorId = parseEventDescription(ev.description || "").metadata?.creator_id;
      if (!creatorId || !(ev.description || "").includes("SNM_EVENT_META")) continue;
      eventsByCreator.set(creatorId, [...(eventsByCreator.get(creatorId) || []), ev]);
    }
    const paidByEvent = new Map<string, { count: number; gross: number }>();
    for (const t of tickets || []) {
      if (t.ticket_status === "cancelled" || t.ticket_status === "pending") continue;
      if (t.payment_status && t.payment_status !== "paid") continue;
      const cur = paidByEvent.get(t.event_id) || { count: 0, gross: 0 };
      cur.count += 1;
      cur.gross += Number(t.amount_paid_pkr) || 0;
      paidByEvent.set(t.event_id, cur);
    }

    // 4. Approved members for potential artist upgrades
    const approvedMembers: ApprovedMemberOption[] = (profiles || [])
      .filter(
        (p: any) =>
          p.account_status === "approved" &&
          p.subscription_tier !== "artist" &&
          p.subscription_tier !== "admin" &&
          !p.is_partner
      )
      .map((p: any) => {
        const u = authMap.get(p.id);
        return {
          id: p.id,
          name: p.full_name || "Member",
          email: u?.email || "",
          phone: p.phone || "",
        };
      });

    // 5. Artists are the accounts that hold the artist role — nothing is guessed from names
    const artistProfiles = (profiles || []).filter(
      (p: any) => p.subscription_tier === "artist" || p.role === "artist"
    );

    const artists: ArtistRecord[] = artistProfiles.map((p: any) => {
      const u = authMap.get(p.id);
      const artistEvents = eventsByCreator.get(p.id) || [];
      const sold = artistEvents.reduce((n, ev) => n + (paidByEvent.get(ev.id)?.count || 0), 0);
      const gross = artistEvents.reduce((n, ev) => n + (paidByEvent.get(ev.id)?.gross || 0), 0);

      const status =
        p.account_status === "approved"
          ? "approved"
          : p.account_status === "suspended"
          ? "suspended"
          : "pending";

      return {
        id: p.id,
        name: p.full_name || "Artist",
        stage_name: p.business_name || u?.user_metadata?.stage_name || p.full_name || "",
        email: u?.email || "",
        phone: p.phone || u?.user_metadata?.phone || "",
        genre: p.bio || "",
        status: status as any,
        registered: p.created_at ? formatPkt(p.created_at, { year: "numeric", month: "short", day: "numeric" }) : "",
        total_gigs: artistEvents.length,
        tickets_sold: sold,
        gross_revenue_pkr: gross,
        payout_rate: 92,
        avatar_url: p.avatar_icon,
        social_handle: p.social_link || "",
        bio: p.bio,
      };
    });

    const totalArtists = artists.length;
    const activeGigs = artists.reduce((sum, a) => sum + a.total_gigs, 0);
    const totalTicketsSold = artists.reduce((sum, a) => sum + a.tickets_sold, 0);
    const totalArtistPayoutsPkr = Math.round(
      artists.reduce((sum, a) => sum + a.gross_revenue_pkr * (a.payout_rate / 100), 0)
    );

    return {
      artists,
      approvedMembers,
      stats: {
        totalArtists,
        activeGigs,
        totalTicketsSold,
        totalArtistPayoutsPkr,
      },
    };
  } catch (err) {
    console.error("Error in getAdminArtistsDataAction:", err);
    return {
      artists: [],
      approvedMembers: [],
      stats: {
        totalArtists: 0,
        activeGigs: 0,
        totalTicketsSold: 0,
        totalArtistPayoutsPkr: 0,
      },
    };
  }
}

/**
 * Update artist account approval status in database
 */
export async function updateArtistStatusAction(
  artistId: string,
  newStatus: "approved" | "pending" | "suspended"
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdminStatus("artists.manage");

    const dbAccountStatus =
      newStatus === "approved"
        ? "approved"
        : newStatus === "suspended"
        ? "suspended"
        : "pending_vetting";

    const { error } = await (supabaseAdmin.from("profiles") as any)
      .update({ account_status: dbAccountStatus })
      .eq("id", artistId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update artist status." };
  }
}

/**
 * Grant artist privileges to an existing member
 */
export async function grantArtistAccessAction(
  userId: string,
  stageName: string,
  genre: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdminStatus("artists.manage");

    const { error } = await (supabaseAdmin.from("profiles") as any)
      .update({
        subscription_tier: "artist",
        is_partner: false,
        account_status: "approved",
        business_name: (stageName || "").trim().slice(0, 100) || null,
        bio: (genre || "").trim().slice(0, 160) || null,
      })
      .eq("id", userId)
      .neq("subscription_tier", "admin");

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to grant artist role." };
  }
}

/**
 * Create a new artist account directly from admin
 */
export async function createNewArtistAccountAction(formData: {
  fullName: string;
  stageName: string;
  email: string;
  phone: string;
  genre: string;
  password?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdminStatus("artists.manage");

    if (!isValidEmail(formData.email)) {
      return { success: false, error: "Please enter a valid email address." };
    }
    if (!formData.fullName?.trim()) {
      return { success: false, error: "Full name is required." };
    }
    if (!formData.password || formData.password.length < 8) {
      return { success: false, error: "Set a password of at least 8 characters for the artist's login." };
    }

    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: formData.email.trim(),
      password: formData.password,
      email_confirm: true,
      user_metadata: {
        full_name: formData.fullName.trim(),
        phone: (formData.phone || "").trim(),
        stage_name: (formData.stageName || "").trim(),
      },
    });

    if (authErr) {
      return { success: false, error: authErr.message };
    }

    if (!authData.user) {
      return { success: false, error: "Failed to create user auth record." };
    }

    const { error: profileErr } = await (supabaseAdmin.from("profiles") as any).upsert({
      id: authData.user.id,
      full_name: formData.fullName.trim(),
      phone: (formData.phone || "").trim() || null,
      subscription_tier: "artist",
      is_partner: false,
      account_status: "approved",
      business_name: (formData.stageName || "").trim().slice(0, 100) || null,
      bio: (formData.genre || "").trim().slice(0, 160) || null,
    });

    if (profileErr) {
      return { success: false, error: profileErr.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create artist." };
  }
}

/**
 * Save artist bank & Raast settlement details securely in auth user metadata.
 * Strictly confidential between the platform treasury and the artist.
 */
export async function saveArtistPayoutSettingsAction(formData: {
  raastId: string;
  bankIban: string;
  bankName: string;
  accountTitle: string;
}): Promise<{ success: boolean; error?: string }> {
  const auth = await getSessionUserSecurely();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  const payout = {
    raast_id: (formData.raastId || "").trim().slice(0, 60),
    bank_iban: (formData.bankIban || "").trim().slice(0, 40),
    bank_name: (formData.bankName || "").trim().slice(0, 80),
    account_title: (formData.accountTitle || "").trim().slice(0, 120),
    payout_updated_at: new Date().toISOString(),
  };

  try {
    // app_metadata is server-controlled: the account holder cannot edit it from the
    // browser, unlike user_metadata.
    const { data: userRecord } = await supabaseAdmin.auth.admin.getUserById(auth.userId);
    const existingAppMeta = userRecord?.user?.app_metadata || {};

    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(auth.userId, {
      app_metadata: { ...existingAppMeta, payout },
    });

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save settlement settings." };
  }
}

/**
 * Save artist Press Kit (EPK), Stage Name, Vibe/Music genres, and sound rider.
 */
export async function saveArtistProfileAction(formData: {
  stageName: string;
  genres: string[];
  mixLink?: string;
  bio?: string;
  soundRider?: string;
  avatarUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  const auth = await getSessionUserSecurely();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  try {
    // 1. Update profiles table
    const profileUpdate: Record<string, any> = {
      business_name: (formData.stageName || "").trim().slice(0, 100),
      vibe_tags: (Array.isArray(formData.genres) ? formData.genres : []).slice(0, 10).map((g) => String(g).slice(0, 40)),
      bio: formData.bio?.trim() || null,
      social_link: formData.mixLink?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    // Photos go to storage; only a URL is kept on the profile (never inside the login token).
    let avatarValue: string | undefined = formData.avatarUrl;
    if (isImageDataUrl(avatarValue)) {
      avatarValue = (await storePublicImageDataUrl(PUBLIC_MEDIA_BUCKET, `avatars/${auth.userId}`, avatarValue)) || undefined;
    }
    if (formData.avatarUrl !== undefined && avatarValue !== undefined) {
      profileUpdate.avatar_icon = avatarValue;
    }

    const { error: profileErr } = await (supabaseAdmin.from("profiles") as any)
      .update(profileUpdate)
      .eq("id", auth.userId);

    if (profileErr) {
      return { success: false, error: profileErr.message };
    }

    // 2. Persist extended EPK in user_metadata
    const { data: userRecord } = await supabaseAdmin.auth.admin.getUserById(auth.userId);
    const existingMeta = userRecord?.user?.user_metadata || {};

    await supabaseAdmin.auth.admin.updateUserById(auth.userId, {
      user_metadata: {
        ...existingMeta,
        stage_name: formData.stageName.trim(),
        genres: formData.genres,
        mix_link: formData.mixLink?.trim(),
        sound_rider: formData.soundRider?.trim(),
        artist_bio: formData.bio?.trim(),
        // Images are never stored in user_metadata: it is embedded in every session token.
        avatar_url: null,
        epk_updated_at: new Date().toISOString(),
      },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update artist profile." };
  }
}

/**
 * Toggle attendee check-in / gate admission status.
 * Restricted to admins, the event creator and delegated gate managers.
 */
export async function toggleAttendeeAdmissionAction(
  ticketId: string,
  newStatus: "admitted" | "active"
): Promise<{ success: boolean; error?: string }> {
  if (!isUuid(ticketId)) {
    return { success: false, error: "Ticket not found." };
  }

  try {
    const { data: ticket } = await (supabaseAdmin.from("event_tickets") as any)
      .select("id, event_id, ticket_status, payment_status")
      .eq("id", ticketId)
      .maybeSingle();
    if (!ticket) return { success: false, error: "Ticket not found." };

    const access = await getEventAccess(ticket.event_id, "events.door_scanner");
    if (!access.ok) {
      return { success: false, error: access.error || "Unauthorized." };
    }

    if (ticket.ticket_status === "pending" || ticket.ticket_status === "cancelled") {
      return { success: false, error: "This pass is not confirmed (payment not verified or booking cancelled)." };
    }
    if (ticket.payment_status && ticket.payment_status !== "paid") {
      return { success: false, error: "This pass is not confirmed yet (payment not verified)." };
    }

    // The database stores an admitted guest as "scanned".
    const dbStatus = newStatus === "admitted" ? "scanned" : "active";
    const { error } = await (supabaseAdmin.from("event_tickets") as any)
      .update({ ticket_status: dbStatus })
      .eq("id", ticketId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update gate admission." };
  }
}
