import { type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { Container } from "./container";
import { Eyebrow } from "./eyebrow";
import { Heading } from "./heading";
import { Text } from "./text";

/** The hero layout, built so the floating-headline bug is STRUCTURALLY
 *  impossible. The text column and the media column share one grid row, so their
 *  TOP EDGES are the same datum — the headline can never float-center against a
 *  taller card. The text column is a full-height flex stack: eyebrow → display
 *  heading → lede at the top, and a restrained provenance `footnote` pinned to the
 *  bottom (mt-auto) so the column has a deliberate bottom edge near the card's
 *  lower third instead of dead whitespace. The card owns the CTA; the hero has none.
 *
 *  `ratio` sets the text/media column split at lg (12-col). `media` is the slot. */
const RATIO = {
  "6/6": { text: "lg:col-span-6", media: "lg:col-span-6" },
  "7/5": { text: "lg:col-span-7", media: "lg:col-span-5" },
} as const;

const heroText = cva("flex min-h-full flex-col", {
  variants: {},
});

type HeroProps = VariantProps<typeof heroText> & {
  eyebrow?: ReactNode;
  heading: ReactNode;
  lede?: ReactNode;
  /** Restrained trust/provenance line pinned to the column's bottom edge. */
  footnote?: ReactNode;
  media: ReactNode;
  ratio?: keyof typeof RATIO;
  containerWidth?: "wide" | "content" | "prose";
  className?: string;
};

export function Hero({
  eyebrow,
  heading,
  lede,
  footnote,
  media,
  ratio = "6/6",
  containerWidth = "wide",
  className,
}: HeroProps) {
  const cols = RATIO[ratio];
  return (
    <Container width={containerWidth} className={className}>
      {/* items-stretch + shared row → text-top and media-top are one datum. */}
      <div className="grid grid-cols-1 items-stretch gap-12 lg:grid-cols-12 lg:gap-16">
        <div className={cols.text}>
          <div className={cn(heroText())}>
            {/* Top cluster — deliberate internal rhythm, token-spaced. */}
            <div>
              {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
              <Heading level={1} display className={eyebrow ? "mt-5" : undefined}>
                {heading}
              </Heading>
              {lede && (
                <Text size="body-lg" tone="muted" className="mt-7 max-w-xl">
                  {lede}
                </Text>
              )}
            </div>
            {/* Bottom-anchored provenance — gives the column an intentional
                bottom edge near the card's lower third. */}
            {footnote && (
              <div className="mt-auto pt-10">
                <Text size="caption" tone="subtle" className="max-w-md">
                  {footnote}
                </Text>
              </div>
            )}
          </div>
        </div>

        <div className={cols.media}>{media}</div>
      </div>
    </Container>
  );
}
