import Button from "@/components/admin/ui/Button";
import Card from "@/components/admin/Card";
import Input from "@/components/admin/ui/Input";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";
import Select from "@/components/admin/ui/Select";
import AssessmentTemplateTable from "@/components/grading/AssessmentTemplateTable";
import AssessmentTypeTable from "@/components/grading/AssessmentTypeTable";
import { requireRole } from "@/lib/server/auth";
import {
  assignAssessmentTemplateToTermAction,
  upsertAssessmentTemplateAction,
  upsertAssessmentTypeAction,
} from "@/lib/server/admin-actions";
import { prisma } from "@/lib/server/prisma";
import { isPrismaSchemaMismatchError, schemaSyncMessage } from "@/lib/server/prisma-errors";

type AssessmentTypesSearchParams = {
  templateId?: string;
  termId?: string;
};

export default async function GradingAssessmentTypesPage({
  searchParams,
}: {
  searchParams: Promise<AssessmentTypesSearchParams>;
}) {
  const params = await searchParams;
  const profile = await requireRole("admin");
  const gradingClient = prisma as unknown as {
    assessmentType?: typeof prisma.assessmentType;
    assessmentTemplate?: typeof prisma.assessmentTemplate;
  };

  if (!gradingClient.assessmentType || !gradingClient.assessmentTemplate) {
    return (
      <Section>
        <PageHeader
          title="Assessment Types Setup Required"
          subtitle="Assessment tables are not available in the current Prisma client."
        />
        <Card>
          <p className="small text-muted">{schemaSyncMessage("Assessment type")}</p>
        </Card>
      </Section>
    );
  }

  let templates: Array<{
    id: string;
    name: string;
    isActive: boolean;
    _count: { types: number };
  }> = [];
  let terms: Array<{
    id: string;
    sessionLabel: string;
    termLabel: string;
    isActive: boolean;
    assessmentTemplate: {
      id: string;
      name: string;
      sourceTemplateId: string | null;
    } | null;
    _count: {
      scores: number;
    };
  }> = [];
  let assessmentTypes: Array<{
    id: string;
    name: string;
    weight: number;
    orderIndex: number;
    isActive: boolean;
  }> = [];

  try {
    [templates, terms] = await Promise.all([
      gradingClient.assessmentTemplate.findMany({
        where: { schoolId: profile.schoolId, isPreset: true },
        include: { _count: { select: { types: true } } },
        orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
      }),
      prisma.term.findMany({
        where: { schoolId: profile.schoolId },
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          sessionLabel: true,
          termLabel: true,
          isActive: true,
          assessmentTemplate: {
            select: {
              id: true,
              name: true,
              sourceTemplateId: true,
            },
          },
          _count: {
            select: {
              scores: true,
            },
          },
        },
      }),
    ]);
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return (
        <Section>
          <PageHeader
            title="Assessment Types Setup Required"
            subtitle="Assessment schema is out of sync for this environment."
          />
          <Card>
            <p className="small text-muted">{schemaSyncMessage("Assessment type")}</p>
          </Card>
        </Section>
      );
    }
    throw error;
  }

  const selectedTemplate =
    (params.templateId ? templates.find((item) => item.id === params.templateId) : null) ??
    templates.find((item) => item.isActive) ??
    templates[0];
  const selectedTerm =
    (params.termId ? terms.find((item) => item.id === params.termId) : null) ??
    terms.find((item) => item.isActive) ??
    terms[0];

  if (selectedTemplate) {
    try {
      assessmentTypes = await gradingClient.assessmentType.findMany({
        where: {
          schoolId: profile.schoolId,
          templateId: selectedTemplate.id,
        },
        orderBy: { orderIndex: "asc" },
      });
    } catch (error) {
      if (isPrismaSchemaMismatchError(error)) {
        return (
          <Section>
            <PageHeader
              title="Assessment Types Setup Required"
              subtitle="Assessment schema is out of sync for this environment."
            />
            <Card>
              <p className="small text-muted">{schemaSyncMessage("Assessment type")}</p>
            </Card>
          </Section>
        );
      }
      throw error;
    }
  }

  const totalWeight = assessmentTypes.filter((item) => item.isActive).reduce((sum, item) => sum + item.weight, 0);
  const activeTemplateName = templates.find((item) => item.isActive)?.name ?? "None";

  return (
    <Section>
      <PageHeader
        title="Assessment Types"
        subtitle="Create reusable assessment presets, then assign a fixed preset snapshot to each term."
        rightActions={
          <div className="text-md-end">
            <p className="small text-muted mb-1">Active Preset</p>
            <h3 className="h5 fw-bold mb-2">{activeTemplateName}</h3>
            <p className="small text-muted mb-1">Selected Preset Total</p>
            <h3 className="h3 fw-bold mb-0">
              <span className="assessment-total-pulse">{totalWeight}%</span>
            </h3>
          </div>
        }
      />

      <Card title="Add Assessment Template">
        <form action={upsertAssessmentTemplateAction} className="grid gap-3 md:grid-cols-4">
          <label className="d-grid gap-1">
            <span className="field-label">Template Name</span>
            <Input name="name" placeholder="3test" required />
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Set Active Now</span>
            <Select name="setActive" defaultValue={templates.some((item) => item.isActive) ? "off" : "on"}>
              <option value="on">Yes</option>
              <option value="off">No</option>
            </Select>
          </label>
          <div className="align-self-end">
            <Button variant="primary" type="submit">
              Save Template
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Assessment Template Menu">
        <AssessmentTemplateTable
          rows={templates.map((template) => ({
            id: template.id,
            name: template.name,
            isActive: template.isActive,
            itemCount: template._count.types,
          }))}
          selectedTemplateId={selectedTemplate?.id}
        />
      </Card>

      <Card title="Assign Preset To Term" subtitle="Each term gets its own fixed snapshot so later changes do not affect past terms.">
        {!selectedTemplate || !selectedTerm ? (
          <p className="small text-muted mb-0">Create at least one preset and one term before assigning a term scheme.</p>
        ) : (
          <form action={assignAssessmentTemplateToTermAction} className="grid gap-3 md:grid-cols-4">
            <label className="d-grid gap-1">
              <span className="field-label">Term</span>
              <Select name="termId" defaultValue={selectedTerm.id}>
                {terms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.sessionLabel} {term.termLabel} {term.isActive ? "(Active)" : ""}
                  </option>
                ))}
              </Select>
            </label>
            <label className="d-grid gap-1">
              <span className="field-label">Preset</span>
              <Select name="templateId" defaultValue={selectedTemplate.id}>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </Select>
            </label>
            <div className="align-self-end">
              <Button variant="primary" type="submit">
                Assign To Term
              </Button>
            </div>
            <div className="small text-muted align-self-end">
              {selectedTerm.assessmentTemplate
                ? `Current fixed scheme: ${selectedTerm.assessmentTemplate.name}`
                : "No fixed scheme assigned to this term yet."}
            </div>
          </form>
        )}
      </Card>

      <Card title="Term Assessment Schemes">
        <div className="table-responsive">
          <table className="table display table-striped table-hover">
            <thead>
              <tr>
                <th>Term</th>
                <th>Fixed Scheme</th>
                <th>Scores Recorded</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {terms.map((term) => (
                <tr key={term.id}>
                  <td>
                    {term.sessionLabel} {term.termLabel}
                  </td>
                  <td>{term.assessmentTemplate?.name ?? "Not assigned"}</td>
                  <td>{term._count.scores}</td>
                  <td>
                    {term._count.scores > 0
                      ? "Locked"
                      : term.assessmentTemplate
                        ? "Ready"
                        : "Pending assignment"}
                  </td>
                </tr>
              ))}
              {terms.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted">
                    No terms created yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title={selectedTemplate ? `Add Assessment Item (${selectedTemplate.name})` : "Add Assessment Item"}>
        {!selectedTemplate ? (
          <p className="small text-muted mb-0">Create a template first before adding assessment items.</p>
        ) : (
          <form action={upsertAssessmentTypeAction} className="grid gap-3 md:grid-cols-5">
            <input type="hidden" name="templateId" value={selectedTemplate.id} />
            <label className="d-grid gap-1">
              <span className="field-label">Name</span>
              <Input name="name" placeholder="CA1" required />
            </label>
            <label className="d-grid gap-1">
              <span className="field-label">Max Score</span>
              <Input name="weight" type="number" min={0} max={100} placeholder="20" required />
            </label>
            <label className="d-grid gap-1">
              <span className="field-label">Order</span>
              <Input name="orderIndex" type="number" min={1} max={99} placeholder="1" required />
            </label>
            <label className="d-grid gap-1">
              <span className="field-label">Active</span>
              <Select name="isActive" defaultValue="on">
                <option value="on">Yes</option>
                <option value="off">No</option>
              </Select>
            </label>
            <div className="align-self-end">
              <Button variant="primary" type="submit">
                Add Item
              </Button>
            </div>
          </form>
        )}
      </Card>

      <Card title={selectedTemplate ? `Assessment Items (${selectedTemplate.name})` : "Assessment Items"}>
        {!selectedTemplate ? (
          <p className="small text-muted mb-0">No template selected.</p>
        ) : (
          <AssessmentTypeTable templateId={selectedTemplate.id} rows={assessmentTypes} />
        )}
      </Card>
    </Section>
  );
}
