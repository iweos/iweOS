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
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#fafafa]/90 backdrop-blur dark:border-slate-800 dark:bg-[#0f1117]/90">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 lg:hidden dark:border-slate-700 dark:text-slate-300"
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

        <nav className="hidden items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 lg:flex dark:border-slate-800 dark:bg-[#161922]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-[var(--brand-primary-soft)] text-[var(--primary-strong)] dark:bg-[rgba(123,199,146,0.16)] dark:text-[#dff2e5]"
                  : "text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <button
          type="button"
          onClick={onOpenSearch}
          className="mx-auto hidden min-w-[260px] items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-2 text-left text-sm text-slate-500 shadow-sm transition hover:border-slate-300 lg:flex dark:border-slate-800 dark:bg-[#161922] dark:text-slate-400"
        >
          <span className="inline-flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span>Search docs, guides, API...</span>
          </span>
          <span className="rounded-lg border border-slate-200 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:border-slate-700">
            Ctrl K
          </span>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-[var(--primary)] hover:text-[var(--primary)] dark:border-slate-700 dark:bg-[#161922] dark:text-slate-200" />
          <button
            type="button"
            onClick={onOpenSearch}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 lg:hidden dark:border-slate-700 dark:bg-[#161922] dark:text-slate-200"
            aria-label="Search"
          >
            <Search className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            onClick={onOpenSearch}
            className="hidden items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 lg:inline-flex dark:bg-[var(--primary)] dark:text-white dark:hover:bg-[var(--primary-strong)]"
          >
            <Sparkles className="h-4 w-4" />
            <span>Ask AI</span>
          </button>
          <Link
            href="/sign-in"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950 dark:border-slate-700 dark:bg-[#161922] dark:text-slate-200"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
