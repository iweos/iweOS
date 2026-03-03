import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="admin-ui-empty">
      <p className="admin-ui-empty-title">{title}</p>
      {description ? <p className="admin-ui-empty-description">{description}</p> : null}
      {action ? <div className="admin-ui-empty-action">{action}</div> : null}
    </div>
  );
}
