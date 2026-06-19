# Design Verify — Confirmed Fix List

Final implementation pass. Six adversarial verifiers ran; their findings were
deduped and re-confirmed against source, spec (`docs/design-cohesion-spec.md`),
and the post-overhaul screenshots in `/tmp/review`. **This site is NOT done —
there is one real critical (mobile-broken funnel) plus two high-severity layout
defects.** Everything below is observable and confirmed; vague nitpicks dropped.

Spans desktop-only nits, false-positive duplicates, and unverifiable claims were
discarded. The remaining list is ordered critical → high → medium → polish.

---

## CRITICAL

### C1 — Contact & Claim clip content on all viewports below `lg` (phones + tablets)
**Files:** `src/pages/ContactPage.tsx` (lines 30, 54), `src/pages/ClaimPage.tsx` (lines 54, 83)
**Root cause:** `src/components/ui/grid.tsx:12` — the 12-col variant is `grid-cols-1 lg:grid-cols-12`.

Confirmed in `/tmp/review/mobile/contact.png` and `/tmp/review/mobile/claim.png`:
the h1, lede, detail list, and the entire form card (inputs + "Send" button) are
sliced off the right edge at 390px. Mechanism: both pages place children with
`<Cols span={12} spanMd={5}>` / `spanMd={7}`. The base `col-span-12` lands on a
parent that is `grid-cols-1` until `lg` (1024px), so the child requests 12 implicit
tracks and the column box blows out to ~528px inside a 390px viewport. `spanMd` is
also inert because the grid never becomes 12-track at `md` (see H2). The marketing
heroes escape this only because they route through the `Hero` primitive, which uses
`spanLg`-only with no base `span`.

**Fix:** On both Cols in each page, drop the base `span={12}` and change
`spanMd={5}`/`spanMd={7}` → `spanLg={5}`/`spanLg={7}`. Below `lg` the grid is
`grid-cols-1` and the columns stack full-width; at `lg` they split 5/7. This
mirrors the `Hero` primitive's working pattern.

```
ContactPage.tsx:30   <Cols span={12} spanMd={5}>  →  <Cols spanLg={5}>
ContactPage.tsx:54   <Cols span={12} spanMd={7}>  →  <Cols spanLg={7}>
ClaimPage.tsx:54     <Cols span={12} spanMd={5}>  →  <Cols spanLg={5}>
ClaimPage.tsx:83     <Cols span={12} spanMd={7}>  →  <Cols spanLg={7}>
```
**Verify:** at 390px, `document.scrollWidth === window.innerWidth` on `/contact`
and `/claim`; no child exceeds viewport width.

---

## HIGH

### H1 — Opportunities renders categories 01 & 02 twice on one page
**File:** `src/pages/OpportunitiesPage.tsx` (line 19, lines 99–144) + `src/components/marketing/CategoryGrid.tsx`

Confirmed in `/tmp/review/opportunities.png`: the featured 2-up shows
**01 Opportunities** and **02 Surety Bonds**, then the hub ledger immediately
below *also* starts with **01 Opportunities** and **02 Surety Bonds** (same blurb,
same chips) before continuing 03 Capital … 06 Compliance. `FEATURED = CATEGORIES.slice(0,2)`
is featured, but `<CategoryGrid variant="hub" />` still maps the full `CATEGORIES`
array. The spec (§6 Opportunities) says feature the top 1–2 then demote **THE REST**.

**Fix:** Add an offset/skip prop to `CategoryGrid` so the hub renders only the
non-featured slice and numbers continuously:
- In `CategoryGrid.tsx`, accept `start = 0` (or `offset`), iterate
  `CATEGORIES.slice(start)`, and render the numeral as `String(start + i + 1).padStart(2,"0")`.
- In `OpportunitiesPage.tsx:144`, pass `<CategoryGrid variant="hub" start={2} />`.

Result: page reads 01–06 once across featured + ledger; no duplicate rows.

### H2 — 12-col grid never engages at tablet (`md`), so `spanMd` is dead site-wide
**File:** `src/components/ui/grid.tsx:12`

