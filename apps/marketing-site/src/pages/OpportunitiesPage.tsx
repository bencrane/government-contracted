import { ArrowRight } from "lucide-react";
import CategoryGrid from "@/components/marketing/CategoryGrid";
import { usePageTitle } from "@/lib/usePageTitle";
import { Section, Container, Grid, Cols, Button, Eyebrow, Heading, Text } from "@/components/ui";

export default function OpportunitiesPage() {
  usePageTitle("Opportunities — Government Contracted");

  return (
    <>
      {/* HERO — cream band, seal wash */}
      <Section tone="cream" spacing="base" divide bare className="seal-wash">
        <Container width="wide">
          <Eyebrow>Opportunities</Eyebrow>
          <Heading level={1} className="mt-4">
            What your entity unlocks.
          </Heading>
          <Text size="body-lg" tone="muted" className="mt-6 max-w-2xl">
            Six categories. Each one matches against your live SAM.gov
            profile and your awards history and shows up in your dashboard
            when it fits.
          </Text>
        </Container>
      </Section>

      {/* CATEGORY HUB — cream band */}
      <Section tone="cream" spacing="lg">
        <CategoryGrid variant="hub" />
      </Section>

      {/* CLAIM FIRST — slate band */}
      <Section tone="slate" spacing="lg" divide>
        <Grid cols={12} gap="lg" align="center">
          <Cols span={12} spanMd={8}>
            <Eyebrow>Claim first</Eyebrow>
            <Heading level={2} className="mt-3">
              These match against your live entity profile.
            </Heading>
            <Text size="body" tone="default" className="mt-4 max-w-xl">
              Claim your UEI, get your dashboard link by email, and see
              opportunities that fit your NAICS, set-aside, agency mix,
              and past performance.
            </Text>
          </Cols>
          <Cols span={12} spanMd={4} className="md:text-right">
            <Button to="/claim" trailingIcon={ArrowRight}>
              Claim Your Entity
            </Button>
          </Cols>
        </Grid>
      </Section>
    </>
  );
}
