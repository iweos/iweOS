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
import ShareResultLinkButton from "@/components/results/ShareResultLinkButton";
import AutoSubmitFilters from "@/components/teacher/AutoSubmitFilters";
import { requireRole } from "@/lib/server/auth";
import { setResultPublicationStatusAction } from "@/lib/server/admin-actions";
import { buildResultSharePath, getStudentResultSheet } from "@/lib/server/results";
import { prisma } from "@/lib/server/prisma";
import { getStudentSubjectExemptionKeySet, isStudentSubjectExempt } from "@/lib/server/student-subject-exemptions";

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

function formatStatusLabel(status?: string | null) {
  if (!status) {
    return "Draft";
  }

  return status.charAt(0) + status.slice(1).toLowerCase();
}

const RESULT_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "UNPUBLISHED", label: "Unpublished" },
] as const;

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

  const [scores, publicationRows, resultSheet, exemptionKeys] =
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
              subjectId: true,
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
          getStudentSubjectExemptionKeySet({
            schoolId: profile.schoolId,
            classId: selectedClassId,
            studentIds: students.map((student) => student.id),
          }),
        ])
      : [[], [], null, new Set<string>()];

  const filteredScores = scores.filter(
    (score) => !isStudentSubjectExempt(exemptionKeys, selectedClassId, score.studentId, score.subjectId),
  );

  const scoreMap = new Map<string, { average: number; grade: string }>();
  for (const student of students) {
    const rows = filteredScores.filter((row) => row.studentId === student.id);
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
        subtitle="Generate result sheets, publish them, and share secure links when they are ready."
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

        {selectedTermId && selectedClassId ? (
          <div className="mt-4 d-flex flex-wrap gap-2 border-top pt-3">
            <Link
              href={`/app/print/results?termId=${selectedTermId}&classId=${selectedClassId}`}
              className="btn btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Export class result
            </Link>
            {selectedStudentId ? (
              <Link
                href={`/app/print/results?termId=${selectedTermId}&classId=${selectedClassId}&studentId=${selectedStudentId}`}
                className="btn btn-outline-secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Export student result
              </Link>
            ) : null}
          </div>
        ) : null}
      </Card>

      <Card
        title="Class Result Directory"
        subtitle="Tick a few students or the whole set, then move results between draft, published, and unpublished."
      >
        <form
          id="results-bulk-status-form"
          action={setResultPublicationStatusAction}
          className="d-flex flex-wrap align-items-end justify-content-between gap-3"
        >
          <input type="hidden" name="termId" value={selectedTermId} />
          <input type="hidden" name="classId" value={selectedClassId} />

          <div className="d-flex flex-wrap align-items-end gap-2">
            <label className="d-grid gap-1">
              <span className="field-label">Bulk status</span>
              <Select name="status" defaultValue="PUBLISHED">
                {RESULT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </label>
            <button className="btn btn-primary" type="submit" disabled={students.length === 0}>
              Apply to selected
            </button>
          </div>
        </form>

        <p className="small text-muted mt-3 mb-3">
          Checked students with saved scores will be updated together. Students without score rows are skipped and called out in the popup.
        </p>

        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Select</Th>
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
                    <Td>
                      <input
                        form="results-bulk-status-form"
                        type="checkbox"
                        name="studentIds"
                        value={student.id}
                        defaultChecked={student.id === selectedStudentId}
                      />
                    </Td>
                    <Td>
                      <Link
                        href={`/app/admin/grading/results?termId=${selectedTermId}&classId=${selectedClassId}&studentId=${student.id}`}
                        className="fw-semibold"
                      >
                        {student.studentCode} - {student.fullName}
                      </Link>
                    </Td>
                    <Td>{formatNumber(score?.average ?? 0)}</Td>
                    <Td>{score?.grade ?? "-"}</Td>
                    <Td>
                      <form action={setResultPublicationStatusAction} className="d-flex flex-wrap align-items-center gap-2">
                        <input type="hidden" name="studentIds" value={student.id} />
                        <input type="hidden" name="termId" value={selectedTermId} />
                        <input type="hidden" name="classId" value={selectedClassId} />
                        <Select name="status" defaultValue={publication?.status ?? "DRAFT"}>
                          {RESULT_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                        <button className="btn btn-sm btn-secondary" type="submit">
                          Save
                        </button>
                      </form>
                    </Td>
                    <Td>
                      {publication?.status === "PUBLISHED" ? (
                        <div className="d-flex flex-wrap gap-2">
                          <Link href={buildResultSharePath(publication.shareToken)} target="_blank" className="btn btn-sm btn-secondary">
                            Open link
                          </Link>
                          <ShareResultLinkButton
                            href={`${baseUrl}${buildResultSharePath(publication.shareToken)}`}
                            title={`${student.fullName} result`}
                            text={`${student.fullName}'s published result`}
                            className="btn btn-sm btn-primary"
                          />
                        </div>
                      ) : (
                        <span className="small text-muted">{formatStatusLabel(publication?.status)} only</span>
                      )}
                    </Td>
                  </tr>
                );
              })}
              {students.length === 0 ? (
                <tr>
                  <Td colSpan={6}>No enrolled students found for the selected term and class.</Td>
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
          <Card
            title="Share Controls"
            subtitle="Use the status dropdown to move this result between draft, published, and unpublished."
          >
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <p className="small text-muted mb-1">Current state</p>
                <p className="mb-0 fw-semibold">{formatStatusLabel(resultSheet.publication?.status)}</p>
                {shareLink ? <p className="small text-muted mb-0 mt-2">{shareLink}</p> : null}
              </div>
              <div className="d-flex flex-wrap gap-2">
                <form action={setResultPublicationStatusAction} className="d-flex flex-wrap align-items-center gap-2">
                  <input type="hidden" name="studentIds" value={resultSheet.student.id} />
                  <input type="hidden" name="termId" value={resultSheet.term.id} />
                  <input type="hidden" name="classId" value={resultSheet.class.id} />
                  <Select name="status" defaultValue={resultSheet.publication?.status ?? "DRAFT"}>
                    {RESULT_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                  <button className="btn btn-primary" type="submit">
                    Save status
                  </button>
                </form>
                {shareLink ? (
                  <>
                    <Link href={buildResultSharePath(resultSheet.publication?.shareToken ?? "")} target="_blank" className="btn btn-secondary">
                      Open shared result
                    </Link>
                    <ShareResultLinkButton
                      href={shareLink}
                      title={`${resultSheet.student.fullName} result`}
                      text={`${resultSheet.student.fullName}'s published result`}
                      className="btn btn-primary"
                    />
                  </>
                ) : null}
              </div>
            </div>
          </Card>

        <ResultSheet data={resultSheet} mode="admin" variant="default" />
        </>
      )}
    </Section>
  );
}
