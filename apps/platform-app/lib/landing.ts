import 'server-only';
import { env } from '@/lib/env';

/**
 * Post-login landing resolution via the platform-api BFF.
 *
 * Returns the redirect path on success, or `null` on ANY failure — BFF not configured,
 * unreachable, non-2xx, malformed body, or an unsafe target — so the caller (app/page.tsx)
 * falls back to its local membership query. That keeps login→landing working through a BFF
 * blip and makes the cutover a reversible `API_BASE_URL` flip.
 */
const REQUEST_TIMEOUT_MS = 10_000;

// A safe in-app destination: exactly one leading slash (a relative path), never a
// scheme-relative `//host` or absolute URL. Defends against an open redirect even if the
// BFF response were ever wrong/compromised.
const SAFE_PATH = /^\/(?!\/)/;

export async function bffLanding(accessToken: string): Promise<string | null> {
  if (!env.API_BASE_URL) return null;
  try {
    const res = await fetch(`${env.API_BASE_URL}/api/v1/me/landing`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) return null; // 401/503/etc. → fall back to the local query
    const body = (await res.json()) as { redirect?: unknown };
    const target = typeof body.redirect === 'string' ? body.redirect : null;
    return target && SAFE_PATH.test(target) ? target : null;
  } catch {
    // Unreachable / timeout — never block the landing on the BFF.
    return null;
  }
}
