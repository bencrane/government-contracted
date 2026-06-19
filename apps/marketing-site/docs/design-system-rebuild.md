# Design System Rebuild — `apps/marketing-site`

Status: PLAN ONLY. No production code is changed by this document. The single write
is this file.

Scope: the "Government Contracted" marketing site (`apps/marketing-site`). Brand is a
restrained navy/copper "federal document" aesthetic with a Fraunces serif display
face. Stack: Next.js 15.5 (App Router, RSC-by-default), React 19, Tailwind v4 beta
(`@theme` token-driven), framer-motion, lucide-react, zod, pnpm. All `file:line`
citations below were verified against the working tree.

---

## 1. Verdict & Executive Summary

The site has a **real color-and-font token layer and exactly one real UI primitive
(`Field`)** — and nothing else. Above the token line there is no system: no type
scale, no spacing rhythm, no layout primitives, no component primitives. Every page is
hand-assembled from raw Tailwind utility strings, so the same concept is expressed many
incompatible ways: the section container `mx-auto max-w-7xl px-6 …` is re-typed **16
times across 8 files**, the eyebrow class string `text-[13px] font-semibold uppercase
tracking-[0.18em]` is copy-pasted **16 times** (a global size change required a `sed`),
the primary CTA is reimplemented inline **11 times in 5 mutually divergent sizings**,
and the page `<h1>` appears in **at least 4 different size/line-height signatures** for
the identical semantic role. The cost is already visible: visual drift between pages,
no single source of truth to change, a hero whose text column floats mis-aligned
against its card because alignment is improvised per-section (`items-center` with no
shared datum, `app/page.tsx:13`), and zero machine enforcement (no `components/ui/`, no
lint rule, bare `eslint-config-next` with no project rules file). The target is a
**token-complete, primitive-driven system**: extend the existing `@theme` with
typography / spacing / radii / elevation / z-index scales, add ~10 layout + component
primitives under `components/ui/*` governed by `class-variance-authority` +
`tailwind-merge`, recompose all six pages onto them, then turn on lint rules that ban
ad-hoc `text-[…]`/`px-[…]` so the rot cannot grow back. The brand does not change — it
gets a grammar.

---

## 2. Current-State Audit (evidence-based)

### 2.1 Tokens — the one solid layer

`app/globals.css` is genuinely good and is the foundation to build on, not replace.

- **Color** — full navy (`navy-50…900`, `globals.css:17-26`), copper (`copper-50…800`,
  `:29-37`), warm slate (`slate-50…900`, `:40-49`), semantic surface/foreground/line
  (`:5-13`), and status (`:52-54`). Every value is a `--color-*` custom property, so
  Tailwind v4 generates `bg-navy-700`, `text-copper-600`, etc. This is the system's
  spine and stays.
- **Font families** — `--font-sans` (Inter), `--font-serif` (Fraunces), `--font-mono`
  (JetBrains) wired to `next/font` variables (`:56-58`, `app/layout.tsx:7-21`).
- **Brand utilities** — `.font-display` (`:89-93`, applies Fraunces + `ss01/ss02` +
  `-0.02em` tracking), `.text-balance` (`:95`), `.paper-grid` (`:100-105`), `.seal-wash`
  (`:108-112`), `.copper-rule` (`:115-119`). These encode the "federal document" look
  and are worth keeping verbatim.

**What is missing from the token layer entirely:** no `--text-*` type scale, no
`--spacing`/section-rhythm tokens, no `--radius-*`, no `--shadow-*`/elevation, no
`--z-*`, no breakpoint tokens. Tailwind v4's defaults exist, but the site does **not**
use them for its display type or spacing — it uses arbitrary values (below), which is
exactly the gap.

### 2.2 Typography — no scale; one role rendered many ways

There is no semantic type scale. Sizes are chosen per-instance. Enumerated from the
tree:

**Arbitrary pixel sizes in use** (count → token):

| value | count | where (representative) |
|---|---|---|
| `text-[13px]` | 16 | eyebrows, every page |
| `text-[11px]` | 16 | micro-labels, badges, KPI subs |
| `text-[10px]` | 15 | mono micro-labels in cards |
| `text-[15px]` | 8 | body-small / category descriptions |
| `text-[17px]` | 3 | `[category]` "what you get" list, Manifesto body |
| `text-[64px]` | 1 | home H1 only (`app/page.tsx:18`) |
| `text-[22px]` | 1 | card legal name (`GoldenProfilePreview.tsx:76`) |

**Named sizes in use:** `text-sm` ×24, `text-5xl` ×11, `text-xs` ×10, `text-4xl` ×10,
`text-2xl` ×9, `text-3xl` ×8, `text-lg` ×7, `text-6xl` ×5, `text-base` ×3, `text-xl` ×1.

**The damning part — one semantic role, many signatures.** The page `<h1>` is written as:

- `text-5xl … text-balance md:text-[64px]` (home, `app/page.tsx:18`)
- `text-5xl leading-[1.05] … md:text-6xl` (opportunities `:19`, resources `:75`,
  `[category]` `:38`, contact `:17`)
- `text-5xl leading-[1.05]` (claim `:51`, no `md:` step)
- `text-4xl leading-[1.05] … md:text-5xl` (about `:20`)
- `text-5xl … md:text-6xl` (not-found `:10`, no explicit leading)

The H2 section heading is equally forked: `text-4xl … md:text-5xl` (home `:44,:90`),
`text-3xl leading-tight … md:text-4xl` (about `:67`, opportunities `:43`, `[category]`
`:74,:98,:119`), `text-2xl … md:text-3xl` (resources `:127`). Line-heights are eyeballed:
`leading-[1.05]` ×6, `leading-[1.02]` ×1, `leading-[1.1]` ×1, plus `leading-tight`,
`leading-snug`, `leading-none`, `leading-relaxed` scattered. Tracking is forked too:
`tracking-[0.18em]` ×27, `tracking-[0.14em]` ×5, `tracking-[0.12em]` ×2.

**Weight is effectively binary** — `font-semibold` ×35, `font-medium` ×4 — so a weight
token layer is trivial and the scale can bake weight into role.

