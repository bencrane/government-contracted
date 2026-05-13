-- Government Contracted: initial schema.
--
-- Apply via: doppler run -- psql "$GC_DB_URL_POOLED" -f 001_initial.sql
--
-- Conventions:
--   - One organizations table, flattened (no `kind` discriminator).
--   - `category` is plain text — canonical values listed in comments, no CHECK constraint
--     (so we can expand the set without a migration).
--   - Contractors and demand-side partners (surety, capital, GPO, equipment, consulting)
--     all share the organizations table; SAM.gov fields are NULL for non-contractor orgs.
--   - User-to-user message threads are deliberately deferred — v1 UI is system
--     notifications (inbox archive) + partner CRM transfers, no DMs.

------------------------------------------------------------------------
-- Organizations
------------------------------------------------------------------------
-- One row per business entity on the platform. Contractors, surety providers,
-- capital providers, GPOs, equipment lessors, consulting firms — all share
-- this table. SAM.gov fields are NULL for non-contractor categories.
-- Stripe customer id is NULL for free orgs (contractors).
--
-- Canonical category values:
--   contractor          — supply side, free, the entity being claimed
--   surety_provider     — demand side
--   capital_provider    — demand side
--   gpo_provider        — demand side (vendor programs / group purchasing)
--   equipment_lessor    — demand side
--   consulting_firm     — demand side (compliance, capture, proposal writing)
--   prime               — supply side, looking for subs
--   sub                 — supply side, looking for primes
--
-- Add more by INSERT — no migration needed.
CREATE TABLE organizations (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                     text NOT NULL,
  slug                     text UNIQUE,
  category                 text NOT NULL,
  -- SAM.gov fields (NULL when category has no SAM registration)
  uei                      text UNIQUE,
  cage_code                text,
  ein                      text,
  legal_business_name      text,
  dba                      text,
  naics_primary            text,
  naics_secondary          text[],
  set_aside_eligibility    text[],
  sam_registration_status  text,
  sam_expiration_date      date,
  claimed_at               timestamptz,
  sam_snapshot             jsonb,
  sam_snapshot_at          timestamptz,
  -- Billing (NULL for free orgs)
  stripe_customer_id       text UNIQUE,
  created_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX organizations_uei_idx
  ON organizations (uei) WHERE uei IS NOT NULL;
CREATE INDEX organizations_naics_idx
  ON organizations (naics_primary) WHERE naics_primary IS NOT NULL;

------------------------------------------------------------------------
-- Users
------------------------------------------------------------------------
-- Mirror of auth.users (Supabase). One row per platform user.
-- Auto-created via trigger on auth.users insert (see end of file).
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL,
  display_name  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------------------
-- Organization memberships
------------------------------------------------------------------------
CREATE TABLE organization_memberships (
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role             text NOT NULL CHECK (role IN ('owner','admin','member')),
  status           text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, organization_id)
);

CREATE INDEX organization_memberships_org_idx
  ON organization_memberships (organization_id);

------------------------------------------------------------------------
-- Invitations
------------------------------------------------------------------------
-- Cold-email magic-link onboarding. The URL carries a raw token; we store
-- only the SHA-256 hash. When consumed, links to the auth user that claimed it.
CREATE TABLE invitations (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash           text NOT NULL UNIQUE,
  target_email         text NOT NULL,
  target_uei           text,
  target_role          text NOT NULL DEFAULT 'owner',
  invited_by_user_id   uuid REFERENCES users(id),
  expires_at           timestamptz NOT NULL,
  consumed_at          timestamptz,
  consumed_by_user_id  uuid REFERENCES users(id),
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX invitations_target_email_idx ON invitations (target_email);
CREATE INDEX invitations_expires_at_idx   ON invitations (expires_at)
  WHERE consumed_at IS NULL;

------------------------------------------------------------------------
-- Connections (org ↔ org handshake)
------------------------------------------------------------------------
-- When a partner clicks "Connect" on a contractor, a row goes here as 'pending'.
-- A corresponding notification surfaces to the contractor with accept/decline.
CREATE TABLE connections (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiating_org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  receiving_org_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status                 text NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','accepted','declined','revoked')),
  message_to_contractor  text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  responded_at           timestamptz,
  UNIQUE (initiating_org_id, receiving_org_id)
);

CREATE INDEX connections_receiving_org_idx ON connections (receiving_org_id, status);

------------------------------------------------------------------------
-- Notifications (contractor inbox archive + partner activity feed)
------------------------------------------------------------------------
-- System-generated. Categories aligned to the dashboard sections:
--   sam_registration, compliance, past_performance, active_contracts,
--   opportunities, surety, capital, vendor_programs, equipment,
--   exclusions, connection, system.
-- `emailed_at` records when the corresponding Resend email went out
-- (NULL = in-app only).
CREATE TABLE notifications (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category           text NOT NULL,
  subject            text NOT NULL,
  body               text NOT NULL,
  from_name          text,
  from_email         text,
  primary_action     jsonb,
  is_read            boolean NOT NULL DEFAULT false,
  is_important       boolean NOT NULL DEFAULT false,
  emailed_at         timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_recipient_idx
  ON notifications (recipient_user_id, created_at DESC);
CREATE INDEX notifications_unread_idx
  ON notifications (recipient_user_id) WHERE is_read = false;

------------------------------------------------------------------------
-- Notification preferences (per user, per category)
------------------------------------------------------------------------
CREATE TABLE notification_preferences (
  user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category  text NOT NULL,
  cadence   text NOT NULL CHECK (cadence IN ('immediate','daily_digest','weekly_digest','off')),
  PRIMARY KEY (user_id, category)
);

------------------------------------------------------------------------
-- Transfers (partner CRM pipeline)
------------------------------------------------------------------------
-- Each row = one contractor match in a partner's funnel.
-- `match_criteria` / `signals` / `contact_snapshot` captured at match time.
CREATE TABLE transfers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contractor_org_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  audience_spec_id    uuid,
  disposition         text NOT NULL DEFAULT 'new'
                      CHECK (disposition IN ('new','contacted','quoted','won','lost','rejected')),
  match_criteria      jsonb,
  signals             jsonb,
  contact_snapshot    jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  contacted_at        timestamptz,
  quoted_at           timestamptz,
  closed_at           timestamptz
);

CREATE INDEX transfers_partner_idx
  ON transfers (partner_org_id, disposition, created_at DESC);
CREATE INDEX transfers_contractor_idx
  ON transfers (contractor_org_id);

------------------------------------------------------------------------
-- Subscriptions (billing — partners only in practice, but no constraint)
------------------------------------------------------------------------
CREATE TABLE subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_subscription_id  text UNIQUE,
  plan                    text NOT NULL,
  status                  text NOT NULL,
  period_start            timestamptz,
  period_end              timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX subscriptions_org_idx ON subscriptions (organization_id);

------------------------------------------------------------------------
-- Audit log
------------------------------------------------------------------------
CREATE TABLE audit_log (
  id             bigserial PRIMARY KEY,
  actor_user_id  uuid REFERENCES users(id) ON DELETE SET NULL,
  action         text NOT NULL,
  target_type    text,
  target_id      text,
  payload        jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_actor_idx   ON audit_log (actor_user_id, created_at DESC);
CREATE INDEX audit_log_created_idx ON audit_log (created_at DESC);

------------------------------------------------------------------------
-- Auto-create public.users on auth.users insert
------------------------------------------------------------------------
-- SECURITY DEFINER so the trigger can write regardless of caller.
-- Idempotent: skips if the auth_user_id is already mirrored.
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO users (auth_user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_auth_user();
