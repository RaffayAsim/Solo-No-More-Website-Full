-- ============================================================
-- Solo-No-More: Phase 14 Schema — Payments & Missing Tables Setup
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. NOTIFICATIONS TABLE (Ensures Phase 11 table exists)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  beacon_id UUID REFERENCES public.beacons(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view own notifications'
  ) THEN
    CREATE POLICY "Users can view own notifications"
      ON public.notifications FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can update own notifications'
  ) THEN
    CREATE POLICY "Users can update own notifications"
      ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;


-- 2. EVENT FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS public.event_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beacon_id UUID NOT NULL REFERENCES public.beacons(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK (rating IN ('vibe_matched', 'meh', 'no_show_zone')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (beacon_id, rater_id)
);

ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'event_feedback' AND policyname = 'Users can view feedback'
  ) THEN
    CREATE POLICY "Users can view feedback"
      ON public.event_feedback FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'event_feedback' AND policyname = 'Users can insert own feedback'
  ) THEN
    CREATE POLICY "Users can insert own feedback"
      ON public.event_feedback FOR INSERT WITH CHECK (auth.uid() = rater_id);
  END IF;
END $$;


-- 3. PAYMENT SUBMISSIONS TABLE (Raast / SadaPay / Bank Transfer Verification)
CREATE TABLE IF NOT EXISTS public.payment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_pkr NUMERIC NOT NULL,
  tier_requested TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'raast',
  transaction_ref TEXT NOT NULL,
  proof_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS payment_submissions_user_id_idx ON public.payment_submissions(user_id);
CREATE INDEX IF NOT EXISTS payment_submissions_status_idx ON public.payment_submissions(status);

ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payment_submissions' AND policyname = 'Users can view own payment submissions'
  ) THEN
    CREATE POLICY "Users can view own payment submissions"
      ON public.payment_submissions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payment_submissions' AND policyname = 'Users can insert own payment submissions'
  ) THEN
    CREATE POLICY "Users can insert own payment submissions"
      ON public.payment_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 4. ENSURE ADMIN PROFILE STATUS FOR ABDUL RAFFAY
UPDATE public.profiles 
SET subscription_tier = 'admin', account_status = 'approved'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'raffay.asim6@gmail.com'
);
