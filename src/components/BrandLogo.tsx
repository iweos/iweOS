"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type MouseEventHandler } from "react";
import { useRouter } from "next/navigation";

type BrandLogoProps = {
  href?: string;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  variant?: "light" | "dark";
  showText?: boolean;
  label?: string;
  interactiveLoader?: boolean;
  loaderDurationMs?: number;
};

function joinClasses(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function BrandLogo({
  href,
  className,
  iconClassName,
  textClassName,
  variant = "dark",
  showText = true,
  label = "ìwéOS",
  interactiveLoader = true,
  loaderDurationMs = 10000,
}: BrandLogoProps) {
  const router = useRouter();
  const logoClickTimerRef = useRef<number | null>(null);
  const quoteHideTimerRef = useRef<number | null>(null);
  const quoteIndexRef = useRef(0);
  const [activeQuote, setActiveQuote] = useState<string | null>(null);

  const logoQuotes = [
    "Calm systems build confident schools.",
    "Better records. Faster results. Less stress.",
    "Good school operations should feel effortless.",
  ];

  useEffect(
    () => () => {
      if (logoClickTimerRef.current !== null) {
        window.clearTimeout(logoClickTimerRef.current);
      }
      if (quoteHideTimerRef.current !== null) {
        window.clearTimeout(quoteHideTimerRef.current);
      }
    },
    [],
  );

  const toneClass = variant === "light" ? "text-white" : "text-slate-900";
  const rootClass = joinClasses("inline-flex items-center gap-2", className);
  const iconClass = joinClasses("fas fa-dove leading-none", toneClass, iconClassName);
  const nameClass = joinClasses("font-semibold tracking-tight leading-none", toneClass, textClassName);

  const handleLogoClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (!href || !interactiveLoader) {
      return;
    }

    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (logoClickTimerRef.current !== null) {
      return;
    }

    logoClickTimerRef.current = window.setTimeout(() => {
      const quote = logoQuotes[quoteIndexRef.current % logoQuotes.length];
      quoteIndexRef.current += 1;
      setActiveQuote(quote);
      if (quoteHideTimerRef.current !== null) {
        window.clearTimeout(quoteHideTimerRef.current);
      }
      quoteHideTimerRef.current = window.setTimeout(() => {
        setActiveQuote(null);
        quoteHideTimerRef.current = null;
      }, Math.min(Math.max(loaderDurationMs, 2200), 4200));
      logoClickTimerRef.current = null;
    }, 250);
  };

  const handleLogoDoubleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (!href || !interactiveLoader) {
      return;
    }

    event.preventDefault();

    if (logoClickTimerRef.current !== null) {
      window.clearTimeout(logoClickTimerRef.current);
      logoClickTimerRef.current = null;
    }
    if (quoteHideTimerRef.current !== null) {
      window.clearTimeout(quoteHideTimerRef.current);
      quoteHideTimerRef.current = null;
    }
    setActiveQuote(null);
    router.push("/");
  };

  const content = (
    <>
      <i className={iconClass} aria-hidden="true" />
      {showText ? <span className={nameClass}>{label}</span> : <span className="sr-only">{label}</span>}
    </>
  );

  if (href) {
    return (
      <span className="relative inline-flex">
        <Link
          href={href}
          className={rootClass}
          data-loading-indicator={interactiveLoader ? "off" : undefined}
          onClick={handleLogoClick}
          onDoubleClick={handleLogoDoubleClick}
        >
          {content}
        </Link>
        {activeQuote ? (
          <span className="pointer-events-none absolute left-1/2 top-[calc(100%+0.55rem)] z-50 w-max max-w-[220px] -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-[11px] font-medium leading-5 text-slate-700 shadow-[0_14px_30px_rgba(15,23,42,0.14)] dark:border-slate-700 dark:bg-[#161922] dark:text-slate-100">
            {activeQuote}
          </span>
        ) : null}
      </span>
    );
  }

  return <span className={rootClass}>{content}</span>;
}
