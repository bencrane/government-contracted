"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { PanelLeftOpen } from "lucide-react";

type ShellCtx = {
  collapsed: boolean;
  toggle: () => void;
};

const SidebarContext = createContext<ShellCtx | null>(null);

export function useSidebar() {
  return useContext(SidebarContext);
}

const STORAGE_KEY = "govcon_sidebar_collapsed";

export default function DashboardShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "1") setCollapsed(true);
    } catch {
      // localStorage unavailable — default to expanded.
    }
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key?.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && key === "b" && !e.altKey && !e.shiftKey) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || target?.isContentEditable) {
          return;
        }
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle]);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      <div className="flex min-h-screen">
        <div
          aria-hidden={collapsed}
          className={`sticky top-0 hidden h-screen shrink-0 self-start overflow-hidden transition-[width] duration-200 ease-in-out md:block ${
            collapsed ? "w-0" : "w-64"
          }`}
        >
          <div className="h-full w-64">{sidebar}</div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {collapsed && (
            <div className="hidden border-b border-line bg-slate-50/80 backdrop-blur md:block">
              <div className="flex items-center justify-between px-4 py-2">
                <button
                  type="button"
                  onClick={toggle}
                  className="group inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-slate-900"
                  aria-label="Show sidebar"
                  title="Show sidebar (⌘B)"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                  Show sidebar
                </button>
                <kbd className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400 sm:inline">
                  ⌘B
                </kbd>
              </div>
            </div>
          )}
          {children}
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