**Conclusion:** the same headline tier is 4+ shapes; a designer changing "the H1" has no
single place to change it. This is the highest-value fix.

### 2.3 The eyebrow / kicker — copy-pasted 16×

The exact string `text-[13px] font-semibold uppercase tracking-[0.18em]` appears **16
times** at: `not-found.tsx:7`, `contact:14`, `opportunities:16,:40`, `page.tsx:15,:41,:87`,
`[category]:35,:48`, `resources:72,:124`, `about:17,:64,:124`, `claim:48`,
`Manifesto.tsx:5`. The only variation is the trailing color (`text-copper-600` on
cream sections, `text-copper-300` on navy sections, `app/page.tsx:41`). Counting the
mono variant (`font-mono text-[13px] font-semibold uppercase tracking-[0.18em]`,
Manifesto), the kicker concept spans **34 uppercase-tracking label instances** total.
There is a second, smaller "mono micro-label" role (`font-mono text-[10px] uppercase
tracking-[0.18em]`, ×8; `…tracking-[0.14em]`, ×3) used inside cards. Both are one
component each, unbuilt.

### 2.4 The primary CTA — reimplemented 11× in 5 divergent sizings

`bg-navy-700` + white text is the primary button. It is hand-typed every time it
appears (12 grep hits; one — `[category]:81` — is a non-button icon chip). The 11 real
buttons split into **five incompatible size signatures**:

| sizing | count | sites |
|---|---|---|
| `px-6 py-3.5 text-sm` | 6 | `not-found:19`, `about:107`, `opportunities:55`, `resources:139`, `ClaimForm:135`, (de-facto default) |
| `px-5 py-3 text-sm` | 3 | `[category]:59`, `GoldenProfilePreview:165`, `EntityFinder:235` |
| `px-7 py-4 text-[15px]` | 1 | `[category]:129` |
| `px-7 py-3.5 text-sm` | 1 | `ContactForm:95` |
| `px-3 py-1.5 text-xs` | 1 | `EntityFinder:70` (inline search submit) |

Beyond size, behavior diverges: only `EntityFinder.tsx:238` animates its arrow
(`transition-transform group-hover:translate-x-0.5`); every other CTA uses a static
`<ArrowRight>`. So the same button has 5 paddings AND an inconsistent micro-interaction.
There is also a **secondary/ghost** variant typed once inline (`not-found.tsx:26`:
`border border-line-strong … hover:border-copper-500 hover:text-copper-700`) with no
reuse, and the input chrome (`Field.tsx:34` `baseInput`) is a third border-treatment
that should share tokens with the ghost button. A global "make CTAs slightly larger"
change today is an 11-file edit with judgment calls on each.

### 2.5 Section container & 12-col grid — re-hand-rolled per section

The wrapper `mx-auto max-w-7xl px-6 py-{16|20} md:py-{20|24}` is retyped for nearly
every section. `mx-auto max-w-*` occurs **16× as `max-w-7xl`** plus `max-w-6xl` ×2,
`max-w-3xl` ×4, `max-w-2xl` ×3 — **four content widths with no documented rationale**
(why is claim `max-w-6xl` but about's hero also `max-w-6xl` while its body sections are
`max-w-7xl`? `claim:45` vs `about:16` vs `about:42`). Vertical rhythm is two ad-hoc
pairs: `py-16 md:py-20` ×7 and `py-20 md:py-24` ×4, chosen by feel. The 12-column grid
is hand-rolled **12 times across 7 files** (`page.tsx:13`, `opportunities:38`,
`[category]:33,:72,:96,:117`, `resources:91,:122`, `about:62,:95`, `claim:46`,
`CategoryGrid:16`) with `gap-*` values varying `gap-8/10/12/14/16` per instance. The
alternating cream/navy "section band" system (cream default vs `bg-navy-900`
`page.tsx:38`, Manifesto `:3`; vs `bg-slate-100` about `:60`, opportunities `:36`) is
implied by repetition, never abstracted.

### 2.6 Elevation, cards — duplicated literals

The card drop shadow `shadow-[0_24px_60px_-30px_rgba(15,26,46,0.18)]` is pasted **3×
verbatim** (`contact:24`, `[category]:47`, `claim:79`), and a richer two-layer variant
`shadow-[0_1px_0_rgba(15,26,46,0.04),0_24px_60px_-30px_rgba(15,26,46,0.18)]` **2×**
(`GoldenProfilePreview:72`, `EntityFinder:39`). The "bordered surface card" shell
(`border border-line-strong bg-white/bg-surface p-7 md:p-10`) recurs across those plus
about's gradient CTA panel (`about:94`, `[category]:116`). No `Card` exists.

### 2.7 Local primitives trapped inside one file

`GoldenProfilePreview.tsx` defines `Kpi` (`:271`), `Fact` (`:299`), and inline badge
spans (`:84,:91`) that are exactly the `Stat`, `Fact`, and `Badge` primitives the rest
of the site needs (e.g. `EntityFinder` re-derives the same KPI/agency-row layout,
`:159-207`). They are private to one component, so `EntityFinder` and the resources
category pills (`resources:55-65,:93`) reinvent them. The KPI/stat block, the
agency-bar row, and the colored category pill are three reusable primitives currently
copy-evolved in two `"use client"` files.

### 2.8 Forms — the one good citizen, and its leak

`components/forms/Field.tsx` (`Field` `:12`, `TextInput` `:36`, `TextArea` `:68`) is the
**only** real, reused primitive — props-driven, single source for label + input + hint +
error. It is the model for everything else. Two leaks: (a) the submit buttons inside
`ClaimForm.tsx:135` and `ContactForm.tsx:95` re-type the CTA inline (px-6 vs px-7
divergence) instead of consuming a `Button`; (b) `baseInput` (`Field.tsx:34`) hard-codes
`text-[15px]` and its own border/focus treatment that should derive from tokens shared
with the ghost button.

### 2.9 Motion — minimal, isolated, correct boundary

