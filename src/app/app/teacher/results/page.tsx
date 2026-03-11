import { requireTeacherPortalContext } from "@/lib/server/auth";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
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

      <TableWrap>
        <Table>
        <thead>
          <tr>
            <Th>Term</Th>
            <Th>Class</Th>
            <Th>Student</Th>
            <Th>Subject</Th>
            <Th>CA1</Th>
            <Th>CA2</Th>
            <Th>Exam</Th>
            <Th>Total</Th>
            <Th>Grade</Th>
            <Th>By</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <Td>
                {row.term.sessionLabel} {row.term.termLabel}
              </Td>
              <Td>{row.class.name}</Td>
              <Td>{row.student.fullName}</Td>
              <Td>{row.subject.name}</Td>
              <Td>{row.ca1.toString()}</Td>
              <Td>{row.ca2.toString()}</Td>
              <Td>{row.exam.toString()}</Td>
              <Td>{row.total.toString()}</Td>
              <Td>{row.grade ?? "-"}</Td>
              <Td>{row.teacherProfile.fullName}</Td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <Td colSpan={10}>No score rows in this view.</Td>
            </tr>
          )}
        </tbody>
        </Table>
      </TableWrap>
    </section>
  );
}
