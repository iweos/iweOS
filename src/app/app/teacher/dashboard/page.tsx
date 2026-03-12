import { requireTeacherPortalContext } from "@/lib/server/auth";
import { ProfileRole } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";
import StatCard from "@/components/admin/ui/StatCard";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";

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
    <div className="d-grid gap-3">
      <PageHeader
        title="Teacher Dashboard"
        subtitle={`Active Term: ${activeTerm ? `${activeTerm.sessionLabel} ${activeTerm.termLabel}` : "Not configured"}`}
        rightActions={
          context.actorProfile.role === ProfileRole.ADMIN ? (
            <form method="get" className="d-flex flex-wrap align-items-end gap-2">
              <label className="d-grid gap-1">
                <span className="field-label">View As</span>
                <select name="teacherProfileId" className="form-select form-select-sm" defaultValue={params.teacherProfileId ?? ""}>
                  <option value="">Admin Override (All classes)</option>
                  {context.teacherOptions.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn btn-primary" type="submit">
                Apply
              </button>
            </form>
          ) : null
        }
      />

      <Card subtitle={`Signed in as ${label}`}>
        <div className="row g-3">
          <div className="col-sm-6 col-xl-4">
            <StatCard label="Classes In View" value={assignments.length} icon="fas fa-th-large" cardVariant="secondary" />
          </div>
          <div className="col-sm-6 col-xl-4">
            <StatCard label="Submitted Score Rows" value={totalScores} icon="fas fa-clipboard-check" cardVariant="info" />
          </div>
          <div className="col-sm-6 col-xl-4">
            <StatCard
              label="Portal Mode"
              value={context.mode === "admin_override" ? "Admin" : "Teacher"}
              icon="fas fa-user-tag"
              cardVariant={context.mode === "admin_override" ? "warning" : "success"}
            />
          </div>
        </div>
      </Card>

      <Card title="Classes in View">
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Class</Th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((row) => (
                <tr key={row.id}>
                  <Td>{row.name}</Td>
                </tr>
              ))}
              {assignments.length === 0 && (
                <tr>
                  <Td className="text-muted">No classes available in this view.</Td>
                </tr>
              )}
            </tbody>
          </Table>
        </TableWrap>
      </Card>
    </div>
  );
}
