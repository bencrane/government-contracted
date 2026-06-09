# Platform App — Canonical Operational Reference

`apps/platform-app` is the authenticated Next.js application served at
`https://app.governmentcontracted.com`. This document is the single source a new operator or
agent reads end-to-end to understand how it is built, deployed, authenticated, how it sources
live data, and where the current sharp edges are. It is self-contained.

Every load-bearing claim carries a re-runnable verification — a shell command, a `curl`, a
SQL `SELECT`, or a `file:line`. Run them; do not take prose on faith. All commands assume the
repo root `~/government-contracted` and authenticated `railway` / `doppler` / Supabase access.

**Verification contract:** the commands in this doc are reads, `curl`s against the live app,
and `SELECT`s — run them to confirm any claim. Two defects that earlier affected this app (the
six SAM-derived logins returning 500; the magic-link callback emitting a dead-host redirect)
have since been **fixed and verified live**; §9 and §4 describe the resolved state and retain
the root-cause explanation so the failure mode stays understood.

**Point-in-time snapshot (not permanent — re-check before relying):**
- Verified: **2026-06-09**.
- `government-contracted` `main` HEAD at verification: `d13c83b` (`git log -1 --oneline`).
  This is a moving target; never treat a specific hash as "the" state — run the command.
- `core-x` `main` HEAD on disk at verification: `bcc49f0`.
- Live production deployment serving the app: a Railway build deployed from `main` at
  `d13c83b` (status `SUCCESS`). The live build does **not** track a fixed git ref — see §2 on
  how to identify what is actually serving (fingerprint, not git).

---

## 1. Repository layout

A pnpm workspace at the repo root containing two independent Next.js apps.

- pnpm monorepo (`pnpm-workspace.yaml` → `packages: ['apps/*']`), Node ≥ 20,
  `packageManager pnpm@9.12.0` (root `package.json`).
- `apps/platform-app` — the authenticated app. Next.js `15.5.15`, App Router, React 19.
  Local dev port **3001** (`"dev": "next dev -p 3001"`).
- `apps/marketing-site` — the separate public marketing site (also Next.js `15.5.15`). Not
  covered further here; it is a different deploy with its own concerns.
- Root convenience scripts: `pnpm dev:platform`, `pnpm build:platform`, `pnpm dev:marketing`,
  `pnpm build:marketing`, `pnpm -r lint`.

Verify:
```bash
cat pnpm-workspace.yaml                                   # packages: ['apps/*']
node -e "const p=require('./package.json'); console.log(p.packageManager, p.engines.node)"
node -e "const p=require('./apps/platform-app/package.json'); console.log(p.dependencies.next, p.scripts.dev)"
```

---

## 2. Deployment — read this before shipping

The platform app runs on **Railway**, built from a Dockerfile, secrets injected by **Doppler**
at container start.

| Fact | Value | Verify |
|---|---|---|
| Railway project | `government-contracted` (id `c6b683bd-3fa5-4862-858f-dc3189b06c95`) | `railway status --json` |
| Environment | `production` | `railway status` |
| Service | `platform-app` (id `cb808e92-84ee-407a-9875-d5e433d60da1`) | `railway status --json` |
| Region / scale | `us-east4-eqdc4a`, 1 replica | `railway status --json` (`multiRegionConfig`); live responses carry `x-railway-edge: railway/us-east4-eqdc4a` |
| Builder | Dockerfile at `apps/platform-app/Dockerfile` | `railway status --json` (`serviceManifest.build.builder = DOCKERFILE`) |
| Public host | `app.governmentcontracted.com` | `curl -s -o /dev/null -w "%{http_code}\n" https://app.governmentcontracted.com/login` → 200 |

```bash
cd ~/government-contracted && railway status        # Project / Environment / Service
railway whoami                                      # authed account
railway status --json                               # ids, region, replicas, latest deployment
```

### Build & runtime container

- `apps/platform-app/Dockerfile` is multi-stage (`deps` → `builder` → `runner`). The builder
  runs `doppler run -- pnpm build`; `next.config.ts` sets `output: 'standalone'`
  (`outputFileTracingRoot` pointed at the repo root so the standalone bundle includes hoisted
  workspace `node_modules`).
- The standalone server entry lands at `apps/platform-app/server.js` (the pnpm-workspace path
  is replicated inside `.next/standalone`).
