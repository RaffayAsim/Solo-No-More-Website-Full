-- ============================================================================
-- Solo-No-More: Phase 18 — Security lockdown, bank-transfer payments, missing tables
--
-- HOW TO RUN
--   Supabase Dashboard → SQL Editor → New query → paste this whole file → Run.
--   It is safe to run more than once (every step checks before it changes anything).
--
-- WHAT IT DOES
--   1. Creates the tables the app expects but the database does not have yet:
--        notifications, event_feedback, payment_submissions,
--        membership_applications, platform_settings
--   2. Locks down Row Level Security so the public (anon) key cannot be used to
--      edit profiles, mint tickets, or read applications / settings.
--   3. Fixes ticket + beacon rules (pending payments, withdrawals, slot counting).
--   4. Adds missing profile columns and private/public storage buckets for images.
--
-- All writes in the app go through server actions using the service-role key, which
-- bypasses RLS — so removing the browser-side write policies does not break the app.
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram_screenshot_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT false;

-- Members could previously UPDATE their own row directly with the public key —
-- including subscription_tier ('admin'), account_status and is_partner.
-- Profile edits now only happen through the server.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Keep: a signed-in user can read their own profile row (used by the dashboard menu).
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- New sign-ups always start as a regular, un-vetted account. Partner / artist / admin
-- access can no longer be self-assigned through sign-up metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_city TEXT := COALESCE(NEW.raw_user_meta_data ->> 'city', 'Karachi');
BEGIN
  IF v_city NOT IN ('Karachi', 'Lahore', 'Islamabad') THEN
    v_city := 'Karachi';
  END IF;

  INSERT INTO public.profiles (id, full_name, bio, social_link, city, avatar_icon, is_partner)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'bio',
    NEW.raw_user_meta_data ->> 'social_link',
    v_city,
    '👾',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ────────────────────────────────────────────────────────────────────────────
-- 2. BEACON APPLICATIONS — allow 'withdrawn'
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.beacon_applications DROP CONSTRAINT IF EXISTS beacon_applications_status_check;
ALTER TABLE public.beacon_applications
  ADD CONSTRAINT beacon_applications_status_check
  CHECK (status IN ('pending', 'approved', 'declined', 'withdrawn'));


-- ────────────────────────────────────────────────────────────────────────────
-- 3. BEACON SLOT COUNTING
--    - A full squad no longer flips the beacon to 'completed' ("meetup concluded").
--      It stays 'active' so the host can still edit it and a freed slot can be refilled.
--    - Approving into a full beacon is refused by the database itself, so two
--      approvals racing for the last slot cannot both succeed.
--    - Slots are released when an approval is revoked or the application is deleted.
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_beacon_slot_fill()
RETURNS TRIGGER AS $$
DECLARE
  v_was_approved BOOLEAN;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'approved' THEN
      UPDATE public.beacons
      SET filled_slots = GREATEST(filled_slots - 1, 0)
      WHERE id = OLD.beacon_id;
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_was_approved := false;
  ELSE
    v_was_approved := (OLD.status = 'approved');
  END IF;

  -- Newly approved → take a slot (or refuse if none is left)
  IF NEW.status = 'approved' AND NOT v_was_approved THEN
    UPDATE public.beacons
    SET filled_slots = filled_slots + 1
    WHERE id = NEW.beacon_id AND filled_slots < total_slots;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'BEACON_FULL: no slots left on this beacon';
    END IF;
  END IF;

  -- Approval revoked → release the slot
  IF v_was_approved AND NEW.status <> 'approved' THEN
    UPDATE public.beacons
    SET filled_slots = GREATEST(filled_slots - 1, 0)
    WHERE id = NEW.beacon_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_beacon_application_status_change ON public.beacon_applications;
CREATE TRIGGER on_beacon_application_status_change
  AFTER INSERT OR UPDATE OF status ON public.beacon_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_beacon_slot_fill();

DROP TRIGGER IF EXISTS on_beacon_application_deleted ON public.beacon_applications;
CREATE TRIGGER on_beacon_application_deleted
  AFTER DELETE ON public.beacon_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_beacon_slot_fill();

-- Repair existing data: recount slots from the approved applications…
UPDATE public.beacons b
SET filled_slots = LEAST(
  b.total_slots,
  (SELECT COUNT(*) FROM public.beacon_applications a
    WHERE a.beacon_id = b.id AND a.status = 'approved')
)
WHERE b.filled_slots IS DISTINCT FROM LEAST(
  b.total_slots,
  (SELECT COUNT(*) FROM public.beacon_applications a
    WHERE a.beacon_id = b.id AND a.status = 'approved')
);

