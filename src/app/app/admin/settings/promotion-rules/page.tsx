import Link from "next/link";
import AdminFlashNotice from "@/components/admin/AdminFlashNotice";
import Button from "@/components/admin/ui/Button";
import Card from "@/components/admin/Card";
import Input from "@/components/admin/ui/Input";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";
import Select from "@/components/admin/ui/Select";
import { upsertPromotionPolicyAction } from "@/lib/server/admin-actions";
import { requireRole } from "@/lib/server/auth";
import { resolvePromotionPolicy } from "@/lib/server/promotion";
import { prisma } from "@/lib/server/prisma";

type PromotionRulesSearchParams = {
  status?: string;
  message?: string;
};

export default async function AdminPromotionRulesPage({
  searchParams,
}: {
  searchParams: Promise<PromotionRulesSearchParams>;
}) {
  const profile = await requireRole("admin");
  const params = await searchParams;
  const status = params.status === "success" || params.status === "error" ? params.status : null;
  const message = (params.message ?? "").trim();

  const [gradeScale, subjects, promotionPolicy] = await Promise.all([
    prisma.gradeScale.findMany({
      where: { schoolId: profile.schoolId },
      orderBy: { orderIndex: "asc" },
    }),
    prisma.subject.findMany({
      where: { schoolId: profile.schoolId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.promotionPolicy.findUnique({
      where: { schoolId: profile.schoolId },
      select: {
        minimumPassedSubjects: true,
        minimumAverage: true,
        passGradeId: true,
        requiredCompulsorySubjectsAtGrade: true,
        requiredCompulsoryGradeId: true,
        allowManualOverride: true,
        compulsorySubjects: {
          select: {
            subjectId: true,
          },
          orderBy: {
            subject: {
              name: "asc",
            },
          },
        },
      },
    }),
  ]);

  const effectivePolicy = resolvePromotionPolicy(
    promotionPolicy
      ? {
          minimumPassedSubjects: promotionPolicy.minimumPassedSubjects,
          minimumAverage: Number(promotionPolicy.minimumAverage),
          passGradeId: promotionPolicy.passGradeId,
          requiredCompulsorySubjectsAtGrade: promotionPolicy.requiredCompulsorySubjectsAtGrade,
          requiredCompulsoryGradeId: promotionPolicy.requiredCompulsoryGradeId,
          allowManualOverride: promotionPolicy.allowManualOverride,
          compulsorySubjectIds: promotionPolicy.compulsorySubjects.map((item) => item.subjectId),
        }
      : null,
    gradeScale,
  );

  const compulsorySubjectNames = effectivePolicy.compulsorySubjectIds
    .map((subjectId) => subjects.find((subject) => subject.id === subjectId)?.name)
    .filter((value): value is string => Boolean(value));

  return (
    <Section>
      {status && message ? <AdminFlashNotice status={status} message={message} /> : null}
      <PageHeader
        title="Promotion Rules"
        subtitle="Define the criteria this school uses when deciding who can move into the next session."
        rightActions={
          <div className="d-flex flex-wrap gap-2">
            <Link href="/app/admin/settings" className="btn btn-secondary">
              Back to Settings
            </Link>
            <Link href="/app/admin/grading/promotion" className="btn btn-secondary">
              Open Promotion
            </Link>
          </div>
        }
      />

      <Card title="Rule Builder" subtitle="Example: 5 passes, with at least 2 compulsory subjects earning A.">
        <form action={upsertPromotionPolicyAction} className="d-grid gap-3">
          <div className="grid gap-3 md:grid-cols-4">
            <label className="d-grid gap-1">
              <span className="field-label">Minimum Passed Subjects</span>
              <Input name="minimumPassedSubjects" type="number" min={1} max={50} defaultValue={effectivePolicy.minimumPassedSubjects} required />
            </label>

            <label className="d-grid gap-1">
              <span className="field-label">Pass Grade Threshold</span>
              <Select name="passGradeId" defaultValue={effectivePolicy.passGradeId ?? ""}>
                <option value="">Use 50 and above</option>
                {gradeScale.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.gradeLetter} ({item.minScore}-{item.maxScore})
                  </option>
                ))}
              </Select>
            </label>

            <label className="d-grid gap-1">
              <span className="field-label">Minimum Annual Average</span>
              <Input name="minimumAverage" type="number" min={0} max={100} step="0.01" defaultValue={effectivePolicy.minimumAverage} required />
            </label>

            <label className="d-grid gap-1">
              <span className="field-label">Manual Override</span>
              <Select name="allowManualOverride" defaultValue={effectivePolicy.allowManualOverride ? "on" : "off"}>
                <option value="on">Allow admin override</option>
                <option value="off">Only eligible students</option>
              </Select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="d-grid gap-1">
              <span className="field-label">Compulsory Subjects That Must Reach a Higher Grade</span>
              <Input
                name="requiredCompulsorySubjectsAtGrade"
                type="number"
                min={0}
                max={20}
                defaultValue={effectivePolicy.requiredCompulsorySubjectsAtGrade}
                required
              />
            </label>

            <label className="d-grid gap-1">
              <span className="field-label">Required Compulsory Grade</span>
              <Select name="requiredCompulsoryGradeId" defaultValue={effectivePolicy.requiredCompulsoryGradeId ?? ""}>
                <option value="">No extra compulsory-grade target</option>
                {gradeScale.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.gradeLetter} ({item.minScore}-{item.maxScore})
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <div className="d-grid gap-2">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
              <span className="field-label mb-0">Compulsory Subjects</span>
              <span className="small text-muted">
                Choose the subjects this school treats as compulsory for promotion.
              </span>
            </div>
            {subjects.length === 0 ? (
              <p className="section-subtle mb-0">Create subjects first before choosing compulsory subjects.</p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {subjects.map((subject) => {
                  const checked = effectivePolicy.compulsorySubjectIds.includes(subject.id);
                  return (
                    <label key={subject.id} className="d-flex align-items-center gap-2 rounded border px-3 py-2 bg-white">
                      <input type="checkbox" name="compulsorySubjectIds" value={subject.id} defaultChecked={checked} />
                      <span>{subject.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded border bg-white px-3 py-3">
            <p className="field-label mb-2">Current Rule Summary</p>
            <p className="small text-muted mb-1">
              Students must pass at least <strong>{effectivePolicy.minimumPassedSubjects}</strong> subject{effectivePolicy.minimumPassedSubjects === 1 ? "" : "s"} with <strong>{effectivePolicy.passGradeLabel}</strong> or above.
            </p>
            <p className="small text-muted mb-1">
              Minimum annual average: <strong>{effectivePolicy.minimumAverage.toFixed(1)}</strong>
            </p>
            <p className="small text-muted mb-1">
              {effectivePolicy.requiredCompulsorySubjectsAtGrade > 0
                ? `At least ${effectivePolicy.requiredCompulsorySubjectsAtGrade} compulsory subject${effectivePolicy.requiredCompulsorySubjectsAtGrade === 1 ? "" : "s"} must reach ${effectivePolicy.requiredCompulsoryGradeLabel}.`
                : "No extra high-grade compulsory requirement is set."}
            </p>
            <p className="small text-muted mb-1">
              {compulsorySubjectNames.length > 0 ? `Compulsory subjects: ${compulsorySubjectNames.join(", ")}.` : "No compulsory subjects selected yet."}
            </p>
            <p className="small text-muted mb-0">
              {effectivePolicy.allowManualOverride ? "Manual override is allowed." : "Manual override is turned off."}
            </p>
          </div>

          <div className="d-flex justify-content-end">
            <Button variant="primary" type="submit">
              Save Promotion Rules
            </Button>
          </div>
        </form>
      </Card>
    </Section>
  );
}
