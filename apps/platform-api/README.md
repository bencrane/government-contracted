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
- `GET /api/v1/me/landing` — resolves the user's first active org → `{ redirect, org }`
  (contractor dashboard / partner portal / `/access-expired`), replacing `app/page.tsx`'s
  membership query. Org membership is read live from Postgres (`src/lib/orgs.ts`).
- `GET /api/v1/entities/:uei/{overview,sam-profile,active-contracts,past-performance}` —
  brokers the 4 core-x `catalyst_api` reads. The user's Supabase JWT is validated here,
  then the BFF calls core-x with the internal `COREX_SERVICE_TOKEN` (the user's JWT is
  **not** forwarded). `?limit=N` (clamped `1..100`, default 25) applies to the two
  award lists. The core-x `{ data }` envelope + status (incl. 404) pass through verbatim.

**Authorization.** The `:uei` is regex-locked to `^[A-Za-z0-9]{12}$` (SSRF / path-injection
guard) **and** must belong to one of the caller's active orgs — resolved live per request
from Postgres (`GC_DB_URL_POOLED`, no service-role key). A non-owned UEI returns `404`
(indistinguishable from "unknown entity", so the surface can't enumerate UEIs); a DB outage
returns `503` (the client degrades to empty-state). This makes the BFF self-sufficient for
the SPA, which calls it directly with no upstream guard.

### Deferred (later phase-2 steps, intentionally not here)

- Dropping the factoring/partner surface (step 4) and the Next→Vite SPA swap (step 5).

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

Railway service `platform-api` in the `government-contracted` project. Live at
**`https://api.governmentcontracted.com`** (custom domain, TLS) — also reachable at its
`*.up.railway.app` domain. `DOPPLER_TOKEN` (a read service token for
`hq-government-contracted/prd`) and `RAILWAY_DOCKERFILE_PATH=apps/platform-api/Dockerfile`
are set as Railway service variables.

Deploy from a clean `main` checkout with the Railway CLI (GitHub auto-deploy is not wired
for this service):

```bash
railway up --service platform-api --ci   # build context = repo root, .gitignore-filtered
```

`API_BASE_URL` in `hq-government-contracted/prd` points platform-app at this BFF
(`https://api.governmentcontracted.com`); unset reverts platform-app to the legacy
direct-core-x read path.
