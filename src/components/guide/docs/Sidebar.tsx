"use client";

import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Compass,
  FlaskConical,
  HelpCircle,
  KeyRound,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { SidebarGroup, SidebarItem } from "./types";

type SidebarProps = {
  groups: SidebarGroup[];
  activePageId: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onOpenPage: (pageId: string) => void;
};

const iconMap = {
  sparkles: Sparkles,
  compass: Compass,
  book: BookOpen,
  flask: FlaskConical,
  key: KeyRound,
  shield: ShieldCheck,
  help: HelpCircle,
} as const;

function resolveItemIcon(icon?: string) {
  return icon ? (iconMap[icon as keyof typeof iconMap] ?? BookOpen) : BookOpen;
}

function itemContainsActive(item: SidebarItem, activePageId: string): boolean {
  if (item.pageId === activePageId) {
    return true;
  }

  return item.children?.some((child) => itemContainsActive(child, activePageId)) ?? false;
}

function SidebarItemNode({
  item,
  activePageId,
  depth = 0,
  onOpenPage,
}: {
  item: SidebarItem;
  activePageId: string;
  depth?: number;
  onOpenPage: (pageId: string) => void;
}) {
  const isActive = item.pageId === activePageId;
  const hasChildren = Boolean(item.children?.length);
  const hasActiveDescendant = itemContainsActive(item, activePageId);
  const Icon = resolveItemIcon(item.icon);

  if (!hasChildren) {
    return (
      <button
        type="button"
        onClick={() => item.pageId && onOpenPage(item.pageId)}
        className={`flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-[12px] transition ${
          isActive
            ? "bg-[var(--brand-primary-soft)] font-semibold text-[var(--primary-strong)] dark:bg-[rgba(123,199,146,0.16)] dark:text-[#dff2e5]"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
        }`}
        style={{ paddingLeft: `${0.65 + depth * 0.8}rem` }}
      >
        <Icon className="mr-1.5 h-4 w-4 shrink-0" />
        {item.title}
      </button>
    );
  }

  return (
    <Disclosure defaultOpen={hasActiveDescendant}>
      {({ open }) => (
        <div className="space-y-1">
          <DisclosureButton
            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[12px] font-medium transition ${
              hasActiveDescendant
                ? "text-slate-950 dark:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
            }`}
            style={{ paddingLeft: `${0.65 + depth * 0.8}rem` }}
          >
            <span className="flex items-center">
              <Icon className="mr-1.5 h-4 w-4 shrink-0" />
              <span>{item.title}</span>
            </span>
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </DisclosureButton>
          <DisclosurePanel className="space-y-1">
            {item.children?.map((child) => (
              <SidebarItemNode key={child.id} item={child} activePageId={activePageId} depth={depth + 1} onOpenPage={onOpenPage} />
            ))}
          </DisclosurePanel>
        </div>
      )}
    </Disclosure>
  );
}

export default function Sidebar({ groups, activePageId, collapsed, onToggleCollapsed, onOpenPage }: SidebarProps) {
  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-[#11141a]/95">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
        {!collapsed ? <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Guide</span> : null}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-[var(--primary)] hover:text-[var(--primary)] dark:border-slate-700 dark:text-slate-300"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="h-4.5 w-4.5" /> : <PanelLeftClose className="h-4.5 w-4.5" />}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {collapsed ? (
          <div className="space-y-3">
            {groups.flatMap((group) => group.items).map((item) => {
              const CollapsedIcon = resolveItemIcon(item.icon);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    const fallbackPageId = item.pageId ?? item.children?.[0]?.pageId;
                    if (fallbackPageId) {
                      onOpenPage(fallbackPageId);
                    }
                  }}
                  className={`flex h-9 w-full items-center justify-center rounded-lg text-xs font-semibold transition ${
                    itemContainsActive(item, activePageId)
                      ? "bg-[var(--brand-primary-soft)] text-[var(--primary-strong)] dark:bg-[rgba(123,199,146,0.16)] dark:text-[#dff2e5]"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                  }`}
                  title={item.title}
                >
                  <CollapsedIcon className="h-4.5 w-4.5" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.id}>
                <p className="guide-hornbill mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{group.title}</p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <SidebarItemNode key={item.id} item={item} activePageId={activePageId} onOpenPage={onOpenPage} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
