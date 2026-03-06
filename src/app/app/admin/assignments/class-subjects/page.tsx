import { assignSubjectToClassAction, removeClassSubjectAction } from "@/lib/server/admin-actions";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

export default async function AssignmentClassSubjectsPage() {
  const profile = await requireRole("admin");

  const [classes, subjects, classSubjects] = await Promise.all([
    prisma.class.findMany({
      where: { schoolId: profile.schoolId },
      orderBy: { name: "asc" },
    }),
    prisma.subject.findMany({
      where: { schoolId: profile.schoolId },
      orderBy: { name: "asc" },
    }),
    prisma.classSubject.findMany({
      where: { schoolId: profile.schoolId },
      include: { class: true, subject: true },
      orderBy: [{ class: { name: "asc" } }, { subject: { name: "asc" } }],
    }),
  ]);

  return (
    <>
      <section className="card card-body d-grid gap-3">
        <h1 className="section-title">Assignments / Class-Subject</h1>
        <form action={assignSubjectToClassAction} className="grid gap-2 md:grid-cols-3">
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
            <span className="field-label">Subject</span>
            <select name="subjectId" className="form-select" required>
              <option value="">Select subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
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

      <section className="card card-body table-responsive">
        <table>
          <thead>
            <tr>
              <th>Class</th>
              <th>Subject</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {classSubjects.map((item) => (
              <tr key={item.id}>
                <td>{item.class.name}</td>
                <td>{item.subject.name}</td>
                <td>
                  <form action={removeClassSubjectAction}>
                    <input type="hidden" name="classSubjectId" value={item.id} />
                    <button className="btn btn-danger" type="submit">
                      Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {classSubjects.length === 0 && (
              <tr>
                <td colSpan={3}>No class-subject assignments.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
