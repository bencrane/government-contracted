# government-contracted

The contractor-facing platform for **governmentcontracted.com** — a vertical-market network for federal contractors and the partners who serve them (surety bonds, working capital, equipment financing, vendor programs, compliance/consulting).

Two services in this repo:

- **`apps/marketing-site/`** — public site at `governmentcontracted.com`. Claim flow, six opportunity categories, contact/resources.
- **`apps/platform-app/`** — authenticated app at `app.governmentcontracted.com`. Contractor dashboard keyed on SAM.gov UEI, partner CRM dashboard keyed on slug.

## Stack

- Next.js 15 (App Router, standalone output)
- React 19 + Tailwind 4 (beta)
- Zod for form validation
- Navy / off-white / restrained copper theme · Fraunces serif display + Inter body + JetBrains Mono labels
- Supabase SSR auth (platform-app only)
- Postgres (`govcon.*` schema in the same Supabase project as `lth.*` and `hq_x.*`)

## Surfaces

**Marketing:**
`/`, `/claim`, `/opportunities` + 6 categories (opportunities, surety, capital, vendor-programs, equipment, compliance), `/about`, `/contact`, `/resources`

**Contractor dashboard** (`/dashboard/[uei]`):
Overview · SAM.gov profile · Compliance · Past performance · Active contracts · Opportunities · Surety bonds · Capital · Vendor programs · Equipment · Inbox · Settings

**Partner dashboard** (`/partner/[slug]`):
Overview · Transfer inbox · Pipeline · Locked spec · Audience browser · Reports · Team · Billing

Both dashboards share a collapsible left sidebar (⌘B toggle, persisted to localStorage).

## Develop

```bash
pnpm install
pnpm dev:marketing   # http://localhost:3000
pnpm dev:platform    # http://localhost:3001
```

## Environment

Doppler project: `hq-government-contracted`, config `prd`.

| Variable | Purpose |
|---|---|
| `APPLICATIONS_WEBHOOK_URL` | POST endpoint for marketing-site form submissions (claim, contact). Falls back to stdout logging if unset. |
| `EMAIL_INTENT_WEBHOOK_URL` | POST endpoint for stub dashboard-recap emails. Falls back to stdout logging. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (platform-app). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (platform-app). |
| `HQX_DB_URL_POOLED` | Postgres pooled connection (platform-app server-side reads/writes). |

## Deploy

Railway project `government-contracted` with two services, each a Dockerfile-based build from the corresponding app subdir. `DOPPLER_TOKEN` must be set as a build + runtime env var on each service.

## Data sources

Dashboard data is currently mocked (`apps/platform-app/lib/mock-*.ts`). The real read layer — derived parquet on R2 read via DuckDB — is being established in the FMCSA platform first. Once that pattern is proven end-to-end, the mocks here swap one-for-one for real reads against `govcon.entity_grain_slim`, `govcon.active_awards`, `govcon.sam_usaspending_bridge`, etc.

## Schema

`govcon.*` schema lives alongside `lth.*` and `hq_x.*` in the same Supabase project. Apply with:

```bash
doppler run -- psql "$HQX_DB_URL_POOLED" -f apps/platform-app/migrations/001_create_govcon_schema.sql
```
