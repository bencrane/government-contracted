// Typed wrapper for USAspending.gov public API.
//
// No auth required. Generous rate limit but we still cache aggressively.
// All endpoints return JSON. Server-side only — never call from the client.

const BASE = "https://api.usaspending.gov";
const FETCH_TIMEOUT_MS = 8000;

// Contract award type codes per FPDS. Excludes grants/IDVs.
const CONTRACT_TYPE_CODES = ["A", "B", "C", "D"] as const;

export type UspAward = {
  awardId: string;
  recipientName: string;
  recipientUei: string;
  amount: number;
  awardingAgency: string;
  awardingAgencyId: number;
  agencySlug: string;
};

export type UspAgencyAggregate = {
  name: string;
  agencyId: number;
  agencySlug: string;
  amount: number;
};

type RawAward = {
  "Award ID": string;
  "Recipient Name": string;
  "Recipient UEI": string | null;
  "Award Amount": number | null;
  "Awarding Agency": string;
  awarding_agency_id: number;
  agency_slug: string;
};

type RawAgency = {
  name: string;
  id: number;
  code: string;
  agency_slug: string;
  amount: number;
};

async function uspFetch<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      // Cache at the fetch layer too — Next will dedupe same URL+body in a single render.
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      console.warn(`[usaspending] ${path} returned ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[usaspending] ${path} fetch failed`, err);
    return null;
  }
}

/**
 * Search awards by recipient name OR UEI (UEI is a 12-char alphanumeric).
 * Returns up to `limit` top awards by amount, descending.
 */
export async function searchAwards(
  recipientQuery: string,
  limit = 5,
): Promise<UspAward[]> {
  const body = {
    filters: {
      award_type_codes: CONTRACT_TYPE_CODES,
      recipient_search_text: [recipientQuery],
      time_period: [{ start_date: "2008-01-01", end_date: "2026-12-31" }],
    },
    fields: ["Award ID", "Recipient Name", "Recipient UEI", "Award Amount", "Awarding Agency"],
    page: 1,
    limit,
    sort: "Award Amount",
    order: "desc",
  };
  const data = await uspFetch<{ results: RawAward[] }>(
    "/api/v2/search/spending_by_award/",
    body,
  );
  if (!data?.results) return [];
  return data.results
    .filter((r) => r["Recipient UEI"] !== null && r["Award Amount"] !== null)
    .map((r) => ({
      awardId: r["Award ID"],
      recipientName: r["Recipient Name"],
      recipientUei: r["Recipient UEI"] as string,
      amount: r["Award Amount"] as number,
      awardingAgency: r["Awarding Agency"],
      awardingAgencyId: r.awarding_agency_id,
      agencySlug: r.agency_slug,
    }));
}

/**
 * Agency-level rollup of obligations for a recipient (by UEI).
 * Returns up to `limit` agencies by amount, descending.
 */
export async function agencyMix(
  recipientUei: string,
  limit = 5,
): Promise<UspAgencyAggregate[]> {
  const body = {
    filters: {
      recipient_search_text: [recipientUei],
      time_period: [{ start_date: "2008-01-01", end_date: "2026-12-31" }],
    },
    page: 1,
    limit,
  };
  const data = await uspFetch<{ results: RawAgency[] }>(
    "/api/v2/search/spending_by_category/awarding_agency/",
    body,
  );
  if (!data?.results) return [];
  return data.results.map((r) => ({
    name: r.name,
    agencyId: r.id,
    agencySlug: r.agency_slug,
    amount: r.amount,
  }));
}
