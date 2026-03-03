import { howItWorksSteps } from "@/lib/content";

export default function HowItWorks() {
  return (
    <section className="container py-14 sm:py-16">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#0f766e]">How it works</p>
        <h2 className="display mt-3 text-3xl leading-tight text-slate-900 sm:text-4xl">From setup to daily operations</h2>
      </header>

      <ol className="mt-8 grid gap-4 md:grid-cols-3">
        {howItWorksSteps.map((step, index) => (
          <li key={step.title} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0f766e]/10 text-sm font-semibold text-[#0f766e]">
              {index + 1}
            </p>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
