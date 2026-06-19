import { type ElementType, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/** Bordered surface shell + elevation token — replaces the pasted shadow literals
 *  and the repeated `border border-line-strong bg-white p-7 md:p-10` card shell.
 *  Sharp corners (the federal-document edge) are intrinsic; no radius variant. */
const card = cva("border border-line-strong", {
  variants: {
    surface: {
      white: "bg-surface",
      muted: "bg-slate-50",
    },
    elevation: {
      none: "",
      card: "shadow-card",
      raised: "shadow-raised",
    },
    padding: {
      none: "",
      sm: "p-6",
      md: "p-7 md:p-10",
    },
  },
  defaultVariants: { surface: "white", elevation: "none", padding: "none" },
});

type CardProps = VariantProps<typeof card> & {
  as?: ElementType;
  className?: string;
  children: ReactNode;
};

export function Card({
  as: Tag = "div",
  surface,
  elevation,
  padding,
  className,
  children,
}: CardProps) {
  return (
    <Tag className={cn(card({ surface, elevation, padding }), className)}>
      {children}
    </Tag>
  );
}
