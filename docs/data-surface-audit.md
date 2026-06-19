# Live Data-Surface Audit — platform-app · platform-api · catalyst-api

Field-level inventory of every data payload actively flowing into the **live** views of
`apps/platform-app`. Covers the three layers in the read path: the Next.js app
(`apps/platform-app`), the BFF (`apps/platform-api`), and the core-x data plane
(`core-x/apps/catalyst_api`). Documents only what is **actively queried, parsed, and
rendered from live storage** (LanceDB / Postgres). Mock and stub content is called out
explicitly and excluded from the "live" classification.

Each field carries its origin (`file:line`, source dataset/column, derived/computed) so the
classification is re-runnable, not taken on faith.

**Point-in-time snapshot (re-check before relying):**
- Audited: **2026-06-19**.
- `government-contracted` `main` HEAD at audit: `3d93586` (`git log -1 --oneline`).
- `core-x` ref audited: `6f8e15f` (worktree of `main`).
- Method: static read of route handlers, query/projection logic, response models, TS
  interfaces, and render sites across all three repos. No live `curl` was issued; claims are
  traced to source, not to a running response.

**Classification legend:**
- **LIVE** — populated from a real read (LanceDB column, Postgres column, or computed from one).
- **DERIVED** — computed in-handler from live inputs; not stored as-is.
- **GAP** — field is declared in the contract but has **no live source**; always serializes
  `null`/`[]`. Honest empty state, not fabricated.
- **MOCK** — fabricated value from `apps/platform-app/lib/mock-dashboard.ts`, rendered on a
  live page as if real. The only deceptive category; flagged in **bold** throughout.

---

## 1. Topology

```
platform-app (Next.js, server components)
        │  Supabase JWT (user identity)
        ▼
platform-api  (Hono BFF — apps/platform-api)
        │
        ├──► catalyst-api (core-x)            ← all contractor/entity data
        │      service token, NOT user JWT
        │      LanceDB BTREE point-lookups; opens datasets per-request
        │
        └──► Postgres (Supabase, GC_DB_URL_POOLED)  ← auth + factoring state
```

- The app and the BFF **never touch Lance or DuckDB directly.** core-x's `catalyst-api`
  owns the data plane; the BFF proxies over HTTP with an operator service token
  (`COREX_SERVICE_TOKEN` → `COREX_API_URL`, default `catalyst-api.railway.internal:8080`).
- There is a legacy toggle: `API_BASE_URL` unset → app calls catalyst directly
  (`CATALYST_API_URL` + `CATALYST_API_TOKEN`); set → app reads through the BFF. Canonical
  path is app → BFF → catalyst (`apps/platform-app/lib/env.ts`, `lib/catalyst/client.ts:66`).
- Two distinct upstreams, not one: **catalyst-api** (entity data, read-only) and
  **Postgres** (org membership/auth + the factoring state machine — platform-local, not core-x).

---

## 2. The Four Live Catalyst Surfaces (core-x)

**Invariants (all four):**
- Wire envelope `{ "data": <model> }` via `model_dump(by_alias=True, exclude_none=False)`
  (`core-x/apps/catalyst_api/main.py:181`). `by_alias` → keys serialize **camelCase**;
  `exclude_none=False` → **GAP fields ship as explicit `null`/`[]`, not omitted**.
- **No DuckDB. No SAM/FPDS raw-file reads.** Every surface is a native LanceDB BTREE
  point-lookup on `uei` through a warm-handle cache (`src/lance_store.py:162`). All datasets
  under `s3://data-sink/active/`.
- Dates → ISO `YYYY-MM-DD`; money → raw USD float.
- The BFF passes status + body **verbatim** — it does not reshape these payloads
  (`apps/platform-api/src/routes/entities.ts:90`).

### 2.1 overview
- **Endpoint:** `GET /api/v1/entities/{uei}/overview`
- **Data Source:** LanceDB `entity_profile_gold` (`s3://data-sink/active/entity_profile_gold/`),
  BTREE on `uei`. 404 if no gold row. (`main.py:296`; projection `lance_store.py:385`)

