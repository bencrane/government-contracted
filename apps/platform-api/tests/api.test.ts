import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import { type AuthVariables, requireUser } from "../src/auth.ts";
import { envSchema } from "../src/env.ts";
import { type ActiveOrg, landingFor, ueiSet } from "../src/lib/orgs.ts";
import { UEI_RE, clampLimit } from "../src/routes/entities.ts";

describe("requireUser (the BFF auth gate)", () => {
  const app = new Hono<{ Variables: AuthVariables }>();
  app.get("/guarded", requireUser, (c) => c.json({ ok: true }));

  it("rejects a request with no Authorization header (401)", async () => {
    const res = await app.request("/guarded");
    expect(res.status).toBe(401);
  });

  it("rejects a non-Bearer scheme (401)", async () => {
    const res = await app.request("/guarded", { headers: { Authorization: "Basic Zm9vOmJhcg==" } });
    expect(res.status).toBe(401);
  });

  it("rejects a malformed bearer token (401) without reaching a handler", async () => {
    // "not.a.jwt" fails compact-JWS parsing before any JWKS fetch — hermetic.
    const res = await app.request("/guarded", { headers: { Authorization: "Bearer not.a.jwt" } });
    expect(res.status).toBe(401);
  });
});

describe("UEI_RE (SSRF / path-injection guard)", () => {
  it("accepts a 12-char alphanumeric UEI", () => {
    expect(UEI_RE.test("CW52DR9J9DY4")).toBe(true);
  });

  it("rejects wrong length, punctuation, and path-traversal payloads", () => {
    expect(UEI_RE.test("short")).toBe(false);
    expect(UEI_RE.test("CW52DR9J9DY4X")).toBe(false); // 13
    expect(UEI_RE.test("CW52DR9J9DY")).toBe(false); // 11
    expect(UEI_RE.test("CW52DR9J9DY4/../etc")).toBe(false);
    expect(UEI_RE.test("../../secrets")).toBe(false);
    expect(UEI_RE.test("CW52DR9J9DY4?limit=1")).toBe(false);
  });
});

describe("envSchema prd fail-closed guards", () => {
  const base = {
    GC_SUPABASE_URL: "https://htgfjmjuzcqffdzuiphg.supabase.co",
    COREX_SERVICE_TOKEN: "tok",
    GC_DB_URL_POOLED: "postgres://user:pw@localhost:5432/db",
  };
  const COREX_TLS = "https://api.catalystdev.run"; // public host over TLS — OK
  const COREX_PRIVATE = "http://catalyst-api.railway.internal:8080"; // private net over http — OK
  const COREX_HTTP_PUBLIC = "http://catalyst-api-production-7d44.up.railway.app"; // plaintext public — rejected
  const SPA_ORIGIN = "https://app.governmentcontracted.com";

  it("rejects plaintext http to a public core-x host in prd (token-over-cleartext guard)", () => {
    const r = envSchema.safeParse({
      ...base,
      COREX_API_URL: COREX_HTTP_PUBLIC,
      ALLOWED_ORIGINS: SPA_ORIGIN,
      APP_ENV: "prd",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "COREX_API_URL")).toBe(true);
    }
  });

  it("accepts a public core-x host over https in prd", () => {
    const r = envSchema.safeParse({
      ...base,
      COREX_API_URL: COREX_TLS,
      ALLOWED_ORIGINS: SPA_ORIGIN,
      APP_ENV: "prd",
    });
    expect(r.success).toBe(true);
  });

  it("accepts a private *.railway.internal core-x host over http in prd", () => {
    const r = envSchema.safeParse({
      ...base,
      COREX_API_URL: COREX_PRIVATE,
      ALLOWED_ORIGINS: SPA_ORIGIN,
      APP_ENV: "prd",
    });
    expect(r.success).toBe(true);
  });

  it("rejects a missing / localhost ALLOWED_ORIGINS in prd", () => {
    const missing = envSchema.safeParse({ ...base, COREX_API_URL: COREX_TLS, APP_ENV: "prd" });
    expect(missing.success).toBe(false);
    const localhost = envSchema.safeParse({
      ...base,
      COREX_API_URL: COREX_TLS,
      ALLOWED_ORIGINS: "http://localhost:5173",
      APP_ENV: "prd",
    });
    expect(localhost.success).toBe(false);
  });

  it("is permissive outside prd — plaintext http public host + no ALLOWED_ORIGINS is fine in dev", () => {
    const r = envSchema.safeParse({ ...base, COREX_API_URL: COREX_HTTP_PUBLIC, APP_ENV: "dev" });
    expect(r.success).toBe(true);
  });
});

describe("landingFor (mirror app/page.tsx policy)", () => {
  const org = (o: Partial<ActiveOrg>): ActiveOrg => ({
    orgId: "o1",
    slug: null,
    category: "contractor",
    uei: null,
    ...o,
  });

  it("no active org → /access-expired, org null", () => {
    expect(landingFor([])).toEqual({ redirect: "/access-expired", org: null });
  });

  it("first org has a uei → contractor dashboard", () => {
    const o = org({ uei: "CW52DR9J9DY4" });
    expect(landingFor([o]).redirect).toBe("/dashboard/CW52DR9J9DY4");
  });

  it("first org has no uei but a slug → partner portal", () => {
    const o = org({ category: "capital_provider", slug: "acme-capital" });
    expect(landingFor([o]).redirect).toBe("/partner/acme-capital/spec");
  });

  it("first org has neither uei nor slug → /access-expired (but org echoed)", () => {
    const o = org({ slug: null, uei: null });
    const r = landingFor([o]);
    expect(r.redirect).toBe("/access-expired");
    expect(r.org).toEqual(o);
  });

  it("uei wins over slug, and only the FIRST org decides", () => {
    const first = org({ uei: "CW52DR9J9DY4", slug: "ignored" });
    const second = org({ orgId: "o2", uei: "ZZ52DR9J9DY9" });
    expect(landingFor([first, second]).redirect).toBe("/dashboard/CW52DR9J9DY4");
  });
});

describe("ueiSet (authorization set: uppercased, null-filtered)", () => {
  it("uppercases and drops null UEIs", () => {
    const orgs: ActiveOrg[] = [
      { orgId: "1", slug: null, category: "contractor", uei: "cw52dr9j9dy4" },
      { orgId: "2", slug: "p", category: "partner", uei: null },
      { orgId: "3", slug: null, category: "contractor", uei: "ZZ52DR9J9DY9" },
    ];
    const s = ueiSet(orgs);
    expect(s.has("CW52DR9J9DY4")).toBe(true);
    expect(s.has("ZZ52DR9J9DY9")).toBe(true);
    expect(s.size).toBe(2);
  });

  it("empty orgs → empty set", () => {
    expect(ueiSet([]).size).toBe(0);
  });
});

describe("clampLimit (mirror core-x's [1,100], default 25)", () => {
  it("defaults to 25 when unset", () => {
    expect(clampLimit(undefined)).toBe(25);
  });

  it("clamps below 1 up to 1 and above 100 down to 100", () => {
    expect(clampLimit("0")).toBe(1);
    expect(clampLimit("-5")).toBe(1);
    expect(clampLimit("9999")).toBe(100);
  });

  it("passes a valid value through", () => {
    expect(clampLimit("50")).toBe(50);
  });

  it("falls back to 25 on non-numeric garbage", () => {
    expect(clampLimit("abc")).toBe(25);
  });
});
