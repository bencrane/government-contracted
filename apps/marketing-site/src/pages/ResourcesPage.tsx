import { ArrowRight, FileText, Calendar, AlertCircle } from "lucide-react";
import { usePageTitle } from "@/lib/usePageTitle";
import {
  Section,
  Container,
  Grid,
  Cols,
  Card,
  Button,
  Badge,
  Eyebrow,
  Heading,
  Text,
} from "@/components/ui";

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

const categoryIcons: Record<Resource["category"], React.ReactNode> = {
  Regulatory: <FileText className="h-3.5 w-3.5" />,
  Compliance: <Calendar className="h-3.5 w-3.5" />,
  Capture: <AlertCircle className="h-3.5 w-3.5" />,
};

export default function ResourcesPage() {
  usePageTitle("Resources — Government Contracted");

  return (
    <>
      {/* HERO — cream band, seal wash */}
      <Section tone="cream" spacing="base" divide bare className="seal-wash">
        <Container width="wide">
          <Eyebrow>Resources</Eyebrow>
          <Heading level={1} className="mt-4">
            FAR, compliance, capture —<br />
            <span className="text-navy-700">in plain English.</span>
          </Heading>
          <Text size="body-lg" tone="muted" className="mt-6 max-w-2xl">
            Federal acquisition updates, compliance deadline reminders, and
            capture notes for registered contractors.
          </Text>
        </Container>
      </Section>

      {/* RESOURCE LIST — cream band */}
      <Section tone="cream" spacing="lg">
        <ul className="divide-y divide-line border-y border-line">
          {resources.map((r) => (
            <li key={r.title} className="py-8">
              <Grid cols={12} gap="sm">
                <Cols span={12} spanMd={3}>
                  <Badge tone={categoryTone[r.category]} icon={categoryIcons[r.category]}>
                    {r.category}
                  </Badge>
                  <Text size="caption" tone="subtle" className="mt-3">
                    {r.date}
                  </Text>
                </Cols>
                <Cols span={12} spanMd={9}>
                  <Heading level={3} className="text-[1.5rem] leading-tight">
                    {r.title}
                  </Heading>
                  <Text size="body-sm" tone="muted" className="mt-3">
                    {r.blurb}
                  </Text>
                  <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-700">
                    Full write-up coming soon
                  </p>
                </Cols>
              </Grid>
            </li>
          ))}
        </ul>
      </Section>

      {/* COMPLIANCE REMINDERS — slate band, navy-tinted card */}
      <Section tone="slate" spacing="base" divide>
        <Card surface="white" padding="md" className="border-navy-200">
          <Grid cols={12} gap="md" align="center">
            <Cols span={12} spanMd={8}>
              <Eyebrow>Compliance reminders</Eyebrow>
              <Heading level={2} className="mt-3 text-[1.5rem] md:text-[1.875rem]">
                Filing deadlines pegged to your entity.
              </Heading>
              <Text size="body" tone="default" className="mt-3">
                SAM renewal, CMMC assessment windows, set-aside
                recertification, FAR/DFARS reps &amp; certs — reminders
                set to your specific filing cadence.
              </Text>
            </Cols>
            <Cols span={12} spanMd={4} className="md:text-right">
              <Button to="/claim" trailingIcon={ArrowRight}>
                Claim Your Entity
              </Button>
            </Cols>
          </Grid>
        </Card>
      </Section>
    </>
  );
}
