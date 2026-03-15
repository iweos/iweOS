import { ProfileRole } from "@prisma/client";
import TeacherConductTable from "@/components/teacher/TeacherConductTable";
import { requireTeacherPortalContext } from "@/lib/server/auth";
import { isPrismaSchemaMismatchError } from "@/lib/server/prisma-errors";
import { prisma } from "@/lib/server/prisma";

type TeacherConductSearchParams = {
  teacherProfileId?: string;
  termId?: string;
  classId?: string;
  studentId?: string;
};

export default async function TeacherConductPage({
  searchParams,
}: {
  searchParams: Promise<TeacherConductSearchParams>;
}) {
  const params = await searchParams;
  const context = await requireTeacherPortalContext(params.teacherProfileId);

  let terms: Array<{ id: string; sessionLabel: string; termLabel: string; isActive: boolean }> = [];
  let classesInView: Array<{ id: string; name: string }> = [];
  let conductSections: Array<{
    id: string;
    name: string;
    categories: Array<{ id: string; name: string; maxScore: number }>;
  }> = [];

  try {
    [terms, classesInView, conductSections] = await Promise.all([
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
      prisma.conductSection.findMany({
        where: {
          schoolId: context.actorProfile.schoolId,
          isActive: true,
        },
        orderBy: [{ orderIndex: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          categories: {
            where: { isActive: true },
            orderBy: [{ orderIndex: "asc" }, { name: "asc" }],
            select: { id: true, name: true, maxScore: true },
          },
        },
      }),
    ]);
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return (
        <section className="section-panel space-y-2">
          <p className="section-kicker">Teacher Portal</p>
          <h1 className="section-title">Conduct Setup Required</h1>
          <p className="section-subtle">
            Production is missing the latest conduct schema. Run <code>npx prisma migrate deploy</code> against the
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

  let enrollments: Array<{
    id: string;
    studentId: string;
    student: {
      studentCode: string;
      fullName: string;
    };
  }> = [];
  let existingConducts: Array<{
    studentId: string;
    conductCategoryId: string;
    score: number;
  }> = [];

  try {
    enrollments =
      selectedClassId && selectedTermId
        ? await prisma.enrollment.findMany({
            where: {
              schoolId: context.actorProfile.schoolId,
              classId: selectedClassId,
              termId: selectedTermId,
            },
            include: {
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
          })
        : [];

    if (selectedClassId && selectedTermId) {
      const rawConducts = await prisma.studentConduct.findMany({
        where: {
          schoolId: context.actorProfile.schoolId,
          classId: selectedClassId,
          termId: selectedTermId,
        },
        select: {
          studentId: true,
          conductCategoryId: true,
          score: true,
        },
      });

      existingConducts = rawConducts.map((row) => ({
        studentId: row.studentId,
        conductCategoryId: row.conductCategoryId,
        score: Number(row.score),
      }));
    }
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return (
        <section className="section-panel space-y-2">
          <p className="section-kicker">Teacher Portal</p>
          <h1 className="section-title">Conduct Setup Required</h1>
          <p className="section-subtle">
            Production is missing the latest conduct schema. Run <code>npx prisma migrate deploy</code> against the
            production database, then redeploy the app.
          </p>
        </section>
      );
    }
    throw error;
  }

  const conductMap = new Map(
    existingConducts.map((row) => [`${row.studentId}:${row.conductCategoryId}`, row.score]),
  );
  const activeConductSections = conductSections.filter((section) => section.categories.length > 0);
  const conductCategories = activeConductSections.flatMap((section) => section.categories);
  const selectedStudentId =
    params.studentId && enrollments.some((enrollment) => enrollment.studentId === params.studentId)
      ? params.studentId
      : enrollments[0]?.studentId;
  const selectedStudent = enrollments.find((enrollment) => enrollment.studentId === selectedStudentId) ?? null;

  return (
    <>
      <section className="section-panel space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="section-kicker">Teacher Portal</p>
            <h1 className="section-title">Conduct</h1>
            <p className="section-subtle">
              {context.mode === "admin_override"
                ? "Admin override: submit conduct ratings across all classes"
                : `Working as: ${context.effectiveTeacherProfile.fullName}`}
            </p>
          </div>
        </div>

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
            <button className="btn btn-muted" type="submit">
              Load
            </button>
          </div>
        </form>
      </section>

      <section className="section-panel space-y-3">
        <h2 className="section-heading">Student Conduct</h2>
        {!selectedClassId || !selectedTermId ? (
          <p className="section-subtle">No valid class/term in this view.</p>
        ) : activeConductSections.length === 0 ? (
          <p className="section-subtle">No active conduct categories found. Ask admin to configure them under grading.</p>
        ) : !selectedStudent ? (
          <p className="section-subtle">No enrolled students found for the selected class and term.</p>
        ) : (
          <TeacherConductTable
            teacherProfileId={params.teacherProfileId}
            termId={selectedTermId}
            classId={selectedClassId}
            conductSections={activeConductSections}
            selectedStudent={{
              enrollmentId: selectedStudent.id,
              studentId: selectedStudent.studentId,
              studentCode: selectedStudent.student.studentCode,
              fullName: selectedStudent.student.fullName,
              values: Object.fromEntries(
                conductCategories.map((category) => [
                  category.id,
                  (conductMap.get(`${selectedStudent.studentId}:${category.id}`) ?? 0).toString(),
                ]),
              ),
            }}
          />
        )}
      </section>
    </>
  );
}
