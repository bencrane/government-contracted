import { type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Grid, Cols } from "./grid";
import { Eyebrow } from "./eyebrow";
import { Heading } from "./heading";
import { Text } from "./text";

/** The single owner of the section-opening cluster: eyebrow → heading → lede.
 *  Every hand-rolled `<div className="mb-N max-w-3xl">` header block routes
 *  through here, so the cluster rhythm can never diverge per page.
 *
 *  Locked rhythm (never overridden at a call site):
 *    eyebrow → heading        mt-4
 *    heading → lede           mt-6
 *    cluster → content        mb-12   (block layout only)
 *
 *  Two layouts via `align`:
 *    block (default) — full-width left-aligned stack in a max-w-2xl wrapper.
 *    rail            — header sits in the left 4 cols of a 12-col grid; the
 *                      section `children` fill the right 8 cols.
 */
type SectionHeaderProps = {
  eyebrow?: ReactNode;
  heading: ReactNode;
  /** Heading level — section headings are h2 (default); rarely h3 for subheads. */
  level?: 2 | 3;
  lede?: ReactNode;
  align?: "block" | "rail";
  /** Rail layout only — the section payload that fills the right 8 columns. */
  children?: ReactNode;
  className?: string;
};

function Cluster({
  eyebrow,
  heading,
  level = 2,
  lede,
}: Pick<SectionHeaderProps, "eyebrow" | "heading" | "level" | "lede">) {
  return (
    <>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Heading level={level} className={eyebrow ? "mt-4" : undefined}>
        {heading}
      </Heading>
      {lede && (
        <Text size="body-lg" tone="muted" className="mt-6 max-w-2xl">
          {lede}
        </Text>
      )}
    </>
  );
}

export function SectionHeader({
  eyebrow,
  heading,
  level = 2,
  lede,
  align = "block",
  children,
  className,
}: SectionHeaderProps) {
  if (align === "rail") {
    return (
      <Grid cols={12} align="start" className={className}>
        <Cols spanLg={4}>
          <Cluster eyebrow={eyebrow} heading={heading} level={level} lede={lede} />
        </Cols>
        <Cols spanLg={8}>{children}</Cols>
      </Grid>
    );
  }

  return (
    <>
      <div className={cn("mb-12 max-w-2xl", className)}>
        <Cluster eyebrow={eyebrow} heading={heading} level={level} lede={lede} />
      </div>
      {children}
    </>
  );
}
