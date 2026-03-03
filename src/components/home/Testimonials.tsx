import { testimonials } from "@/lib/content";

export default function Testimonials() {
  return (
    <section className="container py-14 sm:py-16">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#0f766e]">Testimonials</p>
        <h2 className="display mt-3 text-3xl leading-tight text-slate-900 sm:text-4xl">Outcomes schools talk about</h2>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {testimonials.map((entry) => (
          <figure key={`${entry.name}-${entry.school}`} className="rounded-xl border border-slate-200 bg-white p-5">
            <blockquote className="text-base leading-relaxed text-slate-700">“{entry.quote}”</blockquote>
            <figcaption className="mt-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">{entry.name}</p>
              <p>{entry.title}</p>
              <p>{entry.school}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
