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
        Every federal dollar is public. The work is assembling them into one
        surface a contractor can actually use.
      </Heading>

      <div className="copper-rule mt-12" />

      <div className="mt-12 space-y-6">
        <Text size="body-lg" tone="muted">
          A registered contractor spends thirty minutes a week in SAM.gov,
          an hour on the phone with their surety agent, a half-day chasing a
          solicitation in beta.SAM, and another two days tracking down the
          right capital partner. The data is all public. The friction is the
          product.
        </Text>
        <Text size="body-lg" tone="muted">
          <span className="text-white">USAspending</span> publishes every contract
          action. <span className="text-white">SAM.gov</span> publishes every entity
          registration, NAICS, set-aside designation, and expiration.{" "}
          <span className="text-white">CPARS</span> publishes every past-performance
          rating. <span className="text-white">SAM exclusions</span> publishes every
          debarment. Nothing here is proprietary or scraped. We index it,
          join it on UEI, and put it where contractors actually look:
          one dashboard.
        </Text>
        <Text size="body-lg" tone="muted">
          Free for registered contractors, paid for by{" "}
          <Link
            to="/about"
            className="text-white underline underline-offset-4 hover:text-copper-300"
          >
            the partners
          </Link>{" "}
          who fit your profile.
        </Text>
        <Text size="body-lg" tone="muted" className="text-white">
          If you have an active SAM registration, this is for you.
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
