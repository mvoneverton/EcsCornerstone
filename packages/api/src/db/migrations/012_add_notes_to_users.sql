-- Facilitator notes on respondent records.
-- Free-text field visible only to company admins and facilitators.
ALTER TABLE users ADD COLUMN facilitator_notes text;
