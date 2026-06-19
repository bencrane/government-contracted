import { type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { Container } from "./container";
import { SectionToneProvider, type SectionTone } from "./section-context";

/** Owns the cream/navy/slate band system + vertical rhythm + the optional
 *  bottom hairline. Composes <Container>. The navy band flips text light and,
 *  via tone context, recolors <Eyebrow> to copper-300 — so the copper-600/-300
 *  split is handled by context, never by hand at the call site. */
const section = cva("relative", {
  variants: {
    tone: {
      cream: "bg-background text-foreground",
      navy: "bg-navy-900 text-slate-100",
      slate: "bg-slate-100 text-foreground",
    },
    spacing: {
      sm: "py-[var(--section-y-sm)]",
      base: "py-[var(--section-y)]",
      lg: "py-[var(--section-y-lg)]",
    },
    divide: {
      true: "border-b border-line",
      false: "",
    },
  },
  defaultVariants: { tone: "cream", spacing: "base", divide: false },
});

type SectionProps = VariantProps<typeof section> & {
  containerWidth?: "wide" | "content" | "prose";
  /** Render the band shell only; caller supplies its own inner layout (e.g. a
   *  Hero that needs the Container nested differently). Default false. */
  bare?: boolean;
  id?: string;
  className?: string;
  children: ReactNode;
};

export function Section({
  tone,
  spacing,
  divide,
  containerWidth = "wide",
  bare = false,
  id,
  className,
  children,
}: SectionProps) {
  return (
    <SectionToneProvider value={(tone ?? "cream") as SectionTone}>
      <section id={id} className={cn(section({ tone, spacing, divide }), className)}>
        {bare ? children : <Container width={containerWidth}>{children}</Container>}
      </section>
    </SectionToneProvider>
  );
}
