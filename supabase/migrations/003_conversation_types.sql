-- Rolldown tracks substantive back-and-forth conversations, not every outbound touch.
-- Preserve prototype records while narrowing the allowed methods to the product model.

UPDATE contact_logs
SET contact_type = 'text'
WHERE contact_type IN ('email', 'other');

ALTER TABLE contact_logs
  DROP CONSTRAINT contact_logs_contact_type_check;

ALTER TABLE contact_logs
  ADD CONSTRAINT contact_logs_contact_type_check
  CHECK (contact_type IN ('text', 'call', 'video'));
