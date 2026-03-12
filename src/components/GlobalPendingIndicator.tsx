"use client";

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const MIN_VISIBLE_MS = 260;
const MAX_VISIBLE_MS = 18000;
const NO_NETWORK_GRACE_MS = 1100;

type LoaderQuote = {
  text: string;
  author: string;
  source: string;
};

const LOADER_QUOTES: LoaderQuote[] = [
  {
    text: "Education is the most powerful weapon that can be used to change the world.",
    author: "Nelson Mandela",
    source: "Nelson Mandela Foundation",
  },
  {
    text: "Education is one of the blessings of life and one of its necessities.",
    author: "Malala Yousafzai",
    source: "Nobel Lecture (2014)",
  },
  {
    text: "The world can no longer accept that basic education is enough.",
    author: "Malala Yousafzai",
    source: "Nobel Lecture (2014)",
  },
  {
    text: "If I have seen further it is by standing on the shoulders of giants.",
    author: "Isaac Newton",
    source: "Letter to Robert Hooke (1675)",
  },
  {
    text: "The important thing is not to stop questioning. Curiosity has its own reason for existence.",
    author: "Albert Einstein",
    source: "Statement quoted in LIFE (1955)",
  },
];

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function isInternalNavigationLink(anchor: HTMLAnchorElement) {
  const rawHref = anchor.getAttribute("href");
  if (!rawHref || rawHref.startsWith("#")) {
    return false;
  }
  if (anchor.target && anchor.target !== "_self") {
    return false;
  }
  if (anchor.hasAttribute("download")) {
    return false;
  }
  if (rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) {
    return false;
  }

  try {
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) {
      return false;
    }

    const current = new URL(window.location.href);
    return url.pathname !== current.pathname || url.search !== current.search || url.hash !== current.hash;
  } catch {
    return false;
  }
}

function getSubmitter(event: Event) {
  const submitEvent = event as SubmitEvent;
  if (submitEvent.submitter instanceof HTMLElement) {
    return submitEvent.submitter;
  }

  const form = event.target;
  if (!(form instanceof HTMLFormElement)) {
    return null;
  }

  return form.querySelector<HTMLElement>("button[type='submit'], input[type='submit']");
}

function isInsideLoadingOptOut(element: Element | null) {
  return Boolean(element?.closest("[data-loading-indicator='off']"));
}

function isInsideClerkComponent(element: Element | null) {
  return Boolean(
    element?.closest(
      [
        ".cl-rootBox",
        ".cl-cardBox",
        "[id^='clerk']",
        "[class^='cl-']",
        "[class*=' cl-']",
      ].join(","),
    ),
  );
}

function toDurationMs(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 10000;
  }
  return Math.max(MIN_VISIBLE_MS, Math.floor(parsed));
}

