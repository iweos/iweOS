import { WorkspaceStat } from "@/components/workspace/WorkspaceUI";

type StatCardVariant = "primary" | "secondary" | "info" | "success" | "warning" | "danger" | "black";
type StatIconSize = "sm" | "md" | "lg";

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: string;
  cardVariant?: StatCardVariant;
  iconSize?: StatIconSize;
  delta?: string;
  className?: string;
};

function inferIcon(label: string) {
  const text = label.toLowerCase();
  if (text.includes("student")) return "fas fa-user-graduate";
  if (text.includes("teacher")) return "fas fa-chalkboard-teacher";
  if (text.includes("class")) return "fas fa-th-large";
  if (text.includes("subject")) return "fas fa-book-open";
  if (text.includes("term")) return "fas fa-calendar-alt";
  if (text.includes("collection")) return "fas fa-wallet";
  if (text.includes("payment")) return "fas fa-money-check-alt";
  if (text.includes("invoice")) return "fas fa-file-invoice-dollar";
  if (text.includes("rate")) return "fas fa-percentage";
  if (text.includes("outstanding") || text.includes("debtor")) return "fas fa-exclamation-circle";
  return "fas fa-chart-pie";
}

function inferVariant(label: string): StatCardVariant {
  const text = label.toLowerCase();
  if (text.includes("active") || text.includes("collected") || text.includes("paid")) return "success";
  if (text.includes("outstanding") || text.includes("pending") || text.includes("debtor")) return "danger";
  if (text.includes("rate") || text.includes("today")) return "info";
  if (text.includes("payment") || text.includes("collection")) return "primary";
  if (text.includes("class") || text.includes("subject") || text.includes("term")) return "secondary";
  return "primary";
}

function iconSizeClass(size: StatIconSize) {
  if (size === "sm") return "stat-icon-sm";
  if (size === "lg") return "stat-icon-lg";
  return "stat-icon-md";
}

function workspaceTone(variant: StatCardVariant) {
  if (variant === "info") return "blue" as const;
  if (variant === "warning" || variant === "secondary") return "gold" as const;
  if (variant === "danger") return "red" as const;
  if (variant === "black") return "ink" as const;
  return "forest" as const;
}

export default function StatCard({ label, value, icon, cardVariant, iconSize = "md", delta, className = "" }: StatCardProps) {
  const resolvedIcon = icon ?? inferIcon(label);
  const resolvedVariant = cardVariant ?? inferVariant(label);

  return (
    <WorkspaceStat
      label={label}
      value={value}
      detail={delta}
      tone={workspaceTone(resolvedVariant)}
      icon={<i className={`${resolvedIcon} ${iconSizeClass(iconSize)}`.trim()} />}
      className={className}
    />
  );
}
