import { ArrowRight } from "lucide-react";
import { usePageTitle } from "@/lib/usePageTitle";
import {
  Section,
  Container,
  Grid,
  Cols,
  Card,
  Button,
  Eyebrow,
  Heading,
  Text,
} from "@/components/ui";

export default function AboutPage() {
  usePageTitle("About — Government Contracted");

  return (
    <>
      {/* HERO — cream band, seal wash + paper grid */}
      <Section tone="cream" spacing="base" divide bare className="seal-wash relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 paper-grid opacity-40" />
        <Container width="content" className="relative">
          <Eyebrow>About</Eyebrow>
          <Heading level={1} className="mt-4">
            Built for registered federal contractors.
          </Heading>

          <Grid cols={2} gap="md" className="mt-8">
            <Text size="body" tone="default">
              Government Contracted is a dashboard built on the SAM.gov
              entity registry and the USAspending awards corpus. We index
              every active US contractor every day, and every federal
              contract action back to FY2008.
            </Text>
            <Text size="body" tone="default">
              When something in your entity changes — a SAM renewal window
              opens, an award gets obligated, a recompete window opens on
              your incumbent contract, an exclusion appears in your sub
              chain — it shows up in your dashboard.
            </Text>
          </Grid>
        </Container>
      </Section>

      {/* THREE PILLARS — cream band, hairline grid */}
      <Section tone="cream" spacing="lg" divide>
        <Grid cols={3} gap="px" className="border border-line bg-line">
          <Pillar
            eyebrow="Federal data, daily"
            body="SAM.gov publishes daily entity updates: registration status, NAICS, set-aside eligibility, expirations, exclusions. USAspending publishes every federal contract action. We ingest both every 24 hours and join them by UEI."
          />
          <Pillar
            eyebrow="Matched to your entity"
            body="Solicitations match your NAICS and set-aside. Surety and capital quotes route to providers that write contractors at your bonding capacity and your agency mix. Compliance reminders track your specific filing cadence."
          />
          <Pillar
            eyebrow="Yours to leave"
            body="One-click account deletion removes your profile and history. Your UEI stays public information (it always was). Nothing we built around it stays."
          />
        </Grid>
      </Section>

      {/* THE MODEL — slate band */}
      <Section tone="slate" spacing="lg" divide>
        <Grid cols={12} gap="lg" className="md:gap-14">
          <Cols span={12} spanMd={4}>
            <Eyebrow>The model</Eyebrow>
            <Heading level={2} className="mt-3">
              Free for federal contractors.
            </Heading>
          </Cols>
          <Cols span={12} spanMd={8} className="space-y-4">
            <Text size="body" tone="default">
              Government Contracted stays free for registered entities.
              The site is paid for by the providers that show up in your
              dashboard when they fit your profile — surety agents,
              capital lenders, vendor program operators, equipment
              financiers, compliance and capture consultancies. They get
              access to engaged contractor traffic with verified entity
              and awards data. You decide whether to take the
              conversation.
            </Text>
            <Text size="body" tone="default">
              Independent operation. The SAM.gov registry and the
              USAspending corpus are public federal data; we index them
              and put them to work in your dashboard.
            </Text>
          </Cols>
        </Grid>
      </Section>

      {/* CTA — cream band, navy-tinted card */}
      <Section tone="cream" spacing="lg">
        <Card
          surface="white"
          padding="md"
          className="border-navy-200 bg-gradient-to-br from-navy-50 via-slate-50 to-slate-50 md:p-14"
        >
          <Grid cols={12} gap="md" align="center">
            <Cols span={12} spanMd={8}>
              <Heading level={2}>Claim your entity.</Heading>
              <Text size="body" tone="default" className="mt-3 max-w-xl">
                UEI and email. Dashboard link in your inbox.
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

function Pillar({ eyebrow, body }: { eyebrow: string; body: string }) {
  return (
    <Card surface="white" padding="sm" className="border-0 md:p-8">
      <Eyebrow>{eyebrow}</Eyebrow>
      <Text size="body-sm" tone="muted" className="mt-4">
        {body}
      </Text>
    </Card>
  );
}
