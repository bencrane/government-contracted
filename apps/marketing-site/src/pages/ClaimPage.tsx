import { useSearchParams } from "react-router-dom";
import ClaimForm from "@/components/forms/ClaimForm";
import { usePageTitle } from "@/lib/usePageTitle";
import {
  Section,
  Container,
  Grid,
  Cols,
  Card,
  Eyebrow,
  Heading,
  Text,
  MonoLabel,
} from "@/components/ui";

const items = [
  {
    title: "Your live SAM.gov profile",
    body: "Registration status, expiration, NAICS, set-aside eligibility, exclusion check, lifetime awards, active contracts. Refreshed daily.",
  },
  {
    title: "Registered entities only",
    body: "Government Contracted is for entities with an active SAM.gov registration. We verify against the federal registry before sending your dashboard link.",
  },
  {
    title: "Email tied to events",
    body: "We email when something in your entity shifts: a SAM renewal window opens, a recompete window opens on an agency where you have past performance, a solicitation matches your NAICS, a compliance deadline approaches.",
  },
  {
    title: "Thirty seconds",
    body: "UEI and email is all we need to look you up. The dashboard link lands in your inbox within a few minutes.",
  },
];

export default function ClaimPage() {
  usePageTitle("Claim your entity — Government Contracted");
  const [searchParams] = useSearchParams();
  const uei = searchParams.get("uei") ?? undefined;

  return (
    <Section
      tone="cream"
      spacing="base"
      divide
      bare
      className="relative overflow-hidden"
    >
      <div aria-hidden className="absolute inset-0 paper-grid opacity-50" />

      <Container width="wide" className="relative">
        {/* items-start → the headline column and form share one top datum.
            5/7 form-right is the intentional mirror of the marketing heroes. */}
        <Grid cols={12} gap="lg" align="start">
          <Cols spanLg={5}>
            <Eyebrow>Claim your entity</Eyebrow>
            <Heading level={1} className="mt-4">
              UEI in. Dashboard out.
            </Heading>
            <Text size="body-lg" tone="muted" className="mt-6">
              Enter your UEI and email. We pull your live SAM.gov profile
              and email the dashboard link to you within a few minutes.
            </Text>

            <ul className="mt-12 divide-y divide-line border-t border-line">
              {items.map((r, i) => (
                <li key={r.title} className="flex gap-5 py-5">
                  <MonoLabel as="span" className="mt-1 flex-none text-copper-600">
                    {String(i + 1).padStart(2, "0")}
                  </MonoLabel>
                  <div>
                    <Heading level={4} className="text-navy-900">
                      {r.title}
                    </Heading>
                    <Text size="body-sm" tone="muted" className="mt-1">
                      {r.body}
                    </Text>
                  </div>
                </li>
              ))}
            </ul>
          </Cols>

          <Cols spanLg={7}>
            <Card surface="white" padding="md" elevation="card">
              <ClaimForm defaultUei={uei} />
            </Card>
          </Cols>
        </Grid>
      </Container>
    </Section>
  );
}
