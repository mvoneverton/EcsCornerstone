-- Stores one row per question per respondent.
-- Raw responses are write-only from the client — never returned after submission.
CREATE TABLE assessment_responses (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id   uuid        NOT NULL REFERENCES assessment_invitations(id),
  respondent_id   uuid        NOT NULL REFERENCES users(id),
  assessment_type text        NOT NULL
                  CHECK (assessment_type IN ('pca','wsa','ja')),
  question_number integer     NOT NULL,
  response_value  integer     CHECK (response_value BETWEEN 1 AND 5),  -- WSA/JA
  response_most   integer,                                              -- PCA: word ID
  response_least  integer,                                              -- PCA: word ID
  created_at      timestamptz NOT NULL DEFAULT now(),

  -- Prevent duplicate responses for the same question on the same invitation
  UNIQUE (invitation_id, question_number)
);

-- Bulk retrieval by invitation for scoring engine
CREATE INDEX responses_invitation_id_idx ON assessment_responses(invitation_id);
CREATE INDEX responses_respondent_id_idx ON assessment_responses(respondent_id);
