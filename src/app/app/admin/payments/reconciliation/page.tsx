import { InvoiceStatus } from "@prisma/client";
import Badge from "@/components/admin/ui/Badge";
import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { isPrismaSchemaMismatchError, schemaSyncMessage } from "@/lib/server/prisma-errors";

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function PaymentsReconciliationPage() {
  const profile = await requireRole("admin");
  const paymentClient = prisma as unknown as {
    invoiceLineItem?: typeof prisma.invoiceLineItem;
    invoice?: typeof prisma.invoice;
  };

  if (!paymentClient.invoiceLineItem || !paymentClient.invoice) {
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

  let students: Array<{ id: string; fullName: string; studentPaymentId: string; className: string | null }> = [];

  try {
    students = await prisma.student.findMany({
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
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return (
        <Section>
          <PageHeader title="Reconciliation Setup Required" subtitle="Student schema is out of sync for this environment." />
          <Card>
            <p className="small text-muted">{schemaSyncMessage("Student")}</p>
          </Card>
        </Section>
      );
    }
    throw error;
  }

  const studentMap = new Map(students.map((student) => [student.id, student]));

  return (
    <Section>
      <PageHeader
        title="Reconciliation"
        subtitle="Track remaining balances and open invoice items by student."
      />

      <Card title="Outstanding by Student">
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Payment ID</Th>
                <Th>Class</Th>
                <Th>Outstanding</Th>
              </tr>
            </thead>
            <tbody>
              {outstandingByStudent.map((row) => {
                const student = studentMap.get(row.studentId);
                return (
                  <tr key={row.studentId}>
                    <Td>{student?.fullName ?? "Unknown"}</Td>
                    <Td>{student?.studentPaymentId ?? "-"}</Td>
                    <Td>{student?.className ?? "-"}</Td>
                    <Td>{formatMoney(toNumber(row._sum.remainingAmount))}</Td>
                  </tr>
                );
              })}
              {outstandingByStudent.length === 0 ? (
                <tr>
                  <Td colSpan={4} className="text-muted">
                    No outstanding balances.
                  </Td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </TableWrap>
      </Card>

      <Card title="Open Invoices">
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Invoice</Th>
                <Th>Status</Th>
                <Th>Unpaid Items</Th>
              </tr>
            </thead>
            <tbody>
              {openInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <Td>{invoice.invoiceNo}</Td>
                  <Td>
                    <Badge tone={invoice.status === "PART_PAID" ? "warning" : "neutral"}>{invoice.status}</Badge>
                  </Td>
                  <Td>
                    <ul className="d-grid gap-1 small">
                      {invoice.lineItems.map((line) => (
                        <li key={line.id}>
                          {line.student.studentPaymentId} - {line.name}: {formatMoney(toNumber(line.remainingAmount))}
                        </li>
                      ))}
                    </ul>
                  </Td>
                </tr>
              ))}
              {openInvoices.length === 0 ? (
                <tr>
                  <Td colSpan={3} className="text-muted">
                    No open invoices.
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
