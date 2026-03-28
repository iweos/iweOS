"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type GuideSection = {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
  links: Array<{ label: string; href: string }>;
  note: string;
};

type QuickTopic = {
  title: string;
  description: string;
  href: string;
  icon: string;
};

type GuideDocsClientProps = {
  sections: GuideSection[];
  quickTopics: QuickTopic[];
};

export default function GuideDocsClient({ sections, quickTopics }: GuideDocsClientProps) {
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();

  const filteredSections = useMemo(() => {
    if (!normalizedQuery) {
      return sections;
    }

    return sections.filter((section) => {
      const haystack = [section.title, section.summary, section.note, ...section.bullets].join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, sections]);

  const filteredTopics = useMemo(() => {
    if (!normalizedQuery) {
      return quickTopics;
    }

    return quickTopics.filter((topic) => {
      const haystack = `${topic.title} ${topic.description}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, quickTopics]);

  return (
    <>
      <section className="guide-support-hero">
        <div className="guide-support-hero-card">
          <p className="guide-docs-eyebrow">Support Center</p>
          <h2>How can we help you set up your school?</h2>
          <p>
            Search the setup guide, jump into common workflows, or use the in-app tour for a quick product walkthrough.
          </p>
          <label className="guide-support-search" htmlFor="guide-search">
            <i className="fas fa-search" aria-hidden="true" />
            <input
              id="guide-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search setup, teachers, results, payments..."
            />
          </label>
        </div>
      </section>

      <section className="guide-support-topics">
        <div className="guide-support-topic-grid">
          {filteredTopics.map((topic) => (
            <Link key={topic.title} href={topic.href} className="guide-support-topic-card">
              <span className="guide-support-topic-icon" aria-hidden="true">
                <i className={topic.icon} />
              </span>
              <div>
                <strong>{topic.title}</strong>
                <p>{topic.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="guide-docs-shell">
        <aside className="guide-docs-sidebar">
          <div className="guide-docs-sidebar-card">
            <p className="guide-docs-eyebrow">Setup Guide</p>
            <h1>School setup manual</h1>
            <p className="guide-docs-sidebar-intro">
              Follow the setup path from first sign-up to live grading, results, payments, and ongoing school operations.
            </p>
          </div>

          <div className="guide-docs-sidebar-card">
            <p className="guide-docs-mini-label">Sections</p>
            <ul className="guide-docs-link-list">
              {filteredSections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="guide-docs-content">
          {filteredSections.length === 0 ? (
            <section className="guide-docs-intro-block">
              <p className="guide-docs-breadcrumb">Documentation / Search</p>
              <h2>No matching guide sections</h2>
              <p>Try a broader keyword like results, students, teachers, payments, or setup.</p>
            </section>
          ) : (
            <>
              <section className="guide-docs-intro-block">
                <p className="guide-docs-breadcrumb">Documentation / School onboarding</p>
                <h2>Everything a school needs to go live on ìwéOS</h2>
                <p>
                  Use this guide as the master reference for rollout, staff onboarding, and day-to-day configuration. Search above to narrow it
                  down fast, or browse section by section like a handbook.
                </p>
                <div className="guide-docs-stat-grid">
                  <div className="guide-docs-stat">
                    <strong>{sections.length}</strong>
                    <span>Core sections</span>
                  </div>
                  <div className="guide-docs-stat">
                    <strong>3</strong>
                    <span>Main roles</span>
                  </div>
                  <div className="guide-docs-stat">
                    <strong>1</strong>
                    <span>Living handbook</span>
                  </div>
                </div>
              </section>

              {filteredSections.map((section, index) => (
                <section key={section.id} id={section.id} className="guide-docs-section">
                  <div className="guide-docs-section-head">
                    <span className="guide-docs-step-pill">{index + 1}</span>
                    <div>
                      <p className="guide-docs-section-label">{section.summary}</p>
                      <h3>{section.title}</h3>
                    </div>
                  </div>

                  <ul className="guide-docs-checks">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>
                        <i className="fas fa-check-circle" aria-hidden="true" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="guide-docs-action-row">
                    {section.links.map((link) => (
                      <Link key={`${section.id}-${link.href}`} href={link.href} className="guide-docs-link-pill">
                        {link.label}
                        <i className="fas fa-arrow-right" aria-hidden="true" />
                      </Link>
                    ))}
                  </div>

                  <div className="guide-docs-note">
                    <i className="fas fa-image" aria-hidden="true" />
                    <p>{section.note}</p>
                  </div>
                </section>
              ))}
            </>
          )}
        </main>

        <aside className="guide-docs-rightbar">
          <div className="guide-docs-right-card">
            <p className="guide-docs-mini-label">On this page</p>
            <ul className="guide-docs-outline">
              {filteredSections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="guide-docs-right-card">
            <p className="guide-docs-mini-label">In-app help</p>
            <p>Use the fixed support dock inside the app to reopen the guided tour or jump back into the setup guide at any time.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
