import { type ReactNode } from "react";
import { Container } from "./container";
import { Grid, Cols } from "./grid";
import { Eyebrow } from "./eyebrow";
import { Heading } from "./heading";
import { Text } from "./text";

/** Two-column hero: a concise text column beside a media slot (the live-data
 *  card). The columns share a top datum (`align="start"` — the document edge),
 *  so the eyebrow baseline and the card header start on the same line; whitespace
 *  is never pooled into a single dead gap.
 *
 *  `ratio` sets the text/media split via the 12-col Grid (the single gap source).
 *  Cluster rhythm (eyebrow→h1 mt-4, h1→lede mt-6, lede→cta mt-8) is locked here,
 *  never overridden at a call site. */
const RATIO = {
  "6/6": { text: 6, media: 6 },
  "7/5": { text: 7, media: 5 },
} as const;

type HeroProps = {
  eyebrow?: ReactNode;
  heading: ReactNode;
  lede?: ReactNode;
  /** Optional action(s) under the lede — gives the text column a defined bottom. */
  cta?: ReactNode;
  media: ReactNode;
  ratio?: keyof typeof RATIO;
  containerWidth?: "wide" | "content" | "prose";
  className?: string;
};

export function Hero({
  eyebrow,
  heading,
  lede,
  cta,
  media,
  ratio = "6/6",
  containerWidth = "wide",
  className,
}: HeroProps) {
  const cols = RATIO[ratio];
  return (
    <Container width={containerWidth} className={className}>
      <Grid cols={12} align="start">
        <Cols spanLg={cols.text}>
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <Heading level={1} display className={eyebrow ? "mt-4" : undefined}>
            {heading}
          </Heading>
          {lede && (
            <Text size="body-lg" tone="muted" className="mt-6 max-w-2xl">
              {lede}
            </Text>
          )}
          {cta && <div className="mt-8">{cta}</div>}
        </Cols>

        <Cols spanLg={cols.media}>{media}</Cols>
      </Grid>
    </Container>
  );
}
