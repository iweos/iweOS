"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ResultPerformanceLineChartProps = {
  rows: Array<{
    subjectId: string;
    subjectName: string;
    total: number;
    classAverage: number;
  }>;
  compact?: boolean;
};

function shortenSubjectName(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function formatNumber(value: number | string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(1) : "-";
}

export default function ResultPerformanceLineChart({
  rows,
  compact = false,
}: ResultPerformanceLineChartProps) {
  if (rows.length === 0) {
    return (
      <div className="result-performance-empty">
        No score rows available yet to compare student performance against class average.
      </div>
    );
  }

  const chartData = rows.map((row) => ({
    subjectId: row.subjectId,
    subjectName: row.subjectName,
    subjectLabel: shortenSubjectName(row.subjectName, compact ? 10 : 14),
    student: Number(row.total),
    classAverage: Number(row.classAverage),
  }));

  return (
    <div className={`result-performance-card ${compact ? "is-compact" : ""}`}>
      <div className="result-performance-header">
        <div>
          <p className="section-heading mb-1">Performance vs class average</p>
          <p className="section-subtle mb-0">Subject-by-subject comparison for this result.</p>
        </div>
      </div>

      <div className={`chart-container result-performance-line-chart ${compact ? "is-compact" : ""}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: compact ? -18 : -10, bottom: compact ? 34 : 26 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(38, 65, 49, 0.12)" />
            <XAxis
              dataKey="subjectLabel"
              interval={0}
              angle={compact ? -32 : -20}
              height={compact ? 58 : 48}
              textAnchor="end"
              tick={{ fill: "#395241", fontSize: compact ? 10 : 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#395241", fontSize: compact ? 10 : 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number | string | undefined, name: string | undefined) => [
                formatNumber(value),
                name === "student" ? "Student" : "Class average",
              ]}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.subjectName ?? ""}
              contentStyle={{
                borderRadius: compact ? "0.7rem" : "0.9rem",
                border: "1px solid rgba(40, 88, 59, 0.12)",
                boxShadow: "0 18px 40px rgba(24, 39, 31, 0.12)",
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{
                fontSize: compact ? "11px" : "12px",
                paddingBottom: compact ? "8px" : "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="student"
              name="Student"
              stroke="#2f6b3f"
              strokeWidth={3}
              dot={{ r: compact ? 2.5 : 3.5, strokeWidth: 0, fill: "#2f6b3f" }}
              activeDot={{ r: compact ? 4 : 5 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="classAverage"
              name="Class average"
              stroke="#195da3"
              strokeWidth={3}
              dot={{ r: compact ? 2.5 : 3.5, strokeWidth: 0, fill: "#195da3" }}
              activeDot={{ r: compact ? 4 : 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
