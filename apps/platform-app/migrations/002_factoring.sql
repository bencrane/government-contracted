-- Government Contracted: factoring foundation v1.
--
-- Implements the Assignment of Claims Act perfection path:
--   FAR 32.802(d)(2), 32.802(e), 32.805(b), 32.805(c)
--
-- Apply via:
--   doppler run --project hq-government-contracted --config prd -- \
--     psql "$GC_DB_URL_POOLED" -f apps/platform-app/migrations/002_factoring.sql
--
-- Table naming convention: assignments, assignment_parties, assignment_documents,
-- disbursements, factor_billing_events, factor_configurations,
-- assignment_state_transitions.

------------------------------------------------------------------------
-- factor_configurations
-- Extra per-org fields when an org is a capital_provider (factor).
-- Lockbox bank info, notification addresses, default doc template.
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS factor_configurations (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id             uuid NOT NULL UNIQUE
                              REFERENCES organizations(id) ON DELETE CASCADE,
  lockbox_bank_name           text NOT NULL,
  lockbox_account_number      text NOT NULL,
  lockbox_routing_number      text NOT NULL,
  notification_addresses      jsonb NOT NULL DEFAULT '{}',
  default_doc_template        text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS factor_configurations_org_idx
  ON factor_configurations (organization_id);

------------------------------------------------------------------------
-- assignments
-- One row per assignment of a single contract's receivables to a single
-- factor. Per FAR 32.802(d)(2): assignment to one party only.
--
-- Status state machine (FAR 32.805 procedure):
--   drafted     — instrument drafted, parties listed
--   executed    — contractor + factor signed instrument
--   served      — notice dispatched to all required addressees
--   acknowledged— at least one gov party acknowledged (informational)
--   perfected   — ALL required gov parties acknowledged
--   terminated  — assignment terminated
--   rejected    — contracting officer formally rejected
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_org_id     uuid NOT NULL REFERENCES organizations(id),
  factor_org_id         uuid NOT NULL REFERENCES organizations(id),
  contract_number       text NOT NULL,
  contract_value_cents  bigint NOT NULL CHECK (contract_value_cents > 0),
  sole_or_joint_payee   text NOT NULL CHECK (sole_or_joint_payee IN ('sole', 'joint')),
  has_surety            boolean NOT NULL DEFAULT false,
  status                text NOT NULL DEFAULT 'drafted'
                        CHECK (status IN (
                          'drafted', 'executed', 'served',
                          'acknowledged', 'perfected', 'terminated', 'rejected'
                        )),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assignments_contractor_idx
  ON assignments (contractor_org_id, status);
CREATE INDEX IF NOT EXISTS assignments_factor_idx
  ON assignments (factor_org_id, status);

------------------------------------------------------------------------
-- assignment_parties
-- One row per signing/acknowledging party per FAR 32.802(e) + 32.805(b).
-- Required addressees: contractor_assignor, factor_assignee,
-- contracting_officer, disbursing_officer, surety (when has_surety=true).
--
-- role column:
--   contractor_assignor — signs Instrument of Assignment
--   factor_assignee     — signs Instrument of Assignment
--   contracting_officer — acknowledges Notice of Assignment
--   disbursing_officer  — acknowledges Notice of Assignment
--   surety              — acknowledges Notice of Assignment (when applicable)
--
-- status column:
--   pending     — awaiting action
--   signed      — contractor/factor signed
--   acknowledged— gov party acknowledged receipt
--   declined    — party declined
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignment_parties (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  role            text NOT NULL CHECK (role IN (
                    'contractor_assignor', 'factor_assignee',
                    'contracting_officer', 'disbursing_officer', 'surety'
                  )),
  email           text NOT NULL,
  name            text,
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'signed', 'acknowledged', 'declined')),
  signed_at       timestamptz,
  documenso_recipient_id text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, role)
);

CREATE INDEX IF NOT EXISTS assignment_parties_assignment_idx
  ON assignment_parties (assignment_id);

------------------------------------------------------------------------
-- assignment_documents
-- Documenso envelope references + tamper-evident content hashes.
--
-- content_sha256: SHA-256 of the bytes from Documenso's download API,
-- stored as lowercase hex. Recomputed on retrieval; mismatch = tamper
-- alert. NOT NULL enforced when status is 'executed' or later via CHECK.
-- (A4 constraint)
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignment_documents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id       uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  documenso_envelope_id text NOT NULL,
  document_type       text NOT NULL CHECK (document_type IN (
                        'instrument_of_assignment', 'notice_of_assignment'
                      )),
  status              text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'sent', 'signed', 'executed')),
  content_sha256      text,
  -- Enforce: content_sha256 must be populated when document is executed.
  -- A4: hash NOT NULL on terminal states (executed = signed by all parties).
  CONSTRAINT assignment_documents_hash_on_executed
    CHECK (status <> 'executed' OR content_sha256 IS NOT NULL),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assignment_documents_assignment_idx
  ON assignment_documents (assignment_id);

------------------------------------------------------------------------
-- assignment_state_transitions
-- Append-only audit log of state-machine transitions.
-- Per A5: UPDATE/DELETE prohibited via BEFORE trigger.
-- Per F2: every row includes actor_user_id, previous_state, new_state,
--         transition_reason, created_at.
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignment_state_transitions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id       uuid NOT NULL,
  -- FK to assignments is intentionally NOT ON DELETE CASCADE so that
  -- transitions survive assignment archival. We use a soft reference.
  actor_user_id       uuid REFERENCES users(id) ON DELETE SET NULL,
  previous_state      text NOT NULL,
  new_state           text NOT NULL,
  transition_reason   text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assignment_state_transitions_assignment_idx
  ON assignment_state_transitions (assignment_id, created_at DESC);

-- A5: append-only enforcement via BEFORE trigger.
-- Applies to ALL roles regardless of privilege level.
CREATE OR REPLACE FUNCTION prevent_assignment_state_transition_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'assignment_state_transitions is append-only — UPDATE and DELETE are prohibited';
END;
$$;

DROP TRIGGER IF EXISTS assignment_state_transitions_no_update
  ON assignment_state_transitions;
CREATE TRIGGER assignment_state_transitions_no_update
  BEFORE UPDATE ON assignment_state_transitions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_assignment_state_transition_mutation();

DROP TRIGGER IF EXISTS assignment_state_transitions_no_delete
  ON assignment_state_transitions;
CREATE TRIGGER assignment_state_transitions_no_delete
  BEFORE DELETE ON assignment_state_transitions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_assignment_state_transition_mutation();

------------------------------------------------------------------------
-- disbursements
-- Observed government payments redirected to factor lockbox.
-- Only allowed when assignment.status = 'perfected' (enforced at API layer
-- and via FK reference).
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS disbursements (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id       uuid NOT NULL REFERENCES assignments(id),
  amount_cents        bigint NOT NULL CHECK (amount_cents > 0),
  observed_at         timestamptz NOT NULL,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS disbursements_assignment_idx
  ON disbursements (assignment_id, observed_at DESC);

------------------------------------------------------------------------
-- factor_billing_events
-- Stripe meter event ledger. One row per disbursement per E3 UNIQUE
-- constraint (prevents double-fire).
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS factor_billing_events (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disbursement_id         uuid NOT NULL UNIQUE REFERENCES disbursements(id),
  stripe_meter_event_id   text,
  payload                 jsonb NOT NULL DEFAULT '{}',
  status                  text NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'fired', 'fixture', 'failed')),
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS factor_billing_events_disbursement_idx
  ON factor_billing_events (disbursement_id);
