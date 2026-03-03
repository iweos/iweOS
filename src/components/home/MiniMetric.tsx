type MiniMetricProps = {
  label: string;
  value: string;
  hint?: string;
};

export default function MiniMetric({ label, value, hint }: MiniMetricProps) {
  return (
    <div className="rounded-lg border border-[#e8dccf] bg-[#fffdfa] p-3 shadow-[var(--panel-shadow)]">
      <p className="text-[0.74rem] font-medium uppercase tracking-[0.09em] text-[#6b7280]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#111827]">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-[#6b7280]">{hint}</p> : null}
    </div>
  );
}
