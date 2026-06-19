import { type ReactNode, useId, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

/** The profile tab bar — the ONLY client/animated primitive. Owns the copper
 *  `layoutId` underline, the AnimatePresence cross-fade, and a fixed-height pane
 *  so the surrounding card never reflows. Motion is contained entirely here.
 *
 *  EASE_BRAND mirrors the --ease-brand token; framer-motion needs the literal
 *  cubic tuple (it can't read a CSS var for an easing curve). */
const EASE_BRAND = [0.16, 1, 0.3, 1] as const;

export type TabItem = {
  id: string;
  label: string;
  panel: ReactNode;
};

type TabsProps = {
  items: TabItem[];
  defaultId?: string;
  /** Fixed pane height (px) so the card never changes size between tabs. */
  panelHeight?: number;
  ariaLabel?: string;
  className?: string;
};

export function Tabs({
  items,
  defaultId,
  panelHeight = 236,
  ariaLabel = "Detail",
  className,
}: TabsProps) {
  const [active, setActive] = useState(defaultId ?? items[0]?.id);
  const underlineId = useId();
  const current = items.find((t) => t.id === active) ?? items[0];

  return (
    <div className={cn(className)}>
      <div role="tablist" aria-label={ariaLabel} className="flex border-b border-line px-3">
        {items.map((t) => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActive(t.id)}
              className="relative px-3 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] outline-none focus-visible:text-navy-900"
            >
              <span
                className={
                  isActive
                    ? "text-navy-900"
                    : "text-slate-400 transition-colors hover:text-slate-600"
                }
              >
                {t.label}
              </span>
              {isActive && (
                <motion.span
                  layoutId={`tabs-underline-${underlineId}`}
                  className="absolute inset-x-3 -bottom-px h-0.5 bg-copper-500"
                  transition={{ duration: 0.3, ease: EASE_BRAND }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div
        className="overflow-hidden border-b border-line"
        style={{ height: panelHeight }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current?.id}
            role="tabpanel"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: EASE_BRAND }}
          >
            {current?.panel}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export { EASE_BRAND };
