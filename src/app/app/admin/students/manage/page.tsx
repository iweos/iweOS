import Link from "next/link";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import StudentTable from "@/components/students/StudentTable";

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
  const statusFilter = params.status && allowedStatuses.has(params.status.toLowerCase()) ? params.status.toLowerCase() : "";

  const where = {
    schoolId: profile.schoolId,
    ...(classFilter ? { className: classFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const [students, classes] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: { createdAt: "desc" },
    }),
    prisma.class.findMany({
      where: { schoolId: profile.schoolId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const activeStudents = students.filter((student) => student.status.toLowerCase() === "active").length;
  const hasFilters = Boolean(classFilter || statusFilter);

  return (
    <>
      <section className="section-panel space-y-4">
        <div className="management-header">
          <div>
            <p className="section-kicker">User Management</p>
            <h1 className="section-title">Manage Students</h1>
            <p className="section-subtle">Student directory with filter by class and status.</p>
          </div>
          <div className="management-actions">
            <Link className="btn btn-primary" href="/app/admin/students/add">
              Add Student
            </Link>
            {hasFilters ? (
              <Link className="btn btn-muted" href="/app/admin/students/manage">
                Clear Filters
              </Link>
            ) : null}
          </div>
        </div>

        <div className="management-stats">
          <article className="metric-card">
            <p className="metric-label">Filtered Students</p>
            <p className="metric-value">{students.length}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Active (Filtered)</p>
            <p className="metric-value">{activeStudents}</p>
          </article>
        </div>

        <form method="get" className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <label className="space-y-1">
            <span className="field-label">Class</span>
            <select name="className" className="select" defaultValue={classFilter}>
              <option value="">All classes</option>
              {classes.map((klass) => (
                <option key={klass.id} value={klass.name}>
                  {klass.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="field-label">Status</span>
            <select name="status" className="select" defaultValue={statusFilter}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>

          <div className="self-end">
            <button className="btn btn-primary" type="submit">
              Apply Filters
            </button>
          </div>
        </form>
      </section>

      <section className="section-panel">
        <h2 className="section-heading">Student Directory</h2>
        <StudentTable rows={students} classes={classes} />
      </section>
    </>
  );
}
