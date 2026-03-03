import Link from "next/link";
import { createStudentsBulkAction } from "@/lib/server/admin-actions";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

export default async function AdminStudentsAddPage() {
  const profile = await requireRole("admin");

  const [studentCount, classes] = await Promise.all([
    prisma.student.count({ where: { schoolId: profile.schoolId } }),
    prisma.class.findMany({
      where: { schoolId: profile.schoolId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <section className="section-panel space-y-4">
      <div className="management-header">
        <div>
          <p className="section-kicker">User Management</p>
          <h1 className="section-title">Add Student</h1>
          <p className="section-subtle">Bulk import new students with CSV or paste rows directly.</p>
        </div>
        <div className="management-actions">
          <Link className="btn btn-muted" href="/app/admin/students/manage">
            Manage Students
          </Link>
          <Link className="btn btn-muted" href="/app/admin/classes">
            Classes
          </Link>
        </div>
      </div>

      <div className="management-stats">
        <article className="metric-card">
          <p className="metric-label">Total Students</p>
          <p className="metric-value">{studentCount}</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Classes Available</p>
          <p className="metric-value">{classes.length}</p>
        </article>
      </div>

      <form action={createStudentsBulkAction} className="grid gap-3 md:grid-cols-3">
        <input name="enrollmentYear" type="number" className="input" defaultValue={new Date().getFullYear()} required />
        <select name="className" className="select">
          <option value="">Select class (optional)</option>
          {classes.map((klass) => (
            <option key={klass.id} value={klass.name}>
              {klass.name}
            </option>
          ))}
        </select>
        <select name="status" className="select" defaultValue="active">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="graduated">Graduated</option>
          <option value="suspended">Suspended</option>
        </select>
        <select name="gender" className="select" defaultValue="">
          <option value="">Gender (optional)</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        <input
          name="studentCsv"
          type="file"
          accept=".csv,text/csv"
          className="input md:col-span-3"
        />
        <textarea
          name="studentRows"
          className="input md:col-span-3 min-h-28"
          placeholder={
            "Optional fallback (if no CSV file):\nFirst Name, Last Name, Address, Guardian Name, Guardian Phone, Guardian Email, Gender\nJohn, Doe, 12 Main St, Mary Doe, 08012345678, mary@example.com, Male"
          }
        />
        <button className="btn btn-primary md:col-span-3 w-fit" type="submit">
          Import Students
        </button>
      </form>

      <p className="section-subtle">
        Upload CSV with columns: First Name, Last Name, Address, Parent/Guardian Name, Phone, Email, Gender.
        Header row is optional. Gender supports Male/Female (or M/F). If omitted in CSV, the gender dropdown above is used.
        Student ID is auto-generated as SchoolNameToken-Year-Serial (e.g. FGS-2026-0001).
      </p>
    </section>
  );
}
