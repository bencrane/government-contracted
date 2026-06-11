import { SignJWT, jwtVerify } from 'jose';
import type { SessionOrg } from '@/lib/session';

/**
 * Sign-in-scoped tenant cache (server-signed cookie).
 *
 * The set of orgs (→ UEIs) a user may READ changes rarely, so we resolve it ONCE at
 * sign-in (see app/auth/actions.ts + app/auth/callback/route.ts) and carry it in a
 * server-signed, httpOnly cookie instead of re-querying Postgres on every dashboard
 * render. The cookie is an HS256 token (jose) BOUND to the auth user id: a reader only
 * trusts it when its `sub` matches the locally-verified access token's `sub`, so a
 * stolen/forged cookie cannot grant another tenant's UEIs. On any miss / mismatch /
 * expiry the caller falls back to the live DB query.
 *
 * This module is intentionally env-free and side-effect-free (no `server-only`, no cookie
 * I/O) so the crypto is unit-testable in isolation. The env secret + cookie read/write
 * live in `lib/auth/tenant-session.ts`.
 *
 * SCOPE: this accelerates the read-hot dashboard surface only (getSessionOrgUeis).
 * Privileged MUTATIONS (requireSessionOrg / requirePlatformAdmin) deliberately stay on the
 * live DB query so a revoked membership blocks writes immediately.
 */
export const TENANT_COOKIE_NAME = 'gc_tenant';
// 8h bounded-staleness window for a read-side membership change (write side stays live).
export const TENANT_COOKIE_TTL_SECONDS = 60 * 60 * 8;

interface TenantClaims {
  orgs: SessionOrg[];
}

/** Mint the signed cookie value binding `orgs` to the auth user `sub`. */
export async function signTenantToken(
  key: Uint8Array,
  sub: string,
  orgs: SessionOrg[],
): Promise<string> {
  return new SignJWT({ orgs } satisfies TenantClaims)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime(`${TENANT_COOKIE_TTL_SECONDS}s`)
    .sign(key);
}

/**
 * Verify a tenant cookie and return its orgs, or `null` when the signature is invalid,
 * the token is expired, or its `sub` does not match `expectedSub` (cross-user replay).
 */
export async function readTenantToken(
  key: Uint8Array,
  token: string,
  expectedSub: string,
): Promise<SessionOrg[] | null> {
  if (!token || !expectedSub) return null;
  try {
    const { payload } = await jwtVerify(token, key, { subject: expectedSub });
    const orgs = (payload as Partial<TenantClaims>).orgs;
    return Array.isArray(orgs) ? orgs : null;
  } catch {
    return null;
  }
}
