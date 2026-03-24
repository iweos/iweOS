"use client";

import { useMemo, useState } from "react";
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
  studentFirstName: string;
  rows: Array<{
    subjectId: string;
    subjectName: string;
    total: number;
    classAverage: number;
    classHighest: number;
    classLowest: number;
  }>;
  compact?: boolean;
  showExtendedBenchmarks?: boolean;
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
  studentFirstName,
  rows,
  compact = false,
  showExtendedBenchmarks = true,
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
    classHighest: Number(row.classHighest),
    classLowest: Number(row.classLowest),
  }));
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>(() => ({
    student: true,
    classAverage: true,
    classHighest: true,
    classLowest: true,
  }));
  const series = useMemo(
    () =>
      [
        {
          dataKey: "student",
          name: studentFirstName || "Student",
          stroke: "#2f6b3f",
        },
        {
          dataKey: "classAverage",
          name: "Class average",
          stroke: "#1d8cf8",
        },
        ...(showExtendedBenchmarks
          ? [
              {
                dataKey: "classHighest",
                name: "Class highest",
                stroke: "#f7b731",
              },
              {
                dataKey: "classLowest",
                name: "Class lowest",
                stroke: "#d64550",
              },
            ]
          : []),
      ] as const,
    [showExtendedBenchmarks, studentFirstName],
  );

  function toggleSeries(dataKey: string) {
    setVisibleSeries((current) => ({
      ...current,
      [dataKey]: current[dataKey] === false,
    }));
  }

  return (
    <div className={`result-performance-card ${compact ? "is-compact" : ""}`}>
      <div className="result-performance-header">
        <div>
          <p className="section-heading mb-1">
            {studentFirstName || "Student"} vs {showExtendedBenchmarks ? "class benchmarks" : "class average"}
          </p>
          <p className="section-subtle mb-0">
            Subject-by-subject comparison for this result.
            {showExtendedBenchmarks ? " Click a legend label to hide or show a line." : ""}
          </p>
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
                name ?? "",
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
              onClick={(entry) => {
                if (entry?.dataKey) {
                  toggleSeries(String(entry.dataKey));
                }
              }}
              formatter={(value, entry) => (
                <span
                  style={{
                    color: visibleSeries[String(entry.dataKey)] === false ? "#94a3b8" : "#334155",
                    textDecoration: visibleSeries[String(entry.dataKey)] === false ? "line-through" : "none",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {value}
                </span>
              )}
              wrapperStyle={{
                fontSize: compact ? "11px" : "12px",
                paddingBottom: compact ? "8px" : "12px",
              }}
            />
            {series.map((seriesItem) => (
              <Line
                key={seriesItem.dataKey}
                type="monotone"
                dataKey={seriesItem.dataKey}
                name={seriesItem.name}
                stroke={seriesItem.stroke}
                strokeWidth={3}
                dot={{ r: compact ? 2.5 : 3.5, strokeWidth: 0, fill: seriesItem.stroke }}
                activeDot={{ r: compact ? 4 : 5 }}
                isAnimationActive={false}
                hide={visibleSeries[seriesItem.dataKey] === false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
