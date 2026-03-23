import AdminFlashNotice from "@/components/admin/AdminFlashNotice";
import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";
import Select from "@/components/admin/ui/Select";
import StatCard from "@/components/admin/ui/StatCard";
import StudentCommentTable from "@/components/grading/StudentCommentTable";
import AutoSubmitFilters from "@/components/teacher/AutoSubmitFilters";
import { requireRole } from "@/lib/server/auth";
import { upsertStudentCommentAction } from "@/lib/server/admin-actions";
import { isPrismaSchemaMismatchError, schemaSyncMessage } from "@/lib/server/prisma-errors";
import { prisma } from "@/lib/server/prisma";

type CommentSearchParams = {
  termId?: string;
  classId?: string;
  status?: string;
  message?: string;
};

export default async function AdminGradingCommentPage({
  searchParams,
}: {
  searchParams: Promise<CommentSearchParams>;
}) {
  const profile = await requireRole("admin");
  const params = await searchParams;
  const status = params.status === "success" || params.status === "error" ? params.status : null;
  const message = (params.message ?? "").trim();

  let terms: Array<{ id: string; sessionLabel: string; termLabel: string; isActive: boolean }> = [];
  let classes: Array<{ id: string; name: string }> = [];
  let enrollments: Array<{ student: { id: string; studentCode: string; fullName: string } }> = [];
  let comments: Array<{ studentId: string; comment: string }> = [];

  try {
    [terms, classes] = await Promise.all([
      prisma.term.findMany({
        where: { schoolId: profile.schoolId },
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
        select: { id: true, sessionLabel: true, termLabel: true, isActive: true },
      }),
      prisma.class.findMany({
        where: { schoolId: profile.schoolId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return (
        <Section>
          <PageHeader title="Comment Setup Required" subtitle="Comment schema is out of sync for this environment." />
          <Card>
            <p className="small text-muted">{schemaSyncMessage("Comment")}</p>
          </Card>
        </Section>
      );
    }
    throw error;
  }

  const selectedTermId =
    params.termId && terms.some((term) => term.id === params.termId)
      ? params.termId
      : terms.find((term) => term.isActive)?.id ?? terms[0]?.id ?? "";
  const selectedClassId =
    params.classId && classes.some((klass) => klass.id === params.classId) ? params.classId : classes[0]?.id ?? "";

  if (selectedTermId && selectedClassId) {
    try {
      [enrollments, comments] = await Promise.all([
        prisma.enrollment.findMany({
          where: {
            schoolId: profile.schoolId,
            termId: selectedTermId,
            classId: selectedClassId,
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
            schoolId: profile.schoolId,
            termId: selectedTermId,
            classId: selectedClassId,
          },
          select: {
            studentId: true,
            comment: true,
          },
        }),
      ]);
    } catch (error) {
      if (isPrismaSchemaMismatchError(error)) {
        return (
          <Section>
            <PageHeader title="Comment Setup Required" subtitle="Comment schema is out of sync for this environment." />
            <Card>
              <p className="small text-muted">{schemaSyncMessage("Comment")}</p>
            </Card>
          </Section>
        );
      }
      throw error;
    }
  }

  const commentMap = new Map(comments.map((item) => [item.studentId, item.comment]));
  const rows = enrollments.map((entry) => ({
    studentId: entry.student.id,
    studentCode: entry.student.studentCode,
    fullName: entry.student.fullName,
    comment: commentMap.get(entry.student.id) ?? "",
  }));
  const studentsWithComment = rows.filter((row) => row.comment.trim().length > 0).length;
  const longestComment = rows.reduce((max, row) => Math.max(max, row.comment.trim().length), 0);

  return (
    <Section>
      {status && message ? <AdminFlashNotice status={status} message={message} /> : null}
      <PageHeader
        title="Comment"
        subtitle="Sort students, write result comments inline, and keep each session term’s remarks tied to the correct student."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students In View" value={rows.length} icon="fas fa-user-graduate" cardVariant="primary" />
        <StatCard label="Comments Saved" value={studentsWithComment} icon="fas fa-comment-dots" cardVariant="success" />
        <StatCard label="Pending Comments" value={Math.max(rows.length - studentsWithComment, 0)} icon="fas fa-hourglass-half" cardVariant="warning" />
        <StatCard label="Longest Comment" value={longestComment} icon="fas fa-align-left" cardVariant="info" />
      </div>

      <Card title="Comment Filters" subtitle="Choose the session term and class you want to update.">
        <form method="get" className="grid gap-3 md:grid-cols-3">
          <label className="d-grid gap-1">
            <span className="field-label">Session term</span>
            <Select name="termId" defaultValue={selectedTermId}>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.sessionLabel} {term.termLabel} {term.isActive ? "(Active)" : ""}
                </option>
              ))}
            </Select>
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Class</span>
            <Select name="classId" defaultValue={selectedClassId}>
              {classes.map((klass) => (
                <option key={klass.id} value={klass.id}>
                  {klass.name}
                </option>
              ))}
            </Select>
          </label>
          <div className="align-self-end">
            <AutoSubmitFilters />
          </div>
        </form>
      </Card>

      <Card title="Student Comments" subtitle="Sort the table by code, name, or comment content, then save each student’s final comment.">
        <StudentCommentTable rows={rows} termId={selectedTermId} classId={selectedClassId} saveAction={upsertStudentCommentAction} />
      </Card>
    </Section>
  );
}
