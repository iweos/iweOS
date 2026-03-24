import { ProfileRole } from "@prisma/client";
import AdminFlashNotice from "@/components/admin/AdminFlashNotice";
import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";
import Select from "@/components/admin/ui/Select";
import StatCard from "@/components/admin/ui/StatCard";
import StudentCommentTable from "@/components/grading/StudentCommentTable";
import AdminTeacherWorkspaceActions from "@/components/teacher/AdminTeacherWorkspaceActions";
import AutoSubmitFilters from "@/components/teacher/AutoSubmitFilters";
import { requireTeacherPortalContext } from "@/lib/server/auth";
import { saveStudentCommentAction } from "@/lib/server/teacher-actions";
import { isPrismaSchemaMismatchError } from "@/lib/server/prisma-errors";
import { prisma } from "@/lib/server/prisma";

type TeacherCommentSearchParams = {
  teacherProfileId?: string;
  termId?: string;
  classId?: string;
  status?: string;
  message?: string;
};

export default async function TeacherCommentPage({
  searchParams,
}: {
  searchParams: Promise<TeacherCommentSearchParams>;
}) {
  const params = await searchParams;
  const status = params.status === "success" || params.status === "error" ? params.status : null;
  const message = (params.message ?? "").trim();
  const context = await requireTeacherPortalContext(params.teacherProfileId);

  let terms: Array<{ id: string; sessionLabel: string; termLabel: string; isActive: boolean }> = [];
  let classesInView: Array<{ id: string; name: string }> = [];

  try {
    [terms, classesInView] = await Promise.all([
      prisma.term.findMany({
        where: { schoolId: context.actorProfile.schoolId },
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
        select: { id: true, sessionLabel: true, termLabel: true, isActive: true },
      }),
      context.mode === "admin_override"
        ? prisma.class.findMany({
            where: { schoolId: context.actorProfile.schoolId },
            orderBy: { name: "asc" },
            select: { id: true, name: true },
          })
        : prisma.teacherClassAssignment
            .findMany({
              where: {
                schoolId: context.actorProfile.schoolId,
                teacherProfileId: context.effectiveTeacherProfile.id,
              },
              include: { class: true },
              orderBy: { class: { name: "asc" } },
            })
            .then((rows) => rows.map((row) => row.class)),
    ]);
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return (
        <section className="section-panel space-y-2">
          <p className="section-kicker">Teacher Portal</p>
          <h1 className="section-title">Comment Setup Required</h1>
          <p className="section-subtle">
            Production is missing the latest comment schema. Run <code>npx prisma migrate deploy</code> against the
            production database, then redeploy the app.
          </p>
        </section>
      );
    }
    throw error;
  }

  const selectedTermId = params.termId && terms.some((term) => term.id === params.termId) ? params.termId : terms[0]?.id ?? "";
  const selectedClassId =
    params.classId && classesInView.some((klass) => klass.id === params.classId) ? params.classId : classesInView[0]?.id ?? "";

  const [enrollments, comments] =
    selectedTermId && selectedClassId
      ? await Promise.all([
          prisma.enrollment.findMany({
            where: {
              schoolId: context.actorProfile.schoolId,
              termId: selectedTermId,
              classId: selectedClassId,
              student: {
                is: {
                  status: "active",
                },
              },
            },
            orderBy: { student: { fullName: "asc" } },
            select: {
              student: {
                select: {
                  id: true,
                  studentCode: true,
                  fullName: true,
                },
              },
            },
          }),
          prisma.studentComment.findMany({
            where: {
              schoolId: context.actorProfile.schoolId,
              termId: selectedTermId,
              classId: selectedClassId,
            },
            select: {
              studentId: true,
              comment: true,
            },
          }),
        ])
      : [[], []];

  const commentMap = new Map(comments.map((item) => [item.studentId, item.comment]));
  const rows = enrollments.map((entry) => ({
    studentId: entry.student.id,
    studentCode: entry.student.studentCode,
    fullName: entry.student.fullName,
    comment: commentMap.get(entry.student.id) ?? "",
  }));
  const studentsWithComment = rows.filter((row) => row.comment.trim().length > 0).length;

  return (
    <>
      {status && message ? <AdminFlashNotice status={status} message={message} /> : null}
      <section className="section-panel space-y-3">
        <PageHeader
          title="Comment"
          subtitle={
            context.mode === "admin_override"
              ? "Admin override: manage class teacher comments across classes."
              : `Working as: ${context.effectiveTeacherProfile.fullName}`
          }
          rightActions={<AdminTeacherWorkspaceActions mode={context.mode} />}
        />

        <form method="get" className="grid gap-2 md:grid-cols-4">
          {context.actorProfile.role === ProfileRole.ADMIN ? (
            <label className="space-y-1">
              <span className="field-label">View As</span>
              <select className="select" name="teacherProfileId" defaultValue={params.teacherProfileId ?? ""}>
                <option value="">Admin Override</option>
                {context.teacherOptions.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.fullName}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="space-y-1">
            <span className="field-label">Term</span>
            <Select name="termId" defaultValue={selectedTermId}>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.sessionLabel} {term.termLabel} {term.isActive ? "(Active)" : ""}
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-1">
            <span className="field-label">Class</span>
            <Select name="classId" defaultValue={selectedClassId}>
              {classesInView.map((klass) => (
                <option key={klass.id} value={klass.id}>
                  {klass.name}
                </option>
              ))}
            </Select>
          </label>

          <div className="self-end">
            <AutoSubmitFilters />
          </div>
        </form>
      </section>

      <section className="section-panel space-y-3">
        <div className="row g-3">
          <div className="col-12 col-md-6 col-xl-4">
            <StatCard label="Students In View" value={rows.length} icon="fas fa-user-graduate" cardVariant="primary" />
          </div>
          <div className="col-12 col-md-6 col-xl-4">
            <StatCard label="Comments Saved" value={studentsWithComment} icon="fas fa-comment-dots" cardVariant="success" />
          </div>
          <div className="col-12 col-md-6 col-xl-4">
            <StatCard label="Pending Comments" value={Math.max(rows.length - studentsWithComment, 0)} icon="fas fa-hourglass-half" cardVariant="warning" />
          </div>
        </div>

        <Card title="Class Teacher Comments" subtitle="Sort the table, edit each student comment, and save it directly into the result sheet.">
          <StudentCommentTable
            rows={rows}
            termId={selectedTermId}
            classId={selectedClassId}
            saveAction={saveStudentCommentAction}
            placeholder="Enter class teacher comment"
          />
        </Card>
      </section>
    </>
  );
}
