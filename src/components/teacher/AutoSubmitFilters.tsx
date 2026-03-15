"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type AutoSubmitFiltersProps = {
  readyLabel?: string;
  className?: string;
};

export default function AutoSubmitFilters({
  readyLabel = "Ready",
  className = "",
}: AutoSubmitFiltersProps) {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [manualPending, setManualPending] = useState(false);
  const lastQueryRef = useRef(searchParams.toString());

  useEffect(() => {
    const currentQuery = searchParams.toString();
    if (currentQuery === lastQueryRef.current) {
      return;
    }

    lastQueryRef.current = currentQuery;
    setManualPending(false);
  }, [searchParams]);

  useEffect(() => {
    const anchor = anchorRef.current;
    const form = anchor?.closest("form");

    if (!form) {
      return;
    }

    function handleChange(event: Event) {
      const liveForm = form;
      if (!liveForm) {
        return;
      }

      const target = event.target;
      if (!(target instanceof HTMLSelectElement || target instanceof HTMLInputElement)) {
        return;
      }

      if (target.type === "hidden") {
        return;
      }

      const formData = new FormData(liveForm);
      const nextParams = new URLSearchParams();

      for (const [key, value] of formData.entries()) {
        const stringValue = String(value).trim();
        if (!stringValue) {
          continue;
        }
        nextParams.set(key, stringValue);
      }

      const nextQuery = nextParams.toString();
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) {
        return;
      }

      lastQueryRef.current = nextQuery;
      setManualPending(true);
      startTransition(() => {
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
      });
    }

    form.addEventListener("change", handleChange);
    return () => {
      form.removeEventListener("change", handleChange);
    };
  }, [pathname, router, searchParams]);

  return (
    <div ref={anchorRef} className={`inline-flex min-h-[42px] items-center ${className}`.trim()}>
      <AutoSubmitStatus isLoading={isPending || manualPending} readyLabel={readyLabel} />
    </div>
  );
}

function AutoSubmitStatus({ isLoading, readyLabel }: { isLoading: boolean; readyLabel: string }) {
  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-[var(--muted)]">
        <span className="global-pending-bird inline-bird-loader" aria-hidden="true">
          <i className="fas fa-dove bird-base" />
          <span className="bird-fill-mask">
            <i className="fas fa-dove bird-fill" />
          </span>
        </span>
        <span>Loading...</span>
      </span>
    );
  }

  return <span className="inline-flex items-center gap-2 text-xs text-[var(--muted)]">{readyLabel}</span>;
}
