import { createTermAction, deleteTermAction, setActiveTermAction } from "@/lib/server/admin-actions";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import Link from "next/link";
import StatCard from "@/components/admin/ui/StatCard";

export default async function AdminTermsPage() {
  const profile = await requireRole("admin");

  const terms = await prisma.term.findMany({
    where: { schoolId: profile.schoolId },
    orderBy: { createdAt: "desc" },
  });

  const activeTerms = terms.filter((term) => term.isActive).length;

  return (
    <>
      <section className="card card-body d-grid gap-3">
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
          <div>
            <p className="section-kicker">Academic Setup</p>
            <h1 className="section-title">Terms</h1>
            <p className="section-subtle">Manage sessions/terms and keep one term active for grading and payments.</p>
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <Link className="btn btn-secondary" href="/app/admin/dashboard">
              Dashboard
            </Link>
            <Link className="btn btn-secondary" href="/app/admin/grading/assessment-types">
              Grading
            </Link>
          </div>
        </div>
        <div className="row g-3">
          <div className="col-12 col-sm-6 col-lg-4">
            <StatCard label="Total Terms" value={terms.length} icon="fas fa-calendar-alt" cardVariant="secondary" />
          </div>
          <div className="col-12 col-sm-6 col-lg-4">
            <StatCard label="Active Terms" value={activeTerms} icon="fas fa-check-circle" cardVariant="success" />
          </div>
        </div>
        <form action={createTermAction} className="grid gap-3 md:grid-cols-4">
          <input name="sessionLabel" className="form-control" placeholder="2025/2026" required />
          <input name="termLabel" className="form-control" placeholder="First Term" required />
          <label className="d-flex align-items-center gap-2 text-sm">
            <input name="isActive" type="checkbox" />
            Set active
          </label>
          <button className="btn btn-primary" type="submit">
            Add Term
          </button>
        </form>
      </section>

      <section className="card card-body table-responsive">
        <h2 className="section-heading">Term Directory</h2>
        <table className="mt-2">
          <thead>
            <tr>
              <th>Session</th>
              <th>Term</th>
              <th>Active</th>
              <th />
              <th />
            </tr>
          </thead>
          <tbody>
            {terms.map((term) => (
              <tr key={term.id}>
                <td>{term.sessionLabel}</td>
                <td>{term.termLabel}</td>
                <td>{term.isActive ? "Yes" : "No"}</td>
                <td>
                  {!term.isActive && (
                    <form action={setActiveTermAction}>
                      <input type="hidden" name="termId" value={term.id} />
                      <button className="btn btn-secondary" type="submit">
                        Make Active
                      </button>
                    </form>
                  )}
                </td>
                <td>
                  <form action={deleteTermAction}>
                    <input type="hidden" name="termId" value={term.id} />
                    <button className="btn btn-danger" type="submit">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {terms.length === 0 && (
              <tr>
                <td colSpan={5}>No terms yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
