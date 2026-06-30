import { usePageTitle } from "@/lib/usePageTitle";
import { CtaClose } from "@/components/marketing/CtaClose";
import {
  Section,
  Container,
  Grid,
  Card,
  Eyebrow,
  Heading,
  Text,
  MonoLabel,
  SectionHeader,
} from "@/components/ui";

const PILLARS = [
  {
    index: "01",
    eyebrow: "Federal data, daily",
    title: "Two public corpora, joined by UEI.",
    body: "SAM.gov publishes daily entity updates: registration status, NAICS, set-aside eligibility, expirations, exclusions. USAspending publishes every federal contract action. We ingest both every 24 hours and join them by UEI.",
  },
  {
    index: "02",
    eyebrow: "Matched to your entity",
    title: "Routed to your profile, not a list.",
    body: "Solicitations match your NAICS and set-aside. Surety and capital quotes route to providers that write contractors at your bonding capacity and your agency mix. Compliance reminders track your specific filing cadence.",
  },
  {
    index: "03",
    eyebrow: "Yours to leave",
    title: "One click, and it's gone.",
    body: "One-click account deletion removes your profile and history — no email, no waiting period. Your UEI stays public information; it always was, and we never owned it. Nothing we built around it stays. You can re-claim the same entity any time and start clean.",
  },
];

const HERO_FACTS = [
  { value: "Daily", label: "Entities indexed" },
  { value: "FY2008", label: "Contract actions since" },
  { value: "24h", label: "Refresh cadence" },
];

export default function AboutPage() {
  usePageTitle("About — Government Contracted");

  return (
    <>
      {/* HERO — cream band, seal wash + paper grid */}
      <Section tone="cream" spacing="base" divide bare className="seal-wash relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 paper-grid opacity-50" />
        <Container width="wide" className="relative">
          <Eyebrow>About</Eyebrow>
          <Heading level={1} className="mt-4">
            Built for registered federal contractors.
          </Heading>
          <Text size="body-lg" tone="muted" className="mt-6 max-w-2xl">
            Government Contracted is a dashboard built on the SAM.gov entity
            registry and the USAspending awards corpus. We index every active
            US contractor every day, and every federal contract action back to
            FY2008 — so when something in your entity changes, it shows up in
            your dashboard.
          </Text>

          <dl className="mt-8 flex flex-col gap-px border border-line bg-line sm:flex-row">
            {HERO_FACTS.map((f) => (
              <div key={f.label} className="flex-1 bg-surface px-6 py-5">
                <dt>
                  <MonoLabel as="span" className="text-copper-600">
                    {f.label}
                  </MonoLabel>
                </dt>
                <dd className="mt-2">
                  <Heading level={4} as="span" className="text-navy-900 tabular-nums">
                    {f.value}
                  </Heading>
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      {/* THREE PILLARS — cream band, hairline grid; three equal cells. */}
      <Section tone="cream" spacing="lg" divide>
        <Grid cols={3} gap="px" as="ol" align="stretch" className="border border-line bg-line">
          {PILLARS.map((p) => (
            <Pillar key={p.index} {...p} />
          ))}
        </Grid>
      </Section>

      {/* THE MODEL — slate band */}
      <Section tone="slate" spacing="lg" divide>
        <SectionHeader
          align="rail"
          eyebrow="The model"
          heading="Free for federal contractors."
        >
          <div className="space-y-4">
            <Text size="body" tone="default">
              Government Contracted stays free for registered entities. The
              site is paid for by the providers that show up in your dashboard
              when they fit your profile — surety agents, capital lenders,
              vendor program operators, equipment financiers, compliance and
              capture consultancies. They get access to engaged contractor
              traffic with verified entity and awards data. You decide whether
              to take the conversation.
            </Text>
            <Text size="body" tone="default">
              Independent operation. The SAM.gov registry and the USAspending
              corpus are public federal data; we index them and put them to
              work in your dashboard.
            </Text>
          </div>
        </SectionHeader>
      </Section>

      {/* CTA — navy close */}
      <CtaClose
        tone="navy"
        heading="Claim your entity."
        lede="UEI and email. Dashboard link in your inbox."
        to="/claim"
      />
    </>
  );
}

function Pillar({
  index,
  eyebrow,
  title,
  body,
}: {
  index: string;
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <Card as="li" surface="white" padding="sm" className="border-0 md:p-8">
      <div className="flex items-baseline gap-3">
        <MonoLabel as="span" className="text-copper-600">
          {index}
        </MonoLabel>
        <Eyebrow as="span">{eyebrow}</Eyebrow>
      </div>
      <Heading level={3} className="mt-5">
        {title}
      </Heading>
      <Text size="body-sm" tone="muted" className="mt-3">
        {body}
      </Text>
    </Card>
  );
}
