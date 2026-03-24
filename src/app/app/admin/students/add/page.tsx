import Link from "next/link";
import Card from "@/components/admin/Card";
import Input from "@/components/admin/ui/Input";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";
import Select from "@/components/admin/ui/Select";
import StatCard from "@/components/admin/ui/StatCard";
import { requireRole } from "@/lib/server/auth";
import { createStudentsBulkAction } from "@/lib/server/admin-actions";
import { prisma } from "@/lib/server/prisma";
import { isPrismaSchemaMismatchError, schemaSyncMessage } from "@/lib/server/prisma-errors";

export default async function AdminStudentsAddPage() {
  const profile = await requireRole("admin");

  let studentCount = 0;
  let classes: Array<{ id: string; name: string }> = [];

  try {
    [studentCount, classes] = await Promise.all([
      prisma.student.count({ where: { schoolId: profile.schoolId } }),
      prisma.class.findMany({
        where: { schoolId: profile.schoolId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return (
        <Section>
          <PageHeader title="Students Setup Required" subtitle="Student schema is out of sync for this environment." />
          <Card>
            <p className="small text-muted">{schemaSyncMessage("Student")}</p>
          </Card>
        </Section>
      );
    }
    throw error;
  }

  return (
    <Section>
      <PageHeader
        title="Add Students"
        subtitle="Bulk import students with CSV or paste rows directly."
        rightActions={
          <>
            <Link href="/app/admin/students/manage" className="btn btn-secondary">
              Manage Students
            </Link>
            <Link href="/app/admin/classes" className="btn btn-outline-secondary">
              Classes
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="Total Students" value={studentCount} icon="fas fa-user-graduate" cardVariant="success" />
        <StatCard label="Classes Available" value={classes.length} icon="fas fa-th-large" cardVariant="secondary" />
      </div>

      <Card title="Bulk Import">
        <form action={createStudentsBulkAction} className="grid gap-3 md:grid-cols-3">
          <label className="d-grid gap-1">
            <span className="field-label">Enrollment Year</span>
            <Input name="enrollmentYear" type="number" defaultValue={new Date().getFullYear()} required />
          </label>

          <label className="d-grid gap-1">
            <span className="field-label">Class</span>
            <Select name="className" defaultValue="">
              <option value="">Select class (optional)</option>
              {classes.map((klass) => (
                <option key={klass.id} value={klass.name}>
                  {klass.name}
                </option>
              ))}
            </Select>
          </label>

          <label className="d-grid gap-1">
            <span className="field-label">Status</span>
            <Select name="status" defaultValue="active">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
              <option value="suspended">Suspended</option>
              <option value="withdrawn">Withdrawn</option>
            </Select>
          </label>

          <label className="d-grid gap-1">
            <span className="field-label">Default Gender</span>
            <Select name="gender" defaultValue="">
              <option value="">Gender (optional)</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </Select>
          </label>

          <label className="d-grid gap-1 md:col-span-3">
            <span className="field-label">CSV File</span>
            <Input name="studentCsv" type="file" accept=".csv,text/csv" />
          </label>

          <label className="d-grid gap-1 md:col-span-3">
            <span className="field-label">Rows Fallback (Optional)</span>
            <textarea
              name="studentRows"
              className="form-control student-rows-input"
              placeholder={
                "First Name, Last Name, Address, Guardian Name, Guardian Phone, Guardian Email, Gender\nJohn, Doe, 12 Main St, Mary Doe, 08012345678, mary@example.com, Male"
              }
            />
          </label>

          <div className="md:col-span-3">
            <button className="btn btn-primary" type="submit">
              Import Students
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <p className="small text-muted">
          CSV columns: First Name, Last Name, Address, Parent/Guardian Name, Phone, Email, Gender. Header row is
          optional. Student ID is generated as <code>SchoolToken-Year-Serial</code> (for example, <code>FGS-2026-0001</code>).
        </p>
      </Card>
    </Section>
  );
}
