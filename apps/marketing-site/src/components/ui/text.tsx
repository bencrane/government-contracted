import { type ElementType, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { useSectionTone } from "./section-context";

/** Body copy bound to the type scale. `size` selects the role; `tone` resolves
 *  against the ambient Section band so the same `tone="muted"` reads correctly on
 *  cream (warm slate) and on navy (light slate) without per-call color guessing. */
const text = cva("", {
  variants: {
    size: {
      "body-lg": "text-body-lg",
      body: "text-body",
      "body-sm": "text-body-sm",
      caption: "text-caption",
    },
  },
  defaultVariants: { size: "body" },
});

type Tone = "default" | "muted" | "subtle";

// tone → color, resolved per band. Light bands use warm slate ink; the navy band
// uses the light slate ramp so body/meta stay legible on dark.
const TONE_LIGHT: Record<Tone, string> = {
  default: "text-slate-700",
  muted: "text-slate-600",
  subtle: "text-slate-500",
};
const TONE_NAVY: Record<Tone, string> = {
  default: "text-slate-100",
  muted: "text-slate-300",
  subtle: "text-slate-400",
};

type TextProps = VariantProps<typeof text> & {
  tone?: Tone;
  as?: ElementType;
  className?: string;
  children: ReactNode;
};

export function Text({
  size,
  tone = "default",
  as: Tag = "p",
  className,
  children,
}: TextProps) {
  const band = useSectionTone();
  const color = band === "navy" ? TONE_NAVY[tone] : TONE_LIGHT[tone];
  return <Tag className={cn(text({ size }), color, className)}>{children}</Tag>;
}
