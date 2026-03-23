import AdminFlashNotice from "@/components/admin/AdminFlashNotice";
import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";
import Select from "@/components/admin/ui/Select";
import StatCard from "@/components/admin/ui/StatCard";
import StudentAttendanceTable from "@/components/grading/StudentAttendanceTable";
import AutoSubmitFilters from "@/components/teacher/AutoSubmitFilters";
import { requireRole } from "@/lib/server/auth";
import { upsertStudentAttendanceAction } from "@/lib/server/admin-actions";
import { isPrismaSchemaMismatchError, schemaSyncMessage } from "@/lib/server/prisma-errors";
import { prisma } from "@/lib/server/prisma";

type AttendanceSearchParams = {
  termId?: string;
  classId?: string;
  status?: string;
  message?: string;
};

export default async function AdminGradingAttendancePage({
  searchParams,
}: {
  searchParams: Promise<AttendanceSearchParams>;
}) {
  const profile = await requireRole("admin");
  const params = await searchParams;
  const status = params.status === "success" || params.status === "error" ? params.status : null;
  const message = (params.message ?? "").trim();

  let terms: Array<{ id: string; sessionLabel: string; termLabel: string; isActive: boolean }> = [];
  let classes: Array<{ id: string; name: string }> = [];
  let enrollments: Array<{ student: { id: string; studentCode: string; fullName: string } }> = [];
  let records: Array<{ studentId: string; timesSchoolOpened: number; timesPresent: number; timesAbsent: number }> = [];

  try {
    [terms, classes] = await Promise.all([
      prisma.term.findMany({
        where: { schoolId: profile.schoolId },
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
        select: { id: true, sessionLabel: true, termLabel: true, isActive: true },
      }),
      prisma.class.findMany({
        where: { schoolId: profile.schoolId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return (
        <Section>
          <PageHeader title="Attendance Setup Required" subtitle="Attendance schema is out of sync for this environment." />
          <Card>
            <p className="small text-muted">{schemaSyncMessage("Attendance")}</p>
          </Card>
        </Section>
      );
    }
    throw error;
  }

  const selectedTermId =
    params.termId && terms.some((term) => term.id === params.termId)
      ? params.termId
      : terms.find((term) => term.isActive)?.id ?? terms[0]?.id ?? "";
  const selectedClassId =
    params.classId && classes.some((klass) => klass.id === params.classId) ? params.classId : classes[0]?.id ?? "";

  if (selectedTermId && selectedClassId) {
    try {
      [enrollments, records] = await Promise.all([
        prisma.enrollment.findMany({
          where: {
            schoolId: profile.schoolId,
            termId: selectedTermId,
            classId: selectedClassId,
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
            schoolId: profile.schoolId,
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
      ]);
    } catch (error) {
      if (isPrismaSchemaMismatchError(error)) {
        return (
          <Section>
            <PageHeader title="Attendance Setup Required" subtitle="Attendance schema is out of sync for this environment." />
            <Card>
              <p className="small text-muted">{schemaSyncMessage("Attendance")}</p>
            </Card>
          </Section>
        );
      }
      throw error;
    }
  }

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
    <Section>
      {status && message ? <AdminFlashNotice status={status} message={message} /> : null}
      <PageHeader
        title="Attendance"
        subtitle="Record attendance figures per student for each session term so result sheets and summaries stay accurate."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students In View" value={rows.length} icon="fas fa-user-graduate" cardVariant="primary" />
        <StatCard label="School Open Total" value={totals.timesSchoolOpened} icon="fas fa-school" cardVariant="info" />
        <StatCard label="Present Total" value={totals.timesPresent} icon="fas fa-user-check" cardVariant="success" />
        <StatCard label="Absent Total" value={totals.timesAbsent} icon="fas fa-user-times" cardVariant="warning" />
      </div>

      <Card title="Attendance Filters" subtitle="Choose the session term and class you want to update.">
        <form method="get" className="grid gap-3 md:grid-cols-3">
          <label className="d-grid gap-1">
            <span className="field-label">Session term</span>
            <Select name="termId" defaultValue={selectedTermId}>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.sessionLabel} {term.termLabel} {term.isActive ? "(Active)" : ""}
                </option>
              ))}
            </Select>
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Class</span>
            <Select name="classId" defaultValue={selectedClassId}>
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

      <Card title="Student Attendance" subtitle="Edit each row and save the attendance values you want on the result sheet.">
        <StudentAttendanceTable rows={rows} termId={selectedTermId} classId={selectedClassId} saveAction={upsertStudentAttendanceAction} />
      </Card>
    </Section>
  );
}
