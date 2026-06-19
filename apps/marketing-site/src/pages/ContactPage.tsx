import ContactForm from "@/components/forms/ContactForm";
import { usePageTitle } from "@/lib/usePageTitle";
import { Section, Container, Grid, Cols, Card, Eyebrow, Heading, Text, MonoLabel } from "@/components/ui";

const details = [
  {
    label: "What to include",
    body: "Your legal business name and SAM.gov UEI if you have one — it lets us pull your live entity profile before we reply.",
  },
  {
    label: "Response time",
    body: "Two business days to respond. Compliance and registration questions are routed first.",
  },
  {
    label: "Already registered?",
    body: "Skip the form — claim your entity and the dashboard link lands in your inbox within a few minutes.",
  },
];

export default function ContactPage() {
  usePageTitle("Contact — Government Contracted");

  return (
    <Section tone="cream" spacing="base" divide bare className="relative overflow-hidden">
      <div aria-hidden className="absolute inset-0 paper-grid opacity-50" />

      <Container width="wide" className="relative">
        {/* items-start → the left rail and form share one top datum. */}
        <Grid cols={12} gap="lg" align="start">
          <Cols spanLg={5}>
            <Eyebrow>Contact</Eyebrow>
            <Heading level={1} className="mt-4">
              Get in touch.
            </Heading>
            <Text size="body-lg" tone="muted" className="mt-6">
              Questions about registration, compliance, or what your entity
              unlocks — send a note and we'll get back to you.
            </Text>

            <dl className="mt-10 space-y-6 border-t border-line pt-8">
              {details.map((d) => (
                <div key={d.label}>
                  <MonoLabel as="span" className="text-copper-600">
                    {d.label}
                  </MonoLabel>
                  <Text size="body-sm" tone="muted" className="mt-2">
                    {d.body}
                  </Text>
                </div>
              ))}
            </dl>
          </Cols>

          <Cols spanLg={7}>
            <Card surface="white" padding="md" elevation="card">
              <ContactForm />
            </Card>
          </Cols>
        </Grid>
      </Container>
    </Section>
  );
}
