import Link from "next/link";
import { roles } from "@/lib/content";

export default function Roles() {
  return (
    <section className="container py-14 sm:py-16">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#0f766e]">Built for every role</p>
        <h2 className="display mt-3 text-3xl leading-tight text-slate-900 sm:text-4xl">Admins, teachers, and parents</h2>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {roles.map((role) => (
          <article key={role.role} className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-xl font-semibold text-slate-900">{role.role}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{role.summary}</p>
            <ul className="mt-4 space-y-2">
              {role.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2 text-sm text-slate-700">
                  <span aria-hidden="true" className="mt-[0.35rem] h-1.5 w-1.5 rounded-full bg-[#0f766e]" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <Link
              href={role.ctaHref}
              className="mt-5 inline-flex text-sm font-semibold text-[#0f766e] underline decoration-[#0f766e]/30 underline-offset-4 transition-colors hover:text-[#0d5f59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2"
            >
              {role.ctaLabel}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
