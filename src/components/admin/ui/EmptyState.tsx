import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-4">
      <p className="fw-semibold mb-1">{title}</p>
      {description ? <p className="text-muted mb-3">{description}</p> : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
}
