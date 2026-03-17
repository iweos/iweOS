import Link from "next/link";
import { headers } from "next/headers";
import AdminFlashNotice from "@/components/admin/AdminFlashNotice";
import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import Section from "@/components/admin/ui/Section";
import Select from "@/components/admin/ui/Select";
import StatCard from "@/components/admin/ui/StatCard";
import ResultSheet from "@/components/results/ResultSheet";
import AutoSubmitFilters from "@/components/teacher/AutoSubmitFilters";
import { requireRole } from "@/lib/server/auth";
import { setResultPublicationStatusAction } from "@/lib/server/admin-actions";
import { buildResultSharePath, getStudentResultSheet } from "@/lib/server/results";
import { prisma } from "@/lib/server/prisma";

type AdminResultsSearchParams = {
  termId?: string;
  classId?: string;
  studentId?: string;
  status?: string;
  message?: string;
};

function formatNumber(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : "-";
}

export default async function AdminGradingResultsPage({
  searchParams,
}: {
  searchParams: Promise<AdminResultsSearchParams>;
}) {
  const profile = await requireRole("admin");
  const params = await searchParams;
  const status = params.status === "success" || params.status === "error" ? params.status : null;
  const message = (params.message ?? "").trim();

  const [terms, classes] = await Promise.all([
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

  const selectedTermId =
    params.termId && terms.some((term) => term.id === params.termId)
      ? params.termId
      : terms.find((term) => term.isActive)?.id ?? terms[0]?.id ?? "";
  const selectedClassId =
    params.classId && classes.some((klass) => klass.id === params.classId) ? params.classId : classes[0]?.id ?? "";

  const enrollments =
    selectedTermId && selectedClassId
      ? await prisma.enrollment.findMany({
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
        })
      : [];

  const students = enrollments.map((entry) => entry.student);
  const selectedStudentId =
    params.studentId && students.some((student) => student.id === params.studentId) ? params.studentId : students[0]?.id ?? "";

  const [scores, publicationRows, resultSheet] =
    selectedTermId && selectedClassId
      ? await Promise.all([
          prisma.score.findMany({
            where: {
              schoolId: profile.schoolId,
              termId: selectedTermId,
              classId: selectedClassId,
              studentId: { in: students.map((student) => student.id) },
            },
            select: {
              studentId: true,
              total: true,
              grade: true,
            },
          }),
          prisma.resultPublication.findMany({
            where: {
              schoolId: profile.schoolId,
              termId: selectedTermId,
              classId: selectedClassId,
              studentId: { in: students.map((student) => student.id) },
            },
            select: {
              studentId: true,
              status: true,
              shareToken: true,
            },
          }),
          selectedStudentId
            ? getStudentResultSheet({
                schoolId: profile.schoolId,
                termId: selectedTermId,
                classId: selectedClassId,
                studentId: selectedStudentId,
              })
            : Promise.resolve(null),
        ])
      : [[], [], null];

  const scoreMap = new Map<string, { average: number; grade: string }>();
  for (const student of students) {
    const rows = scores.filter((row) => row.studentId === student.id);
    const average = rows.length > 0 ? rows.reduce((sum, row) => sum + Number(row.total), 0) / rows.length : 0;
    scoreMap.set(student.id, {
      average,
      grade: rows[0]?.grade ?? "-",
    });
  }

  const publicationMap = new Map(publicationRows.map((row) => [row.studentId, row]));
  const selectedTerm = terms.find((term) => term.id === selectedTermId) ?? null;
  const selectedClass = classes.find((klass) => klass.id === selectedClassId) ?? null;
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const baseUrl = host ? `${protocol}://${host}` : "";
  const shareLink =
    resultSheet?.publication?.shareToken && resultSheet.publication.status === "PUBLISHED"
      ? `${baseUrl}${buildResultSharePath(resultSheet.publication.shareToken)}`
      : null;

  return (
    <Section>
      {status && message ? <AdminFlashNotice status={status} message={message} /> : null}
      <PageHeader
        title="Results"
        subtitle="Generate result sheets, publish them, and share a secure link when they are ready."
        rightActions={
          selectedTermId && selectedClassId && selectedStudentId ? (
            <Link
              href={`/app/admin/grading/results/print?termId=${selectedTermId}&classId=${selectedClassId}&studentId=${selectedStudentId}`}
              className="btn btn-secondary"
            >
              Open print view
            </Link>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students In View" value={students.length} icon="fas fa-user-graduate" cardVariant="primary" />
        <StatCard
          label="Published Results"
          value={publicationRows.filter((item) => item.status === "PUBLISHED").length}
          icon="fas fa-share-square"
          cardVariant="success"
        />
        <StatCard
          label="Draft / Hidden"
          value={publicationRows.filter((item) => item.status !== "PUBLISHED").length}
          icon="fas fa-lock"
          cardVariant="warning"
        />
        <StatCard
          label="Selected Result"
          value={resultSheet ? resultSheet.student.fullName : "None"}
          icon="fas fa-file-alt"
          cardVariant="info"
        />
      </div>

      <Card title="Result Filters" subtitle="Choose a term, class, and student to generate the result sheet.">
        <form method="get" className="grid gap-3 md:grid-cols-4">
          <label className="d-grid gap-1">
            <span className="field-label">Term</span>
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
          <label className="d-grid gap-1">
            <span className="field-label">Student</span>
            <Select name="studentId" defaultValue={selectedStudentId}>
              {students.length === 0 ? <option value="">No students found</option> : null}
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.studentCode} - {student.fullName}
                </option>
              ))}
            </Select>
          </label>
          <div className="align-self-end">
            <AutoSubmitFilters />
          </div>
        </form>
      </Card>

      <Card title="Class Result Directory" subtitle="Use this table to see which students already have a published share link.">
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Average</Th>
                <Th>Grade</Th>
                <Th>Status</Th>
                <Th>Share</Th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const publication = publicationMap.get(student.id);
                const score = scoreMap.get(student.id);
                return (
                  <tr key={student.id}>
                    <Td>{student.studentCode} - {student.fullName}</Td>
                    <Td>{formatNumber(score?.average ?? 0)}</Td>
                    <Td>{score?.grade ?? "-"}</Td>
                    <Td>{publication?.status ?? "DRAFT"}</Td>
                    <Td>
                      {publication?.status === "PUBLISHED" ? (
                        <Link href={buildResultSharePath(publication.shareToken)} target="_blank" className="btn btn-sm btn-secondary">
                          Open link
                        </Link>
                      ) : (
                        <span className="small text-muted">Not shared</span>
                      )}
                    </Td>
                  </tr>
                );
              })}
              {students.length === 0 ? (
                <tr>
                  <Td colSpan={5}>No enrolled students found for the selected term and class.</Td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </TableWrap>
      </Card>

      {!selectedTerm || !selectedClass || !resultSheet ? (
        <Card title="Result Preview">
          <p className="section-subtle mb-0">Choose a valid term, class, and student with saved scores to preview a result sheet.</p>
        </Card>
      ) : (
        <>
          <Card title="Share Controls" subtitle="Publish to enable the secure share link, or unpublish to hide it again.">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <p className="small text-muted mb-1">Current state</p>
                <p className="mb-0 fw-semibold">{resultSheet.publication?.status ?? "DRAFT"}</p>
                {shareLink ? <p className="small text-muted mb-0 mt-2">{shareLink}</p> : null}
              </div>
              <div className="d-flex flex-wrap gap-2">
                <form action={setResultPublicationStatusAction}>
                  <input type="hidden" name="studentId" value={resultSheet.student.id} />
                  <input type="hidden" name="termId" value={resultSheet.term.id} />
                  <input type="hidden" name="classId" value={resultSheet.class.id} />
                  <input type="hidden" name="status" value="PUBLISHED" />
                  <button className="btn btn-primary" type="submit">
                    Publish result
                  </button>
                </form>
                <form action={setResultPublicationStatusAction}>
                  <input type="hidden" name="studentId" value={resultSheet.student.id} />
                  <input type="hidden" name="termId" value={resultSheet.term.id} />
                  <input type="hidden" name="classId" value={resultSheet.class.id} />
                  <input type="hidden" name="status" value="UNPUBLISHED" />
                  <button className="btn btn-secondary" type="submit">
                    Unpublish
                  </button>
                </form>
                {shareLink ? (
                  <Link href={buildResultSharePath(resultSheet.publication?.shareToken ?? "")} target="_blank" className="btn btn-secondary">
                    Open shared result
                  </Link>
                ) : null}
              </div>
            </div>
          </Card>

          <ResultSheet data={resultSheet} mode="admin" />
        </>
      )}
    </Section>
  );
}
