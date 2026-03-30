import Link from "next/link";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { isDynamicServerError } from "next/dist/client/components/hooks-server-context";
import { ProfileRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/server/auth";

export default async function AppIndexPage() {
  try {
    const profile = await requireProfile();
    redirect(profile.role === ProfileRole.ADMIN ? "/app/admin/dashboard" : "/app/teacher/dashboard");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    if (isDynamicServerError(error)) {
      throw error;
    }

    console.error("[app][index] Failed to redirect into app", error);
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <section className="mx-auto flex max-w-2xl flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">App Redirect</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">We couldn&apos;t finish the app redirect</h1>
          <p className="text-base leading-7 text-slate-600">
            Your login succeeded, but the app could not decide which workspace to open. If it keeps happening, the server logs now include the
            tag <code>[app][index]</code>.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/app/admin/dashboard" className="btn btn-primary">
              Try Admin Dashboard
            </Link>
            <Link href="/app/teacher/dashboard" className="btn btn-outline-secondary">
              Try Teacher Dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }
}
