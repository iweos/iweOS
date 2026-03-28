"use client";

import Link from "next/link";

type GuideFooterBarProps = {
  compact?: boolean;
  showTourButton?: boolean;
};

export default function GuideFooterBar({ compact = false, showTourButton = false }: GuideFooterBarProps) {
  return (
    <div className={`guide-footer-bar${compact ? " is-compact" : ""}`} data-tour="tour-footer">
      <div className="guide-footer-copy">
        <span className="guide-footer-kicker">Need a walkthrough?</span>
        <div>
          <strong>School setup guide</strong>
          <p>Follow the full path from sign-up to live results, payments, and teacher workflows.</p>
        </div>
      </div>
      <div className="guide-footer-actions">
        {showTourButton ? (
          <button
            type="button"
            className="btn btn-outline-secondary guide-footer-button"
            onClick={() => window.dispatchEvent(new CustomEvent("iweos:open-tour"))}
          >
            <i className="fas fa-magic me-2" />
            Start Tour
          </button>
        ) : null}
        <Link href="/guide" className="btn btn-primary guide-footer-button">
          <i className="fas fa-book-open me-2" />
          Open Guide
        </Link>
      </div>
    </div>
  );
}