| JSON key | Type | Class | Origin |
|---|---|---|---|
| `uei` | string | LIVE | `entity_profile_gold.uei` |
| `lifetimeAwardValue` | float | LIVE | `total_lifetime_obligations` (renamed) |
| `activeContractValue` | float | LIVE | `total_active_obligations` (renamed) |
| `totalContractCount` | int | LIVE | `award_count` (renamed) |
| `activeContractCount` | int | LIVE | `active_award_count` (renamed) |
| `hasFederalAwards` | bool | LIVE | `has_federal_awards` |
| `asOfDate` | string (ISO) | LIVE | `profile_as_of_date` (date32 → ISO) |

- **No legal name / CAGE / address / status flags on this surface.** It is pure aggregates +
  `uei` + `hasFederalAwards` + `asOfDate`. (`cage_code`, `legal_business_name`,
  `primary_naics`, `is_active` are projected from Lance but **dropped by the response model** —
  overprojection.) Identity fields on the dashboard header come from `sam-profile`.
- **UI:** not rendered directly. `app/dashboard/[uei]/page.tsx:34` overlays 4 keys onto the
  mock profile via `lib/dashboard-adapter.ts`: `lifetimeAwardValue`→IdentityStrip "Awards
  lifetime"; `totalContractCount`→"Contracts"; `activeContractCount`→"Active" + HealthRow
  "Active contracts" tile; `activeContractValue`→"Active $".
- **Unconsumed by UI (live but unread):** `uei` (UI uses route param), `hasFederalAwards`, `asOfDate`.

### 2.2 sam-profile
- **Endpoint:** `GET /api/v1/entities/{uei}/sam-profile`
- **Data Source:** LanceDB `sam_master_entities` (`s3://data-sink/active/sam_master_entities/`)
  for the entity; POCs from `entity_profile_gold.pocs` (nested `list<struct>`), falling back to
  `sam_pocs` (`source_family='v2'`) only when the UEI is absent from the gold spine. 404 if no
  entity row. (`main.py:260`; `lance_store.py:302,347`)

| JSON key | Type | Class | Origin |
|---|---|---|---|
| `uei` | string | LIVE | `sam_master_entities.uei` |
| `cageCode` | string | LIVE | `cage_code` |
| `legalBusinessName` | string | LIVE | `legal_business_name` |
| `registrationStatus` | string | DERIVED | `expired` if exp<today, else `inactive` if `is_active`==false, else `active` |
| `registrationDate` | string (ISO) | LIVE | `initial_registration_date` |
| `activationDate` | string (ISO) | LIVE | `activation_date` |
| `expirationDate` | string (ISO) | LIVE | `registration_expiration_date` |
| `daysUntilExpiration` | int | DERIVED | `expiration_date − today` |
| `primaryNaics` | string | LIVE | `primary_naics` |
| `secondaryNaics` | string[] | DERIVED | `naics_codes` minus primary |
| `pscCodes` | string[] | LIVE | `psc_codes` (non-empty filtered) |
| `businessTypesRaw` | string | LIVE | `bus_type_string` (raw `~`-delimited, deliberately unparsed) |
| `physicalAddress.street` | null | **GAP** | no source column projected |
| `physicalAddress.city` | string | LIVE | `physical_address_city` |
| `physicalAddress.state` | string | LIVE | `physical_address_province_or_state` |
| `physicalAddress.zip` | string | LIVE | `physical_address_zip_postal_code` |
| `mailingAddress` | null | **GAP** | no source dataset |
| `governmentPocs[].type` | string | LIVE | `poc_type` |
| `governmentPocs[].pocSlotNo` | int | LIVE | `poc_slot_no` |
| `governmentPocs[].fullName` | string | LIVE | `full_name` (or `first`+`last` joined) |
| `governmentPocs[].title` | string | LIVE | `title` |
| `governmentPocs[].city` | string | LIVE | `city` |
| `governmentPocs[].state` | string | LIVE | `state` |
| `governmentPocs[].email` | null | **GAP** | no email column at source |
| `governmentPocs[].phone` | null | **GAP** | no phone column at source |

