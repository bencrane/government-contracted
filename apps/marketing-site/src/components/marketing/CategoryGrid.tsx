import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { CATEGORIES } from "@/lib/opportunities";
import { Grid, Cols, Heading, Text, MonoLabel } from "@/components/ui";

export default function CategoryGrid({
  variant = "preview",
  start = 0,
}: {
  variant?: "preview" | "hub";
  /** Skip the first `start` categories and number continuously — lets a page
   *  feature the top N above and demote the rest here without duplicate rows. */
  start?: number;
}) {
  return (
    <ol className="border-t border-line">
      {CATEGORIES.slice(start).map((c, i) => (
        <li key={c.slug}>
          <Link
            to={`/opportunities/${c.slug}`}
            className="group block border-b border-line py-7 transition-colors hover:bg-navy-50/30 md:py-8"
          >
            <Grid cols={12} gap="sm" align="baseline" className="md:gap-8">
              <Cols spanLg={1}>
                <MonoLabel as="span" className="text-copper-600">
                  {String(start + i + 1).padStart(2, "0")}
                </MonoLabel>
              </Cols>
              <Cols spanLg={3}>
                <Heading level={3}>
                  {c.title}
                </Heading>
              </Cols>
              <Cols spanLg={7}>
                <Text size="body-sm" tone="muted">
                  {variant === "hub" ? c.blurb : c.headline}
                </Text>
                {variant === "hub" && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <MonoLabel as="span" className="text-slate-500">
                      {c.whatYouGet.length} included
                    </MonoLabel>
                    {c.goodIf.slice(0, 3).map((g) => (
                      <span
                        key={g}
                        className="border border-line px-2 py-1 text-caption text-slate-600"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </Cols>
              <Cols spanLg={1} className="hidden lg:flex lg:justify-end">
                {/* static arrow — the no-animated-arrow rule; copper at rest */}
                <ArrowUpRight className="h-5 w-5 text-copper-600 group-hover:text-copper-700" />
              </Cols>
            </Grid>
          </Link>
        </li>
      ))}
    </ol>
  );
}
