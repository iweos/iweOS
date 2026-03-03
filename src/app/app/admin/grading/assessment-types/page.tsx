import { upsertAssessmentTypeAction } from "@/lib/server/admin-actions";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import AssessmentTypeTable from "@/components/grading/AssessmentTypeTable";

export default async function GradingAssessmentTypesPage() {
  const profile = await requireRole("admin");
  const gradingClient = prisma as unknown as { assessmentType?: typeof prisma.assessmentType };

  if (!gradingClient.assessmentType) {
    return (
      <section className="section-panel space-y-2">
        <p className="section-kicker">Grading</p>
        <h1 className="section-title">Setup Required</h1>
        <p className="section-subtle">
          Assessment types are not available in the current Prisma client. Run{" "}
          <code>npm run prisma:generate && npm run prisma:migrate</code>, then restart <code>npm run dev</code>.
        </p>
      </section>
    );
  }

  const assessmentTypes = await gradingClient.assessmentType.findMany({
    where: { schoolId: profile.schoolId },
    orderBy: { orderIndex: "asc" },
  });

  const totalWeight = assessmentTypes.filter((item) => item.isActive).reduce((sum, item) => sum + item.weight, 0);

  return (
    <>
      <section className="section-panel space-y-3">
        <h1 className="section-title">Grading / Assessment Types</h1>
        <p className="section-subtle">Create and manage assessment name + weight. Active weights should sum to 100%.</p>
        <p className="text-sm text-[var(--muted)]">Current active total: {totalWeight}%</p>

        <form action={upsertAssessmentTypeAction} className="grid gap-2 md:grid-cols-5">
          <label className="space-y-1">
            <span className="field-label">Name</span>
            <input name="name" className="input" placeholder="CA1" required />
          </label>
          <label className="space-y-1">
            <span className="field-label">Weight</span>
            <input name="weight" type="number" min={0} max={100} className="input" placeholder="20" required />
          </label>
          <label className="space-y-1">
            <span className="field-label">Order</span>
            <input name="orderIndex" type="number" min={1} max={99} className="input" placeholder="1" required />
          </label>
          <label className="space-y-1">
            <span className="field-label">Active</span>
            <select name="isActive" className="select" defaultValue="on">
              <option value="on">Yes</option>
              <option value="off">No</option>
            </select>
          </label>
          <div className="self-end">
            <button className="btn btn-primary" type="submit">
              Add Assessment
            </button>
          </div>
        </form>
      </section>

      <section className="section-panel">
        <AssessmentTypeTable rows={assessmentTypes} />
      </section>
    </>
  );
}
