import Button from "@/components/admin/ui/Button";
import Card from "@/components/admin/Card";
import ConductCategoryTable from "@/components/grading/ConductCategoryTable";
import Input from "@/components/admin/ui/Input";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";
import Select from "@/components/admin/ui/Select";
import { requireRole } from "@/lib/server/auth";
import { deleteConductCategoryAction, upsertConductCategoryAction } from "@/lib/server/admin-actions";
import { isPrismaSchemaMismatchError, schemaSyncMessage } from "@/lib/server/prisma-errors";
import { prisma } from "@/lib/server/prisma";

export default async function AdminGradingConductPage() {
  const profile = await requireRole("admin");

  let conductCategories: Array<{
    id: string;
    name: string;
    maxScore: number;
    orderIndex: number;
    isActive: boolean;
  }> = [];

  try {
    conductCategories = await prisma.conductCategory.findMany({
      where: { schoolId: profile.schoolId },
      orderBy: { orderIndex: "asc" },
    });
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return (
        <Section>
          <PageHeader title="Conduct Setup Required" subtitle="Conduct schema is out of sync for this environment." />
          <Card>
            <p className="small text-muted">{schemaSyncMessage("Conduct")}</p>
          </Card>
        </Section>
      );
    }
    throw error;
  }

  return (
    <Section>
      <PageHeader
        title="Conduct"
        subtitle="Define conduct and performance categories with the maximum score teachers can award per category."
      />

      <Card title="Add Conduct Category">
        <form action={upsertConductCategoryAction} className="grid gap-3 md:grid-cols-5">
          <label className="d-grid gap-1">
            <span className="field-label">Category Name</span>
            <Input name="name" placeholder="Punctuality" required />
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Maximum Score</span>
            <Input name="maxScore" type="number" min={1} max={100} placeholder="10" required />
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
              Add Category
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Conduct Categories">
        <ConductCategoryTable rows={conductCategories} />
      </Card>
    </Section>
  );
}
