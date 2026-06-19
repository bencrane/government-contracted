import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import CategoryGrid from "@/components/marketing/CategoryGrid";
import { CtaClose } from "@/components/marketing/CtaClose";
import { CATEGORIES, federalStats } from "@/lib/opportunities";
import { usePageTitle } from "@/lib/usePageTitle";
import {
  Section,
  Container,
  Grid,
  Card,
  SectionHeader,
  Stat,
  Heading,
  Text,
  MonoLabel,
} from "@/components/ui";

const FEATURED = CATEGORIES.slice(0, 2);

export default function OpportunitiesPage() {
  usePageTitle("Opportunities — Government Contracted");

  const stats = federalStats();

  return (
    <>
      {/* HERO — cream band, seal wash + paper grid */}
      <Section
        tone="cream"
        spacing="base"
        divide
        bare
        className="seal-wash relative overflow-hidden"
      >
        <div aria-hidden className="absolute inset-0 paper-grid opacity-50" />
        <div className="relative">
          <Container width="wide">
            <SectionHeader
              eyebrow="Opportunities"
              heading="What your entity unlocks."
              lede="Six categories. Each one matches against your live SAM.gov profile and your awards history and shows up in your dashboard when it fits."
            />
          </Container>
        </div>
      </Section>

      {/* FEDERAL SCALE — navy stat band (the page's signature anchor) */}
      <Section tone="navy" spacing="lg" divide>
        <div className="mb-12 max-w-2xl">
          <Heading level={2} className="text-white">
            The surface your UEI is matched against.
          </Heading>
          <Text size="body-lg" tone="muted" className="mt-6 max-w-2xl">
            The federal market is enormous and most of it never reaches the
            contractors it fits. The dashboard narrows it to your profile.
          </Text>
        </div>

        <Grid cols={3} gap="px" as="ol" className="border border-line bg-line">
          <Card as="li" surface="white" padding="none" className="border-0">
            <Stat
              className="px-7 py-7 md:px-8 md:py-8"
              label="Registered entities"
              value={stats.registeredEntities}
              sub={`${stats.registeredEntitiesFull} active in SAM.gov`}
            />
          </Card>
          <Card as="li" surface="white" padding="none" className="border-0">
            <Stat
              className="px-7 py-7 md:px-8 md:py-8"
              label="Annual obligations"
              value={stats.annualObligations}
              accent
              sub="federal contract dollars / year"
            />
          </Card>
          <Card as="li" surface="white" padding="none" className="border-0">
            <Stat
              className="px-7 py-7 md:px-8 md:py-8"
              label="Active solicitations"
              value={stats.activeSolicitationsToday}
              sub="open on SAM.gov today"
            />
          </Card>
        </Grid>
      </Section>

      {/* CATEGORY LEDGER — cream band, the detailed hub */}
      <Section tone="cream" spacing="lg" divide>
        <div className="mb-12 max-w-2xl">
          <Heading level={2}>The six categories, in detail.</Heading>
          <Text size="body-lg" tone="muted" className="mt-6 max-w-2xl">
            Every category matches against your live entity profile. The two that
            move the most money lead; the rest run as a compact ledger below.
          </Text>
        </div>

        {/* Featured top row — the two highest-value categories */}
        <Grid cols={2} gap="px" as="ol" className="mb-12 border border-line bg-line">
          {FEATURED.map((c, i) => (
            <Card
              as="li"
              key={c.slug}
              surface="white"
              padding="none"
              className="border-0"
            >
              <Link
                to={`/opportunities/${c.slug}`}
                className="group block h-full p-7 transition-colors hover:bg-navy-50/30 md:p-8"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <MonoLabel as="span" className="text-copper-600">
                    {String(i + 1).padStart(2, "0")}
                  </MonoLabel>
                  <ArrowUpRight className="h-5 w-5 text-copper-600 group-hover:text-copper-700" />
                </div>
                <Heading level={3} className="mt-5">
                  {c.title}
                </Heading>
                <Text size="body-sm" tone="muted" className="mt-3">
                  {c.blurb}
                </Text>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <MonoLabel as="span" className="text-slate-500">
                    {c.whatYouGet.length} included
                  </MonoLabel>
                  {c.goodIf.slice(0, 2).map((g) => (
                    <span
                      key={g}
                      className="border border-line px-2 py-1 text-caption text-slate-600"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </Link>
            </Card>
          ))}
        </Grid>

        {/* Demoted rest — compact hairline ledger; the two featured above are
            skipped so categories render once, numbered continuously 03–06. */}
        <CategoryGrid variant="hub" start={2} />
      </Section>

      {/* CLAIM FIRST — slate close */}
      <CtaClose
        tone="slate"
        eyebrow="Claim first"
        heading="These match against your live entity profile."
        lede="Claim your UEI, get your dashboard link, and see opportunities that fit your NAICS, set-aside, and agency mix."
        to="/claim"
      />
    </>
  );
}
