import { requireTeacherPortalContext } from "@/lib/server/auth";
import { ProfileRole } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";

type TeacherResultsSearchParams = {
  teacherProfileId?: string;
};

export default async function TeacherResultsPage({
  searchParams,
}: {
  searchParams: Promise<TeacherResultsSearchParams>;
}) {
  const params = await searchParams;
  const context = await requireTeacherPortalContext(params.teacherProfileId);

  const rows =
    context.mode === "admin_override"
      ? await prisma.score.findMany({
          where: {
            schoolId: context.actorProfile.schoolId,
          },
          include: {
            student: true,
            class: true,
            subject: true,
            term: true,
            teacherProfile: true,
          },
          orderBy: [{ term: { createdAt: "desc" } }, { class: { name: "asc" } }, { student: { fullName: "asc" } }],
          take: 300,
        })
      : await prisma.score.findMany({
          where: {
            schoolId: context.actorProfile.schoolId,
            teacherProfileId: context.effectiveTeacherProfile.id,
          },
          include: {
            student: true,
            class: true,
            subject: true,
            term: true,
            teacherProfile: true,
          },
          orderBy: [{ term: { createdAt: "desc" } }, { class: { name: "asc" } }, { student: { fullName: "asc" } }],
          take: 300,
        });

  return (
    <section className="section-panel table-wrap">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-kicker">Teacher Portal</p>
          <h1 className="section-title">Results</h1>
          <p className="section-subtle">
            {context.mode === "admin_override"
              ? "Showing latest scores across the school"
              : `Showing scores submitted by ${context.effectiveTeacherProfile.fullName}`}
          </p>
        </div>
        {context.actorProfile.role === ProfileRole.ADMIN && (
          <form method="get" className="flex items-end gap-2">
            <label className="space-y-1">
              <span className="field-label">View As</span>
              <select name="teacherProfileId" className="select" defaultValue={params.teacherProfileId ?? ""}>
                <option value="">Admin Override</option>
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

      <table>
        <thead>
          <tr>
            <th>Term</th>
            <th>Class</th>
            <th>Student</th>
            <th>Subject</th>
            <th>CA1</th>
            <th>CA2</th>
            <th>Exam</th>
            <th>Total</th>
            <th>Grade</th>
            <th>By</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                {row.term.sessionLabel} {row.term.termLabel}
              </td>
              <td>{row.class.name}</td>
              <td>{row.student.fullName}</td>
              <td>{row.subject.name}</td>
              <td>{row.ca1.toString()}</td>
              <td>{row.ca2.toString()}</td>
              <td>{row.exam.toString()}</td>
              <td>{row.total.toString()}</td>
              <td>{row.grade ?? "-"}</td>
              <td>{row.teacherProfile.fullName}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={10}>No score rows in this view.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
