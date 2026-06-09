-- Government Contracted: platform administrators.
--
-- Apply via:
--   doppler run --project hq-government-contracted --config prd -- \
--     psql "$GC_DB_URL_POOLED" -f apps/platform-app/migrations/003_platform_admins.sql
--
-- A platform admin is an internal operator authorized for cross-tenant privileged
-- mutations that have NO owning tenant org to check membership against. The sole
-- v1 caller is factor onboarding (POST /api/factors), which provisions a fresh
-- capital_provider org PLUS its lockbox banking config (bank name, account, routing)
-- from scratch — there is no pre-existing tenant to authorize against, so the
-- membership-set check used everywhere else (organization_memberships) does not apply.
--
-- This is deliberately distinct from organization_memberships.role = 'admin', which
-- is admin scoped to a SINGLE tenant org. Platform admin is a GLOBAL grant and is
-- kept narrow on purpose:
--   * It is a row, never a boolean flag on users — so every grant carries provenance
--     (who granted it, when) and is revocable (revoked_at) without rewriting a user row.
--   * Resolution mirrors lib/session.ts: auth.users -> public.users -> platform_admins,
--     re-checked on every request (no JWT packing) so a revoked grant takes effect
--     immediately.

CREATE TABLE IF NOT EXISTS platform_admins (
  user_id     uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  granted_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  note        text,
  granted_at  timestamptz NOT NULL DEFAULT now(),
  revoked_at  timestamptz
);

-- Hot path is "is this user a CURRENTLY-active platform admin?" The PK btree on
-- user_id already covers the equality lookup; the partial index keeps the active
-- set tight for the revoked_at IS NULL predicate as the (small) table accrues
-- revoked grants over time.
CREATE INDEX IF NOT EXISTS platform_admins_active_idx
  ON platform_admins (user_id) WHERE revoked_at IS NULL;

COMMENT ON TABLE platform_admins IS
  'Global platform-admin grants for cross-tenant privileged ops (e.g. factor onboarding). Distinct from per-org organization_memberships.role=admin.';
