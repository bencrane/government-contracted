/**
 * Tenant cookie crypto — the security boundary for the sign-in-scoped read cache.
 *
 * These pin the properties tenant isolation depends on: a cookie is only honored when its
 * signature verifies AND its `sub` matches the live session user. A forged, tampered, or
 * cross-user cookie must yield `null` so the caller falls back to the live DB query.
 */
import { describe, it, expect } from 'vitest';
import { SignJWT } from 'jose';
import {
  signTenantToken,
  readTenantToken,
  TENANT_COOKIE_NAME,
  TENANT_COOKIE_TTL_SECONDS,
} from '@/lib/auth/tenant-cookie';
import type { SessionOrg } from '@/lib/session';

const KEY = new TextEncoder().encode('test-secret-at-least-32-bytes-long-xx');
const OTHER_KEY = new TextEncoder().encode('a-different-secret-32-bytes-long-yyyyy');
const SUB = 'auth-user-1';
const ORGS: SessionOrg[] = [
  { orgId: 'o1', slug: 'acme', category: 'contractor', uei: 'CW52DR9J9DY4' },
  { orgId: 'o2', slug: null, category: 'contractor', uei: 'WBBSNBA9GBL7' },
];

describe('tenant-cookie', () => {
  it('round-trips orgs for the bound user', async () => {
    const token = await signTenantToken(KEY, SUB, ORGS);
    const out = await readTenantToken(KEY, token, SUB);
    expect(out).toEqual(ORGS);
  });

  it('rejects a cookie minted for a different user (cross-user replay)', async () => {
    const token = await signTenantToken(KEY, SUB, ORGS);
    expect(await readTenantToken(KEY, token, 'attacker-user')).toBeNull();
  });

  it('rejects a cookie signed with a different key (forgery)', async () => {
    const forged = await signTenantToken(OTHER_KEY, SUB, ORGS);
    expect(await readTenantToken(KEY, forged, SUB)).toBeNull();
  });

  it('rejects a tampered token body', async () => {
    const token = await signTenantToken(KEY, SUB, ORGS);
    const parts = token.split('.');
    const tampered = `${parts[0]}.${Buffer.from(
      JSON.stringify({ orgs: [{ orgId: 'x', slug: null, category: 'c', uei: 'EVILUEI00001' }], sub: SUB }),
    ).toString('base64url')}.${parts[2]}`;
    expect(await readTenantToken(KEY, tampered, SUB)).toBeNull();
  });

  it('rejects an expired token', async () => {
    const expired = await new SignJWT({ orgs: ORGS })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(SUB)
      .setIssuedAt(0)
      .setExpirationTime(1) // epoch+1s — long past
      .sign(KEY);
    expect(await readTenantToken(KEY, expired, SUB)).toBeNull();
  });

  it('rejects empty input', async () => {
    expect(await readTenantToken(KEY, '', SUB)).toBeNull();
    const token = await signTenantToken(KEY, SUB, ORGS);
    expect(await readTenantToken(KEY, token, '')).toBeNull();
  });

  it('exposes stable cookie constants', () => {
    expect(TENANT_COOKIE_NAME).toBe('gc_tenant');
    expect(TENANT_COOKIE_TTL_SECONDS).toBe(8 * 60 * 60);
  });
});
