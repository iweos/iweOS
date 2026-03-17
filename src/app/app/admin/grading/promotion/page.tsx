import Link from "next/link";
import AdminFlashNotice from "@/components/admin/AdminFlashNotice";
import Button from "@/components/admin/ui/Button";
import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import Section from "@/components/admin/ui/Section";
import Select from "@/components/admin/ui/Select";
import StatCard from "@/components/admin/ui/StatCard";
import AutoSubmitFilters from "@/components/teacher/AutoSubmitFilters";
import { promoteStudentsAction } from "@/lib/server/admin-actions";
import { requireRole } from "@/lib/server/auth";
import { evaluatePromotionCandidates, resolvePromotionPolicy } from "@/lib/server/promotion";
import { prisma } from "@/lib/server/prisma";

type PromotionSearchParams = {
  sessionLabel?: string;
  sourceClassId?: string;
  targetSessionLabel?: string;
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

  const [terms, classes, gradeScale, subjects, promotionPolicy] = await Promise.all([
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
    prisma.subject.findMany({
      where: { schoolId: profile.schoolId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.promotionPolicy.findUnique({
      where: { schoolId: profile.schoolId },
      select: {
        minimumPassedSubjects: true,
        minimumAverage: true,
        passGradeId: true,
        requiredCompulsorySubjectsAtGrade: true,
        requiredCompulsoryGradeId: true,
        allowManualOverride: true,
        compulsorySubjects: {
          select: {
            subjectId: true,
          },
          orderBy: {
            subject: {
              name: "asc",
            },
          },
        },
      },
    }),
  ]);

  const sessions = Array.from(new Set(terms.map((term) => term.sessionLabel)));
  const activeSessionLabel = terms.find((term) => term.isActive)?.sessionLabel ?? sessions[0] ?? "";
  const selectedSessionLabel =
    params.sessionLabel && sessions.includes(params.sessionLabel) ? params.sessionLabel : activeSessionLabel;
  const selectedSourceClassId =
    params.sourceClassId && classes.some((klass) => klass.id === params.sourceClassId) ? params.sourceClassId : classes[0]?.id ?? "";
  const selectedTargetSessionLabel =
    params.targetSessionLabel && sessions.includes(params.targetSessionLabel)
      ? params.targetSessionLabel
      : sessions.find((sessionLabel) => sessionLabel !== selectedSessionLabel) ?? sessions[0] ?? "";
  const selectedTargetClassId =
    params.targetClassId && classes.some((klass) => klass.id === params.targetClassId) ? params.targetClassId : classes[0]?.id ?? "";

  const sessionTerms = terms.filter((term) => term.sessionLabel === selectedSessionLabel);
  const targetSessionTerms = terms.filter((term) => term.sessionLabel === selectedTargetSessionLabel);
  const targetStartTerm = targetSessionTerms[0] ?? null;
  const sourceClass = classes.find((klass) => klass.id === selectedSourceClassId) ?? null;
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
            subjectId: true,
            total: true,
            termId: true,
          },
        })
      : [];

  const effectivePolicy = resolvePromotionPolicy(
    promotionPolicy
      ? {
          minimumPassedSubjects: promotionPolicy.minimumPassedSubjects,
          minimumAverage: Number(promotionPolicy.minimumAverage),
          passGradeId: promotionPolicy.passGradeId,
          requiredCompulsorySubjectsAtGrade: promotionPolicy.requiredCompulsorySubjectsAtGrade,
          requiredCompulsoryGradeId: promotionPolicy.requiredCompulsoryGradeId,
          allowManualOverride: promotionPolicy.allowManualOverride,
          compulsorySubjectIds: promotionPolicy.compulsorySubjects.map((item) => item.subjectId),
        }
      : null,
    gradeScale,
  );

  const candidateRows = evaluatePromotionCandidates({
    students: uniqueStudents,
    scores: scores.map((score) => ({
      studentId: score.studentId,
      subjectId: score.subjectId,
      total: Number(score.total),
      termId: score.termId,
    })),
    sessionTermCount: sessionTerms.length,
    gradeScale,
    policy: effectivePolicy,
    subjects,
  }).map((row) => {
    const coverageComplete = sessionTerms.length > 0 && row.termCoverage >= sessionTerms.length;
    const eligibilityStatus = row.annualAverage === null ? "No Scores" : !coverageComplete ? "Needs Review" : row.isEligible ? "Eligible" : "Not Eligible";
    const eligibilityReason =
      row.annualAverage !== null && !coverageComplete
        ? `${row.eligibilityReason} Scores cover ${row.termCoverage} of ${sessionTerms.length} term${sessionTerms.length === 1 ? "" : "s"}.`
        : row.eligibilityReason;

    return {
      ...row,
      eligibilityStatus,
      eligibilityReason,
      canPromote: effectivePolicy.allowManualOverride ? row.annualAverage !== null : row.isEligible,
    };
  });

  const eligibleCount = candidateRows.filter((row) => row.eligibilityStatus === "Eligible").length;
  const reviewCount = candidateRows.filter((row) => row.eligibilityStatus === "Needs Review").length;
  const blockedCount = candidateRows.filter((row) => row.eligibilityStatus === "Not Eligible").length;
  const averageOfAverages =
    candidateRows.filter((row) => row.annualAverage !== null).length > 0
      ? candidateRows
          .filter((row) => row.annualAverage !== null)
          .reduce((sum, row) => sum + (row.annualAverage ?? 0), 0) /
        candidateRows.filter((row) => row.annualAverage !== null).length
      : 0;

  const compulsorySubjectNames = effectivePolicy.compulsorySubjectIds
    .map((subjectId) => subjects.find((subject) => subject.id === subjectId)?.name)
    .filter((value): value is string => Boolean(value));

  return (
    <Section>
      {status && message ? <AdminFlashNotice status={status} message={message} /> : null}
      <PageHeader
        title="Promotion"
        subtitle="Review a completed session, compare every student to the saved promotion rules, then move selected students into the next session."
        rightActions={
          <Link href="/app/admin/settings/promotion-rules" className="btn btn-secondary">
            Manage Promotion Rules
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students In View" value={candidateRows.length} icon="fas fa-user-graduate" cardVariant="primary" />
        <StatCard label="Eligible By Rules" value={eligibleCount} icon="fas fa-clipboard-check" cardVariant="success" />
        <StatCard label="Needs Review" value={reviewCount} icon="fas fa-search" cardVariant="warning" />
        <StatCard label="Class Annual Avg" value={averageOfAverages.toFixed(1)} icon="fas fa-chart-line" cardVariant="info" />
      </div>

      <Card title="Current Promotion Rule" subtitle="Rules are managed under Settings and applied here automatically.">
        <div className="d-grid gap-2">
          <p className="small text-muted mb-0">
            Pass at least <strong>{effectivePolicy.minimumPassedSubjects}</strong> subject{effectivePolicy.minimumPassedSubjects === 1 ? "" : "s"} with grade <strong>{effectivePolicy.passGradeLabel}</strong> or above.
          </p>
          <p className="small text-muted mb-0">
            Minimum annual average: <strong>{effectivePolicy.minimumAverage.toFixed(1)}</strong>
          </p>
          <p className="small text-muted mb-0">
            {effectivePolicy.requiredCompulsorySubjectsAtGrade > 0
              ? `At least ${effectivePolicy.requiredCompulsorySubjectsAtGrade} compulsory subject${effectivePolicy.requiredCompulsorySubjectsAtGrade === 1 ? "" : "s"} must reach ${effectivePolicy.requiredCompulsoryGradeLabel}.`
              : "No extra high-grade compulsory requirement is set."}
          </p>
          <p className="small text-muted mb-0">
            {compulsorySubjectNames.length > 0 ? `Compulsory subjects: ${compulsorySubjectNames.join(", ")}.` : "No compulsory subjects selected yet."}
          </p>
          <p className="small text-muted mb-0">
            {effectivePolicy.allowManualOverride ? "Manual override is allowed." : "Manual override is turned off."}
          </p>
        </div>
      </Card>

      <Card title="Promotion Filters" subtitle="Pick the source session and class you want to review.">
        <form method="get" className="grid gap-3 md:grid-cols-3">
          <input type="hidden" name="targetSessionLabel" value={selectedTargetSessionLabel} />
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
        subtitle="Promotion moves students into the chosen target session and enrolls them in that session's first sub-session."
      >
        {!sourceClass || !targetClass || !targetStartTerm ? (
          <p className="section-subtle mb-0">Create source and target sessions first before using promotion.</p>
        ) : candidateRows.length === 0 ? (
          <p className="section-subtle mb-0">No students found in this source class and session.</p>
        ) : (
          <form action={promoteStudentsAction} className="d-grid gap-3">
            <input type="hidden" name="sourceSessionLabel" value={selectedSessionLabel} />
            <input type="hidden" name="sourceClassId" value={selectedSourceClassId} />

            <div className="grid gap-3 md:grid-cols-2">
              <label className="d-grid gap-1">
                <span className="field-label">Target Session</span>
                <Select name="targetSessionLabel" defaultValue={selectedTargetSessionLabel}>
                  {sessions.map((sessionLabel) => (
                    <option key={sessionLabel} value={sessionLabel}>
                      {sessionLabel}
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

            <p className="small text-muted mb-0">
              Promotion will create enrollment in <strong>{targetStartTerm.termLabel}</strong>, the first sub-session inside <strong>{selectedTargetSessionLabel}</strong>.
            </p>

            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Select</Th>
                    <Th>Student</Th>
                    <Th>Annual Average</Th>
                    <Th>Grade</Th>
                    <Th>Rank</Th>
                    <Th>Passed Subjects</Th>
                    <Th>Compulsory</Th>
                    <Th>Coverage</Th>
                    <Th>Eligibility</Th>
                    <Th>Reason</Th>
                    <Th>Student Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {candidateRows.map((row) => (
                    <tr key={row.studentId}>
                      <Td>
                        <input
                          type="checkbox"
                          name="studentIds"
                          value={row.studentId}
                          defaultChecked={row.isEligible}
                          disabled={!row.canPromote}
                        />
                      </Td>
                      <Td>
                        {row.studentCode} - {row.fullName}
                      </Td>
                      <Td>{row.annualAverage === null ? "-" : row.annualAverage.toFixed(1)}</Td>
                      <Td>{row.grade}</Td>
                      <Td>{row.rank}</Td>
                      <Td>{row.passedSubjects}</Td>
                      <Td>{row.compulsoryMet ? "Met" : "Pending"}</Td>
                      <Td>
                        {row.termCoverage} / {sessionTerms.length}
                      </Td>
                      <Td>{row.eligibilityStatus}</Td>
                      <Td className="text-wrap">{row.eligibilityReason}</Td>
                      <Td>{row.status}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>

            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div>
                <p className="small text-muted mb-1">
                  Source: {selectedSessionLabel} / {sourceClass.name} {"->"} Target: {selectedTargetSessionLabel} / {targetClass.name}
                </p>
                <p className="small text-muted mb-0">
                  {effectivePolicy.allowManualOverride
                    ? `${blockedCount} student${blockedCount === 1 ? "" : "s"} do not currently meet the rules, but admin override is allowed.`
                    : "Manual override is disabled, so only students marked Eligible can be promoted."}
                </p>
              </div>
              <Button variant="primary" type="submit">
                Promote Selected
              </Button>
            </div>
          </form>
        )}
      </Card>
    </Section>
  );
}
