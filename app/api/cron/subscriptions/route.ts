import { runSubscriptionSweep } from "@/lib/server/subscriptions";
import { getSiteUrl } from "@/lib/server/site-url";

export const dynamic = "force-dynamic";

/**
 * Daily job (see vercel.json): sends renewal reminders and ends lapsed memberships.
 * Vercel Cron calls this with "Authorization: Bearer <CRON_SECRET>"; any other caller
 * is refused, so set CRON_SECRET in the project's environment variables.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runSubscriptionSweep(await getSiteUrl());
  return Response.json(result, { status: result.error ? 500 : 200 });
}
