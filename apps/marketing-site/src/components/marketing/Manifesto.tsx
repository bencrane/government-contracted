import { Section, Eyebrow, Heading, Text } from "@/components/ui";

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
          Free for registered contractors. Paid for by the partners — surety
          agents, capital lenders, vendor program operators, equipment
          financiers, compliance and capture consultancies — who want to
          reach contractors at their specific underwriting profile. The
          contractor decides whether to take the conversation. No cold lists,
          no scraped emails, no sold data.
        </Text>
        <Text size="body-lg" tone="muted" className="text-white">
          If you have an active SAM registration, this is for you. Type your
          UEI above. We have your awards.
        </Text>
      </div>
    </Section>
  );
}
