import { upsertGradeScaleAction } from "@/lib/server/admin-actions";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import GradeScaleTable from "@/components/grading/GradeScaleTable";

export default async function GradingGradesPage() {
  const profile = await requireRole("admin");

  const gradeScale = await prisma.gradeScale.findMany({ where: { schoolId: profile.schoolId }, orderBy: { orderIndex: "asc" } });

  return (
    <section className="section-panel space-y-3">
      <h1 className="section-title">Grading / Grades</h1>

      <form action={upsertGradeScaleAction} className="grid gap-2 md:grid-cols-5">
        <input name="gradeLetter" className="input" placeholder="A" required />
        <input name="minScore" className="input" type="number" placeholder="70" required />
        <input name="maxScore" className="input" type="number" placeholder="100" required />
        <input name="orderIndex" className="input" type="number" placeholder="1" required />
        <button className="btn btn-primary" type="submit">
          Add Grade
        </button>
      </form>

      <GradeScaleTable rows={gradeScale} />
    </section>
  );
}
