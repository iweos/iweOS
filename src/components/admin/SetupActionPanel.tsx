import type { ReactNode } from "react";

type SetupActionPanelProps = {
  title: string;
  description: string;
  icon: string;
  children: ReactNode;
};

export default function SetupActionPanel({
  title,
  description,
  icon,
  children,
}: SetupActionPanelProps) {
  return (
    <details className="setup-action-panel">
      <summary>
        <span className="setup-action-icon" aria-hidden="true">
          <i className={icon} />
        </span>
        <span className="setup-action-copy">
          <strong>{title}</strong>
          <small>{description}</small>
        </span>
        <span className="setup-action-toggle" aria-hidden="true">
          <i className="fas fa-plus" />
        </span>
      </summary>
      <div className="setup-action-body">{children}</div>
    </details>
  );
}
