import { ProfileRole } from "@prisma/client";
import AdminFlashNotice from "@/components/admin/AdminFlashNotice";
import AutoSubmitFilters from "@/components/teacher/AutoSubmitFilters";
import GradeEntryTable from "@/components/teacher/GradeEntryTable";
import { requireTeacherPortalContext } from "@/lib/server/auth";
import { isPrismaSchemaMismatchError } from "@/lib/server/prisma-errors";
import { prisma } from "@/lib/server/prisma";

type GradeEntrySearchParams = {
  teacherProfileId?: string;
  termId?: string;
  classId?: string;
  subjectId?: string;
  status?: string;
  message?: string;
};

export default async function TeacherGradeEntryPage({
  searchParams,
}: {
  searchParams: Promise<GradeEntrySearchParams>;
}) {
  const gradingClient = prisma as unknown as {
    assessmentType?: typeof prisma.assessmentType;
    assessmentTemplate?: typeof prisma.assessmentTemplate;
  };
  if (!gradingClient.assessmentType || !gradingClient.assessmentTemplate) {
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
  const status = params.status === "success" || params.status === "error" ? params.status : null;
  const message = (params.message ?? "").trim();
  const context = await requireTeacherPortalContext(params.teacherProfileId);
  let terms: Awaited<ReturnType<typeof prisma.term.findMany>> = [];
  let classesInView: Array<{ id: string; name: string }> = [];
  let activeTemplate:
    | {
        id: string;
        name: string;
        isFallback: boolean;
      }
    | null = null;
  let assessmentTypes: Awaited<ReturnType<typeof prisma.assessmentType.findMany>> = [];

  try {
    [terms, classesInView] = await Promise.all([
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
    ]);
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return (
        <section className="section-panel space-y-2">
          <p className="section-kicker">Teacher Portal</p>
          <h1 className="section-title">Score Entry Setup Required</h1>
          <p className="section-subtle">
            Production is missing the latest grading schema. Run <code>npx prisma migrate deploy</code> against the production
            database, then redeploy the app.
          </p>
        </section>
      );
    }

    throw error;
  }

  const selectedTermId = params.termId && terms.some((term) => term.id === params.termId) ? params.termId : terms[0]?.id;
  const selectedClassId =
    params.classId && classesInView.some((klass) => klass.id === params.classId) ? params.classId : classesInView[0]?.id;

  try {
    const termTemplate =
      selectedTermId
        ? await gradingClient.assessmentTemplate.findFirst({
            where: {
              schoolId: context.actorProfile.schoolId,
              termId: selectedTermId,
              isPreset: false,
            },
            select: {
              id: true,
              name: true,
            },
          })
        : null;

    if (termTemplate) {
      activeTemplate = {
        id: termTemplate.id,
        name: termTemplate.name,
        isFallback: false,
      };
    } else {
      const fallbackTemplate = await gradingClient.assessmentTemplate.findFirst({
        where: {
          schoolId: context.actorProfile.schoolId,
          isPreset: true,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
      });

      activeTemplate = fallbackTemplate
        ? {
            id: fallbackTemplate.id,
            name: fallbackTemplate.name,
            isFallback: true,
          }
        : null;
    }

    assessmentTypes = activeTemplate
      ? await gradingClient.assessmentType.findMany({
          where: {
            schoolId: context.actorProfile.schoolId,
            templateId: activeTemplate.id,
            isActive: true,
          },
          orderBy: { orderIndex: "asc" },
        })
      : [];
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return (
        <section className="section-panel space-y-2">
          <p className="section-kicker">Teacher Portal</p>
          <h1 className="section-title">Score Entry Setup Required</h1>
          <p className="section-subtle">
            Production is missing the latest grading schema. Run <code>npx prisma migrate deploy</code> against the production
            database, then redeploy the app.
          </p>
        </section>
      );
    }

    throw error;
  }

  let classSubjects: Array<{
    id: string;
    subjectId: string;
    subject: {
      name: string;
    };
  }> = [];
  let selectedSubjectId: string | undefined;
  let enrollments: Array<{
    id: string;
    studentId: string;
    student: {
      studentCode: string;
      fullName: string;
    };
  }> = [];
  let existingScores: Array<{
    studentId: string;
    total: number;
    grade: string | null;
    assessmentValues: Array<{
      assessmentTypeId: string;
      value: number;
    }>;
  }> = [];

  try {
    classSubjects = selectedClassId
      ? await prisma.classSubject.findMany({
          where: {
            schoolId: context.actorProfile.schoolId,
            classId: selectedClassId,
          },
          include: { subject: true },
          orderBy: { subject: { name: "asc" } },
        })
      : [];

    selectedSubjectId =
      params.subjectId && classSubjects.some((pair) => pair.subjectId === params.subjectId)
        ? params.subjectId
        : classSubjects[0]?.subjectId;

    enrollments =
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

    if (selectedTermId && selectedSubjectId && selectedClassId) {
      const rawExistingScores = await prisma.score.findMany({
        where: {
          schoolId: context.actorProfile.schoolId,
          termId: selectedTermId,
          classId: selectedClassId,
          subjectId: selectedSubjectId,
        },
        include: {
          assessmentValues: true,
        },
      });

      existingScores = rawExistingScores.map((score) => ({
        studentId: score.studentId,
        total: Number(score.total),
        grade: score.grade,
        assessmentValues: score.assessmentValues.map((item) => ({
          assessmentTypeId: item.assessmentTypeId,
          value: Number(item.value),
        })),
      }));
    } else {
      existingScores = [];
    }
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return (
        <section className="section-panel space-y-2">
          <p className="section-kicker">Teacher Portal</p>
          <h1 className="section-title">Score Entry Setup Required</h1>
          <p className="section-subtle">
            Production is missing the latest grading schema. Run <code>npx prisma migrate deploy</code> against the production
            database, then redeploy the app.
          </p>
        </section>
      );
    }

    throw error;
  }

  const scoreMap = new Map(
    existingScores.map((score) => [
      score.studentId,
      {
        total: Number(score.total),
        grade: score.grade,
        values: new Map(score.assessmentValues.map((item) => [item.assessmentTypeId, Number(item.value)])),
      },
    ]),
  );

  const weightTotal = assessmentTypes.reduce((sum, item) => sum + item.weight, 0);
  const selectedTerm = terms.find((term) => term.id === selectedTermId) ?? null;
  const selectedClass = classesInView.find((klass) => klass.id === selectedClassId) ?? null;
  const selectedSubject = classSubjects.find((pair) => pair.subjectId === selectedSubjectId) ?? null;
  const selectedTermLabel = selectedTerm ? `${selectedTerm.sessionLabel} ${selectedTerm.termLabel}` : "No term selected";
  const selectedClassLabel = selectedClass?.name ?? "No class selected";
  const selectedSubjectLabel = selectedSubject?.subject.name ?? "No subject selected";

  return (
    <>
      {status && message ? <AdminFlashNotice status={status} message={message} /> : null}
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
            <AutoSubmitFilters />
          </div>
        </form>

        <p className="text-xs text-[var(--muted)]">
          Assessment Scheme: {activeTemplate?.name ?? "None"}
          {activeTemplate?.isFallback ? " (global fallback)" : ""}
          {" "}• Score allocation total: {weightTotal}
        </p>
      </section>

      <section className="section-panel space-y-3">
        <h2 className="section-heading">Student Scores</h2>
        {!selectedClassId || !selectedTermId || !selectedSubjectId ? (
          <p className="section-subtle">No valid class/term/subject in this view.</p>
        ) : !activeTemplate ? (
          <p className="section-subtle">No assessment scheme is assigned to this term yet.</p>
        ) : assessmentTypes.length === 0 ? (
          <p className="section-subtle">No active assessment items found in the selected term scheme.</p>
        ) : (
          <GradeEntryTable
            teacherProfileId={params.teacherProfileId}
            termId={selectedTermId}
            classId={selectedClassId}
            subjectId={selectedSubjectId}
            termLabel={selectedTermLabel}
            className={selectedClassLabel}
            subjectName={selectedSubjectLabel}
            assessmentTypes={assessmentTypes.map((assessment) => ({
              id: assessment.id,
              name: assessment.name,
              weight: assessment.weight,
            }))}
            initialRows={enrollments.map((enrollment) => {
              const score = scoreMap.get(enrollment.studentId);
              return {
                enrollmentId: enrollment.id,
                studentId: enrollment.studentId,
                studentCode: enrollment.student.studentCode,
                fullName: enrollment.student.fullName,
                total: score?.total ?? null,
                grade: score?.grade ?? null,
                values: Object.fromEntries(
                  assessmentTypes.map((assessment) => [
                    assessment.id,
                    score?.values.get(assessment.id)?.toString() ?? "0",
                  ]),
                ),
              };
            })}
          />
        )}
      </section>
    </>
  );
}
