import Link from "next/link";
import Card from "@/components/admin/Card";
import Button from "@/components/admin/ui/Button";
import Input from "@/components/admin/ui/Input";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";
import {
  importCompulsoryFeesCsvAction,
  importOtherFeesCsvAction,
  importStudentsCsvAction,
} from "@/lib/server/payment-actions";
import { requireRole } from "@/lib/server/auth";

export default async function PaymentsImportsPage() {
  await requireRole("admin");

  return (
    <Section>
      <PageHeader title="CSV Imports" subtitle="Upload bulk data and use templates to match expected columns." />

      <Card title="Templates">
        <div className="grid gap-2 md:grid-cols-3">
          <Link href="/api/payments/templates/students" className="btn btn-secondary">
            Download Students Template
          </Link>
          <Link
            href="/api/payments/templates/compulsory-fees"
            className="btn btn-secondary"
          >
            Download Compulsory Fees Template
          </Link>
          <Link href="/api/payments/templates/other-fees" className="btn btn-brown">
            Download Other Fees Template
          </Link>
        </div>
      </Card>

      <Card title="Import Students CSV">
        <form action={importStudentsCsvAction} className="grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="d-grid gap-1">
            <span className="field-label">Students CSV</span>
            <Input type="file" name="file" accept=".csv" required />
          </label>
          <div className="align-self-end">
            <Button variant="primary" type="submit">
              Import Students
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Import Compulsory Fees CSV">
        <form action={importCompulsoryFeesCsvAction} className="grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="d-grid gap-1">
            <span className="field-label">Compulsory Fees CSV</span>
            <Input type="file" name="file" accept=".csv" required />
          </label>
          <div className="align-self-end">
            <Button variant="primary" type="submit">
              Import Compulsory Fees
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Import Other Fees CSV">
        <form action={importOtherFeesCsvAction} className="grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="d-grid gap-1">
            <span className="field-label">Other Fees CSV</span>
            <Input type="file" name="file" accept=".csv" required />
          </label>
          <div className="align-self-end">
            <Button variant="primary" type="submit">
              Import Other Fees
            </Button>
          </div>
        </form>
      </Card>
    </Section>
  );
}
