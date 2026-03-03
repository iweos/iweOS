"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = readonly [string, string];

type AppSidebarProps = {
  profileName: string;
  profileEmail: string;
  roleLabel: "Admin" | "Teacher";
  nav: readonly NavItem[];
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppSidebar({ profileName, profileEmail, roleLabel, nav }: AppSidebarProps) {
  const pathname = usePathname();
  const navMap = new Map(nav.map((item) => [item[0], item[1]]));

  const adminPrimary = [
    ["Teachers", navMap.get("Teachers") ?? "/app/admin/teachers"],
    ["Classes", navMap.get("Classes") ?? "/app/admin/classes"],
    ["Subjects", navMap.get("Subjects") ?? "/app/admin/subjects"],
    ["Terms", navMap.get("Terms") ?? "/app/admin/terms"],
    ["Settings", navMap.get("Settings") ?? "/app/admin/settings"],
  ] as const;

  const adminStudents = [
    ["Add Student", navMap.get("Students Add") ?? "/app/admin/students/add"],
    ["Manage Students", navMap.get("Students Manage") ?? "/app/admin/students/manage"],
  ] as const;

  const adminAssignments = [
    ["Teacher-Class", navMap.get("Assignment Teacher-Class") ?? "/app/admin/assignments/teacher-classes"],
    ["Class-Subject", navMap.get("Assignment Class-Subject") ?? "/app/admin/assignments/class-subjects"],
    ["Enrollments", navMap.get("Assignment Enrollments") ?? "/app/admin/assignments/enrollments"],
  ] as const;

  const adminGrading = [
    ["Assessment Types", navMap.get("Grading Assessment Types") ?? "/app/admin/grading/assessment-types"],
    ["Grades", navMap.get("Grading Grades") ?? "/app/admin/grading/grades"],
  ] as const;

  const adminPayments = [
    ["Overview", navMap.get("Payments Overview") ?? "/app/admin/payments"],
    ["Invoices", navMap.get("Payments Invoices") ?? "/app/admin/payments/invoices"],
    ["Transactions", navMap.get("Payments Transactions") ?? "/app/admin/payments/transactions"],
    ["Reconciliation", navMap.get("Payments Reconciliation") ?? "/app/admin/payments/reconciliation"],
    ["Imports", navMap.get("Payments Imports") ?? "/app/admin/payments/imports"],
    ["Reports", navMap.get("Payments Reports") ?? "/app/admin/payments/reports"],
    ["Settings", navMap.get("Payments Settings") ?? "/app/admin/payments/settings"],
  ] as const;

  const teacherPrimary = [
    ["Dashboard", navMap.get("Dashboard") ?? "/app/teacher/dashboard"],
    ["Grade Entry", navMap.get("Grade Entry") ?? "/app/teacher/grade-entry"],
    ["Results", navMap.get("Results") ?? "/app/teacher/results"],
  ] as const;

  const adminTools = [["Teacher Portal", navMap.get("Teacher Portal") ?? "/app/teacher/dashboard"]] as const;

  const isAdmin = roleLabel === "Admin";
  const adminDashboardHref = navMap.get("Dashboard") ?? "/app/admin/dashboard";
  const primaryMenu = isAdmin ? adminPrimary : teacherPrimary;
  const secondaryMenu = isAdmin ? adminTools : [];

  const sectionIsActive = (items: readonly (readonly [string, string])[]) =>
    items.some(([, href]) => isActivePath(pathname, href));

  const renderDropdownSection = (title: string, items: readonly (readonly [string, string])[]) => (
    <div className="sidebar-block">
      <details className="sidebar-dropdown" open={sectionIsActive(items)}>
        <summary className="sidebar-summary">
          <span>{title}</span>
          <span className="sidebar-summary-icon">›</span>
        </summary>
        <nav className="sidebar-subnav">
          {items.map(([label, href]) => {
            const active = isActivePath(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`sidebar-subitem ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </details>
    </div>
  );

  return (
    <aside className="sidebar-shell">
      <div className="sidebar-account sidebar-account-top">
        <p className="sidebar-caption">Account</p>
        <p className="sidebar-name">{profileName}</p>
        <p className="sidebar-email">{profileEmail}</p>
        <p className="sidebar-role">{roleLabel}</p>
      </div>

      {isAdmin && (
        <div className="sidebar-block">
          <nav className="sidebar-subnav">
            <Link
              href={adminDashboardHref}
              className={`sidebar-subitem font-semibold ${isActivePath(pathname, adminDashboardHref) ? "active" : ""}`}
              aria-current={isActivePath(pathname, adminDashboardHref) ? "page" : undefined}
            >
              Dashboard
            </Link>
          </nav>
        </div>
      )}

      {renderDropdownSection(isAdmin ? "School Administration" : "Teacher Portal", primaryMenu)}

      {isAdmin && (
        renderDropdownSection("Students", adminStudents)
      )}

      {isAdmin && (
        renderDropdownSection("Assignments", adminAssignments)
      )}

      {isAdmin && (
        renderDropdownSection("Grading", adminGrading)
      )}

      {isAdmin && (
        renderDropdownSection("Payments", adminPayments)
      )}

      {secondaryMenu.length > 0 && (
        renderDropdownSection("Tools", secondaryMenu)
      )}
    </aside>
  );
}
