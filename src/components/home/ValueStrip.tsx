import { outcomes } from "@/lib/content";

export default function ValueStrip() {
  return (
    <section className="border-y border-slate-200 bg-white/80 py-8">
      <div className="container grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {outcomes.map((item) => (
          <article key={item.title} className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-base font-semibold text-slate-900">{item.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
