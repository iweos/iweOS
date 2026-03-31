"use client";

import Image from "next/image";
import type { DocInfographic } from "./types";

const toneClasses: Record<NonNullable<DocInfographic["tone"]>, string> = {
  amber: "from-amber-50 via-white to-orange-50 border-amber-200/70 dark:from-amber-500/10 dark:via-[#13161c] dark:to-orange-500/10 dark:border-amber-400/15",
  emerald: "from-emerald-50 via-white to-lime-50 border-emerald-200/70 dark:from-emerald-500/10 dark:via-[#13161c] dark:to-lime-500/10 dark:border-emerald-400/15",
  slate: "from-slate-50 via-white to-zinc-50 border-slate-200/80 dark:from-slate-500/10 dark:via-[#13161c] dark:to-zinc-500/10 dark:border-slate-400/15",
};

type InfographicPanelProps = {
  infographic: DocInfographic;
};

export default function InfographicPanel({ infographic }: InfographicPanelProps) {
  const tone = infographic.tone ?? "slate";

  return (
    <section
      className={`overflow-hidden rounded-[28px] border bg-gradient-to-br p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_48px_rgba(15,23,42,0.06)] ${toneClasses[tone]}`}
    >
      <div className={`grid gap-6 ${infographic.imageSrc ? "xl:grid-cols-[1.25fr_0.95fr]" : ""}`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Infographic</p>
          <h3 className="mt-2 text-[1.35rem] font-semibold tracking-tight text-slate-950 dark:text-white">{infographic.title}</h3>
          <p className="mt-3 max-w-2xl text-[13px] leading-6 text-slate-600 dark:text-slate-300">{infographic.description}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {infographic.items.map((item) => (
              <div key={`${infographic.id}-${item.label}`} className="rounded-2xl border border-white/70 bg-white/90 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="mt-2 text-[1.35rem] font-semibold tracking-tight text-slate-950 dark:text-white">{item.value}</p>
                {item.note ? <p className="mt-2 text-[13px] leading-6 text-slate-500 dark:text-slate-400">{item.note}</p> : null}
              </div>
            ))}
          </div>
        </div>

        {infographic.imageSrc ? (
          <div className="flex items-center justify-center">
            <div className="w-full rounded-[26px] border border-white/70 bg-white/90 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0f1117]">
                <Image
                  src={infographic.imageSrc}
                  alt={infographic.imageAlt ?? infographic.title}
                  width={1200}
                  height={900}
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
