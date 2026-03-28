"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import GuideFooterBar from "@/components/guide/GuideFooterBar";
import Topbar from "@/components/admin/Topbar";

type AdminShellProps = {
  children: React.ReactNode;
  mode?: "admin" | "teacher";
  homeHref?: string;
  settingsHref?: string;
  profileName?: string;
  profileEmail?: string;
  teacherPortalAdmin?: boolean;
};

export default function AdminShell({
  children,
  mode = "admin",
  homeHref,
  settingsHref,
  profileName,
  profileEmail,
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
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className={`wrapper ${sidebarMinimized ? "sidebar_minimize" : ""}`}>
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
        />
        <div className="container">
          <main className="page-inner admin-page-wrap">{children}</main>
        </div>
        <div className="container">
          <div className="page-inner pt-0">
            <GuideFooterBar compact />
          </div>
        </div>
      </div>
    </div>
  );
}
