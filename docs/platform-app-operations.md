# Platform App — Operational Reference

Canonical, verifiable description of how `apps/platform-app` is built, deployed,
authenticated, and how it sources live data. Every claim below has a verification
command or a file reference. Confirm against the live system before relying on it.

Repo: `github.com/bencrane/government-contracted` · default branch `main`
At time of writing `main` is at `d40a893`.

---

## 1. Repository layout

- pnpm monorepo (`pnpm-workspace.yaml`), Node ≥ 20, `packageManager pnpm@9.12.0`.
- `apps/platform-app` — Next.js `15.5.15`, App Router, React 19. Dev port `3001`.
- `apps/marketing-site` — separate Next app.
- Root scripts: `pnpm dev:platform`, `pnpm build:platform`, `pnpm dev:marketing`, `pnpm build:marketing`, `pnpm -r lint`.

---

## 2. Deployment — READ FIRST

**Production deploys are manual via the Railway CLI. There is no git-push auto-deploy.**
Merging to `main` changes nothing in production until someone runs `railway up`.

- Platform: Railway. Project `government-contracted`, environment `production`, service `platform-app`.
  - Project id `c6b683bd-3fa5-4862-858f-dc3189b06c95`, service id `cb808e92-84ee-407a-9875-d5e433d60da1`.
  - Region US East, 1 replica. Public host `app.governmentcontracted.com`.
- Build: `apps/platform-app/Dockerfile` (multi-stage, Next standalone output).
  - Entrypoint `apps/platform-app/docker-entrypoint.sh` → `doppler run -- node apps/platform-app/server.js`.
  - Container env: `PORT=3000`, `HOSTNAME=0.0.0.0` (Next standalone binds there). `DOPPLER_TOKEN` is set as a build + runtime variable on the service (scoped to one Doppler config, so project/config are inferred).
- Deploy command (from repo root, which is the linked directory):
  `railway up --service platform-app --environment production`
  In a non-TTY the CLI uploads, prints a `Build Logs` URL, and detaches (exit 0 = build queued, not "deployed"). Build success/failure must be read from the Build Logs URL or the Railway dashboard.

Verify the deploy model / link:
```
cd ~/government-contracted && railway status        # Project / Environment / Service
railway whoami                                      # authed account
```
Verify which build is actually live (no Railway API needed — the Next build hash changes per build):
```
curl -s https://app.governmentcontracted.com/login \
  | grep -oE "/_next/static/[^\"']+" | sort -u | shasum
```
Run before and after a deploy; the hash changes when the new build is serving.

---

## 3. URL / redirect constraint (load-bearing)

In a Next route handler on this deploy, `request.url` (and `request.nextUrl.origin`) carries the
container **bind** address, `https://0.0.0.0:3000`, not the public origin — because the standalone
server binds `HOSTNAME=0.0.0.0` / `PORT=3000` and that is what reaches `request.url` here.

Consequence: building a user-facing URL from `request.url`
(`NextResponse.redirect(new URL('/login', request.url))`) emits
`Location: https://0.0.0.0:3000/login`, which a browser cannot follow.

Rule: do **not** derive redirect targets or any user-facing URL from `request.url`.
Use a relative `Location` (`/login`) or `redirect('/path')` from `next/navigation` (emits relative).

Verify current behavior:
```
curl -i -X POST https://app.governmentcontracted.com/auth/signout | grep -i location
# expected: location: /login
```
History: prior to commit `d40a893` this endpoint returned `location: https://0.0.0.0:3000/login`.

---

## 4. Authentication & sign-out

Supabase Auth (email/password + magic link). Sign-out = clear the Supabase session cookies, go to `/login`.

Two sign-out implementations currently coexist:

1. **Server action** `signOut` — `apps/platform-app/app/auth/actions.ts`
   (`supabase.auth.signOut()` then `redirect('/login')`). Used by
   `apps/platform-app/app/access-expired/page.tsx` via `<form action={signOut}>`.
   That page is a server component, so the form is progressively enhanced and the redirect is relative.

