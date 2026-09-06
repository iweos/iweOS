import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";
import SetupActionPanel from "@/components/admin/SetupActionPanel";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import Section from "@/components/admin/ui/Section";
import StatCard from "@/components/admin/ui/StatCard";
import { assignTeacherToClassAction, removeTeacherClassAssignmentAction } from "@/lib/server/admin-actions";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { ProfileRole } from "@prisma/client";

export default async function AssignmentTeacherClassesPage() {
  const profile = await requireRole("admin");

  const [teachers, classes, assignments] = await Promise.all([
    prisma.profile.findMany({
      where: { schoolId: profile.schoolId, role: ProfileRole.TEACHER, isActive: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.class.findMany({
      where: { schoolId: profile.schoolId },
      orderBy: { name: "asc" },
    }),
    prisma.teacherClassAssignment.findMany({
      where: { schoolId: profile.schoolId },
      include: { teacherProfile: true, class: true },
      orderBy: [{ class: { name: "asc" } }, { teacherProfile: { fullName: "asc" } }],
    }),
  ]);

  return (
    <Section className="admin-workspace-section">
      <PageHeader title="Teacher-Class" subtitle="Assign teachers to the classes they are permitted to manage." />

      <div className="workspace-stat-grid teacher-summary-grid">
        <StatCard label="Active Teachers" value={teachers.length} icon="fas fa-chalkboard-teacher" cardVariant="primary" />
        <StatCard label="Classes" value={classes.length} icon="fas fa-school" cardVariant="info" />
        <StatCard label="Assignments" value={assignments.length} icon="fas fa-link" cardVariant="secondary" />
      </div>

      <SetupActionPanel
        title="Assign teacher to class"
        description="Open this form only when you need to create another teaching assignment."
        icon="fas fa-user-plus"
      >
        <form action={assignTeacherToClassAction} className="grid gap-3 md:grid-cols-3">
          <label className="d-grid gap-1">
            <span className="field-label">Teacher</span>
            <select name="teacherProfileId" className="form-select" required defaultValue="">
              <option value="" disabled>Select teacher</option>
              {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>)}
            </select>
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Class</span>
            <select name="classId" className="form-select" required defaultValue="">
              <option value="" disabled>Select class</option>
              {classes.map((klass) => <option key={klass.id} value={klass.id}>{klass.name}</option>)}
            </select>
          </label>
          <div className="align-self-end">
            <button className="btn btn-primary" type="submit">Assign teacher</button>
          </div>
        </form>
      </SetupActionPanel>

      <Card title="Current Assignments" subtitle="Every active teacher-class relationship in this school.">
        <TableWrap>
          <Table>
            <thead><tr><Th>Teacher</Th><Th>Class</Th><Th>Action</Th></tr></thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <Td>{assignment.teacherProfile.fullName}</Td>
                  <Td>{assignment.class.name}</Td>
                  <Td>
                    <form action={removeTeacherClassAssignmentAction}>
                      <input type="hidden" name="assignmentId" value={assignment.id} />
                      <button className="conduct-icon-action is-danger" type="submit" title="Remove assignment" aria-label={`Remove ${assignment.teacherProfile.fullName} from ${assignment.class.name}`}>
                        <i className="fas fa-unlink" aria-hidden="true" />
                      </button>
                    </form>
                  </Td>
                </tr>
              ))}
              {assignments.length === 0 ? <tr><Td colSpan={3}>No teacher-class assignments.</Td></tr> : null}
            </tbody>
          </Table>
        </TableWrap>
      </Card>
    </Section>
  );
}
