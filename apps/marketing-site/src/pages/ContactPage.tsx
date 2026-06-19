import ContactForm from "@/components/forms/ContactForm";
import { usePageTitle } from "@/lib/usePageTitle";
import { Section, Container, Card, Eyebrow, Heading, Text } from "@/components/ui";

export default function ContactPage() {
  usePageTitle("Contact — Government Contracted");

  return (
    <Section tone="cream" spacing="base" bare className="relative overflow-hidden">
      <div aria-hidden className="absolute inset-0 paper-grid opacity-30" />

      <Container width="prose" className="relative pb-24">
        <Eyebrow>Contact</Eyebrow>
        <Heading level={1} className="mt-3">
          Get in touch.
        </Heading>
        <Text tone="default" className="mt-5">
          Two business days to respond.
        </Text>

        <Card surface="white" padding="md" elevation="card" className="mt-10">
          <ContactForm />
        </Card>
      </Container>
    </Section>
  );
}
