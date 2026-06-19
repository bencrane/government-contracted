import GoldenProfilePreview from "@/components/marketing/GoldenProfilePreview";
import CategoryGrid from "@/components/marketing/CategoryGrid";
import Manifesto from "@/components/marketing/Manifesto";
import { usePageTitle } from "@/lib/usePageTitle";
import { Section, Hero, Grid, Card, Eyebrow, Heading, Text, MonoLabel } from "@/components/ui";

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

export default function HomePage() {
  usePageTitle("Government Contracted — The Dashboard for Federal Contractors");

  return (
    <>
      {/* HERO — cream band; Hero primitive shares the text-top / card-top datum */}
      <Section tone="cream" spacing="base" divide bare className="seal-wash overflow-hidden">
        <div aria-hidden className="absolute inset-0 paper-grid opacity-60" />
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
            footnote="Free for registered contractors · sourced from SAM.gov + USAspending.gov."
            media={<GoldenProfilePreview />}
            ratio="6/6"
          />
        </div>
      </Section>

      {/* HOW IT WORKS — navy band */}
      <Section tone="navy" spacing="lg" divide>
        <div className="mb-14 max-w-3xl">
          <Eyebrow>How it works</Eyebrow>
          <Heading level={2} className="mt-4 text-white">
            From UEI to a live dashboard in about thirty seconds.
          </Heading>
        </div>

        <Grid cols={3} gap="px" as="ol" className="border border-line bg-line">
          {STEPS.map((s) => (
            <Card key={s.step} as="li" surface="white" padding="sm" className="border-0 md:p-10">
              <MonoLabel as="p" className="text-copper-600">
                Step {s.step}
              </MonoLabel>
              <Heading level={3} className="mt-5">
                {s.title}
              </Heading>
              <Text size="body-sm" tone="muted" className="mt-3">
                {s.body}
              </Text>
            </Card>
          ))}
        </Grid>
      </Section>

      {/* WHAT'S INSIDE — cream band */}
      <Section id="whats-inside" tone="cream" spacing="lg" divide>
        <div className="mb-10 max-w-3xl">
          <Eyebrow>What&apos;s inside</Eyebrow>
          <Heading level={2} className="mt-4">
            Solicitations to surety to capital — pegged to your UEI, in one place.
          </Heading>
          <Text size="body-lg" tone="muted" className="mt-5">
            Each category matches against your live SAM.gov profile and your awards
            history. The same UEI that unlocked your dashboard is what brokers,
            lenders, and consultancies see when they reach out.
          </Text>
        </div>

        <CategoryGrid />
      </Section>

      {/* MANIFESTO — navy band; its final line is the CTA */}
      <Manifesto />
    </>
  );
}
