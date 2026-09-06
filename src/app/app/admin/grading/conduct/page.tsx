import Button from "@/components/admin/ui/Button";
import Card from "@/components/admin/Card";
import ConductCategoryTable from "@/components/grading/ConductCategoryTable";
import ConductSectionTable from "@/components/grading/ConductSectionTable";
import Input from "@/components/admin/ui/Input";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";
import Select from "@/components/admin/ui/Select";
import SetupActionPanel from "@/components/admin/SetupActionPanel";
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
    _count: { categories: number };
  }> = [];
  let conductCategories: Array<{
    id: string;
    sectionId: string;
    name: string;
    maxScore: number;
    orderIndex: number;
    isActive: boolean;
    section: { id: string; name: string; orderIndex: number };
  }> = [];

  try {
    [conductSections, conductCategories] = await Promise.all([
      prisma.conductSection.findMany({
        where: { schoolId: profile.schoolId },
        orderBy: [{ orderIndex: "asc" }, { name: "asc" }],
        include: { _count: { select: { categories: true } } },
      }),
      prisma.conductCategory.findMany({
        where: { schoolId: profile.schoolId },
        orderBy: [{ section: { orderIndex: "asc" } }, { orderIndex: "asc" }, { name: "asc" }],
        include: { section: { select: { id: true, name: true, orderIndex: true } } },
      }),
    ]);
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return (
        <Section>
          <PageHeader title="Conduct Setup Required" subtitle="Conduct schema is out of sync for this environment." />
          <Card><p className="small text-muted">{schemaSyncMessage("Conduct")}</p></Card>
        </Section>
      );
    }
    throw error;
  }

  const activeSections = conductSections.filter((section) => section.isActive).length;
  const activeCategories = conductCategories.filter((category) => category.isActive).length;

  return (
    <Section className="admin-workspace-section">
      <PageHeader
        title="Conduct"
        subtitle="Organise the qualities teachers assess, then manage the scored items within each group."
        rightActions={
          <div className="admin-context-metrics" aria-label="Conduct setup summary">
            <span><strong>{conductSections.length}</strong> groups</span>
            <span><strong>{conductCategories.length}</strong> scored items</span>
          </div>
        }
      />

      <div className="setup-action-grid">
        <SetupActionPanel
          title="Add conduct group"
          description="Create a section such as Psychomotor or Affective Domain."
          icon="fas fa-layer-group"
        >
          <form action={upsertConductSectionAction} className="grid gap-3 md:grid-cols-4">
            <label className="d-grid gap-1">
              <span className="field-label">Group name</span>
              <Input name="name" placeholder="Psychomotor" required />
            </label>
            <label className="d-grid gap-1">
              <span className="field-label">Display order</span>
              <Input name="orderIndex" type="number" min={1} max={99} placeholder="1" required />
            </label>
            <label className="d-grid gap-1">
              <span className="field-label">Status</span>
              <Select name="isActive" defaultValue="on">
                <option value="on">Active</option>
                <option value="off">Inactive</option>
              </Select>
            </label>
            <div className="align-self-end">
              <Button variant="primary" type="submit">Create group</Button>
            </div>
          </form>
        </SetupActionPanel>

        <SetupActionPanel
          title="Add scored item"
          description={conductSections.length ? "Add an assessable quality inside an existing conduct group." : "Create a conduct group before adding scored items."}
          icon="fas fa-star"
        >
          {conductSections.length === 0 ? (
            <div className="setup-empty-note">
              <i className="fas fa-info-circle" aria-hidden="true" />
              Create your first conduct group, then return here to add scored items.
            </div>
          ) : (
            <form action={upsertConductCategoryAction} className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <label className="d-grid gap-1 xl:col-span-2">
                <span className="field-label">Conduct group</span>
                <Select name="sectionId" required defaultValue={conductSections[0]?.id}>
                  {conductSections.map((section) => (
                    <option key={section.id} value={section.id}>{section.name}</option>
                  ))}
                </Select>
              </label>
              <label className="d-grid gap-1 xl:col-span-2">
                <span className="field-label">Item name</span>
                <Input name="name" placeholder="Handwriting" required />
              </label>
              <label className="d-grid gap-1">
                <span className="field-label">Maximum score</span>
                <Input name="maxScore" type="number" min={1} max={100} placeholder="5" required />
              </label>
              <label className="d-grid gap-1">
                <span className="field-label">Display order</span>
                <Input name="orderIndex" type="number" min={1} max={99} placeholder="1" required />
              </label>
              <label className="d-grid gap-1">
                <span className="field-label">Status</span>
                <Select name="isActive" defaultValue="on">
                  <option value="on">Active</option>
                  <option value="off">Inactive</option>
                </Select>
              </label>
              <div className="align-self-end">
                <Button variant="primary" type="submit">Add scored item</Button>
              </div>
            </form>
          )}
        </SetupActionPanel>
      </div>

      <div className="admin-catalog-grid">
        <Card
          title="Conduct groups"
          subtitle={activeSections + " active of " + conductSections.length + ". Select edit to change a group."}
          className="admin-catalog-card"
        >
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
          title="Scored conduct items"
          subtitle={activeCategories + " active of " + conductCategories.length + ". Teachers score these items on student reports."}
          className="admin-catalog-card"
        >
          <ConductCategoryTable
            sections={conductSections.map((section) => ({ id: section.id, name: section.name }))}
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
      </div>
    </Section>
  );
}
