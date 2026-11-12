-- ============================================================
-- Solo-No-More: Phase 17 Schema — Production Cloud Persistence
-- Run this in your Supabase SQL Editor for complete Vercel readiness
-- ============================================================

-- ── 1. Create Key-Value Platform Settings Store ──
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'platform_settings' AND policyname = 'Allow public read platform settings'
  ) THEN
    CREATE POLICY "Allow public read platform settings"
      ON public.platform_settings FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'platform_settings' AND policyname = 'Allow service role write platform settings'
  ) THEN
    CREATE POLICY "Allow service role write platform settings"
      ON public.platform_settings FOR ALL USING (true);
  END IF;
END $$;

-- ── 2. Ensure event_tickets allows guest/manual bookings without registered auth.users ──
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_tickets' AND column_name = 'user_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.event_tickets ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

-- ── 3. Ensure membership_applications id column is TEXT to match app_ IDs ──
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'membership_applications' AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.membership_applications ALTER COLUMN id TYPE TEXT;
  END IF;
END $$;

