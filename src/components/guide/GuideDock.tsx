"use client";

import Link from "next/link";
import { Download, MessageCircle, Send, Share2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { faqs } from "@/lib/content";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function GuideDock() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<string>(faqs[0]?.question ?? "");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosInstallHelp, setShowIosInstallHelp] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const activeFaq = useMemo(() => faqs.find((faq) => faq.question === activeQuestion) ?? faqs[0], [activeQuestion]);
  const isIosInstallHintEligible =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window.navigator as Navigator & { standalone?: boolean }).standalone;

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  if (!pathname || pathname.includes("/print") || pathname.startsWith("/app")) {
    return null;
  }

  async function handleInstallClick() {
    if (installPrompt) {
      setIsInstalling(true);
      try {
        await installPrompt.prompt();
        await installPrompt.userChoice;
      } finally {
        setInstallPrompt(null);
        setIsInstalling(false);
      }
      return;
    }

    if (isIosInstallHintEligible) {
      setShowIosInstallHelp((current) => !current);
    }
  }

  const showInstallAction = Boolean(installPrompt) || isIosInstallHintEligible;

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

            {showIosInstallHelp ? (
              <div className="guide-dock-chat-bubble guide-dock-chat-bubble-assistant">
                <p className="mb-2">To install iweOS on iPhone:</p>
                <p className="mb-0">Tap <strong>Share</strong>, then choose <strong>Add to Home Screen</strong>.</p>
              </div>
            ) : null}
          </div>

          <div className="guide-dock-chat-footer">
            <Link href="/guide" className="guide-dock-chat-guide-link">
              Open full guide
            </Link>
            {showInstallAction ? (
              <button type="button" className="guide-dock-chat-guide-link" onClick={handleInstallClick} disabled={isInstalling}>
                {installPrompt ? (
                  <>
                    <Download className="h-4 w-4" />
                    <span>{isInstalling ? "Preparing..." : "Install app"}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    <span>Add to Home Screen</span>
                  </>
                )}
              </button>
            ) : null}
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
