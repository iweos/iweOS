import { ProfileRole } from "@prisma/client";
import Link from "next/link";
import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";
import StatCard from "@/components/admin/ui/StatCard";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import AdminTeacherWorkspaceActions from "@/components/teacher/AdminTeacherWorkspaceActions";
import AutoSubmitFilters from "@/components/teacher/AutoSubmitFilters";
import { buildCompetitionRankMap } from "@/lib/ranking";
import { requireTeacherPortalContext } from "@/lib/server/auth";
import { getGradeForTotal } from "@/lib/server/grading";
import { isPrismaSchemaMismatchError } from "@/lib/server/prisma-errors";
import { prisma } from "@/lib/server/prisma";
import { getStudentSubjectExemptionKeySet, isStudentSubjectExempt } from "@/lib/server/student-subject-exemptions";

type TeacherStudentsSearchParams = {
  teacherProfileId?: string;
  termId?: string;
  classId?: string;
  studentId?: string;
};

export default async function TeacherStudentsPage({
  searchParams,
}: {
  searchParams: Promise<TeacherStudentsSearchParams>;
}) {
  const params = await searchParams;
  const context = await requireTeacherPortalContext(params.teacherProfileId);

  let terms: Array<{ id: string; sessionLabel: string; termLabel: string; isActive: boolean }> = [];
  let classesInView: Array<{ id: string; name: string }> = [];

  try {
    [terms, classesInView] = await Promise.all([
      prisma.term.findMany({
        where: { schoolId: context.actorProfile.schoolId },
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
        select: { id: true, sessionLabel: true, termLabel: true, isActive: true },
      }),
      context.mode === "admin_override"
        ? prisma.class.findMany({
            where: { schoolId: context.actorProfile.schoolId },
            orderBy: { name: "asc" },
            select: { id: true, name: true },
          })
        : prisma.teacherClassAssignment
            .findMany({
              where: {
                schoolId: context.actorProfile.schoolId,
                teacherProfileId: context.effectiveTeacherProfile.id,
              },
              include: { class: true },
              orderBy: { class: { name: "asc" } },
            })
            .then((rows) => rows.map((row) => row.class)),
    ]);
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return (
        <section className="section-panel space-y-2">
          <p className="section-kicker">Teacher Portal</p>
          <h1 className="section-title">Student Analytics Setup Required</h1>
          <p className="section-subtle">
            Production is missing the latest academic schema. Run <code>npx prisma migrate deploy</code> against the
            production database, then redeploy the app.
          </p>
        </section>
      );
    }
    throw error;
  }

  const selectedTermId = params.termId && terms.some((term) => term.id === params.termId) ? params.termId : terms[0]?.id;
  const selectedClassId =
    params.classId && classesInView.some((klass) => klass.id === params.classId) ? params.classId : classesInView[0]?.id;

  const [enrollments, classSubjects, scores, gradeScale, exemptionKeys] =
    selectedClassId && selectedTermId
      ? await Promise.all([
          prisma.enrollment.findMany({
            where: {
              schoolId: context.actorProfile.schoolId,
              classId: selectedClassId,
              termId: selectedTermId,
              student: {
                is: {
                  status: "active",
                },
              },
            },
            select: {
              studentId: true,
              student: {
                select: {
                  studentCode: true,
                  fullName: true,
                },
              },
            },
            orderBy: {
              student: { fullName: "asc" },
            },
          }),
          prisma.classSubject.findMany({
            where: {
              schoolId: context.actorProfile.schoolId,
              classId: selectedClassId,
            },
            include: {
              subject: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              subject: { name: "asc" },
            },
          }),
          prisma.score.findMany({
            where: {
              schoolId: context.actorProfile.schoolId,
              classId: selectedClassId,
              termId: selectedTermId,
            },
            select: {
              studentId: true,
              subjectId: true,
              total: true,
              grade: true,
              updatedAt: true,
            },
          }),
          prisma.gradeScale.findMany({
            where: { schoolId: context.actorProfile.schoolId },
            orderBy: { orderIndex: "asc" },
          }),
          prisma.enrollment
            .findMany({
              where: {
                schoolId: context.actorProfile.schoolId,
                classId: selectedClassId,
                termId: selectedTermId,
                student: {
                  is: {
                    status: "active",
                  },
                },
              },
              select: { studentId: true },
            })
            .then((rows) =>
              getStudentSubjectExemptionKeySet({
                schoolId: context.actorProfile.schoolId,
                classId: selectedClassId,
                studentIds: rows.map((row) => row.studentId),
              }),
            ),
        ])
      : [[], [], [], [], new Set<string>()];

  const filteredScores = scores.filter(
    (score) => !isStudentSubjectExempt(exemptionKeys, selectedClassId ?? "", score.studentId, score.subjectId),
  );

  const selectedStudentId =
    params.studentId && enrollments.some((enrollment) => enrollment.studentId === params.studentId)
      ? params.studentId
      : enrollments[0]?.studentId;
  const selectedStudent = enrollments.find((enrollment) => enrollment.studentId === selectedStudentId) ?? null;

  const scoresBySubjectId = new Map(
    classSubjects.map((row) => {
      const subjectScores = filteredScores.filter((score) => score.subjectId === row.subject.id);
      return [row.subject.id, subjectScores] as const;
    }),
  );

  const subjectComparisonRows = classSubjects.flatMap((row) => {
    if (selectedStudentId && isStudentSubjectExempt(exemptionKeys, selectedClassId ?? "", selectedStudentId, row.subject.id)) {
      return [];
    }

    const subjectScores = scoresBySubjectId.get(row.subject.id) ?? [];
    const studentScore = subjectScores.find((score) => score.studentId === selectedStudentId);
    const numericScores = subjectScores.map((score) => Number(score.total));
    const classAverage =
      numericScores.length > 0 ? numericScores.reduce((sum, value) => sum + value, 0) / numericScores.length : null;
    const studentTotal = studentScore ? Number(studentScore.total) : null;
    const gap = studentTotal !== null && classAverage !== null ? studentTotal - classAverage : null;
    const grade =
      studentTotal !== null ? studentScore?.grade?.trim() || getGradeForTotal(studentTotal, gradeScale) : null;
    const subjectRanking = subjectScores
      .map((score) => ({
        studentId: score.studentId,
        total: Number(score.total),
      }))
      .sort((a, b) => b.total - a.total);
    const subjectRankMap = buildCompetitionRankMap(
      subjectRanking.map((score) => ({
        id: score.studentId,
        score: score.total,
      })),
    );
    const subjectPositionRank = selectedStudentId ? subjectRankMap.get(selectedStudentId) : undefined;
    const subjectPosition =
      studentTotal !== null && subjectPositionRank ? `${subjectPositionRank} / ${subjectRanking.length}` : null;

    return [{
      subjectId: row.subject.id,
      subjectName: row.subject.name,
      studentTotal,
      classAverage,
      gap,
      subjectPosition,
      grade,
      updatedAt: studentScore?.updatedAt ?? null,
    }];
  });

  const scoredRows = subjectComparisonRows.filter((row) => row.studentTotal !== null);
  const selectedStudentAverage =
    scoredRows.length > 0 ? scoredRows.reduce((sum, row) => sum + (row.studentTotal ?? 0), 0) / scoredRows.length : null;
  const classAverageAcrossSubjects =
    subjectComparisonRows.filter((row) => row.classAverage !== null).length > 0
      ? subjectComparisonRows
          .filter((row) => row.classAverage !== null)
          .reduce((sum, row) => sum + (row.classAverage ?? 0), 0) /
        subjectComparisonRows.filter((row) => row.classAverage !== null).length
      : null;

  const classStudentAverageRows = enrollments
    .map((enrollment) => {
      const studentSubjectScores = filteredScores.filter((score) => score.studentId === enrollment.studentId);
      const average =
        studentSubjectScores.length > 0
          ? studentSubjectScores.reduce((sum, score) => sum + Number(score.total), 0) / studentSubjectScores.length
          : null;

      return {
        studentId: enrollment.studentId,
        studentName: enrollment.student.fullName,
        average,
      };
    })
    .filter((row) => row.average !== null)
    .sort((a, b) => (b.average ?? 0) - (a.average ?? 0));

  const classRankMap = buildCompetitionRankMap(
    classStudentAverageRows.map((row) => ({
      id: row.studentId,
      score: row.average,
    })),
  );
  const rankValue = selectedStudentId ? classRankMap.get(selectedStudentId) : undefined;
  const rankLabel =
    rankValue ? `${rankValue} / ${classStudentAverageRows.length}` : `- / ${classStudentAverageRows.length}`;

  const bestSubject = scoredRows
    .slice()
    .sort((a, b) => (b.studentTotal ?? 0) - (a.studentTotal ?? 0))[0];
  const lowestSubject = scoredRows
    .slice()
    .sort((a, b) => (a.studentTotal ?? 0) - (b.studentTotal ?? 0))[0];

  function formatNumber(value: number | null, digits = 1) {
    return value === null ? "-" : value.toFixed(digits);
  }

  function getPositionOnly(value: string | null) {
    if (!value) {
      return "-";
    }

    return value.includes("/") ? value.split("/")[0]?.trim() ?? value : value;
  }

  function toOrdinal(value: string) {
    const numeric = Number.parseInt(value, 10);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return value;
    }

    const mod100 = numeric % 100;
    if (mod100 >= 11 && mod100 <= 13) {
      return `${numeric}th`;
    }

    switch (numeric % 10) {
      case 1:
        return `${numeric}st`;
      case 2:
        return `${numeric}nd`;
      case 3:
        return `${numeric}rd`;
      default:
        return `${numeric}th`;
    }
  }

  return (
    <>
      <section className="section-panel space-y-3">
        <PageHeader
          title="Students"
          subtitle={
            context.mode === "admin_override"
              ? "Admin override: view student academic analytics across classes."
              : `Working as: ${context.effectiveTeacherProfile.fullName}`
          }
          rightActions={
            <>
              <AdminTeacherWorkspaceActions mode={context.mode} />
              <Link
                href={
                  params.teacherProfileId
                    ? `/app/teacher/students/manage?teacherProfileId=${params.teacherProfileId}`
                    : "/app/teacher/students/manage"
                }
                className="btn btn-secondary"
              >
                Student Directory
              </Link>
            </>
          }
        />

        <form method="get" className="grid gap-2 md:grid-cols-5">
          {context.actorProfile.role === ProfileRole.ADMIN ? (
            <label className="space-y-1">
              <span className="field-label">View As</span>
              <select className="select" name="teacherProfileId" defaultValue={params.teacherProfileId ?? ""}>
                <option value="">Admin Override</option>
                {context.teacherOptions.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.fullName}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="space-y-1">
            <span className="field-label">Term</span>
            <select className="select" name="termId" defaultValue={selectedTermId}>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.sessionLabel} {term.termLabel} {term.isActive ? "(Active)" : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="field-label">Class</span>
            <select className="select" name="classId" defaultValue={selectedClassId}>
              {classesInView.map((klass) => (
                <option key={klass.id} value={klass.id}>
                  {klass.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="field-label">Student</span>
            <select className="select" name="studentId" defaultValue={selectedStudentId}>
              {enrollments.length === 0 ? <option value="">No students enrolled</option> : null}
              {enrollments.map((enrollment) => (
                <option key={enrollment.studentId} value={enrollment.studentId}>
                  {enrollment.student.studentCode} - {enrollment.student.fullName}
                </option>
              ))}
            </select>
          </label>

          <div className="self-end">
            <AutoSubmitFilters />
          </div>
        </form>
      </section>

      {!selectedClassId || !selectedTermId ? (
        <section className="section-panel">
          <p className="section-subtle">No valid class or term in this view.</p>
        </section>
      ) : !selectedStudent ? (
        <section className="section-panel">
          <p className="section-subtle">No enrolled students found for the selected class and term.</p>
        </section>
      ) : (
        <>
          <section className="section-panel space-y-3">
            <Card
              title={`${selectedStudent.student.studentCode} - ${selectedStudent.student.fullName}`}
              subtitle="Student performance summary against the selected class."
            >
              <div className="row g-3">
                <div className="col-12 col-md-6 col-xl-4">
                  <StatCard
                    label="Student Average"
                    value={formatNumber(selectedStudentAverage)}
                    icon="fas fa-user-graduate"
                    cardVariant="primary"
                  />
                </div>
                <div className="col-12 col-md-6 col-xl-4">
                  <StatCard
                    label="Class Average"
                    value={formatNumber(classAverageAcrossSubjects)}
                    icon="fas fa-users"
                    cardVariant="secondary"
                  />
                </div>
                <div className="col-12 col-md-6 col-xl-4">
                  <StatCard
                    label="Average Gap"
                    value={
                      selectedStudentAverage !== null && classAverageAcrossSubjects !== null
                        ? `${selectedStudentAverage >= classAverageAcrossSubjects ? "+" : ""}${(
                            selectedStudentAverage - classAverageAcrossSubjects
                          ).toFixed(1)}`
                        : "-"
                    }
                    icon="fas fa-chart-line"
                    cardVariant={
                      selectedStudentAverage !== null &&
                      classAverageAcrossSubjects !== null &&
                      selectedStudentAverage >= classAverageAcrossSubjects
                        ? "success"
                        : "warning"
                    }
                  />
                </div>
                <div className="col-12 col-md-6 col-xl-4">
                  <StatCard label="Class Rank" value={toOrdinal(getPositionOnly(rankLabel))} icon="fas fa-medal" cardVariant="info" />
                </div>
                <div className="col-12 col-md-6 col-xl-4">
                  <StatCard
                    label="Best Subject"
                    value={bestSubject ? `${bestSubject.subjectName} (${formatNumber(bestSubject.studentTotal)})` : "-"}
                    icon="fas fa-trophy"
                    cardVariant="success"
                  />
                </div>
                <div className="col-12 col-md-6 col-xl-4">
                  <StatCard
                    label="Lowest Subject"
                    value={lowestSubject ? `${lowestSubject.subjectName} (${formatNumber(lowestSubject.studentTotal)})` : "-"}
                    icon="fas fa-balance-scale"
                    cardVariant="danger"
                  />
                </div>
              </div>
            </Card>
          </section>

          <section className="section-panel">
            <Card
              title="Subject Comparison"
              subtitle="Each subject shows the student score beside the current class average and performance gap."
            >
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <Th>Subject</Th>
                      <Th>Student Score</Th>
                      <Th>Class Average</Th>
                      <Th>Gap</Th>
                      <Th>Subject Position</Th>
                      <Th>Grade</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectComparisonRows.map((row) => (
                      <tr key={row.subjectId}>
                        <Td>{row.subjectName}</Td>
                        <Td>{formatNumber(row.studentTotal)}</Td>
                        <Td>{formatNumber(row.classAverage)}</Td>
                        <Td>
                          {row.gap === null ? "-" : `${row.gap >= 0 ? "+" : ""}${row.gap.toFixed(1)}`}
                        </Td>
                        <Td>{toOrdinal(getPositionOnly(row.subjectPosition))}</Td>
                        <Td>{row.grade ?? "-"}</Td>
                      </tr>
                    ))}
                    {subjectComparisonRows.length === 0 ? (
                      <tr>
                        <Td colSpan={6}>No subject analytics available for this class yet.</Td>
                      </tr>
                    ) : null}
                  </tbody>
                </Table>
              </TableWrap>
            </Card>
          </section>

          <section className="section-panel">
            <Card
              title="Class Leaderboard Snapshot"
              subtitle="Current ranking in this class based on average score for the selected term."
            >
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <Th>Rank</Th>
                      <Th>Student</Th>
                      <Th>Average</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudentAverageRows.slice(0, 8).map((row) => (
                      <tr key={row.studentId}>
                        <Td>{classRankMap.get(row.studentId) ?? "-"}</Td>
                        <Td>{row.studentName}</Td>
                        <Td>{formatNumber(row.average)}</Td>
                      </tr>
                    ))}
                    {classStudentAverageRows.length === 0 ? (
                      <tr>
                        <Td colSpan={3}>No class ranking data yet.</Td>
                      </tr>
                    ) : null}
                  </tbody>
                </Table>
              </TableWrap>
            </Card>
          </section>
        </>
      )}
    </>
  );
}
