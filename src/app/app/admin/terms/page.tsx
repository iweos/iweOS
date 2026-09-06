import Link from "next/link";
import AdminFlashNotice from "@/components/admin/AdminFlashNotice";
import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";
import SetupActionPanel from "@/components/admin/SetupActionPanel";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import Section from "@/components/admin/ui/Section";
import StatCard from "@/components/admin/ui/StatCard";
import { createSessionBundleAction, deleteTermAction, setActiveTermAction } from "@/lib/server/admin-actions";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

type AdminTermsSearchParams = {
  status?: string;
  message?: string;
};

export default async function AdminTermsPage({
  searchParams,
}: {
  searchParams: Promise<AdminTermsSearchParams>;
}) {
  const profile = await requireRole("admin");
  const params = await searchParams;
  const status = params.status === "success" || params.status === "error" ? params.status : null;
  const message = (params.message ?? "").trim();

  const terms = await prisma.term.findMany({
    where: { schoolId: profile.schoolId },
    orderBy: [{ sessionLabel: "desc" }, { createdAt: "asc" }],
  });

  const sessionCount = new Set(terms.map((term) => term.sessionLabel)).size;
  const activeTerms = terms.filter((term) => term.isActive).length;

  return (
    <Section className="admin-workspace-section">
      {status && message ? <AdminFlashNotice status={status} message={message} /> : null}
      <PageHeader
        title="Sessions & Terms"
        subtitle="Create one academic session and generate its complete term or semester structure."
        rightActions={
          <>
            <Link className="btn btn-secondary" href="/app/admin/dashboard">Dashboard</Link>
            <Link className="btn btn-secondary" href="/app/admin/grading/assessment-types">Grading</Link>
          </>
        }
      />

      <div className="workspace-stat-grid teacher-summary-grid">
        <StatCard label="Sessions" value={sessionCount} icon="fas fa-layer-group" cardVariant="primary" />
        <StatCard label="Terms" value={terms.length} icon="fas fa-calendar-alt" cardVariant="info" />
        <StatCard label="Active Terms" value={activeTerms} icon="fas fa-check-circle" cardVariant="success" />
      </div>

      <SetupActionPanel
        title="Add academic session"
        description="Open the form to generate three terms, two semesters, or a custom structure."
        icon="fas fa-calendar-plus"
      >
        <form action={createSessionBundleAction} className="grid gap-3 md:grid-cols-4">
          <label className="d-grid gap-1">
            <span className="field-label">Session</span>
            <input name="sessionLabel" className="form-control" placeholder="2026/2027" required />
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Structure</span>
            <select name="structure" className="form-select" defaultValue="three_terms">
              <option value="three_terms">Three Terms</option>
              <option value="two_semesters">Two Semesters</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label className="d-flex align-items-center gap-2 text-sm">
            <input name="setFirstActive" type="checkbox" />
            Set first term active
          </label>
          <div className="align-self-end">
            <button className="btn btn-primary" type="submit">Create session</button>
          </div>
          <label className="d-grid gap-1 md:col-span-4">
            <span className="field-label">Custom sub-session labels</span>
            <textarea
              name="customLabels"
              className="form-control"
              rows={3}
              placeholder={"Only needed for Custom. Enter one label per line or separate labels with commas."}
            />
            <small className="text-muted">Up to 12 labels are supported.</small>
          </label>
        </form>
      </SetupActionPanel>

      <Card title="Term Directory" subtitle="Activate the current term or remove an unused term.">
        <TableWrap>
          <Table>
            <thead><tr><Th>Session</Th><Th>Term</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
            <tbody>
              {terms.map((term) => (
                <tr key={term.id}>
                  <Td>{term.sessionLabel}</Td>
                  <Td>{term.termLabel}</Td>
                  <Td><span className={term.isActive ? "status-pill is-active" : "status-pill"}>{term.isActive ? "Active" : "Inactive"}</span></Td>
                  <Td>
                    <div className="conduct-icon-actions">
                      {!term.isActive ? (
                        <form action={setActiveTermAction}>
                          <input type="hidden" name="termId" value={term.id} />
                          <button className="conduct-icon-action" type="submit" title="Make active" aria-label={`Make ${term.termLabel} active`}>
                            <i className="fas fa-check" aria-hidden="true" />
                          </button>
                        </form>
                      ) : null}
                      <form action={deleteTermAction}>
                        <input type="hidden" name="termId" value={term.id} />
                        <button className="conduct-icon-action is-danger" type="submit" title="Delete term" aria-label={`Delete ${term.termLabel}`}>
                          <i className="fas fa-trash-alt" aria-hidden="true" />
                        </button>
                      </form>
                    </div>
                  </Td>
                </tr>
              ))}
              {terms.length === 0 ? <tr><Td colSpan={4}>No sessions have been created yet.</Td></tr> : null}
            </tbody>
          </Table>
        </TableWrap>
      </Card>
    </Section>
  );
}
