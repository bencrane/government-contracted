# platform-api

Read-only [Hono](https://hono.dev) BFF for the government-contracted signed-in app.
Runtime: **Node 20 + tsx** (TypeScript from source), deployed to **Railway**, secrets
via **Doppler** (`hq-government-contracted`). This is the phase-2 backend that lets
`platform-app` become a Vite + React SPA: it holds the core-x service token and brokers
reads over the private network so **core-x is never exposed to the public web**.

## What it does

- **Validates Supabase JWTs** (ES256 via JWKS) issued by the govcon Supabase project —
  the same verifier as `platform-app/lib/auth/jwt.ts`, reshaped into Hono middleware
  (`src/auth.ts`). Signature + issuer + audience are checked locally; no network hop
  after the first JWKS fetch.
- `GET /health` — unauthenticated liveness probe (Railway healthcheck).
- `GET /api/v1/me` — returns the authenticated user's `user_id`, `email`, `app_env`.
- `GET /api/v1/entities/:uei/{overview,sam-profile,active-contracts,past-performance}` —
  brokers the 4 core-x `catalyst_api` reads. The user's Supabase JWT is validated here,
  then the BFF calls core-x with the internal `COREX_SERVICE_TOKEN` (the user's JWT is
  **not** forwarded). `?limit=N` (clamped `1..100`, default 25) applies to the two
  award lists. The core-x `{ data }` envelope + status (incl. 404) pass through verbatim.

The `:uei` is regex-locked to `^[A-Za-z0-9]{12}$` — both a correctness check and an
SSRF / path-injection guard on the upstream URL.

### Deferred (later phase-2 steps, intentionally not here)

- `GET /api/v1/me/landing` — resolve the user's first active org → redirect target
  (replaces `app/page.tsx`'s membership query). Lands with the auth/landing move (step 3).
- Repointing `platform-app` at this BFF (step 2 cutover, reversible).

## Local dev

```bash
# From the monorepo root
pnpm install

# Secrets via Doppler (config prd holds the live Supabase + core-x values)
doppler run --project hq-government-contracted --config prd -- pnpm --filter platform-api dev
```

`pnpm --filter platform-api test` runs the unit suite (auth gate + UEI guard + limit clamp).
`pnpm --filter platform-api typecheck` runs `tsc --noEmit`.

## Env vars

Injected by Doppler at runtime. Canonical names take precedence; the platform-app
fallback names let the BFF boot against the existing config with no new keys.

| Canonical | Fallback (platform-app config) | Description |
|-----------|--------------------------------|-------------|
| `GC_SUPABASE_URL` | `NEXT_PUBLIC_GC_SUPABASE_URL` | Supabase project URL; issuer + JWKS derived from it |
| `COREX_API_URL` | `CATALYST_API_URL` | core-x `catalyst_api` base URL (prd → private `http://catalyst-api.railway.internal:8080`) |
| `COREX_SERVICE_TOKEN` | `CATALYST_API_TOKEN` | operator token presented to core-x as Bearer |
| `ALLOWED_ORIGINS` | — (defaults to localhost) | comma-separated CORS origins; **prd must set the SPA origin** |
| `APP_ENV` | — | `prd` \| `stg` \| `dev` |

`PORT` is injected by Railway, not Doppler. Defaults to `8000` locally.

### prd is fail-closed (boot requirements)

When `APP_ENV=prd`, `env.ts` **refuses to boot** unless:

- `COREX_API_URL` never sends the service token over the clear: a **public** core-x host must
  be **https** (TLS), or a **private** `*.railway.internal` host may use http. Set
  `COREX_API_URL=https://api.catalystdev.run` (the core-x service address over TLS).
- `ALLOWED_ORIGINS` is set to the real SPA origin(s) — the localhost dev default is rejected.
  Set `ALLOWED_ORIGINS=https://app.governmentcontracted.com`.

Both are already set in `hq-government-contracted/prd` (canonical `COREX_API_URL` takes
precedence over the `CATALYST_API_URL` fallback). Outside prd, the localhost CORS default
applies and the scheme guard is inert.

## Deployment

Railway service builds from `apps/platform-api/Dockerfile` (build context = repo root).
Auto-deploys from `main` via GitHub sync. After Railway creates the service, set the
Doppler token:

```bash
doppler configs tokens create prd-railway --project hq-government-contracted --config prd --plain
```
