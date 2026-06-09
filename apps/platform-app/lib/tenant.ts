import 'server-only';
import { redirect, notFound } from 'next/navigation';
import { getSessionUserId, getSessionOrgUeis, getSessionOrgs, isSessionPlatformAdmin } from '@/lib/session';

/**
 * Tenant isolation for the UEI-keyed dashboard surfaces.
 *
 * The `[uei]` route param is UNTRUSTED. A surface is authorized iff the param UEI
 * resolves to an active membership of the session user — a membership-SET check
 * (a user may belong to multiple orgs), never equality against a single org.
 *
 * On failure we 404 (notFound) rather than 403 so an attacker cannot probe which
 * UEIs exist by status code. Unauthenticated callers are sent to /login.
 */
const UEI_RE = /^[A-Z0-9]{12}$/;

export function normalizeUei(raw: string): string {
  return (raw || '').toUpperCase().replace(/[^A-HJ-NP-Z0-9]/g, '').slice(0, 12);
}

/**
 * RSC guard: resolve + authorize the route UEI against the session. Returns the
 * normalized, session-owned UEI, or short-circuits the render (redirect/notFound).
 */
export async function resolveTenantUei(rawUei: string): Promise<string> {
  const uei = normalizeUei(rawUei);
  if (!UEI_RE.test(uei)) notFound();

  const userId = await getSessionUserId();
  if (!userId) redirect('/login');

  const owned = await getSessionOrgUeis();
  if (!owned.has(uei)) notFound();

  return uei;
}

/**
 * Route-handler guard: assert the session user is an active member of the org
 * identified by `predicate` (e.g. matching a factor slug, or owning an org id).
 * Returns the matched org. Throwing values map to HTTP via the caller.
 */
export class TenantError extends Error {
  constructor(
    readonly status: 401 | 403,
    message: string,
  ) {
    super(message);
    this.name = 'TenantError';
  }
}

export async function requireSessionOrg(
  predicate: (org: { orgId: string; slug: string | null; category: string; uei: string | null }) => boolean,
): Promise<{ orgId: string; slug: string | null; category: string; uei: string | null }> {
  const userId = await getSessionUserId();
  if (!userId) throw new TenantError(401, 'authentication required');
  const orgs = await getSessionOrgs();
  if (orgs.length === 0) throw new TenantError(403, 'no active organization membership');
  const match = orgs.find(predicate);
  if (!match) throw new TenantError(403, 'not authorized for this organization');
  return match;
}

/** Bare authenticated-session gate for privileged mutations with no tenant to own yet. */
export async function requireSession(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) throw new TenantError(401, 'authentication required');
  return userId;
}

/**
 * Platform-admin gate. For cross-tenant privileged mutations that have NO owning
 * tenant org to authorize against — chiefly factor onboarding (POST /api/factors),
 * which provisions a brand-new capital_provider org + lockbox banking config and so
 * cannot be checked against organization_memberships.
 *
 * Two-stage: requireSession() first (401 for anonymous), then the platform-admin
 * grant (403 for an authenticated non-admin) — so callers get the same 401/403
 * TenantError ladder as requireSessionOrg. Returns the authenticated user id.
 */
export async function requirePlatformAdmin(): Promise<string> {
  const userId = await requireSession();
  if (!(await isSessionPlatformAdmin())) {
    throw new TenantError(403, 'platform administrator authorization required');
  }
  return userId;
}
