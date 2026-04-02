import Link from "next/link";
import { ProfileRole } from "@prisma/client";
import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";
import Select from "@/components/admin/ui/Select";
import StatCard from "@/components/admin/ui/StatCard";
import StudentTable from "@/components/students/StudentTable";
import AdminTeacherWorkspaceActions from "@/components/teacher/AdminTeacherWorkspaceActions";
import { requireTeacherPortalContext } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { isPrismaSchemaMismatchError, schemaSyncMessage } from "@/lib/server/prisma-errors";

type TeacherManageStudentsSearchParams = {
  teacherProfileId?: string;
  className?: string;
  status?: string;
};

const allowedStatuses = new Set(["active", "inactive", "graduated", "suspended", "withdrawn"]);

export default async function TeacherStudentDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<TeacherManageStudentsSearchParams>;
}) {
  const params = await searchParams;
  const context = await requireTeacherPortalContext(params.teacherProfileId);

  const classFilter = params.className?.trim() ?? "";
  const statusFilter =
    params.status && allowedStatuses.has(params.status.toLowerCase()) ? params.status.toLowerCase() : "";

  let classes: Array<{ id: string; name: string }> = [];
  try {
    classes =
      context.mode === "admin_override"
        ? await prisma.class.findMany({
            where: { schoolId: context.actorProfile.schoolId },
            orderBy: { name: "asc" },
            select: { id: true, name: true },
          })
        : await prisma.teacherClassAssignment
            .findMany({
              where: {
                schoolId: context.actorProfile.schoolId,
                teacherProfileId: context.effectiveTeacherProfile.id,
              },
              include: { class: true },
              orderBy: { class: { name: "asc" } },
            })
            .then((rows) => rows.map((row) => row.class));
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return (
        <Section>
          <PageHeader title="Students Setup Required" subtitle="Student schema is out of sync for this environment." />
          <Card>
            <p className="small text-muted">{schemaSyncMessage("Student")}</p>
          </Card>
        </Section>
      );
    }

    throw error;
  }

  const classNamesInView = classes.map((klass) => klass.name);
  const effectiveClassFilter = classFilter && classNamesInView.includes(classFilter) ? classFilter : "";

  const where = {
    schoolId: context.actorProfile.schoolId,
    ...(context.mode === "admin_override"
      ? {}
      : {
          OR: [
            { className: { in: classNamesInView } },
            { enrollments: { some: { classId: { in: classes.map((klass) => klass.id) } } } },
          ],
        }),
    ...(effectiveClassFilter ? { className: effectiveClassFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  let students: Array<{
    id: string;
    studentCode: string;
    firstName: string | null;
    lastName: string | null;
    fullName: string;
    className: string | null;
    address: string | null;
    guardianName: string | null;
    guardianPhone: string | null;
    guardianEmail: string | null;
    status: string;
    gender: string | null;
    photoUrl: string | null;
  }> = [];

  try {
    students = await prisma.student.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        studentCode: true,
        firstName: true,
        lastName: true,
        fullName: true,
        className: true,
        address: true,
        guardianName: true,
        guardianPhone: true,
        guardianEmail: true,
        status: true,
        gender: true,
        photoUrl: true,
      },
    });
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return (
        <Section>
          <PageHeader title="Students Setup Required" subtitle="Student schema is out of sync for this environment." />
          <Card>
            <p className="small text-muted">{schemaSyncMessage("Student")}</p>
          </Card>
        </Section>
      );
    }

    throw error;
  }

  const activeStudents = students.filter((student) => student.status.toLowerCase() === "active").length;
  const hasFilters = Boolean(effectiveClassFilter || statusFilter);

  return (
    <Section>
      <PageHeader
        title="Student Directory"
        subtitle={
          context.mode === "admin_override"
            ? "Admin override: open and update student records from the teacher workspace."
            : `Working as: ${context.effectiveTeacherProfile.fullName}`
        }
        rightActions={
          <>
            <AdminTeacherWorkspaceActions mode={context.mode} />
            <Link href="/app/teacher/students" className="btn btn-secondary">
              Open Analytics
            </Link>
          </>
        }
      />

      {context.actorProfile.role === ProfileRole.ADMIN ? (
        <Card>
          <form method="get" className="grid gap-2 md:grid-cols-[1fr_auto]">
            <label className="d-grid gap-1">
              <span className="field-label">View As</span>
              <select className="form-select" name="teacherProfileId" defaultValue={params.teacherProfileId ?? ""}>
                <option value="">Admin Override</option>
                {context.teacherOptions.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.fullName}
                  </option>
                ))}
              </select>
            </label>
            <div className="align-self-end">
              <button className="btn btn-secondary" type="submit">
                Apply
              </button>
            </div>
          </form>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="Students In View" value={students.length} icon="fas fa-user-graduate" cardVariant="info" />
        <StatCard label="Active (Filtered)" value={activeStudents} icon="fas fa-user-check" cardVariant="success" />
      </div>

      <Card title="Directory Filters">
        <form method="get" className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          {context.actorProfile.role === ProfileRole.ADMIN && params.teacherProfileId ? (
            <input type="hidden" name="teacherProfileId" value={params.teacherProfileId} />
          ) : null}

          <label className="d-grid gap-1">
            <span className="field-label">Class</span>
            <Select name="className" defaultValue={effectiveClassFilter}>
              <option value="">All classes</option>
              {classes.map((klass) => (
                <option key={klass.id} value={klass.name}>
                  {klass.name}
                </option>
              ))}
            </Select>
          </label>

          <label className="d-grid gap-1">
            <span className="field-label">Status</span>
            <Select name="status" defaultValue={statusFilter}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
              <option value="suspended">Suspended</option>
              <option value="withdrawn">Withdrawn</option>
            </Select>
          </label>

          <div className="align-self-end d-flex gap-2">
            <button className="btn btn-primary" type="submit">
              Apply Filters
            </button>
            {hasFilters ? (
              <Link
                href={params.teacherProfileId ? `/app/teacher/students/manage?teacherProfileId=${params.teacherProfileId}` : "/app/teacher/students/manage"}
                className="btn btn-secondary"
              >
                Clear Filters
              </Link>
            ) : null}
          </div>
        </form>
      </Card>

      <Card title="Student Directory" subtitle="Teachers can update student identity, contact, status, and photo details for their assigned classes.">
        <StudentTable rows={students} classes={classes} mode="teacher" teacherProfileId={params.teacherProfileId} />
      </Card>
    </Section>
  );
}
