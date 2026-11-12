import "server-only";

/**
 * Server-only subscription lifecycle: activation, renewal, reminders and expiry.
 *
 * A paid tier (member / family / partner) bought through the app carries an expiry
 * date. Paying again before it lapses extends from the current expiry, so nobody
 * loses days by renewing early. Accounts with no expiry date (created by an admin, or
 * from before this feature) are left alone until an admin or a payment sets one.
 */
import { supabaseAdmin } from "@/lib/supabase/admin";
import { writeNotification } from "@/lib/server/notify";
import { sendEmail } from "@/lib/server/email";
import { MEMBERSHIP_PLANS, type BillingCycle } from "@/lib/payment-config";
import { formatPkt } from "@/lib/time";

export type PaidTier = "member" | "family" | "partner";
const PAID_TIERS: string[] = ["member", "family", "partner"];
export const REMINDER_DAYS_BEFORE = 5;

function addCycle(from: Date, cycle: BillingCycle): Date {
  const d = new Date(from.getTime());
  const day = d.getUTCDate();
  if (cycle === "annual") d.setUTCFullYear(d.getUTCFullYear() + 1);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  // 31 Jan + 1 month must be the end of February, not early March.
  if (d.getUTCDate() !== day) d.setUTCDate(0);
  return d;
}

/** New expiry after a payment: extends the current period if it has not lapsed yet. */
export function computeNewExpiry(currentExpiry: string | null | undefined, cycle: BillingCycle, now = new Date()): Date {
  const current = currentExpiry ? new Date(currentExpiry) : null;
  const base = current && !Number.isNaN(current.getTime()) && current.getTime() > now.getTime() ? current : now;
  return addCycle(base, cycle);
}

function planName(tier: string): string {
  return (MEMBERSHIP_PLANS as any)[tier]?.name || `${tier.toUpperCase()} membership`;
}

async function getAuthEmail(userId: string): Promise<string | null> {
  try {
    const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
    return data?.user?.email || null;
  } catch {
    return null;
  }
}

/**
 * Activates or renews a paid tier after a verified payment.
 * Returns the new expiry date, or an error message.
 */
export async function activateSubscription(
  userId: string,
  tier: PaidTier,
  cycle: BillingCycle
): Promise<{ success: true; expiresAt: string } | { success: false; error: string }> {
  const { data: profile } = await (supabaseAdmin.from("profiles") as any)
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return { success: false, error: "Profile not found." };
  if (profile.subscription_tier === "admin") {
    return { success: false, error: "Admin accounts do not hold a paid membership." };
  }

  // Renewing the same tier extends it; switching tier starts a fresh period.
  const sameTier = profile.subscription_tier === tier;
  const expiresAt = computeNewExpiry(sameTier ? profile.subscription_expires_at : null, cycle).toISOString();

  const update: any = {
    subscription_tier: tier,
    subscription_expires_at: expiresAt,
    subscription_billing_cycle: cycle,
    subscription_reminder_sent_at: null,
  };
  if (tier === "partner") update.is_partner = true;

  let { error } = await (supabaseAdmin.from("profiles") as any).update(update).eq("id", userId);
  if (error && /subscription_(expires_at|billing_cycle|reminder_sent_at)/.test(error.message || "")) {
    // Expiry columns not created yet (phase19 migration pending): still grant the tier.
    const fallback: any = { subscription_tier: tier };
    if (tier === "partner") fallback.is_partner = true;
    ({ error } = await (supabaseAdmin.from("profiles") as any).update(fallback).eq("id", userId));
  }
  if (error) return { success: false, error: error.message };
  return { success: true, expiresAt };
}

interface SubscriptionProfile {
  id: string;
  full_name?: string | null;
  subscription_tier?: string | null;
  subscription_expires_at?: string | null;
  subscription_reminder_sent_at?: string | null;
  is_partner?: boolean | null;
}

/**
 * Applies the expiry rules to one profile:
 *  - past the expiry date → the paid tier is removed (account stays approved)
 *  - within 5 days of expiry → one reminder (in-app + email)
 * Returns what happened so callers can refresh their copy of the profile.
 */
