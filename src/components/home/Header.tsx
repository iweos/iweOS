import Link from "next/link";
import { navItems } from "@/lib/content";
import BrandLogo from "@/components/BrandLogo";
import ThemeToggle from "@/components/ThemeToggle";

export default function Header() {
  return (
    <header className="site-header sticky top-0 z-50 border-b border-slate-200/80 bg-[#f8f4ee]/95 backdrop-blur">
      <div className="container flex min-h-16 flex-wrap items-center justify-between gap-3 py-3 sm:flex-nowrap">
        <BrandLogo
          href="/"
          variant="dark"
          className="text-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2"
          textClassName="font-bold"
          iconClassName="text-[0.95em]"
        />

        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-700 md:flex" aria-label="Primary">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
          <ThemeToggle className="theme-toggle site-theme-toggle" />
          <Link
            href="/sign-in"
            className="site-header-link rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2"
          >
            Sign in
          </Link>
          <Link
            href="/demo"
            className="site-header-cta rounded-md bg-[#0f766e] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0d5f59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2"
          >
            Request demo
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-200/80 md:hidden">
        <nav
          className="container flex items-center gap-5 overflow-x-auto py-2 text-sm font-medium text-slate-700"
          aria-label="Mobile primary"
        >
          {navItems.map((item) => (
            <Link
              key={`mobile-${item.label}`}
              href={item.href}
              className="whitespace-nowrap py-1 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
