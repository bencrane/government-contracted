import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { CATEGORIES } from "@/lib/opportunities";
import { Grid, Cols, Heading, Text, MonoLabel } from "@/components/ui";

export default function CategoryGrid({
  variant = "preview",
}: {
  variant?: "preview" | "hub";
}) {
  return (
    <ol className="border-t border-line">
      {CATEGORIES.map((c, i) => (
        <li key={c.slug}>
          <Link
            to={`/opportunities/${c.slug}`}
            className="group block border-b border-line py-7 transition-colors hover:bg-navy-50/30 md:py-8"
          >
            <Grid cols={12} gap="sm" align="baseline" className="md:gap-8">
              <Cols span={2} spanMd={1}>
                <MonoLabel as="span" className="text-copper-600">
                  {String(i + 1).padStart(2, "0")}
                </MonoLabel>
              </Cols>
              <Cols span={10} spanMd={3}>
                <Heading level={3} className="md:text-[1.875rem]">
                  {c.title}
                </Heading>
              </Cols>
              <Cols span={12} spanMd={7}>
                <Text size="body-sm" tone="muted">
                  {variant === "hub" ? c.blurb : c.headline}
                </Text>
              </Cols>
              <Cols spanMd={1} className="hidden md:flex md:justify-end">
                {/* static arrow — the no-animated-arrow rule */}
                <ArrowUpRight className="h-5 w-5 text-slate-300 group-hover:text-copper-600" />
              </Cols>
            </Grid>
          </Link>
        </li>
      ))}
    </ol>
  );
}
