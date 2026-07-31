-- Rolldown tracks new conversations as text, call, or video.
-- Keep legacy email and imported `other` records intact so migration does not rewrite history.

BEGIN;

ALTER TABLE contact_logs
  DROP CONSTRAINT contact_logs_contact_type_check;

ALTER TABLE contact_logs
  ADD CONSTRAINT contact_logs_contact_type_check
  CHECK (contact_type IN ('text', 'call', 'video', 'unknown', 'email', 'other'));

COMMIT;
