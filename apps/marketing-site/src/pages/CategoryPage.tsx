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
} from "@/components/ui";
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
      {/* HERO — cream band; headline left + promo card right, sharing a top datum */}
      <Section tone="cream" spacing="base" divide bare className="seal-wash">
        <Container width="wide">
          {/* items-start → the headline and the promo card share one top datum;
              the shorter column never float-centers against the taller. */}
          <Grid cols={12} gap="lg" align="start">
            <Cols span={12} spanMd={7}>
              <Eyebrow>{c.shortName}</Eyebrow>
              <Heading level={1} className="mt-4">
                {c.headline}
              </Heading>
              <Text size="body-lg" tone="muted" className="mt-7 max-w-2xl">
                {c.blurb}
              </Text>
            </Cols>

            <Cols span={12} spanMd={5}>
              <Card surface="white" padding="sm" elevation="card" className="md:p-8">
                <Eyebrow>Free for contractors</Eyebrow>
                <Heading level={2} className="mt-3 text-[1.5rem]">
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
                  Claim Your Entity
                </Button>
              </Card>
            </Cols>
          </Grid>
        </Container>
      </Section>

      {/* WHAT YOU GET — cream band */}
      <Section tone="cream" spacing="lg" divide>
        <Grid cols={12} gap="lg">
          <Cols span={12} spanMd={4}>
            <Heading level={2}>What you get.</Heading>
          </Cols>
          <ul className="space-y-5 md:col-span-8">
            {c.whatYouGet.map((item) => (
              <li key={item} className="flex gap-4 border-b border-line pb-5 last:border-b-0">
                <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center bg-navy-700 text-white">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                <Text size="body" tone="default" className="text-[17px] text-slate-800">
                  {item}
                </Text>
              </li>
            ))}
          </ul>
        </Grid>
      </Section>

      {/* WORTH CLAIMING IF — slate band */}
      <Section tone="slate" spacing="lg" divide>
        <Grid cols={12} gap="lg">
          <Cols span={12} spanMd={4}>
            <Heading level={2}>Worth claiming if…</Heading>
          </Cols>
          <ul className="space-y-4 md:col-span-8">
            {c.goodIf.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 inline-flex h-1.5 w-1.5 flex-none rounded-pill bg-copper-500" />
                <Text size="body" tone="default" className="text-[17px] text-slate-800">
                  {item}
                </Text>
              </li>
            ))}
          </ul>
        </Grid>
      </Section>

      {/* CTA — cream band, navy-tinted card */}
      <Section tone="cream" spacing="lg">
        <Card
          surface="white"
          padding="md"
          className="border-navy-200 bg-gradient-to-br from-navy-50 via-slate-50 to-slate-50 md:p-14"
        >
          <Grid cols={12} gap="md" align="center">
            <Cols span={12} spanMd={8}>
              <Heading level={2}>See this in your dashboard.</Heading>
              <Text size="body" tone="default" className="mt-3 max-w-xl">
                UEI and email. Dashboard link in your inbox.
              </Text>
            </Cols>
            <Cols span={12} spanMd={4} className="md:text-right">
              <Button to={`/claim?next=${c.slug}`} size="lg" trailingIcon={ArrowRight}>
                Claim Your Entity
              </Button>
            </Cols>
          </Grid>
        </Card>
      </Section>
    </>
  );
}
