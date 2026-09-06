"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpenCheck,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  UserRoundCog,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppCommandPalette from "@/components/admin/AppCommandPalette";
import PortalSwitcher from "@/components/admin/PortalSwitcher";
import BrandLogo from "@/components/BrandLogo";
import GuideFooterBar from "@/components/guide/GuideFooterBar";
import ShellTour from "@/components/guide/ShellTour";
import ThemeToggle from "@/components/ThemeToggle";
import type { SchoolAccessOption } from "@/types";

type ShellProps = {
  children: React.ReactNode;
  mode?: "admin" | "teacher";
  homeHref?: string;
  settingsHref?: string;
  profileName?: string;
  profileEmail?: string;
  currentSchoolName?: string;
  currentProfileId?: string;
  schoolOptions?: SchoolAccessOption[];
  platformAdmin?: boolean;
  teacherPortalAdmin?: boolean;
};

type NavLink = { label: string; href: string; icon: LucideIcon; tour?: string };
type NavGroup = { id: string; label: string; icon: LucideIcon; items: NavLink[] };
type Notification = { id: string; title: string; message: string; href?: string | null; isRead: boolean; createdAt: string };

const adminPrimary: NavLink[] = [
  { label: "Dashboard", href: "/app/admin/dashboard", icon: LayoutDashboard },
  { label: "Teachers", href: "/app/admin/teachers", icon: UsersRound, tour: "admin-teachers-link" },
  { label: "Students", href: "/app/admin/students/manage", icon: GraduationCap },
  { label: "Teacher portal", href: "/app/teacher/dashboard", icon: ShieldCheck },
];

const adminGroups: NavGroup[] = [
  {
    id: "academic-setup",
    label: "Academic setup",
    icon: Building2,
    items: [
      { label: "Classes", href: "/app/admin/classes", icon: Building2 },
      { label: "Subjects", href: "/app/admin/subjects", icon: LibraryBig },
      { label: "Sessions", href: "/app/admin/terms", icon: CalendarDays },
    ],
  },
  {
    id: "assignments",
    label: "Assignments",
    icon: UserRoundCog,
    items: [
      { label: "Teacher–Class", href: "/app/admin/assignments/teacher-classes", icon: UsersRound },
      { label: "Class–Subject", href: "/app/admin/assignments/class-subjects", icon: LibraryBig },
      { label: "Enrollments", href: "/app/admin/assignments/enrollments", icon: GraduationCap },
    ],
  },
  {
    id: "grading",
    label: "Grading",
    icon: ClipboardCheck,
    items: [
      { label: "Grades", href: "/app/admin/grading/grades", icon: ClipboardCheck },
      { label: "Assessment types", href: "/app/admin/grading/assessment-types", icon: LibraryBig },
      { label: "Conduct", href: "/app/admin/grading/conduct", icon: ShieldCheck },
      { label: "Results", href: "/app/admin/grading/results", icon: BookOpenCheck },
      { label: "Promotions", href: "/app/admin/grading/promotion", icon: GraduationCap },
    ],
  },
  {
    id: "payment",
    label: "Payment",
    icon: WalletCards,
    items: [
      { label: "Overview", href: "/app/admin/payments", icon: LayoutDashboard },
      { label: "Invoices", href: "/app/admin/payments/invoices", icon: BookOpenCheck },
      { label: "Transactions", href: "/app/admin/payments/transactions", icon: WalletCards },
      { label: "Reconciliation", href: "/app/admin/payments/reconciliation", icon: ClipboardCheck },
      { label: "Reports", href: "/app/admin/payments/reports", icon: LibraryBig },
      { label: "Settings", href: "/app/admin/payments/settings", icon: Settings },
      { label: "Imports", href: "/app/admin/payments/imports", icon: Plus },
    ],
  },
];

