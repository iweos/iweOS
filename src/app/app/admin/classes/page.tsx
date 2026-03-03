import { createClassAction, deleteClassAction } from "@/lib/server/admin-actions";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import Link from "next/link";

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
      <section className="section-panel space-y-4">
        <div className="management-header">
          <div>
            <p className="section-kicker">Academic Setup</p>
            <h1 className="section-title">Classes</h1>
            <p className="section-subtle">Create class groups before student enrollment and class-subject assignments.</p>
          </div>
          <div className="management-actions">
            <Link className="btn btn-muted" href="/app/admin/subjects">
              Subjects
            </Link>
            <Link className="btn btn-muted" href="/app/admin/students">
              Students
            </Link>
          </div>
        </div>
        <div className="management-stats">
          <article className="metric-card">
            <p className="metric-label">Total Classes</p>
            <p className="metric-value">{classes.length}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Created This Month</p>
            <p className="metric-value">{createdThisMonth}</p>
          </article>
        </div>
        <form action={createClassAction} className="grid max-w-xl gap-3 md:grid-cols-[1fr_auto]">
          <input name="name" className="input" placeholder="e.g. JSS 1A" required />
          <button className="btn btn-primary" type="submit">
            Add Class
          </button>
        </form>
      </section>

      <section className="section-panel table-wrap">
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
