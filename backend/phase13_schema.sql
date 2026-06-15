-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 13 SCHEMA — Dynamic Coordination & Post-Event Retention Loops
-- Solo-No-More
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Alter beacons table to add google_maps_url ──────────────────────────
ALTER TABLE public.beacons ADD COLUMN IF NOT EXISTS google_maps_url TEXT;

-- ── 2. Create squad_endorsements table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.squad_endorsements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beacon_id    UUID NOT NULL REFERENCES public.beacons(id) ON DELETE CASCADE,
  endorser_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT squad_endorsements_unique UNIQUE (beacon_id, endorser_id, recipient_id),
  CONSTRAINT no_self_endorsement CHECK (endorser_id <> recipient_id)
);

-- Index for fast counts on recipient profile loads
CREATE INDEX IF NOT EXISTS squad_endorsements_recipient_idx ON public.squad_endorsements(recipient_id);
CREATE INDEX IF NOT EXISTS squad_endorsements_beacon_idx ON public.squad_endorsements(beacon_id);

-- ── 3. Enable RLS and setup policies ─────────────────────────────────────────
ALTER TABLE public.squad_endorsements ENABLE ROW LEVEL SECURITY;

-- Insert Policy: Approved squad members can endorse other participants
CREATE POLICY "Endorsements insert policy"
  ON public.squad_endorsements FOR INSERT
  WITH CHECK (
    auth.uid() = endorser_id
    AND EXISTS (
      -- Verify endorser is either the host or approved attendee of the beacon
      SELECT 1 FROM public.beacons b
      WHERE b.id = beacon_id
        AND (
          b.host_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.beacon_applications a
            WHERE a.beacon_id = b.id
              AND a.applicant_id = auth.uid()
              AND a.status = 'approved'
          )
        )
    )
  );

-- Select Policy: Endorsements are visible to all members for profile calculations
CREATE POLICY "Endorsements select policy"
  ON public.squad_endorsements FOR SELECT
  USING (true);