framer-motion is imported in **exactly one file** (`GoldenProfilePreview.tsx`): card
entrance (`:68-72`), tab underline `layoutId` (`:133-137`), panel cross-fade
(`AnimatePresence`, `:146-158`), agency-bar grow (`:203-209`). The shared easing curve
`[0.16,1,0.3,1]` is a local `EASE` const (`:54`) — a motion token in disguise. Client
boundaries are clean and minimal: only 4 `"use client"` files (`GoldenProfilePreview`,
`EntityFinder`, `ClaimForm`, `ContactForm`); every page and layout component is RSC.
This is the correct posture and the rebuild must preserve it (do not let primitives drag
`"use client"` up the tree).

### 2.10 Alignment root cause (the floating-hero bug)

The hero grid is `grid items-center … lg:grid-cols-12` (`app/page.tsx:13`). The left
column is a short stack (eyebrow + 3-line H1 + one paragraph, `:14-28`); the right
column is the tall `GoldenProfilePreview` card (`:30-32`). `items-center` vertically
centers the short text against the tall card, so the headline floats with no shared
top datum — the text's cap-height does not line up with the card's top edge. The same
`items-center` pattern is on the `[category]` hero (`:33`). The other five `items-center`
grids (`opportunities:38`, `[category]:117`, `resources:122`, `about:95`) are benign —
they center a short heading against a short CTA in a band. **Fix:** heroes need a
`top`-aligned datum (text top edge aligns to card top edge); only symmetric CTA bands
should center. This is a layout-primitive responsibility, not a per-page guess.

### 2.11 Other findings

- **Dead code:** `federalStats()` (`lib/opportunities.ts:146-154`) is exported but
  imported nowhere — confirmed zero call sites. Either wire it into a stats band or
  delete it; do not let the rebuild carry it forward unexamined.
- **No `components/ui/`** dir exists (only `forms`, `marketing`, `site`).
- **No enforcement surface:** no `eslint.config.*` / `.eslintrc` in the app; `pnpm lint`
  runs bare `eslint-config-next` with zero project rules. Banning arbitrary values
  requires creating a config.
- **No `cva` / `clsx` / `tailwind-merge`** in `package.json` — net-new dependency
  decision.
- **Standalone Docker build** (`next.config.ts:5` `output: 'standalone'`,
  `outputFileTracingRoot` pinned to monorepo root): the rebuild must stay inside the app
  and add no cross-package import, or the file-tracing root assumptions break. Primitives
  live in-app, not in a new `packages/ui`.

---

## 3. Target Architecture

### 3.1 Token layer (extend `@theme`, do not rip out)

Keep every existing color/font/utility. **Add** the following first-class token groups
to `app/globals.css` `@theme` so they generate Tailwind utilities natively (Tailwind v4
emits `text-display`, `rounded-card`, `shadow-elevated`, etc. from these).

**Type scale** — modular, semantic-role-named, weight + leading + tracking baked in.
Defined as `--text-*` with the v4 line-height/letter-spacing companion syntax. Proposed
roles and values (refining the brand, fixing the H1 sprawl to one truth):

| role | size (clamp, fluid) | line-height | tracking | weight | family | replaces |
|---|---|---|---|---|---|---|
| `display` | `clamp(2.75rem, 6vw, 4rem)` (44→64px) | 1.02 | -0.02em | 400 | serif | `text-[64px]`, the 4 H1 shapes |
| `h1` | `clamp(2.25rem, 4.5vw, 3.25rem)` (36→52px) | 1.05 | -0.02em | 400 | serif | page `<h1>` |
| `h2` | `clamp(1.75rem, 3.2vw, 2.5rem)` (28→40px) | 1.1 | -0.01em | 400 | serif | the forked H2s |
| `h3` | `1.5rem` (24px) | 1.2 | -0.01em | 400 | serif | card titles, `text-2xl` display |
| `body-lg` | `1.125rem` (18px) | 1.6 | 0 | 400 | sans | hero/body lede `text-lg` |
| `body` | `1rem` (16px) | 1.6 | 0 | 400 | sans | default prose |
| `body-sm` | `0.9375rem` (15px) | 1.55 | 0 | 400 | sans | `text-[15px]` ×8 |
| `caption` | `0.8125rem` (13px) | 1.4 | 0 | 500 | sans | small meta `text-xs/13px` |
| `eyebrow` | `0.8125rem` (13px) | 1.2 | 0.18em | 600 | sans · uppercase | the 16× eyebrow |
| `mono-label` | `0.625rem` (10px) | 1.3 | 0.16em | 600 | mono · uppercase | the ×8 mono micro-label |

Notes: `display`/`h1`/`h2` become fluid `clamp()` so the `md:text-6xl` step-ups vanish
(one token, no responsive variant needed). `eyebrow` and `mono-label` carry
`text-transform:uppercase` and tracking so the kicker collapses to one class. Weight is
encoded but overridable. The two existing `font-display` feature-settings (`ss01/ss02`)
move into the serif roles.

**Spacing & section rhythm** — Tailwind's 4px base stays for micro-spacing; add named
**section** and **gutter** tokens so `Section`/`Container` stop guessing:

```
--spacing-gutter: 1.5rem;     /* the px-6 page gutter, one source */
--section-y: 5rem;            /* default band padding (80px ≈ py-20) */
--section-y-lg: 6rem;         /* emphasis band (96px ≈ py-24) */
--section-y-sm: 4rem;         /* tight band (64px ≈ py-16) */
```

Content widths collapse from four ad-hoc to a **named set**: `--w-prose: 48rem`
(`max-w-3xl`, long-form: contact/manifesto), `--w-content: 72rem` (`max-w-6xl`,
text-forward pages), `--w-wide: 80rem` (`max-w-7xl`, full grids). Three, each with a
documented use, replacing the current 2xl/3xl/6xl/7xl free-for-all.

**Radii** — the brand is sharp-cornered (almost no `rounded-*` today except the
status/copper dot `rounded-full`). Codify intent: `--radius-none: 0` (default, the
federal-document edge), `--radius-pill: 9999px` (dots/pills only). This *documents* the
deliberate squareness so nobody "softens" it ad hoc.

