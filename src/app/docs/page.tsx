import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Docs",
  description: "Documentation for ìwéOS admins, teachers, and payment workflows.",
};

export default function DocsPage() {
  return (
    <main className="container py-16">
      <h1 className="display text-4xl text-slate-900">Docs</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Product documentation is being organized for onboarding, grading setup, and SchoolPayApp operations.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/demo" className="rounded-md bg-[#0f766e] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0d5f59]">
          Request demo
        </Link>
        <Link href="/" className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-400">
          Back home
        </Link>
      </div>
    </main>
  );
}
