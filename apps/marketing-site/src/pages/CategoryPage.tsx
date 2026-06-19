import { useParams } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { categoryBySlug } from "@/lib/opportunities";
import { usePageTitle } from "@/lib/usePageTitle";
import {
  Section,
  Container,
  Grid,
  Cols,
  Card,
  Button,
  Eyebrow,
  Heading,
  Text,
  MonoLabel,
  SectionHeader,
} from "@/components/ui";
import { CtaClose } from "@/components/marketing/CtaClose";
import NotFoundPage from "./NotFoundPage";

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const c = categoryBySlug(category ?? "");

  usePageTitle(
    c ? `${c.title} — Government Contracted` : "Not found — Government Contracted",
  );

  if (!c) return <NotFoundPage />;

  return (
    <>
      {/* HERO — cream band; headline left (7) + promo card right (5), shared top datum */}
      <Section
        tone="cream"
        spacing="base"
        divide
        bare
        className="seal-wash relative overflow-hidden"
      >
        <div aria-hidden className="absolute inset-0 paper-grid opacity-50" />
        <Container width="wide" className="relative">
          {/* align="start" → headline and promo card share one top datum;
              the shorter column never float-centers against the taller. */}
          <Grid cols={12} gap="lg" align="start">
            <Cols spanLg={7}>
              <Eyebrow>{c.shortName}</Eyebrow>
              <Heading level={1} className="mt-4">
                {c.headline}
              </Heading>
              <Text size="body-lg" tone="muted" className="mt-6 max-w-2xl">
                {c.blurb}
              </Text>
            </Cols>

            <Cols spanLg={5}>
              <Card surface="white" padding="md" elevation="card">
                <Eyebrow>Free for contractors</Eyebrow>
                <Heading level={4} className="mt-4">
                  Claim your entity.
                </Heading>
                <Text size="body-sm" tone="muted" className="mt-3">
                  UEI and email. Dashboard link by email within a few minutes.
                </Text>
                <Button
                  to={`/claim?next=${c.slug}`}
                  fullWidth
                  trailingIcon={ArrowRight}
                  className="mt-6"
                >
                  Claim your entity
                </Button>
                {/* mono datum row — gives the card a typographic floor so its
                    height approaches the headline column (kills the dead void). */}
                <MonoLabel
                  as="p"
                  className="mt-6 border-t border-line pt-4 text-slate-500"
                >
                  Free · UEI + email · dashboard in minutes
                </MonoLabel>
              </Card>
            </Cols>
          </Grid>
        </Container>
      </Section>

      {/* WHAT YOU GET — cream band; the value payload → the focal interior section */}
      <Section tone="cream" spacing="lg" divide>
        <SectionHeader align="rail" heading="What you get.">
          <ul className="space-y-5">
            {c.whatYouGet.map((item) => (
              <li
                key={item}
                className="flex gap-4 border-b border-line pb-5 last:border-b-0"
              >
                {/* copper-square tick — the one "what you get" marker (§1.13) */}
                <span className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center bg-copper-600 text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <Text size="body" tone="default" className="text-slate-800">
                  {item}
                </Text>
              </li>
            ))}
          </ul>
        </SectionHeader>
      </Section>

      {/* WORTH CLAIMING IF — slate band; tighter than "What you get" so the two
          don't read as one repeated module. Compact inline list, no dividers. */}
      <Section tone="slate" spacing="lg" divide>
        <SectionHeader align="rail" heading="Worth claiming if…">
          <ul className="space-y-4">
            {c.goodIf.map((item) => (
              <li key={item} className="flex gap-3">
                {/* copper hairline rule — the one "qualifier" marker (§1.13) */}
                <span
                  aria-hidden
                  className="mt-3 h-px w-4 flex-none bg-copper-500"
                />
                <Text size="body" tone="default" className="text-slate-800">
                  {item}
                </Text>
              </li>
            ))}
          </ul>
        </SectionHeader>
      </Section>

      {/* CTA — navy close, the page's terminal focal point */}
      <CtaClose
        tone="navy"
        heading="See this in your dashboard."
        lede="UEI and email. Dashboard link in your inbox."
        to={`/claim?next=${c.slug}`}
      />
    </>
  );
}