2. **Route handler** `POST /auth/signout` — `apps/platform-app/app/auth/signout/route.ts`
   (`createServerClient` → `auth.signOut()` → `303` with relative `Location: /login`; cleared cookies
   written onto the response). The two sidebars post to it with a native
   `<form action="/auth/signout" method="post">`:
   - `apps/platform-app/components/dashboard/ContractorSidebar.tsx:144`
   - `apps/platform-app/components/partner/PartnerSidebar.tsx:128`

Reason the sidebars use (2) rather than (1): the sidebars are `"use client"` components. A server
action bound in a client-component form is rendered by React with
`action="javascript:throw new Error('A React form was unexpectedly submitted…')"` and the real submit
is wired client-side, so it depends on hydration. The native form + route handler has no hydration
dependency. (This rationale is also recorded in the header comment of `route.ts`.)

Login flow:
- `app/login/page.tsx` (client) → `signIn` server action (`app/auth/actions.ts`):
  password (`signInWithPassword`) or magic link (`signInWithOtp`). Success → `redirect('/')`.
- `app/page.tsx` (root) routes by the first active org membership: org with a `uei` →
  `/dashboard/{uei}`; else org with a `slug` → `/partner/{slug}/spec`; else `/access-expired`.
- `middleware.ts` → `lib/supabase/middleware.updateSession` refreshes the session on every matched request.

After deploying a sidebar/layout change, an already-open tab keeps the previous client bundle
(App Router keeps the mounted layout across in-app navigation and soft refresh). A full reload
(⌘⇧R) is required to pick up a new build.

---

## 5. Tenant / authorization model

- Supabase project `government-contracted`, ref `htgfjmjuzcqffdzuiphg`.
- `auth.users` → trigger `handle_new_auth_user` → `public.users (auth_user_id, email)`.
- Core tables (`apps/platform-app/migrations/001_initial.sql`, `003_platform_admins.sql`):
  - `organizations` — one row per business entity; `uei` (unique, nullable), `category`, `slug`, SAM fields.
  - `organization_memberships (user_id, organization_id, role ∈ owner|admin|member, status ∈ active|revoked)`.
  - `platform_admins` — global cross-tenant grant, distinct from per-org `role='admin'`.
- `lib/session.ts` — `getSessionOrgs` / `getSessionOrgUeis` / `isSessionPlatformAdmin`. Resolved by a
  fresh DB round-trip per request (memberships are **not** packed into the JWT), so a revoked
  membership takes effect immediately.
- `lib/tenant.ts` — `resolveTenantUei(rawUei)`: the `[uei]` route param is untrusted; authorized iff it
  is in the session's active-membership UEI set; `notFound()` on mismatch, `redirect('/login')` if anon.
  Also `requireSessionOrg`, `requirePlatformAdmin`.
- DB access from the app uses the pooled connection `GC_DB_URL_POOLED` (`lib/audience-specs/db`).

---

## 6. Configuration & secrets (Doppler)

- Doppler project `hq-government-contracted`, config `prd` (`apps/platform-app/doppler.yaml`).
- Validated in `lib/env.ts`:
  - `NEXT_PUBLIC_GC_SUPABASE_URL`, `NEXT_PUBLIC_GC_SUPABASE_PUBLISHABLE_KEY`, `GC_DB_URL_POOLED`, `APP_ENV` (`dev|stg|prd`).
  - `CATALYST_API_URL`, `CATALYST_API_TOKEN` — optional in `dev`, **required when `APP_ENV != dev`** (fail-closed).
- No Supabase `service_role` / secret key is stored in Doppler (only the publishable key). Privileged DB
  work goes through `GC_DB_URL_POOLED` or the Supabase management API.

---

## 7. Live data dependency — `catalyst_api` (core-x)

Dashboard surfaces are fetched from the core-x read gateway, not from the platform DB:
- `lib/catalyst/client.ts` → `GET {CATALYST_API_URL}/api/v1/entities/{uei}/{surface}`,
  surface ∈ `sam-profile | overview | active-contracts | past-performance`. Response envelope `{ data }`.
- `404` (unknown UEI / no footprint) → `null` → the surface renders its empty state; `getMockDashboard`
  supplies the base layout. An org whose `uei` does not resolve in core-x shows empty/mock SAM + overview
  tiles, while identity strip and tenant routing still work from the Supabase row.
- In `dev` with `CATALYST_API_URL` unset, the client returns `null` (empty-state path).
- Wire-shape source of truth: `core-x/apps/catalyst_api/src/models.py`.