**Elevation** — replace the two pasted shadow literals with tokens:
`--shadow-card: 0 24px 60px -30px rgba(15,26,46,0.18)` and
`--shadow-raised: 0 1px 0 rgba(15,26,46,0.04), 0 24px 60px -30px rgba(15,26,46,0.18)`
(the GoldenProfile/EntityFinder treatment). Two levels, named.

**Z-index** — codify the sticky header (`SiteHeader.tsx:5` `z-50`): `--z-header: 50`,
`--z-overlay: 40`, `--z-base: 0`. Prevents future z-index wars.

**Breakpoints** — Tailwind v4 defaults (`md`/`lg`) are already what the site uses; no
custom breakpoints needed. Document that `md` = layout shift, `lg` = hero two-up, so
the choice is intentional rather than copied.

**Motion** — promote the local `EASE` to a token: `--ease-brand: cubic-bezier(0.16, 1,
0.3, 1)` and durations `--dur-fast: 0.18s`, `--dur-base: 0.3s`, `--dur-slow: 0.6s`,
matching what `GoldenProfilePreview` already uses (`:71,:136,:152,:206`).

### 3.2 Layout primitives

All RSC (zero `"use client"`). Live in `components/ui/`.

**`Container`** — the single owner of horizontal centering + gutter + max-width.
```tsx
<Container width="wide" | "content" | "prose">   // default "wide"
// → mx-auto px-[gutter] max-w-[--w-*]
```
Replaces all 16 `mx-auto max-w-7xl px-6` strings.

**`Section`** — owns vertical rhythm + the cream/navy/slate band system + the bottom
hairline. Composes `Container`.
```tsx
<Section
  tone="cream" | "navy" | "slate"     // default "cream"; navy → bg-navy-900 text-slate-100
  spacing="sm" | "base" | "lg"        // → --section-y-{sm|base|lg}
  divide                              // → border-b border-line
  containerWidth="wide" | "content" | "prose"
  id?
>
```
Replaces every `<section className="…"><div className="mx-auto …">` pair (the dominant
page shape). On `tone="navy"` it also flips eyebrow color to copper-300 automatically so
the `text-copper-600`/`-300` split (§2.3) is handled by context, not by hand.

**`Grid` / `Cols`** — the 12-col grid as a primitive with a fixed gutter token.
```tsx
<Grid cols={12} gap="lg" align="start" | "center">   // align default "start"
  <Cols span={6} spanMd={7}>…</Cols>
</Grid>
```
Replaces the 12 hand-rolled grids; `gap` pulls from spacing tokens so `gap-8/10/12/14`
sprawl ends.

**`Hero`** — fixes §2.10. A specialized two-column layout that **aligns the text column's
top to the media column's top** (`align="start"` baseline datum), with an explicit
`media` slot.
```tsx
<Hero
  align="datum"            // text-top ↔ media-top (the fix). "center" only for symmetric bands.
  eyebrow={…} heading={…} lede={…}
  media={<GoldenProfilePreview />}
  ratio="6/6" | "7/5"      // home is 6/6, category is 7/5
>
```
The home and `[category]` heroes both become `<Hero align="datum">`; the floating-headline
bug is structurally impossible.

### 3.3 Component primitives

Live in `components/ui/`. RSC unless noted.

**`Button`** — the single CTA source of truth. Replaces all 11 inline reimplementations.
```tsx
<Button
  variant="primary" | "secondary" | "ghost"
  // primary = bg-navy-700 hover:bg-navy-800 text-white
  // secondary = border border-line-strong hover:border-copper-500 hover:text-copper-700  (the not-found ghost)
  // ghost = transparent text link-ish
  size="sm" | "md" | "lg"
  // sm = px-5 py-3 text-sm        (card CTAs)
  // md = px-6 py-3.5 text-sm      (the de-facto default, ×6)
  // lg = px-8 py-4 text-base      (top-of-page emphasis; replaces the px-7 py-4 one-off)
  fullWidth?            // the card "w-full" CTAs
  asChild?             // render as <Link> (Next) without nesting <a><button>
  trailingIcon={ArrowRight}   // static by default
>
```
**No-animated-arrow rule, codified:** the arrow is rendered *static* by `Button`. There
is no `animateIcon` prop in v1 — the single animated instance (`EntityFinder:238`) is a
drift, not a feature, and is dropped. (If motion on the arrow is ever wanted, it becomes
one opt-in prop on the one source, not 11 hand-typed variants.) `asChild` (Radix-Slot
pattern, or a thin local Slot) lets the same component back both `<button>` and
`next/link` without an animated client wrapper, so `Button` stays RSC.

**`Card`** — bordered surface shell + elevation token.
```tsx
<Card elevation="card" | "raised" | "none" surface="white" | "muted" padding="sm" | "md">
```
Replaces the pasted shadow literals (§2.6) and the card shell. `GoldenProfilePreview`
and `EntityFinder` outer wrappers become `<Card elevation="raised">`.

**`Eyebrow` (alias `Kicker`)** — the 16× string as one component.
```tsx
<Eyebrow as="p" | "span">For registered federal contractors</Eyebrow>
// → text role "eyebrow"; color resolved from Section tone (copper-600 / copper-300)
```
Plus **`MonoLabel`** for the `font-mono text-[10px] uppercase` micro-label role (§2.3).

**`Heading` / `Text`** — bind copy to the type scale; the only place display sizes are
chosen.
```tsx
<Heading level={1|2|3} display?>   // level→role (h1/h2/h3); display? swaps in the `display` role for the home hero
<Text size="body-lg" | "body" | "body-sm" | "caption" tone="default" | "muted" | "subtle">
```
Eliminates the H1-in-4-shapes problem: `level={1}` is one token.

**`Badge` / `Pill`** — the colored status/category chips (§2.7, resources `:55-65`,
GoldenProfile `:84-95`).
```tsx
<Badge tone="success" | "copper" | "navy" | "slate" icon?>SAM Active</Badge>
```

**`Stat` / `KPI`** — the metric block currently trapped as `Kpi` (`GoldenProfilePreview:271`)
and re-derived in `EntityFinder:159-181`.
```tsx
<Stat label="Lifetime awards" value="$24.6M" sub?="9 active" accent? mono?Label />
```

