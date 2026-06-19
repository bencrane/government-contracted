import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge resolves conflicting utilities so primitives can accept a
// `className` override without specificity surprises. Its default conflict map
// only knows Tailwind's built-in scale, so the custom `@theme` tokens
// (text-display…, shadow-card/raised, rounded-pill) must be registered in their
// groups — otherwise `cn("text-h2", "text-display")` wouldn't dedupe.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "h1",
            "h2",
            "h3",
            "h4",
            "body-lg",
            "body",
            "body-sm",
            "caption",
            "eyebrow",
            "mono-label",
            "field-label",
          ],
        },
      ],
      shadow: [{ shadow: ["card", "raised"] }],
      rounded: [{ rounded: ["pill"] }],
    },
  },
});

/** Compose conditional class lists, then merge Tailwind conflicts (last wins). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
