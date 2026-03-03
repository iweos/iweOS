import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  rightActions?: ReactNode;
  className?: string;
};

export default function PageHeader({ title, subtitle, rightActions, className = "" }: PageHeaderProps) {
  return (
    <header className={`admin-ui-page-header ${className}`}>
      <div>
        <h1 className="admin-ui-page-title">{title}</h1>
        {subtitle ? <p className="admin-ui-page-subtitle">{subtitle}</p> : null}
      </div>
      {rightActions ? <div className="admin-ui-page-actions">{rightActions}</div> : null}
    </header>
  );
}
