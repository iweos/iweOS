import Link from "next/link";
import { PaymentStatus } from "@prisma/client";
import Badge from "@/components/admin/ui/Badge";
import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";
import StatCard from "@/components/admin/ui/StatCard";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    <Section>
      <PageHeader
        title="Payments Overview"
        subtitle="Track invoice generation, collections, and payment performance."
        rightActions={
          <Link href="/pay" className="btn btn-secondary">
            Open Parent Payment Page
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Expected" value={formatMoney(totalExpected)} icon="fas fa-wallet" cardVariant="primary" />
        <StatCard label="Total Collected" value={formatMoney(totalCollected)} icon="fas fa-money-check-alt" cardVariant="success" />
        <StatCard label="Outstanding" value={formatMoney(totalOutstanding)} icon="fas fa-exclamation-circle" cardVariant="danger" />
        <StatCard label="Collection Rate" value={`${collectionRate.toFixed(1)}%`} icon="fas fa-percentage" cardVariant="info" iconSize="sm" />
        <StatCard label="Today's Collections" value={formatMoney(todaysCollections)} icon="fas fa-calendar-day" cardVariant="secondary" />
      </div>

      <Card title="Payment Method Breakdown">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {methodBreakdown.map((item, index) => (
            <StatCard
              key={item.method}
              label={item.method}
              value={formatMoney(toNumber(item._sum.amount))}
              icon={item.method.toLowerCase().includes("card") ? "fas fa-credit-card" : "fas fa-university"}
              cardVariant={index % 2 === 0 ? "info" : "secondary"}
              delta={`${item._count.id} transactions`}
              iconSize="sm"
            />
          ))}
          {methodBreakdown.length === 0 ? <p className="small text-muted">No successful payments yet.</p> : null}
        </div>
      </Card>

      <Card title="Recent Invoices" subtitle="Latest invoice activity and payment snapshots.">
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Invoice No</Th>
                <Th>Status</Th>
                <Th>Total</Th>
                <Th>Latest Payment</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((invoice) => {
                const tone =
                  invoice.status === "PAID"
                    ? "success"
                    : invoice.status === "PART_PAID"
                      ? "warning"
                      : invoice.status === "FAILED"
                        ? "danger"
                        : "neutral";

                return (
                  <tr key={invoice.id}>
                    <Td>{invoice.invoiceNo}</Td>
                    <Td>
                      <Badge tone={tone}>{invoice.status}</Badge>
                    </Td>
                    <Td>{formatMoney(toNumber(invoice.total))}</Td>
                    <Td>
                      {invoice.payments[0]
                        ? `${formatMoney(toNumber(invoice.payments[0].amount))} (${invoice.payments[0].status})`
                        : "-"}
                    </Td>
                    <Td>{invoice.createdAt.toLocaleDateString()}</Td>
                  </tr>
                );
              })}
              {recentInvoices.length === 0 ? (
                <tr>
                  <Td colSpan={5} className="text-muted">
                    No invoices yet.
                  </Td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </TableWrap>
      </Card>

      <div className="d-flex flex-wrap gap-2">
        <Link href="/app/admin/payments/invoices" className="btn btn-secondary">
          Invoices
        </Link>
        <Link href="/app/admin/payments/transactions" className="btn btn-secondary">
          Transactions
        </Link>
        <Link href="/app/admin/payments/reconciliation" className="btn btn-brown">
          Reconciliation
        </Link>
        <Link href="/app/admin/payments/settings" className="btn btn-primary">
          Payment Settings
        </Link>
      </div>
    </Section>
  );
}
