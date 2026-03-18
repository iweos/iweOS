"use client";

import Card from "@/components/admin/Card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ClassCompletionDatum = {
  name: string;
  completionRate: number;
  averageTotal: number;
  submittedRows: number;
  pendingRows: number;
};

type GradeDistributionDatum = {
  name: string;
  value: number;
  color: string;
};

type TeacherDashboardAnalyticsProps = {
  classCompletionData: ClassCompletionDatum[];
  gradeDistributionData: GradeDistributionDatum[];
};

function formatPercent(value: number) {
  return `${value.toFixed(0)}%`;
}

function formatTotal(value: number) {
  return value.toFixed(1);
}

function toNumber(value: number | string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function TeacherDashboardAnalytics({
  classCompletionData,
  gradeDistributionData,
}: TeacherDashboardAnalyticsProps) {
  return (
    <div className="row g-3">
      <div className="col-12 col-xl-8">
        <Card
          title="Score Completion by Class"
          subtitle="How far each class is in the active term, plus the current average total."
        >
          {classCompletionData.length === 0 ? (
            <p className="section-subtle mb-0">No class analytics yet for the active term.</p>
          ) : (
            <div className="teacher-dashboard-chart teacher-dashboard-chart-lg">
              <ResponsiveContainer>
                <BarChart data={classCompletionData} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(38, 65, 49, 0.12)" />
                  <XAxis dataKey="name" tick={{ fill: "#395241", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    yAxisId="left"
                    domain={[0, 100]}
                    tickFormatter={formatPercent}
                    tick={{ fill: "#395241", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tickFormatter={formatTotal}
                    tick={{ fill: "#67816f", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number | string | undefined, name: string | undefined) =>
                      name === "Completion"
                        ? [`${toNumber(value).toFixed(1)}%`, name ?? "Completion"]
                        : [toNumber(value).toFixed(1), name ?? "Average Total"]
                    }
                    contentStyle={{
                      borderRadius: "0.9rem",
                      border: "1px solid rgba(40, 88, 59, 0.12)",
                      boxShadow: "0 18px 40px rgba(24, 39, 31, 0.12)",
                    }}
                  />
                  <Bar yAxisId="left" dataKey="completionRate" name="Completion" fill="#1f7a45" radius={[10, 10, 0, 0]} />
                  <Bar yAxisId="right" dataKey="averageTotal" name="Average Total" fill="#c9dd92" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="col-12 col-xl-4">
        <Card
          title="Grade Distribution"
          subtitle="Spread of submitted grades in the current teacher view."
        >
          {gradeDistributionData.length === 0 ? (
            <p className="section-subtle mb-0">No grade distribution yet. Start entering scores to see the spread.</p>
          ) : (
            <>
              <div className="teacher-dashboard-chart teacher-dashboard-chart-sm">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={gradeDistributionData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={54}
                      outerRadius={92}
                      paddingAngle={3}
                    >
                      {gradeDistributionData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | string | undefined) => [toNumber(value), "Rows"]}
                      contentStyle={{
                        borderRadius: "0.9rem",
                        border: "1px solid rgba(40, 88, 59, 0.12)",
                        boxShadow: "0 18px 40px rgba(24, 39, 31, 0.12)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="d-grid gap-2">
                {gradeDistributionData.map((entry) => (
                  <div key={entry.name} className="d-flex align-items-center justify-content-between gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <span
                        aria-hidden="true"
                        style={{
                          width: "0.75rem",
                          height: "0.75rem",
                          borderRadius: "999px",
                          background: entry.color,
                          display: "inline-block",
                        }}
                      />
                      <span className="small fw-semibold">{entry.name}</span>
                    </div>
                    <span className="small text-muted">{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
