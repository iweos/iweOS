"use client";

import { useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Topbar from "@/components/admin/Topbar";

type AdminShellProps = {
  children: React.ReactNode;
  profileName?: string;
  profileEmail?: string;
};

export default function AdminShell({ children, profileName, profileEmail }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)]">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="lg:ml-64">
        <Topbar
          onMenuToggle={() => setMobileOpen((current) => !current)}
          profileName={profileName}
          profileEmail={profileEmail}
        />
        <main className="admin-page-wrap">{children}</main>
      </div>
    </div>
  );
}
