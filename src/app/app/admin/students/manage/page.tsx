import Link from "next/link";
import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";
import Select from "@/components/admin/ui/Select";
import StatCard from "@/components/admin/ui/StatCard";
import StudentTable from "@/components/students/StudentTable";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { isPrismaSchemaMismatchError, schemaSyncMessage } from "@/lib/server/prisma-errors";

type ManageStudentsSearchParams = {
  className?: string;
  status?: string;
};

const allowedStatuses = new Set(["active", "inactive", "graduated", "suspended"]);

export default async function AdminStudentsManagePage({
  searchParams,
}: {
  searchParams: Promise<ManageStudentsSearchParams>;
}) {
  const profile = await requireRole("admin");
  const params = await searchParams;

  const classFilter = params.className?.trim() ?? "";
  const statusFilter =
    params.status && allowedStatuses.has(params.status.toLowerCase()) ? params.status.toLowerCase() : "";

  const where = {
    schoolId: profile.schoolId,
    ...(classFilter ? { className: classFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  let studentDirectoryRows: Array<{
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

  let classes: Array<{ id: string; name: string }> = [];

  try {
    [studentDirectoryRows, classes] = await Promise.all([
      prisma.student.findMany({
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
          <PageHeader title="Students Setup Required" subtitle="Student schema is out of sync for this environment." />
          <Card>
            <p className="small text-muted">{schemaSyncMessage("Student")}</p>
          </Card>
        </Section>
      );
    }
    throw error;
  }

  const students = studentDirectoryRows;

  const activeStudents = students.filter((student) => student.status.toLowerCase() === "active").length;
  const hasFilters = Boolean(classFilter || statusFilter);

  return (
    <Section>
      <PageHeader
        title="Manage Students"
        subtitle="Student directory with filter by class and status."
        rightActions={
          <>
            <Link href="/app/admin/students/add" className="btn btn-primary">
              Add Student
            </Link>
            {hasFilters ? (
              <Link href="/app/admin/students/manage" className="btn btn-secondary">
                Clear Filters
              </Link>
            ) : null}
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="Filtered Students" value={students.length} icon="fas fa-filter" cardVariant="info" />
        <StatCard label="Active (Filtered)" value={activeStudents} icon="fas fa-user-check" cardVariant="success" />
      </div>

      <Card title="Directory Filters">
        <form method="get" className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <label className="d-grid gap-1">
            <span className="field-label">Class</span>
            <Select name="className" defaultValue={classFilter}>
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
            </Select>
          </label>

          <div className="align-self-end">
            <button className="btn btn-primary" type="submit">
              Apply Filters
            </button>
          </div>
        </form>
      </Card>

      <Card title="Student Directory">
        <StudentTable rows={students} classes={classes} />
      </Card>
    </Section>
  );
}