-- …and re-open beacons that were marked 'completed' only because they filled up,
-- if the meetup has not happened yet.
UPDATE public.beacons
SET status = 'active'
WHERE status = 'completed'
  AND scheduled_at IS NOT NULL
  AND scheduled_at > NOW();


-- ────────────────────────────────────────────────────────────────────────────
-- 4. EVENT TICKETS — pending payments, guest passes, safe uniqueness
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS pair_code TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS is_couple_booking BOOLEAN DEFAULT false;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS is_guest_entry BOOLEAN DEFAULT false;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS invited_by_email TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS invited_by_name TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS tier_id TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS tier_name TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS amount_paid_pkr NUMERIC DEFAULT 0;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS user_phone TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS qr_id TEXT;

-- Guest / manual passes have no user account
ALTER TABLE public.event_tickets ALTER COLUMN user_id DROP NOT NULL;

-- 'pending' = reserved, payment not verified yet (never valid at the door)
ALTER TABLE public.event_tickets DROP CONSTRAINT IF EXISTS event_tickets_status_check;
ALTER TABLE public.event_tickets
  ADD CONSTRAINT event_tickets_status_check
  CHECK (ticket_status IN ('pending', 'active', 'scanned', 'cancelled'));

UPDATE public.event_tickets SET payment_status = 'pending' WHERE payment_status IS NULL;
UPDATE public.event_tickets SET payment_status = 'pending'
  WHERE payment_status NOT IN ('pending', 'submitted', 'paid', 'rejected', 'refunded');

ALTER TABLE public.event_tickets DROP CONSTRAINT IF EXISTS event_tickets_payment_status_check;
ALTER TABLE public.event_tickets
  ADD CONSTRAINT event_tickets_payment_status_check
  CHECK (payment_status IN ('pending', 'submitted', 'paid', 'rejected', 'refunded'));

-- "One ticket per user per event" blocked couple bookings and re-booking after a
-- cancellation. Replace it with: one LIVE personal ticket per user per event.
ALTER TABLE public.event_tickets DROP CONSTRAINT IF EXISTS event_tickets_unique_user_event;
DROP INDEX IF EXISTS public.event_tickets_one_live_ticket_per_user;
CREATE UNIQUE INDEX event_tickets_one_live_ticket_per_user
  ON public.event_tickets (event_id, user_id)
  WHERE user_id IS NOT NULL
    AND ticket_status <> 'cancelled'
    AND COALESCE(is_guest_entry, false) = false;

