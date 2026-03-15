import AdminFlashNotice from "@/components/admin/AdminFlashNotice";
import Button from "@/components/admin/ui/Button";
import Card from "@/components/admin/Card";
import Input from "@/components/admin/ui/Input";
import PageHeader from "@/components/admin/PageHeader";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import Section from "@/components/admin/ui/Section";
import Select from "@/components/admin/ui/Select";
import StatCard from "@/components/admin/ui/StatCard";
import AutoSubmitFilters from "@/components/teacher/AutoSubmitFilters";
import { promoteStudentsAction, upsertPromotionPolicyAction } from "@/lib/server/admin-actions";
import { requireRole } from "@/lib/server/auth";
import { evaluatePromotionCandidates, resolvePromotionPolicy } from "@/lib/server/promotion";
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
  const selectedTargetTermId =
    params.targetTermId && terms.some((term) => term.id === params.targetTermId)
      ? params.targetTermId
      : terms.find((term) => term.sessionLabel !== selectedSessionLabel)?.id ?? terms[0]?.id ?? "";
  const selectedTargetClassId =
    params.targetClassId && classes.some((klass) => klass.id === params.targetClassId) ? params.targetClassId : classes[0]?.id ?? "";

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
        subtitle="Set school-wide promotion rules, then review each student against those rules before promoting to the next class and term."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students In View" value={candidateRows.length} icon="fas fa-user-graduate" cardVariant="primary" />
        <StatCard label="Eligible By Rules" value={eligibleCount} icon="fas fa-clipboard-check" cardVariant="success" />
        <StatCard label="Needs Review" value={reviewCount} icon="fas fa-search" cardVariant="warning" />
        <StatCard label="Class Annual Avg" value={averageOfAverages.toFixed(1)} icon="fas fa-chart-line" cardVariant="info" />
      </div>

      <Card
        title="School Promotion Rules"
        subtitle="These rules belong to this school. Use them to model requirements like 5 credits including compulsory subjects."
      >
        <form action={upsertPromotionPolicyAction} className="d-grid gap-3">
          <input type="hidden" name="sessionLabel" value={selectedSessionLabel} />
          <input type="hidden" name="sourceClassId" value={selectedSourceClassId} />
          <input type="hidden" name="targetTermId" value={selectedTargetTermId} />
          <input type="hidden" name="targetClassId" value={selectedTargetClassId} />

          <div className="grid gap-3 md:grid-cols-4">
            <label className="d-grid gap-1">
              <span className="field-label">Minimum Passed Subjects</span>
              <Input name="minimumPassedSubjects" type="number" min={1} max={50} defaultValue={effectivePolicy.minimumPassedSubjects} required />
            </label>

            <label className="d-grid gap-1">
              <span className="field-label">Minimum Average</span>
              <Input name="minimumAverage" type="number" min={0} max={100} step="0.01" defaultValue={effectivePolicy.minimumAverage} required />
            </label>

            <label className="d-grid gap-1">
              <span className="field-label">Pass Grade Threshold</span>
              <Select name="passGradeId" defaultValue={effectivePolicy.passGradeId ?? ""}>
                <option value="">Use 50 and above</option>
                {gradeScale.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.gradeLetter} ({item.minScore}-{item.maxScore})
                  </option>
                ))}
              </Select>
            </label>

            <label className="d-grid gap-1">
              <span className="field-label">Manual Override</span>
              <Select name="allowManualOverride" defaultValue={effectivePolicy.allowManualOverride ? "on" : "off"}>
                <option value="on">Allow admin override</option>
                <option value="off">Only eligible students</option>
              </Select>
            </label>
          </div>

          <div className="d-grid gap-2">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
              <span className="field-label mb-0">Compulsory Subjects</span>
              <span className="small text-muted">
                Current rule: pass grade {effectivePolicy.passGradeLabel}, minimum {effectivePolicy.minimumPassedSubjects} passed subject{effectivePolicy.minimumPassedSubjects === 1 ? "" : "s"}
              </span>
            </div>

            {subjects.length === 0 ? (
              <p className="section-subtle mb-0">Create subjects first before choosing compulsory subjects for promotion.</p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {subjects.map((subject) => {
                  const checked = effectivePolicy.compulsorySubjectIds.includes(subject.id);
                  return (
                    <label key={subject.id} className="d-flex align-items-center gap-2 rounded border px-3 py-2 bg-white">
                      <input type="checkbox" name="compulsorySubjectIds" value={subject.id} defaultChecked={checked} />
                      <span>{subject.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <p className="small text-muted mb-0">
              {compulsorySubjectNames.length > 0
                ? `Compulsory subjects: ${compulsorySubjectNames.join(", ")}.`
                : "No compulsory subjects selected yet."}
            </p>
            <Button variant="primary" type="submit">
              Save Promotion Rules
            </Button>
          </div>
        </form>
      </Card>

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
        subtitle="Eligibility is evaluated from the school rule set above. You can still review and override manually when that rule is enabled."
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
                  Source: {selectedSessionLabel} / {sourceClass.name} {"->"} Target: {targetTerm.sessionLabel} {targetTerm.termLabel} / {targetClass.name}
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
