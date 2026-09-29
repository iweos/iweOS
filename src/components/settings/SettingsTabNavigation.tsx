"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type SettingsTabItem = {
  id: string;
  label: string;
  description: string;
  icon: string;
};

type SettingsTabNavigationProps = {
  tabs: readonly SettingsTabItem[];
  activeTab: string;
};

export default function SettingsTabNavigation({ tabs, activeTab }: SettingsTabNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const activeTabRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeTab]);

  return (
    <nav aria-label="School settings" role="tablist">
      {tabs.map((tab) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab.id);
        params.delete("status");
        params.delete("message");
        const active = activeTab === tab.id;
        const pending = pendingTab === tab.id && !active;

        return (
          <Link
            key={tab.id}
            ref={active ? activeTabRef : undefined}
            href={`${pathname}?${params.toString()}`}
            className={active ? "is-active" : ""}
            aria-current={active ? "page" : undefined}
            role="tab"
            aria-selected={active}
            aria-busy={pending}
            scroll={false}
            onClick={() => {
              if (!active) setPendingTab(tab.id);
            }}
          >
            <span><i className={pending ? "fas fa-circle-notch fa-spin" : tab.icon} aria-hidden="true" /></span>
            <div><strong>{tab.label}</strong><small>{tab.description}</small></div>
          </Link>
        );
      })}
    </nav>
  );
}
