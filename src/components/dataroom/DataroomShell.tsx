"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenCheck, Building2, ClipboardList, LayoutDashboard, LoaderCircle, PanelLeftClose, PanelLeftOpen, LogOut, Menu, ShieldCheck, UsersRound, WalletCards, X } from "lucide-react";
import { useEffect, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import ThemeToggle from "@/components/ThemeToggle";
import type { SchoolAccessOption } from "@/types";

type DataroomShellProps = {
  children: React.ReactNode;
  email: string;
  currentProfileId?: string;
  schoolOptions: SchoolAccessOption[];
};

const navItems = [
  { href: "/dataroom", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dataroom/schools", label: "Schools", icon: Building2 },
  { href: "/dataroom/users", label: "Users", icon: UsersRound },
  { href: "/dataroom/payments", label: "Payments", icon: WalletCards },
  { href: "/dataroom/results", label: "Results", icon: BookOpenCheck },
  { href: "/dataroom/audit", label: "Audit logs", icon: ClipboardList },
];

function sectionTitle(pathname: string) {
  if (pathname.startsWith("/dataroom/schools")) return "School intelligence";
  if (pathname.startsWith("/dataroom/users")) return "Account intelligence";
  if (pathname.startsWith("/dataroom/payments")) return "Payment operations";
  if (pathname.startsWith("/dataroom/results")) return "Result operations";
  if (pathname.startsWith("/dataroom/audit")) return "Governance and audit";
  return "Dataroom overview";
}

export default function DataroomShell({ children, email, currentProfileId, schoolOptions }: DataroomShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [switchingProfileId, setSwitchingProfileId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setMenuOpen(false), 0);
    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  useEffect(() => {
    setSidebarCollapsed(window.localStorage.getItem("iweos:dataroom-sidebar") === "collapsed");
  }, []);

  function toggleSidebar() {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed;
      window.localStorage.setItem("iweos:dataroom-sidebar", next ? "collapsed" : "expanded");
      return next;
    });
  }

  async function openSchoolPortal(profileId: string) {
    if (!profileId || switchingProfileId) return;
    const portalWindow = window.open("about:blank", "_blank");
    if (!portalWindow) {
      window.alert("Allow pop-ups for iweOS to open the school portal in a new tab.");
      return;
    }
    portalWindow.opener = null;
    setSwitchingProfileId(profileId);
    try {
      const response = await fetch("/api/auth/switch-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });
      const payload = (await response.json()) as { destination?: string; error?: string };
      if (!response.ok || !payload.destination) throw new Error(payload.error || "Unable to open this school.");
      portalWindow.location.replace(payload.destination);
      setSwitchingProfileId(null);
    } catch (error) {
      portalWindow.close();
      setSwitchingProfileId(null);
      window.alert(error instanceof Error ? error.message : "Unable to open this school.");
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
    <div className={`platform-shell ${sidebarCollapsed ? "is-sidebar-collapsed" : ""}`}>
      <button className={`platform-scrim ${menuOpen ? "is-visible" : ""}`} aria-label="Close navigation" onClick={() => setMenuOpen(false)} />
      <aside className={`platform-sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="platform-brand-row">
          <BrandLogo href="/dataroom" variant="light" className="platform-brand" textClassName="platform-brand-name" />
          <button className="platform-collapse-button" type="button" onClick={toggleSidebar} aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}>
            {sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </button>
          <button className="platform-mobile-close" type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X /></button>
        </div>
        <div className="platform-control-label"><ShieldCheck /><span>Dataroom control</span></div>
        <nav className="platform-nav" aria-label="Dataroom administration">
          <p>Workspace</p>
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return <Link href={item.href} className={active ? "is-active" : ""} key={item.href} title={item.label}><Icon /><span>{item.label}</span></Link>;
          })}
        </nav>
        <div className="platform-sidebar-footer">
          <div className="platform-account-badge">
            <span>{email.slice(0, 1).toUpperCase()}</span>
            <div><strong>Dataroom admin</strong><small>{email}</small></div>
          </div>
          <button type="button" onClick={signOut} disabled={signingOut} title="Sign out"><LogOut /><span>{signingOut ? "Signing out..." : "Sign out"}</span></button>
        </div>
      </aside>

      <div className="platform-stage">
        <header className="platform-header">
          <button className="platform-menu-button" type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu /></button>
          <div>
            <span>iweOS Dataroom</span>
            <strong>{sectionTitle(pathname)}</strong>
          </div>
          <div className="platform-header-actions">
            <ThemeToggle className="platform-theme-toggle" />
            <label className="platform-school-switcher">
              {switchingProfileId ? <LoaderCircle className="is-spinning" /> : <Building2 />}
              <select
                aria-label="Open a school portal"
                value={switchingProfileId ?? ""}
                disabled={schoolOptions.length === 0 || Boolean(switchingProfileId)}
                onChange={(event) => void openSchoolPortal(event.target.value)}
              >
                <option value="" disabled>{schoolOptions.length ? "School portal" : "No admin school"}</option>
                {schoolOptions.map((option) => (
                  <option value={option.profileId} key={option.profileId}>
                    {option.profileId === currentProfileId ? `${option.schoolName} (Current)` : option.schoolName}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>
        <main className="platform-main">{children}</main>
      </div>
    </div>
  );
}
