import Link from "next/link";
import { createParentInvoiceAction } from "@/lib/server/payment-actions";
import { getParentInvoiceDraft } from "@/lib/server/payments/queries";
import { prisma } from "@/lib/server/prisma";

type PayPageSearchParams = {
  ids?: string;
  payerEmail?: string;
};

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

export default async function PayPage({ searchParams }: { searchParams: Promise<PayPageSearchParams> }) {
  const paymentClient = prisma as unknown as {
    invoice?: typeof prisma.invoice;
    payment?: typeof prisma.payment;
    feeSchedule?: typeof prisma.feeSchedule;
    feeItemCatalog?: typeof prisma.feeItemCatalog;
  };

  if (!paymentClient.invoice || !paymentClient.payment || !paymentClient.feeSchedule || !paymentClient.feeItemCatalog) {
    return (
      <main className="container py-8">
        <section className="section-panel space-y-2">
          <p className="section-kicker">SchoolPay</p>
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
  const rawIds = (params.ids ?? "").trim();
  const payerEmail = (params.payerEmail ?? "").trim();
  const draft = rawIds ? await getParentInvoiceDraft(rawIds) : null;
  const compulsoryByStudent = new Map<string, NonNullable<typeof draft>["compulsoryLines"]>();

  if (draft) {
    for (const student of draft.students) {
      compulsoryByStudent.set(student.id, draft.compulsoryLines.filter((line) => line.student.id === student.id));
    }
  }

  const subtotal = draft
    ? draft.compulsoryLines.reduce((sum, line) => sum + line.outstanding, 0)
    : 0;
  const processingFee = draft ? (subtotal * draft.school.processingFeePercent) / 100 : 0;
  const maxTotal = subtotal + processingFee;

  return (
    <main className="container py-8">
      <section className="section-panel space-y-4">
        <div>
          <p className="section-kicker">SchoolPay</p>
          <h1 className="section-title">Pay School Fees</h1>
          <p className="section-subtle">Enter one or more Student Payment IDs to generate invoice lines and continue to checkout.</p>
        </div>

        <form method="get" className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <label className="space-y-1 md:col-span-2">
            <span className="field-label">Student Payment ID(s)</span>
            <textarea
              className="input min-h-24"
              name="ids"
              defaultValue={rawIds}
              placeholder="SCH-123-ADM001, SCH-123-ADM002"
              required
            />
          </label>
          <label className="space-y-1">
            <span className="field-label">Payer Email</span>
            <input className="input" type="email" name="payerEmail" defaultValue={payerEmail} required />
          </label>
          <div className="self-end">
            <button className="btn btn-primary" type="submit">
              Load Students
            </button>
          </div>
        </form>

        {!draft && <p className="section-subtle">Enter IDs and email to preview outstanding balances.</p>}
      </section>

      {draft && (
        <>
          <section className="mt-4 section-panel space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="section-heading">Students + Outstanding Compulsory Fees</h2>
                <p className="section-subtle">
                  School: {draft.school.name} • Processing Fee: {draft.school.processingFeePercent}%
                </p>
              </div>
              <Link href="/" className="btn btn-muted">
                Back Home
              </Link>
            </div>

            <div className="space-y-3">
              {draft.students.map((student) => {
                const lines = compulsoryByStudent.get(student.id) ?? [];
                return (
                  <article key={student.id} className="metric-card space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">{student.fullName}</p>
                        <p className="section-subtle text-xs">
                          {student.studentPaymentId} {student.className ? `• ${student.className}` : ""}
                        </p>
                      </div>
                    </div>

                    <ul className="space-y-1 text-sm">
                      {lines.map((line) => (
                        <li key={`${student.id}-${line.catalog.id}`}>
                          {line.catalog.name}: {line.outstanding.toFixed(2)}
                        </li>
                      ))}
                      {lines.length === 0 && <li>No active compulsory schedule for this student.</li>}
                    </ul>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="mt-4 section-panel space-y-3">
            <h2 className="section-heading">Optional Other Payments</h2>
            <p className="section-subtle">Other items must be fully covered if selected.</p>

            <form action={createParentInvoiceAction} className="space-y-4">
              <input type="hidden" name="schoolId" value={draft.school.id} />
              <input type="hidden" name="paymentIds" value={draft.students.map((student) => student.studentPaymentId).join(",")} />
              <input type="hidden" name="payerEmail" value={payerEmail} />

              {draft.students.map((student) => (
                <article key={`other-${student.id}`} className="metric-card space-y-2">
                  <p className="font-semibold">{student.fullName}</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {draft.otherCatalog.map((item) => (
                      <label key={`${student.id}-${item.id}`} className="flex items-center gap-2 rounded-md border border-[var(--line)] p-2 text-sm">
                        <input type="checkbox" name={`other_${student.id}_${item.id}`} />
                        <span className="flex-1">
                          {item.name} ({toNumber(item.amount).toFixed(2)})
                        </span>
                        <input
                          className="input w-20"
                          type="number"
                          min={1}
                          defaultValue={1}
                          name={`other_qty_${student.id}_${item.id}`}
                          disabled={!item.allowQuantity}
                        />
                      </label>
                    ))}
                    {draft.otherCatalog.length === 0 && <p className="section-subtle">No optional items configured.</p>}
                  </div>
                </article>
              ))}

              <div className="grid gap-2 md:grid-cols-3">
                <article className="metric-card">
                  <p className="metric-label">Current Compulsory Subtotal</p>
                  <p className="metric-value">{subtotal.toFixed(2)}</p>
                </article>
                <article className="metric-card">
                  <p className="metric-label">Processing Fee</p>
                  <p className="metric-value">{processingFee.toFixed(2)}</p>
                </article>
                <article className="metric-card">
                  <p className="metric-label">Compulsory+Fee Total</p>
                  <p className="metric-value">{maxTotal.toFixed(2)}</p>
                </article>
              </div>

              <label className="space-y-1">
                <span className="field-label">Amount To Pay Now</span>
                <input
                  className="input"
                  name="amountToPay"
                  type="number"
                  min={1}
                  step="0.01"
                  defaultValue={maxTotal.toFixed(2)}
                  required
                />
              </label>

              <button className="btn btn-primary" type="submit">
                Create Invoice and Continue
              </button>
            </form>
          </section>
        </>
      )}
    </main>
  );
}
