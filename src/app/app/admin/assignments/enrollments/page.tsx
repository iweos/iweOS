import { bulkEnrollStudentsByClassAction, enrollStudentAction, removeEnrollmentAction } from "@/lib/server/admin-actions";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { isPrismaSchemaMismatchError, schemaSyncMessage } from "@/lib/server/prisma-errors";

export default async function AssignmentEnrollmentsPage() {
  const profile = await requireRole("admin");

  let students: Array<{ id: string; studentCode: string; fullName: string; className: string | null; status: string }> = [];
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
        select: { id: true, studentCode: true, fullName: true, className: true, status: true },
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

  const activeRegisteredCountByClass = new Map(
    classes.map((klass) => [
      klass.id,
      students.filter(
        (student) => student.status === "active" && student.className?.trim().toLowerCase() === klass.name.trim().toLowerCase(),
      ).length,
    ]),
  );
  const activeTerm = terms.find((term) => term.isActive) ?? null;

  return (
    <>
      <section className="card card-body d-grid gap-3">
        <h1 className="section-title">Assignments / Enrollments</h1>
        <p className="section-subtle">Enroll one student manually, or bulk-enroll all active students already registered under a class.</p>
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

        <div className="border-top pt-3">
          <h2 className="section-heading mb-2">Bulk Enroll Active Students By Registered Class</h2>
          <p className="section-subtle mb-3">
            This uses each student's saved class registration and only includes students with `active` status.
          </p>
          <form action={bulkEnrollStudentsByClassAction} className="grid gap-2 md:grid-cols-4">
            <label className="d-grid gap-1">
              <span className="field-label">Class</span>
              <select name="classId" className="form-select" required defaultValue="">
                <option value="" disabled>
                  Select class
                </option>
                {classes.map((klass) => (
                  <option key={klass.id} value={klass.id}>
                    {klass.name} ({activeRegisteredCountByClass.get(klass.id) ?? 0} active registered)
                  </option>
                ))}
              </select>
            </label>

            <label className="d-grid gap-1">
              <span className="field-label">Term</span>
              <select name="termId" className="form-select" required defaultValue={activeTerm?.id ?? ""}>
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
                Bulk Enroll Class
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="card card-body">
        <h2 className="section-heading">Eligible Active Students By Class</h2>
        <TableWrap className="mt-2">
          <Table>
            <thead>
              <tr>
                <Th>Class</Th>
                <Th>Eligible Active Students</Th>
              </tr>
            </thead>
            <tbody>
              {classes.map((klass) => (
                <tr key={klass.id}>
                  <Td>{klass.name}</Td>
                  <Td>{activeRegisteredCountByClass.get(klass.id) ?? 0}</Td>
                </tr>
              ))}
              {classes.length === 0 && (
                <tr>
                  <Td colSpan={2}>No classes yet.</Td>
                </tr>
              )}
            </tbody>
          </Table>
        </TableWrap>
      </section>

      <section className="card card-body">
        <TableWrap>
          <Table>
          <thead>
            <tr>
              <Th>Student</Th>
              <Th>Class</Th>
              <Th>Term</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {enrollments.map((row) => (
              <tr key={row.id}>
                <Td>{row.student.fullName}</Td>
                <Td>{row.class.name}</Td>
                <Td>
                  {row.term.sessionLabel} {row.term.termLabel}
                </Td>
                <Td>
                  <form action={removeEnrollmentAction}>
                    <input type="hidden" name="enrollmentId" value={row.id} />
                    <button className="btn btn-danger" type="submit">
                      Remove
                    </button>
                  </form>
                </Td>
              </tr>
            ))}
            {enrollments.length === 0 && (
              <tr>
                <Td colSpan={4}>No enrollments yet.</Td>
              </tr>
            )}
          </tbody>
          </Table>
        </TableWrap>
      </section>
    </>
  );
}
