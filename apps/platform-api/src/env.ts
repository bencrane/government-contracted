/**
 * Runtime settings for platform-api (the government-contracted read BFF).
 *
 * Values come from Doppler project `hq-government-contracted` (see ./doppler.yaml).
 * Build/deploy uses config `prd`; local dev runs `doppler run --config prd -- pnpm dev`.
 *
 * Naming: this service converges on the rare-structure-hq template's `COREX_*`
 * convention for the core-x catalyst_api bridge, but reads with a fallback to the
 * names that already exist in the platform-app Doppler config (`CATALYST_API_*`,
 * `NEXT_PUBLIC_GC_SUPABASE_URL`). That lets the BFF boot against the EXISTING config
 * with zero new Doppler keys; the canonical names take precedence once the BFF gets
 * its own config.
 *
 * Fail-closed: every core-x + Supabase value is required unconditionally. The BFF's
 * sole purpose is to broker authenticated reads to core-x — it must never boot in a
 * state where it cannot verify a user OR cannot present its service token upstream.
 *
 * PORT lives at the Railway layer, NOT in Doppler. Read separately from
 * process.env.PORT (see index.ts) with a local-dev default of 8000.
 */

import { z } from "zod";

// Canonical name first, then the live platform-app fallback.
const supabaseUrl = process.env.GC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_GC_SUPABASE_URL;
const corexApiUrl = process.env.COREX_API_URL ?? process.env.CATALYST_API_URL;
const corexServiceToken = process.env.COREX_SERVICE_TOKEN ?? process.env.CATALYST_API_TOKEN;
const dbUrlPooled = process.env.GC_DB_URL_POOLED;

// Local-dev CORS default: the Vite SPA (5173) + the current Next app (3001). Applied
// ONLY outside prd (see below) — it must never silently stand in for a real prod origin.
const DEV_ALLOWED_ORIGINS = "http://localhost:5173,http://localhost:3001";

export const envSchema = z
  .object({
    // Supabase project that issues the app's access tokens. Issuer + JWKS are derived
    // from this single URL (see SUPABASE_ISSUER / SUPABASE_JWKS_URL below), mirroring
    // platform-app/lib/auth/jwt.ts so the verifier is byte-for-byte the same posture.
    GC_SUPABASE_URL: z.string().url(),
    // core-x catalyst_api — the Gen-3 read gateway. In prd this is the core-x service
    // address over TLS (https://api.catalystdev.run) or a private *.railway.internal
    // host over http. The prd guard below rejects plaintext http to a public host so the
    // COREX_SERVICE_TOKEN is never sent in the clear over an untrusted network.
    COREX_API_URL: z.string().url(),
    // Operator token presented to core-x as `Authorization: Bearer` (matches core-x's
    // CATALYST_API_TOKEN). This is the only thing that should ever hold it.
    COREX_SERVICE_TOKEN: z.string().min(1),
    // Supabase POOLED Postgres connection — the BFF's authorization + landing source of
    // truth (org memberships). Same value platform-app uses. Required: the BFF cannot
    // authorize a UEI or resolve landing without it.
    GC_DB_URL_POOLED: z.string().min(1),
    // Comma-separated CORS allow-list. Optional here so the localhost default can be
    // applied post-parse OUTSIDE prd; in prd it is required + must be a real origin.
    ALLOWED_ORIGINS: z.string().optional(),
    APP_ENV: z.enum(["prd", "stg", "dev"]),
  })
  .superRefine((val, ctx) => {
    // Fail-closed in prd. A token-holding broker must never boot in prd with a posture
    // that leaks the service token to the public internet or opens CORS to localhost.
    if (val.APP_ENV !== "prd") return;

    // (1) The COREX_SERVICE_TOKEN must never traverse an untrusted network in the clear.
    // Two acceptable prd postures: a public core-x host over https (TLS protects the
    // token — e.g. https://api.catalystdev.run), or a private *.railway.internal host
    // over http (plaintext is fine on the private net). Reject plaintext http to a public
    // host — that is the footgun (the CATALYST_API_URL fallback is a plain Railway URL).
    let corexUrl: URL | null = null;
    try {
      corexUrl = new URL(val.COREX_API_URL);
    } catch {
      /* z.string().url() already rejects malformed values */
    }
    if (
      corexUrl &&
      corexUrl.protocol !== "https:" &&
      !corexUrl.hostname.endsWith(".railway.internal")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["COREX_API_URL"],
        message:
          "in prd COREX_API_URL must use https for a public host (TLS protects the service " +
          "token — e.g. https://api.catalystdev.run) or a private *.railway.internal host " +
          "over http — got plaintext http to a public host",
      });
    }

    // (2) CORS must be set to the real SPA origin in prd — never the localhost default.
    const origins = (val.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    if (origins.length === 0 || origins.some((o) => o.includes("localhost"))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ALLOWED_ORIGINS"],
        message:
          "in prd ALLOWED_ORIGINS must be set to the SPA origin(s) (no localhost default) " +
          "— set ALLOWED_ORIGINS=https://app.governmentcontracted.com in hq-government-contracted/prd",
      });
    }
  });

const parsed = envSchema.safeParse({
  GC_SUPABASE_URL: supabaseUrl,
  COREX_API_URL: corexApiUrl,
  COREX_SERVICE_TOKEN: corexServiceToken,
  GC_DB_URL_POOLED: dbUrlPooled,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  APP_ENV: process.env.APP_ENV,
});

if (!parsed.success) {
  console.error("platform-api: env validation failed");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

// Derived, never configured directly — the issuer is the Supabase URL + /auth/v1,
// and the JWKS doc hangs off the issuer. Identical to platform-app/lib/auth/jwt.ts.
export const SUPABASE_ISSUER = `${env.GC_SUPABASE_URL}/auth/v1`;
export const SUPABASE_JWKS_URL = `${SUPABASE_ISSUER}/.well-known/jwks.json`;

// The localhost default applies only outside prd (the prd guard above guarantees a
// real value is present when APP_ENV==='prd'), so this fallback can never mask a
// missing prod origin.
export const allowedOrigins: string[] = (env.ALLOWED_ORIGINS ?? DEV_ALLOWED_ORIGINS)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