The variant is `grid-cols-1 lg:grid-cols-12` (no `md:grid-cols-12`), but every
12-col consumer sets `spanMd` (`CategoryPage` 7/5 hero, `ResourcesPage` 4/8 rail,
`CategoryGrid` 1/3/7 rows). Between 768–1023px the `md:col-span-*` classes are
inert and the intended 2-column layouts stay single-column stacked. The `cols={2}`/
`cols={3}` variants correctly switch at `md`, so the 12-col case is the lone
inconsistency, and it contradicts the spec's locked split-ratio intent (§1.11).

**Fix — pick ONE breakpoint and make grid + spans agree.** Given C1 already moves
Contact/Claim to `spanLg`, standardize the whole 12-col system on `lg`:
- Keep the grid variant `grid-cols-1 lg:grid-cols-12`.
- Migrate the remaining `spanMd` consumers to `spanLg`:
  - `CategoryPage.tsx:46,56` (7/5 hero)
  - `ResourcesPage.tsx:103,111,125,131` (4/8 rail)
  - `CategoryGrid.tsx:20,25,30,50` (1/3/7 ledger row) — and drop the base
    `span={2}`/`span={10}`/`span={12}` (same latent `col-span-12`-on-1-track
    defect as C1; harmless today only because the cells are short/wrappable).

Alternative (smaller diff, but tablet gets the 2-col split): change the variant to
`grid-cols-1 md:grid-cols-12` and leave `spanMd` in place. Either is acceptable;
do not leave grid and spans on mismatched breakpoints.
**Verify:** at ~820px, Category/Resources render their 2-column layouts; at 390px
nothing clips.

### H3 — About "Three pillars" is still a symmetric 3-equal-column slop grid
**File:** `src/pages/AboutPage.tsx:83–89` (+ `Pillar` :128–155)

Confirmed in `/tmp/review/about.png`: three dead-equal cells, identical internal
structure (numeral + eyebrow + h3 + body), identical width — the exact pattern the
spec named as slop and forbade. The companion Home "How it works" module WAS broken
into a full-width lead + 2-up (`HomePage.tsx:129–140`), so the two pages now read
inconsistently — proof the About half was left undone.

**Fix:** Mirror the Home `StepCard` composition. Restructure `AboutPage.tsx:83–89`
so pillar **01** is a full-width lead row (numeral + eyebrow + h3 + body inline,
like the `lead` StepCard) and pillars **02/03** render in a `<Grid cols={2} gap="px">`
below. Reuse the lead/support pattern so the trio reads as one deliberate component.

### H4 — `bg-line` bleeds through under short pillar cards (`align="start"` on a hairline grid)
**Files:** `src/pages/AboutPage.tsx:84`, `src/pages/HomePage.tsx:134`

The pillar grid is `<Grid cols={3} gap="px" className="border border-line bg-line">`
with no `align`, and Grid defaults to `align: "start"` (`items-start`,
`grid.tsx:28`). Cards don't stretch to equal height, so the `bg-line` gap-fill shows
as a partial line-colored bar under the shortest card (visible under the middle
pillar in `/tmp/review/about.png`). Same latent defect on the Home support-step
2-up (`HomePage.tsx:134`) — hidden only because those two cards happen to be equal
height.

**Fix:** Add `align="stretch"` to the About pillar Grid (`AboutPage.tsx:84`) and the
Home support-step Grid (`HomePage.tsx:134`). (If H3 restructures the About grid,
apply `align="stretch"` to the new 02/03 grid.)

### H5 — Mobile hamburger collapses to a ~24px-wide touch target
**File:** `src/components/site/SiteHeader.tsx:48–56` (+ Claim button :45–47)

The toggle is `inline-flex h-9 w-9` inside `flex items-center gap-3` with no
`shrink-0`. The persistent "Claim your entity" Button wraps to two lines on mobile
(visible in `/tmp/review/mobile/contact.png` — "Claim your / entity", ~66px tall),
consuming the row's width budget and shrinking the hamburger to a thin ~24px×36px
rectangle — both axes under the 44px minimum.

**Fix:**
- Add `shrink-0` to the menu `<button>` and bump it to `h-11 w-11` (or at minimum
  `h-10 w-10`) for a ≥44px target.
