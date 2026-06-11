import 'server-only';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { pool } from '@/lib/audience-specs/db';
import { env } from '@/lib/env';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { TENANT_COOKIE_NAME, readTenantToken } from '@/lib/auth/tenant-cookie';

/**
 * Auth → tenant binding. The single place the platform resolves the authenticated
 * Supabase user to the set of organizations they actively belong to.
 *
 * Identity is verified LOCALLY (ES256/JWKS, see lib/auth/jwt.ts) off the session cookie —
 * no per-render network round-trip to the Supabase Auth server.
 *
 * Org membership is the live DB query (`querySessionOrgs`), which privileged MUTATIONS
 * (requireSessionOrg / requirePlatformAdmin) call so a revoked membership blocks writes
 * immediately. The read-hot dashboard surface (`getSessionOrgUeis`) instead reads a
 * sign-in-scoped, user-bound signed cookie and only falls back to the live query on a miss
 * — the deliberate "resolve on sign-in" posture for read display (lib/auth/tenant-cookie.ts).
 * Callers MUST derive any tenant UEI from this, never from a client-supplied param.
 */
export interface SessionOrg {
  orgId: string;
  slug: string | null;
  category: string;
  uei: string | null;
}

/** HS256 signing key for the tenant cookie, or null when unconfigured (dev fallback). */
export function tenantSecret(): Uint8Array | null {
  return env.TENANT_COOKIE_SECRET
    ? new TextEncoder().encode(env.TENANT_COOKIE_SECRET)
    : null;
}

export async function getSessionUserId(): Promise<string | null> {
  const supabase = await createClient();
  // getSession() reads the session from cookies with NO network call; verifyAccessToken
  // then checks the ES256 signature locally against the project JWKS. Together: a secure
  // identity check with zero per-render round-trip to the Supabase Auth server.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return null;
  const verified = await verifyAccessToken(session.access_token);
  return verified?.sub ?? null;
}

/** Live DB lookup of every active org membership for an auth user id. */
export async function querySessionOrgs(authUserId: string): Promise<SessionOrg[]> {
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

/**
 * Every active org membership for the authenticated user (empty when anonymous).
 * LIVE query — used by the privileged mutation guards, which must see revocations at once.
 */
export async function getSessionOrgs(): Promise<SessionOrg[]> {
  const authUserId = await getSessionUserId();
  if (!authUserId) return [];
  return querySessionOrgs(authUserId);
}

function ueisOf(orgs: SessionOrg[]): Set<string> {
  return new Set(
    orgs.map((o) => o.uei?.toUpperCase()).filter((u): u is string => Boolean(u)),
  );
}

/**
 * The set of UEIs (uppercased) the session user may READ.
 *
 * Read-hot dashboard path: tries the sign-in-scoped, user-bound `gc_tenant` cookie first
 * (zero DB round-trip), falling back to the live membership query on miss / expiry /
 * sub-mismatch. A forged or cross-user cookie fails verification and falls through.
 */
export async function getSessionOrgUeis(): Promise<Set<string>> {
  const authUserId = await getSessionUserId();
  if (!authUserId) return new Set();

  const key = tenantSecret();
  if (key) {
    const cached = (await cookies()).get(TENANT_COOKIE_NAME)?.value;
    if (cached) {
      const orgs = await readTenantToken(key, cached, authUserId);
      if (orgs) return ueisOf(orgs);
    }
  }

  return ueisOf(await querySessionOrgs(authUserId));
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
