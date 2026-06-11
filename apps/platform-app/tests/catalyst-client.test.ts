import { afterEach, describe, expect, it, vi } from "vitest";

// Mock the Supabase server client so the BFF path can read a session token without
// touching next/headers. createClient() returns a stub whose getSession yields our token.
const getSession = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getSession } })),
}));

const BASE_ENV: Record<string, string> = {
  NEXT_PUBLIC_GC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_GC_SUPABASE_PUBLISHABLE_KEY: "pk_test",
  GC_DB_URL_POOLED: "postgres://user:pw@localhost:5432/db",
  APP_ENV: "dev", // dev skips the stg/prd CATALYST_* fail-closed refine
};

// env.ts validates process.env at import time; stub the env, then re-import the client.
async function loadClient(extra: Record<string, string>) {
  vi.resetModules();
  for (const [k, v] of Object.entries({ ...BASE_ENV, ...extra })) vi.stubEnv(k, v);
  return import("@/lib/catalyst/client");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  getSession.mockReset();
});

describe("catalyst client — BFF path (API_BASE_URL set)", () => {
  const API = "https://platform-api.example.com";

  it("forwards the session JWT as Bearer and unwraps { data }", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "USERJWT" } } });
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ data: { uei: "CW52DR9J9DY4", hasFederalAwards: true } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getOverview } = await loadClient({ API_BASE_URL: API });
    const out = await getOverview("CW52DR9J9DY4");

    expect(out).toEqual({ uei: "CW52DR9J9DY4", hasFederalAwards: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${API}/api/v1/entities/CW52DR9J9DY4/overview`);
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer USERJWT");
  });

  it("passes the limit query through for award lists", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "J" } } });
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ data: { contracts: [] } }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { getActiveContracts } = await loadClient({ API_BASE_URL: API });
    await getActiveContracts("CW52DR9J9DY4", 10);
    expect((fetchMock.mock.calls[0] as unknown as [string])[0]).toBe(
      `${API}/api/v1/entities/CW52DR9J9DY4/active-contracts?limit=10`,
    );
  });

  it("returns null on 404 (unknown entity)", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "J" } } });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 404 })));
    const { getSamProfile } = await loadClient({ API_BASE_URL: API });
    expect(await getSamProfile("CW52DR9J9DY4")).toBeNull();
  });

  it("returns null on 401 (rejected session token) — empty-state, not a throw", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "J" } } });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("Invalid token", { status: 401 })));
    const { getOverview } = await loadClient({ API_BASE_URL: API });
    expect(await getOverview("CW52DR9J9DY4")).toBeNull();
  });

  it("returns null on a BFF 502/503/504 (core-x outage) — empty-state, parity with the direct path", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "J" } } });
    for (const status of [502, 503, 504]) {
      vi.stubGlobal("fetch", vi.fn(async () => new Response(`core-x unreachable`, { status })));
      const { getOverview } = await loadClient({ API_BASE_URL: API });
      expect(await getOverview("CW52DR9J9DY4")).toBeNull();
    }
  });

  it("throws on a genuine BFF 500 (not an upstream-unavailable status)", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "J" } } });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("boom", { status: 500 })));
    const { getOverview } = await loadClient({ API_BASE_URL: API });
    await expect(getOverview("CW52DR9J9DY4")).rejects.toThrow(/failed \(500\)/);
  });

  it("returns null when anonymous (no session token) without calling fetch", async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { getOverview } = await loadClient({ API_BASE_URL: API });
    expect(await getOverview("CW52DR9J9DY4")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws on a malformed UEI before any fetch", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "J" } } });
    vi.stubGlobal("fetch", vi.fn());
    const { getOverview } = await loadClient({ API_BASE_URL: API });
    await expect(getOverview("../../secrets")).rejects.toThrow(/malformed UEI/);
  });
});

describe("catalyst client — direct path (API_BASE_URL unset)", () => {
  it("does not touch the BFF or supabase when unconfigured (dev empty-state)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { getOverview } = await loadClient({}); // no API_BASE_URL, no CATALYST_API_URL
    expect(await getOverview("CW52DR9J9DY4")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getSession).not.toHaveBeenCalled();
  });
});
