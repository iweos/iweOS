import { enrollStudentAction, removeEnrollmentAction } from "@/lib/server/admin-actions";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { isPrismaSchemaMismatchError, schemaSyncMessage } from "@/lib/server/prisma-errors";

export default async function AssignmentEnrollmentsPage() {
  const profile = await requireRole("admin");

  let students: Array<{ id: string; studentCode: string; fullName: string }> = [];
  let classes: Array<{ id: string; name: string }> = [];
  let terms: Array<{ id: string; sessionLabel: string; termLabel: string; isActive: boolean }> = [];
  let enrollments: Array<{
    id: string;
    student: { fullName: string };
    class: { name: string };
    term: { sessionLabel: string; termLabel: string };
  }> = [];

  try {
    [students, classes, terms, enrollments] = await Promise.all([
      prisma.student.findMany({
        where: { schoolId: profile.schoolId },
        orderBy: { fullName: "asc" },
        select: { id: true, studentCode: true, fullName: true },
      }),
      prisma.class.findMany({
        where: { schoolId: profile.schoolId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.term.findMany({
        where: { schoolId: profile.schoolId },
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
        select: { id: true, sessionLabel: true, termLabel: true, isActive: true },
      }),
      prisma.enrollment.findMany({
        where: { schoolId: profile.schoolId },
        include: {
          student: { select: { fullName: true } },
          class: { select: { name: true } },
          term: { select: { sessionLabel: true, termLabel: true } },
        },
        orderBy: [{ class: { name: "asc" } }, { student: { fullName: "asc" } }],
      }),
    ]);
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return (
        <section className="card card-body d-grid gap-2">
          <h1 className="section-title">Enrollments Setup Required</h1>
          <p className="section-subtle">{schemaSyncMessage("Student")}</p>
        </section>
      );
    }
    throw error;
  }

  return (
    <>
      <section className="card card-body d-grid gap-3">
        <h1 className="section-title">Assignments / Enrollments</h1>
        <form action={enrollStudentAction} className="grid gap-2 md:grid-cols-4">
          <label className="d-grid gap-1">
            <span className="field-label">Student</span>
            <select name="studentId" className="form-select" required>
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.studentCode} - {student.fullName}
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

          <label className="d-grid gap-1">
            <span className="field-label">Term</span>
            <select name="termId" className="form-select" required>
              <option value="">Select term</option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.sessionLabel} {term.termLabel} {term.isActive ? "(Active)" : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="align-self-end">
            <button className="btn btn-primary" type="submit">
              Enroll
            </button>
          </div>
        </form>
      </section>

      <section className="card card-body table-responsive">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>Term</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {enrollments.map((row) => (
              <tr key={row.id}>
                <td>{row.student.fullName}</td>
                <td>{row.class.name}</td>
                <td>
                  {row.term.sessionLabel} {row.term.termLabel}
                </td>
                <td>
                  <form action={removeEnrollmentAction}>
                    <input type="hidden" name="enrollmentId" value={row.id} />
                    <button className="btn btn-danger" type="submit">
                      Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {enrollments.length === 0 && (
              <tr>
                <td colSpan={4}>No enrollments yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
