import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Request Demo",
  description: "Request a demo of ìwéOS for school grading and SchoolPayApp.",
};

export default function DemoPage() {
  return (
    <main className="container py-16">
      <h1 className="display text-4xl text-slate-900">Request Demo</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Share your school size, term structure, and payment process. We&apos;ll schedule a guided demo and onboarding plan.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="mailto:support@iweos.io" className="rounded-md bg-[#0f766e] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0d5f59]">
          Email support@iweos.io
        </Link>
        <Link href="/" className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-400">
          Back home
        </Link>
      </div>
    </main>
  );
}
