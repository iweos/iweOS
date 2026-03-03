"use client";

import { useState } from "react";
import { faqs } from "@/lib/content";

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="container py-14 sm:py-16" id="faq">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#0f766e]">FAQ</p>
        <h2 className="display mt-3 text-3xl leading-tight text-slate-900 sm:text-4xl">Common questions</h2>
      </header>

      <div className="mt-8 space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = index === openIndex;
          const panelId = `faq-panel-${index}`;
          const buttonId = `faq-button-${index}`;

          return (
            <article key={faq.question} className="rounded-xl border border-slate-200 bg-white">
              <h3>
                <button
                  id={buttonId}
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span>{faq.question}</span>
                  <span aria-hidden="true" className="text-slate-500">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={isOpen ? "block border-t border-slate-200 px-5 py-4" : "hidden"}
              >
                <p className="text-sm leading-relaxed text-slate-600">{faq.answer}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
