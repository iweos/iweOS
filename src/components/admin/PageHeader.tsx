import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  rightActions?: ReactNode;
  className?: string;
};

export default function PageHeader({ title, subtitle, rightActions, className = "" }: PageHeaderProps) {
  return (
    <header className={`page-header workspace-page-heading ${className}`}>
      <div>
        <h1>{title}</h1>
        {subtitle ? <span className="text-muted">{subtitle}</span> : null}
      </div>
      {rightActions ? <div className="workspace-page-actions">{rightActions}</div> : null}
    </header>
  );
}
