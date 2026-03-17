import Link from "next/link";
import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";
import { requireRole } from "@/lib/server/auth";
import { updateSchoolAction } from "@/lib/server/admin-actions";
import { prisma } from "@/lib/server/prisma";

export default async function AdminSettingsPage() {
  const profile = await requireRole("admin");

  const school = await prisma.school.findUnique({ where: { id: profile.schoolId } });
  if (!school) {
    throw new Error("School not found.");
  }

  return (
    <Section>
      <PageHeader title="Settings" subtitle="Manage school identity and academic policies from one place." />

      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <Card title="School Profile" subtitle="Update school identity, location, and contact information.">
          <form action={updateSchoolAction} className="grid gap-3 md:grid-cols-2">
            <label className="d-grid gap-1">
              <span className="field-label">School Name</span>
              <input name="name" defaultValue={school.name} className="form-control" required />
            </label>
            <label className="d-grid gap-1">
              <span className="field-label">School Code (Payment ID Prefix)</span>
              <input name="code" defaultValue={school.code} className="form-control" required />
            </label>
            <label className="d-grid gap-1">
              <span className="field-label">Country</span>
              <input name="country" defaultValue={school.country ?? ""} className="form-control" />
            </label>
            <label className="d-grid gap-1">
              <span className="field-label">Logo URL</span>
              <input name="logoUrl" defaultValue={school.logoUrl ?? ""} className="form-control" placeholder="https://..." />
            </label>

            <label className="d-grid gap-1 md:col-span-2">
              <span className="field-label">Address Line 1</span>
              <input name="addressLine1" defaultValue={school.addressLine1 ?? ""} className="form-control" />
            </label>
            <label className="d-grid gap-1 md:col-span-2">
              <span className="field-label">Address Line 2</span>
              <input name="addressLine2" defaultValue={school.addressLine2 ?? ""} className="form-control" />
            </label>

            <label className="d-grid gap-1">
              <span className="field-label">City</span>
              <input name="city" defaultValue={school.city ?? ""} className="form-control" />
            </label>
            <label className="d-grid gap-1">
              <span className="field-label">State / Region</span>
              <input name="state" defaultValue={school.state ?? ""} className="form-control" />
            </label>

            <label className="d-grid gap-1">
              <span className="field-label">Postal Code</span>
              <input name="postalCode" defaultValue={school.postalCode ?? ""} className="form-control" />
            </label>
            <label className="d-grid gap-1">
              <span className="field-label">Phone</span>
              <input name="phone" defaultValue={school.phone ?? ""} className="form-control" />
            </label>

            <label className="d-grid gap-1 md:col-span-2">
              <span className="field-label">Website</span>
              <input name="website" defaultValue={school.website ?? ""} className="form-control" placeholder="https://school.edu" />
            </label>

            <div className="md:col-span-2">
              <button className="btn btn-primary" type="submit">
                Save Settings
              </button>
            </div>
          </form>
        </Card>

        <Card title="Academic Policies" subtitle="Manage reusable rules that affect academic workflows.">
          <div className="d-grid gap-3">
            <div className="rounded border bg-white px-3 py-3">
              <h3 className="h6 fw-bold mb-2">Promotion Rules</h3>
              <p className="small text-muted mb-3">
                Define pass-count, compulsory-subject, and high-grade requirements before promotion runs.
              </p>
              <Link href="/app/admin/settings/promotion-rules" className="btn btn-primary">
                Open Promotion Rules
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </Section>
  );
}
