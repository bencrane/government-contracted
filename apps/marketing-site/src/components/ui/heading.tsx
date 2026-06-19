import { type ElementType, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/** Serif display headings — the ONLY place display sizes are chosen. `level`
 *  binds the semantic tag to a type-scale role (h1/h2/h3); `display` swaps in the
 *  larger `display` role for the home hero. Size/leading/tracking/weight all come
 *  from the --text-* tokens, so the H1-in-4-shapes problem collapses to one token.
 *  `.font-display` carries Fraunces + ss01/ss02 + the brand tracking. */
const heading = cva("font-display text-balance", {
  variants: {
    role: {
      display: "text-display",
      h1: "text-h1",
      h2: "text-h2",
      h3: "text-h3",
      h4: "text-h4",
    },
  },
  defaultVariants: { role: "h2" },
});

type Level = 1 | 2 | 3 | 4;

type HeadingProps = {
  level?: Level;
  /** Use the larger `display` role regardless of level (home hero). */
  display?: boolean;
  /** Override the rendered tag without changing the type role. */
  as?: ElementType;
  className?: string;
  children: ReactNode;
};

const LEVEL_TAG: Record<Level, ElementType> = { 1: "h1", 2: "h2", 3: "h3", 4: "h4" };
const LEVEL_ROLE: Record<Level, NonNullable<VariantProps<typeof heading>["role"]>> = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
};

export function Heading({
  level = 2,
  display,
  as,
  className,
  children,
}: HeadingProps) {
  const Tag = as ?? LEVEL_TAG[level];
  const role = display ? "display" : LEVEL_ROLE[level];
  return <Tag className={cn(heading({ role }), className)}>{children}</Tag>;
}
