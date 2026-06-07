-- ============================================================
-- Solo-No-More: Phase 9 Schema — Scaling, Partners & Avatars
-- ============================================================

-- Alter public.profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Karachi';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_icon TEXT DEFAULT '👾';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_partner BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_name TEXT;

-- Alter public.beacons table
ALTER TABLE public.beacons ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Karachi';
ALTER TABLE public.beacons ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.beacons ADD COLUMN IF NOT EXISTS is_partner_offer BOOLEAN DEFAULT false;

-- Enforce city constraint checks
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_city_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_city_check CHECK (city IN ('Karachi', 'Lahore', 'Islamabad'));

ALTER TABLE public.beacons DROP CONSTRAINT IF EXISTS beacons_city_check;
ALTER TABLE public.beacons ADD CONSTRAINT beacons_city_check CHECK (city IN ('Karachi', 'Lahore', 'Islamabad'));

-- Update trigger function to automatically copy onboarding signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    bio, 
    social_link, 
    city, 
    avatar_icon, 
    is_partner,
    business_name
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'bio',
    NEW.raw_user_meta_data ->> 'social_link',
    COALESCE(NEW.raw_user_meta_data ->> 'city', 'Karachi'),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_icon', '👾'),
    COALESCE((NEW.raw_user_meta_data ->> 'is_partner')::boolean, false),
    NEW.raw_user_meta_data ->> 'business_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
