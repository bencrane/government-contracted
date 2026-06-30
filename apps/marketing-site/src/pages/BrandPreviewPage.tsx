/* KITCHEN-SINK — every design-system primitive × every variant at the
   "Refined Federal" spec, on one page, for review. Route kept at /brand-preview.
   Composes only from @/components/ui (plus GoldenProfilePreview, the showcase). */

import { ArrowRight, ArrowUpRight, CalendarClock, Landmark } from "lucide-react";
import { usePageTitle } from "@/lib/usePageTitle";
import { useNoindex } from "@/lib/useNoindex";
import GoldenProfilePreview from "@/components/marketing/GoldenProfilePreview";
import {
  Section,
  Container,
  Grid,
  Cols,
  Hero,
  Button,
  Card,
  Eyebrow,
  MonoLabel,
  Heading,
  Text,
  Badge,
  Stat,
  Tabs,
} from "@/components/ui";

export default function BrandPreviewPage() {
  usePageTitle("Kitchen sink — Government Contracted");
  useNoindex();

  return (
    <>
      {/* ── Banner ─────────────────────────────────────────────────────── */}
      <Section tone="cream" spacing="sm" divide>
        <Eyebrow>Design system · Refined Federal</Eyebrow>
        <Heading level={1} display className="mt-4">
          Primitive kitchen sink
        </Heading>
        <Text size="body-lg" tone="muted" className="mt-5 max-w-2xl">
          Every primitive and every variant, rendered on one page for review. Navy
          ink, copper accent, Fraunces display, sharp corners, hairline rules.
        </Text>
      </Section>

      {/* ── Type scale ─────────────────────────────────────────────────── */}
      <Block label="Heading · type scale">
        <div className="space-y-4">
          <Heading level={1} display>Display — Your entity. Your awards.</Heading>
          <Heading level={1}>H1 — Your entity. Your awards.</Heading>
          <Heading level={2}>H2 — From UEI to a live dashboard.</Heading>
          <Heading level={3}>H3 — Commercial &amp; institutional building.</Heading>
        </div>
        <div className="mt-8 space-y-3 border-t border-line pt-8">
          <Text size="body-lg">Body-lg — the hero lede measure, 18px, generous leading.</Text>
          <Text size="body">Body — default prose, 16px.</Text>
          <Text size="body-sm">Body-sm — secondary descriptions, 15px.</Text>
          <Text size="caption">Caption — small meta, 13px.</Text>
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <Eyebrow>Eyebrow · copper kicker</Eyebrow>
            <MonoLabel>Mono label · micro</MonoLabel>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-8 border-t border-line pt-6">
          <Text tone="default">Tone default</Text>
          <Text tone="muted">Tone muted</Text>
          <Text tone="subtle">Tone subtle</Text>
        </div>
      </Block>

      {/* ── Buttons ────────────────────────────────────────────────────── */}
      <Block label="Button · variant × size">
        <div className="space-y-6">
          {(["primary", "secondary", "ghost"] as const).map((variant) => (
            <div key={variant} className="flex flex-wrap items-center gap-4">
              <MonoLabel as="span" className="w-24">{variant}</MonoLabel>
              <Button variant={variant} size="sm" type="button" trailingIcon={ArrowRight}>Small</Button>
              <Button variant={variant} size="md" type="button" trailingIcon={ArrowRight}>Medium</Button>
              <Button variant={variant} size="lg" type="button" trailingIcon={ArrowRight}>Large</Button>
            </div>
          ))}
          <div className="border-t border-line pt-6">
            <MonoLabel as="p" className="mb-3">Full width · link · disabled</MonoLabel>
            <div className="grid max-w-md gap-3">
              <Button to="/claim" fullWidth trailingIcon={ArrowRight}>Full-width link (react-router)</Button>
              <Button variant="secondary" fullWidth type="button">Full-width secondary</Button>
              <Button variant="primary" type="button" disabled>Disabled</Button>
            </div>
          </div>
        </div>
      </Block>

      {/* ── Badges ─────────────────────────────────────────────────────── */}
      <Block label="Badge">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="success" dot>SAM Active</Badge>
          <Badge tone="copper">SDVOSB</Badge>
          <Badge tone="copper">HUBZone</Badge>
          <Badge tone="navy">8(a)</Badge>
          <Badge tone="slate">WOSB</Badge>
          <Badge tone="success" icon={<Landmark className="h-3 w-3" />}>With icon</Badge>
        </div>
      </Block>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <Block label="Stat · KPI + fact">
        <Card elevation="card">
          <div className="grid grid-cols-3 divide-x divide-line">
            <Stat label="Lifetime awards" value="$24.6M" />
            <Stat label="Active value" value="$8.9M" accent />
            <Stat label="Awards" value="31" sub="9 active" />
          </div>
          <div className="grid grid-cols-2 gap-px border-t border-line bg-line">
            <Stat
              size="fact"
              className="bg-surface px-6"
              icon={<CalendarClock className="h-3.5 w-3.5" />}
              label="SAM expires"
              value="Feb 28, 2027"
              sub="in 255 days"
            />
            <Stat
              size="fact"
              className="bg-surface px-6"
              icon={<CalendarClock className="h-3.5 w-3.5" />}
              label="Registered"
              value="12 yrs"
              sub="since Jun 2014"
            />
          </div>
        </Card>
      </Block>

      {/* ── Cards ──────────────────────────────────────────────────────── */}
      <Block label="Card · elevation × surface × padding">
        <Grid cols={3} gap="md">
          <Card elevation="none" surface="white" padding="md">
            <Heading level={3}>Elevation none</Heading>
            <Text size="body-sm" tone="muted" className="mt-2">Hairline border, white surface.</Text>
          </Card>
          <Card elevation="card" surface="white" padding="md">
            <Heading level={3}>Elevation card</Heading>
            <Text size="body-sm" tone="muted" className="mt-2">Single drop shadow.</Text>
          </Card>
          <Card elevation="raised" surface="muted" padding="md">
            <Heading level={3}>Raised · muted</Heading>
            <Text size="body-sm" tone="muted" className="mt-2">Two-layer shadow, slate-50.</Text>
          </Card>
        </Grid>
      </Block>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <Block label="Tabs · the only animated primitive (copper underline, fixed-height pane)">
        <Card elevation="card" className="max-w-md">
          <Tabs
            ariaLabel="Kitchen-sink tabs"
            panelHeight={140}
            items={[
              {
                id: "one",
                label: "Overview",
                panel: (
                  <div className="px-6 py-5">
                    <Text size="body-sm" tone="muted">
                      Animated copper underline via layoutId; panels cross-fade with
                      the brand easing. Height is fixed so the card never reflows.
                    </Text>
                  </div>
                ),
              },
              {
                id: "two",
                label: "Detail",
                panel: (
                  <div className="px-6 py-5">
                    <Badge tone="success" dot>Pane two</Badge>
                  </div>
                ),
              },
              {
                id: "three",
                label: "More",
                panel: (
                  <div className="px-6 py-5">
                    <MonoLabel>Pane three</MonoLabel>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </Block>

      {/* ── Grid ───────────────────────────────────────────────────────── */}
      <Block label="Grid · 12-col + Cols span">
        <Grid cols={12} gap="sm">
          <Cols span={12} spanMd={6} className="bg-slate-50 p-4">
            <MonoLabel>span 12 · md 6</MonoLabel>
          </Cols>
          <Cols span={6} spanMd={3} className="bg-slate-50 p-4">
            <MonoLabel>6 · 3</MonoLabel>
          </Cols>
          <Cols span={6} spanMd={3} className="bg-slate-50 p-4">
            <MonoLabel>6 · 3</MonoLabel>
          </Cols>
        </Grid>
      </Block>

      {/* ── Section tones ──────────────────────────────────────────────── */}
      <Block label="Section · tone bands (eyebrow + text recolor from context)">
        <Text size="body-sm" tone="muted">
          The three bands below set tone; eyebrow + body text recolor automatically.
        </Text>
      </Block>
      <Section tone="cream" spacing="sm" divide>
        <Eyebrow>Cream band</Eyebrow>
        <Text size="body" className="mt-2">Copper-600 eyebrow, warm-slate body.</Text>
      </Section>
      <Section tone="slate" spacing="sm" divide>
        <Eyebrow>Slate band</Eyebrow>
        <Text size="body" className="mt-2">Copper-600 eyebrow on slate-100.</Text>
      </Section>
      <Section tone="navy" spacing="sm" divide>
        <Eyebrow>Navy band</Eyebrow>
        <Text size="body" className="mt-2">Copper-300 eyebrow, light-slate body — flipped from context.</Text>
      </Section>

      {/* ── Hero (datum alignment) ─────────────────────────────────────── */}
      <Section tone="cream" spacing="base" divide bare>
        <Container width="wide" className="pb-4">
          <MonoLabel>Hero · datum-aligned (text-top ↔ media-top)</MonoLabel>
        </Container>
        <Hero
          eyebrow="For registered federal contractors"
          heading={
            <>
              Your entity.<br />
              <span className="text-navy-700">Your awards.</span><br />
              One dashboard.
            </>
          }
          lede="Live SAM.gov profile, every federal contract action since FY08 — pegged to your UEI."
          media={<GoldenProfilePreview />}
          ratio="6/6"
        />
      </Section>

      <Section tone="cream" spacing="base">
        <Container width="wide" className="flex items-center gap-3">
          <ArrowUpRight className="h-4 w-4 text-copper-600" />
          <Text size="caption" tone="subtle">End of kitchen sink.</Text>
        </Container>
      </Section>
    </>
  );
}

/* A labelled review block — cream band + a mono caption above the content. */
function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Section tone="cream" spacing="sm" divide>
      <MonoLabel as="p" className="mb-6 text-copper-600">{label}</MonoLabel>
      {children}
    </Section>
  );
}
