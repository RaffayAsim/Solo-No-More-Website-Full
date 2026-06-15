-- ============================================================
-- Solo-No-More: Phase 6 — No-Show Insurance Schema Extensions
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Add no_show_strikes to public.profiles if it does not exist
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS no_show_strikes INTEGER NOT NULL DEFAULT 0;

-- Add flagged_ghost to public.beacon_applications if it does not exist
ALTER TABLE public.beacon_applications 
  ADD COLUMN IF NOT EXISTS flagged_ghost BOOLEAN NOT NULL DEFAULT FALSE;