export default function GlobalPendingIndicator() {
  const [visible, setVisible] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [activeQuote, setActiveQuote] = useState<LoaderQuote | null>(null);
  const [typedQuote, setTypedQuote] = useState("");
  const [manualDurationMs, setManualDurationMs] = useState(10000);
  const [manualRunId, setManualRunId] = useState(0);
  const pathname = usePathname();

  const isVisibleRef = useRef(false);
  const startedAtRef = useRef(0);
  const trackedRequestCountRef = useRef(0);
  const watchNetworkRef = useRef(false);
  const triggerElRef = useRef<HTMLElement | null>(null);
  const triggerWasDisabledRef = useRef<boolean | null>(null);
  const lastPathnameRef = useRef(pathname);
  const minTimerRef = useRef<number | null>(null);
  const maxTimerRef = useRef<number | null>(null);
  const noNetworkTimerRef = useRef<number | null>(null);
  const quoteTypingTimerRef = useRef<number | null>(null);
  const lastQuoteIndexRef = useRef<number>(-1);

  const clearTimers = useCallback(() => {
    if (minTimerRef.current !== null) {
      window.clearTimeout(minTimerRef.current);
      minTimerRef.current = null;
    }
    if (maxTimerRef.current !== null) {
      window.clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    if (noNetworkTimerRef.current !== null) {
      window.clearTimeout(noNetworkTimerRef.current);
      noNetworkTimerRef.current = null;
    }
  }, []);

  const clearTriggerElement = useCallback(() => {
    const triggerEl = triggerElRef.current;
    if (!triggerEl) {
      return;
    }

    triggerEl.classList.remove("is-pending-action");
    triggerEl.removeAttribute("aria-busy");

    if (triggerEl instanceof HTMLButtonElement || triggerEl instanceof HTMLInputElement) {
      if (triggerWasDisabledRef.current === false) {
        triggerEl.disabled = false;
      }
    }

    triggerElRef.current = null;
    triggerWasDisabledRef.current = null;
  }, []);

  const clearQuoteTypingTimer = useCallback(() => {
    if (quoteTypingTimerRef.current !== null) {
      window.clearInterval(quoteTypingTimerRef.current);
      quoteTypingTimerRef.current = null;
    }
  }, []);

  const finishPending = useCallback(
    (force = false) => {
      if (!isVisibleRef.current) {
        return;
      }

      const elapsed = Date.now() - startedAtRef.current;
      const waitMs = force ? 0 : Math.max(0, MIN_VISIBLE_MS - elapsed);

      if (minTimerRef.current !== null) {
        window.clearTimeout(minTimerRef.current);
      }

      minTimerRef.current = window.setTimeout(() => {
        clearTimers();
        clearTriggerElement();
        clearQuoteTypingTimer();
        watchNetworkRef.current = false;
        trackedRequestCountRef.current = 0;
        isVisibleRef.current = false;
        setManualMode(false);
        setManualDurationMs(10000);
        setActiveQuote(null);
        setTypedQuote("");
        setVisible(false);
      }, waitMs);
    },
    [clearQuoteTypingTimer, clearTimers, clearTriggerElement],
  );

  const beginPending = useCallback(
    (triggerEl: HTMLElement | null) => {
      if (isVisibleRef.current) {
        return;
      }

      isVisibleRef.current = true;
      startedAtRef.current = Date.now();
      trackedRequestCountRef.current = 0;
      watchNetworkRef.current = true;
      setManualMode(false);
      setManualDurationMs(10000);
      setActiveQuote(null);
      setTypedQuote("");
      setVisible(true);

      clearTimers();
      maxTimerRef.current = window.setTimeout(() => finishPending(true), MAX_VISIBLE_MS);
      noNetworkTimerRef.current = window.setTimeout(() => {
        if (trackedRequestCountRef.current === 0) {
          finishPending();
        }
      }, NO_NETWORK_GRACE_MS);

      clearTriggerElement();
      if (!triggerEl) {
        return;
      }

      triggerElRef.current = triggerEl;
      triggerEl.classList.add("is-pending-action");
      triggerEl.setAttribute("aria-busy", "true");
      if (triggerEl instanceof HTMLButtonElement || triggerEl instanceof HTMLInputElement) {
        triggerWasDisabledRef.current = triggerEl.disabled;
        triggerEl.disabled = true;
      }
    },
    [clearTimers, clearTriggerElement, finishPending],
  );

  const beginManualPending = useCallback(
    (durationMs: number) => {
      const nextIndex = LOADER_QUOTES.length <= 1
        ? 0
        : (() => {
            let picked = Math.floor(Math.random() * LOADER_QUOTES.length);
            while (picked === lastQuoteIndexRef.current) {
              picked = Math.floor(Math.random() * LOADER_QUOTES.length);
            }
            return picked;
          })();
      lastQuoteIndexRef.current = nextIndex;

      clearTimers();
      clearTriggerElement();
      clearQuoteTypingTimer();

      isVisibleRef.current = true;
      startedAtRef.current = Date.now();
      trackedRequestCountRef.current = 0;
      watchNetworkRef.current = false;
      setManualMode(true);
      setManualDurationMs(durationMs);
      setManualRunId((current) => current + 1);
      setActiveQuote(LOADER_QUOTES[nextIndex] ?? null);
      setTypedQuote("");
      setVisible(true);

      maxTimerRef.current = window.setTimeout(() => finishPending(true), durationMs);
    },
    [clearQuoteTypingTimer, clearTimers, clearTriggerElement, finishPending],
  );

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args) => {
      const shouldTrack = watchNetworkRef.current;
      if (shouldTrack) {
        trackedRequestCountRef.current += 1;
      }

      try {
        return await originalFetch(...args);
      } finally {
        if (shouldTrack) {
          trackedRequestCountRef.current = Math.max(0, trackedRequestCountRef.current - 1);
          if (trackedRequestCountRef.current === 0) {
            window.setTimeout(() => {
              if (watchNetworkRef.current && trackedRequestCountRef.current === 0) {
                finishPending();
              }
            }, 120);
          }
        }
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [finishPending]);

  useEffect(() => {
    const onManualPending = (event: Event) => {
      const customEvent = event as CustomEvent<{ durationMs?: number }>;
      beginManualPending(toDurationMs(customEvent.detail?.durationMs));
    };

    window.addEventListener("iweos:pending-indicator", onManualPending as EventListener);
    return () => {
      window.removeEventListener("iweos:pending-indicator", onManualPending as EventListener);
    };
  }, [beginManualPending]);

  useEffect(() => {
    if (!manualMode || !activeQuote) {
      clearQuoteTypingTimer();
      return;
    }

    const text = activeQuote.text;
    if (!text) {
      return;
    }

    let index = 0;
    setTypedQuote("");
    quoteTypingTimerRef.current = window.setInterval(() => {
      index += 1;
      setTypedQuote(text.slice(0, index));

      if (index >= text.length && quoteTypingTimerRef.current !== null) {
        window.clearInterval(quoteTypingTimerRef.current);
        quoteTypingTimerRef.current = null;
      }
    }, 28);

    return () => {
      clearQuoteTypingTimer();
    };
  }, [activeQuote, clearQuoteTypingTimer, manualMode]);

  useEffect(() => {
    const onSubmit = (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) {
        return;
      }
      if (isInsideLoadingOptOut(form) || isInsideClerkComponent(form)) {
        return;
      }

      const submitter = getSubmitter(event);
      if (submitter && (isInsideLoadingOptOut(submitter) || isInsideClerkComponent(submitter))) {
        return;
      }
      if (submitter?.dataset.loadingIndicator === "off") {
        return;
      }

      beginPending(submitter);
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || isModifiedClick(event)) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement) || !isInternalNavigationLink(anchor)) {
        return;
      }
      if (isInsideLoadingOptOut(anchor) || isInsideClerkComponent(anchor)) {
        return;
      }
      if (anchor.dataset.loadingIndicator === "off") {
        return;
      }

      beginPending(anchor);
    };

    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("click", onClick, true);
    };
  }, [beginPending]);

  useEffect(() => {
    if (lastPathnameRef.current === pathname) {
      return;
    }
    lastPathnameRef.current = pathname;

    const timerId = window.setTimeout(() => finishPending(), 0);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [finishPending, pathname]);

  useEffect(
    () => () => {
      clearTimers();
      clearTriggerElement();
      clearQuoteTypingTimer();
      isVisibleRef.current = false;
      watchNetworkRef.current = false;
      trackedRequestCountRef.current = 0;
      setManualMode(false);
      setManualDurationMs(10000);
      setActiveQuote(null);
      setTypedQuote("");
    },
    [clearQuoteTypingTimer, clearTimers, clearTriggerElement],
  );

  const indicatorStyle: CSSProperties | undefined = manualMode
    ? ({ ["--logo-fill-ms" as string]: `${manualDurationMs}ms` } as CSSProperties)
    : undefined;

  return (
    <>
      <div className={`global-pending-bar${visible ? " is-visible" : ""}`} aria-hidden="true" />
      <div
        className={`global-pending-indicator${visible ? " is-visible" : ""}${manualMode ? " is-logo-mode" : ""}`}
        style={indicatorStyle}
        role="status"
        aria-live="polite"
        aria-hidden={!visible}
      >
        <span className="global-pending-bird" aria-hidden="true" key={manualMode ? `logo-${manualRunId}` : "default"}>
          <i className="fas fa-dove bird-base" />
          <span className="bird-fill-mask">
            <i className="fas fa-dove bird-fill" />
          </span>
        </span>
        {manualMode && activeQuote ? (
          <span className="global-pending-copy">
            <span className="global-pending-quote">
              {typedQuote}
              <span className="global-pending-caret" aria-hidden="true" />
            </span>
            <span className="global-pending-attribution">
              {activeQuote.author} - {activeQuote.source}
            </span>
          </span>
        ) : (
          <span className="global-pending-label">Loading</span>
        )}
      </div>
    </>
  );
}
