import Button from "@/components/admin/ui/Button";
import Card from "@/components/admin/Card";
import Input from "@/components/admin/ui/Input";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";
import Select from "@/components/admin/ui/Select";
import AssessmentTypeTable from "@/components/grading/AssessmentTypeTable";
import { requireRole } from "@/lib/server/auth";
import { upsertAssessmentTypeAction } from "@/lib/server/admin-actions";
import { prisma } from "@/lib/server/prisma";
import { isPrismaSchemaMismatchError, schemaSyncMessage } from "@/lib/server/prisma-errors";

export default async function GradingAssessmentTypesPage() {
  const profile = await requireRole("admin");
  const gradingClient = prisma as unknown as { assessmentType?: typeof prisma.assessmentType };

  if (!gradingClient.assessmentType) {
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

  let assessmentTypes: Array<{
    id: string;
    name: string;
    weight: number;
    orderIndex: number;
    isActive: boolean;
  }> = [];

  try {
    assessmentTypes = await gradingClient.assessmentType.findMany({
      where: { schoolId: profile.schoolId },
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

  const totalWeight = assessmentTypes.filter((item) => item.isActive).reduce((sum, item) => sum + item.weight, 0);

  return (
    <Section>
      <PageHeader
        title="Assessment Types"
        subtitle="Create and manage assessment names and their weights."
        rightActions={
          <div className="text-md-end">
            <p className="small text-muted mb-1">Current Active Total</p>
            <h3 className="h3 fw-bold mb-0">
              <span className="assessment-total-pulse">{totalWeight}%</span>
            </h3>
          </div>
        }
      />

      <Card title="Add Assessment Type">
        <form action={upsertAssessmentTypeAction} className="grid gap-3 md:grid-cols-5">
          <label className="d-grid gap-1">
            <span className="field-label">Name</span>
            <Input name="name" placeholder="CA 1" required />
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Weight</span>
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
              Add Assessment
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Assessment Type Directory">
        <AssessmentTypeTable rows={assessmentTypes} />
      </Card>
    </Section>
  );
}
