"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import type { LucideIcon } from "lucide-react";
import { BookOpenCheck, Building2, CalendarDays, ClipboardCheck, GraduationCap, LayoutDashboard, LibraryBig, Search, Settings, ShieldCheck, UserRoundCog, UsersRound, WalletCards, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type CommandItem = {
  label: string;
  description: string;
  href: string;
  group: "Portal" | "Manage" | "Academic" | "Finance";
  icon: LucideIcon;
};

type AppCommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  mode: "admin" | "teacher";
  platformAdmin: boolean;
  teacherPortalAdmin: boolean;
};

const adminCommands: CommandItem[] = [
  { label: "Dashboard", description: "School overview and setup health", href: "/app/admin/dashboard", group: "Manage", icon: LayoutDashboard },
  { label: "Teachers", description: "Manage staff accounts and access", href: "/app/admin/teachers", group: "Manage", icon: UsersRound },
  { label: "Students", description: "Open the student directory", href: "/app/admin/students/manage", group: "Manage", icon: GraduationCap },
  { label: "Classes", description: "Configure school classes", href: "/app/admin/classes", group: "Academic", icon: Building2 },
  { label: "Subjects", description: "Manage the subject catalogue", href: "/app/admin/subjects", group: "Academic", icon: LibraryBig },
  { label: "Sessions", description: "Manage academic sessions and terms", href: "/app/admin/terms", group: "Academic", icon: CalendarDays },
  { label: "Assignments", description: "Teachers, classes, subjects, and enrollments", href: "/app/admin/assignments", group: "Academic", icon: UserRoundCog },
  { label: "Grading setup", description: "Grades, assessments, conduct, and promotion", href: "/app/admin/grading", group: "Academic", icon: ClipboardCheck },
  { label: "Results", description: "Generate, publish, export, and share results", href: "/app/admin/grading/results", group: "Academic", icon: BookOpenCheck },
  { label: "Payments", description: "Invoices, transactions, and reconciliation", href: "/app/admin/payments", group: "Finance", icon: WalletCards },
  { label: "Settings", description: "School profile, results, branding, and defaults", href: "/app/admin/settings", group: "Manage", icon: Settings },
];

const teacherCommands: CommandItem[] = [
  { label: "Dashboard", description: "Teaching overview and class activity", href: "/app/teacher/dashboard", group: "Manage", icon: LayoutDashboard },
  { label: "Students", description: "Student performance summaries", href: "/app/teacher/students", group: "Manage", icon: GraduationCap },
  { label: "Student directory", description: "View and update student records", href: "/app/teacher/students/manage", group: "Manage", icon: UsersRound },
  { label: "Attendance", description: "Record class attendance", href: "/app/teacher/attendance", group: "Academic", icon: CalendarDays },
  { label: "Grade entry", description: "Enter and autosave assessments", href: "/app/teacher/grade-entry", group: "Academic", icon: ClipboardCheck },
  { label: "Conduct", description: "Record affective and psychomotor ratings", href: "/app/teacher/conduct", group: "Academic", icon: ShieldCheck },
  { label: "Comments", description: "Write class-teacher comments", href: "/app/teacher/comment", group: "Academic", icon: BookOpenCheck },
  { label: "Results", description: "Review student result sheets", href: "/app/teacher/results", group: "Academic", icon: LibraryBig },
];

export default function AppCommandPalette({ open, onClose, onOpen, mode, platformAdmin, teacherPortalAdmin }: AppCommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const commands = useMemo(() => {
    const portalCommands: CommandItem[] = [];
    if (mode === "admin") {
      portalCommands.push({ label: "Teacher portal", description: "Enter teaching workflows with admin override", href: "/app/teacher/dashboard", group: "Portal", icon: UsersRound });
    }
    if (mode === "teacher" && teacherPortalAdmin) {
      portalCommands.push({ label: "School administration", description: "Return to the school admin workspace", href: "/app/admin/dashboard", group: "Portal", icon: Building2 });
    }
    if (platformAdmin) {
      portalCommands.push({ label: "iweOS Dataroom", description: "Open platform-wide administration", href: "/dataroom", group: "Portal", icon: ShieldCheck });
    }
    return [...portalCommands, ...(mode === "admin" ? adminCommands : teacherCommands)];
  }, [mode, platformAdmin, teacherPortalAdmin]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return commands;
    return commands.filter((item) => `${item.label} ${item.description} ${item.group}`.toLowerCase().includes(term));
  }, [commands, query]);

  useEffect(() => {
    function onShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) onClose();
        else onOpen();
      }
    }
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [onClose, onOpen, open]);

  function close() {
    setQuery("");
    setActiveIndex(0);
    onClose();
  }

  function navigate(item: CommandItem) {
    close();
    router.push(item.href);
  }

  function handleKeys(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!filtered.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && filtered[activeIndex]) {
      event.preventDefault();
      navigate(filtered[activeIndex]);
    }
  }

  return (
    <Dialog open={open} onClose={close} className="app-command-root">
      <DialogBackdrop className="app-command-backdrop" />
      <div className="app-command-positioner">
        <DialogPanel className="app-command-panel">
          <div className="app-command-search">
            <Search aria-hidden="true" />
            <input autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }} onKeyDown={handleKeys} placeholder="Search pages and actions..." aria-label="Search pages and actions" />
            <button type="button" onClick={close} aria-label="Close command menu"><X /></button>
          </div>
          <DialogTitle className="app-command-title">Navigate iweOS</DialogTitle>
          <div className="app-command-results">
            {filtered.map((item, index) => {
              const Icon = item.icon;
              return (
                <button type="button" className={index === activeIndex ? "is-active" : ""} onMouseEnter={() => setActiveIndex(index)} onClick={() => navigate(item)} key={`${item.group}-${item.href}`}>
                  <span className="app-command-icon"><Icon /></span>
                  <span><strong>{item.label}</strong><small>{item.description}</small></span>
                  <i>{item.group}</i>
                </button>
              );
            })}
            {!filtered.length ? <div className="app-command-empty"><Search /><strong>No matching page</strong><span>Try a workflow name such as results, attendance, or payments.</span></div> : null}
          </div>
          <footer><span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>Enter</kbd> Open</span><span><kbd>Esc</kbd> Close</span></footer>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
