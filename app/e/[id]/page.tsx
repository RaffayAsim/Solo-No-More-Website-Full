import { notFound, redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Short URL resolver for Events: /e/[shortId] -> redirects to /events/[fullId]
 */
export default async function ShortEventRedirectPage({ params }: PageProps) {
  const { id: shortOrFullId } = await params;
  if (!shortOrFullId) notFound();

  let query = (supabaseAdmin.from("official_events") as any).select("id");

  if (shortOrFullId.length === 36) {
    query = query.eq("id", shortOrFullId);
  } else {
    // Matches first 8 hex characters of the UUID prefix or slug
    query = query.ilike("id", `${shortOrFullId}%`).limit(1);
  }

  const { data: event, error } = await query.maybeSingle();

  if (error || !event) {
    notFound();
  }

  redirect(`/events/${event.id}`);
}
