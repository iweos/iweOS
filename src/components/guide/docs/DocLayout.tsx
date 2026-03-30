"use client";

import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { ChevronRight, LifeBuoy, MessageSquareHeart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import SearchModal from "./SearchModal";
import CardGrid from "./CardGrid";
import CodeBlock from "./CodeBlock";
import APIEndpointPanel from "./APIEndpointPanel";
import type { DocPage, DocsTab, DocsTabId, SidebarGroup } from "./types";

type DocLayoutProps = {
  tabs: DocsTab[];
  groups: SidebarGroup[];
  pages: DocPage[];
};

function hornbillStyle() {
  return { fontFamily: "var(--font-guide-hornbill), var(--font-display), ui-serif, Georgia, serif" };
}

function HelpfulPrompt({ label = "Was this helpful?" }: { label?: string }) {
  const [selection, setSelection] = useState<"yes" | "no" | null>(null);

  return (
    <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-[#13161c]">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Your feedback helps us keep this guide useful as features change.</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSelection("yes")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            selection === "yes"
              ? "bg-[var(--brand-primary-soft)] text-[var(--primary-strong)] dark:bg-[rgba(123,199,146,0.16)] dark:text-[#dff2e5]"
              : "border border-slate-200 bg-white text-slate-700 hover:border-[var(--primary)] dark:border-slate-700 dark:bg-transparent dark:text-slate-200"
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => setSelection("no")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            selection === "no"
              ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200"
              : "border border-slate-200 bg-white text-slate-700 hover:border-[var(--primary)] dark:border-slate-700 dark:bg-transparent dark:text-slate-200"
          }`}
        >
          Not yet
        </button>
      </div>
    </div>
  );
}

export default function DocLayout({ tabs, groups, pages }: DocLayoutProps) {
  const [activePageId, setActivePageId] = useState(pages[0]?.id ?? "");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const pagesById = useMemo(() => new Map(pages.map((page) => [page.id, page])), [pages]);
  const activePage = pagesById.get(activePageId) ?? pages[0];
  const activeTab = activePage?.tab ?? tabs[0]?.id;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function openPage(pageId: string) {
    setActivePageId(pageId);
    setMobileSidebarOpen(false);
  }

  function handleSelectTab(tabId: DocsTabId) {
    const firstPageForTab = pages.find((page) => page.tab === tabId);
    if (firstPageForTab) {
      setActivePageId(firstPageForTab.id);
    }
  }

  const sections = activePage?.sections ?? [];

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 dark:bg-[#0d1117] dark:text-white">
      <Header
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
      />

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)_280px]">
        <aside className={`${sidebarCollapsed ? "hidden lg:block lg:w-[92px]" : "hidden lg:block lg:w-[300px]"} h-[calc(100vh-4rem)] sticky top-16`}>
          <Sidebar
            groups={groups}
            activePageId={activePage.id}
            collapsed={sidebarCollapsed}
            onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
            onOpenPage={openPage}
          />
        </aside>

        <main className="min-w-0 border-x border-slate-200 bg-[#fafafa] px-5 py-8 lg:px-10 dark:border-slate-800 dark:bg-[#0d1117]">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span>{tabs.find((tab) => tab.id === activePage.tab)?.label}</span>
              <ChevronRight className="h-4 w-4" />
              <span>{activePage.title}</span>
            </div>

            {activePage.kind === "help" ? (
              <section className="py-6 text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(245,158,11,0.22)] bg-[rgba(245,158,11,0.08)] px-4 py-2 text-sm font-semibold text-[#c46f00]">
                  <LifeBuoy className="h-4 w-4" />
                  Help Center
                </span>
                <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl dark:text-white" style={hornbillStyle()}>
                  {activePage.heroTitle ?? activePage.title}
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                  {activePage.heroDescription ?? activePage.description}
                </p>
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[var(--primary)] hover:text-[var(--primary)] dark:border-slate-700 dark:bg-[#13161c] dark:text-slate-200"
                >
                  <MessageSquareHeart className="h-4 w-4" />
                  Ask Assistant
                </button>
                {activePage.cards?.length ? <div className="mt-10 text-left"><CardGrid cards={activePage.cards} onOpenPage={openPage} /></div> : null}
              </section>
            ) : (
              <>
                <div className="mb-8">
                  {activePage.badge ? (
                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:border-slate-700 dark:bg-[#13161c] dark:text-slate-400">
                      {activePage.badge}
                    </span>
                  ) : null}
                  <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-[3.15rem] dark:text-white" style={hornbillStyle()}>
                    {activePage.title}
                  </h1>
                  <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">{activePage.description}</p>
                </div>

                {activePage.cards?.length ? (
                  <div className="mb-10">
                    <CardGrid cards={activePage.cards} onOpenPage={openPage} />
                  </div>
                ) : null}

                <div className="space-y-10">
                  {sections.map((section) => (
                    <section key={section.id} id={section.id} className="scroll-mt-24">
                      {section.eyebrow ? (
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">{section.eyebrow}</p>
                      ) : null}
                      <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white" style={hornbillStyle()}>
                        {section.title}
                      </h2>
                      {section.body?.map((paragraph) => (
                        <p key={paragraph} className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
                          {paragraph}
                        </p>
                      ))}
                      {section.bullets?.length ? (
                        <ul className="mt-5 space-y-3">
                          {section.bullets.map((bullet) => (
                            <li key={bullet} className="flex gap-3 text-base leading-7 text-slate-600 dark:text-slate-300">
                              <span className="mt-2 inline-block h-2 w-2 rounded-full bg-[var(--primary)]" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {section.codeBlocks?.length ? (
                        <div className="mt-6 space-y-5">
                          {section.codeBlocks.map((block) => (
                            <CodeBlock key={`${section.id}-${block.language}-${block.code.slice(0, 12)}`} block={block} />
                          ))}
                        </div>
                      ) : null}
                    </section>
                  ))}
                </div>

                <HelpfulPrompt label={activePage.helpfulPrompt} />
              </>
            )}
          </div>
        </main>

        <aside className="hidden border-l border-slate-200 bg-[#fcfcfc] px-5 py-8 lg:block dark:border-slate-800 dark:bg-[#0f1117]">
          {activePage.kind === "doc" && activePage.endpoints?.length ? (
            <APIEndpointPanel
              endpoints={activePage.endpoints}
              sections={sections.map((section) => ({ id: section.id, title: section.title }))}
            />
          ) : (
            <div className="sticky top-[5.25rem] space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-[#13161c]">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">On this page</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a href={`#${section.id}`} className="transition hover:text-[var(--primary)]">
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-[#13161c]">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Need help?</p>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Use search to jump between guides quickly, or reopen the in-app tour from the footer inside the school workspace.
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>

      <Dialog open={mobileSidebarOpen} onClose={setMobileSidebarOpen} className="relative z-[70] lg:hidden">
        <DialogBackdrop className="fixed inset-0 bg-slate-950/35 backdrop-blur-sm" />
        <div className="fixed inset-0 flex">
          <DialogPanel className="h-full w-[88vw] max-w-sm bg-white shadow-2xl dark:bg-[#11141a]">
            <Sidebar
              groups={groups}
              activePageId={activePage.id}
              collapsed={false}
              onToggleCollapsed={() => undefined}
              onOpenPage={openPage}
            />
          </DialogPanel>
        </div>
      </Dialog>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} pages={pages} onOpenPage={openPage} />
    </div>
  );
}
