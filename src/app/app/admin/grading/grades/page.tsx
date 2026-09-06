import Button from "@/components/admin/ui/Button";
import Card from "@/components/admin/Card";
import Input from "@/components/admin/ui/Input";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";
import SetupActionPanel from "@/components/admin/SetupActionPanel";
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
          <Card><p className="small text-muted">{schemaSyncMessage("Grade scale")}</p></Card>
        </Section>
      );
    }
    throw error;
  }

  return (
    <Section className="admin-workspace-section">
      <PageHeader
        title="Grade Scale"
        subtitle="Review the grading boundaries currently used to calculate results."
        rightActions={<div className="admin-context-metrics"><span><strong>{gradeScale.length}</strong> grade bands</span></div>}
      />

      <SetupActionPanel
        title="Add grade band"
        description="Define a new letter grade and its score range."
        icon="fas fa-award"
      >
        <form action={upsertGradeScaleAction} className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="d-grid gap-1">
            <span className="field-label">Grade</span>
            <Input name="gradeLetter" placeholder="A" required />
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Minimum score</span>
            <Input name="minScore" type="number" min={0} max={100} placeholder="70" required />
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Maximum score</span>
            <Input name="maxScore" type="number" min={0} max={100} placeholder="100" required />
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Display order</span>
            <Input name="orderIndex" type="number" min={1} placeholder="1" required />
          </label>
          <div className="align-self-end">
            <Button variant="primary" type="submit">Add grade band</Button>
          </div>
        </form>
      </SetupActionPanel>

      <Card
        title="Grade bands"
        subtitle="Edit an existing row when a score boundary or grade label changes."
        className="admin-catalog-card"
      >
        <GradeScaleTable rows={gradeScale} />
      </Card>
    </Section>
  );
}
