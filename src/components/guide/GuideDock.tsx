"use client";

import Link from "next/link";
import { MessageCircle, Send, X } from "lucide-react";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { faqs } from "@/lib/content";

export default function GuideDock() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<string>(faqs[0]?.question ?? "");

  const activeFaq = useMemo(() => faqs.find((faq) => faq.question === activeQuestion) ?? faqs[0], [activeQuestion]);

  if (!pathname || pathname.includes("/print") || pathname.startsWith("/app")) {
    return null;
  }

  return (
    <div className="guide-dock-chat">
      {open ? (
        <div className="guide-dock-chat-panel" role="dialog" aria-label="Frequently asked questions">
          <div className="guide-dock-chat-header">
            <div className="guide-dock-chat-title-wrap">
              <span className="guide-dock-chat-badge">
                <MessageCircle className="h-4 w-4" />
                FAQ
              </span>
              <div>
                <strong className="guide-dock-chat-title">How can we help?</strong>
                <p className="guide-dock-chat-subtitle">Quick answers in a chat-style support panel.</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="guide-dock-chat-close" aria-label="Close FAQ popup">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="guide-dock-chat-body">
            <div className="guide-dock-chat-bubble guide-dock-chat-bubble-assistant">
              <p>Choose a common question to see the answer instantly.</p>
            </div>

            <div className="guide-dock-chat-questions">
              {faqs.map((faq) => (
                <button
                  key={faq.question}
                  type="button"
                  onClick={() => setActiveQuestion(faq.question)}
                  className={`guide-dock-chat-question ${activeQuestion === faq.question ? "is-active" : ""}`}
                >
                  {faq.question}
                </button>
              ))}
            </div>

            {activeFaq ? (
              <>
                <div className="guide-dock-chat-bubble guide-dock-chat-bubble-user">
                  <p>{activeFaq.question}</p>
                </div>
                <div className="guide-dock-chat-bubble guide-dock-chat-bubble-assistant">
                  <p>{activeFaq.answer}</p>
                </div>
              </>
            ) : null}
          </div>

          <div className="guide-dock-chat-footer">
            <Link href="/guide" className="guide-dock-chat-guide-link">
              Open full guide
            </Link>
            <a href="mailto:support@iweos.io" className="guide-dock-chat-send">
              <Send className="h-4 w-4" />
              <span>Contact support</span>
            </a>
          </div>
        </div>
      ) : null}

      <button type="button" className="guide-dock-chat-trigger" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
        <span className="guide-dock-chat-trigger-icon">
          <MessageCircle className="h-5 w-5" />
        </span>
        <span className="guide-dock-copy">
          <strong>FAQs</strong>
        </span>
      </button>
    </div>
  );
}