const teacherLinks: NavLink[] = [
  { label: "Dashboard", href: "/app/teacher/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/app/teacher/students", icon: GraduationCap, tour: "teacher-students-link" },
  { label: "Student directory", href: "/app/teacher/students/manage", icon: UsersRound },
  { label: "Attendance", href: "/app/teacher/attendance", icon: CalendarDays, tour: "teacher-attendance-link" },
  { label: "Grade entry", href: "/app/teacher/grade-entry", icon: ClipboardCheck, tour: "teacher-grade-entry-link" },
  { label: "Conduct", href: "/app/teacher/conduct", icon: ShieldCheck },
  { label: "Comment", href: "/app/teacher/comment", icon: BookOpenCheck },
  { label: "Results", href: "/app/teacher/results", icon: LibraryBig, tour: "teacher-results-link" },
];

function activePath(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/app/admin/payments") return pathname.startsWith("/app/admin/payments/");
  return pathname.startsWith(`${href}/`);
}

function formatAge(value: string) {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function SchoolWorkspaceShell({
  children,
  mode = "admin",
  homeHref,
  settingsHref,
  profileName,
  profileEmail,
  currentSchoolName,
  currentProfileId,
  schoolOptions = [],
  platformAdmin = false,
  teacherPortalAdmin = false,
}: ShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [switchingProfileId, setSwitchingProfileId] = useState<string | null>(null);
  const [addSchoolOpen, setAddSchoolOpen] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [schoolError, setSchoolError] = useState("");
  const [creatingSchool, setCreatingSchool] = useState(false);

  const isTeacher = mode === "teacher";
  const resolvedHome = homeHref ?? (isTeacher ? "/app/teacher/dashboard" : "/app/admin/dashboard");
  const resolvedSettings = settingsHref ?? (!isTeacher ? "/app/admin/settings" : undefined);
  const roleLabel = isTeacher ? "Teacher portal" : "School administration";
  const initials = (profileName || profileEmail || "I").trim().slice(0, 1).toUpperCase();

  const primaryLinks = useMemo(() => {
    if (!isTeacher) return adminPrimary;
    return teacherPortalAdmin
      ? [{ label: "Back to administration", href: "/app/admin/dashboard", icon: ChevronRight }, ...teacherLinks]
      : teacherLinks;
  }, [isTeacher, teacherPortalAdmin]);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem("iweos:school-sidebar") === "collapsed");
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setNotificationsOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.classList.add("kai-admin", "school-workspace-active");
    document.body.classList.add("kai-admin");
    return () => {
      document.documentElement.classList.remove("kai-admin", "school-workspace-active");
      document.body.classList.remove("kai-admin");
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { items: Notification[]; unreadCount: number };
        if (!cancelled) {
          setNotifications(payload.items);
          setUnreadCount(payload.unreadCount);
        }
      } catch {}
    }
    void load();
    const id = window.setInterval(() => void load(), 60000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem("iweos:school-sidebar", next ? "collapsed" : "expanded");
      return next;
    });
  }

  function groupIsOpen(group: NavGroup) {
    return openGroups[group.id] ?? group.items.some((item) => activePath(pathname, item.href));
  }

  async function markRead() {
    setNotificationsOpen((value) => !value);
    setAccountOpen(false);
    if (unreadCount) {
      setUnreadCount(0);
      setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
      await fetch("/api/notifications", { method: "POST" }).catch(() => undefined);
    }
  }

  async function switchSchool(profileId: string) {
    if (!profileId || switchingProfileId) return;
    setSwitchingProfileId(profileId);
    window.dispatchEvent(new CustomEvent("iweos:pending-indicator", { detail: { durationMs: 10000 } }));
    try {
      const response = await fetch("/api/auth/switch-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });
      const payload = (await response.json()) as { destination?: string; error?: string };
      if (!response.ok || !payload.destination) throw new Error(payload.error || "Unable to switch school.");
      window.location.assign(payload.destination);
    } catch (error) {
      setSwitchingProfileId(null);
      window.alert(error instanceof Error ? error.message : "Unable to switch school.");
    }
  }

  async function createSchool(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creatingSchool || schoolName.trim().length < 2) return;
    setCreatingSchool(true);
    setSchoolError("");
    try {
      const response = await fetch("/api/auth/create-school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolName }),
      });
      const payload = (await response.json()) as { destination?: string; error?: string };
      if (!response.ok || !payload.destination) throw new Error(payload.error || "Unable to create school.");
      window.location.assign(payload.destination);
    } catch (error) {
      setSchoolError(error instanceof Error ? error.message : "Unable to create school.");
      setCreatingSchool(false);
    }
  }

  function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    void fetch("/api/auth/sign-out", { method: "POST" })
      .then(() => window.location.assign("/sign-in"))
      .catch(() => setSigningOut(false));
  }

  return (
    <div className={`school-shell ${collapsed ? "is-collapsed" : ""}`}>
      <ShellTour mode={mode} teacherPortalAdmin={teacherPortalAdmin} />

      <header className="school-shell-header">
        <div className="school-shell-brand">
          <button type="button" className="school-mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu /></button>
          <BrandLogo href={resolvedHome} variant="light" className="school-brand-logo" textClassName="school-brand-name" />
        </div>
        <div className="school-header-context">
          <span>{currentSchoolName || "iweOS school"}</span>
          <strong>{roleLabel}</strong>
        </div>
        <div className="school-header-actions">
          <button type="button" className="school-search-trigger" onClick={() => setCommandOpen(true)}><Search /><span>Search</span><kbd>⌘K</kbd></button>
          <div className="school-portal-switch"><PortalSwitcher mode={mode} currentSchoolName={currentSchoolName} platformAdmin={platformAdmin} teacherPortalAdmin={teacherPortalAdmin} /></div>
          <ThemeToggle className="school-icon-button school-theme-button" />
          <div className="school-header-popover">
            <button type="button" className="school-icon-button" onClick={() => void markRead()} aria-label="Notifications"><Bell />{unreadCount ? <span>{unreadCount}</span> : null}</button>
            {notificationsOpen ? (
              <section className="school-popover school-notifications">
                <header><div><small>Updates</small><strong>Notifications</strong></div><button type="button" onClick={() => setNotificationsOpen(false)}><X /></button></header>
                <div>
                  {notifications.length ? notifications.map((item) => <Link href={item.href || "#"} key={item.id}><i className={item.isRead ? "" : "is-unread"} /><span><strong>{item.title}</strong><small>{item.message}</small><time>{formatAge(item.createdAt)}</time></span></Link>) : <p>No notifications yet.</p>}
                </div>
              </section>
            ) : null}
          </div>
          <div className="school-header-popover">
            <button type="button" className="school-account-trigger" onClick={() => { setAccountOpen((value) => !value); setNotificationsOpen(false); }} aria-label="Open account menu"><span>{initials}</span><ChevronDown /></button>
            {accountOpen ? (
              <section className="school-popover school-account-menu">
                <header><span>{initials}</span><div><strong>{profileName || roleLabel}</strong><small>{profileEmail}</small></div></header>
                {schoolOptions.length ? <label><span>School workspace</span><select value={switchingProfileId || currentProfileId || ""} onChange={(event) => void switchSchool(event.target.value)} disabled={Boolean(switchingProfileId)}>{schoolOptions.map((option) => <option value={option.profileId} key={option.profileId}>{option.schoolName} · {option.role}</option>)}</select></label> : null}
                <button type="button" onClick={() => { setAccountOpen(false); setAddSchoolOpen(true); }}><Plus /> Add another school</button>
                {platformAdmin ? <Link href="/dataroom"><ShieldCheck /> iweOS administration</Link> : null}
                {resolvedSettings ? <Link href={resolvedSettings}><Settings /> Settings</Link> : null}
                <button type="button" className="is-danger" onClick={signOut} disabled={signingOut}><LogOut /> {signingOut ? "Signing out..." : "Sign out"}</button>
              </section>
            ) : null}
          </div>
        </div>
      </header>

      <button type="button" className={`school-shell-scrim ${mobileOpen ? "is-visible" : ""}`} onClick={() => setMobileOpen(false)} aria-label="Close navigation" />
      <aside className={`school-shell-sidebar ${mobileOpen ? "is-open" : ""}`} data-tour="sidebar-main">
        <div className="school-sidebar-school">
          <span>{(currentSchoolName || "S").slice(0, 1).toUpperCase()}</span>
          <div><strong>{currentSchoolName || "School workspace"}</strong><small>{roleLabel}</small></div>
          <button type="button" className="school-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X /></button>
        </div>
        <nav className="school-navigation" aria-label={roleLabel}>
          <p>Workspace</p>
          {primaryLinks.map((item) => {
            const Icon = item.icon;
            const active = activePath(pathname, item.href);
            return <Link href={item.href} className={active ? "is-active" : ""} aria-current={active ? "page" : undefined} data-tour={item.tour} title={item.label} key={item.href}><Icon /><span>{item.label}</span></Link>;
          })}

          {!isTeacher ? <p>Management</p> : null}
          {!isTeacher ? adminGroups.map((group) => {
            const Icon = group.icon;
            const open = groupIsOpen(group);
            const active = group.items.some((item) => activePath(pathname, item.href));
            return (
              <div className={`school-nav-group ${active ? "is-active" : ""}`} key={group.id}>
                <button type="button" onClick={() => setOpenGroups((current) => ({ ...current, [group.id]: !open }))} aria-expanded={open} title={group.label}>
                  <Icon /><span>{group.label}</span><ChevronDown />
                </button>
                {open ? <div>{group.items.map((item) => {
                  const ItemIcon = item.icon;
                  const itemActive = activePath(pathname, item.href);
                  return <Link href={item.href} className={itemActive ? "is-active" : ""} aria-current={itemActive ? "page" : undefined} key={item.href}><ItemIcon /><span>{item.label}</span></Link>;
                })}</div> : null}
              </div>
            );
          }) : null}

          {!isTeacher && resolvedSettings ? <Link href={resolvedSettings} className={activePath(pathname, resolvedSettings) ? "is-active" : ""}><Settings /><span>Settings</span></Link> : null}
        </nav>
        <button type="button" className="school-sidebar-collapse" onClick={toggleCollapsed}>{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}<span>{collapsed ? "Expand" : "Collapse"}</span></button>
      </aside>

      <div className="school-shell-stage">
        <main className="school-shell-main" data-tour="main-content">{children}<div className="admin-footer-spacer" aria-hidden="true" /></main>
        <GuideFooterBar showTourButton />
      </div>

      {addSchoolOpen ? (
        <div className="school-dialog-layer">
          <button type="button" className="school-dialog-scrim" onClick={() => !creatingSchool && setAddSchoolOpen(false)} aria-label="Close add school" />
          <section className="school-dialog" role="dialog" aria-modal="true" aria-labelledby="school-dialog-title">
            <button type="button" onClick={() => setAddSchoolOpen(false)} aria-label="Close"><X /></button>
            <span><Building2 /></span><small>New workspace</small><h2 id="school-dialog-title">Add another school</h2>
            <p>Create a separate school workspace without losing access to your existing schools.</p>
            <form onSubmit={createSchool}>
              <label>School name<input value={schoolName} onChange={(event) => setSchoolName(event.target.value)} placeholder="e.g. Greenwood Academy" required autoFocus /></label>
              {schoolError ? <div role="alert">{schoolError}</div> : null}
              <footer><button type="button" onClick={() => setAddSchoolOpen(false)}>Cancel</button><button type="submit" disabled={creatingSchool || schoolName.trim().length < 2}>{creatingSchool ? "Creating..." : "Create school"}</button></footer>
            </form>
          </section>
        </div>
      ) : null}

      <AppCommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} onOpen={() => setCommandOpen(true)} mode={mode} platformAdmin={platformAdmin} teacherPortalAdmin={teacherPortalAdmin} />
    </div>
  );
}
