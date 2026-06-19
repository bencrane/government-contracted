import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CATEGORIES } from "@/lib/opportunities";

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
            href={`/opportunities/${c.slug}`}
            className="group grid grid-cols-12 items-baseline gap-4 border-b border-line py-7 transition-colors hover:bg-navy-50/30 md:gap-8 md:py-8"
          >
            <span className="col-span-2 font-mono text-[11px] uppercase tracking-[0.18em] text-copper-600 md:col-span-1">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="col-span-10 font-display text-2xl text-navy-900 md:col-span-3 md:text-3xl">
              {c.title}
            </h3>
            <p className="col-span-12 text-[15px] leading-relaxed text-slate-600 md:col-span-7">
              {variant === "hub" ? c.blurb : c.headline}
            </p>
            <span className="col-span-0 md:col-span-1 md:flex md:justify-end">
              <ArrowUpRight className="hidden h-5 w-5 text-slate-300 group-hover:text-copper-600 md:block" />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
