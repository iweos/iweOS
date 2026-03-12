"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import BrandLogo from "@/components/BrandLogo";

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
  onMenuToggle: () => void;
  onSidebarToggle: () => void;
  sidebarMinimized: boolean;
  mode: "admin" | "teacher";
  homeHref: string;
  settingsHref?: string;
  profileName?: string;
  profileEmail?: string;
};

type NavLink = {
  label: string;
  href: string;
  icon: string;
};

type NavGroup = {
  id: string;
  label: string;
  icon: string;
  items: NavLink[];
};

const primaryLinks: NavLink[] = [
  { label: "Dashboard", href: "/app/admin/dashboard", icon: "fas fa-home" },
  { label: "Grading", href: "/app/admin/grading/assessment-types", icon: "fas fa-clipboard-check" },
  { label: "Payment", href: "/app/admin/payments", icon: "fas fa-money-check-alt" },
  { label: "Teachers", href: "/app/admin/teachers", icon: "fas fa-chalkboard-teacher" },
  { label: "Students", href: "/app/admin/students/manage", icon: "fas fa-user-graduate" },
];

const groupedLinks: NavGroup[] = [
  {
    id: "academic-setup",
    label: "Academic Setup",
    icon: "fas fa-school",
    items: [
      { label: "Classes", href: "/app/admin/classes", icon: "fas fa-th-large" },
      { label: "Subjects", href: "/app/admin/subjects", icon: "fas fa-book-open" },
      { label: "Terms", href: "/app/admin/terms", icon: "fas fa-calendar-alt" },
    ],
  },
  {
    id: "assignments",
    label: "Assignments",
    icon: "fas fa-random",
    items: [
      { label: "Teacher-Class", href: "/app/admin/assignments/teacher-classes", icon: "fas fa-user-check" },
      { label: "Class-Subject", href: "/app/admin/assignments/class-subjects", icon: "fas fa-link" },
      { label: "Enrollments", href: "/app/admin/assignments/enrollments", icon: "fas fa-id-card" },
    ],
  },
];

const trailingLinks: NavLink[] = [{ label: "Settings", href: "/app/admin/settings", icon: "fas fa-cog" }];

const teacherLinks: NavLink[] = [
  { label: "Dashboard", href: "/app/teacher/dashboard", icon: "fas fa-home" },
  { label: "Grade Entry", href: "/app/teacher/grade-entry", icon: "fas fa-clipboard-check" },
  { label: "Results", href: "/app/teacher/results", icon: "fas fa-book-reader" },
];

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/app/admin/payments") return pathname.startsWith("/app/admin/payments/");
  return pathname.startsWith(`${href}/`);
}

function isGroupActive(pathname: string, group: NavGroup) {
  return group.items.some((item) => isActive(pathname, item.href));
}

export default function Sidebar({
  mobileOpen,
  onClose,
  onMenuToggle,
  onSidebarToggle,
  sidebarMinimized,
  mode,
  homeHref,
  settingsHref,
  profileName,
  profileEmail,
}: SidebarProps) {
  const pathname = usePathname();
  const [groupOpenMap, setGroupOpenMap] = useState<Record<string, boolean>>({});
  const isTeacherMode = mode === "teacher";

  const mainLinks = isTeacherMode ? teacherLinks : primaryLinks;
  const menuGroups = isTeacherMode ? [] : groupedLinks;
  const footerLinks = isTeacherMode ? (settingsHref ? [{ label: "Settings", href: settingsHref, icon: "fas fa-cog" }] : []) : trailingLinks;

  function isGroupOpen(group: NavGroup) {
    return groupOpenMap[group.id] ?? isGroupActive(pathname, group);
  }

  function toggleGroup(group: NavGroup) {
    setGroupOpenMap((current) => ({
      ...current,
      [group.id]: !(current[group.id] ?? isGroupActive(pathname, group)),
    }));
  }

  return (
    <div className="sidebar" data-background-color="dark">
      <div className="sidebar-logo">
        <div className="logo-header" data-background-color="dark">
          <BrandLogo
            href={homeHref}
            variant="light"
            className="logo"
            iconClassName="navbar-brand logo-icon"
            textClassName="logo-title"
          />
          <div className="nav-toggle">
            <button type="button" className="btn btn-toggle toggle-sidebar" onClick={onSidebarToggle} aria-label="Toggle sidebar">
              <i className={sidebarMinimized ? "gg-more-vertical-alt" : "gg-menu-right"} />
            </button>
            <button
              type="button"
              className={`btn btn-toggle sidenav-toggler ${mobileOpen ? "toggled" : ""}`}
              onClick={onMenuToggle}
              aria-label="Open menu"
            >
              <i className="gg-menu-left" />
            </button>
          </div>
          <button type="button" className="topbar-toggler more" onClick={onMenuToggle} aria-label="Open menu">
            <i className="gg-more-vertical-alt" />
          </button>
        </div>
      </div>

      <div className="sidebar-wrapper scrollbar scrollbar-inner">
        <div className="sidebar-content">
          <div className="user">
            <div className="info">
              <a href="#account">
                <span>
                  {profileName ?? (isTeacherMode ? "Teacher User" : "Admin User")}
                  <span className="user-level">{profileEmail ?? (isTeacherMode ? "teacher@iweos.app" : "admin@iweos.app")}</span>
                </span>
              </a>
            </div>
          </div>

          <ul className="nav nav-secondary">
            {mainLinks.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href} className={`nav-item ${active ? "active" : ""}`}>
                  <Link href={item.href} onClick={onClose}>
                    <i className={item.icon} />
                    <p>{item.label}</p>
                  </Link>
                </li>
              );
            })}

            {menuGroups.length > 0 ? (
              <li className="nav-section">
                <span className="sidebar-mini-icon">
                  <i className="fa fa-ellipsis-h" />
                </span>
                <h4 className="text-section">{isTeacherMode ? "Teacher Portal" : "Management"}</h4>
              </li>
            ) : null}

            {menuGroups.map((group) => {
              const active = isGroupActive(pathname, group);
              const open = isGroupOpen(group);

              return (
                <li key={group.id} className={`nav-item ${active ? "active " : ""}${open ? "submenu" : ""}`.trim()}>
                  <a
                    href={`#${group.id}`}
                    data-bs-toggle="collapse"
                    data-toggle="collapse"
                    aria-expanded={open}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      toggleGroup(group);
                    }}
                  >
                    <i className={group.icon} />
                    <p>{group.label}</p>
                    <span className="caret" />
                  </a>
                  <ul
                    className="nav nav-collapse"
                    id={group.id}
                    style={{ display: open ? "block" : "none" }}
                    aria-hidden={!open}
                  >
                    {group.items.map((item) => {
                      const itemActive = isActive(pathname, item.href);
                      return (
                        <li key={item.href} className={itemActive ? "active" : ""}>
                          <Link href={item.href} onClick={onClose}>
                            <span className="sub-item">{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}

            {footerLinks.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href} className={`nav-item ${active ? "active" : ""}`}>
                  <Link href={item.href} onClick={onClose}>
                    <i className={item.icon} />
                    <p>{item.label}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
