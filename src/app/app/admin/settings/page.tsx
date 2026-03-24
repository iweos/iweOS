import Link from "next/link";
import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";
import { requireRole } from "@/lib/server/auth";
import { updateSchoolAction } from "@/lib/server/admin-actions";
import { prisma } from "@/lib/server/prisma";

type SettingsSearchParams = {
  tab?: string;
};

const settingTabs = [
  { id: "school", label: "School Profile" },
  { id: "results", label: "Results & Branding" },
  { id: "policies", label: "Academic Policies" },
] as const;

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<SettingsSearchParams>;
}) {
  const profile = await requireRole("admin");
  const params = await searchParams;

  const [school, gradingSettings] = await Promise.all([
    prisma.school.findUnique({ where: { id: profile.schoolId } }),
    prisma.gradingSetting.findUnique({ where: { schoolId: profile.schoolId } }),
  ]);
  if (!school) {
    throw new Error("School not found.");
  }

  const activeTab = settingTabs.some((tab) => tab.id === params.tab) ? params.tab! : "school";
  const logoInputValue = school.logoUrl?.startsWith("data:image/") ? "" : school.logoUrl ?? "";

  return (
    <Section>
      <PageHeader title="Settings" subtitle="Manage school identity, result branding, and academic policies from one place." />

      <Card>
        <div className="border-bottom">
          <nav className="nav nav-tabs card-header-tabs gap-2 px-3 pt-3">
            {settingTabs.map((tab) => (
              <Link
                key={tab.id}
                href={`/app/admin/settings?tab=${tab.id}`}
                className={`nav-link ${activeTab === tab.id ? "active" : ""}`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="card-body">
          {activeTab === "school" ? (
            <form action={updateSchoolAction} encType="multipart/form-data" className="grid gap-3 md:grid-cols-2">
              <input type="hidden" name="resultTemplate" value={gradingSettings?.resultTemplate ?? "classic_report"} />
              <input type="hidden" name="currentLogoUrl" value={school.logoUrl ?? ""} />
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
                <span className="field-label">Upload School Logo</span>
                <input name="logoFile" type="file" accept="image/*" className="form-control" />
              </label>
              <label className="d-grid gap-1">
                <span className="field-label">School Logo URL (Optional)</span>
                <input name="logoUrl" defaultValue={logoInputValue} className="form-control" placeholder="https://... or leave blank if you upload above" />
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
                  Save School Profile
                </button>
              </div>
            </form>
          ) : null}

          {activeTab === "results" ? (
            <div className="grid gap-3 lg:grid-cols-[1.4fr_0.9fr]">
              <Card title="Result Branding" subtitle="Choose the report template and school branding used for exports.">
                <form action={updateSchoolAction} encType="multipart/form-data" className="grid gap-3 md:grid-cols-2">
                  <input type="hidden" name="name" value={school.name} />
                  <input type="hidden" name="code" value={school.code} />
                  <input type="hidden" name="country" value={school.country ?? ""} />
                  <input type="hidden" name="currentLogoUrl" value={school.logoUrl ?? ""} />
                  <input type="hidden" name="addressLine1" value={school.addressLine1 ?? ""} />
                  <input type="hidden" name="addressLine2" value={school.addressLine2 ?? ""} />
                  <input type="hidden" name="city" value={school.city ?? ""} />
                  <input type="hidden" name="state" value={school.state ?? ""} />
                  <input type="hidden" name="postalCode" value={school.postalCode ?? ""} />
                  <input type="hidden" name="phone" value={school.phone ?? ""} />
                  <input type="hidden" name="website" value={school.website ?? ""} />

                  <label className="d-grid gap-1">
                    <span className="field-label">Result Template</span>
                    <select name="resultTemplate" defaultValue={gradingSettings?.resultTemplate ?? "classic_report"} className="form-select">
                      <option value="classic_report">Classic Report Card</option>
                      <option value="summary">Simple Summary Sheet</option>
                    </select>
                  </label>

                  <label className="d-grid gap-1">
                    <span className="field-label">Upload School Logo</span>
                    <input name="logoFile" type="file" accept="image/*" className="form-control" />
                  </label>

                  <label className="d-grid gap-1 md:col-span-2">
                    <span className="field-label">School Logo URL (Optional)</span>
                    <input
                      name="logoUrl"
                      defaultValue={logoInputValue}
                      className="form-control"
                      placeholder="https://... or leave blank if you upload above"
                    />
                  </label>

                  <div className="d-flex align-items-end md:col-span-2">
                    <button className="btn btn-primary" type="submit">
                      Save Result Settings
                    </button>
                  </div>
                </form>
              </Card>

              <Card title="Current Branding" subtitle="These assets appear on result templates that support them.">
                <div className="d-grid gap-3">
                  <div className="rounded border bg-white px-3 py-3">
                    <p className="field-label mb-2">Active Template</p>
                    <p className="mb-0 fw-semibold">
                      {gradingSettings?.resultTemplate === "summary" ? "Simple Summary Sheet" : "Classic Report Card"}
                    </p>
                  </div>
                  <div className="rounded border bg-white px-3 py-3">
                    <p className="field-label mb-2">School Logo</p>
                    {school.logoUrl ? (
                      <img src={school.logoUrl} alt={school.name} className="img-fluid rounded border" style={{ maxHeight: 140, objectFit: "contain" }} />
                    ) : (
                      <p className="small text-muted mb-0">No school logo added yet.</p>
                    )}
                  </div>
                  <div className="rounded border bg-white px-3 py-3">
                    <p className="field-label mb-2">Student Photos</p>
                    <p className="small text-muted mb-0">
                      Student pictures can be added from <Link href="/app/admin/students/manage">Manage Students</Link>.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          ) : null}

          {activeTab === "policies" ? (
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded border bg-white px-3 py-3">
                <h3 className="h6 fw-bold mb-2">Promotion Rules</h3>
                <p className="small text-muted mb-3">
                  Create multiple promotion rules, choose the active rule, and manage compulsory-subject logic in one place.
                </p>
                <Link href="/app/admin/settings/promotion-rules" className="btn btn-primary">
                  Open Promotion Rules
                </Link>
              </div>
              <div className="rounded border bg-white px-3 py-3">
                <h3 className="h6 fw-bold mb-2">Result Templates</h3>
                <p className="small text-muted mb-3">
                  Use the Results & Branding tab to choose the report format used for student exports and shared links.
                </p>
                <Link href="/app/admin/settings?tab=results" className="btn btn-secondary">
                  Open Results Settings
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </Card>
    </Section>
  );
}
