import Link from "next/link";
import { PaymentStatus } from "@prisma/client";
import { completeMockPaymentAction } from "@/lib/server/payment-actions";
import { prisma } from "@/lib/server/prisma";

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

export default async function MockCheckoutPage({ params }: { params: Promise<{ paymentId: string }> }) {
  const paymentClient = prisma as unknown as { payment?: typeof prisma.payment };
  if (!paymentClient.payment) {
    return (
      <main className="container py-8">
        <section className="section-panel space-y-2">
          <p className="section-kicker">MockPay Checkout</p>
          <h1 className="section-title">Setup Required</h1>
          <p className="section-subtle">
            Payments is not fully initialized yet. Run <code>npm run prisma:generate && npm run prisma:migrate</code>,
            then restart <code>npm run dev</code>.
          </p>
        </section>
      </main>
    );
  }

  const { paymentId } = await params;

  const payment = await paymentClient.payment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: {
        include: {
          lineItems: {
            orderBy: [{ mustPayFull: "desc" }, { allocationOrder: "asc" }, { name: "asc" }],
          },
          school: true,
        },
      },
    },
  });

  if (!payment) {
    return (
      <main className="container py-8">
        <section className="section-panel">
          <h1 className="section-title">Payment not found</h1>
          <p className="section-subtle">The checkout session is missing or expired.</p>
        </section>
      </main>
    );
  }

  const invoice = payment.invoice;

  return (
    <main className="container py-8">
      <section className="section-panel space-y-4">
        <div>
          <p className="section-kicker">MockPay Checkout</p>
          <h1 className="section-title">{invoice.school.name}</h1>
          <p className="section-subtle">Invoice {invoice.invoiceNo}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <article className="metric-card">
            <p className="metric-label">Invoice Total</p>
            <p className="metric-value">{toNumber(invoice.total).toFixed(2)}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Payment Amount</p>
            <p className="metric-value">{toNumber(payment.amount).toFixed(2)}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Status</p>
            <p className="metric-value text-base">{payment.status}</p>
          </article>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Type</th>
                <th>Line Total</th>
                <th>Paid</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((line) => (
                <tr key={line.id}>
                  <td>{line.name}</td>
                  <td>{line.feeType}</td>
                  <td>{toNumber(line.lineTotal).toFixed(2)}</td>
                  <td>{toNumber(line.paidAmount).toFixed(2)}</td>
                  <td>{toNumber(line.remainingAmount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {payment.status === PaymentStatus.SUCCESS ? (
          <Link className="btn btn-primary" href={`/pay/success?invoice=${invoice.id}`}>
            View Receipt
          </Link>
        ) : (
          <form action={completeMockPaymentAction} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="paymentId" value={payment.id} />
            <label className="space-y-1">
              <span className="field-label">Method</span>
              <select name="method" className="select" defaultValue="card">
                <option value="card">Card</option>
                <option value="transfer">Transfer</option>
                <option value="bank">Bank</option>
              </select>
            </label>
            <button className="btn btn-primary" type="submit">
              Complete Payment (Mock)
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
