import AdminFlashNotice from "@/components/admin/AdminFlashNotice";
import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import Section from "@/components/admin/ui/Section";
import Select from "@/components/admin/ui/Select";
import StatCard from "@/components/admin/ui/StatCard";
import AutoSubmitFilters from "@/components/teacher/AutoSubmitFilters";
import { promoteStudentsAction } from "@/lib/server/admin-actions";
import { requireRole } from "@/lib/server/auth";
import { getGradeForTotal } from "@/lib/server/grading";
import { prisma } from "@/lib/server/prisma";

type PromotionSearchParams = {
  sessionLabel?: string;
  sourceClassId?: string;
  targetTermId?: string;
  targetClassId?: string;
  status?: string;
  message?: string;
};

export default async function AdminGradingPromotionPage({
  searchParams,
}: {
  searchParams: Promise<PromotionSearchParams>;
}) {
  const profile = await requireRole("admin");
  const params = await searchParams;
  const status = params.status === "success" || params.status === "error" ? params.status : null;
  const message = (params.message ?? "").trim();

  const [terms, classes, gradeScale] = await Promise.all([
    prisma.term.findMany({
      where: { schoolId: profile.schoolId },
      orderBy: [{ sessionLabel: "desc" }, { createdAt: "asc" }],
      select: { id: true, sessionLabel: true, termLabel: true, isActive: true },
    }),
    prisma.class.findMany({
      where: { schoolId: profile.schoolId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.gradeScale.findMany({
      where: { schoolId: profile.schoolId },
      orderBy: { orderIndex: "asc" },
    }),
  ]);

  const sessions = Array.from(new Set(terms.map((term) => term.sessionLabel)));
  const activeSessionLabel = terms.find((term) => term.isActive)?.sessionLabel ?? sessions[0] ?? "";
  const selectedSessionLabel =
    params.sessionLabel && sessions.includes(params.sessionLabel) ? params.sessionLabel : activeSessionLabel;
  const selectedSourceClassId =
    params.sourceClassId && classes.some((klass) => klass.id === params.sourceClassId) ? params.sourceClassId : classes[0]?.id ?? "";

  const selectedTargetTermId =
    params.targetTermId && terms.some((term) => term.id === params.targetTermId)
      ? params.targetTermId
      : terms.find((term) => term.sessionLabel !== selectedSessionLabel)?.id ?? terms[0]?.id ?? "";
  const selectedTargetClassId =
    params.targetClassId && classes.some((klass) => klass.id === params.targetClassId)
      ? params.targetClassId
      : classes[0]?.id ?? "";

  const sessionTerms = terms.filter((term) => term.sessionLabel === selectedSessionLabel);
  const sourceClass = classes.find((klass) => klass.id === selectedSourceClassId) ?? null;
  const targetTerm = terms.find((term) => term.id === selectedTargetTermId) ?? null;
  const targetClass = classes.find((klass) => klass.id === selectedTargetClassId) ?? null;

  const enrollments =
    selectedSourceClassId && sessionTerms.length > 0
      ? await prisma.enrollment.findMany({
          where: {
            schoolId: profile.schoolId,
            classId: selectedSourceClassId,
            termId: { in: sessionTerms.map((term) => term.id) },
          },
          include: {
            student: {
              select: {
                id: true,
                studentCode: true,
                fullName: true,
                status: true,
              },
            },
          },
          orderBy: {
            student: { fullName: "asc" },
          },
        })
      : [];

  const uniqueStudents = Array.from(
    new Map(enrollments.map((enrollment) => [enrollment.studentId, enrollment.student])).values(),
  );

  const scores =
    uniqueStudents.length > 0 && sessionTerms.length > 0
      ? await prisma.score.findMany({
          where: {
            schoolId: profile.schoolId,
            classId: selectedSourceClassId,
            termId: { in: sessionTerms.map((term) => term.id) },
            studentId: { in: uniqueStudents.map((student) => student.id) },
          },
          select: {
            studentId: true,
            total: true,
            termId: true,
          },
        })
      : [];

  const candidateRows = uniqueStudents
    .map((student) => {
      const studentScores = scores.filter((score) => score.studentId === student.id);
      const totalAverage =
        studentScores.length > 0
          ? studentScores.reduce((sum, score) => sum + Number(score.total), 0) / studentScores.length
          : null;
      const termCoverage = new Set(studentScores.map((score) => score.termId)).size;

      return {
        studentId: student.id,
        studentCode: student.studentCode,
        fullName: student.fullName,
        status: student.status,
        annualAverage: totalAverage,
        grade: totalAverage !== null && gradeScale.length > 0 ? getGradeForTotal(totalAverage, gradeScale) : "-",
        termCoverage,
        scoreRows: studentScores.length,
      };
    })
    .sort((a, b) => (b.annualAverage ?? Number.NEGATIVE_INFINITY) - (a.annualAverage ?? Number.NEGATIVE_INFINITY))
    .map((row, index, list) => ({
      ...row,
      rank: row.annualAverage === null ? "-" : `${index + 1} / ${list.length}`,
    }));

  const promotedReadyCount = candidateRows.filter((row) => row.annualAverage !== null).length;
  const incompleteCount = candidateRows.filter((row) => row.termCoverage < sessionTerms.length).length;
  const averageOfAverages =
    candidateRows.filter((row) => row.annualAverage !== null).length > 0
      ? candidateRows
          .filter((row) => row.annualAverage !== null)
          .reduce((sum, row) => sum + (row.annualAverage ?? 0), 0) /
        candidateRows.filter((row) => row.annualAverage !== null).length
      : 0;

  return (
    <Section>
      {status && message ? <AdminFlashNotice status={status} message={message} /> : null}
      <PageHeader
        title="Promotion"
        subtitle="Review yearly class performance, then manually move selected students into the next class and term."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students In View" value={candidateRows.length} icon="fas fa-user-graduate" cardVariant="primary" />
        <StatCard label="Ready For Review" value={promotedReadyCount} icon="fas fa-clipboard-check" cardVariant="success" />
        <StatCard label="Incomplete Coverage" value={incompleteCount} icon="fas fa-exclamation-circle" cardVariant="warning" />
        <StatCard label="Class Annual Avg" value={averageOfAverages.toFixed(1)} icon="fas fa-chart-line" cardVariant="info" />
      </div>

      <Card title="Promotion Filters" subtitle="Pick the completed source session and class you want to review.">
        <form method="get" className="grid gap-3 md:grid-cols-3">
          <input type="hidden" name="targetTermId" value={selectedTargetTermId} />
          <input type="hidden" name="targetClassId" value={selectedTargetClassId} />
          <label className="d-grid gap-1">
            <span className="field-label">Source Session</span>
            <Select name="sessionLabel" defaultValue={selectedSessionLabel}>
              {sessions.map((sessionLabel) => (
                <option key={sessionLabel} value={sessionLabel}>
                  {sessionLabel}
                </option>
              ))}
            </Select>
          </label>

          <label className="d-grid gap-1">
            <span className="field-label">Source Class</span>
            <Select name="sourceClassId" defaultValue={selectedSourceClassId}>
              {classes.map((klass) => (
                <option key={klass.id} value={klass.id}>
                  {klass.name}
                </option>
              ))}
            </Select>
          </label>

          <div className="align-self-end">
            <AutoSubmitFilters />
          </div>
        </form>
      </Card>

      <Card
        title="Promote Selected Students"
        subtitle="This updates each student's registered class and creates enrollment records in the chosen target term."
      >
        {!sourceClass || !targetTerm || !targetClass ? (
          <p className="section-subtle mb-0">Create classes and terms first before using promotion.</p>
        ) : candidateRows.length === 0 ? (
          <p className="section-subtle mb-0">No students found in this source class and session.</p>
        ) : (
          <form action={promoteStudentsAction} className="d-grid gap-3">
            <input type="hidden" name="sourceSessionLabel" value={selectedSessionLabel} />
            <input type="hidden" name="sourceClassId" value={selectedSourceClassId} />

            <div className="grid gap-3 md:grid-cols-2">
              <label className="d-grid gap-1">
                <span className="field-label">Target Term</span>
                <Select name="targetTermId" defaultValue={selectedTargetTermId}>
                  {terms.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.sessionLabel} {term.termLabel} {term.isActive ? "(Active)" : ""}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="d-grid gap-1">
                <span className="field-label">Target Class</span>
                <Select name="targetClassId" defaultValue={selectedTargetClassId}>
                  {classes.map((klass) => (
                    <option key={klass.id} value={klass.id}>
                      {klass.name}
                    </option>
                  ))}
                </Select>
              </label>
            </div>

            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Select</Th>
                    <Th>Student</Th>
                    <Th>Annual Average</Th>
                    <Th>Grade</Th>
                    <Th>Rank</Th>
                    <Th>Term Coverage</Th>
                    <Th>Score Rows</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {candidateRows.map((row) => (
                    <tr key={row.studentId}>
                      <Td>
                        <input type="checkbox" name="studentIds" value={row.studentId} defaultChecked={row.annualAverage !== null} />
                      </Td>
                      <Td>
                        {row.studentCode} - {row.fullName}
                      </Td>
                      <Td>{row.annualAverage === null ? "-" : row.annualAverage.toFixed(1)}</Td>
                      <Td>{row.grade}</Td>
                      <Td>{row.rank}</Td>
                      <Td>
                        {row.termCoverage} / {sessionTerms.length}
                      </Td>
                      <Td>{row.scoreRows}</Td>
                      <Td>{row.status}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>

            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
              <p className="small text-muted mb-0">
                Source: {selectedSessionLabel} / {sourceClass.name} {"->"} Target: {targetTerm.sessionLabel} {targetTerm.termLabel} /{" "}
                {targetClass.name}
              </p>
              <button className="btn btn-primary" type="submit">
                Promote Selected
              </button>
            </div>
          </form>
        )}
      </Card>
    </Section>
  );
}
