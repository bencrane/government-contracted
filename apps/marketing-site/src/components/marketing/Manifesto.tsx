import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Section, Eyebrow, Heading, Text, Button } from "@/components/ui";

export default function Manifesto() {
  return (
    <Section tone="navy" spacing="lg" divide containerWidth="prose">
      <Eyebrow as="p" className="font-mono">
        Why this exists
      </Eyebrow>
      <Heading level={2} className="mt-5 text-white">
        Every federal dollar is public. We built the infrastructure to actually
        use it.
      </Heading>

      <div className="copper-rule mt-12" />

      <div className="mt-12 space-y-6">
        <Text size="body-lg" tone="muted">
          Every federal dollar is public, but the systems housing them are
          deeply fragmented. A registered contractor spends hours a week
          navigating SAM.gov, tracking solicitations, and proving past
          performance across isolated government databases. The friction is
          simply the time it takes to assemble a baseline operational picture.
        </Text>
        <Text size="body-lg" tone="muted">
          We built this infrastructure to eliminate that fragmentation.{" "}
          <span className="text-white">USAspending</span> publishes the contract
          actions. <span className="text-white">SAM.gov</span> manages entity
          registrations, NAICS codes, and expirations. We ingest these disparate
          datasets, join them strictly on your UEI, and render them into a
          single, unified surface. Nothing here is proprietary or scraped; it is
          public data organized for immediate, practical utility.
        </Text>
        <Text size="body-lg" tone="muted">
          Processing this volume of federal award data provides a clear view of
          the broader government market. Because of this visibility, we maintain
          active relationships with the specialized surety, capital, and
          equipment networks that service the industry. If you would like to
          access these operational resources to execute your awards, you can{" "}
          <Link
            to="/contact"
            className="text-white underline underline-offset-4 hover:text-copper-300"
          >
            contact us
          </Link>{" "}
          to be considered for an introduction to our vetted partners.
        </Text>
      </div>

      <div className="mt-10">
        <Button size="lg" to="/claim" trailingIcon={ArrowRight}>
          Claim your entity
        </Button>
      </div>
    </Section>
  );
}
