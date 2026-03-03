import { ProfileRole } from "@prisma/client";
import AppSidebar from "@/components/AppSidebar";
import { requireProfile } from "@/lib/server/auth";

const adminNav = [
  ["Dashboard", "/app/admin/dashboard"],
  ["Teachers", "/app/admin/teachers"],
  ["Classes", "/app/admin/classes"],
  ["Students Add", "/app/admin/students/add"],
  ["Students Manage", "/app/admin/students/manage"],
  ["Subjects", "/app/admin/subjects"],
  ["Terms", "/app/admin/terms"],
  ["Settings", "/app/admin/settings"],
  ["Assignment Teacher-Class", "/app/admin/assignments/teacher-classes"],
  ["Assignment Class-Subject", "/app/admin/assignments/class-subjects"],
  ["Assignment Enrollments", "/app/admin/assignments/enrollments"],
  ["Grading Assessment Types", "/app/admin/grading/assessment-types"],
  ["Grading Grades", "/app/admin/grading/grades"],
  ["Payments Overview", "/app/admin/payments"],
  ["Payments Invoices", "/app/admin/payments/invoices"],
  ["Payments Transactions", "/app/admin/payments/transactions"],
  ["Payments Reconciliation", "/app/admin/payments/reconciliation"],
  ["Payments Imports", "/app/admin/payments/imports"],
  ["Payments Reports", "/app/admin/payments/reports"],
  ["Payments Settings", "/app/admin/payments/settings"],
  ["Teacher Portal", "/app/teacher/dashboard"],
] as const;

const teacherNav = [
  ["Dashboard", "/app/teacher/dashboard"],
  ["Grade Entry", "/app/teacher/grade-entry"],
  ["Results", "/app/teacher/results"],
] as const;

export default async function TeacherAreaLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const isAdmin = profile.role === ProfileRole.ADMIN;
  const nav = isAdmin ? adminNav : teacherNav;

  return (
    <div className="container grid gap-4 py-5 md:grid-cols-[270px_1fr]">
      <AppSidebar
        profileName={profile.fullName}
        profileEmail={profile.email}
        roleLabel={isAdmin ? "Admin" : "Teacher"}
        nav={nav}
      />
      <main className="space-y-4">{children}</main>
    </div>
  );
}
