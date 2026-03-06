import { addSubjectsToClassAction, deleteSubjectAction, removeClassSubjectAction } from "@/lib/server/admin-actions";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import Link from "next/link";
import StatCard from "@/components/admin/ui/StatCard";

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
      <section className="card card-body d-grid gap-3">
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
          <div>
            <p className="section-kicker">Academic Setup</p>
            <h1 className="section-title">Subjects by Class</h1>
            <p className="section-subtle">Select a class and add one or many subjects (comma or new-line separated).</p>
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <Link className="btn btn-secondary" href="/app/admin/classes">
              Classes
            </Link>
            <Link className="btn btn-secondary" href="/app/admin/assignments/class-subjects">
              Assignments
            </Link>
          </div>
        </div>
        <div className="row g-3">
          <div className="col-12 col-sm-6 col-lg-4">
            <StatCard label="Classes" value={classes.length} icon="fas fa-th-large" cardVariant="secondary" />
          </div>
          <div className="col-12 col-sm-6 col-lg-4">
            <StatCard label="Subject Catalog" value={subjects.length} icon="fas fa-book-open" cardVariant="info" />
          </div>
          <div className="col-12 col-sm-6 col-lg-4">
            <StatCard label="Class Assignments" value={classSubjects.length} icon="fas fa-link" cardVariant="success" />
          </div>
        </div>

        <form action={addSubjectsToClassAction} className="grid gap-3 md:grid-cols-2">
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

          <label className="d-grid gap-1 md:col-span-2">
            <span className="field-label">Subjects</span>
            <textarea
              name="subjectList"
              className="form-control"
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

      <section className="card card-body table-responsive">
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

      <section className="card card-body table-responsive">
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
