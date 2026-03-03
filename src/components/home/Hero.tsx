import Link from "next/link";
import {
  gradingPreviewRows,
  heroContent,
  paymentPreviewLines,
  paymentStatuses,
} from "@/lib/content";

const statusClasses: Record<(typeof paymentStatuses)[number], string> = {
  Paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Part-paid": "border-amber-200 bg-amber-50 text-amber-700",
  Outstanding: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function Hero() {
  return (
    <section className="container grid gap-10 py-14 md:grid-cols-[1.05fr_0.95fr] md:py-20" id="top">
      <div className="max-w-2xl">
        <h1 className="display text-4xl leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          {heroContent.heading}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
          {heroContent.subheading}
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={heroContent.primaryCta.href}
            className="rounded-md bg-[#0f766e] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0d5f59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2"
          >
            {heroContent.primaryCta.label}
          </Link>
          <Link
            href={heroContent.secondaryCta.href}
            className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-400 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2"
          >
            {heroContent.secondaryCta.label}
          </Link>
          <Link
            href={heroContent.tertiaryCta.href}
            className="rounded-md px-3 py-3 text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2"
          >
            {heroContent.tertiaryCta.label}
          </Link>
        </div>

        <p className="mt-6 border-l-2 border-[#0f766e] pl-3 text-sm text-slate-600">{heroContent.trustLine}</p>
      </div>

      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_45px_rgb(15_23_42_/0.10)] sm:p-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-700">
          <span className="rounded-full bg-white px-3 py-1 text-slate-900 shadow-sm">Grading</span>
          <span className="rounded-full px-3 py-1 text-slate-500">Payments</span>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <div className="bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
            Teacher Entry
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">CA1</th>
                  <th className="px-3 py-2">CA2</th>
                  <th className="px-3 py-2">Exam</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2">Grade</th>
                </tr>
              </thead>
              <tbody>
                {gradingPreviewRows.map((row) => (
                  <tr key={row.student}>
                    <td className="px-3 py-2 text-slate-700">{row.student}</td>
                    <td className="px-3 py-2">{row.ca1}</td>
                    <td className="px-3 py-2">{row.ca2}</td>
                    <td className="px-3 py-2">{row.exam}</td>
                    <td className="px-3 py-2 font-semibold text-slate-800">{row.total}</td>
                    <td className="px-3 py-2 font-semibold text-[#0f766e]">{row.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200">
          <div className="bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
            Invoice Summary
          </div>
          <dl className="space-y-2 px-3 py-3 text-sm">
            {paymentPreviewLines.map((line) => (
              <div key={line.item} className="flex items-center justify-between">
                <dt className="text-slate-600">{line.item}</dt>
                <dd className="font-semibold text-slate-800">{line.amount}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-2 border-t border-slate-200 px-3 py-3">
            {paymentStatuses.map((status) => (
              <span
                key={status}
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[status]}`}
              >
                {status}
              </span>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}
