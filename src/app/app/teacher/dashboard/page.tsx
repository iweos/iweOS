import { requireTeacherPortalContext } from "@/lib/server/auth";
import { ProfileRole } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";
import StatCard from "@/components/admin/ui/StatCard";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import TeacherDashboardAnalytics from "@/components/teacher/TeacherDashboardAnalytics";

type TeacherDashboardSearchParams = {
  teacherProfileId?: string;
};

export default async function TeacherDashboardPage({
  searchParams,
}: {
  searchParams: Promise<TeacherDashboardSearchParams>;
}) {
  const params = await searchParams;
  const context = await requireTeacherPortalContext(params.teacherProfileId);

  const [activeTerm, assignments] = await Promise.all([
    prisma.term.findFirst({
      where: {
        schoolId: context.actorProfile.schoolId,
        isActive: true,
      },
    }),
    context.mode === "admin_override"
      ? prisma.class.findMany({
          where: { schoolId: context.actorProfile.schoolId },
          orderBy: { name: "asc" },
        })
      : prisma.teacherClassAssignment.findMany({
          where: {
            schoolId: context.actorProfile.schoolId,
            teacherProfileId: context.effectiveTeacherProfile.id,
          },
          include: { class: true },
          orderBy: { class: { name: "asc" } },
        }).then((rows) => rows.map((row) => row.class)),
  ]);

  const classIds = assignments.map((row) => row.id);
  const scoreWhereBase =
    context.mode === "admin_override"
      ? {
          schoolId: context.actorProfile.schoolId,
        }
      : {
          schoolId: context.actorProfile.schoolId,
          teacherProfileId: context.effectiveTeacherProfile.id,
        };

  const [classSubjects, enrollments, scores, gradeScale] =
    activeTerm && classIds.length > 0
      ? await Promise.all([
          prisma.classSubject.findMany({
            where: {
              schoolId: context.actorProfile.schoolId,
              classId: { in: classIds },
            },
            include: {
              class: true,
              subject: true,
            },
          }),
          prisma.enrollment.findMany({
            where: {
              schoolId: context.actorProfile.schoolId,
              termId: activeTerm.id,
              classId: { in: classIds },
            },
            include: {
              class: true,
              student: true,
            },
          }),
          prisma.score.findMany({
            where: {
              ...scoreWhereBase,
              termId: activeTerm.id,
              classId: { in: classIds },
            },
            select: {
              id: true,
              classId: true,
              studentId: true,
              subjectId: true,
              total: true,
              grade: true,
              updatedAt: true,
              class: {
                select: {
                  name: true,
                },
              },
              student: {
                select: {
                  fullName: true,
                },
              },
              subject: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: [{ updatedAt: "desc" }],
          }),
          prisma.gradeScale.findMany({
            where: {
              schoolId: context.actorProfile.schoolId,
            },
            orderBy: { orderIndex: "asc" },
          }),
        ])
      : [[], [], [], []];

  const label =
    context.mode === "admin_override"
      ? "Admin Override (All Classes)"
      : context.effectiveTeacherProfile.fullName;

  const uniqueSubjectMap = new Map(classSubjects.map((row) => [row.subjectId, row.subject.name]));
  const uniqueStudentMap = new Map(enrollments.map((row) => [row.studentId, row.student.fullName]));
  const totalScores = scores.length;
  const expectedScoreRows = assignments.reduce((sum, klass) => {
    const classStudentCount = enrollments.filter((row) => row.classId === klass.id).length;
    const classSubjectCount = classSubjects.filter((row) => row.classId === klass.id).length;
    return sum + classStudentCount * classSubjectCount;
  }, 0);
  const pendingScoreRows = Math.max(expectedScoreRows - totalScores, 0);
  const completionRate = expectedScoreRows > 0 ? (totalScores / expectedScoreRows) * 100 : 0;
  const averageTotal = totalScores > 0 ? scores.reduce((sum, row) => sum + Number(row.total), 0) / totalScores : 0;

  const classSummaries = assignments.map((klass) => {
    const classEnrollments = enrollments.filter((row) => row.classId === klass.id);
    const classSubjectsForRow = classSubjects.filter((row) => row.classId === klass.id);
    const classScores = scores.filter((row) => row.classId === klass.id);
    const submittedRows = classScores.length;
    const expectedRows = classEnrollments.length * classSubjectsForRow.length;
    const averageClassTotal =
      submittedRows > 0 ? classScores.reduce((sum, row) => sum + Number(row.total), 0) / submittedRows : 0;

    return {
      classId: klass.id,
      className: klass.name,
      studentCount: classEnrollments.length,
      subjectCount: classSubjectsForRow.length,
      expectedRows,
      submittedRows,
      pendingRows: Math.max(expectedRows - submittedRows, 0),
      completionRate: expectedRows > 0 ? (submittedRows / expectedRows) * 100 : 0,
      averageTotal: averageClassTotal,
    };
  });

  const gradeColorScale = ["#1f7a45", "#5f9f3f", "#9dc14b", "#d8cb55", "#f0aa42", "#d65f4a", "#82483f"];
  const orderedGradeLetters = gradeScale.map((row) => row.gradeLetter);
  const gradeCounts = new Map<string, number>();
  for (const row of scores) {
    const gradeKey = row.grade?.trim() || "Ungraded";
    gradeCounts.set(gradeKey, (gradeCounts.get(gradeKey) ?? 0) + 1);
  }
  const gradeKeys =
    orderedGradeLetters.length > 0
      ? [...orderedGradeLetters, ...Array.from(gradeCounts.keys()).filter((key) => !orderedGradeLetters.includes(key))]
      : Array.from(gradeCounts.keys()).sort();
  const gradeDistributionData = gradeKeys
    .filter((key) => (gradeCounts.get(key) ?? 0) > 0)
    .map((key, index) => ({
      name: key,
      value: gradeCounts.get(key) ?? 0,
      color: gradeColorScale[index % gradeColorScale.length],
    }));

  const classCompletionData = classSummaries.map((row) => ({
    name: row.className,
    completionRate: Number(row.completionRate.toFixed(1)),
    averageTotal: Number(row.averageTotal.toFixed(1)),
    submittedRows: row.submittedRows,
    pendingRows: row.pendingRows,
  }));

  const subjectPerformance = Array.from(
    scores.reduce<
      Map<
        string,
        {
          subjectName: string;
          rows: number;
          totalSum: number;
          highest: number;
          lowest: number;
        }
      >
    >((map, row) => {
      const current = map.get(row.subjectId) ?? {
        subjectName: row.subject.name,
        rows: 0,
        totalSum: 0,
        highest: Number.NEGATIVE_INFINITY,
        lowest: Number.POSITIVE_INFINITY,
      };
      const total = Number(row.total);
      current.rows += 1;
      current.totalSum += total;
      current.highest = Math.max(current.highest, total);
      current.lowest = Math.min(current.lowest, total);
      map.set(row.subjectId, current);
      return map;
    }, new Map()).values(),
  )
    .map((row) => ({
      subjectName: row.subjectName,
      rows: row.rows,
      averageTotal: row.rows > 0 ? row.totalSum / row.rows : 0,
      highest: Number.isFinite(row.highest) ? row.highest : 0,
      lowest: Number.isFinite(row.lowest) ? row.lowest : 0,
    }))
    .sort((a, b) => b.averageTotal - a.averageTotal);

  const studentAttentionRows = Array.from(
    scores.reduce<
      Map<
        string,
        {
          studentName: string;
          className: string;
          rowCount: number;
          totalSum: number;
          lowestTotal: number;
        }
      >
    >((map, row) => {
      const current = map.get(row.studentId) ?? {
        studentName: row.student.fullName,
        className: row.class.name,
        rowCount: 0,
        totalSum: 0,
        lowestTotal: Number.POSITIVE_INFINITY,
      };
      const total = Number(row.total);
      current.rowCount += 1;
      current.totalSum += total;
      current.lowestTotal = Math.min(current.lowestTotal, total);
      map.set(row.studentId, current);
      return map;
    }, new Map()).values(),
  )
    .map((row) => ({
      studentName: row.studentName,
      className: row.className,
      subjectsCovered: row.rowCount,
      averageTotal: row.rowCount > 0 ? row.totalSum / row.rowCount : 0,
      lowestTotal: Number.isFinite(row.lowestTotal) ? row.lowestTotal : 0,
    }))
    .sort((a, b) => a.averageTotal - b.averageTotal)
    .slice(0, 8);

  const recentActivity = scores.slice(0, 8).map((row) => ({
    id: row.id,
    updatedLabel: new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(row.updatedAt),
    className: row.class.name,
    studentName: row.student.fullName,
    subjectName: row.subject.name,
    total: Number(row.total),
    grade: row.grade ?? "-",
  }));

  function formatMetric(value: number) {
    return value.toFixed(1);
  }

  return (
    <div className="d-grid gap-3">
      <PageHeader
        title="Teacher Dashboard"
        subtitle={`Active Term: ${activeTerm ? `${activeTerm.sessionLabel} ${activeTerm.termLabel}` : "Not configured"}`}
        rightActions={
          context.actorProfile.role === ProfileRole.ADMIN ? (
            <form method="get" className="d-flex flex-wrap align-items-end gap-2">
              <label className="d-grid gap-1">
                <span className="field-label">View As</span>
                <select name="teacherProfileId" className="form-select form-select-sm" defaultValue={params.teacherProfileId ?? ""}>
                  <option value="">Admin Override (All classes)</option>
                  {context.teacherOptions.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn btn-primary" type="submit">
                Apply
              </button>
            </form>
          ) : null
        }
      />

      <Card subtitle={`Signed in as ${label}`}>
        <p className="section-subtle mb-3">
          Portal mode:{" "}
          <strong>{context.mode === "admin_override" ? "Admin" : "Teacher"}</strong>
        </p>
        <div className="row g-3">
          <div className="col-sm-6 col-xl-4">
            <StatCard label="Classes In View" value={assignments.length} icon="fas fa-th-large" cardVariant="secondary" />
          </div>
          <div className="col-sm-6 col-xl-4">
            <StatCard label="Subjects In View" value={uniqueSubjectMap.size} icon="fas fa-book-open" cardVariant="success" />
          </div>
          <div className="col-sm-6 col-xl-4">
            <StatCard label="Students In Active Term" value={uniqueStudentMap.size} icon="fas fa-user-graduate" cardVariant="primary" />
          </div>
          <div className="col-sm-6 col-xl-4">
            <StatCard label="Submitted Score Rows" value={totalScores} icon="fas fa-clipboard-check" cardVariant="info" />
          </div>
          <div className="col-sm-6 col-xl-4">
            <StatCard
              label="Score Completion"
              value={`${completionRate.toFixed(0)}%`}
              icon="fas fa-chart-line"
              cardVariant="warning"
              delta={`${pendingScoreRows} pending of ${expectedScoreRows || 0}`}
            />
          </div>
          <div className="col-sm-6 col-xl-4">
            <StatCard
              label="Current Term Average"
              value={formatMetric(averageTotal)}
              icon="fas fa-award"
              cardVariant="black"
              delta={activeTerm ? `${activeTerm.sessionLabel} ${activeTerm.termLabel}` : "No active term"}
            />
          </div>
        </div>
      </Card>

      <TeacherDashboardAnalytics
        classCompletionData={classCompletionData}
        gradeDistributionData={gradeDistributionData}
      />

      <div className="row g-3">
        <div className="col-12 col-xl-7">
          <Card
            title="Class Coverage"
            subtitle="Expected score rows are based on active-term enrollments multiplied by subjects assigned to each class."
          >
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Class</Th>
                    <Th>Students</Th>
                    <Th>Subjects</Th>
                    <Th>Expected</Th>
                    <Th>Submitted</Th>
                    <Th>Pending</Th>
                    <Th>Completion</Th>
                    <Th>Avg Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {classSummaries.map((row) => (
                    <tr key={row.classId}>
                      <Td>{row.className}</Td>
                      <Td>{row.studentCount}</Td>
                      <Td>{row.subjectCount}</Td>
                      <Td>{row.expectedRows}</Td>
                      <Td>{row.submittedRows}</Td>
                      <Td>{row.pendingRows}</Td>
                      <Td>{row.completionRate.toFixed(0)}%</Td>
                      <Td>{formatMetric(row.averageTotal)}</Td>
                    </tr>
                  ))}
                  {classSummaries.length === 0 && (
                    <tr>
                      <Td colSpan={8} className="text-muted">
                        No class analytics available yet.
                      </Td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </TableWrap>
          </Card>
        </div>

        <div className="col-12 col-xl-5">
          <Card title="Students Needing Attention" subtitle="Lowest active-term averages in the current teacher view.">
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Student</Th>
                    <Th>Class</Th>
                    <Th>Subjects</Th>
                    <Th>Avg Total</Th>
                    <Th>Lowest</Th>
                  </tr>
                </thead>
                <tbody>
                  {studentAttentionRows.map((row) => (
                    <tr key={`${row.studentName}_${row.className}`}>
                      <Td>{row.studentName}</Td>
                      <Td>{row.className}</Td>
                      <Td>{row.subjectsCovered}</Td>
                      <Td>{formatMetric(row.averageTotal)}</Td>
                      <Td>{formatMetric(row.lowestTotal)}</Td>
                    </tr>
                  ))}
                  {studentAttentionRows.length === 0 && (
                    <tr>
                      <Td colSpan={5} className="text-muted">
                        No score data yet to identify attention areas.
                      </Td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </TableWrap>
          </Card>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-6">
          <Card title="Subject Performance" subtitle="Average total, floor, and ceiling by subject in the active term.">
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Subject</Th>
                    <Th>Rows</Th>
                    <Th>Average</Th>
                    <Th>Highest</Th>
                    <Th>Lowest</Th>
                  </tr>
                </thead>
                <tbody>
                  {subjectPerformance.slice(0, 8).map((row) => (
                    <tr key={row.subjectName}>
                      <Td>{row.subjectName}</Td>
                      <Td>{row.rows}</Td>
                      <Td>{formatMetric(row.averageTotal)}</Td>
                      <Td>{formatMetric(row.highest)}</Td>
                      <Td>{formatMetric(row.lowest)}</Td>
                    </tr>
                  ))}
                  {subjectPerformance.length === 0 && (
                    <tr>
                      <Td colSpan={5} className="text-muted">
                        No subject performance data yet.
                      </Td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </TableWrap>
          </Card>
        </div>

        <div className="col-12 col-xl-6">
          <Card title="Recent Score Activity" subtitle="Latest score rows updated in the current teacher view.">
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Updated</Th>
                    <Th>Class</Th>
                    <Th>Student</Th>
                    <Th>Subject</Th>
                    <Th>Total</Th>
                    <Th>Grade</Th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((row) => (
                    <tr key={row.id}>
                      <Td>{row.updatedLabel}</Td>
                      <Td>{row.className}</Td>
                      <Td>{row.studentName}</Td>
                      <Td>{row.subjectName}</Td>
                      <Td>{formatMetric(row.total)}</Td>
                      <Td>{row.grade}</Td>
                    </tr>
                  ))}
                  {recentActivity.length === 0 && (
                    <tr>
                      <Td colSpan={6} className="text-muted">
                        No recent score activity yet.
                      </Td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </TableWrap>
          </Card>
        </div>
      </div>

      <Card title="Classes in View">
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Class</Th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((row) => (
                <tr key={row.id}>
                  <Td>{row.name}</Td>
                </tr>
              ))}
              {assignments.length === 0 && (
                <tr>
                  <Td className="text-muted">No classes available in this view.</Td>
                </tr>
              )}
            </tbody>
          </Table>
        </TableWrap>
      </Card>
    </div>
  );
}
