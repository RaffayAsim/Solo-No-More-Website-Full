-- ============================================================
-- Solo-No-More: Phase 1 Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (already enabled in Supabase by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES TABLE
-- Extends Supabase auth.users via foreign key on id
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name         TEXT,
  phone             TEXT,
  bio               TEXT,
  social_link       TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'none',
  account_status    TEXT NOT NULL DEFAULT 'pending_vetting',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUTOMATIC updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGN-UP
-- Triggered when a new user is added to auth.users
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Allow insert only via the trigger (SECURITY DEFINER function bypasses RLS)
-- Direct inserts by the user are still possible for self-registration
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Admins (service_role) bypass RLS by default in Supabase
-- No additional policy needed for admin access

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS profiles_account_status_idx ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS profiles_subscription_tier_idx ON public.profiles(subscription_tier);

-- ============================================================
-- VALID VALUE COMMENTS (enforce via app layer or CHECK constraints)
-- subscription_tier: 'none' | 'basic' | 'premium'
-- account_status:    'pending_vetting' | 'approved' | 'rejected' | 'suspended'
-- ============================================================
