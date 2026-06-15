-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 12 SCHEMA — The Living Vibe Profile
-- Solo-No-More
-- Run this against your Supabase project SQL editor (or via node scratch/run_phase12_sql.js).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Alter profiles table ───────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vibe_tags TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active_seeker BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seeker_updated_at TIMESTAMPTZ;

-- ── 2. Create beacon_memories table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.beacon_memories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beacon_id  UUID NOT NULL REFERENCES public.beacons(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url  TEXT NOT NULL,
  caption    TEXT CHECK (char_length(caption) <= 280),
  is_public  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT beacon_memories_unique UNIQUE (beacon_id, user_id)
);

-- Index for fast queries by user or by beacon
CREATE INDEX IF NOT EXISTS beacon_memories_user_idx ON public.beacon_memories(user_id);
CREATE INDEX IF NOT EXISTS beacon_memories_beacon_idx ON public.beacon_memories(beacon_id);

-- ── 3. Enable RLS and setup policies ─────────────────────────────────────────
ALTER TABLE public.beacon_memories ENABLE ROW LEVEL SECURITY;

-- Select Policy: Readable by self, if public, or if friends with the memory owner
CREATE POLICY "Memories are readable by self, public, or friends"
  ON public.beacon_memories FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_public = true
    OR EXISTS (
      SELECT 1 FROM public.friends
      WHERE status = 'accepted'
        AND (
          (user_id_1 = auth.uid() AND user_id_2 = user_id)
          OR (user_id_1 = user_id AND user_id_2 = auth.uid())
        )
    )
  );

-- Insert Policy: Approved participants can post a memory for their completed beacons
CREATE POLICY "Users can insert own memories"
  ON public.beacon_memories FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      -- Check if they were the host OR approved attendee of the completed beacon
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

-- Update Policy: Users can update their own memory (caption, is_public toggle)
CREATE POLICY "Users can update own memories"
  ON public.beacon_memories FOR UPDATE
  USING (auth.uid() = user_id);

-- Delete Policy: Users can delete their own memory
CREATE POLICY "Users can delete own memories"
  ON public.beacon_memories FOR DELETE
  USING (auth.uid() = user_id);
