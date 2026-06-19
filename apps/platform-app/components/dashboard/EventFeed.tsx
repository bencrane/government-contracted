import Link from "next/link";
import type { FeedEvent } from "@/lib/mock-dashboard";
import MockBadge from "@/components/dashboard/MockBadge";

export default function EventFeed({
  events,
  hideHeader = false,
  flagMock = false,
}: {
  events: FeedEvent[];
  hideHeader?: boolean;
  flagMock?: boolean;
}) {
  return (
    <div>
      {!hideHeader && (
        <h2 className="mb-4 font-display text-2xl text-navy-900">What&apos;s new</h2>
      )}
      <ul className="divide-y divide-line border border-line bg-surface">
        {events.map((e) => {
          const mock = e.isMock ?? flagMock;
          return (
            <li key={e.id} className="px-5 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    {e.category.replace(/_/g, " ")}
                  </p>
                  {mock && <MockBadge />}
                </div>
                <p className="text-xs text-slate-500">{e.relativeTime}</p>
              </div>
              <p className={`mt-2 text-[15px] font-semibold ${mock ? "text-red-600" : "text-navy-900"}`}>{e.title}</p>
              <p className={`mt-1 text-sm leading-relaxed ${mock ? "text-red-500" : "text-slate-600"}`}>{e.body}</p>
              {e.primaryAction && (
                <Link
                  href={e.primaryAction.href}
                  className="mt-3 inline-flex text-sm font-medium text-navy-700 transition-colors hover:text-navy-800"
                >
                  {e.primaryAction.label} →
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
