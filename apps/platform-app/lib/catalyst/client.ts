import 'server-only';
import { env } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import type {
  ActiveContractsPayload,
  OverviewPayload,
  PastPerformancePayload,
  SamProfilePayload,
} from '@/lib/catalyst/types';

/**
 * Typed client for the entity read surfaces. Two paths, selected by env:
 *
 *  - **BFF (phase-2, when `API_BASE_URL` is set):** broker through the platform-api Hono
 *    BFF, forwarding the session user's Supabase JWT as Bearer. The BFF holds the core-x
 *    service token and proxies to core-x. This is the path the future Vite SPA also uses.
 *  - **Direct (legacy):** REST/JSON straight to catalyst_api (core-x) presenting
 *    `Authorization: Bearer CATALYST_API_TOKEN`. Kept as the fallback so the cutover is a
 *    reversible Doppler flip.
 *
 * Either way the gateway envelopes responses as `{ "data": <payload> }` — we unwrap and
 * return the payload (camelCase already).
 *
 * The UEI passed in MUST be the session-resolved tenant UEI (see lib/tenant.ts). This
 * client never accepts a client-supplied UEI.
 *
 * Dev fallback: when neither `API_BASE_URL` nor `CATALYST_API_URL` is set (local dev, no
 * gateway) every call resolves to `null`, so surfaces render their empty-state rather than
 * a fabricated payload. stg/prd require the direct URL+token (enforced in lib/env.ts).
 */
const UEI_RE = /^[A-Za-z0-9]{12}$/;

// Per-call ceiling so a slow / unreachable gateway degrades the surface to its empty-state
// instead of awaiting unbounded and hanging the server-component render (a hung fetch with no
// AbortSignal previously blocked the RSC for the full upstream duration). The catalyst reads
// are gold point-lookups (sub-second); 10s is generous headroom over a cold gateway start.
const REQUEST_TIMEOUT_MS = 10_000;

function configured(): boolean {
  return Boolean(env.CATALYST_API_URL && env.CATALYST_API_TOKEN);
}

/**
 * The session user's Supabase access token (local cookie read — no network), forwarded
 * to the BFF as the Bearer credential its `requireUser` middleware validates. Returns
 * null when anonymous; the read then degrades to its empty-state.
 */
async function sessionAccessToken(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Phase-2 read path: broker through the platform-api BFF instead of calling core-x
 * directly. The BFF holds the core-x service token, validates the forwarded user JWT,
 * and returns the SAME `{ data }` envelope verbatim — so the unwrap is identical.
 *
 * Tenant authorization still happens UPSTREAM of this call (resolveTenantUei →
 * getSessionOrgUeis), exactly as on the direct path: the BFF authenticates the user but
 * does not yet authorize the UEI against the user's orgs (that lands with the auth/landing
 * move). Callers MUST therefore continue to pass only a session-resolved tenant UEI.
 */
async function getJsonViaBff<T>(uei: string, surface: string): Promise<T | null> {
  const token = await sessionAccessToken();
  if (!token) {
    // Anonymous reaching a read path (callers gate via resolveTenantUei — defensive):
    // render the empty-state rather than hit the BFF unauthenticated.
    return null;
  }
  const url = `${env.API_BASE_URL}/api/v1/entities/${uei}/${surface}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    console.warn(
      `catalyst-client(bff): ${surface} for ${uei} unreachable (${err instanceof Error ? err.name : 'error'}); rendering empty-state`,
    );
    return null;
  }
  if (res.status === 404) return null; // unknown entity / no footprint — valid empty outcome
  if (res.status === 401) {
    // Session token rejected (e.g. expired between render and fetch) — empty-state, not a crash.
    console.warn(`catalyst-client(bff): ${surface} for ${uei} got 401 from BFF; rendering empty-state`);
    return null;
  }
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    // The BFF maps core-x unreachable/slow to 502 (503/504 cover an LB/proxy in front of it).
    // The DIRECT path absorbs the same core-x outage — its fetch throws and is caught → null →
    // empty-state. Match that here: a transient upstream blip must degrade the surface, never
    // 500 the dashboard render (there is no error boundary above the dashboard index route).
    console.warn(
      `catalyst-client(bff): ${surface} for ${uei} upstream unavailable (${res.status}); rendering empty-state`,
    );
    return null;
  }
  if (!res.ok) {
    throw new Error(`catalyst-client(bff): ${surface} for ${uei} failed (${res.status})`);
  }
  const body = (await res.json()) as { data: T };
  return body.data;
}

async function getJson<T>(uei: string, surface: string): Promise<T | null> {
  if (!UEI_RE.test(uei)) throw new Error(`catalyst-client: refusing malformed UEI ${JSON.stringify(uei)}`);

  // Phase-2 cutover: when API_BASE_URL is set, reads flow through the platform-api BFF
  // (which holds the core-x service token). Unset → the legacy direct-core-x path below.
  // The flip is a single Doppler value, so the cutover is reversible.
  if (env.API_BASE_URL) {
    return getJsonViaBff<T>(uei, surface);
  }

  if (!configured()) {
    // Dev: no private gateway wired — surfaces fall back to empty-state.
    return null;
  }
  const url = `${env.CATALYST_API_URL}/api/v1/entities/${uei}/${surface}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${env.CATALYST_API_TOKEN}` },
      // The gateway opens Lance per-request (latest committed version); never cache.
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    // Timeout or network failure: degrade to empty-state rather than hang/crash the render.
    // A persistent failure is visible in the server log (not silently swallowed forever).
    console.warn(
      `catalyst-client: ${surface} for ${uei} unreachable (${err instanceof Error ? err.name : 'error'}); rendering empty-state`,
    );
    return null;
  }
  if (res.status === 404) return null; // unknown entity / no footprint — a valid empty outcome
  if (!res.ok) {
    throw new Error(`catalyst-client: ${surface} for ${uei} failed (${res.status})`);
  }
  const body = (await res.json()) as { data: T };
  return body.data;
}

export function getSamProfile(uei: string): Promise<SamProfilePayload | null> {
  return getJson<SamProfilePayload>(uei, 'sam-profile');
}

export function getActiveContracts(
  uei: string,
  limit = 25,
): Promise<ActiveContractsPayload | null> {
  return getJson<ActiveContractsPayload>(uei, `active-contracts?limit=${limit}`);
}

export function getOverview(uei: string): Promise<OverviewPayload | null> {
  return getJson<OverviewPayload>(uei, 'overview');
}

export function getPastPerformance(
  uei: string,
  limit = 25,
): Promise<PastPerformancePayload | null> {
  return getJson<PastPerformancePayload>(uei, `past-performance?limit=${limit}`);
}
