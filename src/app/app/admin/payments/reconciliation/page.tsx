import { InvoiceStatus } from "@prisma/client";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

export default async function PaymentsReconciliationPage() {
  const profile = await requireRole("admin");
  const paymentClient = prisma as unknown as {
    invoiceLineItem?: typeof prisma.invoiceLineItem;
    invoice?: typeof prisma.invoice;
  };

  if (!paymentClient.invoiceLineItem || !paymentClient.invoice) {
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

  const [outstandingByStudent, openInvoices] = await Promise.all([
    paymentClient.invoiceLineItem.groupBy({
      by: ["studentId"],
      where: {
        schoolId: profile.schoolId,
        remainingAmount: { gt: 0 },
        invoice: {
          status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PART_PAID] },
        },
      },
      _sum: {
        remainingAmount: true,
      },
    }),
    paymentClient.invoice.findMany({
      where: {
        schoolId: profile.schoolId,
        status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PART_PAID] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        lineItems: {
          where: { remainingAmount: { gt: 0 } },
          select: {
            id: true,
            name: true,
            remainingAmount: true,
            student: {
              select: {
                fullName: true,
                studentPaymentId: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const students = await prisma.student.findMany({
    where: {
      schoolId: profile.schoolId,
      id: { in: outstandingByStudent.map((row) => row.studentId) },
    },
    select: {
      id: true,
      fullName: true,
      studentPaymentId: true,
      className: true,
    },
  });

  const studentMap = new Map(students.map((student) => [student.id, student]));

  return (
    <>
      <section className="section-panel table-wrap space-y-3">
        <div>
          <p className="section-kicker">Payments</p>
          <h1 className="section-title">Reconciliation</h1>
          <p className="section-subtle">Track remaining balances and open invoice items by student.</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Payment ID</th>
              <th>Class</th>
              <th>Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {outstandingByStudent.map((row) => {
              const student = studentMap.get(row.studentId);
              return (
                <tr key={row.studentId}>
                  <td>{student?.fullName ?? "Unknown"}</td>
                  <td>{student?.studentPaymentId ?? "-"}</td>
                  <td>{student?.className ?? "-"}</td>
                  <td>{toNumber(row._sum.remainingAmount).toFixed(2)}</td>
                </tr>
              );
            })}
            {outstandingByStudent.length === 0 && (
              <tr>
                <td colSpan={4}>No outstanding balances.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="section-panel table-wrap space-y-2">
        <h2 className="section-heading">Open Invoices</h2>
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Status</th>
              <th>Unpaid Items</th>
            </tr>
          </thead>
          <tbody>
            {openInvoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.invoiceNo}</td>
                <td>{invoice.status}</td>
                <td>
                  <ul className="space-y-1 text-sm">
                    {invoice.lineItems.map((line) => (
                      <li key={line.id}>
                        {line.student.studentPaymentId} - {line.name}: {toNumber(line.remainingAmount).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
            {openInvoices.length === 0 && (
              <tr>
                <td colSpan={3}>No open invoices.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
