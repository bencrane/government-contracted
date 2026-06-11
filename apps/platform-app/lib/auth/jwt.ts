import 'server-only';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '@/lib/env';

/**
 * Local Supabase access-token verification (ES256 via JWKS).
 *
 * The govcon Supabase project issues asymmetric (ES256) access tokens and publishes its
 * signing keys at `/auth/v1/.well-known/jwks.json`. Verifying a token's signature LOCALLY
 * against those keys yields a trusted user id with ZERO network round-trip — the same
 * posture as `rare-structure-hq/apps/platform-api/src/auth.ts` (its Hono BFF).
 *
 * This replaces the per-render `supabase.auth.getUser()` call, which revalidates the
 * session against the Supabase Auth server over the network on EVERY server-component
 * render. `createRemoteJWKSet` fetches the keys once and caches them (with its own
 * rotation refresh), so steady-state verification is pure CPU.
 *
 * Security note: this verifies signature + issuer + audience, exactly what `getUser()`
 * guarantees, minus the network hop. The cookie session is read locally (see
 * `getSessionUserId`) and the raw access token is re-verified here — we never trust an
 * unverified cookie payload.
 */
const ISSUER = `${env.NEXT_PUBLIC_GC_SUPABASE_URL}/auth/v1`;
const jwks = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`));

export interface VerifiedUser {
  sub: string;
  email: string | null;
}

export async function verifyAccessToken(token: string): Promise<VerifiedUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: ISSUER,
      audience: 'authenticated',
    });
    const sub = typeof payload.sub === 'string' ? payload.sub : null;
    if (!sub) return null;
    return { sub, email: typeof payload.email === 'string' ? payload.email : null };
  } catch {
    // Expired / wrong-issuer / bad-signature / unreachable-JWKS — treat as unauthenticated.
    return null;
  }
}