- **UI:** `components/.../SamProfileSurface.tsx` (Profile tab) renders all live keys. GAP fields
  (`mailingAddress`, `physicalAddress.street`, POC `email`/`phone`) render hardcoded "Not
  publicly available" notes rather than binding. A subset (`legalBusinessName`, `cageCode`,
  `physicalAddress.city/.state`, `primaryNaics`, registration status/dates) is also overlaid
  onto the dashboard Overview IdentityStrip + "SAM registration" health tile.
- Overprojected-but-dropped: `purpose_of_registration`, `last_update_date`.

### 2.3 active-contracts
- **Endpoint:** `GET /api/v1/entities/{uei}/active-contracts?limit=N` (default 25, max 100)
- **Data Source:** LanceDB `entity_profile_gold` (headline counts) +
  `entity_award_lines_gold.active_contracts`
  (`s3://data-sink/active/entity_award_lines_gold/`, nested `list<struct>`, pre-sorted
  obligation-desc, sliced to limit). No 404. Struct fields mirror `usaspending.award_search`
  names. (`main.py:273`; `lance_store.py:469`)

Top-level:

| JSON key | Type | Class | Origin |
|---|---|---|---|
| `count` | int | LIVE | `entity_profile_gold.active_award_count` |
| `totalObligated` | float | LIVE | `entity_profile_gold.total_active_obligations` |
| `agencies` | string[] | DERIVED | distinct `awardingAgency` over returned items, sorted |
| `contracts` | object[] | LIVE | `entity_award_lines_gold.active_contracts` structs |

`contracts[]` item:

| JSON key | Type | Class | Origin |
|---|---|---|---|
| `awardId` | string | LIVE | `generated_unique_award_id` |
| `displayAwardId` | string | LIVE | `display_award_id` |
| `category` | string | LIVE | `category` |
| `type` | string | LIVE | `type_description` |
| `obligation` | float | LIVE | `total_obligation` |
| `amount` | float | LIVE | `award_amount` |
| `naics` | string | LIVE | `naics_code` |
| `naicsDescription` | string | LIVE | `naics_description` |
| `pscDescription` | string | LIVE | `product_or_service_description` |
| `fundingAgency` | string | LIVE | `funding_toptier_agency_name` |
| `awardingAgency` | string | LIVE | `awarding_toptier_agency_name` |
| `periodStart` | string (ISO) | LIVE | `period_of_performance_start_date` |
| `periodEnd` | string (ISO) | LIVE | `period_of_performance_current_end_date` |
| `setAside` | string | LIVE | `type_set_aside` |
| `description` | string | LIVE | `description` |
| `awardDate` | string (ISO) | LIVE | `action_date` |
| `daysToEnd` | int | DERIVED | `period_end − today` |
| `status` | string | DERIVED | constant `"active"` |
| `isActive` | bool | DERIVED | `status == "active"` → true |
| `subAgency` | null | **GAP** | no subtier column |
| `optionYearDecisionWindow` | null | **GAP** | — |
| `agencyPoc` | null | **GAP** | no CO fields |
| `modifications` | null | **GAP** | mod history not materialized |

- **UI:** `ActiveContractsSurface.tsx`. Headline strip: `count`, `totalObligated`,
  `agencies.length`. Table columns: Contract (`displayAwardId`||`awardId` + `description`) ·
  Awarding agency · Obligated (`obligation`) · Period of performance (`periodStart`+`periodEnd`)
  · Days left (`daysToEnd`) · Set-aside. GAP fields shown as a static "pending upstream ingest"
  note.
- **Live-but-unconsumed by UI:** `category`, `type`, `amount`, `naics`, `naicsDescription`,
  `pscDescription`, `fundingAgency`, `awardDate`, `status`, `isActive` (7 of 23 item fields render).

### 2.4 past-performance
- **Endpoint:** `GET /api/v1/entities/{uei}/past-performance?limit=N` (default 25, max 100)
- **Data Source:** LanceDB `entity_profile_gold` (headlines) +
  `entity_award_lines_gold.past_performance` (same dataset/struct as active-contracts, "closed"
  side). No 404. (`main.py:307`)

