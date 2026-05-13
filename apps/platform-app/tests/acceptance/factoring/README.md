# Factoring acceptance tests

Acceptance test surface for the `govcon-factoring-foundation-v1` scope cycle.
Directive: `~/Desktop/hq/directives/2026-05-13-govcon-factoring-foundation-v1.md`.

Each test file maps 1:1 to a constraint in the directive (A1–H3) and is
invoked by `apps/platform-app/scripts/benchmarks/factoring-acceptance.sh`.

## Running

```bash
# Single check (fast inner loop):
cd apps/platform-app && doppler run --project hq-government-contracted --config prd -- \
  pnpm exec vitest run tests/acceptance/factoring/api/b1-factor-onboarding.test.ts

# Full benchmark (validator gate):
bash apps/platform-app/scripts/benchmarks/factoring-acceptance.sh
```

## Test harness contract

Tests live in subdirectories by surface:

- `db/`    — psql + pg client; FK and trigger behavior.
- `api/`   — Vitest + supertest-equivalent (fetch against an in-test Next.js
             handler) — execute the route handler directly, not via the dev
             server. Production code reads from `$GC_DB_URL_POOLED`.
- `ui/`    — Vitest + @testing-library/react in JSDOM mode. RSCs are tested by
             calling the async function and serializing with `react-dom/server`.
- `docs/`  — Vitest against recorded Documenso fixtures (no live Documenso —
             see Validator notes in directive).
- `stripe/`— Vitest with `nock`/HTTP intercept against
             `STRIPE_API_BASE`. The executor MAY hit Stripe test mode IF
             `STRIPE_SECRET_KEY_TEST` is added to Doppler; otherwise the
             tests run in fixture mode.
- `audit/` — psql + pg client. Hash-mismatch test recomputes SHA-256 over
             a known byte stream.
- `no-lth/`— (no test files; grep checks live directly in the benchmark
             script. Subdir kept for symmetry.)

## Schema isolation

Acceptance tests run against the live `public.*` schema in the
`htgfjmjuzcqffdzuiphg` Supabase project. Each test wraps its DB work in a
transaction and rolls back via `client.query('ROLLBACK')` in `afterEach`.
Tests that need persisted state across queries (B5 state machine) use a
dedicated test schema `public_test_factoring_<8hex>` created in
`beforeAll` and dropped in `afterAll`. The `LTH_SCHEMA`-style override
pattern from prior cycles does NOT apply here — the executor reads `public`
hard-coded (per the directive).