- Add `whitespace-nowrap` to the Claim Button (`:45`) and shorten its mobile label —
  e.g. show "Claim" below `md` and the full "Claim your entity" at `md+` — so the
  right-side group fits 390px without starving the toggle.

---

## MEDIUM

### M1 — Remove the off-scale `md:text-[1.875rem]` override on category row titles
**File:** `src/components/marketing/CategoryGrid.tsx:26`

Flagged by 4 of 6 verifiers; spec §1.4 (line 98) names this exact line for removal
(`md:text-[1.875rem] → level={3}` no override) and §1.4 mandates zero `text-[…]`/
`md:text-[…]` on `<Heading>`. It bumps the h3 token (24px) to 30px and renders on
BOTH the Home "What's inside" teaser and the Opportunities hub ledger — the most
widely-rendered token violation, and it makes the teaser-vs-detail differentiation
ride an ad-hoc override instead of the scale.

**Fix:** `<Heading level={3}>{c.title}</Heading>` (delete the className override).
If the hub variant genuinely wants heavier titles, branch on `variant` with a
token-based weight class — never a raw px size.

### M2 — Route the form input size through the token
**File:** `src/components/forms/Field.tsx:34`

Spec §1.4 (line 101) directs replacing the raw `text-[15px]` on the `baseInput`
string with `text-body-sm`. `--text-body-sm` is `0.9375rem` (= 15px, confirmed in
`index.css:95`), so the swap is pixel-identical — it just removes the last raw
`text-[…]` override in the form family (applies to both `TextInput` and `TextArea`).

**Fix:** in `baseInput`, `text-[15px]` → `text-body-sm`.

### M3 — Sentence-case the 404 secondary CTA
**File:** `src/pages/NotFoundPage.tsx:23`

Spec §1.8 mandates sentence-case "Claim your entity" everywhere and "Replace all
`Claim Your Entity` strings." `grep` confirms this is the **only** remaining
title-case instance in `src/`, and `NotFoundPage` is a live route (`path="*"`).

**Fix:** `Claim Your Entity` → `Claim your entity`.

---

## POLISH

### P1 — Consolidate the hero-card bespoke mono sizes onto the token
**File:** `src/components/marketing/GoldenProfilePreview.tsx:66, :121`

Two raw mono sizes survive: `text-[11px]` (UEI/CAGE provenance line) and
`text-[10px]` (agency share-% column). The 10px share figure is exactly the
`--text-mono-label` role (`0.625rem` = 10px, confirmed in `index.css:107`); §1.5's
intent is exactly two uppercase-label sizes site-wide. These are the only bespoke
mono sizes left.

**Fix:** Change the `:121` share-% `text-[10px]` → `text-mono-label`. For the
`:66` mixed-case provenance line, either swap to `text-mono-label` or, if 11px is
deliberate for that dense line, define it once as a token rather than inlining.
Low blast radius; do not block the funnel fixes on it.

### P2 — Replace the literal arrow in the "All six categories" ghost link
**File:** `src/pages/HomePage.tsx:153–156`

The ghost link uses a literal "→" inside the label string instead of the
standardized `trailingIcon={ArrowRight}` lucide icon every other action uses (§1.8
one-CTA discipline).

**Fix:** Drop the literal "→" from the label and add `trailingIcon={ArrowRight}`
to the Button.

---

## Dropped (non-issues / unconfirmed / out of scope)

- **CategoryPage promo-card "dead void"** (polish in one verdict): the spec's
  prescribed remedy (mono datum row + `padding="md"` + `align="start"`) is already
  applied (`CategoryPage.tsx:56–81`). Residual whitespace from unequal column
  heights is inherent to a 4-line headline beside a compact card; not a concrete,
  observable defect with a clean fix. Skip.
- **Resources / CategoryGrid "latent clipping"** as a *separate* critical: it is the
  same root cause as C1/H2 and is fixed by H2's span migration — folded in, not a
  distinct item.
- **GoldenProfilePreview as a §1.4 Heading violation:** the `:66`/`:121` lines are
  raw `<p>`/`<span>`, not `<Heading>`/`<Text>`, so they fall outside the strict
  rule. Tracked only as polish P1.
