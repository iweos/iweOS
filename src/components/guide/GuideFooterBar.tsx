"use client";

import Link from "next/link";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useState } from "react";
import BrandLogo from "@/components/BrandLogo";

type GuideFooterBarProps = {
  compact?: boolean;
  showTourButton?: boolean;
};

export default function GuideFooterBar({ compact = false, showTourButton = false }: GuideFooterBarProps) {
  const { signOut } = useClerk();
  const { sessionId } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent("iweos:pending-indicator", {
        detail: { durationMs: 9000 },
      }),
    );

    setIsSigningOut(true);
    const signOutPromise = sessionId ? signOut({ sessionId, redirectUrl: "/sign-in" }) : signOut({ redirectUrl: "/sign-in" });
    void signOutPromise.catch(() => {
      setIsSigningOut(false);
    });
  }

  return (
    <div className={`guide-footer-bar${compact ? " is-compact" : ""}`} data-tour="tour-footer">
      <div className="guide-footer-brand" aria-hidden="true">
        <BrandLogo href="/" variant="dark" className="guide-footer-logo" textClassName="guide-footer-logo-text" />
      </div>
      <div className="guide-footer-actions">
        {showTourButton ? (
          <button
            type="button"
            className="guide-footer-icon-button"
            onClick={() => window.dispatchEvent(new CustomEvent("iweos:open-tour"))}
            aria-label="Start tour"
            title="Start tour"
          >
            <i className="fas fa-magic" />
          </button>
        ) : null}
        <Link href="/guide" className="guide-footer-icon-button guide-footer-icon-button-primary" aria-label="Open guide" title="Open guide">
          <i className="fas fa-book-open" />
        </Link>
        <button
          type="button"
          className="guide-footer-icon-button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          aria-label="Sign out"
          title={isSigningOut ? "Signing out..." : "Sign out"}
        >
          <i className="fas fa-sign-out-alt" />
        </button>
      </div>
    </div>
  );
}
