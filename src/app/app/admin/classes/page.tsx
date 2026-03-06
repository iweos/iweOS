import { createClassAction, deleteClassAction } from "@/lib/server/admin-actions";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import Link from "next/link";
import StatCard from "@/components/admin/ui/StatCard";

export default async function AdminClassesPage() {
  const profile = await requireRole("admin");

  const classes = await prisma.class.findMany({
    where: { schoolId: profile.schoolId },
    orderBy: { createdAt: "desc" },
  });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const createdThisMonth = classes.filter((klass) => klass.createdAt >= monthStart).length;

  return (
    <>
      <section className="card card-body d-grid gap-3">
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
          <div>
            <p className="section-kicker">Academic Setup</p>
            <h1 className="section-title">Classes</h1>
            <p className="section-subtle">Create class groups before student enrollment and class-subject assignments.</p>
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <Link className="btn btn-secondary" href="/app/admin/subjects">
              Subjects
            </Link>
            <Link className="btn btn-secondary" href="/app/admin/students">
              Students
            </Link>
          </div>
        </div>
        <div className="row g-3">
          <div className="col-12 col-sm-6 col-lg-4">
            <StatCard label="Total Classes" value={classes.length} icon="fas fa-th-large" cardVariant="secondary" />
          </div>
          <div className="col-12 col-sm-6 col-lg-4">
            <StatCard label="Created This Month" value={createdThisMonth} icon="fas fa-calendar-alt" cardVariant="info" />
          </div>
        </div>
        <form action={createClassAction} className="grid max-w-xl gap-3 md:grid-cols-[1fr_auto]">
          <input name="name" className="form-control" placeholder="e.g. JSS 1A" required />
          <button className="btn btn-primary" type="submit">
            Add Class
          </button>
        </form>
      </section>

      <section className="card card-body table-responsive">
        <h2 className="section-heading">Class Directory</h2>
        <table className="mt-2">
          <thead>
            <tr>
              <th>Name</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {classes.map((klass) => (
              <tr key={klass.id}>
                <td>{klass.name}</td>
                <td>{klass.createdAt.toLocaleDateString()}</td>
                <td>
                  <form action={deleteClassAction}>
                    <input type="hidden" name="classId" value={klass.id} />
                    <button className="btn btn-danger" type="submit">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr>
                <td colSpan={3}>No classes yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
