import { ProfileRole } from "@prisma/client";
import { requireTeacherPortalContext } from "@/lib/server/auth";
import { saveScoresAction } from "@/lib/server/teacher-actions";
import { prisma } from "@/lib/server/prisma";

type GradeEntrySearchParams = {
  teacherProfileId?: string;
  termId?: string;
  classId?: string;
  subjectId?: string;
};

export default async function TeacherGradeEntryPage({
  searchParams,
}: {
  searchParams: Promise<GradeEntrySearchParams>;
}) {
  const gradingClient = prisma as unknown as { assessmentType?: typeof prisma.assessmentType };
  if (!gradingClient.assessmentType) {
    return (
      <section className="section-panel space-y-2">
        <p className="section-kicker">Teacher Portal</p>
        <h1 className="section-title">Setup Required</h1>
        <p className="section-subtle">
          Assessment types are not available in the current Prisma client. Run{" "}
          <code>npm run prisma:generate && npm run prisma:migrate</code>, then restart <code>npm run dev</code>.
        </p>
      </section>
    );
  }

  const params = await searchParams;
  const context = await requireTeacherPortalContext(params.teacherProfileId);

  const [terms, classesInView, assessmentTypes] = await Promise.all([
    prisma.term.findMany({
      where: { schoolId: context.actorProfile.schoolId },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    }),
    context.mode === "admin_override"
      ? prisma.class.findMany({
          where: { schoolId: context.actorProfile.schoolId },
          orderBy: { name: "asc" },
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
    gradingClient.assessmentType.findMany({
      where: {
        schoolId: context.actorProfile.schoolId,
        isActive: true,
      },
      orderBy: { orderIndex: "asc" },
    }),
  ]);

  const selectedTermId = params.termId && terms.some((term) => term.id === params.termId) ? params.termId : terms[0]?.id;
  const selectedClassId =
    params.classId && classesInView.some((klass) => klass.id === params.classId) ? params.classId : classesInView[0]?.id;

  const classSubjects = selectedClassId
    ? await prisma.classSubject.findMany({
        where: {
          schoolId: context.actorProfile.schoolId,
          classId: selectedClassId,
        },
        include: { subject: true },
        orderBy: { subject: { name: "asc" } },
      })
    : [];

  const selectedSubjectId =
    params.subjectId && classSubjects.some((pair) => pair.subjectId === params.subjectId)
      ? params.subjectId
      : classSubjects[0]?.subjectId;

  const enrollments =
    selectedClassId && selectedTermId
      ? await prisma.enrollment.findMany({
          where: {
            schoolId: context.actorProfile.schoolId,
            classId: selectedClassId,
            termId: selectedTermId,
          },
          include: {
            student: true,
          },
          orderBy: { student: { fullName: "asc" } },
        })
      : [];

  const existingScores =
    selectedTermId && selectedSubjectId && selectedClassId
      ? await prisma.score.findMany({
          where: {
            schoolId: context.actorProfile.schoolId,
            termId: selectedTermId,
            classId: selectedClassId,
            subjectId: selectedSubjectId,
          },
          include: {
            assessmentValues: true,
          },
        })
      : [];

  const scoreMap = new Map(
    existingScores.map((score) => [
      score.studentId,
      {
        total: score.total,
        grade: score.grade,
        values: new Map(score.assessmentValues.map((item) => [item.assessmentTypeId, item.value])),
      },
    ]),
  );

  const weightTotal = assessmentTypes.reduce((sum, item) => sum + item.weight, 0);

  return (
    <>
      <section className="section-panel space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="section-kicker">Teacher Portal</p>
            <h1 className="section-title">Grade Entry</h1>
            <p className="section-subtle">
              {context.mode === "admin_override"
                ? "Admin override: submit adjustments across all classes"
                : `Working as: ${context.effectiveTeacherProfile.fullName}`}
            </p>
          </div>
        </div>

        <form method="get" className="grid gap-2 md:grid-cols-5">
          {context.actorProfile.role === ProfileRole.ADMIN && (
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
          )}

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
            <span className="field-label">Subject</span>
            <select className="select" name="subjectId" defaultValue={selectedSubjectId}>
              {classSubjects.map((pair) => (
                <option key={pair.id} value={pair.subjectId}>
                  {pair.subject.name}
                </option>
              ))}
            </select>
          </label>

          <div className="self-end">
            <button className="btn btn-muted" type="submit">
              Load
            </button>
          </div>
        </form>

        <p className="text-xs text-[var(--muted)]">Assessment weight total: {weightTotal}%</p>
      </section>

      <section className="section-panel space-y-3">
        <h2 className="section-heading">Student Scores</h2>
        {!selectedClassId || !selectedTermId || !selectedSubjectId ? (
          <p className="section-subtle">No valid class/term/subject in this view.</p>
        ) : (
          <form action={saveScoresAction} className="space-y-3">
            <input type="hidden" name="termId" value={selectedTermId} />
            <input type="hidden" name="classId" value={selectedClassId} />
            <input type="hidden" name="subjectId" value={selectedSubjectId} />
            <input type="hidden" name="teacherProfileId" value={params.teacherProfileId ?? ""} />

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    {assessmentTypes.map((assessment) => (
                      <th key={assessment.id}>
                        {assessment.name}
                        <br />
                        <span className="text-xs text-[var(--muted)]">{assessment.weight}%</span>
                      </th>
                    ))}
                    <th>Total</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enrollment) => {
                    const score = scoreMap.get(enrollment.studentId);
                    return (
                      <tr key={enrollment.id}>
                        <td>
                          {enrollment.student.studentCode} - {enrollment.student.fullName}
                        </td>
                        {assessmentTypes.map((assessment) => (
                          <td key={`${enrollment.id}_${assessment.id}`}>
                            <input
                              name={`score_${enrollment.studentId}_${assessment.id}`}
                              type="number"
                              min={0}
                              max={100}
                              step={0.01}
                              className="input"
                              defaultValue={score?.values.get(assessment.id)?.toString() ?? "0"}
                            />
                          </td>
                        ))}
                        <td>{score?.total.toString() ?? "-"}</td>
                        <td>{score?.grade ?? "-"}</td>
                      </tr>
                    );
                  })}
                  {enrollments.length === 0 && (
                    <tr>
                      <td colSpan={assessmentTypes.length + 3}>No enrolled students for this class/term.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <button className="btn btn-primary" type="submit">
              Save Scores
            </button>
          </form>
        )}
      </section>
    </>
  );
}
