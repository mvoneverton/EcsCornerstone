-- One row per perspective per invitation.
-- PCA produces three rows (self / others / work); WSA and JA produce one (single).
CREATE TABLE assessment_results (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id     uuid        NOT NULL REFERENCES assessment_invitations(id),
  respondent_id     uuid        NOT NULL REFERENCES users(id),
  assessment_type   text        NOT NULL
                    CHECK (assessment_type IN ('pca','wsa','ja')),
  perspective       text        NOT NULL
                    CHECK (perspective IN ('self','others','work','single')),
  a_percentile      numeric(5,2) NOT NULL,
  r_percentile      numeric(5,2) NOT NULL,
  a_score_800       integer     NOT NULL CHECK (a_score_800 BETWEEN 0 AND 800),
  r_score_800       integer     NOT NULL CHECK (r_score_800 BETWEEN 0 AND 800),
  primary_profile   text        NOT NULL
                    CHECK (primary_profile IN ('vanguard','catalyst','cultivator','architect')),
  secondary_profile text
                    CHECK (secondary_profile IN ('vanguard','catalyst','cultivator','architect')),
  report_s3_key     text,       -- set after PDF is generated and uploaded
  is_valid          boolean     NOT NULL DEFAULT true,
  validity_flags    jsonb       NOT NULL DEFAULT '[]',
  created_at        timestamptz NOT NULL DEFAULT now(),

  -- One result row per perspective per invitation
  UNIQUE (invitation_id, perspective)
);

-- Company admin reporting queries (company_id comes via JOIN to invitations)
CREATE INDEX results_invitation_id_idx  ON assessment_results(invitation_id);
CREATE INDEX results_respondent_id_idx  ON assessment_results(respondent_id);
-- Report delivery lookup
CREATE INDEX results_report_s3_key_idx  ON assessment_results(report_s3_key) WHERE report_s3_key IS NOT NULL;
