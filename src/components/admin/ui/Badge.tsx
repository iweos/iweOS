import type { ReactNode } from "react";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "primary" | "brown";

type BadgeProps = {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
};

export default function Badge({ tone = "neutral", className = "", children }: BadgeProps) {
  return <span className={`admin-ui-badge admin-ui-badge-${tone} ${className}`}>{children}</span>;
}
