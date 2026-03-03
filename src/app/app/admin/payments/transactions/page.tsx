import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

export default async function PaymentsTransactionsPage() {
  const profile = await requireRole("admin");
  const paymentClient = prisma as unknown as { payment?: typeof prisma.payment };

  if (!paymentClient.payment) {
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
    <section className="section-panel table-wrap space-y-3">
      <div>
        <p className="section-kicker">Payments</p>
        <h1 className="section-title">Transactions</h1>
        <p className="section-subtle">All payment attempts and statuses for reconciliation.</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Invoice</th>
            <th>Provider Ref</th>
            <th>Method</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>{payment.createdAt.toLocaleString()}</td>
              <td>
                {payment.invoice.invoiceNo}
                <div className="section-subtle text-xs">{payment.invoice.payerEmail ?? "-"}</div>
              </td>
              <td>{payment.providerRef}</td>
              <td>{payment.method}</td>
              <td>{toNumber(payment.amount).toFixed(2)}</td>
              <td>{payment.status}</td>
            </tr>
          ))}
          {payments.length === 0 && (
            <tr>
              <td colSpan={6}>No transactions yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
