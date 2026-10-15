import { notFound, redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Short URL resolver for Beacons: /b/[shortId] -> redirects to /beacon/[fullId]
 */
export default async function ShortBeaconRedirectPage({ params }: PageProps) {
  const { id: shortOrFullId } = await params;
  if (!shortOrFullId) notFound();

  let query = (supabaseAdmin.from("beacons") as any).select("id");

  if (shortOrFullId.length === 36) {
    query = query.eq("id", shortOrFullId);
  } else {
    // Matches first 8 hex characters of the UUID prefix
    query = query.ilike("id", `${shortOrFullId}%`).limit(1);
  }

  const { data: beacon, error } = await query.maybeSingle();

  if (error || !beacon) {
    notFound();
  }

  redirect(`/beacon/${beacon.id}`);
}
