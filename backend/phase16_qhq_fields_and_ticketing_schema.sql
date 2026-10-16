-- ============================================================
-- Solo-No-More: Phase 16 Schema — QHQ Verification Fields & Ticketing Architecture
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ── 1. Extend public.profiles with QHQ Mandatory Verification Fields ──
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cnic TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram_username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cnic_picture_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram_screenshot_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT false;

-- ── 2. Extend public.event_tickets with QHQ Linked Pairing & Merchant Fields ──
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS pair_code TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS is_couple_booking BOOLEAN DEFAULT false;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS is_guest_entry BOOLEAN DEFAULT false;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS invited_by_email TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS invited_by_name TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS tier_id TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS tier_name TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS amount_paid_pkr NUMERIC DEFAULT 0;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'safepay';
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS user_phone TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS qr_id TEXT;

-- ── 3. Performance Indexes ──
CREATE INDEX IF NOT EXISTS idx_event_tickets_pair_code ON public.event_tickets(pair_code);
CREATE INDEX IF NOT EXISTS idx_event_tickets_qr_id ON public.event_tickets(qr_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_payment_status ON public.event_tickets(payment_status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_guest ON public.profiles(is_guest);
CREATE INDEX IF NOT EXISTS idx_profiles_is_profile_complete ON public.profiles(is_profile_complete);