export async function applySubscriptionRules(
  profile: SubscriptionProfile,
  options: { siteUrl?: string } = {}
): Promise<"none" | "reminded" | "expired"> {
  if (!profile?.subscription_expires_at || !PAID_TIERS.includes(profile.subscription_tier || "")) return "none";

  const expiry = new Date(profile.subscription_expires_at).getTime();
  if (Number.isNaN(expiry)) return "none";
  const now = Date.now();
  const tier = profile.subscription_tier as string;
  const renewUrl = options.siteUrl ? `${options.siteUrl}/dashboard/upgrade` : undefined;
  const firstName = (profile.full_name || "").split(" ")[0] || "there";

  if (expiry <= now) {
    // Conditional on the expiry we just read, so a renewal that landed a moment ago is never undone.
    const update: any = { subscription_tier: "none", subscription_reminder_sent_at: null };
    if (tier === "partner") update.is_partner = false;
    const { data: changed } = await (supabaseAdmin.from("profiles") as any)
      .update(update)
      .eq("id", profile.id)
      .eq("subscription_tier", tier)
      .eq("subscription_expires_at", profile.subscription_expires_at)
      .select("id");
    if (!changed || changed.length === 0) return "none";

    await writeNotification(
      profile.id,
      "spot_available" as any,
      "⏳ MEMBERSHIP EXPIRED",
      `Your ${planName(tier)} period has ended. Renew from the Upgrade Hub to get your benefits back.`
    );
    const email = await getAuthEmail(profile.id);
    if (email) {
      await sendEmail({
        to: email,
        subject: `Your ${planName(tier)} membership has expired`,
        heading: "Your membership has expired",
        paragraphs: [
          `Hi ${firstName},`,
          `Your ${planName(tier)} period ended on ${formatPkt(profile.subscription_expires_at, { day: "numeric", month: "long", year: "numeric" })}. Your account is still active, but member benefits are paused until you renew.`,
        ],
        button: renewUrl ? { label: "Renew membership", url: renewUrl } : undefined,
      });
    }
    return "expired";
  }

  const reminderWindowStart = expiry - REMINDER_DAYS_BEFORE * 24 * 60 * 60 * 1000;
  if (now >= reminderWindowStart && !profile.subscription_reminder_sent_at) {
    // Claim the reminder first so two page loads cannot both send it.
    const { data: claimed } = await (supabaseAdmin.from("profiles") as any)
      .update({ subscription_reminder_sent_at: new Date().toISOString() })
      .eq("id", profile.id)
      .is("subscription_reminder_sent_at", null)
      .select("id");
    if (!claimed || claimed.length === 0) return "none";

    const dateLabel = formatPkt(profile.subscription_expires_at, { day: "numeric", month: "long", year: "numeric" });
    await writeNotification(
      profile.id,
      "spot_available" as any,
      "🔔 MEMBERSHIP RENEWAL DUE",
      `Your ${planName(tier)} membership ends on ${dateLabel}. Renew from the Upgrade Hub to keep your benefits.`
    );
    const email = await getAuthEmail(profile.id);
    if (email) {
      await sendEmail({
        to: email,
        subject: `Your ${planName(tier)} membership ends on ${dateLabel}`,
        heading: "Time to renew your membership",
        paragraphs: [
          `Hi ${firstName},`,
          `Your ${planName(tier)} membership ends on ${dateLabel}. Renew before then and the new period is added on top of your remaining days.`,
        ],
        button: renewUrl ? { label: "Renew membership", url: renewUrl } : undefined,
      });
    }
    return "reminded";
  }

  return "none";
}

/** Daily sweep (cron): reminders and expiries for everyone, even if they have not logged in. */
export async function runSubscriptionSweep(siteUrl?: string): Promise<{ checked: number; reminded: number; expired: number; error?: string }> {
  const windowEnd = new Date(Date.now() + REMINDER_DAYS_BEFORE * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await (supabaseAdmin.from("profiles") as any)
    .select("id, full_name, subscription_tier, subscription_expires_at, subscription_reminder_sent_at, is_partner")
    .in("subscription_tier", PAID_TIERS)
    .not("subscription_expires_at", "is", null)
    .lte("subscription_expires_at", windowEnd)
    .limit(500);

  if (error) return { checked: 0, reminded: 0, expired: 0, error: error.message };

  let reminded = 0;
  let expired = 0;
  for (const profile of data || []) {
    const result = await applySubscriptionRules(profile, { siteUrl });
    if (result === "reminded") reminded++;
    if (result === "expired") expired++;
  }
  return { checked: (data || []).length, reminded, expired };
}
