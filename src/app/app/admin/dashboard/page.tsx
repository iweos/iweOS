import Link from "next/link";
import { ProfileRole } from "@prisma/client";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

export default async function AdminDashboardPage() {
  const profile = await requireRole("admin");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [school, teacherCount, classCount, studentCount, subjectCount, activeTerm] = await Promise.all([
    prisma.school.findUnique({ where: { id: profile.schoolId } }),
    prisma.profile.count({ where: { schoolId: profile.schoolId, role: ProfileRole.TEACHER, isActive: true } }),
    prisma.class.count({ where: { schoolId: profile.schoolId } }),
    prisma.student.count({ where: { schoolId: profile.schoolId } }),
    prisma.subject.count({ where: { schoolId: profile.schoolId } }),
    prisma.term.findFirst({ where: { schoolId: profile.schoolId, isActive: true } }),
  ]);

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
    { label: "Teachers", value: teacherCount },
    { label: "Classes", value: classCount },
    { label: "Students", value: studentCount },
    { label: "Subjects", value: subjectCount },
    { label: "Payments Expected", value: totalExpected.toFixed(2) },
    { label: "Payments Collected", value: totalCollected.toFixed(2) },
    { label: "Payments Outstanding", value: totalOutstanding.toFixed(2) },
    { label: "Collection Rate", value: `${collectionRate.toFixed(1)}%` },
    { label: "Today's Collections", value: todayCollected.toFixed(2) },
  ];

  return (
    <>
      <section className="section-panel space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="section-kicker">Dashboard</p>
            <h1 className="section-title">{school.name}</h1>
            <p className="section-subtle">
              {school.country || "Country not set"}
              {activeTerm ? ` • Active term: ${activeTerm.sessionLabel} ${activeTerm.termLabel}` : " • No active term"}
            </p>
          </div>
          <Link href="/app/admin/settings" className="btn btn-muted">
            Open Settings
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map((card) => (
            <article key={card.label} className="metric-card">
              <p className="metric-label">{card.label}</p>
              <p className="metric-value">{card.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-panel">
        <h2 className="section-heading">Quick Actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link className="btn btn-muted" href="/app/admin/teachers">
            Manage Teachers
          </Link>
          <Link className="btn btn-muted" href="/app/admin/classes">
            Manage Classes
          </Link>
          <Link className="btn btn-muted" href="/app/admin/students">
            Manage Students
          </Link>
          <Link className="btn btn-muted" href="/app/admin/terms">
            Manage Terms
          </Link>
          <Link className="btn btn-muted" href="/app/admin/payments">
            Manage Payments
          </Link>
        </div>
      </section>
    </>
  );
}
