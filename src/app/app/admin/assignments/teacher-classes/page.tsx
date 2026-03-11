import { assignTeacherToClassAction, removeTeacherClassAssignmentAction } from "@/lib/server/admin-actions";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
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
      orderBy: { class: { name: "asc" } },
    }),
  ]);

  return (
    <>
      <section className="card card-body d-grid gap-3">
        <h1 className="section-title">Assignments / Teacher-Class</h1>
        <form action={assignTeacherToClassAction} className="grid gap-2 md:grid-cols-3">
          <label className="d-grid gap-1">
            <span className="field-label">Teacher</span>
            <select name="teacherProfileId" className="form-select" required>
              <option value="">Select teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.fullName}
                </option>
              ))}
            </select>
          </label>

          <label className="d-grid gap-1">
            <span className="field-label">Class</span>
            <select name="classId" className="form-select" required>
              <option value="">Select class</option>
              {classes.map((klass) => (
                <option key={klass.id} value={klass.id}>
                  {klass.name}
                </option>
              ))}
            </select>
          </label>

          <div className="align-self-end">
            <button className="btn btn-primary" type="submit">
              Assign
            </button>
          </div>
        </form>
      </section>

      <section className="card card-body">
        <TableWrap>
          <Table>
          <thead>
            <tr>
              <Th>Teacher</Th>
              <Th>Class</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => (
              <tr key={assignment.id}>
                <Td>{assignment.teacherProfile.fullName}</Td>
                <Td>{assignment.class.name}</Td>
                <Td>
                  <form action={removeTeacherClassAssignmentAction}>
                    <input type="hidden" name="assignmentId" value={assignment.id} />
                    <button className="btn btn-danger" type="submit">
                      Remove
                    </button>
                  </form>
                </Td>
              </tr>
            ))}
            {assignments.length === 0 && (
              <tr>
                <Td colSpan={3}>No teacher-class assignments.</Td>
              </tr>
            )}
          </tbody>
          </Table>
        </TableWrap>
      </section>
    </>
  );
}
