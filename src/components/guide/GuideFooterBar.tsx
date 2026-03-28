import Link from "next/link";

type GuideFooterBarProps = {
  compact?: boolean;
};

export default function GuideFooterBar({ compact = false }: GuideFooterBarProps) {
  return (
    <div className={`guide-footer-bar${compact ? " is-compact" : ""}`}>
      <div className="guide-footer-copy">
        <span className="guide-footer-kicker">Need a walkthrough?</span>
        <div>
          <strong>School setup guide</strong>
          <p>Follow the full path from sign-up to live results, payments, and teacher workflows.</p>
        </div>
      </div>
      <Link href="/guide" className="btn btn-primary guide-footer-button">
        <i className="fas fa-book-open me-2" />
        Open Guide
      </Link>
    </div>
  );
}
