import 'server-only';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { getSessionUserId, querySessionOrgs, tenantSecret } from '@/lib/session';
import {
  TENANT_COOKIE_NAME,
  TENANT_COOKIE_TTL_SECONDS,
  signTenantToken,
} from '@/lib/auth/tenant-cookie';

/**
 * Cookie I/O for the sign-in-scoped tenant cache.
 *
 * `establishTenantSession()` is called at every sign-in completion point (the password
 * server action and the magic-link callback route handler) AFTER the Supabase session
 * cookie is set, so it resolves the user's orgs ONCE and signs them into `gc_tenant`.
 * `clearTenantSession()` drops the cookie on sign-out.
 *
 * When `TENANT_COOKIE_SECRET` is unset (dev only — it is required in stg/prd by
 * lib/env.ts) `tenantSecret()` is null, signing is skipped, and every render simply falls
 * back to the live DB query, so behaviour degrades to the prior posture rather than breaking.
 */
export async function establishTenantSession(): Promise<void> {
  const key = tenantSecret();
  if (!key) return;
  const sub = await getSessionUserId();
  if (!sub) return;
  const orgs = await querySessionOrgs(sub);
  const token = await signTenantToken(key, sub, orgs);
  (await cookies()).set(TENANT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.APP_ENV !== 'dev',
    sameSite: 'lax',
    path: '/',
    maxAge: TENANT_COOKIE_TTL_SECONDS,
  });
}

export async function clearTenantSession(): Promise<void> {
  (await cookies()).delete(TENANT_COOKIE_NAME);
}
