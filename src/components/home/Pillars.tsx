import { gradingFeatures, paymentFeatures } from "@/lib/content";

function FeatureGrid({ items }: { items: typeof gradingFeatures }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <article key={item.title} className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
        </article>
      ))}
    </div>
  );
}

export default function Pillars() {
  return (
    <section className="container space-y-12 py-14 sm:py-16" id="product">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#0f766e]">Product Overview</p>
        <h2 className="display mt-3 text-3xl leading-tight text-slate-900 sm:text-4xl">
          Two pillars, one operating system
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
          ìwéOS combines grading operations and school payments so academic and finance teams stay in sync.
        </p>
      </header>

      <article id="grading" className="rounded-2xl border border-slate-200 bg-[#f9fbfb] p-6">
        <h3 className="text-2xl font-semibold text-slate-900">Grading System</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Plan terms, assign classes, collect scores, and produce report outputs with clear role controls.
        </p>
        <FeatureGrid items={gradingFeatures} />
      </article>

      <article id="payments" className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-2xl font-semibold text-slate-900">SchoolPayApp</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Handle fee collection from payment link to receipts while keeping outstanding balances and reconciliation visible.
        </p>
        <FeatureGrid items={paymentFeatures} />
      </article>
    </section>
  );
}
