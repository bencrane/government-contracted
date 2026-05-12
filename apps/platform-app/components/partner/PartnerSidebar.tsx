"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Filter,
  FileText,
  Users,
  BarChart3,
  CreditCard,
  Search,
  ChevronDown,
  LogOut,
  PanelLeftClose,
} from "lucide-react";
import Wordmark from "@/components/site/Wordmark";
import { useSidebar } from "@/components/dashboard/DashboardShell";

function buildNav(slug: string) {
  const base = `/partner/${slug}`;
  return [
    {
      items: [
        { label: "Overview", href: base, icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: "Transfer inbox", href: `${base}/transfers`, icon: <Inbox className="h-4 w-4" /> },
        { label: "Pipeline", href: `${base}/pipeline`, icon: <Filter className="h-4 w-4" /> },
      ],
    },
    {
      label: "Targeting",
      items: [
        { label: "Locked spec", href: `${base}/spec`, icon: <FileText className="h-4 w-4" /> },
        { label: "Audience browser", href: `${base}/audience`, icon: <Search className="h-4 w-4" /> },
        { label: "Reports", href: `${base}/reports`, icon: <BarChart3 className="h-4 w-4" /> },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Team", href: `${base}/team`, icon: <Users className="h-4 w-4" /> },
        { label: "Billing", href: `${base}/billing`, icon: <CreditCard className="h-4 w-4" /> },
      ],
    },
  ];
}

export default function PartnerSidebar({
  slug,
  partnerName,
}: {
  slug: string;
  partnerName: string;
}) {
  const pathname = usePathname();
  const sections = buildNav(slug);
  const shell = useSidebar();

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-line bg-slate-50/80 backdrop-blur">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <Wordmark />
        {shell && (
          <button
            type="button"
            onClick={shell.toggle}
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-800"
            aria-label="Hide sidebar"
            title="Hide sidebar (⌘B)"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section, idx) => (
          <div key={idx} className={idx > 0 ? "mt-6" : ""}>
            {section.label && (
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href.endsWith("/spec") && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`group flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-navy-100 font-semibold text-navy-800"
                          : "text-slate-700 hover:bg-slate-200/60 hover:text-slate-900"
                      }`}
                    >
                      <span
                        className={`${active ? "text-navy-700" : "text-slate-400 group-hover:text-slate-600"}`}
                      >
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <button
          type="button"
          className="group flex w-full items-center gap-2.5 rounded-sm border border-line bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:border-copper-300"
        >
          <span className="inline-flex h-7 w-7 flex-none items-center justify-center bg-copper-600 text-[10px] font-semibold uppercase text-white">
            {partnerName.charAt(0)}
          </span>
          <span className="flex-1 truncate text-left text-slate-800">
            {partnerName}
          </span>
          <ChevronDown className="h-3.5 w-3.5 flex-none text-slate-400" />
        </button>
        <button
          type="button"
          className="mt-2 flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-xs text-slate-500 transition-colors hover:text-slate-800"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
