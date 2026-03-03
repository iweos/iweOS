import Card from "@/components/admin/ui/Card";

type StatCardProps = {
  label: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down" | "neutral";
};

export default function StatCard({ label, value, delta, trend = "neutral" }: StatCardProps) {
  const tone = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-600" : "text-neutral-500";

  return (
    <Card className="admin-ui-stat-card">
      <p className="admin-ui-stat-label">{label}</p>
      <p className="admin-ui-stat-value">{value}</p>
      {delta ? <p className={`admin-ui-stat-delta ${tone}`}>{delta}</p> : null}
    </Card>
  );
}
