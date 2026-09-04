"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, BookOpenCheck, Building2, ClipboardList, LayoutDashboard, LogOut, Menu, ShieldCheck, UsersRound, WalletCards, X } from "lucide-react";
import { useEffect, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import ThemeToggle from "@/components/ThemeToggle";

type PlatformShellProps = {
  children: React.ReactNode;
  email: string;
  schoolPortalHref?: string;
};

const navItems = [
  { href: "/platform", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/platform/schools", label: "Schools", icon: Building2 },
  { href: "/platform/users", label: "Users", icon: UsersRound },
  { href: "/platform/payments", label: "Payments", icon: WalletCards },
  { href: "/platform/results", label: "Results", icon: BookOpenCheck },
  { href: "/platform/audit", label: "Audit logs", icon: ClipboardList },
];

function sectionTitle(pathname: string) {
  if (pathname.startsWith("/platform/schools")) return "School intelligence";
  if (pathname.startsWith("/platform/users")) return "Account intelligence";
  if (pathname.startsWith("/platform/payments")) return "Payment operations";
  if (pathname.startsWith("/platform/results")) return "Result operations";
  if (pathname.startsWith("/platform/audit")) return "Governance and audit";
  return "Platform overview";
}

export default function PlatformShell({ children, email, schoolPortalHref }: PlatformShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setMenuOpen(false), 0);
    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    void fetch("/api/auth/sign-out", { method: "POST" })
      .then(() => window.location.assign("/sign-in"))
      .catch(() => setSigningOut(false));
  }

  return (
    <div className="platform-shell">
      <button className={`platform-scrim ${menuOpen ? "is-visible" : ""}`} aria-label="Close navigation" onClick={() => setMenuOpen(false)} />
      <aside className={`platform-sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="platform-brand-row">
          <BrandLogo href="/platform" variant="light" className="platform-brand" textClassName="platform-brand-name" />
          <button className="platform-mobile-close" type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X /></button>
        </div>
        <div className="platform-control-label"><ShieldCheck /> Platform control</div>
        <nav className="platform-nav" aria-label="Platform administration">
          <p>Workspace</p>
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return <Link href={item.href} className={active ? "is-active" : ""} key={item.href}><Icon /><span>{item.label}</span></Link>;
          })}
        </nav>
        <div className="platform-sidebar-footer">
          <div className="platform-account-badge">
            <span>{email.slice(0, 1).toUpperCase()}</span>
            <div><strong>Platform admin</strong><small>{email}</small></div>
          </div>
          <button type="button" onClick={signOut} disabled={signingOut}><LogOut /> {signingOut ? "Signing out..." : "Sign out"}</button>
        </div>
      </aside>

      <div className="platform-stage">
        <header className="platform-header">
          <button className="platform-menu-button" type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu /></button>
          <div>
            <span>iweOS administration</span>
            <strong>{sectionTitle(pathname)}</strong>
          </div>
          <div className="platform-header-actions">
            <ThemeToggle className="platform-theme-toggle" />
            {schoolPortalHref ? <Link href={schoolPortalHref}><ArrowLeft /> School portal</Link> : null}
          </div>
        </header>
        <main className="platform-main">{children}</main>
      </div>
    </div>
  );
}