**`Tabs`** — the profile tab bar (`GoldenProfilePreview:111-159`), the one place that
needs the `layoutId` underline + `AnimatePresence`. This is the **only** primitive that
is `"use client"` (it owns interaction + framer-motion). API:
```tsx
<Tabs items={[{id,label,panel}]} defaultId underlineLayoutId>
```
Keeps motion contained to a single client primitive instead of letting it spread.

**`GoldenProfilePreview` decomposition** (the showcase recompose):
- outer wrapper → `<Card elevation="raised" padding="none">`
- header identity block (`:75-97`) → `<Heading level={3} display>` + `<MonoLabel>` +
  `<Badge tone="success">` / `<Badge tone="copper">` (cert chips)
- the 3-up obligations row (`:100-108`) → `<Grid cols={3} divide>` of `<Stat>` (the
  local `Kpi` is deleted; `Stat` is shared)
- tab bar + panels (`:111-159`) → `<Tabs>` (the only retained client surface)
- `Fact` cells in RegistrationPanel (`:299`) → `<Stat>` with `icon` slot
- footer CTA (`:162-173`) → `<Button variant="primary" size="sm" fullWidth asChild>` +
  `<Text size="caption" tone="subtle">` provenance line

The component drops from ~335 lines of bespoke layout to composition; `EntityFinder`
then reuses the identical `Stat`/`Badge`/`Card` and its sole divergence (the animated
arrow) disappears.

### 3.4 Tooling — `cva` + `tailwind-merge` + `clsx`

**Recommendation: adopt `class-variance-authority` (cva) + `tailwind-merge` + `clsx`.**

- **`cva`** expresses `variant × size × state` as a typed config object — the exact
  shape `Button`/`Card`/`Badge`/`Section` need. It produces a single source per
  primitive with autocompleted, type-checked variant props, which is the structural
  cure for "5 button sizings."
- **`tailwind-merge`** resolves conflicts when a caller passes an override `className`
  (e.g. a one-off margin) without specificity surprises — essential because primitives
  accept `className` passthrough.
- **`clsx`** for conditional class composition. Wrap both in one `cn()` helper at
  `lib/cn.ts` (`twMerge(clsx(inputs))`), the standard pattern.

**Why these, given the constraints:** all three are tiny, zero-runtime-CSS, framework-
agnostic, and **RSC-safe** — they are pure string functions, import no React, and run at
render with no client boundary. Nothing here forces `"use client"`. There is a known
Tailwind v4 nuance: `tailwind-merge`'s conflict map is built for Tailwind's default
scale, and our **custom `@theme` tokens** (e.g. `text-display`, `shadow-card`) are not in
its default group map. Mitigation: since primitives own their base classes and callers
rarely override *tokenized* utilities, configure `extendTailwindMerge` with our custom
groups (`text-*` display roles, `shadow-*`, `rounded-*`) once in `lib/cn.ts`. This is a
~20-line config, not a framework. No heavier system (no Panda, no Stitches, no CSS-in-JS)
— they fight Tailwind v4 and add a runtime; cva is the lightest tool that solves the
actual problem.

**RSC vs client boundaries (preserve §2.9):** primitives are RSC by default. The only
client primitive is `Tabs` (framer-motion + state). `Button` stays RSC via `asChild`/Slot
rather than wrapping `next/link` in a motion component. Forms (`ClaimForm`,
`ContactForm`, `EntityFinder`) remain client islands and simply *consume* the RSC
primitives — a client component may render a server-defined primitive that emits plain
markup, so no boundary is crossed.

### 3.5 Folder structure & naming

```
apps/marketing-site/
  app/
    globals.css            # token layer — extended (type/space/radii/shadow/z/motion)
  components/
    ui/                    # NEW — all primitives, the single source of truth
      button.tsx           # <Button>  (RSC, cva)
      card.tsx             # <Card>
      container.tsx        # <Container>
      section.tsx          # <Section>  (owns tone band + rhythm)
      grid.tsx             # <Grid>, <Cols>
      hero.tsx             # <Hero>  (datum-aligned)
      heading.tsx          # <Heading>, <Text>
      eyebrow.tsx          # <Eyebrow>, <MonoLabel>
      badge.tsx            # <Badge>
      stat.tsx             # <Stat>
      tabs.tsx             # <Tabs>  (the ONLY "use client" primitive)
      index.ts             # barrel re-export
    forms/                 # existing — Field stays; submit buttons now consume <Button>
    marketing/             # existing — recomposed onto ui/*
    site/                  # existing — recomposed onto ui/*
  lib/
    cn.ts                  # NEW — cn() = twMerge(clsx(...)) + extendTailwindMerge config
  docs/
    design-system-rebuild.md   # this file
```

Naming conventions: files `kebab-case.tsx`, components `PascalCase`, one primitive per
file, variants via cva `variants` keys, props typed with `VariantProps<typeof xCva> &
{…}`. Primitives never import from `marketing/`, `site/`, or `forms/` (dependency flows
one way: pages/sections → `ui/`). No barrel cycles.

### 3.6 Auditability & enforcement (right-sized for a 6-page site)

Worth doing (low cost, high leverage):

1. **ESLint rule banning arbitrary type/spacing outside the scale.** Create
   `eslint.config.mjs` (none exists today) extending `eslint-config-next`, add
   `eslint-plugin-tailwindcss` or a targeted `no-restricted-syntax` regex that flags
   `text-[…px]`, `leading-[…]`, `tracking-[…em]`, `px-[…]`, `shadow-[…]` in JSX
   `className`. This is the guardrail that stops regression to §2.2/§2.4. Allow an
   escape hatch via inline `eslint-disable` for the rare justified one-off.
2. **Single source per primitive, enforced by structure.** `ui/index.ts` barrel +
   a lint `no-restricted-imports` forbidding `bg-navy-700 px-` patterns is overkill;
   instead a cheap CI grep (`! grep -rE 'bg-navy-700 px-' app components/marketing
   components/site`) fails the build if a raw CTA reappears. One line in the pipeline.
