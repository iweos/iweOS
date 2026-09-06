import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";
import SetupActionPanel from "@/components/admin/SetupActionPanel";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import Section from "@/components/admin/ui/Section";
import StatCard from "@/components/admin/ui/StatCard";
import { assignSubjectToClassAction, removeClassSubjectAction } from "@/lib/server/admin-actions";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

export default async function AssignmentClassSubjectsPage() {
  const profile = await requireRole("admin");

  const [classes, subjects, classSubjects] = await Promise.all([
    prisma.class.findMany({ where: { schoolId: profile.schoolId }, orderBy: { name: "asc" } }),
    prisma.subject.findMany({ where: { schoolId: profile.schoolId }, orderBy: { name: "asc" } }),
    prisma.classSubject.findMany({
      where: { schoolId: profile.schoolId },
      include: { class: true, subject: true },
      orderBy: [{ class: { name: "asc" } }, { subject: { name: "asc" } }],
    }),
  ]);

  const assignedSubjectIds = new Set(classSubjects.map((item) => item.subjectId));

  return (
    <Section className="admin-workspace-section">
      <PageHeader title="Class-Subject" subtitle="Build each class curriculum, then open a class only when you need to inspect it." />

      <div className="workspace-stat-grid teacher-summary-grid">
        <StatCard label="Classes" value={classes.length} icon="fas fa-school" cardVariant="primary" />
        <StatCard label="Subjects" value={subjects.length} icon="fas fa-book-open" cardVariant="info" />
        <StatCard label="Class-Subject Links" value={classSubjects.length} icon="fas fa-project-diagram" cardVariant="secondary" />
      </div>

      <SetupActionPanel
        title="Assign subject to class"
        description="Open the assignment form when you need to add a subject to a class curriculum."
        icon="fas fa-plus"
      >
        <form action={assignSubjectToClassAction} className="grid gap-3 md:grid-cols-3">
          <label className="d-grid gap-1">
            <span className="field-label">Class</span>
            <select name="classId" className="form-select" required defaultValue="">
              <option value="" disabled>Select class</option>
              {classes.map((klass) => <option key={klass.id} value={klass.id}>{klass.name}</option>)}
            </select>
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Subject</span>
            <select name="subjectId" className="form-select" required defaultValue="">
              <option value="" disabled>Select subject</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
          </label>
          <div className="align-self-end">
            <button className="btn btn-primary" type="submit">Assign subject</button>
          </div>
        </form>
      </SetupActionPanel>

      <Card
        title="Curriculum By Class"
        subtitle="Select View subjects on a class to inspect or remove its assigned subjects."
      >
        <div className="assignment-drilldown-list">
          {classes.map((klass) => {
            const rows = classSubjects.filter((item) => item.classId === klass.id);
            return (
              <details key={klass.id} className="assignment-drilldown">
                <summary>
                  <span><i className="fas fa-school" aria-hidden="true" /></span>
                  <div><strong>{klass.name}</strong><small>{rows.length} subject{rows.length === 1 ? "" : "s"} assigned</small></div>
                  <span className="assignment-view-label"><i className="fas fa-eye" aria-hidden="true" /> View subjects</span>
                </summary>
                <div className="assignment-drilldown-body">
                  {rows.length > 0 ? (
                    <TableWrap>
                      <Table>
                        <thead><tr><Th>Subject</Th><Th>Action</Th></tr></thead>
                        <tbody>
                          {rows.map((item) => (
                            <tr key={item.id}>
                              <Td>{item.subject.name}</Td>
                              <Td>
                                <form action={removeClassSubjectAction}>
                                  <input type="hidden" name="classSubjectId" value={item.id} />
                                  <button className="conduct-icon-action is-danger" type="submit" title="Remove subject" aria-label={`Remove ${item.subject.name} from ${klass.name}`}>
                                    <i className="fas fa-unlink" aria-hidden="true" />
                                  </button>
                                </form>
                              </Td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </TableWrap>
                  ) : <p className="workspace-empty-copy">No subjects assigned to this class.</p>}
                </div>
              </details>
            );
          })}
          {classes.length === 0 ? <p className="workspace-empty-copy">Create a class before assigning subjects.</p> : null}
        </div>
        {subjects.length > 0 && assignedSubjectIds.size < subjects.length ? (
          <p className="assignment-footnote">{subjects.length - assignedSubjectIds.size} subject{subjects.length - assignedSubjectIds.size === 1 ? "" : "s"} are not assigned to any class yet.</p>
        ) : null}
      </Card>
    </Section>
  );
}
