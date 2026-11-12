-- ============================================================================
-- Solo-No-More: Phase 19 — Membership expiry & renewal
--
-- HOW TO RUN: Supabase Dashboard → SQL Editor → paste this whole file → Run.
-- Safe to run more than once.
--
-- Adds the columns that track when a paid membership ends. Existing members keep
-- their tier with NO end date (nothing expires for them) until they next pay or an
-- admin sets a date — see the optional step at the bottom.
-- ============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_billing_cycle TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_reminder_sent_at TIMESTAMPTZ;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_billing_cycle_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_billing_cycle_check
  CHECK (subscription_billing_cycle IS NULL OR subscription_billing_cycle IN ('monthly', 'annual'));

-- Used by the daily expiry job
CREATE INDEX IF NOT EXISTS profiles_subscription_expiry_idx
  ON public.profiles (subscription_expires_at)
  WHERE subscription_expires_at IS NOT NULL;

NOTIFY pgrst, 'reload schema';

-- ────────────────────────────────────────────────────────────────────────────
-- OPTIONAL — give today's existing paid members an end date.
-- Leave this commented out to let them keep their tier with no expiry.
-- To start everyone on a one-month period from today, remove the two dashes at the
-- start of each of the five lines below and run this file again.
-- ────────────────────────────────────────────────────────────────────────────
-- UPDATE public.profiles
-- SET subscription_expires_at = NOW() + INTERVAL '1 month',
--     subscription_billing_cycle = 'monthly'
-- WHERE subscription_tier IN ('member', 'family')
--   AND subscription_expires_at IS NULL;

-- VERIFY — should return three rows
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
  AND column_name IN ('subscription_expires_at', 'subscription_billing_cycle', 'subscription_reminder_sent_at')
ORDER BY column_name;
