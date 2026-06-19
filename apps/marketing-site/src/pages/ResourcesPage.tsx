import { usePageTitle } from "@/lib/usePageTitle";
import {
  Section,
  Container,
  Grid,
  Cols,
  SectionHeader,
  Badge,
  Eyebrow,
  Heading,
  Text,
} from "@/components/ui";
import { CtaClose } from "@/components/marketing/CtaClose";

type Resource = {
  category: "Regulatory" | "Compliance" | "Capture";
  date: string;
  title: string;
  blurb: string;
};

const resources: Resource[] = [
  {
    category: "Regulatory",
    date: "Apr 22, 2026",
    title: "CMMC 2.0 Level 2 enforcement: the assessment timeline that's actually being used",
    blurb:
      "DoD contracts with CDI now require Level 2 third-party assessment. What's accepted today, what's still pending CIO review, and how to time your C3PAO engagement.",
  },
  {
    category: "Compliance",
    date: "Apr 9, 2026",
    title: "SAM renewal traps: the three reasons registrations expire even when you 'renewed'",
    blurb:
      "POC verification, EFT failures, and FAR/DFARS reps & certs lapsing in the middle of a renewal cycle. How to clear all three before the 365-day clock runs out.",
  },
  {
    category: "Capture",
    date: "Mar 28, 2026",
    title: "Reading the agency forecast: which Q3 FY26 forecasts will actually result in solicitations",
    blurb:
      "Forecast accuracy varies wildly by agency. Which forecast formats correlate with on-time solicitation drops, and which are aspirational at best.",
  },
  {
    category: "Regulatory",
    date: "Mar 14, 2026",
    title: "Set-aside size standard revisions: the NAICS codes changing in 2026",
    blurb:
      "SBA's revised receipts-based size standards take effect mid-year. Which NAICS are moving up, which are moving down, and what it does to your competitive set.",
  },
  {
    category: "Compliance",
    date: "Feb 28, 2026",
    title: "CPARS rebuttal window: the 14-day clock and what actually moves a rating",
    blurb:
      "What constitutes a substantive rebuttal vs. one that gets boilerplated back. Examples of language that's resulted in a rating revision in the past year.",
  },
];

const categoryTone: Record<Resource["category"], "navy" | "slate" | "copper"> = {
  Regulatory: "navy",
  Compliance: "slate",
  Capture: "copper",
};

export default function ResourcesPage() {
  usePageTitle("Resources — Government Contracted");

  const [featured, ...rest] = resources;

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
        <Container width="wide" className="relative">
          <SectionHeader
            eyebrow="Resources"
            heading={
              <>
                FAR, compliance, capture —{" "}
                <span className="text-navy-700">in plain English.</span>
              </>
            }
            lede="Federal acquisition updates, compliance deadline reminders, and capture notes for registered contractors. Full write-ups publishing through 2026."
          />
        </Container>
      </Section>

      {/* RESOURCE LIST — cream band */}
      <Section tone="cream" spacing="lg">
        <div className="border-y border-line">
          {/* Featured top row — the focal point */}
          <article className="border-b border-line py-10">
            <Eyebrow>Latest</Eyebrow>
            <Grid cols={12} gap="sm" className="mt-6">
              <Cols spanLg={4}>
                <Badge tone={categoryTone[featured.category]}>
                  {featured.category}
                </Badge>
                <Text size="caption" tone="subtle" className="mt-3">
                  {featured.date}
                </Text>
              </Cols>
              <Cols spanLg={8}>
                <Heading level={2}>{featured.title}</Heading>
                <Text size="body-lg" tone="muted" className="mt-4 max-w-2xl">
                  {featured.blurb}
                </Text>
              </Cols>
            </Grid>
          </article>

          {/* Compact rows */}
          <ul className="divide-y divide-line">
            {rest.map((r) => (
              <li key={r.title} className="py-8">
                <Grid cols={12} gap="sm">
                  <Cols spanLg={4}>
                    <Badge tone={categoryTone[r.category]}>{r.category}</Badge>
                    <Text size="caption" tone="subtle" className="mt-3">
                      {r.date}
                    </Text>
                  </Cols>
                  <Cols spanLg={8}>
                    <Heading level={3}>{r.title}</Heading>
                    <Text size="body-sm" tone="muted" className="mt-3">
                      {r.blurb}
                    </Text>
                  </Cols>
                </Grid>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* COMPLIANCE REMINDERS — navy closing CTA */}
      <CtaClose
        tone="navy"
        eyebrow="Compliance reminders"
        heading="Filing deadlines pegged to your entity."
        lede="SAM renewal, CMMC windows, set-aside recertification, FAR/DFARS reps & certs — set to your specific filing cadence."
        to="/claim"
      />
    </>
  );
}
