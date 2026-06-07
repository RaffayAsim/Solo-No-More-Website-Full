-- ============================================================
-- Solo-No-More: Phase 3 Schema — The Intelligent Lobby & Beacons
-- Run this in your Supabase SQL Editor AFTER phase1_schema.sql
-- ============================================================

-- ============================================================
-- FRIENDS TABLE
-- Tracks relationships between members
-- ============================================================
CREATE TABLE IF NOT EXISTS public.friends (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id_2   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate pairs (enforces that (A,B) and (B,A) can't both exist)
  CONSTRAINT friends_unique_pair UNIQUE (user_id_1, user_id_2),
  -- Prevent self-friendship
  CONSTRAINT friends_no_self CHECK (user_id_1 <> user_id_2),
  -- Enforce valid status values
  CONSTRAINT friends_status_check CHECK (status IN ('pending', 'accepted', 'blocked'))
);

CREATE TRIGGER friends_updated_at
  BEFORE UPDATE ON public.friends
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS friends_user_id_1_idx ON public.friends(user_id_1);
CREATE INDEX IF NOT EXISTS friends_user_id_2_idx ON public.friends(user_id_2);
CREATE INDEX IF NOT EXISTS friends_status_idx ON public.friends(status);

ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Users can see their own friend rows
CREATE POLICY "Users can view own friend rows"
  ON public.friends FOR SELECT
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Users can insert (send a request) where they are user_id_1
CREATE POLICY "Users can send friend requests"
  ON public.friends FOR INSERT
  WITH CHECK (auth.uid() = user_id_1);

-- Users can update rows where they are involved (accept/block)
CREATE POLICY "Users can update own friend rows"
  ON public.friends FOR UPDATE
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Users can delete their own friend rows
CREATE POLICY "Users can delete own friend rows"
  ON public.friends FOR DELETE
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);


-- ============================================================
-- BEACONS TABLE
-- The core "event pull requests" of Solo-No-More
-- ============================================================
CREATE TABLE IF NOT EXISTS public.beacons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL DEFAULT 'casual',
  visibility_mode TEXT NOT NULL DEFAULT 'stranger',
  total_slots     INTEGER NOT NULL DEFAULT 2 CHECK (total_slots BETWEEN 1 AND 10),
  filled_slots    INTEGER NOT NULL DEFAULT 0 CHECK (filled_slots >= 0),
  location_name   TEXT,
  scheduled_at    TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Enforce valid category values
  CONSTRAINT beacons_category_check CHECK (
    category IN ('sports', 'casual', 'nightlife')
  ),
  -- Enforce valid visibility values
  CONSTRAINT beacons_visibility_check CHECK (
    visibility_mode IN ('stranger', 'friend')
  ),
  -- Enforce valid status values
  CONSTRAINT beacons_status_check CHECK (
    status IN ('active', 'completed', 'cancelled')
  ),
  -- Filled slots can't exceed total slots
  CONSTRAINT beacons_slots_check CHECK (filled_slots <= total_slots)
);

CREATE TRIGGER beacons_updated_at
  BEFORE UPDATE ON public.beacons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS beacons_host_id_idx      ON public.beacons(host_id);
CREATE INDEX IF NOT EXISTS beacons_status_idx        ON public.beacons(status);
CREATE INDEX IF NOT EXISTS beacons_category_idx      ON public.beacons(category);
CREATE INDEX IF NOT EXISTS beacons_visibility_idx    ON public.beacons(visibility_mode);
CREATE INDEX IF NOT EXISTS beacons_scheduled_at_idx  ON public.beacons(scheduled_at);

ALTER TABLE public.beacons ENABLE ROW LEVEL SECURITY;

-- Approved members can read all active beacons
CREATE POLICY "Approved members can view active beacons"
  ON public.beacons FOR SELECT
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND account_status = 'approved'
    )
  );

-- Approved members can create beacons
CREATE POLICY "Approved members can create beacons"
  ON public.beacons FOR INSERT
  WITH CHECK (
    host_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND account_status = 'approved'
    )
  );

-- Hosts can update their own beacons
CREATE POLICY "Hosts can update own beacons"
  ON public.beacons FOR UPDATE
  USING (host_id = auth.uid());

-- Hosts can delete their own beacons
CREATE POLICY "Hosts can delete own beacons"
  ON public.beacons FOR DELETE
  USING (host_id = auth.uid());


-- ============================================================
-- BEACON_APPLICATIONS TABLE
-- Tracks who wants to join a beacon
-- ============================================================
CREATE TABLE IF NOT EXISTS public.beacon_applications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beacon_id    UUID NOT NULL REFERENCES public.beacons(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One application per user per beacon
  CONSTRAINT beacon_applications_unique UNIQUE (beacon_id, applicant_id),
  -- Enforce valid status values
  CONSTRAINT beacon_applications_status_check CHECK (
    status IN ('pending', 'approved', 'declined')
  )
);

CREATE TRIGGER beacon_applications_updated_at
  BEFORE UPDATE ON public.beacon_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS beacon_apps_beacon_id_idx    ON public.beacon_applications(beacon_id);
CREATE INDEX IF NOT EXISTS beacon_apps_applicant_id_idx ON public.beacon_applications(applicant_id);
CREATE INDEX IF NOT EXISTS beacon_apps_status_idx       ON public.beacon_applications(status);

ALTER TABLE public.beacon_applications ENABLE ROW LEVEL SECURITY;

-- Applicants can see their own applications; hosts can see all applications on their beacons
CREATE POLICY "Users can view relevant applications"
  ON public.beacon_applications FOR SELECT
  USING (
    applicant_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.beacons
      WHERE id = beacon_id AND host_id = auth.uid()
    )
  );

-- Approved members can apply to beacons (cannot apply to own beacon enforced at app layer)
CREATE POLICY "Approved members can apply to beacons"
  ON public.beacon_applications FOR INSERT
  WITH CHECK (
    applicant_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND account_status = 'approved'
    )
  );

-- Beacon hosts can update application status (approve/decline)
CREATE POLICY "Hosts can manage applications on their beacons"
  ON public.beacon_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.beacons
      WHERE id = beacon_id AND host_id = auth.uid()
    )
  );

-- Applicants can withdraw their own application
CREATE POLICY "Applicants can delete own application"
  ON public.beacon_applications FOR DELETE
  USING (applicant_id = auth.uid());

-- ============================================================
-- AUTO-INCREMENT filled_slots TRIGGER
-- Fires when a beacon application is approved
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_beacon_slot_fill()
RETURNS TRIGGER AS $$
BEGIN
  -- When an application is approved, increment filled_slots
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    UPDATE public.beacons
    SET filled_slots = filled_slots + 1
    WHERE id = NEW.beacon_id AND filled_slots < total_slots;

    -- Auto-complete beacon when full
    UPDATE public.beacons
    SET status = 'completed'
    WHERE id = NEW.beacon_id AND filled_slots >= total_slots;
  END IF;

  -- When an approval is revoked, decrement filled_slots
  IF OLD.status = 'approved' AND NEW.status <> 'approved' THEN
    UPDATE public.beacons
    SET filled_slots = GREATEST(filled_slots - 1, 0)
    WHERE id = NEW.beacon_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_beacon_application_status_change
  AFTER UPDATE ON public.beacon_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_beacon_slot_fill();
