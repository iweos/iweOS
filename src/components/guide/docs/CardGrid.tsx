"use client";

import { BookOpen, Bot, CreditCard, GraduationCap, Landmark, LockKeyhole, Rocket, ShieldCheck, Users } from "lucide-react";
import type { DocCard } from "./types";

const iconMap = {
  rocket: Rocket,
  shield: ShieldCheck,
  users: Users,
  bot: Bot,
  api: LockKeyhole,
  payments: CreditCard,
  school: Landmark,
  student: GraduationCap,
  docs: BookOpen,
} as const;

type CardGridProps = {
  cards: DocCard[];
  onOpenPage: (pageId: string) => void;
};

export default function CardGrid({ cards, onOpenPage }: CardGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = iconMap[card.icon as keyof typeof iconMap] ?? BookOpen;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => card.pageId && onOpenPage(card.pageId)}
            className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-[#13161c] dark:hover:border-[var(--brand-primary-strong)]"
          >
            <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(245,158,11,0.12)] text-[#d97706] dark:bg-[rgba(245,158,11,0.16)] dark:text-[#fbbf24]">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="guide-hornbill text-[1rem] font-semibold tracking-tight text-slate-950 dark:text-white">{card.title}</h3>
            <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">{card.description}</p>
            <div className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--primary)] transition group-hover:gap-3">
              <span>{card.hrefLabel ?? "Open"}</span>
              <span aria-hidden="true">→</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
