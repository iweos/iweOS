import { addSubjectsToClassAction, deleteSubjectAction, removeClassSubjectAction } from "@/lib/server/admin-actions";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import Link from "next/link";

export default async function AdminSubjectsPage() {
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
      <section className="section-panel space-y-4">
        <div className="management-header">
          <div>
            <p className="section-kicker">Academic Setup</p>
            <h1 className="section-title">Subjects by Class</h1>
            <p className="section-subtle">Select a class and add one or many subjects (comma or new-line separated).</p>
          </div>
          <div className="management-actions">
            <Link className="btn btn-muted" href="/app/admin/classes">
              Classes
            </Link>
            <Link className="btn btn-muted" href="/app/admin/assignments/class-subjects">
              Assignments
            </Link>
          </div>
        </div>
        <div className="management-stats">
          <article className="metric-card">
            <p className="metric-label">Classes</p>
            <p className="metric-value">{classes.length}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Subject Catalog</p>
            <p className="metric-value">{subjects.length}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Class Assignments</p>
            <p className="metric-value">{classSubjects.length}</p>
          </article>
        </div>

        <form action={addSubjectsToClassAction} className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="field-label">Class</span>
            <select name="classId" className="select" required>
              <option value="">Select class</option>
              {classes.map((klass) => (
                <option key={klass.id} value={klass.id}>
                  {klass.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="field-label">Subjects</span>
            <textarea
              name="subjectList"
              className="input"
              rows={4}
              placeholder={"Mathematics\nEnglish\nBasic Science"}
              required
            />
          </label>

          <div>
            <button className="btn btn-primary" type="submit">
              Add Subjects To Class
            </button>
          </div>
        </form>
      </section>

      <section className="section-panel table-wrap">
        <h2 className="section-heading">Class Subject Assignments</h2>
        <table className="mt-2">
          <thead>
            <tr>
              <th>Class</th>
              <th>Subject</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {classSubjects.map((row) => (
              <tr key={row.id}>
                <td>{row.class.name}</td>
                <td>{row.subject.name}</td>
                <td>
                  <form action={removeClassSubjectAction}>
                    <input type="hidden" name="classSubjectId" value={row.id} />
                    <button className="btn btn-danger" type="submit">
                      Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {classSubjects.length === 0 && (
              <tr>
                <td colSpan={3}>No class-subject assignments yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="section-panel table-wrap">
        <h2 className="section-heading">Subject Catalog</h2>
        <table className="mt-2">
          <thead>
            <tr>
              <th>Subject</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject) => (
              <tr key={subject.id}>
                <td>{subject.name}</td>
                <td>
                  <form action={deleteSubjectAction}>
                    <input type="hidden" name="subjectId" value={subject.id} />
                    <button className="btn btn-danger" type="submit">
                      Delete Subject
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {subjects.length === 0 && (
              <tr>
                <td colSpan={2}>No subjects yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
