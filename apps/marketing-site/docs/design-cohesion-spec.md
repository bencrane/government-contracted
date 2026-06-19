# Design Cohesion Spec — Government Contracted Marketing Site

Identity to preserve: **Refined Federal** — navy + copper on warm cream, Fraunces display serif, Inter body, JetBrains mono micro-labels, SHARP corners (radius 0 everywhere except status dots), hairline rules, document/ledger feel, restrained.

The token + primitive layer is sound. The slop verdict is a **page-composition** problem: every band is built slightly differently, the same module repeats with no escalation, heroes float, and one gradient + several icon-boxes break the flat-document language. This spec resolves every cross-page inconsistency into ONE system and tells the implementer exactly what to change, file by file.

Paths are relative to `apps/marketing-site/`.

---

## 1. GLOBAL RULES

These are non-negotiable. Where a rule says "extract a primitive," extract it once and route every call site through it so divergence becomes impossible.

### 1.1 Canonical section structure

Every content section, on every page, is built in this order and nothing else:

```
eyebrow  →  heading  →  lede  →  content
```

- **eyebrow** — always present on a top-level section. Uses `<Eyebrow>`. Never a raw `text-[...]` label.
- **heading** — `<Heading level={2}>` for section headings, `level={1}` for the page hero, `level={3}` for in-card titles. No `text-[...]` / `md:text-[...]` overrides — ever.
- **lede** — optional single `<Text size="body-lg" tone="muted">`, capped at `max-w-2xl`. Never two equal paragraphs side by side.
- **content** — the section payload (grid, list, card, form).

Extract a **`<SectionHeader>`** primitive (`src/components/ui/section-header.tsx`) that owns `eyebrow → heading → lede` with ONE internal rhythm and exposes exactly two layouts via an `align` prop:

- `align="block"` — full-width left-aligned stack in a `max-w-2xl` wrapper (default).
- `align="rail"` — header sits in the left 4 columns of a 12-col grid; the section content fills the right 8 columns.

Every hand-rolled `<div className="mb-N max-w-3xl">…</div>` header block and every inline `<Eyebrow>/<Heading>/<Text>` hero stack is replaced by `<SectionHeader>` or `<Hero>`. No page composes the cluster by hand.

### 1.2 Locked cluster rhythm

Baked into `SectionHeader` and `Hero`, applied automatically, never overridden at a call site:

| Gap | Value |
|---|---|
| eyebrow → heading | `mt-4` |
| heading → lede | `mt-6` |
| header cluster → content (block layout) | `mb-12` |
| lede → CTA (hero) | `mt-8` |

Delete every per-instance `mt-3 / mt-5 / mt-7 / mt-8` and `mb-10 / mb-14` on eyebrows, headings, and ledes across all pages.

### 1.3 Vertical rhythm — which `spacing` per band

`<Section spacing>` is derived from the band's ROLE, not chosen per page:

