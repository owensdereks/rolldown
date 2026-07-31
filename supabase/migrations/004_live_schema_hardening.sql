BEGIN;

-- Keep common focus-list queries efficient as conversation history grows.
CREATE INDEX IF NOT EXISTS idx_athletes_coach_status
  ON athletes(coach_id, status);
CREATE INDEX IF NOT EXISTS idx_contact_logs_athlete_contacted_at
  ON contact_logs(athlete_id, contacted_at DESC);

-- Both sides of a race entry must belong to the signed-in coach.
DROP POLICY IF EXISTS "are_all_own" ON athlete_race_entries;
CREATE POLICY "are_all_own" ON athlete_race_entries
  FOR ALL USING (
    athlete_id IN (SELECT id FROM athletes WHERE coach_id = auth.uid())
    AND race_id IN (SELECT id FROM races WHERE coach_id = auth.uid())
  )
  WITH CHECK (
    athlete_id IN (SELECT id FROM athletes WHERE coach_id = auth.uid())
    AND race_id IN (SELECT id FROM races WHERE coach_id = auth.uid())
  );

-- A conversation's coach and athlete must agree; checking coach_id alone is insufficient.
DROP POLICY IF EXISTS "contact_logs_all_own" ON contact_logs;
CREATE POLICY "contact_logs_all_own" ON contact_logs
  FOR ALL USING (
    coach_id = auth.uid()
    AND athlete_id IN (SELECT id FROM athletes WHERE coach_id = auth.uid())
  )
  WITH CHECK (
    coach_id = auth.uid()
    AND athlete_id IN (SELECT id FROM athletes WHERE coach_id = auth.uid())
  );

-- Make coach/account removal a complete, intentional cascade rather than a blocked partial delete.
ALTER TABLE coaches DROP CONSTRAINT IF EXISTS coaches_id_fkey;
ALTER TABLE coaches
  ADD CONSTRAINT coaches_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE athletes DROP CONSTRAINT IF EXISTS athletes_coach_id_fkey;
ALTER TABLE athletes
  ADD CONSTRAINT athletes_coach_id_fkey
  FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE;

ALTER TABLE contact_logs DROP CONSTRAINT IF EXISTS contact_logs_coach_id_fkey;
ALTER TABLE contact_logs
  ADD CONSTRAINT contact_logs_coach_id_fkey
  FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE;

ALTER TABLE races DROP CONSTRAINT IF EXISTS races_coach_id_fkey;
ALTER TABLE races
  ADD CONSTRAINT races_coach_id_fkey
  FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE;

-- Pin the security-definer function to the intended schema.
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
