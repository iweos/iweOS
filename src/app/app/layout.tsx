import Link from "next/link";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { isDynamicServerError } from "next/dist/client/components/hooks-server-context";
import { requireProfile } from "@/lib/server/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireProfile();
    return children;
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    if (isDynamicServerError(error)) {
      throw error;
    }

    console.error("[app][layout] Failed to resolve app profile", error);

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <section className="mx-auto flex max-w-2xl flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">App Access</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">We couldn&apos;t open the app workspace</h1>
          <p className="text-base leading-7 text-slate-600">
            We hit an unexpected issue while resolving your signed-in profile. Please refresh once. If it keeps happening, the server logs now
            include the tag <code>[app][layout]</code> so we can trace it quickly.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/sign-in" className="btn btn-primary">
              Back to sign in
            </Link>
            <Link href="/" className="btn btn-outline-secondary">
              Go home
            </Link>
          </div>
        </section>
      </main>
    );
  }
}