| Band role | `spacing` | `divide` |
|---|---|---|
| Hero (page-opening) | `base` | `true` |
| Interior content band | `lg` | `true` |
| Closing CTA band | `lg` | `false` (it's the last thing before the footer) |
| Terminal funnel page (Claim/Contact), single section | `base` | `true` |

Fix the outliers: `ResourcesPage.tsx:125` closing band `base → lg`. Every hero gets `divide` (add to Claim and Contact heroes).

### 1.4 Type-role usage

The semantic scale in `index.css` is the only source of sizes. **Zero `text-[...]` / `md:text-[...]` / raw `text-2xl|sm|xs` on `<Heading>` or `<Text>`.**

Add ONE new token to close the gap that is driving all the overrides — an in-card / list-item heading between `h3` (24px) and `h2`:

```css
/* index.css @theme — add after --text-h3 block */
--text-h4: 1.25rem;            /* 20px — in-card titles, list-item titles, CTA-card heads */
--text-h4--line-height: 1.3;
--text-h4--letter-spacing: -0.01em;
--text-h4--font-weight: 400;
```

Add `h4` to the `heading` cva (`src/components/ui/heading.tsx`): add `h4: "text-h4"` to the `role` variants, add `4` to the `Level` type, `LEVEL_TAG`, and `LEVEL_ROLE` (tag `h4`).

Role map after this change:

| Role | Token | Used for |
|---|---|---|
| `display` | 44–64px | Home hero H1 only |
| `h1` | 36–52px | every other page hero H1 |
| `h2` | 28–40px | section headings, CTA-band headings |
| `h3` | 24px | "How it works" / pillar card titles, CategoryGrid row titles, resource row titles |
| `h4` | 20px | in-hero promo-card title, profile-card legal name, Claim list-item titles |
| `body-lg` | 18px | ledes, manifesto body |
| `body` | 16px | section body, list items |
| `body-sm` | 15px | card body, captions-adjacent |
| `caption` | 13px | dates, meta |
| `eyebrow` | 13px / 0.18em | all section kickers |
| `mono-label` | 10px / 0.16em | in-card micro-labels, step numbers, index numerals |

Replace every off-scale size:
- `CategoryPage.tsx:49` `text-[1.5rem]` → `level={4}` (no override).
- `CategoryPage.tsx:81,100` `text-[17px]` → drop override, use `<Text size="body">` (16px).
- `ResourcesPage.tsx:108` `text-[1.5rem]` → `level={3}` (no override).
- `ResourcesPage.tsx:130` `text-[1.5rem] md:text-[1.875rem]` → `level={2}` (no override).
- `CategoryGrid.tsx:26` `md:text-[1.875rem]` → `level={3}` (no override).
- `ClaimPage.tsx:59` `text-[15px] font-semibold` → `<Heading level={4}>` (item title becomes a real h4; see §6 Claim).
- `GoldenProfilePreview.tsx:68` `font-display text-[22px]` → `<Heading level={4} className="text-navy-900">` (demotes the legal name; see §3).
- `Field.tsx:34` and `ClaimForm.tsx:39,46` `text-[15px]` / `text-2xl` form values → `text-body-sm` token where they are body, keep success-panel heading as `level={3}`.

### 1.5 Small-label discipline (exactly two label sizes site-wide)

After this pass the codebase has exactly two uppercase-label sizes: `text-eyebrow` and `text-mono-label`.

- `tabs.tsx:51` `text-[0.6875rem] … tracking-[0.12em]` → `text-mono-label`.
- `badge.tsx:8` `text-[0.6875rem] … tracking-wide` → `text-mono-label`.
- `stat.tsx:48` sub `text-[0.6875rem]` → `text-caption`.
- `Field.tsx:17` label `text-[11px] uppercase tracking-[0.14em]` → `text-eyebrow` (a form label IS an eyebrow). If 0.18em tracking is visually too wide for a dense form, that is the ONE permitted exception — define `--text-field-label` once in `index.css` and use it for `Field` + `ClaimForm.tsx:46`. Do not leave three bespoke spellings.

### 1.6 Numbers carry tabular figures by default

Bake `tabular-nums` into the primitives so it can never be forgotten:
- `stat.tsx:9` — add `tabular-nums` to the `value` cva base.
- `stat.tsx:48` — add `tabular-nums` to the sub `<p>`.
- `eyebrow.tsx` `MonoLabel` — add `tabular-nums` to the base class (index numerals, step numbers, KPI subs all run through it).

This fixes the home-hero KPI strip jitter (`$24.6M / $8.9M / 31`).

### 1.7 Band sequence — the cream / navy / slate cadence

The band system is currently monotonous (almost every interior page is cream-cream-slate, navy only on Home). Two rules:

1. **Make slate a real surface.** `slate-100 #ede9df` is ~6% off cream and does not read as a distinct band. Change the slate band fill to **`slate-200 #dcd6c5`** — update `section.tsx:16` `slate:` to `bg-slate-200 text-foreground`. Re-verify footer text (`SiteFooter.tsx:8`) stays ≥4.5:1; bump it to `slate-600` if needed.

2. **Every page gets at least one navy anchor**, and no page is allowed to run three same-tone bands in a row. Canonical per-page cadences (see §6 for specifics):

| Page | Band sequence |
|---|---|
| Home | cream hero → **navy** how-it-works → cream what's-inside → **navy** Manifesto |
| About | cream hero → cream pillars → **slate** model → **navy** CTA |
| Opportunities | cream hero → **navy** stat band → cream category ledger → **slate** CTA |
| Category | cream hero → cream what-you-get → **slate** worth-claiming → **navy** CTA |
| Resources | cream hero → cream resource list → **navy** CTA |
| Claim / Contact | single cream band (terminal) |

The closing CTA band tone is **navy** on the marketing pages that have a true conversion close (About, Category, Resources) and **slate** where the close is a softer "claim first" nudge (Opportunities). This is a deliberate two-tier system, documented here, not a per-page accident.

### 1.8 ONE button / CTA spec

`Button` primitive is already the single source — keep it. Lock usage:

- **Primary action** (claim/submit): `variant="primary"`, `size="lg"` when it is a page-level hero or closing-CTA action; `size="md"` inside dense cards/forms. Always `trailingIcon={ArrowRight}`.
- **Secondary**: `variant="secondary"` (hairline). **Ghost**: `variant="ghost"` for inline text links only.
- Closing-CTA buttons are `size="lg"`. The home-hero CTA is `size="lg"`. The in-card profile CTA is removed (see §3).
- Copy: Title-case the action consistently — **"Claim your entity"** everywhere (the codebase currently mixes "Claim your entity" and "Claim Your Entity"). Pick sentence-case "Claim your entity" to match the document tone. Replace all `Claim Your Entity` strings.

### 1.9 ONE closing-CTA component

Extract **`<CtaClose>`** (`src/components/marketing/CtaClose.tsx`). Props: `tone` (`navy` | `slate`), `eyebrow?`, `heading`, `lede`, `to`, `buttonLabel`. Internally it renders a `<Section tone spacing="lg">` with a full-width **centered statement** composition (NOT the 8/4 split that currently reads as an interior list row):

```
[ eyebrow (copper) ]
[ Heading level={2} — larger optical weight than any interior heading ]
[ lede, max-w-xl, centered ]
[ Button size="lg" primary, centered ]
```

- On navy tone, add the `copper-rule` hairline above the eyebrow (the seal motif) so the close reads as the page's terminal focal point, heavier than any body band.
- **Kill the gradient.** No `bg-gradient-to-br from-navy-50 via-slate-50 to-slate-50` anywhere. CtaClose navy = flat `bg-navy-900`; slate = flat `bg-slate-200`.

Replace these four hand-rolled closers with `<CtaClose>`:
- `AboutPage.tsx:94-114`
- `CategoryPage.tsx:109-130`
- `OpportunitiesPage.tsx:31-51`
- `ResourcesPage.tsx:124-146`

The Home **Manifesto stays as the deliberate exception** (its own distinctive navy long-form close) — but it gets a real terminal `<Button>` (see §6 Home).

### 1.10 Hero contract

Heroes are the strongest cross-page cohesion lever (every page opens with one). Push all hero decisions into the `Hero` primitive and route the six inline page heroes through it.

- **Container width:** marketing heroes = `wide` (one shared left datum). Fix `AboutPage.tsx:23` `content → wide`. Forms/terminal pages (Claim, Contact) = `wide` for the two-column layout, `prose` only for pure single-column long-form.
- **Headline tier:** ONE tier for inner-page heroes. Home keeps `display`; **all other heroes use `h1`** (already the case) — do not let any inner hero opt into `display`.
- **Lede measure:** `max-w-2xl` everywhere. Change `hero.tsx:50` `max-w-xl → max-w-2xl`.
- **Alignment:** Hero composes `<Grid cols={12}>` (single gap source) and uses **`align="start"`** (shared top datum — the document edge), NOT `items-center`. Change `hero.tsx:43`.
- **Backdrop:** ONE recipe — `seal-wash` + `paper-grid` at a single fixed opacity. Standardize on **`opacity-50`**. Apply to every hero `<Section>`. Remove the per-page `opacity-30 / 40 / 60` magic numbers (Home `:32` 60, About `:22` 40, Contact `:10` 30, Claim `:37` 40). Heroes that currently have `seal-wash` only (Opportunities, Resources, Category) gain the `paper-grid` overlay at `opacity-50`.
- **CTA slot:** the `cta` prop is mandatory on the Home hero (see §3) and available to any hero that needs a defined bottom.

### 1.11 Split-ratio system

Two locked ratios, encoded as named variants, never re-decided at a call site:

- **Header-rail layout** (`SectionHeader align="rail"`): **4 / 8**. Fix `ResourcesPage.tsx` rows from `3/9 → 4/8` for the meta rail (or better, restructure per §6 Resources).
- **Split hero** (headline + media card): **7 / 5**. Home hero `6/6 → 7/5`; Category hero already 7/5; Claim already 5/7 (form-right is the intentional mirror — keep, but document it).

### 1.12 Content-width rules

| Context | Width |
|---|---|
| Marketing hero, full grids | `Container width="wide"` (80rem) |
| Long-form prose (Manifesto) | `width="prose"` (48rem) |
| Lede / single body block | `max-w-2xl` (42rem) |
| CtaClose lede | `max-w-xl` (centered) |

Remove every coexisting `max-w-3xl` on ledes/headers (Home `:52,:78`). One prose constraint, not per-section guesses.

### 1.13 One bullet / marker vocabulary

Sharp corners only. Pick ONE marker family for "included/feature" lists and ONE for "qualifier" lists, used site-wide:

- **Feature / "what you get":** copper-filled **1px square** tick (`h-5 w-5 bg-copper-600`, white `Check`, sharp). NOT navy (`CategoryPage.tsx:78` navy square → copper square) — copper is the accent that should appear at rest.
- **Qualifier / "worth claiming if":** a short **copper hairline rule** (`h-px w-4 bg-copper-500 mt-3`) — NOT the `rounded-pill` dot (`CategoryPage.tsx:99`), which is the only rounded shape on a sharp page.
- **Sequence / index:** mono numerals via `MonoLabel` (`01 02 03`), already used on Home steps and CategoryGrid — reuse this, never icon-boxes.

### 1.14 Site chrome (the single biggest cohesion fix)

The header is a bare wordmark on all 7 pages — the site reads as disconnected documents. Add real navigation to `SiteHeader.tsx`:

```
[ Wordmark ]      [ Opportunities  Resources  About  Contact ]      [ Button "Claim your entity" ]
```

- Nav links: `Opportunities`, `Resources`, `About`, `Contact`. Active state = copper underline / copper text.
- Persistent right-aligned `<Button variant="secondary" size="sm" to="/claim">Claim your entity</Button>` (secondary so it doesn't fight in-page primaries).
- Mobile: collapse links into a sharp-cornered disclosure; keep the Claim button visible.
- Uses the existing `Button` and mono/eyebrow tokens so the header matches the body system.

---

## 2. AI-SLOP REMOVALS

Each pattern, its location, the exact replacement.

| # | Slop pattern | Location | Replacement |
|---|---|---|---|
| 1 | **Cloned gradient CTA card** — `bg-gradient-to-br from-navy-50 via-slate-50 to-slate-50` 8/4 split, copy-pasted as the closer on 4 pages | `AboutPage.tsx:94-114`, `CategoryPage.tsx:109-130`; near-twins `OpportunitiesPage.tsx:31-51`, `ResourcesPage.tsx:124-146` | One `<CtaClose>` (§1.9): flat navy/slate, centered statement, copper-rule motif, heavier than any interior band. Vary only the headline copy. |
| 2 | **Diagonal multi-stop gradient** — directly contradicts the flat/sharp document identity; single most slop-coded surface | `AboutPage.tsx:98`, `CategoryPage.tsx:114` | Delete the gradient utility entirely. Flat `bg-navy-900` (navy close) or `bg-slate-200` (slate close). No gradients anywhere in the codebase. |
| 3 | **Two equal symmetric 3-col feature grids on adjacent-journey pages** — eyebrow/title + 2 lines ×3, the textbook slop block, used twice | `HomePage.tsx:59-73` (How it works) + `AboutPage.tsx:48-61` (Three pillars) | Differentiate by composition. **How it works**: keep the 3 numbered cards but stagger — render as a numbered process where the copper step-number is the dominant anchor and cards are NOT dead-equal (see §6 Home). **About pillars**: drop to an asymmetric editorial layout — one lead pillar (h3 + body) spanning wider, two supporting pillars — and give each pillar a numbered `MonoLabel` anchor so the trio has internal hierarchy (see §6 About). Two equal 3-col grids must not ship. |
| 4 | **Icons-in-bordered-tinted-boxes as decoration** — `h-9 w-9 border border-navy-200 bg-navy-50` lucide boxes carrying no info | `ClaimPage.tsx:55-57` | Drop the icon boxes. Delineate each item with a mono index numeral (`01 02 03 04`) via `MonoLabel` — the site's existing ledger vocabulary. Remove the `lucide` icon imports (`Activity, BadgeCheck, Clock, Mail`). |
| 5 | **Check-in-navy-square chips + rounded-pill copper dots** (two bullet vocabularies on one page) | `CategoryPage.tsx:78-80` (navy square + Check), `:99` (rounded-pill dot) | Unify per §1.13: copper square tick for "what you get", copper hairline rule for "worth claiming if". Remove `rounded-pill`. |
| 6 | **`Full write-up coming soon` ×5** — non-interactive text dressed as a link (`text-navy-700 font-medium`), reads as filler | `ResourcesPage.tsx:114-116` | Remove the per-row line entirely. Put one honest note in the hero lede ("Full write-ups publishing through 2026."). Rows end on the blurb. (Or, if a real stub route exists, make them real links — but do not dress dead text as a CTA.) |
| 7 | **Arbitrary lucide category icons mapped to meaning** — Calendar=Compliance etc. is decoration-as-taxonomy; also fails: arrow `slate-300` on white is 2.16:1 | `ResourcesPage.tsx:67-71,100`; `CategoryGrid.tsx:37` arrow | Drop the icons from the category `Badge` (text-only chip already encodes category). Recolor the CategoryGrid resting arrow `text-slate-300 → text-copper-600` (fixes contrast AND copper under-use); keep `copper-700` on hover. |
| 8 | **Duplicated business-model paragraph** — identical partner list verbatim in two places one session apart | `Manifesto.tsx:34-41` + `AboutPage.tsx:73-83` | Keep the full treatment on About "The model." Compress the Manifesto's third paragraph to one line that points to About (see §6 Home/Manifesto). Removes the verbatim repeat. |
| 9 | **Dangling CTA pointing off-screen** — "Type your UEI above" references a field not on the band | `Manifesto.tsx:42-45` | Replace the dangling sentence with a real terminal `<Button size="lg" to="/claim">Claim your entity</Button>`. |
| 10 | **`<br />` forcing a break that fights `text-balance`** | `ResourcesPage.tsx:83` | Remove the `<br />`; let `text-balance` + `max-w` wrap. (Keep the deliberate 3-line stack on `HomePage.tsx:38-40` — that is a designed lockup.) |
| 11 | **Three-stacked-noun hero cadence** ("X. Y. Z.") — recognizable startup template | `HomePage.tsx:37-43` | Low priority; keep — it's product-specific and visually strong. Only revisit if §3 changes leave it feeling templated. |

---

## 3. HERO + CARD (Home)

The hero currently reads as two unrelated blocks: a short text stack vertically centered against a tall data card, with a dead cream gap below the lede, and the only CTA buried inside the card. Fix both sides so the columns compose deliberately and bottom out together.

### 3.1 Hero — left column gains a real bottom (CTA moves LEFT)

`src/pages/HomePage.tsx:34-46` — pass `cta` and switch the ratio:

```tsx
<Hero
  eyebrow="For registered federal contractors"
  heading={
    <>
      Your entity.<br />
      <span className="text-navy-700">Your awards.</span><br />
      One dashboard.
    </>
  }
  lede="Live SAM.gov profile, every federal contract action since FY08, and quotes on surety, capital, vendor programs, equipment, and compliance — pegged to your UEI."
  cta={
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Button to="/claim" size="lg" trailingIcon={ArrowRight}>
        Claim your entity
      </Button>
      <Button to="/opportunities" variant="ghost" size="lg">
        See what it unlocks
      </Button>
    </div>
  }
  media={<GoldenProfilePreview />}
  ratio="7/5"
/>
```

Plus the primitive changes from §1.10 (in `hero.tsx`): `align="start"`, lede `max-w-2xl`, compose `<Grid cols={12}>`. The `cta` slot already exists at `hero.tsx:54` with `mt-8` (after §1.2) — verify the eyebrow, h1, lede, and CTA all share the same left edge (no width constraint on the CTA wrapper).

Add a thin mono trust line directly under the CTA row (gives the column a typographic floor and a federal-scale hook):

```tsx
<MonoLabel as="p" className="mt-6 text-slate-500">
  1.7M registered entities · contract actions indexed since FY08
</MonoLabel>
```

### 3.2 Card — cut height and a competing focal point

`src/components/marketing/GoldenProfilePreview.tsx`. Three cuts bring the card bottom up to meet the now-anchored left column:

1. **Delete the footer CTA block** (`:101-109`). The CTA lives in the left column now; two identical primary CTAs in one viewport is redundant and is the card's biggest height contributor. Fold provenance into the header as a mono micro-label, or drop it (the lede already says "Live SAM.gov profile"). After removal the card terminates cleanly on the tab panel's bottom hairline (`tabs.tsx:75` already renders `border-b`) — a deliberate document edge.

2. **Cut Contacts tab; drop panel height.** `:52-56` — remove the `contacts` tab (POC names are the weakest content). Keep `agencies` (the copper share-bars, the strongest "live data" moment) as default and `registration` (SAM expiry / NAICS, the substance). `:99` — drop `panelHeight={236}` to `panelHeight={196}`. Remove `ContactsPanel` (`:195-214`) and its now-unused imports.

3. **Demote the legal name.** `:67-70` — `font-display text-[22px]` → `<Heading level={4} className="text-navy-900">` (20px, §1.4). This stops the card name from reading as a second headline competing with the hero h1.

Net: removing the footer (~90px) + one tab + 40px of panel height brings the card bottom within ~one baseline of the left column at `lg`. With `align="start"` the eyebrow baseline and the card-header top share a datum — the "shared top edge" the HomePage comment (`:30`) promises but does not currently achieve.

Keep the three-KPI strip (`:87-96`) — it is the persistent hook and earns its density; it is the one place the card is allowed to stay dense.

---

## 4. (folded into §1 and §6)

CTA standardization, slop removals, and the type/spacing rules above are the global resolution. Per-page application follows.

---

## 5. (folded into §6)

---

## 6. PER-SECTION FIX PLAN

### HOME — `src/pages/HomePage.tsx` + `Manifesto.tsx`

**Hero** (`:34-46`) — see §3. CTA left, `ratio="7/5"`, mono trust line, hero-primitive `align="start"` + `max-w-2xl` lede + `paper-grid opacity-50` (`:32`).

**How it works** (`:50-74`) — navy band.
- Replace the hand-rolled header `<div className="mb-14 max-w-3xl">` with `<SectionHeader eyebrow heading />` (block layout, auto `mb-12`).
- **Fix the near-invisible card body** (confirmed in `home.png`): the white cards sit on a navy band; `Text tone="muted"` inside a navy `<Section>` resolves to the light slate ramp (`text-slate-300`) and disappears on white. The cards must NOT inherit the navy tone for their body text. Wrap each card's body so it resolves on a light surface — simplest: set the step body explicitly to `text-slate-600` (do not rely on the navy `tone="muted"` mapping inside a white card). Verify against `home.png` regression.
- **Break the symmetry** (slop #3): make the copper step-number `MonoLabel` the dominant anchor (`text-h3`-scale numeral or a larger mono treatment) and let card 01 carry slightly more weight than 02/03 (e.g. 01 spans wider or leads). Do not ship three dead-equal cells.
- Keep `<Heading level={3}>` titles (no override).

**What's inside** (`:77-91`) — cream band.
- Replace header div with `<SectionHeader>`; lede drops `max-w-3xl` (§1.12, now `max-w-2xl`).
- This section must NOT read as equal-weight to "How it works." Compress to a tighter **teaser** index: keep `<CategoryGrid />` (preview variant) but make it visually lighter/denser than the Opportunities hub so the two CategoryGrid renders are clearly teaser-vs-detail (see Opportunities below). Add a closing ghost link "All six categories →" to `/opportunities`.

**Manifesto** (`Manifesto.tsx`) — navy band, the deliberate Home close.
- Cut from 4 paragraphs to 3: remove the duplicated business-model paragraph (`:34-41`); replace with one line pointing to About: "Free for registered contractors, paid for by the partners who fit your profile." Link "the partners" to `/about`.
- Replace the dangling "Type your UEI above. We have your awards." (`:42-45`) with a real terminal `<Button size="lg" to="/claim" trailingIcon={ArrowRight}>Claim your entity</Button>` under a final one-line statement.

### ABOUT — `src/pages/AboutPage.tsx`

**Hero** (`:21-44`).
- Container `content → wide` (§1.10). Route through `<Hero>` or `<SectionHeader>` so spacing matches every other hero.
- **Kill the two-equal-paragraph wall** (`:29-42`): lead with ONE `<Text size="body-lg" tone="muted">` lede (max-w-2xl). Fold the second paragraph into the body sections below, OR convert the right side into a hairline fact strip (`MonoLabel`/`Stat`: "Entities indexed daily", "Contract actions since FY08", "Refresh cadence: 24h") so the hero has rhythm, not a gray block.
- `paper-grid opacity-40 → opacity-50`.

**Three pillars** (`:47-62`, `Pillar` `:119-128`) — cream band.
- Break the symmetric 3-equal-gray-block grid (slop #3). Give each pillar a numbered `MonoLabel` anchor (`01 / 02 / 03`) AND a short `<Heading level={3}>` title above the body (currently eyebrow + body only — too weak). Match the internal structure of Home's "How it works" cards so the 3-card module reads as one deliberate system component.
- **Level the copy** so cells fill evenly: "Yours to leave" (`:57-59`) is materially shorter and leaves dead space in the stretched cell (confirmed in `about.png`) — expand it to ~4 lines (add the one-click-delete + UEI-stays-public detail), or restructure as one lead pillar (wider) + two supporting.
- Inner card padding: pick ONE value for the hairline-grid pattern (currently `md:p-8` here vs `md:p-10` on Home) — standardize on `md:p-8`.

**The model** (`:64-91`) — slate band (now `slate-200`). Keep as the canonical home for the business-model copy. Use `SectionHeader align="rail"` (4/8) for the heading column.

**CTA** (`:94-114`) — replace with `<CtaClose tone="navy" heading="Claim your entity." lede="UEI and email. Dashboard link in your inbox." to="/claim" />`. Gradient gone.

### OPPORTUNITIES — `src/pages/OpportunitiesPage.tsx`

The page is currently header + the same CategoryGrid Home shows + a CTA — a thin echo of Home. Give it a reason to exist.

**Hero** (`:11-24`) — route through `<Hero>` (no media) or `<SectionHeader>` for spacing parity; add `paper-grid opacity-50`.

**NEW stat band** (insert between hero and grid) — **navy** band, the page's signature move and navy anchor. Use the `Stat` primitive with `federalStats()` data (registered entities, annual obligations, active solicitations today) to frame the scale of the opportunity surface before the index. This is the substantive section the page lacks.

**Category ledger** (`:27-29`) — cream band. This is the **detailed** version of the list, demonstrably richer than Home's teaser: the `hub` variant should surface the per-category `whatYouGet` count or a 2–3 chip row from `goodIf` (data already exists in `opportunities.ts`, currently unused here), not just a longer blurb. Give the ledger internal rank — feature the 1–2 highest-value categories as a heavier top row or a labeled 2-up, then demote the rest to compact hairline rows, so the page has a focal entry point instead of six equal rows.

**CTA** (`:31-51`) — replace with `<CtaClose tone="slate" eyebrow="Claim first" heading="These match against your live entity profile." lede="Claim your UEI, get your dashboard link, and see opportunities that fit your NAICS, set-aside, and agency mix." to="/claim" />`.

### CATEGORY — `src/pages/CategoryPage.tsx`

**Hero** (`:35-65`) — 7/5, `align="start"`.
- **Fix the dead void under the promo card** (confirmed in `category.png`): give the promo card more substance so its height approaches the headline column — add a mono datum row under the CTA ("Free · UEI + email · dashboard in minutes") or a 2-item mini-list. Bump card padding `sm → md`. Demote the card title `text-[1.5rem] → level={4}` (§1.4). The card must read as secondary to the headline, not a competing focal point.
- Add `paper-grid opacity-50`.

**What you get** (`:69-88`) — cream band, the page's value payload → give it the most weight. Render as `SectionHeader align="rail"` (4/8) heading + the feature list using the copper-square tick (§1.13). Drop `text-[17px]` → `body`. This is the focal interior section.

**Worth claiming if** (`:90-107`) — slate band (now `slate-200`). Render TIGHTER than "What you get" so the two sections don't read as one repeated module: compact single inline list with the copper hairline-rule marker (§1.13), `body` size, no per-item dividers. Heading `align="rail"`.

**CTA** (`:109-130`) — replace with `<CtaClose tone="navy" heading="See this in your dashboard." lede="UEI and email. Dashboard link in your inbox." to={\`/claim?next=${c.slug}\`} />`.

### RESOURCES — `src/pages/ResourcesPage.tsx`

**Hero** (`:78-91`) — `SectionHeader`/`Hero` parity; remove `<br />` (`:83`, slop #10); add the "Full write-ups publishing through 2026." note to the lede; `paper-grid opacity-50`.

**Resource list** (`:93-122`) — cream band, the page's signature editorial layout.
- Drop the icons from the category `Badge` (slop #7); text-only chips, pull the three-color taxonomy back toward restraint (keep navy/slate/copper but ensure it reads as the site's two-accent discipline, not a new language).
- Recolor not needed here, but **promote the top item to a featured row** (larger `level={2}` heading + lead-in, full-width) to create a focal point; run the rest as compact rows.
- Meta rail: fix `3/9 → 4/8` (§1.11) or move date/badge inline above the title for the compact rows.
- Headings `level={3}` (no override, §1.4).
- Remove "Full write-up coming soon" ×5 (slop #6).

**CTA** (`:124-146`) — replace with `<CtaClose tone="navy" eyebrow="Compliance reminders" heading="Filing deadlines pegged to your entity." lede="SAM renewal, CMMC windows, set-aside recertification, FAR/DFARS reps & certs — set to your specific filing cadence." to="/claim" />`. Band `base → lg`.

### CONTACT — `src/pages/ContactPage.tsx`

The most barren page — a prose-width form floating high with the lower third empty (confirmed in `contact.png`).
- **Adopt the Claim two-column layout** for cross-page family: `Container width="wide"`, `Grid cols={12} align="start"`. Left rail (5 cols): eyebrow + h1 + lede + a short editorial "what to include / response SLA / alternative" `MonoLabel` list. Form card right (7 cols). This kills the void and makes Contact belong to the same family as Claim.
- Header rhythm: drop the ad-hoc `mt-3 / mt-5` (`:14,:17`) → the locked `mt-4 / mt-6`.
- Remove the ad-hoc `pb-24` (`:12`); let `Section` own rhythm. Add `divide` to the section so it closes with the standard hairline.
- `paper-grid opacity-30 → opacity-50`.
- Submit alignment is already `justify-end` (`ContactForm.tsx:96`) — correct; this is the canonical alignment.

### CLAIM — `src/pages/ClaimPage.tsx` (the reference layout — converge others toward it)

- **Remove the icon-in-box pattern** (`:55-57`, slop #4): delineate the 4 items with mono index numerals (`01 02 03 04`) via `MonoLabel`. Remove the `Activity, BadgeCheck, Clock, Mail` imports.
- Item titles `text-[15px] font-semibold` (`:59`) → `<Heading level={4}>` (§1.4).
- Tighten the icon list to 3 items OR add breathing room between the lede and the list (`:47→:52`) so the h1 reads as the entry point before the supporting list — the form is the single focal point; keep the left column lighter.
- **Form submit alignment:** `ClaimForm.tsx:137` `justify-center → justify-end` (match Contact; §form-convention).
- `paper-grid opacity-40 → opacity-50`; add `divide` to the hero section (§1.3).
- Keep `ratio` 5/7 (form-right) — documented intentional mirror.

---

## 7. PRIORITIZED CHECKLIST

### CRITICAL (structural frame — the "disconnected documents" / "floating" verdict)
- [ ] Add real nav + persistent Claim button to `SiteHeader.tsx` (§1.14).
- [ ] Extract `<SectionHeader>` primitive (block + rail layouts, locked rhythm) and route every page header/hero cluster through it (§1.1, §1.2).
- [ ] Extract `<CtaClose>` primitive (flat navy/slate, centered statement, copper-rule); replace the 4 hand-rolled closers (§1.9, §2 #1).
- [ ] Home hero: move CTA to LEFT column (`cta` prop, `size="lg"` + ghost), `ratio="7/5"`, mono trust line (§3.1).
- [ ] Home card: delete footer CTA, cut Contacts tab, `panelHeight 236→196`, demote legal name to `h4` (§3.2).
- [ ] Hero primitive: `align="start"`, lede `max-w-2xl`, compose `<Grid cols={12}>` (§1.10).

### HIGH (slop removals + the inconsistency the eye reads)
- [ ] Delete every `bg-gradient-to-br` gradient; flat fills only (§2 #2).
- [ ] Break the two equal 3-col grids: Home "How it works" stagger + About pillars asymmetric/numbered (§2 #3, §6).
- [ ] Fix near-invisible Home "How it works" card body text on the navy band (§6 Home).
- [ ] Slate band fill `slate-100 → slate-200` in `section.tsx`; re-verify footer contrast (§1.7).
- [ ] CategoryGrid arrow `slate-300 → copper-600` (contrast + copper at rest) (§2 #7).
- [ ] Add a navy anchor band to every page per the cadence table; Opportunities gets a NEW navy stat band (§1.7, §6).
- [ ] About hero: kill two-paragraph wall → single lede (+ optional fact strip); container `content → wide` (§6 About).
- [ ] Remove "Full write-up coming soon" ×5; one hero note instead (§2 #6).
- [ ] Claim: remove icon-boxes → mono index numerals (§2 #4, §6 Claim).
- [ ] De-duplicate the business-model paragraph (full on About, one-line pointer in Manifesto) (§2 #8).
- [ ] Manifesto: real terminal `<Button>` replacing the dangling "Type your UEI above" (§2 #9).
- [ ] Contact: adopt Claim two-column layout; kill the void (§6 Contact).

### MEDIUM (type-scale + marker discipline)
- [ ] Add `--text-h4` token + `h4` role to `Heading`; replace every `text-[1.5rem] / md:text-[1.875rem] / text-[17px] / text-[15px]` override on Heading/Text with a token (§1.4).
- [ ] One marker vocabulary: copper-square tick (features) + copper hairline rule (qualifiers); remove navy square and `rounded-pill` dot (§1.13).
- [ ] Differentiate the two CategoryGrid renders: Home teaser (lighter) vs Opportunities hub (richer — `whatYouGet`/`goodIf` data) (§6 Home, Opportunities).
- [ ] Category hero: substance into promo card to kill the void; padding `sm→md`; title `h4` (§6 Category).
- [ ] Category "What you get" as focal rail section; "Worth claiming if" tighter (§6 Category).
- [ ] Resources: featured top row, 4/8 meta rail, icons dropped from badges (§6 Resources).
- [ ] Form submit alignment: `ClaimForm.tsx:137` `justify-center → justify-end` (§6 Claim).
- [ ] Closing/CTA bands uniformly `spacing="lg"`; Resources `base → lg` (§1.3).

### POLISH (micro-cohesion)
- [ ] `tabular-nums` baked into `Stat` value/sub and `MonoLabel` base (§1.6).
- [ ] Consolidate small labels to `text-eyebrow` + `text-mono-label` (tabs, badge, stat sub, field label) — exactly two label sizes (§1.5).
- [ ] One hero backdrop: `seal-wash` + `paper-grid opacity-50` on every hero; remove the 30/40/60 magic numbers (§1.10).
- [ ] Standardize CTA copy to sentence-case "Claim your entity" everywhere (§1.8).
- [ ] Hairline-grid card inner padding: one value (`md:p-8`) for Home steps + About pillars (§6 About).
- [ ] Remove `<br />` on `ResourcesPage.tsx:83`; keep Home hero 3-line lockup (§2 #10).
- [ ] Add `divide` to Claim + Contact hero sections for hero-hairline consistency (§1.3).
```
