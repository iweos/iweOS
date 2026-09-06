import Link from "next/link";
import AdminFlashNotice from "@/components/admin/AdminFlashNotice";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";
import { requireRole } from "@/lib/server/auth";
import { updateSchoolAction } from "@/lib/server/admin-actions";
import { prisma } from "@/lib/server/prisma";

type SettingsSearchParams = {
  tab?: string;
  status?: string;
  message?: string;
};

const settingTabs = [
  {
    id: "school",
    label: "General",
    description: "School identity and contact details",
    icon: "fas fa-school",
  },
  {
    id: "results",
    label: "Results",
    description: "Report template and publishing rules",
    icon: "fas fa-file-alt",
  },
  {
    id: "branding",
    label: "Brand Assets",
    description: "School logo and principal signature",
    icon: "fas fa-palette",
  },
  {
    id: "policies",
    label: "Academic Policies",
    description: "Promotion and grading controls",
    icon: "fas fa-sliders-h",
  },
] as const;

type SettingTabId = (typeof settingTabs)[number]["id"];

function isSettingTab(value: string | undefined): value is SettingTabId {
  return settingTabs.some((tab) => tab.id === value);
}

function PreservedSettingsFields({
  resultTemplate,
  showOverallPosition,
  defaultPrincipalComment,
  logoUrl,
  principalSignatureUrl,
}: {
  resultTemplate: string;
  showOverallPosition: boolean;
  defaultPrincipalComment: string;
  logoUrl: string;
  principalSignatureUrl: string;
}) {
  return (
    <>
      <input type="hidden" name="resultTemplate" value={resultTemplate} />
      <input type="hidden" name="showOverallPosition" value={showOverallPosition ? "on" : ""} />
      <input type="hidden" name="defaultPrincipalComment" value={defaultPrincipalComment} />
      <input type="hidden" name="currentLogoUrl" value={logoUrl} />
      <input type="hidden" name="currentPrincipalSignatureUrl" value={principalSignatureUrl} />
    </>
  );
}

function SettingsSaveBar({ label, note }: { label: string; note: string }) {
  return (
    <footer className="settings-save-bar">
      <span><i className="fas fa-shield-alt" aria-hidden="true" />{note}</span>
      <button className="btn btn-primary" type="submit">
        <i className="fas fa-check" aria-hidden="true" />
        {label}
      </button>
    </footer>
  );
}

