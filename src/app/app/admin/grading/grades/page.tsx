import Button from "@/components/admin/ui/Button";
import Card from "@/components/admin/Card";
import Input from "@/components/admin/ui/Input";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";
import GradeScaleTable from "@/components/grading/GradeScaleTable";
import { requireRole } from "@/lib/server/auth";
import { upsertGradeScaleAction } from "@/lib/server/admin-actions";
import { prisma } from "@/lib/server/prisma";
import { isPrismaSchemaMismatchError, schemaSyncMessage } from "@/lib/server/prisma-errors";

export default async function GradingGradesPage() {
  const profile = await requireRole("admin");

  let gradeScale: Array<{
    id: string;
    gradeLetter: string;
    minScore: number;
    maxScore: number;
    orderIndex: number;
  }> = [];

  try {
    gradeScale = await prisma.gradeScale.findMany({
      where: { schoolId: profile.schoolId },
      orderBy: { orderIndex: "asc" },
    });
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return (
        <Section>
          <PageHeader title="Grade Scale Setup Required" subtitle="Grade scale schema is out of sync for this environment." />
          <Card>
            <p className="small text-muted">{schemaSyncMessage("Grade scale")}</p>
          </Card>
        </Section>
      );
    }
    throw error;
  }

  return (
    <Section>
      <PageHeader title="Grade Scale" subtitle="Define grade letters and score boundaries used in result computation." />

      <Card title="Add Grade Band">
        <form action={upsertGradeScaleAction} className="grid gap-3 md:grid-cols-5">
          <label className="d-grid gap-1">
            <span className="field-label">Grade</span>
            <Input name="gradeLetter" placeholder="A" required />
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Minimum Score</span>
            <Input name="minScore" type="number" placeholder="70" required />
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Maximum Score</span>
            <Input name="maxScore" type="number" placeholder="100" required />
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Order</span>
            <Input name="orderIndex" type="number" placeholder="1" required />
          </label>
          <div className="align-self-end">
            <Button variant="primary" type="submit">
              Add Grade
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Grade Bands">
        <GradeScaleTable rows={gradeScale} />
      </Card>
    </Section>
  );
}
