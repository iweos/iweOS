"use client";

import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { DocPage, SearchRecord } from "./types";

type SearchModalProps = {
  open: boolean;
  onClose: () => void;
  pages: DocPage[];
  onOpenPage: (pageId: string) => void;
};

export default function SearchModal({ open, onClose, pages, onOpenPage }: SearchModalProps) {
  const [query, setQuery] = useState("");

  const records = useMemo<SearchRecord[]>(() => {
    return pages.flatMap((page) => {
      const baseRecord: SearchRecord = {
        pageId: page.id,
        tab: page.tab,
        title: page.title,
        description: page.description,
      };
      const sectionRecords =
        page.sections?.map((section) => ({
          pageId: page.id,
          tab: page.tab,
          title: page.title,
          description: section.body?.join(" ") ?? section.bullets?.join(" ") ?? page.description,
          sectionTitle: section.title,
        })) ?? [];
      return [baseRecord, ...sectionRecords];
    });
  }, [pages]);

  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!normalizedQuery) {
      return records.slice(0, 10);
    }

    return records.filter((record) => {
      const haystack = [record.title, record.description, record.sectionTitle, record.tab].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, records]);

  function handleSelect(pageId: string) {
    onOpenPage(pageId);
    setQuery("");
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[90]">
      <DialogBackdrop className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" />
      <div className="fixed inset-0 overflow-y-auto p-4 sm:p-8">
        <div className="mx-auto max-w-2xl">
          <DialogPanel className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.25)] dark:border-slate-800 dark:bg-[#11141a]">
            <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search guides, API endpoints, changelog entries..."
                className="w-full border-0 bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
              />
              <span className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:border-slate-700">
                Esc
              </span>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-3">
              {results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((result, index) => (
                    <button
                      key={`${result.pageId}-${result.sectionTitle ?? "page"}-${index}`}
                      type="button"
                      onClick={() => handleSelect(result.pageId)}
                      className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[rgba(245,158,11,0.12)] text-[#d97706] dark:bg-[rgba(245,158,11,0.16)] dark:text-[#fbbf24]">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[13px] font-semibold text-slate-950 dark:text-white">{result.title}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:bg-white/5 dark:text-slate-400">
                            {result.tab}
                          </span>
                        </span>
                        {result.sectionTitle ? <span className="mt-1 block text-xs font-medium text-[var(--primary)]">{result.sectionTitle}</span> : null}
                        <span className="mt-1 block line-clamp-2 text-[13px] text-slate-500 dark:text-slate-400">{result.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No matching docs yet. Try keywords like result, promotion, comment, payment, or auth.
                </div>
              )}
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