Top-level:

| JSON key | Type | Class | Origin |
|---|---|---|---|
| `closedCount` | int | DERIVED | `award_count − active_award_count` |
| `awardsLifetime` | float | LIVE | `total_lifetime_obligations` |
| `contractsLifetime` | int | LIVE | `award_count` |
| `contracts` | object[] | LIVE | `entity_award_lines_gold.past_performance` structs (status=`completed`, isActive=false) |
| `cparsRatings` | [] | **GAP** | no CPARS dataset |
| `cparsAverageRating` | null | **GAP** | — |
| `exclusionsStatus` | null | **GAP** | no SAM exclusions dataset |
| `exclusionsLastChecked` | null | **GAP** | — |
| `recompetesIn12Mo` | null | **GAP** | no option/recompete metadata |

- `contracts[]` item: identical shape/origin to active-contracts, with `status="completed"`,
  `isActive=false`, and the same four per-item GAP fields.
- **UI:** `PastPerformanceSurface.tsx`. Headlines: `awardsLifetime`, `contractsLifetime`,
  `closedCount`. "Completed contracts" table: Contract · Awarding agency · Obligated · Ended
  (`periodEnd`). Top-level GAP fields render as three static GapPanels (CPARS / Exclusions /
  Recompete radar).

---

## 3. Local Postgres Surfaces

DB: `GC_DB_URL_POOLED` (Supabase, pgBouncer-pooled), shared by BFF and app.

### 3.1 me/landing
- **Endpoint:** `GET /api/v1/me/landing` (BFF, `requireUser` Supabase-JWT gate)
- **Data Source:** Postgres — `users` ⋈ `organization_memberships` (`status='active'`) ⋈
  `organizations`, ordered `m.created_at ASC`, landing decided on `orgs[0]`.
  (`apps/platform-api/src/index.ts:56`; `src/lib/orgs.ts:33`)

| JSON key | Type | Class | Origin |
|---|---|---|---|
| `redirect` | string | DERIVED | routing target (table below) |
| `org` | object \| null | LIVE | first active org row, or `null` |
| `org.orgId` | string (uuid) | LIVE | `organizations.id` |
| `org.slug` | string \| null | LIVE | `organizations.slug` |
| `org.category` | string | LIVE | `organizations.category` |
| `org.uei` | string \| null | LIVE | `organizations.uei` |

Conditional routing (`landingFor`, `orgs.ts:71`), evaluated on first active org:

| Condition | `redirect` | `org` |
|---|---|---|
| no active org | `/access-expired` | `null` |
| `org.uei` present | `/dashboard/{uei}` | org |
| no `uei`, has `slug` | `/partner/{slug}/spec` | org |
| neither | `/access-expired` | org |

DB unavailable → `503` (never 500).

### 3.2 Live-wired Postgres schema

Only tables read by a live view. Column · type · key constraints/enums.

**`organizations`** (`migrations/001_initial.sql:33`) — read by landing + factor-pipeline.
`id` uuid PK · `name` text NOT NULL · `slug` text UNIQUE · `category` text NOT NULL (no CHECK;
canonical: `contractor`/`surety_provider`/`capital_provider`/`gpo_provider`/`equipment_lessor`/
`consulting_firm`/`prime`/`sub`) · `uei` text UNIQUE · `cage_code`/`ein`/`legal_business_name`/
`dba`/`naics_primary` text · `naics_secondary`/`set_aside_eligibility` text[] ·
`sam_registration_status` text · `sam_expiration_date` date · `claimed_at`/`sam_snapshot_at`
timestamptz · `sam_snapshot` jsonb · `stripe_customer_id` text UNIQUE · `created_at` timestamptz.
*(Only `id`/`slug`/`category`/`uei` are read live; SAM mirror columns are written, not read.)*

**`users`** (`001:67`) — `id` uuid PK · `auth_user_id` uuid UNIQUE NOT NULL FK→auth.users ·
`email` text NOT NULL · `display_name` text · `created_at` timestamptz.

