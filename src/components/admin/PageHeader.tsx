import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  rightActions?: ReactNode;
  className?: string;
};

export default function PageHeader({ title, subtitle, rightActions, className = "" }: PageHeaderProps) {
  return (
    <header className={`page-header d-flex flex-wrap align-items-start justify-content-between ${className}`}>
      <div>
        <h3 className="fw-bold mb-1">{title}</h3>
        {subtitle ? <p className="text-muted mb-0">{subtitle}</p> : null}
      </div>
      {rightActions ? <div className="ms-md-auto py-2 py-md-0 d-flex flex-wrap gap-2">{rightActions}</div> : null}
    </header>
  );
}
