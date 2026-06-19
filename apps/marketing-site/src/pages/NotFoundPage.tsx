import { ArrowRight } from "lucide-react";
import { usePageTitle } from "@/lib/usePageTitle";
import { Section, Container, Button, Eyebrow, Heading, Text } from "@/components/ui";

export default function NotFoundPage() {
  usePageTitle("Not found — Government Contracted");

  return (
    <Section tone="cream" spacing="lg" bare>
      <Container width="prose" className="py-16 text-center md:py-24">
        <Eyebrow>404 / Not found</Eyebrow>
        <Heading level={1} className="mt-4">
          That page isn&apos;t on the docket.
        </Heading>
        <Text tone="muted" className="mt-6">
          The page you&apos;re looking for isn&apos;t here. Back to the front, or claim your entity.
        </Text>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Button to="/" trailingIcon={ArrowRight}>
            Home
          </Button>
          <Button to="/claim" variant="secondary">
            Claim Your Entity
          </Button>
        </div>
      </Container>
    </Section>
  );
}
