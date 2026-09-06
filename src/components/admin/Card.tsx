import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

export default function Card({ title, subtitle, action, className = "", children }: CardProps) {
  return (
    <section className={`card workspace-panel ${className}`}>
      {(title || subtitle || action) ? (
        <header className="card-header workspace-panel-heading">
          <div>
            {title ? <h2 className="card-title">{title}</h2> : null}
            {subtitle ? <span className="card-category mb-0">{subtitle}</span> : null}
          </div>
          {action ? <div className="workspace-panel-action">{action}</div> : null}
        </header>
      ) : null}
      <div className="card-body workspace-panel-body">{children}</div>
    </section>
  );
}
