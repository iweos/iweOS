import Badge from "@/components/admin/ui/Badge";
import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function PaymentsTransactionsPage() {
  const profile = await requireRole("admin");
  const paymentClient = prisma as unknown as { payment?: typeof prisma.payment };

  if (!paymentClient.payment) {
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

  const payments = await paymentClient.payment.findMany({
    where: { schoolId: profile.schoolId },
    orderBy: { createdAt: "desc" },
    include: {
      invoice: {
        select: {
          invoiceNo: true,
          status: true,
          payerEmail: true,
        },
      },
    },
    take: 100,
  });

  return (
    <Section>
      <PageHeader title="Transactions" subtitle="All payment attempts and statuses for reconciliation." />

      <Card>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Time</Th>
                <Th>Invoice</Th>
                <Th>Provider Ref</Th>
                <Th>Method</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const tone =
                  payment.status === "SUCCESS"
                    ? "success"
                    : payment.status === "PENDING"
                      ? "warning"
                      : payment.status === "FAILED"
                        ? "danger"
                        : "neutral";

                return (
                  <tr key={payment.id}>
                    <Td>{payment.createdAt.toLocaleString()}</Td>
                    <Td>
                      <p className="fw-semibold">{payment.invoice.invoiceNo}</p>
                      <p className="small text-muted">{payment.invoice.payerEmail ?? "-"}</p>
                    </Td>
                    <Td>{payment.providerRef}</Td>
                    <Td>{payment.method}</Td>
                    <Td>{formatMoney(toNumber(payment.amount))}</Td>
                    <Td>
                      <Badge tone={tone}>{payment.status}</Badge>
                    </Td>
                  </tr>
                );
              })}
              {payments.length === 0 ? (
                <tr>
                  <Td colSpan={6} className="text-muted">
                    No transactions yet.
                  </Td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </TableWrap>
      </Card>
    </Section>
  );
}
