import Link from "next/link";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { isDynamicServerError } from "next/dist/client/components/hooks-server-context";
import { ProfileRole } from "@prisma/client";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { isPrismaSchemaMismatchError, schemaSyncMessage } from "@/lib/server/prisma-errors";
import StatCard from "@/components/admin/ui/StatCard";

export default async function AdminDashboardPage() {
  try {
    const profile = await requireRole("admin");

    let school: Awaited<ReturnType<typeof prisma.school.findUnique>> = null;
    let teacherCount = 0;
    let classCount = 0;
    let studentCount = 0;
    let subjectCount = 0;
    let activeTerm: Awaited<ReturnType<typeof prisma.term.findFirst>> = null;

    try {
      [school, teacherCount, classCount, studentCount, subjectCount, activeTerm] = await Promise.all([
        prisma.school.findUnique({ where: { id: profile.schoolId } }),
        prisma.profile.count({ where: { schoolId: profile.schoolId, role: ProfileRole.TEACHER, isActive: true } }),
        prisma.class.count({ where: { schoolId: profile.schoolId } }),
        prisma.student.count({ where: { schoolId: profile.schoolId } }),
        prisma.subject.count({ where: { schoolId: profile.schoolId } }),
        prisma.term.findFirst({ where: { schoolId: profile.schoolId, isActive: true } }),
      ]);
    } catch (error) {
      if (isPrismaSchemaMismatchError(error)) {
        return (
          <section className="card card-body d-grid gap-2">
            <p className="section-kicker">Dashboard</p>
            <h1 className="section-title">Setup Required</h1>
            <p className="section-subtle">{schemaSyncMessage("Admin")}</p>
          </section>
        );
      }
      throw error;
    }

    if (!school) {
      throw new Error("School not found.");
    }

    const cards = [
      { label: "Teachers", value: teacherCount, icon: "fas fa-chalkboard-teacher", variant: "secondary" as const },
      { label: "Classes", value: classCount, icon: "fas fa-th-large", variant: "info" as const },
      { label: "Students", value: studentCount, icon: "fas fa-user-graduate", variant: "success" as const },
      { label: "Subjects", value: subjectCount, icon: "fas fa-book-open", variant: "warning" as const },
    ];

    return (
      <>
        <div className="card card-round">
          <div className="card-body">
            <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
              <div>
                <p className="mb-1 text-uppercase fw-bold text-secondary small">Dashboard</p>
                <h1 className="mb-1 fw-bold">{school.name}</h1>
                <p className="text-muted mb-0">
                  {school.country || "Country not set"}
                  {activeTerm ? ` • Active term: ${activeTerm.sessionLabel} ${activeTerm.termLabel}` : " • No active term"}
                </p>
              </div>
              <Link href="/app/admin/settings" className="btn btn-secondary">
                Open Settings
              </Link>
            </div>

            <div className="row g-3 mt-1">
              {cards.map((card) => (
                <div key={card.label} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                  <StatCard
                    label={card.label}
                    value={card.value}
                    icon={card.icon}
                    cardVariant={card.variant}
                    iconSize={card.label.includes("Rate") ? "sm" : "md"}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card card-round">
          <div className="card-body">
            <h2 className="fw-bold mb-3">Quick Actions</h2>
            <div className="d-flex flex-wrap gap-2">
              <Link className="btn btn-secondary" href="/app/admin/teachers">
                Manage Teachers
              </Link>
              <Link className="btn btn-secondary" href="/app/admin/classes">
                Manage Classes
              </Link>
              <Link className="btn btn-secondary" href="/app/admin/students">
                Manage Students
              </Link>
              <Link className="btn btn-secondary" href="/app/admin/terms">
                Manage Terms
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    if (isDynamicServerError(error)) {
      throw error;
    }

    console.error("[dashboard][admin] Failed to render admin dashboard", error);
    if (isPrismaSchemaMismatchError(error)) {
      return (
        <section className="card card-body d-grid gap-2">
          <p className="section-kicker">Dashboard</p>
          <h1 className="section-title">Setup Required</h1>
          <p className="section-subtle">{schemaSyncMessage("Admin")}</p>
        </section>
      );
    }
    return (
      <section className="card card-body d-grid gap-2">
        <p className="section-kicker">Dashboard</p>
        <h1 className="section-title">Admin dashboard temporarily unavailable</h1>
        <p className="section-subtle">
          We hit an unexpected issue while loading the dashboard. Try refreshing once. If it keeps happening, the server logs now have a
          tagged entry to help us trace it quickly.
        </p>
      </section>
    );
  }
}
