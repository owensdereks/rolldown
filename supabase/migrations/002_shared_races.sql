-- UP

-- 1. Create canonical races table
CREATE TABLE races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT,
  distance TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(coach_id, name, date)
);

-- Index for calendar/feed queries
CREATE INDEX idx_races_coach_date ON races(coach_id, date);

-- RLS
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
CREATE POLICY "races_all_own" ON races
  FOR ALL USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- 2. Create join table
CREATE TABLE athlete_race_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(athlete_id, race_id)
);

CREATE INDEX idx_are_race_id ON athlete_race_entries(race_id);
CREATE INDEX idx_are_athlete_id ON athlete_race_entries(athlete_id);

-- RLS
ALTER TABLE athlete_race_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "are_all_own" ON athlete_race_entries
  FOR ALL USING (
    athlete_id IN (SELECT id FROM athletes WHERE coach_id = auth.uid())
  )
  WITH CHECK (
    athlete_id IN (SELECT id FROM athletes WHERE coach_id = auth.uid())
  );

-- 3. Migrate existing data
-- Each unique (coach_id, race_name, race_date) combo becomes one race
INSERT INTO races (coach_id, name, date)
SELECT DISTINCT a.coach_id, ar.race_name, ar.race_date
FROM athlete_races ar
JOIN athletes a ON a.id = ar.athlete_id
ON CONFLICT (coach_id, name, date) DO NOTHING;

-- Link athletes to their migrated races
INSERT INTO athlete_race_entries (athlete_id, race_id)
SELECT ar.athlete_id, r.id
FROM athlete_races ar
JOIN athletes a ON a.id = ar.athlete_id
JOIN races r ON r.coach_id = a.coach_id
  AND r.name = ar.race_name
  AND r.date = ar.race_date
ON CONFLICT (athlete_id, race_id) DO NOTHING;

-- 4. Drop old table (after data is migrated)
DROP TABLE athlete_races;

-- DOWN
DROP TABLE IF EXISTS athlete_race_entries;
DROP TABLE IF EXISTS races;
-- Note: cannot restore athlete_races in DOWN without a backup
