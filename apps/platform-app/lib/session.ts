import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { pool } from '@/lib/audience-specs/db';

/**
 * Auth → tenant binding. The single place the platform resolves the authenticated
 * Supabase user to the set of organizations they actively belong to.
 *
 * Per the isolation ruling we do NOT pack memberships into the Supabase JWT — every
 * call is a fresh DB round-trip so a revoked membership takes effect immediately.
 * Callers MUST derive any tenant UEI from this, never from a client-supplied param.
 */
export interface SessionOrg {
  orgId: string;
  slug: string | null;
  category: string;
  uei: string | null;
}

export async function getSessionUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** Every active org membership for the authenticated user (empty when anonymous). */
export async function getSessionOrgs(): Promise<SessionOrg[]> {
  const authUserId = await getSessionUserId();
  if (!authUserId) return [];
  const { rows } = await pool().query<{
    organization_id: string;
    slug: string | null;
    category: string;
    uei: string | null;
  }>(
    `
    SELECT o.id AS organization_id, o.slug, o.category, o.uei
      FROM users u
      JOIN organization_memberships m ON m.user_id = u.id AND m.status = 'active'
      JOIN organizations o ON o.id = m.organization_id
     WHERE u.auth_user_id = $1
    `,
    [authUserId],
  );
  return rows.map((r) => ({
    orgId: r.organization_id,
    slug: r.slug,
    category: r.category,
    uei: r.uei,
  }));
}

/** The set of UEIs (uppercased) the session user may read. */
export async function getSessionOrgUeis(): Promise<Set<string>> {
  const orgs = await getSessionOrgs();
  return new Set(
    orgs
      .map((o) => o.uei?.toUpperCase())
      .filter((u): u is string => Boolean(u)),
  );
}

/**
 * Whether the authenticated user holds an active platform-admin grant.
 *
 * Platform admin is a GLOBAL privileged role (see migrations/003_platform_admins.sql)
 * for cross-tenant mutations that have no owning tenant org to authorize against —
 * distinct from per-org membership. Resolved fresh per request, exactly like
 * getSessionOrgs: a revoked grant takes effect immediately (no JWT packing).
 */
export async function isSessionPlatformAdmin(): Promise<boolean> {
  const authUserId = await getSessionUserId();
  if (!authUserId) return false;
  const { rows } = await pool().query(
    `
    SELECT 1
      FROM users u
      JOIN platform_admins pa
        ON pa.user_id = u.id AND pa.revoked_at IS NULL
     WHERE u.auth_user_id = $1
     LIMIT 1
    `,
    [authUserId],
  );
  return rows.length > 0;
}
