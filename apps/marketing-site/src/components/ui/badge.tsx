import { type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/** The status / cert / category chip — the SAM-status pill, the copper cert pills,
 *  and the resources category tags, unified. Sharp-cornered, hairline-bordered. */
const badge = cva(
  "inline-flex items-center gap-1.5 border px-2 py-0.5 text-mono-label",
  {
    variants: {
      tone: {
        success: "border-success/30 bg-success/5 text-success font-medium",
        copper: "border-copper-200 bg-copper-50 text-copper-700",
        navy: "border-navy-200 bg-navy-50 text-navy-700",
        slate: "border-line-strong bg-slate-50 text-slate-600",
      },
    },
    defaultVariants: { tone: "success" },
  },
);

type BadgeProps = VariantProps<typeof badge> & {
  /** Render a small filled status dot in the badge's accent color. */
  dot?: boolean;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
};

// Dot color keyed to tone so the status indicator matches the chip.
const DOT_COLOR = {
  success: "bg-success",
  copper: "bg-copper-500",
  navy: "bg-navy-600",
  slate: "bg-slate-400",
} as const;

export function Badge({ tone, dot, icon, className, children }: BadgeProps) {
  return (
    <span className={cn(badge({ tone }), className)}>
      {dot && (
        <span
          aria-hidden
          className={cn(
            "h-1.5 w-1.5 rounded-pill",
            DOT_COLOR[(tone ?? "success") as keyof typeof DOT_COLOR],
          )}
        />
      )}
      {icon}
      {children}
    </span>
  );
}
