"use client";

export default function PrintButton({ iconOnly = false }: { iconOnly?: boolean }) {
  return (
    <button type="button" className={iconOnly ? "result-export-icon" : "btn btn-primary"} aria-label="Print result" title="Print result" onClick={() => window.print()}>
      {iconOnly ? <i className="fas fa-print" aria-hidden="true" /> : "Print"}
    </button>
  );
}
