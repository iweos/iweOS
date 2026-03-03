"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

type NavLink = {
  label: string;
  href: string;
};

type NavGroup = {
  label: string;
  items: NavLink[];
};

const primaryLinks: NavLink[] = [
  { label: "Dashboard", href: "/app/admin/dashboard" },
  { label: "Teachers", href: "/app/admin/teachers" },
  { label: "Settings", href: "/app/admin/settings" },
];

const groupedLinks: NavGroup[] = [
  {
    label: "Students",
    items: [
      { label: "Add Student", href: "/app/admin/students/add" },
      { label: "Manage Students", href: "/app/admin/students/manage" },
    ],
  },
  {
    label: "Grading",
    items: [
      { label: "Assessment Types", href: "/app/admin/grading/assessment-types" },
      { label: "Grade Scale", href: "/app/admin/grading/grades" },
    ],
  },
  {
    label: "Payments",
    items: [
      { label: "Overview", href: "/app/admin/payments" },
      { label: "Invoices", href: "/app/admin/payments/invoices" },
      { label: "Transactions", href: "/app/admin/payments/transactions" },
      { label: "Reconciliation", href: "/app/admin/payments/reconciliation" },
      { label: "Imports", href: "/app/admin/payments/imports" },
      { label: "Reports", href: "/app/admin/payments/reports" },
      { label: "Settings", href: "/app/admin/payments/settings" },
    ],
  },
  {
    label: "Academic Setup",
    items: [
      { label: "Classes", href: "/app/admin/classes" },
      { label: "Subjects", href: "/app/admin/subjects" },
      { label: "Terms", href: "/app/admin/terms" },
      { label: "Teacher-Class", href: "/app/admin/assignments/teacher-classes" },
      { label: "Class-Subject", href: "/app/admin/assignments/class-subjects" },
      { label: "Enrollments", href: "/app/admin/assignments/enrollments" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/app/admin/payments") {
    return pathname.startsWith("/app/admin/payments/");
  }
  return pathname.startsWith(`${href}/`);
}

function isGroupActive(pathname: string, group: NavGroup) {
  return group.items.some((item) => isActive(pathname, item.href));
}

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-[var(--line)] px-5">
        <p className="text-lg font-semibold tracking-tight text-[var(--fg)]">iweOS Admin</p>
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto p-4">
        <div className="space-y-1">
          {primaryLinks.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--fg)]"
                }`}
              >
                <span className={`mr-3 h-2 w-2 rounded-full ${active ? "bg-[var(--primary)]" : "bg-[var(--line-strong)]"}`} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="space-y-2 border-t border-[var(--line)] pt-3">
          {groupedLinks.map((group) => {
            const groupActive = isGroupActive(pathname, group);
            return (
              <details key={group.label} className="group rounded-lg" open={groupActive}>
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-3 py-2 text-sm font-semibold text-[var(--fg)] hover:bg-[var(--surface-soft)]">
                  <span>{group.label}</span>
                  <span className="text-xs text-[var(--muted)] transition group-open:rotate-90">›</span>
                </summary>
                <div className="mt-1 space-y-1 pl-2">
                  {group.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        className={`block rounded-md px-3 py-1.5 text-sm transition ${
                          active
                            ? "bg-[var(--primary-soft)] font-medium text-[var(--primary)]"
                            : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--fg)]"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-[var(--line)] p-4 text-xs text-[var(--accent)]">iWeOS v1.0 Analytics Suite</div>
    </div>
  );
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-[var(--line)] bg-[var(--surface)] lg:block">
        <SidebarContent pathname={pathname} onNavigate={() => undefined} />
      </aside>

      <div className={`fixed inset-0 z-40 lg:hidden ${mobileOpen ? "" : "pointer-events-none"}`}>
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className={`absolute inset-0 bg-black/35 transition ${mobileOpen ? "opacity-100" : "opacity-0"}`}
        />

        <aside
          className={`absolute inset-y-0 left-0 w-64 border-r border-[var(--line)] bg-[var(--surface)] transition-transform duration-200 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent pathname={pathname} onNavigate={onClose} />
        </aside>
      </div>
    </>
  );
}
