"use client";

import { useState } from "react";

type ShareResultLinkButtonProps = {
  href: string;
  title?: string;
  text?: string;
  className?: string;
};

function resolveShareUrl(href: string) {
  if (typeof window === "undefined") {
    return href;
  }

  try {
    return new URL(href, window.location.origin).toString();
  } catch {
    return href;
  }
}

export default function ShareResultLinkButton({
  href,
  title = "Shared student result",
  text = "Open this student result",
  className = "btn btn-primary",
}: ShareResultLinkButtonProps) {
  const [status, setStatus] = useState<"idle" | "sharing" | "copied">("idle");

  async function handleShare() {
    const shareUrl = resolveShareUrl(href);
    setStatus("sharing");

    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({
          title,
          text,
          url: shareUrl,
        });
        setStatus("idle");
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setStatus("copied");
        window.setTimeout(() => setStatus("idle"), 1800);
        return;
      }

      window.prompt("Copy this shared result link", shareUrl);
      setStatus("idle");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setStatus("idle");
        return;
      }

      window.alert(error instanceof Error ? error.message : "Could not share this result link right now.");
      setStatus("idle");
    }
  }

  return (
    <button type="button" className={className} onClick={handleShare} disabled={status === "sharing"}>
      {status === "sharing" ? "Sharing..." : status === "copied" ? "Link copied" : "Share link"}
    </button>
  );
}
