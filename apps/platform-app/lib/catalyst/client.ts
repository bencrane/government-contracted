import 'server-only';
import { env } from '@/lib/env';
import type {
  ActiveContractsPayload,
  OverviewPayload,
  PastPerformancePayload,
  SamProfilePayload,
} from '@/lib/catalyst/types';

/**
 * Typed client for the catalyst_api (core-x) private read gateway.
 *
 * REST/JSON over Railway's private IPv6 net; every call presents
 * `Authorization: Bearer CATALYST_API_TOKEN`. The gateway envelopes responses as
 * `{ "data": <payload> }` — we unwrap and return the payload (camelCase already).
 *
 * The UEI passed in MUST be the session-resolved tenant UEI (see lib/tenant.ts).
 * This client never accepts a client-supplied UEI.
 *
 * Dev fallback: when CATALYST_API_URL is unset (local dev, no private net) every
 * call resolves to `null`, so surfaces render their empty-state rather than a
 * fabricated payload. stg/prd require the URL+token (enforced in lib/env.ts).
 */
const UEI_RE = /^[A-Za-z0-9]{12}$/;

function configured(): boolean {
  return Boolean(env.CATALYST_API_URL && env.CATALYST_API_TOKEN);
}

async function getJson<T>(uei: string, surface: string): Promise<T | null> {
  if (!UEI_RE.test(uei)) throw new Error(`catalyst-client: refusing malformed UEI ${JSON.stringify(uei)}`);
  if (!configured()) {
    // Dev: no private gateway wired — surfaces fall back to empty-state.
    return null;
  }
  const url = `${env.CATALYST_API_URL}/api/v1/entities/${uei}/${surface}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${env.CATALYST_API_TOKEN}` },
    // The gateway opens Lance per-request (latest committed version); never cache.
    cache: 'no-store',
  });
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
