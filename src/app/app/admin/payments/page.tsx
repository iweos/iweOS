import Link from "next/link";
import { PaymentStatus } from "@prisma/client";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

export default async function AdminPaymentsOverviewPage() {
  const profile = await requireRole("admin");
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const paymentClient = prisma as unknown as {
    invoice?: typeof prisma.invoice;
    payment?: typeof prisma.payment;
  };

  if (!paymentClient.invoice || !paymentClient.payment) {
    return (
      <section className="section-panel space-y-2">
        <p className="section-kicker">Payments</p>
        <h1 className="section-title">Setup Required</h1>
        <p className="section-subtle">
          Payments tables are not available in the current Prisma client. Run:
          {" "}
          <code>npm run prisma:generate && npm run prisma:migrate</code>
          {" "}
          then restart <code>npm run dev</code>.
        </p>
      </section>
    );
  }

  const [invoiceAgg, collectedAgg, todayAgg, methodBreakdown, recentInvoices] = await Promise.all([
    paymentClient.invoice.aggregate({
      where: { schoolId: profile.schoolId },
      _sum: { total: true },
      _count: { id: true },
    }),
    paymentClient.payment.aggregate({
      where: { schoolId: profile.schoolId, status: PaymentStatus.SUCCESS },
      _sum: { amount: true },
      _count: { id: true },
    }),
    paymentClient.payment.aggregate({
      where: {
        schoolId: profile.schoolId,
        status: PaymentStatus.SUCCESS,
        createdAt: { gte: startOfDay },
      },
      _sum: { amount: true },
    }),
    paymentClient.payment.groupBy({
      by: ["method"],
      where: {
        schoolId: profile.schoolId,
        status: PaymentStatus.SUCCESS,
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
    paymentClient.invoice.findMany({
      where: { schoolId: profile.schoolId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
  ]);

  const totalExpected = toNumber(invoiceAgg._sum.total);
  const totalCollected = toNumber(collectedAgg._sum.amount);
  const totalOutstanding = Math.max(0, totalExpected - totalCollected);
  const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
  const todaysCollections = toNumber(todayAgg._sum.amount);

  return (
    <>
      <section className="section-panel space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="section-kicker">Payments</p>
            <h1 className="section-title">Collections Overview</h1>
            <p className="section-subtle">Track invoice generation, collections, and payment performance.</p>
          </div>
          <Link href="/pay" className="btn btn-muted">
            Open Parent Payment Page
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <article className="metric-card">
            <p className="metric-label">Total Expected</p>
            <p className="metric-value">{totalExpected.toFixed(2)}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Total Collected</p>
            <p className="metric-value">{totalCollected.toFixed(2)}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Outstanding</p>
            <p className="metric-value">{totalOutstanding.toFixed(2)}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Collection Rate</p>
            <p className="metric-value">{collectionRate.toFixed(1)}%</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Today&apos;s Collections</p>
            <p className="metric-value">{todaysCollections.toFixed(2)}</p>
          </article>
        </div>
      </section>

      <section className="section-panel">
        <h2 className="section-heading">Payment Method Breakdown</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {methodBreakdown.map((item) => (
            <article key={item.method} className="metric-card">
              <p className="metric-label">{item.method}</p>
              <p className="metric-value">{toNumber(item._sum.amount).toFixed(2)}</p>
              <p className="section-subtle">{item._count.id} transactions</p>
            </article>
          ))}
          {methodBreakdown.length === 0 && <p className="section-subtle">No successful payments yet.</p>}
        </div>
      </section>

      <section className="section-panel table-wrap">
        <h2 className="section-heading">Recent Invoices</h2>
        <table className="mt-2">
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Status</th>
              <th>Total</th>
              <th>Latest Payment</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {recentInvoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.invoiceNo}</td>
                <td>{invoice.status}</td>
                <td>{toNumber(invoice.total).toFixed(2)}</td>
                <td>{invoice.payments[0] ? `${toNumber(invoice.payments[0].amount).toFixed(2)} (${invoice.payments[0].status})` : "-"}</td>
                <td>{invoice.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
            {recentInvoices.length === 0 && (
              <tr>
                <td colSpan={5}>No invoices yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
