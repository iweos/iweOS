"use client";

import Link from "next/link";
import { Menu, Search, Sparkles } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import ThemeToggle from "@/components/ThemeToggle";
import type { DocsTab, DocsTabId } from "./types";

type HeaderProps = {
  tabs: DocsTab[];
  activeTab: DocsTabId;
  onSelectTab: (tabId: DocsTabId) => void;
  onOpenSearch: () => void;
  onOpenMobileSidebar: () => void;
};

export default function Header({ tabs, activeTab, onSelectTab, onOpenSearch, onOpenMobileSidebar }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#fafafa]/95 backdrop-blur dark:border-slate-800 dark:bg-[#0f1117]/95">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
        <div className="flex h-14 items-center gap-2.5 lg:h-16">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 lg:hidden dark:border-slate-700 dark:text-slate-300"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <BrandLogo
            href="/guide"
            variant="dark"
            className="shrink-0"
            textClassName="font-semibold text-slate-950 dark:text-white"
            iconClassName="text-slate-950 dark:text-white"
          />

          <button
            type="button"
            onClick={onOpenSearch}
            className="mx-auto hidden min-w-[260px] max-w-[420px] flex-1 items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-left text-[11px] text-slate-500 shadow-sm transition hover:border-slate-300 lg:flex dark:border-slate-800 dark:bg-[#161922] dark:text-slate-400"
          >
            <span className="inline-flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Search docs, guides, API...</span>
            </span>
            <span className="rounded-lg border border-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:border-slate-700">
              Ctrl K
            </span>
          </button>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <ThemeToggle className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-[var(--primary)] hover:text-[var(--primary)] dark:border-slate-700 dark:bg-[#161922] dark:text-slate-200" />
            <button
              type="button"
              onClick={onOpenSearch}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 lg:hidden dark:border-slate-700 dark:bg-[#161922] dark:text-slate-200"
              aria-label="Search"
            >
              <Search className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={onOpenSearch}
              className="hidden items-center gap-2 rounded-lg bg-slate-950 px-3.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-slate-800 lg:inline-flex dark:bg-[var(--primary)] dark:text-white dark:hover:bg-[var(--primary-strong)]"
            >
              <Sparkles className="h-4 w-4" />
              <span>Ask AI</span>
            </button>
            <Link
              href="/sign-in"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950 dark:border-slate-700 dark:bg-[#161922] dark:text-slate-200"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="flex h-11 items-center">
            <nav className="flex items-end gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`rounded-t-xl border border-b-0 px-3 py-2 text-[11px] font-semibold transition ${
                    activeTab === tab.id
                      ? "border-slate-200 bg-white text-slate-950 shadow-[0_-1px_0_rgba(255,255,255,0.8)] dark:border-slate-700 dark:bg-[#161922] dark:text-white"
                      : "border-transparent text-slate-500 hover:border-slate-200/70 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:border-slate-700/70 dark:hover:bg-[#161922]/70 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