**`organization_memberships`** (`001:78`) — PK `(user_id, organization_id)` · `role` text CHECK
IN (`owner`,`admin`,`member`) · `status` text DEFAULT `active` CHECK IN (`active`,`revoked`) ·
`created_at` timestamptz.

**`assignments`** (`002_factoring.sql:49`) — `id` uuid PK · `contractor_org_id`/`factor_org_id`
uuid NOT NULL FK→organizations · `contract_number` text NOT NULL · `contract_value_cents`
bigint CHECK>0 · `sole_or_joint_payee` text CHECK IN (`sole`,`joint`) · `has_surety` bool
DEFAULT false · `status` text DEFAULT `drafted` CHECK IN
(`drafted`,`executed`,`served`,`acknowledged`,`perfected`,`terminated`,`rejected`) ·
`created_at`/`updated_at` timestamptz.

**`assignment_parties`** (`002:90`) — `id` uuid PK · `assignment_id` uuid FK→assignments CASCADE
· `role` text CHECK IN
(`contractor_assignor`,`factor_assignee`,`contracting_officer`,`disbursing_officer`,`surety`) ·
`email` text NOT NULL · `name` text · `status` text DEFAULT `pending` CHECK IN
(`pending`,`signed`,`acknowledged`,`declined`) · `signed_at` timestamptz ·
`documenso_recipient_id` text · UNIQUE `(assignment_id, role)`.

**`assignment_documents`** (`002:120`) — `id` uuid PK · `assignment_id` uuid FK CASCADE ·
`documenso_envelope_id` text NOT NULL · `document_type` text CHECK IN
(`instrument_of_assignment`,`notice_of_assignment`) · `status` text DEFAULT `pending` CHECK IN
(`pending`,`sent`,`signed`,`executed`) · `content_sha256` text (NOT NULL when status=`executed`).

**`assignment_state_transitions`** (`002:148`) — append-only (BEFORE UPDATE/DELETE triggers
raise) — `id` uuid PK · `assignment_id` uuid (soft ref, no FK) · `actor_user_id` uuid FK→users
SET NULL · `previous_state`/`new_state` text NOT NULL · `transition_reason` text · `created_at`
timestamptz.

### 3.3 Assignment Detail (live view)
- **Path / Source:** `app/dashboard/[uei]/capital/factor/[assignment_id]/page.tsx` →
  `getAssignmentDetail()` (`lib/factoring/queries.ts:48`), 4 sequential SELECTs.
- **Shape + UI:**
  - `assignments` (`id, status, contract_number, contract_value_cents, has_surety, created_at`)
    → renders `contract_number` (title), `status` (drives 5-state timeline).
  - `parties[]` (`role, status, signed_at, email, name`) → table: `role` · `email` · `status`.
  - `documents[]` (`id, documenso_envelope_id, document_type, status, content_sha256`) → list:
    `document_type` · `status`.
  - `transitions[]` (`id, previous_state, new_state, transition_reason, created_at`) → **fetched
    and returned but never rendered.**
- **Live-but-unconsumed:** `contract_value_cents`, `has_surety`, `created_at`,
  `parties[].signed_at`, `parties[].name`, `documents[].documenso_envelope_id`,
  `documents[].content_sha256`, entire `transitions[]`. Timeline hardcodes 5 states —
  `terminated`/`rejected` not shown.

### 3.4 Factor Pipeline (live view)
- **Path / Source:** `app/partner/[slug]/factor-pipeline/page.tsx` → `getFactorPipeline(slug)`
  (`lib/factoring/queries.ts:104`):
  ```sql
  SELECT a.id, a.contract_number, a.status
  FROM assignments a JOIN organizations o ON o.id = a.factor_org_id
  WHERE o.slug = $1 AND a.status NOT IN ('terminated','rejected')
  ORDER BY a.created_at DESC
  ```
- **Shape + UI:** `PipelineGroup` (7 status-keyed arrays of `{id, contract_number}`). Renders 5
  buckets as columns; per row: `contract_number`. `status` used server-side for bucketing only.
  `terminated`/`rejected` buckets exist in the shape but the query excludes them → always empty.

