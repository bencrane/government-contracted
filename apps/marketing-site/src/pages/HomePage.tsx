import { type ElementType } from "react";
import { ArrowRight } from "lucide-react";
import GoldenProfilePreview from "@/components/marketing/GoldenProfilePreview";
import CategoryGrid from "@/components/marketing/CategoryGrid";
import Manifesto from "@/components/marketing/Manifesto";
import { usePageTitle } from "@/lib/usePageTitle";
import {
  Section,
  Hero,
  Grid,
  Card,
  Button,
  Heading,
  Text,
  MonoLabel,
  SectionHeader,
} from "@/components/ui";

const STEPS = [
  {
    step: "01",
    title: "Claim your entity",
    body: "UEI and email. 30 seconds. We send a private dashboard link to the address you give us.",
  },
  {
    step: "02",
    title: "Your live profile lands in your dashboard",
    body: "SAM registration, NAICS, addresses, expiration, exclusion check, lifetime awards, active contracts, agency mix. Refreshed against SAM.gov + USAspending every 24 hours.",
  },
  {
    step: "03",
    title: "Opportunities match against your profile",
    body: "Solicitations match your NAICS and set-aside. Surety and capital quotes route to providers that write contractors like you. Compliance reminders track your actual filing cadence.",
  },
];

function StepCard({
  step,
  title,
  body,
  as = "li",
}: {
  step: string;
  title: string;
  body: string;
  as?: ElementType;
}) {
  return (
    <Card as={as} surface="white" padding="none" className="border-0 p-7 md:p-8">
      {/* Body is pinned to slate-600 — NOT the navy band's muted ramp
          (text-slate-300, invisible on these white cards). */}
      <MonoLabel
        as="p"
        className="font-display text-h3 not-italic tracking-tight text-copper-600"
      >
        {step}
      </MonoLabel>
      <div className="mt-5">
        <Heading level={3} className="text-navy-900">
          {title}
        </Heading>
        <Text size="body-sm" className="mt-3 text-slate-600">
          {body}
        </Text>
      </div>
    </Card>
  );
}

export default function HomePage() {
  usePageTitle("Government Contracted — The Dashboard for Federal Contractors");

  return (
    <>
      {/* HERO — cream band; Hero primitive shares the text-top / card-top datum */}
      <Section tone="cream" spacing="base" divide bare className="seal-wash overflow-hidden">
        <div aria-hidden className="absolute inset-0 paper-grid opacity-50" />
        <div className="relative">
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
              <>
                <Text size="body-sm" tone="muted" className="max-w-xl">
                  Thirty seconds — UEI and email. Your registration and award
                  history already exist on SAM.gov and USAspending.gov, scattered
                  across millions of public filings. Claiming consolidates them
                  into one profile.
                </Text>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Button to="/claim" size="lg" trailingIcon={ArrowRight}>
                    Claim your entity
                  </Button>
                  <Button to="/opportunities" variant="ghost" size="lg">
                    See what it unlocks
                  </Button>
                </div>
                <MonoLabel as="p" className="mt-6 text-slate-500">
                  1.7M registered entities · contract actions indexed since FY08
                </MonoLabel>
              </>
            }
            media={<GoldenProfilePreview />}
            ratio="7/5"
          />
        </div>
      </Section>

      {/* HOW IT WORKS — navy band */}
      <Section tone="navy" spacing="lg" divide>
        <SectionHeader
          eyebrow="How it works"
          heading="From UEI to a live dashboard in about thirty seconds."
        />

        <Grid cols={3} gap="px" as="ol" align="stretch" className="border border-line bg-line">
          {STEPS.map((s) => (
            <StepCard key={s.step} {...s} />
          ))}
        </Grid>
      </Section>

      {/* WHAT'S INSIDE — cream band; tighter teaser, not equal-weight to How it works */}
      <Section id="whats-inside" tone="cream" spacing="lg" divide>
        <SectionHeader
          eyebrow="What's inside"
          heading="Solicitations to surety to capital — pegged to your UEI, in one place."
          lede="Each category matches against your live SAM.gov profile and your awards history. The same UEI that unlocked your dashboard is what brokers, lenders, and consultancies see when they reach out."
        />

        <CategoryGrid />

        <div className="mt-8">
          <Button to="/opportunities" variant="ghost" size="md" trailingIcon={ArrowRight}>
            All six categories
          </Button>
        </div>
      </Section>

      {/* MANIFESTO — navy band; its final line is the CTA */}
      <Manifesto />
    </>
  );
}
