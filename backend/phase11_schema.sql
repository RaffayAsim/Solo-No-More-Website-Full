-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 11 SCHEMA — Smart Notifications, Beacon Controls & Engagement Engine
-- Solo-No-More
-- Run this against your Supabase project SQL editor (or via pg script).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Add 'withdrawn' to beacon_application_status enum ─────────────────────
-- Supabase/PostgreSQL requires a transaction-safe approach for enum alteration.
ALTER TYPE beacon_application_status ADD VALUE IF NOT EXISTS 'withdrawn';

-- ── 2. Notifications Table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type               TEXT        NOT NULL,
  title              TEXT        NOT NULL,
  body               TEXT        NOT NULL,
  related_beacon_id  UUID        REFERENCES beacons(id) ON DELETE SET NULL,
  is_read            BOOLEAN     NOT NULL DEFAULT false,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast per-user unread queries
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON notifications (user_id, is_read, created_at DESC);

-- Prevent duplicate time-based alert notifications per beacon per type
CREATE UNIQUE INDEX IF NOT EXISTS notifications_dedup_idx
  ON notifications (user_id, type, related_beacon_id)
  WHERE related_beacon_id IS NOT NULL
    AND type IN (
      'beacon_near_start',
      'beacon_no_attendees',
      'beacon_not_full',
      'beacon_no_interest',
      'attendance_reminder',
      'post_event_vibe_check',
      'beacon_full'
    );

-- ── 3. Event Feedback Table (Post-Event Vibe Check) ───────────────────────────
CREATE TABLE IF NOT EXISTS event_feedback (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  beacon_id   UUID        NOT NULL REFERENCES beacons(id) ON DELETE CASCADE,
  rater_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating      TEXT        NOT NULL CHECK (rating IN ('vibe_matched', 'meh', 'no_show_zone')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (beacon_id, rater_id)
);

-- ── 4. Beacon capacity safety constraint ──────────────────────────────────────
-- Ensure total_slots can never be updated below the current filled count.
-- (Enforced at application layer too, but belt-and-suspenders.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_slots_valid'
  ) THEN
    ALTER TABLE beacons
      ADD CONSTRAINT check_slots_valid CHECK (total_slots >= filled_slots);
  END IF;
END
$$;

-- ── 5. RLS policies for notifications ─────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY IF NOT EXISTS "Users read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update (mark read) their own notifications
CREATE POLICY IF NOT EXISTS "Users update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role (admin) can insert notifications for any user
-- (handled via supabaseAdmin client on server-side; no additional policy needed)

-- ── 6. RLS policies for event_feedback ───────────────────────────────────────
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users insert own feedback"
  ON event_feedback FOR INSERT
  WITH CHECK (auth.uid() = rater_id);

CREATE POLICY IF NOT EXISTS "Feedback readable by beacon host and rater"
  ON event_feedback FOR SELECT
  USING (
    auth.uid() = rater_id
    OR auth.uid() IN (
      SELECT host_id FROM beacons WHERE id = beacon_id
    )
  );
