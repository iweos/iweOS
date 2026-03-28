"use client";

import Link from "next/link";

type GuideFooterBarProps = {
  compact?: boolean;
  showTourButton?: boolean;
};

export default function GuideFooterBar({ compact = false, showTourButton = false }: GuideFooterBarProps) {
  return (
    <div className={`guide-footer-bar${compact ? " is-compact" : ""}`} data-tour="tour-footer">
      <div className="guide-footer-copy" aria-hidden="true">
        <span className="guide-footer-kicker">
          <i className="fas fa-life-ring" />
        </span>
        <div>
          <strong>Support</strong>
          <p>Tour and guide</p>
        </div>
      </div>
      <div className="guide-footer-actions">
        {showTourButton ? (
          <button
            type="button"
            className="btn btn-outline-secondary guide-footer-button"
            onClick={() => window.dispatchEvent(new CustomEvent("iweos:open-tour"))}
          >
            <i className="fas fa-magic" />
            <span>Tour</span>
          </button>
        ) : null}
        <Link href="/guide" className="btn btn-primary guide-footer-button">
          <i className="fas fa-book-open" />
          <span>Guide</span>
        </Link>
      </div>
    </div>
  );
}
