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

export default function StatCard({
  label,
  value,
  icon,
  cardVariant,
  iconSize = "md",
  delta,
  className = "",
}: StatCardProps) {
  const resolvedIcon = icon ?? inferIcon(label);
  const resolvedVariant = cardVariant ?? inferVariant(label);

  return (
    <div className={`card card-stats card-${resolvedVariant} card-round h-100 mb-0 ${className}`.trim()}>
      <div className="card-body">
        <div className="row align-items-center">
          <div className="col-5">
            <div className="icon-big text-center">
              <i className={`${resolvedIcon} ${iconSizeClass(iconSize)}`.trim()} />
            </div>
          </div>
          <div className="col-7 col-stats">
            <div className="numbers">
              <p className="card-category">{label}</p>
              <h4 className="card-title">{value}</h4>
              {delta ? <p className="card-delta mb-0">{delta}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
