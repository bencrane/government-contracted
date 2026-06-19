import { type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Button, Eyebrow, Heading, Section, Text } from "@/components/ui";

/** The single closing-CTA band — replaces the four hand-rolled gradient closers.
 *  A flat, centered statement that reads as the page's terminal focal point,
 *  heavier than any interior band. FLAT fills only (no gradients): navy = the
 *  conversion close, slate = the softer "claim first" nudge.
 *
 *  On navy the copper-rule hairline crowns the eyebrow (the seal motif), marking
 *  the close as the page's heaviest moment.
 *
 *  Cluster rhythm matches the locked system: eyebrow → heading mt-4,
 *  heading → lede mt-6, lede → button mt-8. */
type CtaCloseProps = {
  tone: "navy" | "slate";
  eyebrow?: ReactNode;
  heading: ReactNode;
  lede: ReactNode;
  to: string;
  buttonLabel?: string;
};

export function CtaClose({
  tone,
  eyebrow,
  heading,
  lede,
  to,
  buttonLabel = "Claim your entity",
}: CtaCloseProps) {
  return (
    <Section tone={tone} spacing="lg">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        {tone === "navy" && <span aria-hidden className="copper-rule mb-8 w-16" />}
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <Heading level={2} className={eyebrow ? "mt-4" : undefined}>
          {heading}
        </Heading>
        <Text size="body-lg" tone="muted" className="mt-6 max-w-xl">
          {lede}
        </Text>
        <div className="mt-8">
          <Button to={to} size="lg" trailingIcon={ArrowRight}>
            {buttonLabel}
          </Button>
        </div>
      </div>
    </Section>
  );
}
