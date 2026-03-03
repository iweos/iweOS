import Link from "next/link";
import { prisma } from "@/lib/server/prisma";

type SuccessSearchParams = {
  invoice?: string;
};

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

export default async function PaymentSuccessPage({ searchParams }: { searchParams: Promise<SuccessSearchParams> }) {
  const paymentClient = prisma as unknown as { invoice?: typeof prisma.invoice };
  if (!paymentClient.invoice) {
    return (
      <main className="container py-8">
        <section className="section-panel space-y-2">
          <p className="section-kicker">Receipt</p>
          <h1 className="section-title">Setup Required</h1>
          <p className="section-subtle">
            Payments is not fully initialized yet. Run <code>npm run prisma:generate && npm run prisma:migrate</code>,
            then restart <code>npm run dev</code>.
          </p>
        </section>
      </main>
    );
  }

  const params = await searchParams;
  const invoiceId = params.invoice;

  const invoice = invoiceId
    ? await paymentClient.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          lineItems: {
            orderBy: [{ mustPayFull: "desc" }, { allocationOrder: "asc" }, { name: "asc" }],
          },
          school: true,
          payments: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      })
    : null;

  if (!invoice) {
    return (
      <main className="container py-8">
        <section className="section-panel">
          <h1 className="section-title">Receipt not found</h1>
          <p className="section-subtle">The payment might still be processing.</p>
        </section>
      </main>
    );
  }

  const paid = invoice.lineItems.reduce((sum, item) => sum + toNumber(item.paidAmount), 0);

  return (
    <main className="container py-8">
      <section className="section-panel space-y-3">
        <div>
          <p className="section-kicker">Receipt</p>
          <h1 className="section-title">Payment Successful</h1>
          <p className="section-subtle">
            {invoice.school.name} • {invoice.invoiceNo}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <article className="metric-card">
            <p className="metric-label">Invoice Total</p>
            <p className="metric-value">{toNumber(invoice.total).toFixed(2)}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Applied to Fees</p>
            <p className="metric-value">{paid.toFixed(2)}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Processing Fee</p>
            <p className="metric-value">{toNumber(invoice.processingFee).toFixed(2)}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Status</p>
            <p className="metric-value text-base">{invoice.status}</p>
          </article>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Line Total</th>
                <th>Paid</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((line) => (
                <tr key={line.id}>
                  <td>{line.name}</td>
                  <td>{toNumber(line.lineTotal).toFixed(2)}</td>
                  <td>{toNumber(line.paidAmount).toFixed(2)}</td>
                  <td>{toNumber(line.remainingAmount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="section-subtle">Receipt email/PDF dispatch is stubbed for this build and can be connected to your preferred provider.</p>

        <div className="flex flex-wrap gap-2">
          <Link href="/pay" className="btn btn-primary">
            Make Another Payment
          </Link>
          <Link href={`/pay/checkout/${invoice.payments[0]?.id ?? ""}`} className="btn btn-muted">
            Back to Checkout
          </Link>
        </div>
      </section>
    </main>
  );
}
