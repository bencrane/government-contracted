import { type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useSectionTone } from "./section-context";

/** The copper kicker — one component for the label that was copy-pasted 16×.
 *  `text-eyebrow` carries size/tracking/weight; `uppercase` + family are applied
 *  here. Color resolves from the Section band (copper-600 on light, copper-300 on
 *  navy) unless `tone` overrides it. */
type EyebrowTone = "auto" | "copper" | "copper-light";

type EyebrowProps = {
  as?: "p" | "span";
  tone?: EyebrowTone;
  className?: string;
  children: ReactNode;
};

export function Eyebrow({
  as: Tag = "p",
  tone = "auto",
  className,
  children,
}: EyebrowProps) {
  const band = useSectionTone();
  const resolved =
    tone === "copper"
      ? "text-copper-600"
      : tone === "copper-light"
        ? "text-copper-300"
        : band === "navy"
          ? "text-copper-300"
          : "text-copper-600";
  return (
    <Tag className={cn("text-eyebrow font-sans uppercase", resolved, className)}>
      {children}
    </Tag>
  );
}

/** The smaller mono micro-label (the `font-mono text-[10px] uppercase` role used
 *  inside cards). `text-mono-label` carries size/tracking/weight. Color is left to
 *  the caller (it sits on many surfaces); defaults to a quiet slate. */
type MonoLabelProps = {
  as?: "p" | "span";
  className?: string;
  children: ReactNode;
};

export function MonoLabel({ as: Tag = "p", className, children }: MonoLabelProps) {
  return (
    <Tag className={cn("text-mono-label font-mono uppercase tabular-nums text-slate-500", className)}>
      {children}
    </Tag>
  );
}
