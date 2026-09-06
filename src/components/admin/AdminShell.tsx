"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import GuideFooterBar from "@/components/guide/GuideFooterBar";
import ShellTour from "@/components/guide/ShellTour";
import Topbar from "@/components/admin/Topbar";
import type { SchoolAccessOption } from "@/types";

type AdminShellProps = {
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

export default function AdminShell({
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
}: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const pathname = usePathname();
  const resolvedHomeHref = homeHref ?? (mode === "teacher" ? "/app/teacher/dashboard" : "/app/admin/dashboard");
  const resolvedSettingsHref = settingsHref ?? (mode === "admin" ? "/app/admin/settings" : undefined);

  useEffect(() => {
    document.documentElement.classList.toggle("nav_open", mobileOpen);
    return () => {
      document.documentElement.classList.remove("nav_open");
    };
  }, [mobileOpen]);

  useEffect(() => {
    document.documentElement.classList.add("kai-admin");
    document.body.classList.add("kai-admin");
    return () => {
      document.documentElement.classList.remove("kai-admin");
      document.body.classList.remove("kai-admin");
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setMobileOpen(false), 0);
    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  return (
    <div className={`wrapper workspace-shell ${sidebarMinimized ? "sidebar_minimize" : ""}`}>
      <ShellTour mode={mode} teacherPortalAdmin={teacherPortalAdmin} />
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onMenuToggle={() => setMobileOpen((current) => !current)}
        onSidebarToggle={() => setSidebarMinimized((current) => !current)}
        sidebarMinimized={sidebarMinimized}
        mode={mode}
        homeHref={resolvedHomeHref}
        settingsHref={resolvedSettingsHref}
        profileName={profileName}
        profileEmail={profileEmail}
        teacherPortalAdmin={teacherPortalAdmin}
      />
      <div className="main-panel">
        <Topbar
          onMenuToggle={() => setMobileOpen((current) => !current)}
          onSidebarToggle={() => setSidebarMinimized((current) => !current)}
          sidebarMinimized={sidebarMinimized}
          mode={mode}
          homeHref={resolvedHomeHref}
          settingsHref={resolvedSettingsHref}
          profileName={profileName}
          profileEmail={profileEmail}
          currentSchoolName={currentSchoolName}
          currentProfileId={currentProfileId}
          schoolOptions={schoolOptions}
          platformAdmin={platformAdmin}
          teacherPortalAdmin={teacherPortalAdmin}
        />
        <div className="container">
          <main className="page-inner admin-page-wrap" data-tour="main-content">
            {children}
            <div className="admin-footer-spacer" aria-hidden="true" />
          </main>
        </div>
        <GuideFooterBar showTourButton />
      </div>
    </div>
  );
}