3. **Component inventory** — a short `docs/ui-inventory.md` (or a `///` doc-comment per
   primitive) listing each primitive, its variants, and "use this instead of X." Cheap,
   keeps the team honest.
4. **`tsc --noEmit` + `next build`** already gate types and compilation; the rebuild
   adds nothing here beyond keeping them green per phase.

Overkill for a site this size (skip unless it grows):

- **Storybook / visual-regression (Chromatic/Playwright snapshots).** A 6-page
  marketing site with ~10 primitives does not justify the Storybook maintenance tax.
  Recommendation: **skip Storybook**; instead build a single throwaway
  `app/_kitchen-sink/page.tsx` (dev-only, not linked) that renders every primitive ×
  every variant on one page for eyeball review during the rebuild, then delete or
  `noindex` it. If the design system later spreads to `platform-app`, revisit Storybook
  then — it earns its keep across multiple consumers, not one.
- A separate `packages/ui` workspace — premature; one consumer. Keep in-app (§2.11).

---

## 4. Phased Migration Plan

Principle: **the site stays shippable after every phase.** No big-bang. Each phase ends
green on `tsc --noEmit` + `next build` + a visual diff of the affected routes. Phases 0–2
add capability without changing any rendered output; the risk concentrates in Phase 3
and is contained section-by-section.

### Phase 0 — Token foundation (zero visual change)
- **Objective:** make the design language addressable. Extend `@theme` only.
- **Deliverables:** `app/globals.css` gains `--text-*` (the 10 roles), `--section-y*`,
  `--w-*`, `--radius-*`, `--shadow-card`/`--shadow-raised`, `--z-*`, `--ease-brand` +
  durations (§3.1). `lib/cn.ts` with `cn()` + `extendTailwindMerge` config. Add
  `class-variance-authority`, `tailwind-merge`, `clsx` to `package.json`.
- **Exit criteria:** new utilities (`text-display`, `shadow-card`, etc.) compile and are
  usable; **no JSX touched**, so rendered pages are byte-identical.
- **Verification:** `next build` succeeds; `pnpm install` clean; spot-check a generated
  class in dev. Visual: zero diff (nothing consumes the tokens yet).
- **Blast radius:** near-zero. Only `globals.css` + `package.json` + one new util file.

### Phase 1 — Primitives in isolation (zero visual change)
- **Objective:** build the system without wiring it in. Prove it on a dev-only page.
- **Deliverables:** all of `components/ui/*` (§3.5) — `Container`, `Section`, `Grid/Cols`,
  `Hero`, `Button`, `Card`, `Eyebrow/MonoLabel`, `Heading/Text`, `Badge`, `Stat`, `Tabs`
  — each cva-driven, typed, RSC (except `Tabs`). A dev-only
  `app/_kitchen-sink/page.tsx` rendering every primitive × variant.
- **Exit criteria:** kitchen-sink renders every primitive correctly at the brand spec;
  `Tabs` animates with the brand easing; no production route imports `ui/*` yet.
- **Verification:** `tsc --noEmit` green; `next build` green; eyeball kitchen-sink vs the
  existing pages' look (must match the federal-document aesthetic). Production routes:
  zero diff.
- **Blast radius:** additive only — new files under `components/ui/`. Existing pages
  untouched. Fully revertible by deleting the dir.

### Phase 2 — Migrate global chrome + forms (small, contained visual surface)
- **Objective:** prove the primitives on shared chrome before touching content pages.
- **Deliverables:** `SiteHeader`/`SiteFooter` use `Container`; `ClaimForm`/`ContactForm`
  submit buttons swap to `<Button>` (kills the px-6/px-7 fork); `Field`'s `baseInput`
  border/focus pulls shared tokens (no visual change intended). `EntityFinder`'s inline
  search submit → `<Button size="sm">`.
- **Exit criteria:** header, footer, both forms, and the entity finder render via
  primitives; the two submit-button sizings converge to one (`md`).
- **Verification:** `tsc` + `next build` green; visual diff of `/`, `/contact`, `/claim`
  (forms) — expect *intentional* convergence of button padding, nothing else.
- **Blast radius:** low. 5 files, all leaf components. The only deliberate visual change
  is button-size convergence (a fix, pre-agreed in §2.4).

### Phase 3 — Migrate pages section-by-section behind the primitives
- **Objective:** recompose all six routes onto `Section`/`Container`/`Grid`/`Hero` +
  `Heading`/`Eyebrow`/`Button`/`Card`/`Stat`/`Badge`. Done one route at a time so each is
  independently shippable.
- **Sequence (ascending risk):** `not-found` → `resources` → `about` → `opportunities` →
  `opportunities/[category]` → `contact` → `page.tsx` (home) → `GoldenProfilePreview`
  (last, because it carries the motion + most primitives). Home and `[category]` heroes
  adopt `<Hero align="datum">` — **this is where the floating-headline bug is fixed**
  (§2.10).
- **Deliverables per route:** the page re-expressed as composition; all arbitrary
  `text-[…]`/`leading-[…]`/`tracking-[…]`/inline-CTA strings on that route removed; the
  page's `<h1>` becomes `<Heading level={1}>` (one of the 4 shapes → the single token).
- **Exit criteria (per route):** the route renders with **zero** arbitrary type/spacing
  utilities in its JSX; CTA(s) are `<Button>`; eyebrow is `<Eyebrow>`; the route still
  matches its prior look except the **intended** fixes (hero alignment, H1/H2 size
  unification, button-size convergence).
- **Verification (per route):** `tsc` + `next build` green; side-by-side screenshot of
  the route before/after at `md` and `lg` widths — differences must be only the agreed
  refinements; everything else pixel-stable. Confirm `Tabs`/motion still behaves on the
  home card.
- **Blast radius:** medium, but **contained to one route per step** — a regression on
  `resources` cannot affect `home`. The riskiest single step is the home hero (alignment
  change is visible by design) and `GoldenProfilePreview` (motion). Each lands as its own
  shippable change.

