import Link from "next/link";
import { ProfileRole } from "@prisma/client";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { isPrismaSchemaMismatchError, schemaSyncMessage } from "@/lib/server/prisma-errors";
import StatCard from "@/components/admin/ui/StatCard";

export default async function AdminDashboardPage() {
  const profile = await requireRole("admin");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

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

  let totalExpected = 0;
  let totalCollected = 0;
  let todayCollected = 0;

  const paymentClient = prisma as unknown as {
    invoice?: { aggregate: (args: unknown) => Promise<{ _sum: { total: number | null } }> };
    payment?: { aggregate: (args: unknown) => Promise<{ _sum: { amount: number | null } }> };
  };

  if (paymentClient.invoice && paymentClient.payment) {
    const [invoiceAgg, collectionAgg, todayAgg] = await Promise.all([
      paymentClient.invoice.aggregate({
        where: { schoolId: profile.schoolId },
        _sum: { total: true },
      }),
      paymentClient.payment.aggregate({
        where: {
          schoolId: profile.schoolId,
          status: "SUCCESS",
        },
        _sum: { amount: true },
      }),
      paymentClient.payment.aggregate({
        where: {
          schoolId: profile.schoolId,
          status: "SUCCESS",
          createdAt: { gte: startOfDay },
        },
        _sum: { amount: true },
      }),
    ]);

    totalExpected = Number(invoiceAgg._sum.total ?? 0);
    totalCollected = Number(collectionAgg._sum.amount ?? 0);
    todayCollected = Number(todayAgg._sum.amount ?? 0);
  }

  const totalOutstanding = Math.max(0, totalExpected - totalCollected);
  const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

  const cards = [
    { label: "Teachers", value: teacherCount, icon: "fas fa-chalkboard-teacher", variant: "secondary" as const },
    { label: "Classes", value: classCount, icon: "fas fa-th-large", variant: "info" as const },
    { label: "Students", value: studentCount, icon: "fas fa-user-graduate", variant: "success" as const },
    { label: "Subjects", value: subjectCount, icon: "fas fa-book-open", variant: "warning" as const },
    { label: "Payments Expected", value: totalExpected.toFixed(2), icon: "fas fa-wallet", variant: "primary" as const },
    { label: "Payments Collected", value: totalCollected.toFixed(2), icon: "fas fa-money-check-alt", variant: "success" as const },
    { label: "Payments Outstanding", value: totalOutstanding.toFixed(2), icon: "fas fa-exclamation-circle", variant: "danger" as const },
    { label: "Collection Rate", value: `${collectionRate.toFixed(1)}%`, icon: "fas fa-percentage", variant: "info" as const },
    { label: "Today's Collections", value: todayCollected.toFixed(2), icon: "fas fa-calendar-day", variant: "secondary" as const },
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
            <Link className="btn btn-secondary" href="/app/admin/payments">
              Manage Payments
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
