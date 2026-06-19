import { type ElementType, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/** The single owner of horizontal centering + page gutter + max-width.
 *  `width` pulls from the --w-* tokens, replacing the ad-hoc max-w-2xl/3xl/6xl/7xl mix. */
const container = cva("mx-auto w-full px-gutter", {
  variants: {
    width: {
      wide: "max-w-[var(--w-wide)]", // 80rem — full grids
      content: "max-w-[var(--w-content)]", // 72rem — text-forward pages
      prose: "max-w-[var(--w-prose)]", // 48rem — long-form / forms
    },
  },
  defaultVariants: { width: "wide" },
});

type ContainerProps = VariantProps<typeof container> & {
  as?: ElementType;
  className?: string;
  children: ReactNode;
};

export function Container({
  as: Tag = "div",
  width,
  className,
  children,
}: ContainerProps) {
  return <Tag className={cn(container({ width }), className)}>{children}</Tag>;
}