### Phase 4 — Delete ad-hoc + turn on enforcement
- **Objective:** make regression impossible (or loud).
- **Deliverables:** delete `app/_kitchen-sink` (or `noindex` it); delete dead
  `federalStats()` if still unused (§2.11) or wire it into a stats `Section`; create
  `eslint.config.mjs` with the arbitrary-value ban (§3.6) and the `no raw CTA` CI grep;
  add `docs/ui-inventory.md`; remove now-dead local `Kpi`/`Fact` from
  `GoldenProfilePreview` (subsumed by `Stat`).
- **Exit criteria:** `pnpm lint` fails on any new `text-[…px]`/`px-[…]`/inline
  `bg-navy-700 px-`; repo-wide grep for the eyebrow string and the CTA string returns
  **only** the primitive definitions; `tsc` + `next build` green.
- **Verification:** intentionally add a `text-[19px]` in a scratch edit → lint must
  fail; revert. Full-site visual smoke at `md`/`lg`.
- **Blast radius:** low (config + deletions). The enforcement net is the payoff: the
  §2.2–§2.6 anti-patterns cannot grow back silently.

---

## 5. Section-by-Section Remediation Map

Every section is treated as replaceable. "Primitives" = what it becomes.

| Route · section | file:line | Becomes | Risks / copy decisions |
|---|---|---|---|
| Global header | `SiteHeader.tsx:5-9` | `Section`-less; `Container width="wide"`; `Wordmark` kept | Header has **no nav / no CTA** today — open decision (§6) whether to add a persistent "Claim" `Button` |
| Global footer | `SiteFooter.tsx:5-12` | `Container`; `Text size="caption"` | None; trivial |
| Home · hero | `page.tsx:9-35` | `Section tone="cream"`(seal-wash variant) → `Hero align="datum"` with `Eyebrow`+`Heading level={1} display`+`Text body-lg`, `media={<GoldenProfilePreview/>}` | **Fixes floating headline.** Decide: keep `text-[64px]` magnitude via `display` role (yes). Hero gains the only above-fold CTA? (§6) |
| Home · how-it-works | `page.tsx:37-81` | `Section tone="navy"`; `Grid cols={3}`; `Eyebrow`(auto copper-300); step cards → `Card`+`MonoLabel`+`Heading level={3}` | Eyebrow color now context-driven; verify navy contrast |
| Home · what's-inside | `page.tsx:83-104` | `Section`; `Eyebrow`+`Heading level={2}`+`Text`; `<CategoryGrid/>` | None |
| Home · manifesto | `Manifesto.tsx` | `Section tone="navy" containerWidth="prose"`; `MonoLabel`+`Heading level={2}`; `.copper-rule` kept; body → `Text size="body-lg"` | Long-form copy; keep `max-w-4xl`→`prose`(48rem) — verify measure |
| `CategoryGrid` | `CategoryGrid.tsx:11-34` | `Grid cols={12}` rows; `MonoLabel`(index)+`Heading level={3}`+`Text`; static arrow kept | Keep the `ArrowUpRight` static (no-animated rule) |
| Opportunities · hero | `opportunities:14-28` | `Section tone="cream"`; `Eyebrow`+`Heading level={1}`+`Text body-lg` | `text-6xl`→`h1` token; verify it still reads as a hub header |
| Opportunities · grid | `:30-34` | `Section`; `<CategoryGrid variant="hub"/>` | None |
| Opportunities · CTA band | `:36-63` | `Section tone="slate"`; `Grid` + `Button size="md"` | Centered CTA band — `Grid align="center"` is correct here |
| Category · hero | `[category]:31-68` | `Hero align="datum" ratio="7/5"` + side `Card` w/ `Button size="sm" fullWidth` | **2nd floating-hero fix.** Card CTA size → `sm` |
| Category · what-you-get | `:70-92` | `Section`; `Grid cols={12}`; check-row → `Badge`/icon + `Text size="body-lg"` | `text-[17px]`→`body-lg`; the navy check chip → small `Badge tone="navy"` or kept inline icon |
| Category · worth-claiming | `:94-112` | `Section tone="slate"`; bullet list → `Text` + copper dot | `text-[17px]`→`body-lg` |
| Category · closing CTA | `:114-138` | `Section`; gradient `Card`; `Button size="lg"` (the `px-7 py-4` one-off → `lg`) | The one `text-[15px]` button becomes the real `lg` size |
| About · hero | `about:13-39` | `Section tone="cream"`; `Eyebrow`+`Heading level={1}`+two-col `Grid` of `Text` | `text-4xl md:text-5xl`→`h1` (note: about's H1 was the *smaller* shape — unifying may enlarge it slightly; confirm taste §6) |
| About · pillars | `:41-58,:121-130` | `Section`; `Grid cols={3}` of `Card`+`Eyebrow`+`Text` | `Pillar` local fn → `Card` composition |
| About · the-model | `:60-90` | `Section tone="slate"`; `Grid cols={12}`; `Eyebrow`+`Heading level={2}`+`Text` | None |
| About · closing CTA | `:92-116` | `Section`; gradient `Card`; `Button size="md"` | Copy label "Claim Your Entity" (title-case) vs other "Claim your entity" — **standardize casing** (§6) |
| Contact · hero+form | `contact:8-29` | `Section containerWidth="prose"`; `Eyebrow`+`Heading level={1}`; `Card elevation="card"` wrapping `<ContactForm/>` | `text-5xl md:text-6xl` on a narrow page — confirm `h1` token suits a form page |
| Contact form | `ContactForm.tsx` | `Field` kept; submit → `Button variant="primary" size="md"` (drops `px-7`) + static arrow | Animated-vs-static: form submit currently shows arrow only on idle — keep static |
| Claim · hero+benefits | `claim:41-87` | `Hero`-like `Grid cols={12}`(5/7); `Eyebrow`+`Heading level={1}`+benefits list (`Badge`/icon + `Text`); `Card` wrapping `<ClaimForm/>` | `items` list icons → consistent icon chip; `text-[15px]`→`body-sm` |
| Claim form | `ClaimForm.tsx` | `Field` kept; submit → `Button size="md"` (drops `px-6` fork); success panel → `Card`+`Badge`+`Heading` | None |
| Resources · hero | `resources:70-84` | `Section tone="cream"`; `Eyebrow`+`Heading level={1}`+`Text` | `text-6xl`→`h1` |
| Resources · list | `:86-117` | `Section`; `Grid cols={12}` rows; category chip → `Badge tone=…`; `Heading level={2 or 3}`+`Text` | `categoryStyles` map (§2.7) → `Badge` `tone`; decide H-level for list items (likely `h3`) |
| Resources · CTA | `:119-148` | `Section tone="slate"`; `Card`; `Button size="md"` | None |
| 404 | `not-found.tsx` | `Section containerWidth="prose"`; `Eyebrow`+`Heading level={1}`; `Button variant="primary"` + `Button variant="secondary"` (the inline ghost → real `secondary`) | Defines the `secondary` variant's canonical look |
| `GoldenProfilePreview` | full file | `Card elevation="raised"` + `Stat`×N + `Badge` + `Tabs` (only client primitive) | **Most complex.** Migrate last. Local `Kpi`/`Fact` deleted → `Stat`. Verify motion parity |
| `EntityFinder` | full file | `Card elevation="raised"` + `Stat` + `Badge` + `Button size="sm"`; **drop animated arrow** (`:238`) | Convergence with GoldenProfile removes the lone animated-arrow drift |

---

## 6. Open Decisions for the Operator

These are taste/scope calls a human must make; each blocks a specific section above.

1. **Identity: refine vs evolve.** Plan assumes *refine in place* — keep navy/copper,
   Fraunces, sharp corners, the document feel; only systematize. Confirm the brand is
   frozen and this is purely a systematization (not a visual redesign). If evolution is
   wanted, that is a separate design pass before Phase 0.
2. **Type-scale aggressiveness.** Proposed display top-end is `clamp(…, 4rem)` (=64px,
   matching today's home `text-[64px]`). Acceptable range: hold at 64px (conservative,
   recommended) vs push to 72–80px for more editorial drama. Also: unifying the H1 token
   will **slightly enlarge** about-page's currently-smaller H1 (`text-4xl md:text-5xl`)
   to match the others — confirm that's desired (recommended: yes, consistency wins).
3. **Header CTA.** The header has no nav and no CTA today (`SiteHeader.tsx:6`). Add a
   persistent "Claim your entity" `Button` (and/or nav links)? Affects above-fold
   conversion and the header primitive. (Recommended: add a single `Button size="sm"`.)
4. **Hero CTA.** The home hero's only CTA lives inside the `GoldenProfilePreview` card
   (`:165`); the text column has none. Add an explicit hero `Button` next to the lede, or
   keep the card-as-CTA pattern? (Recommended: add one — the floating column gets a
   purpose and a datum anchor.)
5. **Copy/label casing.** CTAs mix "Claim your entity" and "Claim Your Entity"
   (`GoldenProfilePreview:167` vs `about:109`, `opportunities:57`). Pick one casing
   convention for button labels. (Recommended: sentence case.)
6. **Storybook: no.** Plan recommends skipping Storybook for a 6-page/~10-primitive site
   in favor of a throwaway kitchen-sink page (§3.6). Confirm — or mandate Storybook now
   if `platform-app` is expected to share these primitives soon (then a `packages/ui`
   workspace becomes worth it).
7. **`federalStats()` dead code.** Delete (`lib/opportunities.ts:146`), or wire the
   federal stats into a new home "by the numbers" `Section`? (Recommended: wire it in —
   the data is good and the home page would benefit; otherwise delete.)
8. **Enforcement strictness.** Hard-fail lint on any arbitrary `text-[…]`/`px-[…]`
   (recommended, with `eslint-disable` escape hatch) vs warn-only. Determines whether a
   stray arbitrary value blocks CI.

---

## 7. Success Metrics ("done", measurably)

- **Zero arbitrary type values in JSX.** Repo-wide grep for `text-[…px]`,
  `leading-[…]`, `tracking-[…em]` returns **0** matches in `app/` + `components/`
  (outside `globals.css` token defs). (Baseline today: `text-[13px]`×16, `text-[11px]`×16,
  `text-[10px]`×15, `text-[15px]`×8, `text-[17px]`×3, `text-[64px]`×1, `text-[22px]`×1,
  plus arbitrary `leading-`/`tracking-`.)
- **One `Button` source of truth.** Grep for inline `bg-navy-700 px-` returns **0**
  outside `components/ui/button.tsx`. (Baseline: 11 inline reimplementations in 5
  sizings.)
- **One eyebrow source.** The string `uppercase tracking-[0.18em]` appears only inside
  `components/ui/eyebrow.tsx`. (Baseline: 16 copies of the canonical string, 34
  uppercase-label instances.)
- **One section container.** Grep for `mx-auto max-w-` returns **0** outside
  `components/ui/container.tsx`. (Baseline: 16× `max-w-7xl` + 9 other widths across 8
  files.)
- **Every section composed from primitives.** No page-level file (`app/**/page.tsx`,
  `not-found.tsx`) contains a raw `<section className="…"><div className="mx-auto…">`
  pair; all use `Section`/`Container`/`Grid`/`Hero`.
- **Hero alignment fixed.** Home and `[category]` heroes use `Hero align="datum"`; the
  text-top aligns to the card-top at `lg` (visual check passes; no floating headline).
- **One documented scale.** `globals.css` `@theme` contains the `--text-*` (10 roles),
  spacing, radii, `--shadow-*`, `--z-*`, motion tokens; `docs/ui-inventory.md` lists
  every primitive + variants.
- **Enforcement live.** `pnpm lint` fails on a newly-introduced arbitrary `text-[…px]`;
  CI grep gate fails on a newly-introduced inline CTA.
- **Boundaries preserved.** Exactly one `"use client"` primitive (`tabs.tsx`); `Button`
  and all layout/text primitives are RSC; `next build` (standalone) green; no new
  cross-package import.
- **Green the whole way.** `tsc --noEmit` and `next build` pass after **every** phase
  (the site never goes un-shippable).
