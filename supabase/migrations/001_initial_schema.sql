-- UP

-- ── Tables ──

CREATE TABLE coaches (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  coaching_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT CHECK (char_length(notes) <= 2000),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE athlete_races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  race_name TEXT NOT NULL,
  race_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE contact_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES coaches(id),
  contacted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  contact_type TEXT NOT NULL DEFAULT 'text' CHECK (contact_type IN ('text', 'email', 'call', 'other')),
  notes TEXT CHECK (char_length(notes) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Row Level Security ──

ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_races ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_logs ENABLE ROW LEVEL SECURITY;

-- coaches: SELECT and UPDATE own row only
CREATE POLICY "coaches_select_own" ON coaches
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "coaches_update_own" ON coaches
  FOR UPDATE USING (id = auth.uid());

-- athletes: ALL where coach_id matches
CREATE POLICY "athletes_all_own" ON athletes
  FOR ALL USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- athlete_races: ALL where athlete belongs to coach
CREATE POLICY "athlete_races_all_own" ON athlete_races
  FOR ALL USING (athlete_id IN (SELECT id FROM athletes WHERE coach_id = auth.uid()))
  WITH CHECK (athlete_id IN (SELECT id FROM athletes WHERE coach_id = auth.uid()));

-- contact_logs: ALL where coach_id matches
CREATE POLICY "contact_logs_all_own" ON contact_logs
  FOR ALL USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- ── Auto-create coach on signup trigger ──

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.coaches (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    split_part(NEW.email, '@', 1)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- DOWN

-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
-- DROP POLICY IF EXISTS "contact_logs_all_own" ON contact_logs;
-- DROP POLICY IF EXISTS "athlete_races_all_own" ON athlete_races;
-- DROP POLICY IF EXISTS "athletes_all_own" ON athletes;
-- DROP POLICY IF EXISTS "coaches_update_own" ON coaches;
-- DROP POLICY IF EXISTS "coaches_select_own" ON coaches;
-- DROP TABLE IF EXISTS contact_logs;
-- DROP TABLE IF EXISTS athlete_races;
-- DROP TABLE IF EXISTS athletes;
-- DROP TABLE IF EXISTS coaches;
