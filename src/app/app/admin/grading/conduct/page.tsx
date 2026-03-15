import Button from "@/components/admin/ui/Button";
import Card from "@/components/admin/Card";
import ConductCategoryTable from "@/components/grading/ConductCategoryTable";
import ConductSectionTable from "@/components/grading/ConductSectionTable";
import Input from "@/components/admin/ui/Input";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";
import Select from "@/components/admin/ui/Select";
import { requireRole } from "@/lib/server/auth";
import { upsertConductCategoryAction, upsertConductSectionAction } from "@/lib/server/admin-actions";
import { isPrismaSchemaMismatchError, schemaSyncMessage } from "@/lib/server/prisma-errors";
import { prisma } from "@/lib/server/prisma";

export default async function AdminGradingConductPage() {
  const profile = await requireRole("admin");

  let conductSections: Array<{
    id: string;
    name: string;
    orderIndex: number;
    isActive: boolean;
    _count: {
      categories: number;
    };
  }> = [];
  let conductCategories: Array<{
    id: string;
    sectionId: string;
    name: string;
    maxScore: number;
    orderIndex: number;
    isActive: boolean;
    section: {
      id: string;
      name: string;
      orderIndex: number;
    };
  }> = [];

  try {
    [conductSections, conductCategories] = await Promise.all([
      prisma.conductSection.findMany({
        where: { schoolId: profile.schoolId },
        orderBy: [{ orderIndex: "asc" }, { name: "asc" }],
        include: {
          _count: {
            select: {
              categories: true,
            },
          },
        },
      }),
      prisma.conductCategory.findMany({
        where: { schoolId: profile.schoolId },
        orderBy: [{ section: { orderIndex: "asc" } }, { orderIndex: "asc" }, { name: "asc" }],
        include: {
          section: {
            select: {
              id: true,
              name: true,
              orderIndex: true,
            },
          },
        },
      }),
    ]);
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
        subtitle="Create a main conduct category, then add as many scored sub-categories under it as you need."
      />

      <Card title="Add Conduct Category" subtitle="Examples: Psychomotor, Affective Domain, Behaviour">
        <form action={upsertConductSectionAction} className="grid gap-3 md:grid-cols-4">
          <label className="d-grid gap-1">
            <span className="field-label">Category Name</span>
            <Input name="name" placeholder="Psychomotor" required />
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
        <ConductSectionTable
          rows={conductSections.map((section) => ({
            id: section.id,
            name: section.name,
            orderIndex: section.orderIndex,
            isActive: section.isActive,
            categoryCount: section._count.categories,
          }))}
        />
      </Card>

      <Card
        title="Add Conduct Sub-category"
        subtitle="These are the items teachers score, such as Handwriting, Neatness, or Leadership."
      >
        {conductSections.length === 0 ? (
          <p className="small text-muted mb-0">Create a conduct category first before adding sub-categories.</p>
        ) : (
          <form action={upsertConductCategoryAction} className="grid gap-3 md:grid-cols-6">
            <label className="d-grid gap-1">
              <span className="field-label">Conduct Category</span>
              <Select name="sectionId" required defaultValue={conductSections[0]?.id}>
                {conductSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="d-grid gap-1">
              <span className="field-label">Sub-category Name</span>
              <Input name="name" placeholder="Handwriting" required />
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
                Add Sub-category
              </Button>
            </div>
          </form>
        )}
      </Card>

      <Card title="Conduct Sub-categories">
        <ConductCategoryTable
          sections={conductSections.map((section) => ({
            id: section.id,
            name: section.name,
          }))}
          rows={conductCategories.map((category) => ({
            id: category.id,
            sectionId: category.sectionId,
            sectionName: category.section.name,
            name: category.name,
            maxScore: category.maxScore,
            orderIndex: category.orderIndex,
            isActive: category.isActive,
          }))}
        />
      </Card>
    </Section>
  );
}
