import { trustItems, trustStackNote } from "@/lib/content";

export default function Trust() {
  return (
    <section className="container py-14 sm:py-16">
      <div className="rounded-2xl border border-slate-200 bg-[#111827] px-6 py-8 text-white sm:px-8 sm:py-10">
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-teal-200">Proof and trust</p>
          <h2 className="display mt-3 text-3xl leading-tight sm:text-4xl">Security and audit trail built in</h2>
        </header>

        <ul className="mt-7 grid gap-3 md:grid-cols-3">
          {trustItems.map((item) => (
            <li key={item.title} className="rounded-lg border border-white/20 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{item.description}</p>
            </li>
          ))}
        </ul>

        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-slate-200">{trustStackNote}</p>
      </div>
    </section>
  );
}
