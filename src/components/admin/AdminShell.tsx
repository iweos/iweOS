"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import Topbar from "@/components/admin/Topbar";

type AdminShellProps = {
  children: React.ReactNode;
  profileName?: string;
  profileEmail?: string;
};

export default function AdminShell({ children, profileName, profileEmail }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const pathname = usePathname();

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
        profileName={profileName}
        profileEmail={profileEmail}
      />
      <div className="main-panel">
        <Topbar
          onMenuToggle={() => setMobileOpen((current) => !current)}
          onSidebarToggle={() => setSidebarMinimized((current) => !current)}
          sidebarMinimized={sidebarMinimized}
          profileName={profileName}
          profileEmail={profileEmail}
        />
        <div className="container">
          <main className="page-inner admin-page-wrap">{children}</main>
        </div>
      </div>
    </div>
  );
}
