import { ProfileRole } from "@prisma/client";
import AdminFlashNotice from "@/components/admin/AdminFlashNotice";
import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";
import Select from "@/components/admin/ui/Select";
import StatCard from "@/components/admin/ui/StatCard";
import StudentAttendanceTable from "@/components/grading/StudentAttendanceTable";
import AdminTeacherWorkspaceActions from "@/components/teacher/AdminTeacherWorkspaceActions";
import AutoSubmitFilters from "@/components/teacher/AutoSubmitFilters";
import { requireTeacherPortalContext } from "@/lib/server/auth";
import { saveStudentAttendanceAction } from "@/lib/server/teacher-actions";
import { isPrismaSchemaMismatchError } from "@/lib/server/prisma-errors";
import { prisma } from "@/lib/server/prisma";

type TeacherAttendanceSearchParams = {
  teacherProfileId?: string;
  termId?: string;
  classId?: string;
  status?: string;
  message?: string;
};

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<TeacherAttendanceSearchParams>;
}) {
  const params = await searchParams;
  const status = params.status === "success" || params.status === "error" ? params.status : null;
  const message = (params.message ?? "").trim();
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
          <h1 className="section-title">Attendance Setup Required</h1>
          <p className="section-subtle">
            Production is missing the latest attendance schema. Run <code>npx prisma migrate deploy</code> against the
            production database, then redeploy the app.
          </p>
        </section>
      );
    }
    throw error;
  }

  const selectedTermId = params.termId && terms.some((term) => term.id === params.termId) ? params.termId : terms[0]?.id ?? "";
  const selectedClassId =
    params.classId && classesInView.some((klass) => klass.id === params.classId) ? params.classId : classesInView[0]?.id ?? "";

  const [enrollments, records] =
    selectedTermId && selectedClassId
      ? await Promise.all([
          prisma.enrollment.findMany({
            where: {
              schoolId: context.actorProfile.schoolId,
              termId: selectedTermId,
              classId: selectedClassId,
              student: {
                is: {
                  status: "active",
                },
              },
            },
            orderBy: { student: { fullName: "asc" } },
            select: {
              student: {
                select: {
                  id: true,
                  studentCode: true,
                  fullName: true,
                },
              },
            },
          }),
          prisma.studentAttendance.findMany({
            where: {
              schoolId: context.actorProfile.schoolId,
              termId: selectedTermId,
              classId: selectedClassId,
            },
            select: {
              studentId: true,
              timesSchoolOpened: true,
              timesPresent: true,
              timesAbsent: true,
            },
          }),
        ])
      : [[], []];

  const recordMap = new Map(records.map((item) => [item.studentId, item]));
  const rows = enrollments.map((entry) => {
    const record = recordMap.get(entry.student.id);
    return {
      studentId: entry.student.id,
      studentCode: entry.student.studentCode,
      fullName: entry.student.fullName,
      timesSchoolOpened: record?.timesSchoolOpened ?? 0,
      timesPresent: record?.timesPresent ?? 0,
      timesAbsent: record?.timesAbsent ?? 0,
    };
  });

  const totals = rows.reduce(
    (accumulator, row) => ({
      timesSchoolOpened: accumulator.timesSchoolOpened + row.timesSchoolOpened,
      timesPresent: accumulator.timesPresent + row.timesPresent,
      timesAbsent: accumulator.timesAbsent + row.timesAbsent,
    }),
    { timesSchoolOpened: 0, timesPresent: 0, timesAbsent: 0 },
  );

  return (
    <>
      {status && message ? <AdminFlashNotice status={status} message={message} /> : null}
      <section className="section-panel space-y-3">
        <PageHeader
          title="Attendance"
          subtitle={
            context.mode === "admin_override"
              ? "Admin override: manage attendance across classes."
              : `Working as: ${context.effectiveTeacherProfile.fullName}`
          }
          rightActions={<AdminTeacherWorkspaceActions mode={context.mode} />}
        />

        <form method="get" className="grid gap-2 md:grid-cols-4">
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
            <Select name="termId" defaultValue={selectedTermId}>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.sessionLabel} {term.termLabel} {term.isActive ? "(Active)" : ""}
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-1">
            <span className="field-label">Class</span>
            <Select name="classId" defaultValue={selectedClassId}>
              {classesInView.map((klass) => (
                <option key={klass.id} value={klass.id}>
                  {klass.name}
                </option>
              ))}
            </Select>
          </label>

          <div className="self-end">
            <AutoSubmitFilters />
          </div>
        </form>
      </section>

      <section className="section-panel space-y-3">
        <div className="row g-3">
          <div className="col-12 col-md-6 col-xl-3">
            <StatCard label="Students In View" value={rows.length} icon="fas fa-user-graduate" cardVariant="primary" />
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <StatCard label="School Open Total" value={totals.timesSchoolOpened} icon="fas fa-school" cardVariant="info" />
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <StatCard label="Present Total" value={totals.timesPresent} icon="fas fa-user-check" cardVariant="success" />
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <StatCard label="Absent Total" value={totals.timesAbsent} icon="fas fa-user-times" cardVariant="warning" />
          </div>
        </div>

        <Card title="Student Attendance" subtitle="Edit each row and save attendance for the selected class and term.">
          <StudentAttendanceTable rows={rows} termId={selectedTermId} classId={selectedClassId} saveAction={saveStudentAttendanceAction} />
        </Card>
      </section>
    </>
  );
}
