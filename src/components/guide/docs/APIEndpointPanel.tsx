"use client";

import type { DocEndpoint } from "./types";

const methodTone: Record<DocEndpoint["method"], string> = {
  GET: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/12 dark:text-emerald-200 dark:ring-emerald-400/20",
  POST: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/12 dark:text-sky-200 dark:ring-sky-400/20",
  PATCH: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/12 dark:text-amber-200 dark:ring-amber-400/20",
  PUT: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/12 dark:text-violet-200 dark:ring-violet-400/20",
  DELETE: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/12 dark:text-rose-200 dark:ring-rose-400/20",
};

type APIEndpointPanelProps = {
  endpoints: DocEndpoint[];
  sections: Array<{ id: string; title: string }>;
};

export default function APIEndpointPanel({ endpoints, sections }: APIEndpointPanelProps) {
  return (
    <div className="sticky top-[5.25rem] space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-[#13161c]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Endpoints</p>
        <div className="mt-3 space-y-2">
          {endpoints.map((endpoint) => (
            <a
              key={`${endpoint.method}-${endpoint.anchorId}`}
              href={`#${endpoint.anchorId}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-[13px] font-medium text-slate-700 transition hover:border-[var(--primary)] hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-white/5"
            >
              <span>{endpoint.label}</span>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${methodTone[endpoint.method]}`}>{endpoint.method}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-[#13161c]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">On this page</p>
        <ul className="mt-3 space-y-2 text-[13px] text-slate-600 dark:text-slate-300">
          {sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="transition hover:text-[var(--primary)]">
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