- Runtime env baked into the image: `NODE_ENV=production`, `PORT=3000`, `HOSTNAME=0.0.0.0`
  (`Dockerfile:53-55`). **The standalone server binds `0.0.0.0:3000` inside the container** —
  this is the root cause of the redirect rule in §4; remember it.
- Entrypoint `apps/platform-app/docker-entrypoint.sh:8`:
  `exec doppler run -- node apps/platform-app/server.js`. Doppler resolves secrets via a
  config-scoped `DOPPLER_TOKEN` (so no `-p/-c` flags are needed — project/config are inferred
  from the token; see §6).

```bash
sed -n '52,70p' apps/platform-app/Dockerfile          # PORT=3000 HOSTNAME=0.0.0.0, standalone copy, entrypoint
cat apps/platform-app/docker-entrypoint.sh            # doppler run -- node apps/platform-app/server.js
cat apps/platform-app/next.config.ts                  # output: 'standalone'
```

### How deploys happen — and the honest limits of what is verifiable

Deploys are driven from the Railway CLI from the repo root (the linked directory):

```bash
railway up --service platform-app --environment production
```

In a non-TTY the CLI uploads the build context, prints a **Build Logs** URL, and detaches;
**exit 0 means "build queued," not "deployed and healthy."** Read success/failure from the
Build Logs URL or the Railway dashboard.

There is **no Railway config file in the repo** (`railway.json` / `railway.toml` are absent),
and the service manifest shows empty `watchPatterns`. That is *consistent with* manual,
CLI-driven deploys and the absence of a push-to-deploy trigger — **but it does not prove it.**
Whether a GitHub repository is connected for auto-deploy is a Railway service setting that
`railway status` does not expose. **Do not assume merging to `main` deploys anything.** Treat
production as "whatever was last `railway up`'d" until you confirm the source setting in the
Railway dashboard (Service → Settings → Source).

```bash
ls railway.json railway.toml apps/platform-app/railway.* 2>&1     # expect: No such file
railway status --json | grep -o '"watchPatterns":\[[^]]*\]'        # expect: "watchPatterns":[]
```

### Identifying what is actually live (do not infer from git)

Because production tracks a build, not a branch, **never reason about the live app from git
state.** Fingerprint the served build via its immutable Next static asset hashes:

```bash
curl -s https://app.governmentcontracted.com/login \
  | grep -oE "/_next/static/[^\"']+" | sort -u | shasum
```

