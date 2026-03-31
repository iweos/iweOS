import type { Metadata } from "next";
import Link from "next/link";
import PublicSiteShell from "@/components/home-template/PublicSiteShell";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Pricing options for ìwéOS school grading and payment workflows.",
};

export default function PricingPage() {
  return (
    <PublicSiteShell currentPath="/pricing">
      <main>
        <section className="border-b border-[#e6dfd3]">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#1e3a5f]">Pricing</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#111827] sm:text-5xl">Simple school pricing: one setup fee, then pay per student</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#4b5563]">
              iweOS pricing is designed around school size. Schools pay a one-time setup fee for onboarding and configuration, then continue on a per-student pricing model.
            </p>
          </div>
        </section>

        <section className="border-b border-[#e6dfd3]">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <div className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-xl border border-[#d7dfe9] bg-white p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#1e3a5f]">One-time fee</p>
                <h2 className="mt-3 text-2xl font-semibold text-[#111827]">Setup and onboarding</h2>
                <p className="mt-3 text-sm leading-7 text-[#4b5563]">
                  Covers school setup, configuration guidance, onboarding support, and the initial rollout structure so the school starts correctly.
                </p>
              </article>

              <article className="rounded-xl border border-[#d7dfe9] bg-white p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#1e3a5f]">Ongoing fee</p>
                <h2 className="mt-3 text-2xl font-semibold text-[#111827]">Per-student pricing</h2>
                <p className="mt-3 text-sm leading-7 text-[#4b5563]">
                  Ongoing cost scales with the number of students using the platform, making the pricing model easier to align with school size and growth.
                </p>
              </article>
            </div>

            <div className="mt-8 rounded-xl border border-[#d7dfe9] bg-white p-6">
              <h3 className="text-xl font-semibold text-[#111827]">What affects the final quote?</h3>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[#4b5563]">
                <li>• Number of active students</li>
                <li>• School structure and onboarding complexity</li>
                <li>• Required setup support and rollout assistance</li>
                <li>• Optional operational workflows such as payments and advanced reporting</li>
              </ul>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/sign-up" className="rounded-md bg-[#1e3a5f] px-5 py-3 text-sm font-medium !text-white hover:!text-white">
                Sign up
              </Link>
              <Link href="/guide" className="rounded-md border border-[#cfd8e3] px-5 py-3 text-sm font-semibold text-[#1f2a37] hover:border-[#9aa7bb]">
                Open guide
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PublicSiteShell>
  );
}
