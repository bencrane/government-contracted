import { useSearchParams } from "react-router-dom";
import { Activity, BadgeCheck, Clock, Mail } from "lucide-react";
import ClaimForm from "@/components/forms/ClaimForm";
import { usePageTitle } from "@/lib/usePageTitle";
import { Section, Container, Grid, Cols, Card, Eyebrow, Heading, Text } from "@/components/ui";

const items = [
  {
    icon: <Activity className="h-5 w-5" />,
    title: "Your live SAM.gov profile",
    body: "Registration status, expiration, NAICS, set-aside eligibility, exclusion check, lifetime awards, active contracts. Refreshed daily.",
  },
  {
    icon: <BadgeCheck className="h-5 w-5" />,
    title: "Registered entities only",
    body: "Government Contracted is for entities with an active SAM.gov registration. We verify against the federal registry before sending your dashboard link.",
  },
  {
    icon: <Mail className="h-5 w-5" />,
    title: "Email tied to events",
    body: "We email when something in your entity shifts: a SAM renewal window opens, a recompete window opens on an agency where you have past performance, a solicitation matches your NAICS, a compliance deadline approaches.",
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: "Thirty seconds",
    body: "UEI and email is all we need to look you up. The dashboard link lands in your inbox within a few minutes.",
  },
];

export default function ClaimPage() {
  usePageTitle("Claim Your Entity — Government Contracted");
  const [searchParams] = useSearchParams();
  const uei = searchParams.get("uei") ?? undefined;

  return (
    <Section tone="cream" spacing="base" bare className="relative overflow-hidden">
      <div aria-hidden className="absolute inset-0 paper-grid opacity-40" />

      <Container width="wide" className="relative pb-24">
        {/* items-start → the headline column and form share one top datum. */}
        <Grid cols={12} gap="lg" align="start">
          <Cols span={12} spanMd={5}>
            <Eyebrow>Claim Your Entity</Eyebrow>
            <Heading level={1} className="mt-4">
              UEI in. Dashboard out.
            </Heading>
            <Text size="body-lg" tone="muted" className="mt-6">
              Enter your UEI and email. We pull your live SAM.gov profile
              and email the dashboard link to you within a few minutes.
            </Text>

            <ul className="mt-10 space-y-5">
              {items.map((r) => (
                <li key={r.title} className="flex gap-4">
                  <span className="mt-0.5 inline-flex h-9 w-9 flex-none items-center justify-center border border-navy-200 bg-navy-50 text-navy-700">
                    {r.icon}
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-navy-900">
                      {r.title}
                    </p>
                    <Text size="body-sm" tone="muted" className="mt-1">
                      {r.body}
                    </Text>
                  </div>
                </li>
              ))}
            </ul>
          </Cols>

          <Cols span={12} spanMd={7}>
            <Card surface="white" padding="md" elevation="card">
              <ClaimForm defaultUei={uei} />
            </Card>
          </Cols>
        </Grid>
      </Container>
    </Section>
  );
}
