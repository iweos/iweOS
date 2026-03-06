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

export default async function PaymentsInvoicesPage() {
  const profile = await requireRole("admin");
  const paymentClient = prisma as unknown as { invoice?: typeof prisma.invoice };

  if (!paymentClient.invoice) {
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

  const invoices = await paymentClient.invoice.findMany({
    where: { schoolId: profile.schoolId },
    orderBy: { createdAt: "desc" },
    include: {
      lineItems: {
        orderBy: [{ mustPayFull: "desc" }, { allocationOrder: "asc" }, { name: "asc" }],
      },
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
    take: 50,
  });

  return (
    <Section>
      <PageHeader
        title="Invoices"
        subtitle="Invoice headers with line-by-line balances and payment attempts."
      />

      <Card>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Invoice</Th>
                <Th>Status</Th>
                <Th>Payer</Th>
                <Th>Totals</Th>
                <Th>Items</Th>
                <Th>Payments</Th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
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
                    <Td>
                      <p className="fw-semibold">{invoice.invoiceNo}</p>
                      <p className="small text-muted">{invoice.createdAt.toLocaleString()}</p>
                    </Td>
                    <Td>
                      <Badge tone={tone}>{invoice.status}</Badge>
                    </Td>
                    <Td>{invoice.payerEmail ?? "-"}</Td>
                    <Td>
                      <div className="d-grid gap-1">
                        <p>Subtotal: {formatMoney(toNumber(invoice.subtotal))}</p>
                        <p>Fee: {formatMoney(toNumber(invoice.processingFee))}</p>
                        <p className="fw-semibold">Total: {formatMoney(toNumber(invoice.total))}</p>
                      </div>
                    </Td>
                    <Td>
                      <ul className="d-grid gap-1 small">
                        {invoice.lineItems.map((line) => (
                          <li key={line.id}>
                            {line.name} ({line.feeType}) - {formatMoney(toNumber(line.paidAmount))} /{" "}
                            {formatMoney(toNumber(line.lineTotal))}
                          </li>
                        ))}
                      </ul>
                    </Td>
                    <Td>
                      <ul className="d-grid gap-1 small">
                        {invoice.payments.map((payment) => (
                          <li key={payment.id}>
                            {payment.provider.toUpperCase()} {formatMoney(toNumber(payment.amount))} ({payment.status})
                          </li>
                        ))}
                        {invoice.payments.length === 0 ? <li>-</li> : null}
                      </ul>
                    </Td>
                  </tr>
                );
              })}
              {invoices.length === 0 ? (
                <tr>
                  <Td colSpan={6} className="text-muted">
                    No invoices yet.
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
