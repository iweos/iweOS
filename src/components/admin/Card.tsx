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
    <section className={`card ${className}`}>
      {(title || subtitle || action) ? (
        <header className="card-header">
          <div className="d-flex w-100 flex-wrap align-items-start justify-content-between gap-2">
            <div>
              {title ? <h4 className="card-title">{title}</h4> : null}
              {subtitle ? <p className="card-category mb-0">{subtitle}</p> : null}
            </div>
            {action ? <div>{action}</div> : null}
          </div>
        </header>
      ) : null}
      <div className="card-body">{children}</div>
    </section>
  );
}
