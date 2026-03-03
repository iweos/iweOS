import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

export default async function PaymentsInvoicesPage() {
  const profile = await requireRole("admin");
  const paymentClient = prisma as unknown as { invoice?: typeof prisma.invoice };

  if (!paymentClient.invoice) {
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
    <section className="section-panel table-wrap space-y-3">
      <div>
        <p className="section-kicker">Payments</p>
        <h1 className="section-title">Invoices</h1>
        <p className="section-subtle">Invoice header with line-by-line balances and payment attempts.</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Status</th>
            <th>Payer</th>
            <th>Totals</th>
            <th>Items</th>
            <th>Payments</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>
                <div>{invoice.invoiceNo}</div>
                <div className="section-subtle text-xs">{invoice.createdAt.toLocaleString()}</div>
              </td>
              <td>{invoice.status}</td>
              <td>{invoice.payerEmail ?? "-"}</td>
              <td>
                <div>Subtotal: {toNumber(invoice.subtotal).toFixed(2)}</div>
                <div>Fee: {toNumber(invoice.processingFee).toFixed(2)}</div>
                <div>Total: {toNumber(invoice.total).toFixed(2)}</div>
              </td>
              <td>
                <ul className="space-y-1 text-sm">
                  {invoice.lineItems.map((line) => (
                    <li key={line.id}>
                      {line.name} ({line.feeType}) - {toNumber(line.paidAmount).toFixed(2)} / {toNumber(line.lineTotal).toFixed(2)}
                    </li>
                  ))}
                </ul>
              </td>
              <td>
                <ul className="space-y-1 text-sm">
                  {invoice.payments.map((payment) => (
                    <li key={payment.id}>
                      {payment.provider.toUpperCase()} {toNumber(payment.amount).toFixed(2)} ({payment.status})
                    </li>
                  ))}
                  {invoice.payments.length === 0 && <li>-</li>}
                </ul>
              </td>
            </tr>
          ))}
          {invoices.length === 0 && (
            <tr>
              <td colSpan={6}>No invoices yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
