"use client";

import Link from "next/link";
import { useEffect, useRef, type MouseEventHandler } from "react";
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

  useEffect(
    () => () => {
      if (logoClickTimerRef.current !== null) {
        window.clearTimeout(logoClickTimerRef.current);
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
      window.clearTimeout(logoClickTimerRef.current);
      logoClickTimerRef.current = null;
      router.push("/");
      return;
    }

    logoClickTimerRef.current = window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("iweos:pending-indicator", {
          detail: { durationMs: loaderDurationMs },
        }),
      );
      logoClickTimerRef.current = null;
    }, 250);
  };

  const content = (
    <>
      <i className={iconClass} aria-hidden="true" />
      {showText ? <span className={nameClass}>{label}</span> : <span className="sr-only">{label}</span>}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={rootClass}
        data-loading-indicator={interactiveLoader ? "off" : undefined}
        onClick={handleLogoClick}
      >
        {content}
      </Link>
    );
  }

  return <span className={rootClass}>{content}</span>;
}
