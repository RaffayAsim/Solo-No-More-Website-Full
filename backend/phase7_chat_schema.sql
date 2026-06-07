-- ============================================================
-- Solo-No-More: Phase 7 Schema — Beacon Squad "Pre-Game" Chat
-- ============================================================

CREATE TABLE IF NOT EXISTS public.beacon_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beacon_id   UUID NOT NULL REFERENCES public.beacons(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimize message retrievals
CREATE INDEX IF NOT EXISTS beacon_messages_beacon_id_idx ON public.beacon_messages(beacon_id);
CREATE INDEX IF NOT EXISTS beacon_messages_created_at_idx ON public.beacon_messages(created_at);

ALTER TABLE public.beacon_messages ENABLE ROW LEVEL SECURITY;

-- Policy 1: Members can only read chats if they are host OR approved guests
CREATE POLICY "Approved members and hosts can view messages"
  ON public.beacon_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.beacons b
      WHERE b.id = beacon_id
      AND (
        b.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.beacon_applications ba
          WHERE ba.beacon_id = b.id
          AND ba.applicant_id = auth.uid()
          AND ba.status = 'approved'
        )
      )
    )
  );

-- Policy 2: Members can only send messages if they are host OR approved guests
CREATE POLICY "Approved members and hosts can send messages"
  ON public.beacon_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.beacons b
      WHERE b.id = beacon_id
      AND (
        b.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.beacon_applications ba
          WHERE ba.beacon_id = b.id
          AND ba.applicant_id = auth.uid()
          AND ba.status = 'approved'
        )
      )
    )
  );
