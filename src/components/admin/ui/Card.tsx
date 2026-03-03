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
    <section className={`admin-ui-card ${className}`}>
      {(title || subtitle || action) && (
        <header className="admin-ui-card-header">
          <div>
            {title ? <h3 className="admin-ui-card-title">{title}</h3> : null}
            {subtitle ? <p className="admin-ui-card-subtitle">{subtitle}</p> : null}
          </div>
          {action ? <div>{action}</div> : null}
        </header>
      )}
      {children}
    </section>
  );
}
