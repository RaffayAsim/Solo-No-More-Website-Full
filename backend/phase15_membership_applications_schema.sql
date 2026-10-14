-- ============================================================
-- Solo-No-More: Phase 15 Schema — Member & Partner Vetting Applications
-- Run this in your Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.membership_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'member' CHECK (type IN ('member', 'partner')),
  username TEXT,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  city TEXT DEFAULT 'Karachi',
  gender TEXT,
  vibe TEXT,
  date_of_birth TEXT,
  cnic TEXT,
  emergency_name TEXT,
  emergency_phone TEXT,
  instagram TEXT,
  interests TEXT[] DEFAULT '{}',
  photo_url TEXT,
  package_selected TEXT DEFAULT 'Solo Pass Pro',
  package_price_pkr NUMERIC DEFAULT 3500,
  partner_business_name TEXT,
  partner_category TEXT,
  partner_perks TEXT,
  status TEXT NOT NULL DEFAULT 'pending_admin_approval' 
    CHECK (status IN ('pending_admin_approval', 'payment_pending', 'payment_submitted', 'approved', 'credentials_created', 'rejected')),
  payment_method TEXT,
  transaction_ref TEXT,
  payment_proof_url TEXT,
  payment_submitted_at TIMESTAMPTZ,
  admin_notes TEXT,
  invite_token TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS membership_applications_status_idx ON public.membership_applications(status);
CREATE INDEX IF NOT EXISTS membership_applications_email_idx ON public.membership_applications(email);
CREATE INDEX IF NOT EXISTS membership_applications_invite_token_idx ON public.membership_applications(invite_token);

ALTER TABLE public.membership_applications ENABLE ROW LEVEL SECURITY;

-- Allow anonymous or service inserts for new applications
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'membership_applications' AND policyname = 'Allow public insert of applications'
  ) THEN
    CREATE POLICY "Allow public insert of applications"
      ON public.membership_applications FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'membership_applications' AND policyname = 'Allow public view of own application by id or token'
  ) THEN
    CREATE POLICY "Allow public view of own application by id or token"
      ON public.membership_applications FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'membership_applications' AND policyname = 'Allow public update for payment proof'
  ) THEN
    CREATE POLICY "Allow public update for payment proof"
      ON public.membership_applications FOR UPDATE USING (true);
  END IF;
END $$;
