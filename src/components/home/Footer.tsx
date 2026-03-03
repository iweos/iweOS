import Link from "next/link";
import { footerGroups, siteName, socialLinks } from "@/lib/content";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/80 py-10">
      <div className="container grid gap-8 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-xl font-bold tracking-tight text-slate-900">{siteName}</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
            School OS for grading operations and parent payments.
          </p>
          <p className="mt-4 text-sm text-slate-600">
            Contact: <a href="mailto:support@iweos" className="font-semibold text-slate-800">support@iweos</a>
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
            {socialLinks.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                className="underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2"
              >
                {social.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className="text-sm font-semibold text-slate-900">{group.title}</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
    </footer>
  );
}
