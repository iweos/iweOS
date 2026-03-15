import { createSessionBundleAction, deleteTermAction, setActiveTermAction } from "@/lib/server/admin-actions";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import Link from "next/link";
import StatCard from "@/components/admin/ui/StatCard";

export default async function AdminTermsPage() {
  const profile = await requireRole("admin");

  const terms = await prisma.term.findMany({
    where: { schoolId: profile.schoolId },
    orderBy: [{ sessionLabel: "desc" }, { createdAt: "asc" }],
  });

  const sessionCount = new Set(terms.map((term) => term.sessionLabel)).size;
  const activeTerms = terms.filter((term) => term.isActive).length;

  return (
    <>
      <section className="card card-body d-grid gap-3">
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
          <div>
            <p className="section-kicker">Academic Setup</p>
            <h1 className="section-title">Sessions & Terms</h1>
            <p className="section-subtle">Create a session once, then generate the correct term or semester structure for it.</p>
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
            <StatCard label="Total Sessions" value={sessionCount} icon="fas fa-layer-group" cardVariant="primary" />
          </div>
          <div className="col-12 col-sm-6 col-lg-4">
            <StatCard label="Total Terms" value={terms.length} icon="fas fa-calendar-alt" cardVariant="secondary" />
          </div>
          <div className="col-12 col-sm-6 col-lg-4">
            <StatCard label="Active Terms" value={activeTerms} icon="fas fa-check-circle" cardVariant="success" />
          </div>
        </div>
        <form action={createSessionBundleAction} className="grid gap-3 md:grid-cols-4">
          <input name="sessionLabel" className="form-control" placeholder="2025/2026" required />
          <select name="structure" className="form-select" defaultValue="three_terms">
            <option value="three_terms">Three Terms</option>
            <option value="two_semesters">Two Semesters</option>
            <option value="custom">Custom</option>
          </select>
          <label className="d-flex align-items-center gap-2 text-sm">
            <input name="setFirstActive" type="checkbox" />
            Set first term active
          </label>
          <button className="btn btn-primary" type="submit">
            Create Session Terms
          </button>
          <div className="md:col-span-4 d-grid gap-1">
            <label className="field-label" htmlFor="customLabels">
              Custom Sub-session Labels
            </label>
            <textarea
              id="customLabels"
              name="customLabels"
              className="form-control"
              rows={4}
              placeholder={"Use only when structure is Custom.\nExample:\nFirst Half\nMid-Term Break Session\nSecond Half"}
            />
            <p className="small text-muted mb-0">
              Enter one label per line, or separate them with commas. You can add as many as needed, up to 12.
            </p>
          </div>
        </form>
      </section>

      <section className="card card-body">
        <h2 className="section-heading">Term Directory</h2>
        <TableWrap className="mt-2">
          <Table>
          <thead>
            <tr>
              <Th>Session</Th>
              <Th>Term</Th>
              <Th>Active</Th>
              <Th />
              <Th />
            </tr>
          </thead>
          <tbody>
            {terms.map((term) => (
              <tr key={term.id}>
                <Td>{term.sessionLabel}</Td>
                <Td>{term.termLabel}</Td>
                <Td>{term.isActive ? "Yes" : "No"}</Td>
                <Td>
                  {!term.isActive && (
                    <form action={setActiveTermAction}>
                      <input type="hidden" name="termId" value={term.id} />
                      <button className="btn btn-secondary" type="submit">
                        Make Active
                      </button>
                    </form>
                  )}
                </Td>
                <Td>
                  <form action={deleteTermAction}>
                    <input type="hidden" name="termId" value={term.id} />
                    <button className="btn btn-danger" type="submit">
                      Delete
                    </button>
                  </form>
                </Td>
              </tr>
            ))}
            {terms.length === 0 && (
              <tr>
                <Td colSpan={5}>No terms yet.</Td>
              </tr>
            )}
          </tbody>
          </Table>
        </TableWrap>
      </section>
    </>
  );
}
