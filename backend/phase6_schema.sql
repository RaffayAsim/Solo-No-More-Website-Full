-- ============================================================
-- Solo-No-More: Phase 6 Schema — Monetization & Official Events
-- Run this in your Supabase SQL Editor AFTER previous phases
-- ============================================================

-- OFFICIAL EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.official_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  venue_name    TEXT,
  event_type    TEXT NOT NULL,
  price         NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  scheduled_at  TIMESTAMPTZ NOT NULL,
  max_capacity  INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT official_events_type_check CHECK (event_type IN ('artist_split', 'platform_owned')),
  CONSTRAINT official_events_capacity_check CHECK (max_capacity > 0)
);

CREATE TRIGGER official_events_updated_at
  BEFORE UPDATE ON public.official_events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- EVENT TICKETS TABLE
CREATE TABLE IF NOT EXISTS public.event_tickets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES public.official_events(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticket_status TEXT NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT event_tickets_status_check CHECK (ticket_status IN ('active', 'scanned', 'cancelled')),
  -- One ticket per user per event
  CONSTRAINT event_tickets_unique_user_event UNIQUE (event_id, user_id)
);

CREATE TRIGGER event_tickets_updated_at
  BEFORE UPDATE ON public.event_tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.official_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;

-- Anyone logged in can view official events
CREATE POLICY "Users can view official events"
  ON public.official_events FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can view their own event tickets
CREATE POLICY "Users can view own tickets"
  ON public.event_tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert tickets for themselves
CREATE POLICY "Users can claim own tickets"
  ON public.event_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- SEED THREE HIGH-FIDELITY EVENTS
INSERT INTO public.official_events (title, description, venue_name, event_type, price, scheduled_at, max_capacity)
VALUES
  (
    'Techno Warehouse Rave Session', 
    'Exclusive underground vibes with top-tier touring artists. Fully secured VIP area. complimentary drinks included for Family members.', 
    'The Vault Underground', 
    'artist_split', 
    89.00, 
    NOW() + INTERVAL '2 days', 
    500
  ),
  (
    'Neon Rooftop Sunset Hangout', 
    'Desi vibes, deep tropical house remixes, and paratha platters. Bar is fully funded, sunset view is guaranteed.', 
    'Bondi Beach Penthouse', 
    'platform_owned', 
    45.00, 
    NOW() + INTERVAL '4 days', 
    150
  ),
  (
    'VIP Padel Tournament & Espresso Match', 
    'Doubles tournament with exclusive Solo-No-More merchandise, professional coaching, and unlimited complimentary espresso bar.', 
    'Padel Arena Pro Center', 
    'platform_owned', 
    25.00, 
    NOW() + INTERVAL '7 days', 
    64
  )
ON CONFLICT DO NOTHING;
