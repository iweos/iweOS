import type { ReactNode } from "react";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "primary" | "brown";

type BadgeProps = {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
};

export default function Badge({ tone = "neutral", className = "", children }: BadgeProps) {
  const toneClass =
    tone === "success"
      ? "badge-success"
      : tone === "warning"
        ? "badge-warning"
        : tone === "danger"
          ? "badge-danger"
          : tone === "primary"
            ? "badge-primary"
            : tone === "brown"
              ? "badge-brown"
              : "badge-light text-dark";

  return <span className={`badge ${toneClass} ${className}`.trim()}>{children}</span>;
}
