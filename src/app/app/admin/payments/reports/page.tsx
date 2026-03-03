import Link from "next/link";
import { InvoiceStatus, PaymentStatus } from "@prisma/client";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

export default async function PaymentsReportsPage() {
  const profile = await requireRole("admin");
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
          Payments tables are not available yet. Run <code>npm run prisma:generate && npm run prisma:migrate</code>,
          then restart <code>npm run dev</code>.
        </p>
      </section>
    );
  }

  const [paidCount, debtorCount, collections] = await Promise.all([
    paymentClient.invoice.count({
      where: {
        schoolId: profile.schoolId,
        status: InvoiceStatus.PAID,
      },
    }),
    paymentClient.invoice.count({
      where: {
        schoolId: profile.schoolId,
        status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PART_PAID] },
      },
    }),
    paymentClient.payment.aggregate({
      where: {
        schoolId: profile.schoolId,
        status: PaymentStatus.SUCCESS,
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  return (
    <section className="section-panel space-y-4">
      <div>
        <p className="section-kicker">Payments</p>
        <h1 className="section-title">Reports</h1>
        <p className="section-subtle">Quick exports for paid lists, debtors, and collections snapshots.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="metric-card">
          <p className="metric-label">Paid Invoices</p>
          <p className="metric-value">{paidCount}</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Open Debtor Invoices</p>
          <p className="metric-value">{debtorCount}</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Successful Collections</p>
          <p className="metric-value">{toNumber(collections._sum.amount).toFixed(2)}</p>
          <p className="section-subtle">{collections._count.id} transactions</p>
        </article>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <Link href="/api/payments/reports/paid" className="btn btn-muted">
          Export Paid List (CSV)
        </Link>
        <Link href="/api/payments/reports/debtors" className="btn btn-muted">
          Export Debtors (CSV)
        </Link>
        <Link href="/api/payments/reports/collections" className="btn btn-muted">
          Export Collections (CSV)
        </Link>
      </div>
    </section>
  );
}
