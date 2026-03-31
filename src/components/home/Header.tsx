import Link from "next/link";
import { ChevronDown } from "lucide-react";
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
          {navItems.map((item) =>
            item.children?.length ? (
              <div key={item.label} className="group relative">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2"
                >
                  <span>{item.label}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                <div className="invisible absolute left-0 top-[calc(100%+0.6rem)] z-40 min-w-[180px] rounded-xl border border-slate-200 bg-white p-2 opacity-0 shadow-[0_18px_45px_rgba(15,23,42,0.12)] transition duration-150 group-hover:visible group-hover:opacity-100">
                  {item.children.map((child) => (
                    <Link
                      key={`${item.label}-${child.label}`}
                      href={child.href}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-[#f4f8f7] hover:text-slate-900"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2"
              >
                {item.label}
              </Link>
            ),
          )}
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
          {navItems.map((item) =>
            item.children?.length ? (
              <div key={`mobile-${item.label}`} className="flex flex-col gap-1 py-1">
                <span className="whitespace-nowrap font-semibold text-slate-900">{item.label}</span>
                <div className="flex flex-col gap-1 pl-3">
                  {item.children.map((child) => (
                    <Link
                      key={`mobile-${item.label}-${child.label}`}
                      href={child.href}
                      className="whitespace-nowrap py-1 text-slate-700 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={`mobile-${item.label}`}
                href={item.href}
                className="whitespace-nowrap py-1 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}
