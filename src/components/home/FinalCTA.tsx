import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="container py-14 sm:py-16" id="final-cta">
      <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(130deg,#0f766e_0%,#134e4a_60%,#1f2937_100%)] px-6 py-10 text-white sm:px-10">
        <h2 className="display max-w-2xl text-3xl leading-tight sm:text-4xl">
          Ready to simplify results and payments?
        </h2>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/demo"
            className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f766e]"
          >
            Request demo
          </Link>
          <Link
            href="/sign-up"
            className="rounded-md border border-white/50 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f766e]"
          >
            Get started
          </Link>
        </div>

        <p className="mt-4 text-sm text-slate-100">
          We&apos;ll help you onboard your term structure and fee items.
        </p>
      </div>
    </section>
  );
}
