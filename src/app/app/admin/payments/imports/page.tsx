import {
  importCompulsoryFeesCsvAction,
  importOtherFeesCsvAction,
  importStudentsCsvAction,
} from "@/lib/server/payment-actions";
import { requireRole } from "@/lib/server/auth";

export default async function PaymentsImportsPage() {
  await requireRole("admin");

  return (
    <section className="section-panel space-y-4">
      <div>
        <p className="section-kicker">Payments</p>
        <h1 className="section-title">CSV Imports</h1>
        <p className="section-subtle">Upload bulk data and use downloadable templates to match expected columns.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <a className="btn btn-muted" href="/api/payments/templates/students">
          Download Students Template
        </a>
        <a className="btn btn-muted" href="/api/payments/templates/compulsory-fees">
          Download Compulsory Fees Template
        </a>
        <a className="btn btn-muted" href="/api/payments/templates/other-fees">
          Download Other Fees Template
        </a>
      </div>

      <form action={importStudentsCsvAction} className="grid gap-2 md:grid-cols-[1fr_auto]">
        <label className="space-y-1">
          <span className="field-label">Students CSV</span>
          <input className="input" type="file" name="file" accept=".csv" required />
        </label>
        <div className="self-end">
          <button className="btn btn-primary" type="submit">
            Import Students
          </button>
        </div>
      </form>

      <form action={importCompulsoryFeesCsvAction} className="grid gap-2 md:grid-cols-[1fr_auto]">
        <label className="space-y-1">
          <span className="field-label">Compulsory Fees CSV</span>
          <input className="input" type="file" name="file" accept=".csv" required />
        </label>
        <div className="self-end">
          <button className="btn btn-primary" type="submit">
            Import Compulsory Fees
          </button>
        </div>
      </form>

      <form action={importOtherFeesCsvAction} className="grid gap-2 md:grid-cols-[1fr_auto]">
        <label className="space-y-1">
          <span className="field-label">Other Fees CSV</span>
          <input className="input" type="file" name="file" accept=".csv" required />
        </label>
        <div className="self-end">
          <button className="btn btn-primary" type="submit">
            Import Other Fees
          </button>
        </div>
      </form>
    </section>
  );
}
