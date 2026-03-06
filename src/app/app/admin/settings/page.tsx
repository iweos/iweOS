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
    <section className="card card-body d-grid gap-3">
      <div>
        <p className="section-kicker">Settings</p>
        <h1 className="section-title">School Profile</h1>
        <p className="section-subtle">Update school identity, location, and contact information.</p>
      </div>

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
    </section>
  );
}