Run it before and after a deploy; the digest changes when a new build is serving. At
verification time it was stable at `352e7ce25c5f3deab6772e9d5296a2e8d20b342b`. (The regex
incidentally captures a few stray `\`-suffixed duplicates from inline markup; harmless to the
digest, which remains a valid build identity.) The current live build already includes the
relative-redirect fix described in §4 — confirmed by the live signout behavior below.

---

## 3. App structure & request lifecycle

Server-first App Router. The pieces a fresh agent must hold in their head:

- `middleware.ts` runs on every non-asset request and calls
  `lib/supabase/middleware.updateSession(request)` to refresh the Supabase session cookie
  (`middleware.ts:5`; matcher excludes `_next/static`, images, favicon).
- `app/page.tsx` (root, server component) is the post-login router. It reads the authenticated
  user, looks up the **first** active org membership (`ORDER BY m.created_at ASC LIMIT 1`), and
  redirects:
  - that org has a `uei` → `/dashboard/{uei}` (contractor dashboard);
  - else it has a `slug` → `/partner/{slug}/spec` (partner portal);
  - else → `/access-expired`.
  It branches on the *first* org's fields, not "find any org that happens to have a uei"
  (`app/page.tsx:15-37`).
- `app/login/page.tsx` is a `"use client"` form bound to the `signIn` server action.
- Dashboard surfaces live under `app/dashboard/[uei]/…`; the partner portal under
  `app/partner/[slug]/…`. The `[uei]` param is untrusted and authorized in `lib/tenant.ts`
  (§5).

```bash
sed -n '1,11p' apps/platform-app/middleware.ts
sed -n '1,38p' apps/platform-app/app/page.tsx
head -8 apps/platform-app/app/login/page.tsx        # 'use client'
```

---

## 4. The `request.url` → `0.0.0.0:3000` redirect rule (load-bearing)

**The rule:** in a route handler on this deploy, do **not** build any user-facing URL from
`request.url` (or `request.nextUrl.origin`). Use a relative `Location` (`/login`) or
`redirect('/path')` from `next/navigation` (which emits a relative location).

**Why:** the standalone server binds `HOSTNAME=0.0.0.0` / `PORT=3000` inside the container
(§2). Behind Railway's proxy, `request.url` carries that internal bind address, so
`NextResponse.redirect(new URL('/login', request.url))` emits
`Location: https://0.0.0.0:3000/login` — a dead host the browser cannot follow. The session
mutation still happens; the navigation silently fails.

**This is not hypothetical — it bit two endpoints, and both now follow the rule.** Confirm
both emit a relative `Location` (no `0.0.0.0`) live:

```bash
# Sign-out — relative Location, 303 to /login:
curl -s -i -X POST https://app.governmentcontracted.com/auth/signout | grep -iE "^HTTP|^location"
#   HTTP/2 303
#   location: /login

# Magic-link / OAuth callback — relative Location, 303 to /login (missing-code path):
curl -s -i https://app.governmentcontracted.com/auth/callback | grep -iE "^HTTP|^location"
#   HTTP/2 303
#   location: /login?error=missing_code
```

**History (why the rule exists):** `app/auth/callback/route.ts` originally built all three
redirects with `new URL(path, request.url)` and therefore emitted
`Location: https://0.0.0.0:3000/...` in production — the missing-code, exchange-error, and
post-exchange `next` redirects all sent the browser to a dead host, so magic-link sign-in
never completed. It was fixed (commit `d13c83b`, #9) to emit relative `Location`s directly via
`new NextResponse(null, { status: 303, headers: { Location } })`, mirroring
`app/auth/signout/route.ts`. Sign-out had the identical bug earlier and was fixed the same way.

The current callback also hardens the caller-supplied `next` param: it accepts only a same-app
absolute path (single leading `/`, not protocol-relative `//host`), so the redirect is both
relative *and* not an open redirect (`app/auth/callback/route.ts`, `safeRelative`).

`file:line` for the rule (both auth routes now emit relative `Location`s; neither derives a
user-facing origin from `request.url`):
```bash
grep -rn "request.url" apps/platform-app/app/auth        # only comment lines remain — neither route builds a redirect from it
sed -n '1,46p' apps/platform-app/app/auth/callback/route.ts   # relative redirects + next-param hardening
sed -n '19,41p' apps/platform-app/app/auth/signout/route.ts   # relative Location: /login (the same shape)
```

---

## 5. Authentication, sign-out, and the tenant model

Auth is **Supabase Auth** (email/password + magic link) against Supabase project
`government-contracted`, ref `htgfjmjuzcqffdzuiphg`.

```bash
doppler secrets get NEXT_PUBLIC_GC_SUPABASE_URL --project hq-government-contracted --config prd --plain
#   https://htgfjmjuzcqffdzuiphg.supabase.co
```

### Sign-in

`app/login/page.tsx` (client) drives the `signIn` server action in `app/auth/actions.ts`:
- password → `supabase.auth.signInWithPassword`; success → `redirect('/')` (`actions.ts:48-52`).
- magic link → `supabase.auth.signInWithOtp` with `emailRedirectTo = {proto}://{host}/auth/callback`
  built from request **headers** (`host` + `x-forwarded-proto`), not `request.url`
  (`actions.ts:20-31`). The magic-link landing then hits `/auth/callback`, which now emits
  relative redirects (§4), so the flow completes cleanly.

### Sign-out — two implementations, intentionally

Both exist and are both wired. This is by design, not drift:

1. **Server action `signOut`** (`app/auth/actions.ts:55-59`): `auth.signOut()` then
   `redirect('/login')`. Used by `app/access-expired/page.tsx:35` via `<form action={signOut}>`.
   That page is a **server component**, so the form is a real server-action submit and the
   redirect is relative.
2. **Route handler `POST /auth/signout`** (`app/auth/signout/route.ts`): `createServerClient`
   → `auth.signOut()` → `303` with a **relative** `Location: /login`, with the cleared cookies
   written onto the response. The two sidebars post to it with a native HTML form:
   - `components/dashboard/ContractorSidebar.tsx:144` — `<form action="/auth/signout" method="post">`
   - `components/partner/PartnerSidebar.tsx:128` — same.

   The sidebars use (2) rather than (1) because both sidebars are `"use client"` components,
   and a server action bound inside a client-component form is rendered by React with
   `action="javascript:throw new Error('A React form was unexpectedly submitted…')"`, with the
   real submit wired client-side — so it only works **after** the (heavy) dashboard hydrates.
   The native form + route handler has no hydration dependency and works regardless. This
   rationale is recorded verbatim in the header comment of `route.ts`
   (`app/auth/signout/route.ts:6-18`). (The `javascript:throw` markup is standard React
   client-component behavior; the comment is the documented reason, not a measured artifact.)

```bash
sed -n '6,41p' apps/platform-app/app/auth/signout/route.ts
grep -n 'action="/auth/signout"' apps/platform-app/components/dashboard/ContractorSidebar.tsx \
                                  apps/platform-app/components/partner/PartnerSidebar.tsx
grep -n "use client" apps/platform-app/components/dashboard/ContractorSidebar.tsx \
                     apps/platform-app/components/partner/PartnerSidebar.tsx
```

### Tenant / authorization model

The schema lives in `apps/platform-app/migrations/`:

- `auth.users` insert → trigger `on_auth_user_created` → function `handle_new_auth_user()` →
  `INSERT INTO public.users (auth_user_id, email)` (`migrations/001_initial.sql:233-251`).
- `organizations` — one row per business entity. `uei text UNIQUE` (nullable), `category text
  NOT NULL`, `slug text UNIQUE`, plus SAM.gov fields (`cage_code`, `naics_*`, `sam_*`,
  `sam_snapshot jsonb`) (`migrations/001_initial.sql:33-55`).
- `organization_memberships (user_id, organization_id, role, status)` with
  `role CHECK IN ('owner','admin','member')`, `status CHECK IN ('active','revoked')` DEFAULT
  `'active'`, PK `(user_id, organization_id)` (`migrations/001_initial.sql:78-86`).
- `platform_admins` — a **global, cross-tenant** grant for privileged ops that have no owning
  tenant org to authorize against (chiefly factor onboarding, `POST /api/factors`). It is a
  *row*, not a boolean flag: columns `user_id` (PK → `users.id`), `granted_by`, `note`,
  `granted_at`, `revoked_at`. "Active" means `revoked_at IS NULL` (there is **no** `is_active`
  column). Distinct from per-org `role='admin'` (`migrations/003_platform_admins.sql`).

Authorization code:

- `lib/session.ts` — `getSessionOrgs()`, `getSessionOrgUeis()` (uppercased UEI set),
  `isSessionPlatformAdmin()`. Each does a **fresh DB round-trip per request**; memberships and
  the admin grant are **not** packed into the JWT, so a revoked membership/grant takes effect
  immediately (`lib/session.ts:29,56,73`).
- `lib/tenant.ts` — `resolveTenantUei(rawUei)`: the `[uei]` route param is untrusted;
  normalized to `^[A-Z0-9]{12}$`, `notFound()` if malformed, `redirect('/login')` if anon,
  `notFound()` if the UEI is not in the session's active-membership set (404-not-403 so an
  attacker cannot probe which UEIs exist by status code) (`lib/tenant.ts:25-36`). Also
  `requireSessionOrg`, `requireSession`, `requirePlatformAdmin` for route handlers
  (`lib/tenant.ts:53,66,82`).
- DB access from the app uses the pooled connection `GC_DB_URL_POOLED` via
  `lib/audience-specs/db.ts:7` (`new Pool({ connectionString: env.GC_DB_URL_POOLED, max: 4 })`).

```bash
sed -n '233,251p' apps/platform-app/migrations/001_initial.sql    # trigger + handle_new_auth_user
sed -n '78,86p'   apps/platform-app/migrations/001_initial.sql    # memberships CHECK constraints
sed -n '23,39p'   apps/platform-app/migrations/003_platform_admins.sql
sed -n '25,36p'   apps/platform-app/lib/tenant.ts
```

---

## 6. Configuration & secrets (Doppler)

Doppler project `hq-government-contracted`, config `prd` (`apps/platform-app/doppler.yaml`).
The runtime `DOPPLER_TOKEN` is scoped to this single config, so the entrypoint's `doppler run`
infers project + config (no flags).

Validated at boot by `lib/env.ts` (zod). The app **fails to start** if these are wrong:

- `NEXT_PUBLIC_GC_SUPABASE_URL` (url), `NEXT_PUBLIC_GC_SUPABASE_PUBLISHABLE_KEY` (non-empty),
  `GC_DB_URL_POOLED` (non-empty), `APP_ENV` ∈ `dev|stg|prd` (`lib/env.ts:5-8`).
- `CATALYST_API_URL`, `CATALYST_API_TOKEN` — optional in `dev`, **required when `APP_ENV !==
  'dev'`**, enforced fail-closed in a `superRefine` (`lib/env.ts:12-28`). In production
  (`APP_ENV=prd`) both are mandatory, so the BFF can never resolve a tenant against an
  unauthenticated gateway.

**No Supabase `service_role` / secret key is stored in Doppler** — only the publishable key.
Privileged DB work goes through `GC_DB_URL_POOLED` or the Supabase management API.

```bash
doppler secrets --project hq-government-contracted --config prd --only-names   # note: no *SERVICE_ROLE* / Supabase secret key
doppler secrets get APP_ENV --project hq-government-contracted --config prd --plain    # prd
sed -n '1,29p' apps/platform-app/lib/env.ts
```

Time-sensitive note: secret *values* and the set of secrets can change at any time; the
`--only-names` / `get` commands above are the live source of truth, not this list.

---

## 7. Live data dependency — `catalyst_api` (core-x)

Dashboard surfaces are **not** read from the platform DB. They are fetched from the core-x
private read gateway `catalyst_api` through `lib/catalyst/client.ts`. The platform DB supplies
identity/tenant routing; catalyst_api supplies the federal-contracting payloads.

**Verify the contract against the LIVE service — the on-disk `core-x` copy is stale.** This is
critical and is the one place where reading the repo will actively mislead you:

- The client calls `GET {CATALYST_API_URL}/api/v1/entities/{uei}/{surface}` with `Authorization:
  Bearer {CATALYST_API_TOKEN}`, surface ∈ `sam-profile | overview | active-contracts |
  past-performance`, response envelope `{ data: … }`, and treats HTTP `404` as `null`
  (`lib/catalyst/client.ts:36,42,46,50-70`). `active-contracts` / `past-performance` take a
  `?limit=N`.
- The **deployed** catalyst_api advertises exactly those four entity surfaces. Confirm from its
  open root endpoint:

```bash
U=$(doppler secrets get CATALYST_API_URL   --project hq-government-contracted --config prd --plain)
T=$(doppler secrets get CATALYST_API_TOKEN --project hq-government-contracted --config prd --plain)
curl -s "$U/"
#   {... "sam_profile":"/api/v1/entities/{uei}/sam-profile",
#        "active_contracts":"/api/v1/entities/{uei}/active-contracts?limit=N",
#        "overview":"/api/v1/entities/{uei}/overview",
#        "past_performance":"/api/v1/entities/{uei}/past-performance?limit=N" ...}
```

- **Stale-checkout warning:** the `core-x` working copy on disk (HEAD `bcc49f0` at
  verification) does **not** contain these routes. `core-x/apps/catalyst_api/main.py` there
  exposes only a *domain*-keyed `GET /api/v1/award-profile/{domain}`, and
  `core-x/apps/catalyst_api/src/models.py` defines `Company / AwardProfile /
  AwardProfileResponse`, **not** `SamProfilePayload` / `OverviewPayload` / etc. The deployed
  service is ahead of the local checkout. **Trust the live `/` endpoint map (and
  `lib/catalyst/client.ts` on the platform side) for the wire contract — not the local core-x
  files.** If you need the payload field shapes, read them off live responses or the
  platform-side `lib/catalyst/types.ts`, and `git fetch` core-x before believing its API
  surface.

### Resolution behavior (verified live)

`404` (unknown UEI, or known UEI with no relevant footprint) → client returns `null` → the
surface renders its empty state. So an org whose `uei` does not resolve in catalyst_api shows
empty SAM/overview tiles while identity strip and tenant routing still work from the Supabase
row.

```bash
# Synthetic UEI — does not resolve (empty state):
curl -s -o /dev/null -w "ACMEFED00001/overview -> %{http_code}\n" \
  -H "Authorization: Bearer $T" "$U/api/v1/entities/ACMEFED00001/overview"          # 404
# A real seeded UEI that DOES resolve, with live award data:
curl -s -o /dev/null -w "UCDDUN6A6S17/overview -> %{http_code}\n" \
  -H "Authorization: Bearer $T" "$U/api/v1/entities/UCDDUN6A6S17/overview"          # 200
# Real UEI, but no SAM registration in the golden layer -> 404 -> empty SAM tile:
curl -s -o /dev/null -w "SS8JL7WNHPX9/sam-profile -> %{http_code}\n" \
  -H "Authorization: Bearer $T" "$U/api/v1/entities/SS8JL7WNHPX9/sam-profile"       # 404
```

In `dev` with `CATALYST_API_URL` unset, the client short-circuits to `null` (empty-state path)
without a network call (`lib/catalyst/client.ts:26-34`).

Time-sensitive note: which UEIs resolve, and the award figures returned, are properties of the
core-x golden layer and will drift. The 404→empty-state *mechanism* is stable; specific
resolutions are snapshots.

---

## 8. Dashboard sidebar layout constraint

`apps/platform-app/components/dashboard/DashboardShell.tsx:77` wraps the sidebar in a
collapse-animation container that is the sticky scroll element:
`sticky top-0 hidden h-screen shrink-0 self-start overflow-hidden transition-[width] … md:block`.
Each sidebar `<aside>` is `h-full`, **not** `sticky`/`h-screen`
(`ContractorSidebar.tsx:79`, `PartnerSidebar.tsx:61`).

**Do not move `sticky top-0 h-screen` back onto the `<aside>`.** The wrapper's `overflow-hidden`
makes it the sticky scroll-container; a `sticky` aside inside it pins relative to that wrapper,
not the viewport, and detaches/floats once the page scrolls past one viewport height. (This is
a CSS containing-block consequence; the current source already encodes the correct structure.)

```bash
sed -n '74,82p' apps/platform-app/components/dashboard/DashboardShell.tsx
grep -n "<aside" apps/platform-app/components/dashboard/ContractorSidebar.tsx \
                 apps/platform-app/components/partner/PartnerSidebar.tsx
```

---

## 9. Seed / test accounts

These are test/demo accounts (fake or non-deliverable emails) created to sign in "as" a
SAM.gov entity. **All of them authenticate today.** Until recently the 17 SAM-derived accounts
(across the six subawardee orgs) returned a `500` on sign-in; that was repaired — see
"SAM-derived accounts" below. Shared password for the SAM-derived set is `testing123!`.

### Operator / synthetic accounts

| Login | Password | Owns | Notes |
|---|---|---|---|

| Login | Password | Owns | Notes |
|---|---|---|---|
| `contractor@acmefed.test` | `AcmeFed-Test-2026` | `Acme Defense Solutions LLC` (UEI `ACMEFED00001`) | UEI is synthetic; does **not** resolve in catalyst_api, so its SAM/overview tiles are empty. |
| `tools@substrate.build` | `testing123!` | `Acme Defense Solutions LLC` (contractor) **and** `Capitol Surety Partners` (surety_provider) | Active **platform admin** (`platform_admins`, `revoked_at IS NULL`, note "bootstrap admin"). Use this to exercise platform-admin paths. |

Both verified live against the Supabase token endpoint (HTTP 200 + `access_token`):
```bash
S=$(doppler secrets get NEXT_PUBLIC_GC_SUPABASE_URL             --project hq-government-contracted --config prd --plain)
K=$(doppler secrets get NEXT_PUBLIC_GC_SUPABASE_PUBLISHABLE_KEY --project hq-government-contracted --config prd --plain)
curl -s -o /dev/null -w "acme  -> %{http_code}\n" -X POST "$S/auth/v1/token?grant_type=password" \
  -H "apikey: $K" -H 'Content-Type: application/json' \
  -d '{"email":"contractor@acmefed.test","password":"AcmeFed-Test-2026"}'      # 200
curl -s -o /dev/null -w "tools -> %{http_code}\n" -X POST "$S/auth/v1/token?grant_type=password" \
  -H "apikey: $K" -H 'Content-Type: application/json' \
  -d '{"email":"tools@substrate.build","password":"testing123!"}'             # 200
```

### SAM-derived accounts — the six subawardee orgs (repaired; all log in)

Six real subawardee contractor orgs each have login users derived from the entity's real SAM
points of contact — **17 accounts total** (one `owner` + one or more `admin` per org), all
sharing password `testing123!`. The **owner** login per org:

| Org (legal name) | UEI (12-char) | Owner login |
|---|---|---|
| PWS INTERNATIONAL, INC. | `CW52DR9J9DY4` | `frederick.parkerjr@pwsinternational.com` |
| SARGENT & LUNDY ENGINEERING SERVICES, INC. | `N2SNHMPLTJS9` | `daniel.weinacht@sargentlundyengineeringservices.com` |
| BURNS & MCDONNELL ENGINEERING COMPANY, INC. | `SS8JL7WNHPX9` | `sara.fields@burnsmcd.com` |
| HARPER FEDERAL CONSTRUCTION LLC | `JJMXSCBJZKK5` | `jeffrey.harper@harperfederalconstruction.com` |
| RAPISCAN SYSTEMS INC | `UCDDUN6A6S17` | `stephen.mchugh@rapiscansystems.com` |
| HUKARIASCENDENT INC | `XKHGKMPMKW25` | `jason.lawless@hukari.com` |

(The `admin` users per org — e.g. `mary.dalton@pwsinternational.com`,
`jeff.barrett@burnsmcd.com` — share the same password and were repaired in the same fix.)

**Current state: all 17 authenticate (HTTP 200 + `access_token`).** Verify any of them — and
prove it at the API, not in the DB (a DB check is exactly what once masked this):

```bash
for e in frederick.parkerjr@pwsinternational.com daniel.weinacht@sargentlundyengineeringservices.com \
         sara.fields@burnsmcd.com jeffrey.harper@harperfederalconstruction.com \
         stephen.mchugh@rapiscansystems.com jason.lawless@hukari.com; do
  curl -s -o /dev/null -w "$e -> %{http_code}\n" -X POST "$S/auth/v1/token?grant_type=password" \
    -H "apikey: $K" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$e\",\"password\":\"testing123!\"}"      # each -> 200
done
```

**Why they were broken, and the fix (history — keep this so it doesn't recur):** these rows
were created by direct SQL insert into `auth.users` with **NULL** GoTrue string-token columns
(`confirmation_token`, `recovery_token`, `email_change`, `email_change_token_new`). Supabase
GoTrue scans those columns into non-nullable Go strings during user lookup and 500s with
`Database error querying schema` — auth log: `error finding user: sql: Scan error on column
index 3, name "confirmation_token": converting NULL to string is unsupported`. Because the
500 happens at user lookup, it fired *before* any password comparison, so the password was
irrelevant to the failure. The two operator/synthetic accounts above were unaffected because
their token columns were empty strings, not NULL.

The repair set the NULL token columns to `''` (matching the good accounts) for exactly the
affected rows — passwords and all other fields untouched:

```sql
-- Applied repair (recorded for provenance; the WHERE matches only the defective rows).
UPDATE auth.users
SET confirmation_token         = COALESCE(confirmation_token, ''),
    recovery_token             = COALESCE(recovery_token, ''),
    email_change               = COALESCE(email_change, ''),
    email_change_token_new     = COALESCE(email_change_token_new, ''),
    email_change_token_current = COALESCE(email_change_token_current, ''),
    phone_change               = COALESCE(phone_change, ''),
    phone_change_token         = COALESCE(phone_change_token, ''),
    reauthentication_token     = COALESCE(reauthentication_token, '')
WHERE confirmation_token IS NULL OR recovery_token IS NULL OR email_change IS NULL
   OR email_change_token_new IS NULL OR email_change_token_current IS NULL
   OR phone_change IS NULL OR phone_change_token IS NULL OR reauthentication_token IS NULL;
```

If a future seed inserts SAM-derived users by raw SQL again, they will reappear broken — create
them via the Supabase Admin API / `signUp` (which initializes the columns), or re-run the
backfill above. Confirm none are currently broken (expect `0`):

```sql
SELECT count(*) AS null_token_rows FROM auth.users
WHERE confirmation_token IS NULL OR recovery_token IS NULL OR email_change IS NULL
   OR email_change_token_new IS NULL OR email_change_token_current IS NULL
   OR phone_change IS NULL OR phone_change_token IS NULL OR reauthentication_token IS NULL;
```

Run SQL via either path (Supabase project ref `htgfjmjuzcqffdzuiphg`):
```bash
doppler run --project hq-government-contracted --config prd -- psql "$GC_DB_URL_POOLED" -c "<sql>"
# or the Supabase MCP execute_sql against project ref htgfjmjuzcqffdzuiphg
```

### Note on UEI resolution for the six

These six UEIs are real, 12-character UEIs. Their catalyst_api resolution varies (it is a
property of the core-x golden layer, and will drift): at verification, `UCDDUN6A6S17` (Rapiscan)
resolved (`overview` → 200 with award data) while `SS8JL7WNHPX9` (Burns & McDonnell) had no SAM
registration (`sam-profile` → 404). The display names (e.g. "Frederick G Parker Jr") are stored
in `public.users.display_name` and are plausibly SAM-sourced; the email local parts are
constructed `first.last@<domain>` and do not receive mail (SAM carries no deliverable email).
Cross-checking name provenance against core-x `sam_pocs` is out of scope and unverified here.

### Full roster query

```sql
SELECT au.email, u.display_name, m.role, m.status, o.name, o.category, o.uei
FROM auth.users au
JOIN public.users u ON u.auth_user_id = au.id
LEFT JOIN public.organization_memberships m ON m.user_id = u.id
LEFT JOIN public.organizations o ON o.id = m.organization_id
ORDER BY o.name, m.role;
```

Heads-up: `organizations` also holds a large factoring test-fixture layer beyond the
login-bearing orgs — many `capital_provider` "Test Factor LLC"/seed rows, plus `Contractor
F3UEI*` orgs with **9-character** UEIs and other non-12-char seeds. Those will not pass the
`lib/tenant.ts` `^[A-Z0-9]{12}$` guard and generally have no auth users; do not treat the login
roster as the full `organizations` table.

---

## 10. Local development & checks

```bash
pnpm --filter platform-app dev          # http://localhost:3001
pnpm --filter platform-app typecheck    # tsc --noEmit
pnpm --filter platform-app lint         # next lint
pnpm --filter platform-app test         # vitest run
```

`typecheck` currently exits non-zero, but **every error is confined to
`apps/platform-app/tests/acceptance/factoring/**`** — two classes only: `TS2345` (`Request` vs
`NextRequest` argument typing) and `TS2578` (stale/unused `@ts-expect-error` directives). No
app/lib source errors. These are pre-existing test-harness typing issues, unrelated to the
auth/sidebar/catalyst code; a green app build coexists with this red test typecheck. Confirm
the scope yourself before assuming a new error is "pre-existing":

```bash
pnpm --filter platform-app typecheck 2>&1 | grep -oE "^[^ ]+\.tsx?" | sort -u
#   expect every path under tests/acceptance/factoring/...
```

---

## 11. Recent history (point-in-time)

Snapshot at verification (`git log --oneline`, `main`); a hash is never permanent — re-run the
command rather than trusting the list:

```
a235b92  docs: platform-app operational reference (…)                              (#8)  <- HEAD at verification
d40a893  fix(platform-app): signout redirect must be relative, not request.url     (#7)
ec9eb17  fix(platform-app): sign out via native POST route, not a client-bound …   (#6)
eb27014  fix(platform-app): keep dashboard sidebar pinned full-height on scroll    (#5)
dfa9448  fix(platform-app): wire sidebar Sign out to the signOut server action     (#4)
899de8a  feat(platform-app): gate factor onboarding behind platform-admin authz    (#3)
```

`d40a893` is the commit that made sign-out emit a relative `Location` (the §4 fix); the live
build already serves it (verified by the live signout `curl` in §4). **Production reflects
whatever was last `railway up`'d, not a git ref — identify the live build with the fingerprint
command in §2, never from git state.**

---

## 12. Sharp edges & recently-resolved defects (summary)

A fresh agent should internalize these before touching the app. The first two are **resolved**
— kept here because they explain current behavior and are recurrence risks:

1. **RESOLVED — SAM-derived test logins.** The 17 accounts across the six subawardee orgs once
   500'd on sign-in (NULL `auth.users` token columns; GoTrue "querying schema" scan error).
   Backfilled to `''`; all 17 now authenticate (HTTP 200). Recurrence risk: re-seeding those
   users by raw SQL reintroduces it — use the Admin API or re-run the backfill. See §9.
2. **RESOLVED — `app/auth/callback/route.ts` redirect.** It built redirects from `request.url`
   and emitted `https://0.0.0.0:3000/...` (dead host) in production. Fixed (commit `d13c83b`,
   #9) to emit relative `Location`s, plus an open-redirect guard on `next`; verified live. The
   §4 rule (never derive a user-facing URL from `request.url`) still governs new route handlers.
   See §4.
3. **The on-disk `core-x` checkout is behind the deployed catalyst_api.** Its `main.py` /
   `models.py` describe a domain-keyed API; production exposes the UEI surfaces the platform
   client uses. Verify the contract from the live `/` map, not the repo. See §7.
4. **Deploy auto-vs-manual is not provable read-only.** No repo Railway config and empty
   `watchPatterns` suggest manual `railway up`, but confirm the source setting in the Railway
   dashboard before assuming merges don't deploy. See §2.
5. **`typecheck` is red but only in `tests/acceptance/factoring/**`.** Don't mistake it for a
   broken app. See §10.

Items that are externally-driven and will drift (re-verify, never cache): the live build
fingerprint, the active Railway deployment id, Doppler secret values, and which UEIs resolve in
catalyst_api with what figures.
