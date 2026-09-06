import type { ReactNode } from "react";

type Tone = "forest" | "blue" | "gold" | "red" | "ink";

export function WorkspacePageHeader({ eyebrow, title, description, actions, className = "" }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode; className?: string }) {
  return <header className={`workspace-page-heading ${className}`.trim()}><div>{eyebrow ? <p>{eyebrow}</p> : null}<h1>{title}</h1>{description ? <span>{description}</span> : null}</div>{actions ? <div className="workspace-page-actions">{actions}</div> : null}</header>;
}

export function WorkspaceHero({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <section className="workspace-hero"><div><p>{eyebrow}</p><h1>{title}</h1><span>{description}</span></div>{action ? <div className="workspace-hero-action">{action}</div> : null}</section>;
}

export function WorkspaceStatGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`workspace-stat-grid ${className}`.trim()}>{children}</section>;
}

export function WorkspaceStat({ label, value, detail, icon, tone = "forest", className = "" }: { label: string; value: ReactNode; detail?: ReactNode; icon?: ReactNode; tone?: Tone; className?: string }) {
  return <article className={`workspace-stat workspace-tone-${tone} ${className}`.trim()}><div className="workspace-stat-copy"><span>{label}</span><strong>{value}</strong>{detail ? <small>{detail}</small> : null}</div>{icon ? <i className="workspace-stat-icon" aria-hidden="true">{icon}</i> : null}</article>;
}

export function WorkspacePanel({ title, eyebrow, description, action, children, className = "", bodyClassName = "" }: { title?: string; eyebrow?: string; description?: string; action?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string }) {
  return <section className={`workspace-panel ${className}`.trim()}>{title || eyebrow || description || action ? <header className="workspace-panel-heading"><div>{eyebrow ? <p>{eyebrow}</p> : null}{title ? <h2>{title}</h2> : null}{description ? <span>{description}</span> : null}</div>{action ? <div className="workspace-panel-action">{action}</div> : null}</header> : null}<div className={`workspace-panel-body ${bodyClassName}`.trim()}>{children}</div></section>;
}

export function WorkspaceContentGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`workspace-content-grid ${className}`.trim()}>{children}</div>;
}