### 3.5 Postgres tables NOT wired to any live view (unmapped)
`invitations`, `connections`, `notifications`, `notification_preferences`, `transfers`,
`subscriptions`, `audit_log`, `factor_configurations`, `disbursements`, `factor_billing_events`,
`platform_admins`. *(Caveat: `apps/platform-app/lib/session.ts` — outside this audit's read set
— resolves `platform_admins` and mirrors the membership tables; it may wire additional reads.)*

---

## 4. Mock vs Live — Overview page composition

The Overview (`/dashboard/[uei]`) is the **only live page that mixes real and mock data**.
`page.tsx` builds `base = getMockDashboard(cleanUei)` (all mock), then overlays live catalyst
data onto two regions via `lib/dashboard-adapter.ts`. Live wins when non-null; otherwise mock
base shows (dev fallback when no catalyst creds).

| Component | Field(s) | Class |
|---|---|---|
| IdentityStrip — stats | awardsLifetime, contractsLifetime, activeContracts, activeContractObligated | LIVE (`overview`) |
| IdentityStrip — identity | legalBusinessName, cageCode, city, state, primaryNaics.code | LIVE (`sam-profile`) |
| IdentityStrip — **dba** | company "doing-business-as" name | **MOCK** (mock-dashboard.ts, never overlaid) |
| IdentityStrip — naicsPrimary.description | (blank) | GAP (forced to `''` on live) |
| HealthRow — SAM registration tile | status, expiresAt, daysToExpiration | LIVE (`sam-profile`) |
| HealthRow — Active contracts tile | activeContractsCount | LIVE (`overview`) |
| HealthRow — **Surety tile** | aggregateLimit, surety bonding, expires, status | **MOCK** (base.surety, mock-dashboard.ts:269-292) |
| HealthRow — **worst-Compliance tile** | worstCompliance (from mock compliance.checks) | **MOCK** (mock-dashboard.ts:384-434) |
| **NextDeadlines** | entire deadlines list | **MOCK** (base.deadlines, mock-dashboard.ts:436-461) |
| **EventFeed "What's new"** | entire feed (top 4) | **MOCK** (base.feed, mock-dashboard.ts:463-512) |
| ActionShortcuts | static nav links (no data) | n/a |

**Consolidated MOCK inventory** (fabricated, rendered as real — all from
`apps/platform-app/lib/mock-dashboard.ts`, all on the Overview only):

1. **IdentityStrip `dba`**
2. **Surety health tile** — aggregateLimit, bonding amount, expiry, status
3. **Worst-compliance health tile**
4. **NextDeadlines** — all deadline rows
5. **EventFeed "What's new"** — all feed items

**Stub pages** (Compliance, Surety, Equipment, Capital, Inbox, Solicitations, Vendor Programs,
Settings; partner portal except factor-pipeline) render placeholder UI with **no data at all** —
not mock, nothing fabricated.

---

## 5. Consolidated GAP / unmapped inventory

**Server-side GAPs** — declared in the catalyst response model, always emitted `null`/`[]`
(no live source):
- sam-profile: `mailingAddress`, `physicalAddress.street`, `governmentPocs[].email`,
  `governmentPocs[].phone`
- active-contracts + past-performance (per contract): `subAgency`,
  `optionYearDecisionWindow`, `agencyPoc`, `modifications`
- past-performance (top-level): `cparsRatings`, `cparsAverageRating`, `exclusionsStatus`,
  `exclusionsLastChecked`, `recompetesIn12Mo`

**Derived** (computed in-handler, not stored): `registrationStatus`, `daysUntilExpiration`,
`secondaryNaics`, `agencies`, `closedCount`, per-contract `daysToEnd`/`status`/`isActive`,
landing `redirect`.

**Live data declared but never rendered by UI:** overview `uei`/`hasFederalAwards`/`asOfDate`;
13 of 23 `AwardLineItem` fields; assignment `contract_value_cents`/`has_surety`/`transitions[]`.