CREATE INDEX IF NOT EXISTS idx_event_tickets_pair_code ON public.event_tickets (pair_code);
CREATE INDEX IF NOT EXISTS idx_event_tickets_qr_id ON public.event_tickets (qr_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_payment_status ON public.event_tickets (payment_status);
CREATE INDEX IF NOT EXISTS idx_event_tickets_payment_reference ON public.event_tickets (payment_reference);
CREATE INDEX IF NOT EXISTS idx_event_tickets_event_id ON public.event_tickets (event_id);

-- Members could previously INSERT their own (free, active) ticket with the public key.
DROP POLICY IF EXISTS "Users can claim own tickets" ON public.event_tickets;

-- Keep: members can read their own tickets.
DROP POLICY IF EXISTS "Users can view own tickets" ON public.event_tickets;
CREATE POLICY "Users can view own tickets"
  ON public.event_tickets FOR SELECT
  USING (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────────────────────
-- 5. NOTIFICATIONS (table was missing — in-app notifications were silently dropped)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type               TEXT        NOT NULL,
  title              TEXT        NOT NULL,
  body               TEXT        NOT NULL,
  related_beacon_id  UUID        REFERENCES public.beacons(id) ON DELETE SET NULL,
  is_read            BOOLEAN     NOT NULL DEFAULT false,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- (in case an older version of the table exists with a differently named column)
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS related_beacon_id UUID REFERENCES public.beacons(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id, is_read, created_at DESC);

-- One time-based alert per (user, type, beacon) — now also covers the
-- "pending requests waiting" reminder, which used to repeat on every dashboard load.
DROP INDEX IF EXISTS public.notifications_dedup_idx;
DELETE FROM public.notifications n
USING public.notifications newer
WHERE n.related_beacon_id IS NOT NULL
  AND n.user_id = newer.user_id
  AND n.type = newer.type
  AND n.related_beacon_id = newer.related_beacon_id
  AND n.type IN ('beacon_near_start', 'beacon_no_attendees', 'beacon_not_full', 'beacon_no_interest',
                 'attendance_reminder', 'post_event_vibe_check', 'beacon_full', 'pending_request_reminder')
  AND (n.created_at, n.id) < (newer.created_at, newer.id);
CREATE UNIQUE INDEX notifications_dedup_idx
  ON public.notifications (user_id, type, related_beacon_id)
  WHERE related_beacon_id IS NOT NULL
    AND type IN (
      'beacon_near_start',
      'beacon_no_attendees',
      'beacon_not_full',
      'beacon_no_interest',
      'attendance_reminder',
      'post_event_vibe_check',
      'beacon_full',
      'pending_request_reminder'
    );

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────────────────────
-- 6. EVENT FEEDBACK (post-meetup vibe check — table was missing)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.event_feedback (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  beacon_id   UUID        NOT NULL REFERENCES public.beacons(id) ON DELETE CASCADE,
  rater_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating      TEXT        NOT NULL CHECK (rating IN ('vibe_matched', 'meh', 'no_show_zone')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (beacon_id, rater_id)
);

ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users insert own feedback" ON public.event_feedback;
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.event_feedback;
DROP POLICY IF EXISTS "Users can view feedback" ON public.event_feedback;
DROP POLICY IF EXISTS "Feedback readable by beacon host and rater" ON public.event_feedback;
CREATE POLICY "Feedback readable by beacon host and rater"
  ON public.event_feedback FOR SELECT
  USING (
    auth.uid() = rater_id
    OR auth.uid() IN (SELECT host_id FROM public.beacons WHERE id = beacon_id)
  );


-- ────────────────────────────────────────────────────────────────────────────
-- 7. PAYMENT SUBMISSIONS — the admin's payment-proof queue
--    (table was missing: proofs were "accepted" but never stored)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.payment_submissions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  purpose          TEXT        NOT NULL DEFAULT 'membership_upgrade',
  amount_pkr       NUMERIC     NOT NULL DEFAULT 0,
  tier_requested   TEXT        NOT NULL,
  event_id         UUID        REFERENCES public.official_events(id) ON DELETE SET NULL,
  booking_ref      TEXT,
  ticket_count     INTEGER,
  item_label       TEXT,
  payer_name       TEXT,
  payer_email      TEXT,
  payer_phone      TEXT,
  payment_method   TEXT        NOT NULL DEFAULT 'bank_transfer',
  transaction_ref  TEXT        NOT NULL DEFAULT 'N/A',
  proof_image_url  TEXT,
  status           TEXT        NOT NULL DEFAULT 'pending',
  admin_notes      TEXT,
  reviewed_by      UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at      TIMESTAMPTZ
);

-- (in case an older version of the table exists)
ALTER TABLE public.payment_submissions ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'membership_upgrade';
ALTER TABLE public.payment_submissions ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.official_events(id) ON DELETE SET NULL;
ALTER TABLE public.payment_submissions ADD COLUMN IF NOT EXISTS booking_ref TEXT;
ALTER TABLE public.payment_submissions ADD COLUMN IF NOT EXISTS ticket_count INTEGER;
ALTER TABLE public.payment_submissions ADD COLUMN IF NOT EXISTS item_label TEXT;
ALTER TABLE public.payment_submissions ADD COLUMN IF NOT EXISTS payer_name TEXT;
ALTER TABLE public.payment_submissions ADD COLUMN IF NOT EXISTS payer_email TEXT;
ALTER TABLE public.payment_submissions ADD COLUMN IF NOT EXISTS payer_phone TEXT;
ALTER TABLE public.payment_submissions ADD COLUMN IF NOT EXISTS reviewed_by UUID;

ALTER TABLE public.payment_submissions DROP CONSTRAINT IF EXISTS payment_submissions_status_check;
ALTER TABLE public.payment_submissions
  ADD CONSTRAINT payment_submissions_status_check
  CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.payment_submissions DROP CONSTRAINT IF EXISTS payment_submissions_purpose_check;
ALTER TABLE public.payment_submissions
  ADD CONSTRAINT payment_submissions_purpose_check
  CHECK (purpose IN ('membership_upgrade', 'event_ticket'));

CREATE INDEX IF NOT EXISTS payment_submissions_user_id_idx ON public.payment_submissions (user_id);
CREATE INDEX IF NOT EXISTS payment_submissions_status_idx ON public.payment_submissions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_submissions_booking_ref_idx ON public.payment_submissions (booking_ref);

ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own payment submissions" ON public.payment_submissions;
DROP POLICY IF EXISTS "Users can view own payment submissions" ON public.payment_submissions;
CREATE POLICY "Users can view own payment submissions"
  ON public.payment_submissions FOR SELECT
  USING (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────────────────────
-- 8. MEMBERSHIP APPLICATIONS (table was missing — the /apply form could not save)
--    Holds CNICs, phone numbers and invite tokens → NO public access at all.
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.membership_applications (
  id                     TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type                   TEXT NOT NULL DEFAULT 'member' CHECK (type IN ('member', 'partner')),
  username               TEXT,
  email                  TEXT NOT NULL,
  full_name              TEXT NOT NULL,
  phone                  TEXT,
  city                   TEXT DEFAULT 'Karachi',
  gender                 TEXT,
  vibe                   TEXT,
  date_of_birth          TEXT,
  cnic                   TEXT,
  emergency_name         TEXT,
  emergency_phone        TEXT,
  instagram              TEXT,
  interests              TEXT[] DEFAULT '{}',
  photo_url              TEXT,
  package_selected       TEXT DEFAULT 'Solo Pass Pro',
  package_price_pkr      NUMERIC DEFAULT 3500,
  partner_business_name  TEXT,
  partner_category       TEXT,
  partner_perks          TEXT,
  status                 TEXT NOT NULL DEFAULT 'pending_admin_approval'
    CHECK (status IN ('pending_admin_approval', 'payment_pending', 'payment_submitted',
                      'approved', 'credentials_created', 'rejected')),
  payment_method         TEXT,
  transaction_ref        TEXT,
  payment_proof_url      TEXT,
  payment_submitted_at   TIMESTAMPTZ,
  admin_notes            TEXT,
  invite_token           TEXT UNIQUE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS membership_applications_status_idx ON public.membership_applications (status);
CREATE INDEX IF NOT EXISTS membership_applications_email_idx ON public.membership_applications (lower(email));

ALTER TABLE public.membership_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert of applications" ON public.membership_applications;
DROP POLICY IF EXISTS "Allow public view of own application by id or token" ON public.membership_applications;
DROP POLICY IF EXISTS "Allow public update for payment proof" ON public.membership_applications;
-- (no policies on purpose: only the server can read or write this table)


-- ────────────────────────────────────────────────────────────────────────────
-- 9. PLATFORM SETTINGS (table was missing — team/sub-admin settings and the review
--    wall could not be saved). Holds the sub-admin list → NO public access at all.
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Allow service role write platform settings" ON public.platform_settings;
-- (no policies on purpose: only the server can read or write this table)


-- ────────────────────────────────────────────────────────────────────────────
-- 10. STORAGE BUCKETS for uploaded images
--     payment-proofs  (private) → transfer screenshots, admins only
--     member-uploads  (private) → CNIC photos, Instagram proof, application photos
--     public-media    (public)  → avatars, beacon covers, event artwork
--     The server uploads with the service-role key and hands out short-lived signed
--     links for private images, so no storage policies are required.
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('payment-proofs', 'payment-proofs', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('member-uploads', 'member-uploads', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('public-media',   'public-media',   true,  5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ────────────────────────────────────────────────────────────────────────────
-- 11. Tell the API layer about the new tables/columns straight away
-- ────────────────────────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';


-- ────────────────────────────────────────────────────────────────────────────
-- 12. VERIFY — the result of this last query is what you should see after running.
--     Every row should say "ok".
-- ────────────────────────────────────────────────────────────────────────────

SELECT check_name, CASE WHEN passed THEN 'ok' ELSE 'PROBLEM' END AS result
FROM (
  SELECT 1 AS ord, 'tables exist' AS check_name,
    (SELECT COUNT(*) = 5 FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('notifications', 'event_feedback', 'payment_submissions',
                           'membership_applications', 'platform_settings')) AS passed
  UNION ALL
  SELECT 2, 'profiles: no browser write policies',
    NOT EXISTS (SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL'))
  UNION ALL
  SELECT 3, 'event_tickets: no browser write policies',
    NOT EXISTS (SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'event_tickets' AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL'))
  UNION ALL
  SELECT 4, 'membership_applications: locked (RLS on, no policies)',
    (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.membership_applications'::regclass)
    AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'membership_applications')
  UNION ALL
  SELECT 5, 'platform_settings: locked (RLS on, no policies)',
    (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.platform_settings'::regclass)
    AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'platform_settings')
  UNION ALL
  SELECT 6, 'event_tickets.user_id is optional',
    (SELECT is_nullable = 'YES' FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'event_tickets' AND column_name = 'user_id')
  UNION ALL
  SELECT 7, 'ticket status allows pending',
    EXISTS (SELECT 1 FROM pg_constraint
      WHERE conname = 'event_tickets_status_check' AND pg_get_constraintdef(oid) LIKE '%pending%')
  UNION ALL
  SELECT 8, 'beacon applications allow withdrawn',
    EXISTS (SELECT 1 FROM pg_constraint
      WHERE conname = 'beacon_applications_status_check' AND pg_get_constraintdef(oid) LIKE '%withdrawn%')
  UNION ALL
  SELECT 9, 'storage buckets exist',
    (SELECT COUNT(*) = 3 FROM storage.buckets WHERE id IN ('payment-proofs', 'member-uploads', 'public-media'))
) checks
ORDER BY ord;
