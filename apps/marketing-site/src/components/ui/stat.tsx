import { type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { MonoLabel } from "./eyebrow";

/** The KPI / fact block — label + value (+ optional sub, accent, leading icon).
 *  Subsumes the local `Kpi` (size="kpi") and `Fact` (size="fact") that were
 *  trapped in GoldenProfilePreview, so EntityFinder and others share one source. */
const value = cva("leading-none tabular-nums", {
  variants: {
    size: {
      kpi: "font-display text-2xl",
      fact: "text-sm font-medium leading-snug",
    },
    accent: {
      true: "text-copper-700",
      false: "text-navy-900",
    },
  },
  defaultVariants: { size: "kpi", accent: false },
});

type StatProps = VariantProps<typeof value> & {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  /** Small copper icon rendered before the label (the Fact pattern). */
  icon?: ReactNode;
  className?: string;
};

export function Stat({
  label,
  value: val,
  sub,
  size,
  accent,
  icon,
  className,
}: StatProps) {
  return (
    <div className={cn("px-4 py-4", className)}>
      <MonoLabel className="flex items-center gap-1.5">
        {icon && <span className="text-copper-600">{icon}</span>}
        {label}
      </MonoLabel>
      <p className={cn("mt-1", value({ size, accent }))}>{val}</p>
      {sub && <p className="mt-1 truncate text-caption tabular-nums text-slate-500">{sub}</p>}
    </div>
  );
}
