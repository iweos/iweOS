import Link from "next/link";
import AdminFlashNotice from "@/components/admin/AdminFlashNotice";
import Button from "@/components/admin/ui/Button";
import Card from "@/components/admin/Card";
import Input from "@/components/admin/ui/Input";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";
import Select from "@/components/admin/ui/Select";
import StatCard from "@/components/admin/ui/StatCard";
import {
  activatePromotionPolicyAction,
  deletePromotionPolicyAction,
  upsertPromotionPolicyAction,
} from "@/lib/server/admin-actions";
import { requireRole } from "@/lib/server/auth";
import { mapStoredPromotionPolicy, resolvePromotionPolicy } from "@/lib/server/promotion";
import { prisma } from "@/lib/server/prisma";

type PromotionRulesSearchParams = {
  status?: string;
  message?: string;
  ruleId?: string;
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

  const [gradeScale, subjects, promotionPolicies] = await Promise.all([
    prisma.gradeScale.findMany({
      where: { schoolId: profile.schoolId },
      orderBy: { orderIndex: "asc" },
    }),
    prisma.subject.findMany({
      where: { schoolId: profile.schoolId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.promotionPolicy.findMany({
      where: { schoolId: profile.schoolId },
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        isActive: true,
        minimumPassedSubjects: true,
        minimumAverage: true,
        passGradeId: true,
        requiredCompulsorySubjectsAtGrade: true,
        requiredCompulsoryGradeId: true,
        allowManualOverride: true,
        compulsorySubjects: {
          select: {
            subjectId: true,
            subject: {
              select: { name: true },
            },
          },
          orderBy: {
            subject: { name: "asc" },
          },
        },
      },
    }),
  ]);

  const selectedPolicy =
    (params.ruleId ? promotionPolicies.find((item) => item.id === params.ruleId) : null) ??
    promotionPolicies.find((item) => item.isActive) ??
    promotionPolicies[0] ??
    null;

  const effectivePolicy = resolvePromotionPolicy(mapStoredPromotionPolicy(selectedPolicy), gradeScale);
  const compulsorySubjectNames = effectivePolicy.compulsorySubjectIds
    .map((subjectId) => subjects.find((subject) => subject.id === subjectId)?.name)
    .filter((value): value is string => Boolean(value));

  return (
    <Section>
      {status && message ? <AdminFlashNotice status={status} message={message} /> : null}
      <PageHeader
        title="Promotion Rules"
        subtitle="Create multiple school-specific promotion rules, then choose which one is active."
        rightActions={
          <div className="d-flex flex-wrap gap-2">
            <Link href="/app/admin/settings?tab=policies" className="btn btn-secondary">
              Back to Settings
            </Link>
            <Link href="/app/admin/grading/promotion" className="btn btn-secondary">
              Open Promotion
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Saved Rules" value={promotionPolicies.length} icon="fas fa-sitemap" cardVariant="info" />
        <StatCard
          label="Active Rule"
          value={promotionPolicies.find((item) => item.isActive)?.name ?? "None"}
          icon="fas fa-check-circle"
          cardVariant="success"
        />
        <StatCard
          label="Compulsory Subjects"
          value={compulsorySubjectNames.length}
          icon="fas fa-book"
          cardVariant="secondary"
        />
        <StatCard
          label="Manual Override"
          value={effectivePolicy.allowManualOverride ? "On" : "Off"}
          icon="fas fa-sliders-h"
          cardVariant="warning"
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card title="Saved Rules" subtitle="Choose a rule to edit, activate, or delete.">
          <div className="d-grid gap-3">
            <Link href="/app/admin/settings/promotion-rules" className="btn btn-outline-secondary">
              Create New Rule
            </Link>

            {promotionPolicies.length === 0 ? (
              <p className="small text-muted mb-0">No promotion rule saved yet. Create your first rule on the right.</p>
            ) : (
              promotionPolicies.map((policy) => {
                const subjectNames = policy.compulsorySubjects.map((item) => item.subject.name);
                return (
                  <div key={policy.id} className={`rounded border px-3 py-3 bg-white ${selectedPolicy?.id === policy.id ? "border-success" : ""}`}>
                    <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
                      <div>
                        <div className="d-flex flex-wrap align-items-center gap-2">
                          <h3 className="h6 fw-bold mb-0">{policy.name}</h3>
                          {policy.isActive ? <span className="badge text-bg-success">Active</span> : null}
                        </div>
                        <p className="small text-muted mb-1">
                          {policy.minimumPassedSubjects} pass{policy.minimumPassedSubjects === 1 ? "" : "es"} · average {Number(policy.minimumAverage).toFixed(1)}
                        </p>
                        <p className="small text-muted mb-0">
                          {subjectNames.length > 0 ? `Compulsory: ${subjectNames.join(", ")}` : "No compulsory subjects"}
                        </p>
                      </div>
                      <Link href={`/app/admin/settings/promotion-rules?ruleId=${policy.id}`} className="btn btn-outline-secondary btn-sm">
                        Edit
                      </Link>
                    </div>

                    <div className="d-flex flex-wrap gap-2 mt-3">
                      {!policy.isActive ? (
                        <form action={activatePromotionPolicyAction}>
                          <input type="hidden" name="policyId" value={policy.id} />
                          <Button variant="primary" size="sm" type="submit">
                            Make Active
                          </Button>
                        </form>
                      ) : null}
                      {promotionPolicies.length > 1 ? (
                        <form action={deletePromotionPolicyAction}>
                          <input type="hidden" name="policyId" value={policy.id} />
                          <Button variant="danger" size="sm" type="submit">
                            Delete
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card
          title={selectedPolicy ? `Edit Rule: ${selectedPolicy.name}` : "Create Promotion Rule"}
          subtitle="Example: 5 passes, with at least 2 compulsory subjects earning A."
        >
          <form action={upsertPromotionPolicyAction} className="d-grid gap-3">
            <input type="hidden" name="id" value={selectedPolicy?.id ?? ""} />

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <label className="d-grid gap-1 xl:col-span-2">
                <span className="field-label">Rule Name</span>
                <Input name="name" defaultValue={selectedPolicy?.name ?? ""} placeholder="Senior Secondary Rule" required />
              </label>

              <label className="d-grid gap-1">
                <span className="field-label">Minimum Passed Subjects</span>
                <Input
                  name="minimumPassedSubjects"
                  type="number"
                  min={1}
                  max={50}
                  defaultValue={effectivePolicy.minimumPassedSubjects}
                  required
                />
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
                <Input
                  name="minimumAverage"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  defaultValue={effectivePolicy.minimumAverage}
                  required
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="d-grid gap-1">
                <span className="field-label">Compulsory Subjects At Higher Grade</span>
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

              <label className="d-grid gap-1">
                <span className="field-label">Manual Override</span>
                <Select name="allowManualOverride" defaultValue={effectivePolicy.allowManualOverride ? "on" : "off"}>
                  <option value="on">Allow admin override</option>
                  <option value="off">Only eligible students</option>
                </Select>
              </label>
            </div>

            <div className="d-flex flex-wrap gap-3 align-items-center rounded border bg-white px-3 py-3">
              <label className="d-flex align-items-center gap-2 mb-0">
                <input type="checkbox" name="setActive" value="on" defaultChecked={selectedPolicy?.isActive ?? promotionPolicies.length === 0} />
                <span>Make this the active rule after saving</span>
              </label>
              <span className="small text-muted">The active rule is the one used during promotion.</span>
            </div>

            <div className="d-grid gap-2">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <span className="field-label mb-0">Compulsory Subjects</span>
                <span className="small text-muted">
                  Choose the subjects this rule treats as compulsory for promotion.
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
              <p className="field-label mb-2">Rule Summary</p>
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
                {selectedPolicy ? "Save Rule" : "Create Rule"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Section>
  );
}
