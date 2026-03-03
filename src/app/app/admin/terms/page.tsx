import { createTermAction, deleteTermAction, setActiveTermAction } from "@/lib/server/admin-actions";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import Link from "next/link";

export default async function AdminTermsPage() {
  const profile = await requireRole("admin");

  const terms = await prisma.term.findMany({
    where: { schoolId: profile.schoolId },
    orderBy: { createdAt: "desc" },
  });

  const activeTerms = terms.filter((term) => term.isActive).length;

  return (
    <>
      <section className="section-panel space-y-4">
        <div className="management-header">
          <div>
            <p className="section-kicker">Academic Setup</p>
            <h1 className="section-title">Terms</h1>
            <p className="section-subtle">Manage sessions/terms and keep one term active for grading and payments.</p>
          </div>
          <div className="management-actions">
            <Link className="btn btn-muted" href="/app/admin/dashboard">
              Dashboard
            </Link>
            <Link className="btn btn-muted" href="/app/admin/grading/assessment-types">
              Grading
            </Link>
          </div>
        </div>
        <div className="management-stats">
          <article className="metric-card">
            <p className="metric-label">Total Terms</p>
            <p className="metric-value">{terms.length}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Active Terms</p>
            <p className="metric-value">{activeTerms}</p>
          </article>
        </div>
        <form action={createTermAction} className="grid gap-3 md:grid-cols-4">
          <input name="sessionLabel" className="input" placeholder="2025/2026" required />
          <input name="termLabel" className="input" placeholder="First Term" required />
          <label className="flex items-center gap-2 text-sm">
            <input name="isActive" type="checkbox" />
            Set active
          </label>
          <button className="btn btn-primary" type="submit">
            Add Term
          </button>
        </form>
      </section>

      <section className="section-panel table-wrap">
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
                      <button className="btn btn-muted" type="submit">
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
