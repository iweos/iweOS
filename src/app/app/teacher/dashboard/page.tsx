import { requireTeacherPortalContext } from "@/lib/server/auth";
import { ProfileRole } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";

type TeacherDashboardSearchParams = {
  teacherProfileId?: string;
};

export default async function TeacherDashboardPage({
  searchParams,
}: {
  searchParams: Promise<TeacherDashboardSearchParams>;
}) {
  const params = await searchParams;
  const context = await requireTeacherPortalContext(params.teacherProfileId);

  const [activeTerm, assignments, totalScores] = await Promise.all([
    prisma.term.findFirst({
      where: {
        schoolId: context.actorProfile.schoolId,
        isActive: true,
      },
    }),
    context.mode === "admin_override"
      ? prisma.class.findMany({
          where: { schoolId: context.actorProfile.schoolId },
          orderBy: { name: "asc" },
        })
      : prisma.teacherClassAssignment.findMany({
          where: {
            schoolId: context.actorProfile.schoolId,
            teacherProfileId: context.effectiveTeacherProfile.id,
          },
          include: { class: true },
          orderBy: { class: { name: "asc" } },
        }).then((rows) => rows.map((row) => row.class)),
    context.mode === "admin_override"
      ? prisma.score.count({ where: { schoolId: context.actorProfile.schoolId } })
      : prisma.score.count({
          where: {
            schoolId: context.actorProfile.schoolId,
            teacherProfileId: context.effectiveTeacherProfile.id,
          },
        }),
  ]);

  const label =
    context.mode === "admin_override"
      ? "Admin Override (All Classes)"
      : context.effectiveTeacherProfile.fullName;

  return (
    <>
      <section className="section-panel space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="section-kicker">Teacher Portal</p>
            <h1 className="section-title">{label}</h1>
            <p className="section-subtle">
              Active Term: {activeTerm ? `${activeTerm.sessionLabel} ${activeTerm.termLabel}` : "Not configured"}
            </p>
          </div>
          {context.actorProfile.role === ProfileRole.ADMIN && (
            <form method="get" className="flex items-end gap-2">
              <label className="space-y-1">
                <span className="field-label">View As</span>
                <select name="teacherProfileId" className="select" defaultValue={params.teacherProfileId ?? ""}>
                  <option value="">Admin Override (All classes)</option>
                  {context.teacherOptions.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn btn-muted" type="submit">
                Apply
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="section-panel">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <article className="metric-card">
            <p className="metric-label">Classes In View</p>
            <p className="metric-value">{assignments.length}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Submitted Score Rows</p>
            <p className="metric-value">{totalScores}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Portal Mode</p>
            <p className="metric-value text-base leading-6">
              {context.mode === "admin_override" ? "Admin" : "Teacher"}
            </p>
          </article>
        </div>
      </section>

      <section className="section-panel">
        <h2 className="section-heading">Classes</h2>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[#374151]">
          {assignments.map((row) => (
            <li key={row.id}>{row.name}</li>
          ))}
          {assignments.length === 0 && <li>No classes available in this view.</li>}
        </ul>
      </section>
    </>
  );
}