function AssetPreview({
  src,
  alt,
  empty,
  signature = false,
}: {
  src: string | null;
  alt: string;
  empty: string;
  signature?: boolean;
}) {
  return (
    <div className={`settings-asset-preview ${signature ? "is-signature" : ""}`}>
      {src ? (
        <img src={src} alt={alt} />
      ) : (
        <div>
          <i className={signature ? "fas fa-signature" : "fas fa-image"} aria-hidden="true" />
          <span>{empty}</span>
        </div>
      )}
    </div>
  );
}

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

  const activeTab: SettingTabId = isSettingTab(params.tab) ? params.tab : "school";
  const status = params.status === "success" || params.status === "error" ? params.status : null;
  const message = (params.message ?? "").trim();
  const resultTemplate = gradingSettings?.resultTemplate ?? "classic_report";
  const showOverallPosition = gradingSettings?.showOverallPosition ?? true;
  const defaultPrincipalComment = gradingSettings?.defaultPrincipalComment ?? "";
  const logoUrl = school.logoUrl ?? "";
  const principalSignatureUrl = school.principalSignatureUrl ?? "";
  const logoInputValue = logoUrl.startsWith("data:image/") ? "" : logoUrl;
  const principalSignatureInputValue = principalSignatureUrl.startsWith("data:image/") ? "" : principalSignatureUrl;

  return (
    <Section className="settings-page">
      {status && message ? <AdminFlashNotice status={status} message={message} /> : null}
      <PageHeader
        title="Settings"
        subtitle="Configure the school once, then keep every portal, result, and policy consistent."
      />

      <div className="settings-workspace">
        <aside className="settings-navigation" aria-label="School settings">
          <div className="settings-navigation-heading">
            <span><i className="fas fa-cog" aria-hidden="true" /></span>
            <div>
              <strong>School Settings</strong>
              <small>{school.name}</small>
            </div>
          </div>
          <nav>
            {settingTabs.map((tab) => (
              <Link
                key={tab.id}
                href={`/app/admin/settings?tab=${tab.id}`}
                className={activeTab === tab.id ? "is-active" : ""}
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                <span><i className={tab.icon} aria-hidden="true" /></span>
                <div>
                  <strong>{tab.label}</strong>
                  <small>{tab.description}</small>
                </div>
                <i className="fas fa-chevron-right" aria-hidden="true" />
              </Link>
            ))}
          </nav>
          <div className="settings-navigation-note">
            <i className="fas fa-info-circle" aria-hidden="true" />
            <p>Settings are available to school administrators only.</p>
          </div>
        </aside>

        <main className="settings-content">
          {activeTab === "school" ? (
            <form action={updateSchoolAction} className="settings-form">
              <input type="hidden" name="settingsTab" value="school" />
              <PreservedSettingsFields
                resultTemplate={resultTemplate}
                showOverallPosition={showOverallPosition}
                defaultPrincipalComment={defaultPrincipalComment}
                logoUrl={logoUrl}
                principalSignatureUrl={principalSignatureUrl}
              />

              <header className="settings-content-header">
                <div>
                  <p>General</p>
                  <h2>School profile</h2>
                  <span>Core information used across portals, documents, and payments.</span>
                </div>
                <span className="settings-completion-badge">
                  <i className="fas fa-building" aria-hidden="true" />
                  Identity
                </span>
              </header>

              <section className="settings-section">
                <div className="settings-section-intro">
                  <span><i className="fas fa-id-card" aria-hidden="true" /></span>
                  <div><h3>School identity</h3><p>The name and code staff use to recognise this workspace.</p></div>
                </div>
                <div className="settings-fields two-columns">
                  <label>
                    <span className="field-label">School name</span>
                    <input name="name" defaultValue={school.name} className="form-control" required />
                  </label>
                  <label>
                    <span className="field-label">School code</span>
                    <input name="code" defaultValue={school.code} className="form-control" required />
                    <small>Used as the payment ID prefix and must be unique.</small>
                  </label>
                  <label>
                    <span className="field-label">Country</span>
                    <input name="country" defaultValue={school.country ?? ""} className="form-control" />
                  </label>
                  <label>
                    <span className="field-label">Website</span>
                    <input name="website" defaultValue={school.website ?? ""} className="form-control" placeholder="https://school.edu" />
                  </label>
                </div>
              </section>

              <section className="settings-section">
                <div className="settings-section-intro">
                  <span><i className="fas fa-map-marker-alt" aria-hidden="true" /></span>
                  <div><h3>Address & contact</h3><p>Public contact information used on reports and school communication.</p></div>
                </div>
                <div className="settings-fields two-columns">
                  <label className="full-column">
                    <span className="field-label">Address line 1</span>
                    <input name="addressLine1" defaultValue={school.addressLine1 ?? ""} className="form-control" />
                  </label>
                  <label className="full-column">
                    <span className="field-label">Address line 2</span>
                    <input name="addressLine2" defaultValue={school.addressLine2 ?? ""} className="form-control" />
                  </label>
                  <label>
                    <span className="field-label">City</span>
                    <input name="city" defaultValue={school.city ?? ""} className="form-control" />
                  </label>
                  <label>
                    <span className="field-label">State / region</span>
                    <input name="state" defaultValue={school.state ?? ""} className="form-control" />
                  </label>
                  <label>
                    <span className="field-label">Postal code</span>
                    <input name="postalCode" defaultValue={school.postalCode ?? ""} className="form-control" />
                  </label>
                  <label>
                    <span className="field-label">Phone</span>
                    <input name="phone" defaultValue={school.phone ?? ""} className="form-control" />
                  </label>
                </div>
              </section>

              <SettingsSaveBar label="Save general settings" note="Changes update the school workspace immediately." />
            </form>
          ) : null}

          {activeTab === "results" ? (
            <form action={updateSchoolAction} className="settings-form">
              <input type="hidden" name="settingsTab" value="results" />
              <input type="hidden" name="currentLogoUrl" value={logoUrl} />
              <input type="hidden" name="currentPrincipalSignatureUrl" value={principalSignatureUrl} />

              <header className="settings-content-header">
                <div>
                  <p>Results</p>
                  <h2>Report configuration</h2>
                  <span>Control the report structure, ranking visibility, and default principal message.</span>
                </div>
                <span className="settings-completion-badge">
                  <i className="fas fa-file-alt" aria-hidden="true" />
                  Reports
                </span>
              </header>

              <section className="settings-section">
                <div className="settings-section-intro">
                  <span><i className="fas fa-file-invoice" aria-hidden="true" /></span>
                  <div><h3>Result format</h3><p>Choose the layout used by previews, exports, shared links, and PDFs.</p></div>
                </div>
                <div className="settings-choice-grid">
                  <label className={resultTemplate === "classic_report" ? "is-selected" : ""}>
                    <input type="radio" name="resultTemplate" value="classic_report" defaultChecked={resultTemplate === "classic_report"} />
                    <span><i className="fas fa-table" aria-hidden="true" /></span>
                    <div><strong>Classic report card</strong><small>Full academic report, conduct, attendance, chart, and comments.</small></div>
                  </label>
                  <label className={resultTemplate === "summary" ? "is-selected" : ""}>
                    <input type="radio" name="resultTemplate" value="summary" defaultChecked={resultTemplate === "summary"} />
                    <span><i className="fas fa-list-alt" aria-hidden="true" /></span>
                    <div><strong>Simple summary</strong><small>A lighter result sheet focused on scores and overall performance.</small></div>
                  </label>
                </div>
              </section>

              <section className="settings-section">
                <div className="settings-section-intro">
                  <span><i className="fas fa-trophy" aria-hidden="true" /></span>
                  <div><h3>Ranking visibility</h3><p>Choose whether overall class position appears on generated results.</p></div>
                </div>
                <label className="settings-switch-row">
                  <div>
                    <strong>Show overall class position</strong>
                    <small>Applies to result pages, shared links, exported student PDFs, and bulk exports.</small>
                  </div>
                  <input name="showOverallPosition" type="checkbox" value="on" defaultChecked={showOverallPosition} />
                  <span aria-hidden="true" />
                </label>
              </section>

              <section className="settings-section">
                <div className="settings-section-intro">
                  <span><i className="fas fa-comment-alt" aria-hidden="true" /></span>
                  <div><h3>Default principal comment</h3><p>Used when no result-specific principal comment has been entered.</p></div>
                </div>
                <div className="settings-fields">
                  <label>
                    <span className="field-label">Principal comment</span>
                    <textarea
                      name="defaultPrincipalComment"
                      defaultValue={defaultPrincipalComment}
                      className="form-control"
                      rows={5}
                      placeholder="Enter the default comment shown on result sheets."
                    />
                    <small>{defaultPrincipalComment.trim() ? "A default comment is currently saved." : "No default comment has been saved yet."}</small>
                  </label>
                </div>
              </section>

              <SettingsSaveBar label="Save result settings" note="Saved settings apply to newly generated and shared results." />
            </form>
          ) : null}

          {activeTab === "branding" ? (
            <form action={updateSchoolAction} encType="multipart/form-data" className="settings-form">
              <input type="hidden" name="settingsTab" value="branding" />
              <PreservedSettingsFields
                resultTemplate={resultTemplate}
                showOverallPosition={showOverallPosition}
                defaultPrincipalComment={defaultPrincipalComment}
                logoUrl={logoUrl}
                principalSignatureUrl={principalSignatureUrl}
              />

              <header className="settings-content-header">
                <div>
                  <p>Brand Assets</p>
                  <h2>Logo & signature</h2>
                  <span>Manage the official images used on result sheets and exported PDFs.</span>
                </div>
                <span className="settings-completion-badge">
                  <i className="fas fa-palette" aria-hidden="true" />
                  Branding
                </span>
              </header>

              <section className="settings-asset-grid">
                <article className="settings-asset-card">
                  <div className="settings-section-intro">
                    <span><i className="fas fa-image" aria-hidden="true" /></span>
                    <div><h3>School logo</h3><p>Transparent PNG, JPG, WEBP, HEIC, or another standard image format.</p></div>
                  </div>
                  <AssetPreview src={school.logoUrl} alt={school.name} empty="No school logo uploaded" />
                  <div className="settings-fields">
                    <label>
                      <span className="field-label">Upload replacement</span>
                      <input name="logoFile" type="file" accept="image/*,.heic,.heif" className="form-control" />
                    </label>
                    <details className="settings-advanced-field">
                      <summary>Use an image URL instead</summary>
                      <label>
                        <span className="field-label">Logo URL</span>
                        <input name="logoUrl" defaultValue={logoInputValue} className="form-control" placeholder="https://..." />
                      </label>
                    </details>
                    {school.logoUrl ? (
                      <label className="settings-remove-row">
                        <input name="removeLogo" type="checkbox" value="on" />
                        <span>Remove current logo when saving</span>
                      </label>
                    ) : null}
                  </div>
                </article>

                <article className="settings-asset-card">
                  <div className="settings-section-intro">
                    <span><i className="fas fa-signature" aria-hidden="true" /></span>
                    <div><h3>Principal signature</h3><p>Use a transparent image with minimal empty space around the signature.</p></div>
                  </div>
                  <AssetPreview src={school.principalSignatureUrl} alt="Principal signature" empty="No principal signature uploaded" signature />
                  <div className="settings-fields">
                    <label>
                      <span className="field-label">Upload replacement</span>
                      <input name="principalSignatureFile" type="file" accept="image/*,.heic,.heif" className="form-control" />
                    </label>
                    <details className="settings-advanced-field">
                      <summary>Use an image URL instead</summary>
                      <label>
                        <span className="field-label">Signature URL</span>
                        <input name="principalSignatureUrl" defaultValue={principalSignatureInputValue} className="form-control" placeholder="https://..." />
                      </label>
                    </details>
                    {school.principalSignatureUrl ? (
                      <label className="settings-remove-row">
                        <input name="removePrincipalSignature" type="checkbox" value="on" />
                        <span>Remove current signature when saving</span>
                      </label>
                    ) : null}
                  </div>
                </article>
              </section>

              <div className="settings-inline-note">
                <i className="fas fa-user-graduate" aria-hidden="true" />
                <div>
                  <strong>Student photographs</strong>
                  <span>Student pictures are managed per student from the directory.</span>
                </div>
                <Link href="/app/admin/students/manage">Open students</Link>
              </div>

              <SettingsSaveBar label="Save brand assets" note="Uploads are converted and optimized automatically." />
            </form>
          ) : null}

          {activeTab === "policies" ? (
            <div className="settings-form">
              <header className="settings-content-header">
                <div>
                  <p>Academic Policies</p>
                  <h2>Rules & grading</h2>
                  <span>Open the dedicated workspace for each policy area without mixing it into profile settings.</span>
                </div>
                <span className="settings-completion-badge">
                  <i className="fas fa-sliders-h" aria-hidden="true" />
                  Academic
                </span>
              </header>

              <section className="settings-link-grid">
                <Link href="/app/admin/settings/promotion-rules">
                  <span><i className="fas fa-level-up-alt" aria-hidden="true" /></span>
                  <div><strong>Promotion rules</strong><small>Manage multiple pass, score, and compulsory-subject rules.</small></div>
                  <i className="fas fa-arrow-right" aria-hidden="true" />
                </Link>
                <Link href="/app/admin/grading/grades">
                  <span><i className="fas fa-award" aria-hidden="true" /></span>
                  <div><strong>Grade scale</strong><small>Define score ranges, grade letters, and performance remarks.</small></div>
                  <i className="fas fa-arrow-right" aria-hidden="true" />
                </Link>
                <Link href="/app/admin/grading/assessment-types">
                  <span><i className="fas fa-tasks" aria-hidden="true" /></span>
                  <div><strong>Assessment structure</strong><small>Configure CA, examination, and other weighted score items.</small></div>
                  <i className="fas fa-arrow-right" aria-hidden="true" />
                </Link>
                <Link href="/app/admin/grading/conduct">
                  <span><i className="fas fa-star" aria-hidden="true" /></span>
                  <div><strong>Conduct categories</strong><small>Organise affective and psychomotor ratings used on results.</small></div>
                  <i className="fas fa-arrow-right" aria-hidden="true" />
                </Link>
              </section>
            </div>
          ) : null}
        </main>
      </div>
    </Section>
  );
}