---

## 8. Sidebar layout constraint

`apps/platform-app/components/dashboard/DashboardShell.tsx` wraps the sidebar in a collapse-animation
container that is `sticky top-0 h-screen self-start overflow-hidden` (line 77), and each sidebar
`<aside>` is `h-full` (not `sticky`/`h-screen`).

Do not move `sticky top-0 h-screen` back onto the `<aside>`. The wrapper's `overflow-hidden` makes it the
sticky scroll-container; a `sticky` aside inside it is pinned relative to that wrapper, not the viewport,
and detaches/floats once the page scrolls past one viewport height.

---

## 9. Seed / test accounts present in the DB

Supabase project `htgfjmjuzcqffdzuiphg`. These are test/demo accounts (fake or non-deliverable emails;
trivial passwords) created to sign in "as" a SAM.gov entity.

- `contractor@acmefed.test` — password `AcmeFed-Test-2026`. Owner of `Acme Defense Solutions LLC`,
  UEI `ACMEFED00001`. `ACMEFED00001` is synthetic and does **not** resolve in `catalyst_api`, so the SAM
  and overview tiles render empty for it.
- `tools@substrate.build` — active `platform_admin`; owner of `Acme Defense Solutions LLC` (contractor)
  and `Capitol Surety Partners` (surety_provider).
- Six real subawardee contractor orgs, each with one or more login users derived from the entity's real
  SAM points of contact; **all six share password `testing123!`**. Owner login per org:

  | Org (legal name) | UEI | Owner login |
  |---|---|---|
  | PWS INTERNATIONAL, INC. | `CW52DR9J9DY4` | `frederick.parkerjr@pwsinternational.com` |
  | SARGENT & LUNDY ENGINEERING SERVICES, INC. | `N2SNHMPLTJS9` | `daniel.weinacht@sargentlundyengineeringservices.com` |
  | BURNS & MCDONNELL ENGINEERING COMPANY, INC. | `SS8JL7WNHPX9` | `sara.fields@burnsmcd.com` |
  | HARPER FEDERAL CONSTRUCTION LLC | `JJMXSCBJZKK5` | `jeffrey.harper@harperfederalconstruction.com` |
  | RAPISCAN SYSTEMS INC | `UCDDUN6A6S17` | `stephen.mchugh@rapiscansystems.com` |
  | HUKARIASCENDENT INC | `XKHGKMPMKW25` | `jason.lawless@hukari.com` |

  Names and titles are real SAM POCs (sourced from core-x `sam_pocs`); the email local parts are
  constructed `first.last@<domain>` and do not receive mail (SAM carries no email field). These six UEIs
  are real, 12-character UEIs; whether each resolves in `catalyst_api`'s golden layer is unverified.

List the current accounts (Supabase project `htgfjmjuzcqffdzuiphg`):
```sql
SELECT au.email, u.display_name, m.role, m.status, o.name, o.category, o.uei
FROM auth.users au
JOIN public.users u ON u.auth_user_id = au.id
LEFT JOIN public.organization_memberships m ON m.user_id = u.id
LEFT JOIN public.organizations o ON o.id = m.organization_id
ORDER BY o.name, m.role;
```

---

## 10. Local development & checks

```
pnpm --filter platform-app dev          # http://localhost:3001
pnpm --filter platform-app typecheck    # tsc --noEmit
pnpm --filter platform-app lint
pnpm --filter platform-app test         # vitest
```
Note: `typecheck` currently reports pre-existing errors confined to
`apps/platform-app/tests/acceptance/factoring/**` (Request vs NextRequest typing; stale
`@ts-expect-error`). These predate the sign-out/layout work and are unrelated to it.

---

## 11. Recent history (sign-out / sidebar)

```
d40a893  fix: signout redirect must be relative, not request.url (#7)   <- current main
ec9eb17  fix: sign out via native POST route, not a client-bound server action (#6)
eb27014  fix: keep dashboard sidebar pinned full-height on scroll (#5)
dfa9448  fix: wire sidebar Sign out to the signOut server action (#4)
```
Production reflects whatever `railway up` last shipped — confirm with the build-identity command in §2,
not from git state.
