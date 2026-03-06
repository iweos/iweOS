import Link from "next/link";
import { InvoiceStatus, PaymentStatus } from "@prisma/client";
import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";
import StatCard from "@/components/admin/ui/StatCard";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function PaymentsReportsPage() {
  const profile = await requireRole("admin");
  const paymentClient = prisma as unknown as {
    invoice?: typeof prisma.invoice;
    payment?: typeof prisma.payment;
  };

  if (!paymentClient.invoice || !paymentClient.payment) {
    return (
      <Section>
        <PageHeader
          title="Payments Setup Required"
          subtitle="Payments tables are not available in the current Prisma client."
        />
        <Card>
          <p className="small text-muted">
            Run <code>npm run prisma:generate && npm run prisma:migrate</code>, then restart <code>npm run dev</code>.
          </p>
        </Card>
      </Section>
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
    <Section>
      <PageHeader title="Payment Reports" subtitle="Quick exports for paid lists, debtors, and collections snapshots." />

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Paid Invoices" value={paidCount} icon="fas fa-file-invoice" cardVariant="success" />
        <StatCard label="Open Debtor Invoices" value={debtorCount} icon="fas fa-exclamation-circle" cardVariant="danger" />
        <StatCard
          label="Successful Collections"
          value={formatMoney(toNumber(collections._sum.amount))}
          icon="fas fa-wallet"
          cardVariant="primary"
          delta={`${collections._count.id} transactions`}
          iconSize="sm"
        />
      </div>

      <Card title="Export Center" subtitle="Download CSV reports for accounting and reconciliation.">
        <div className="grid gap-2 md:grid-cols-3">
          <Link href="/api/payments/reports/paid" className="btn btn-secondary">
            Export Paid List (CSV)
          </Link>
          <Link href="/api/payments/reports/debtors" className="btn btn-brown">
            Export Debtors (CSV)
          </Link>
          <Link href="/api/payments/reports/collections" className="btn btn-primary">
            Export Collections (CSV)
          </Link>
        </div>
      </Card>
    </Section>
  );
}
