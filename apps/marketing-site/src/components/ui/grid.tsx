import { type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/** The 12-column grid as a primitive with fixed gap steps, replacing the
 *  hand-rolled grids whose gap-8/10/12/14/16 varied per instance. */
const grid = cva("grid", {
  variants: {
    cols: {
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-3",
      12: "grid-cols-1 lg:grid-cols-12",
    },
    gap: {
      none: "gap-0",
      px: "gap-px",
      sm: "gap-6",
      md: "gap-8 md:gap-10",
      lg: "gap-12 md:gap-16",
    },
    align: {
      start: "items-start",
      center: "items-center",
      stretch: "items-stretch",
      baseline: "items-baseline",
    },
  },
  defaultVariants: { cols: 12, gap: "lg", align: "start" },
});

type GridProps = VariantProps<typeof grid> & {
  as?: "div" | "ol" | "ul";
  className?: string;
  children: ReactNode;
};

export function Grid({
  as: Tag = "div",
  cols,
  gap,
  align,
  className,
  children,
}: GridProps) {
  return (
    <Tag className={cn(grid({ cols, gap, align }), className)}>{children}</Tag>
  );
}

// Column-span steps for the 12-col grid (base + md + lg). Static class strings so
// Tailwind's compiler sees every literal — no dynamic `col-span-${n}` interpolation.
const SPAN: Record<number, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
  9: "col-span-9",
  10: "col-span-10",
  11: "col-span-11",
  12: "col-span-12",
};
const SPAN_MD: Record<number, string> = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  8: "md:col-span-8",
  9: "md:col-span-9",
  10: "md:col-span-10",
  11: "md:col-span-11",
  12: "md:col-span-12",
};
const SPAN_LG: Record<number, string> = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
  9: "lg:col-span-9",
  10: "lg:col-span-10",
  11: "lg:col-span-11",
  12: "lg:col-span-12",
};

type ColsProps = {
  span?: number;
  spanMd?: number;
  spanLg?: number;
  as?: "div" | "li";
  className?: string;
  children: ReactNode;
};

export function Cols({
  span,
  spanMd,
  spanLg,
  as: Tag = "div",
  className,
  children,
}: ColsProps) {
  return (
    <Tag
      className={cn(
        span && SPAN[span],
        spanMd && SPAN_MD[spanMd],
        spanLg && SPAN_LG[spanLg],
        className,
      )}
    >
      {children}
    </Tag>
  );
}
