import { afterEach, describe, expect, it, vi } from "vitest";

const BASE_ENV: Record<string, string> = {
  NEXT_PUBLIC_GC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_GC_SUPABASE_PUBLISHABLE_KEY: "pk_test",
  GC_DB_URL_POOLED: "postgres://user:pw@localhost:5432/db",
  APP_ENV: "dev",
};

async function loadLanding(extra: Record<string, string>) {
  vi.resetModules();
  for (const [k, v] of Object.entries({ ...BASE_ENV, ...extra })) vi.stubEnv(k, v);
  return import("@/lib/landing");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("bffLanding", () => {
  const API = "https://platform-api.example.com";

  it("returns null without calling fetch when API_BASE_URL is unset", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { bffLanding } = await loadLanding({});
    expect(await bffLanding("JWT")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards the Bearer token and returns a safe redirect path", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ redirect: "/dashboard/CW52DR9J9DY4" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { bffLanding } = await loadLanding({ API_BASE_URL: API });
    expect(await bffLanding("USERJWT")).toBe("/dashboard/CW52DR9J9DY4");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${API}/api/v1/me/landing`);
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer USERJWT");
  });

  it("returns null on a non-2xx (caller falls back to local query)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 503 })));
    const { bffLanding } = await loadLanding({ API_BASE_URL: API });
    expect(await bffLanding("J")).toBeNull();
  });

  it("rejects unsafe redirect targets (open-redirect guard)", async () => {
    for (const evil of ["//evil.com", "https://evil.com", "javascript:alert(1)", "dashboard"]) {
      vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ redirect: evil }), { status: 200 })));
      const { bffLanding } = await loadLanding({ API_BASE_URL: API });
      expect(await bffLanding("J")).toBeNull();
    }
  });

  it("returns null when the body has no redirect string", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ org: null }), { status: 200 })));
    const { bffLanding } = await loadLanding({ API_BASE_URL: API });
    expect(await bffLanding("J")).toBeNull();
  });

  it("returns null when fetch throws (BFF unreachable)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    }));
    const { bffLanding } = await loadLanding({ API_BASE_URL: API });
    expect(await bffLanding("J")).toBeNull();
  });
});
