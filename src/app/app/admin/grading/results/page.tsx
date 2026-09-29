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
import ResultSelectionControl from "@/components/results/ResultSelectionControl";
import ShareResultLinkButton from "@/components/results/ShareResultLinkButton";
import ResultStatusSelect from "@/components/results/ResultStatusSelect";
import AutoSubmitFilters from "@/components/teacher/AutoSubmitFilters";
import { requireRole } from "@/lib/server/auth";
import { setResultPublicationStatusAction } from "@/lib/server/admin-actions";
import { buildResultSharePath, getStudentResultSheet } from "@/lib/server/results";
import { getResultReadinessMap } from "@/lib/server/result-readiness";
import { prisma } from "@/lib/server/prisma";

type AdminResultsSearchParams = {
  termId?: string;
  classId?: string;
  studentId?: string;
  status?: string;
  message?: string;
};

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

  const [publicationRows, resultSheet] =
    selectedTermId && selectedClassId
      ? await Promise.all([
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
      : [[], null];

  const readinessMap =
    selectedTermId && selectedClassId
      ? await getResultReadinessMap({
          schoolId: profile.schoolId,
          termId: selectedTermId,
          classId: selectedClassId,
          studentIds: students.map((student) => student.id),
        })
      : new Map();

  const publicationMap = new Map(publicationRows.map((row) => [row.studentId, row]));
  const publishedCount = students.filter((student) => publicationMap.get(student.id)?.status === "PUBLISHED").length;
  const readyCount = students.filter((student) => readinessMap.get(student.id)?.ready).length;
  const draftCount = Math.max(0, students.length - publishedCount);
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
  const selectedReadiness = selectedStudentId ? readinessMap.get(selectedStudentId) : null;
  const selectedStatusOptions = selectedReadiness?.ready || resultSheet?.publication?.status === "PUBLISHED"
    ? RESULT_STATUS_OPTIONS
    : RESULT_STATUS_OPTIONS.filter((option) => option.value !== "PUBLISHED");

  return (
    <Section className="result-workspace">
      {status && message ? <AdminFlashNotice status={status} message={message} /> : null}
      <PageHeader
        title="Results"
        subtitle="Generate result sheets, publish them, and share secure links when they are ready."
      />

      <div className="result-metrics-row" aria-label="Result summary">
        <StatCard label="Students In View" value={students.length} icon="fas fa-user-graduate" cardVariant="primary" />
        <StatCard label="Ready Results" value={readyCount} icon="fas fa-check-circle" cardVariant="success" />
        <StatCard
          label="Published Results"
          value={publishedCount}
          icon="fas fa-share-square"
          cardVariant="success"
        />
        <StatCard
          label="Draft / Hidden"
          value={draftCount}
          icon="fas fa-lock"
          cardVariant="warning"
        />
      </div>

      <Card className="result-filter-panel" title="Result Filters" subtitle="Choose a term, class, and student to generate the result sheet.">
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
          <div className="result-export-actions">
            {readyCount > 0 ? (
              <Link
                href={`/app/print/results?termId=${selectedTermId}&classId=${selectedClassId}`}
                className="btn btn-secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Export ready class results ({readyCount})
              </Link>
            ) : (
              <span className="btn btn-secondary disabled" aria-disabled="true">
                No complete class results
              </span>
            )}
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

<details className="result-directory-panel result-directory-disclosure">
        <summary><span><strong>Class Result Directory</strong><small>{students.length} students · select a name to view their result</small></span><span className="result-directory-toggle">View <i className="fas fa-chevron-down" aria-hidden="true" /></span></summary>
        <div className="result-directory-content">
        <form
          id="results-bulk-status-form"
          action={setResultPublicationStatusAction}
          className="result-bulk-toolbar"
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
          Select any students below. Publishing only includes students with saved scores for every assigned, non-exempt subject.
        </p>

        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th><ResultSelectionControl formId="results-bulk-status-form" /></Th>
                <Th>Student</Th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                return (
                  <tr key={student.id}>
                    <Td>
                      <input
                        form="results-bulk-status-form"
                        type="checkbox"
                        name="studentIds"
                        value={student.id}
                        aria-label={`Select ${student.fullName}`}
                        data-result-select
                        defaultChecked={student.id === selectedStudentId}
                      />
                    </Td>
                    <Td>
                      <Link
                        href={`/app/admin/grading/results?termId=${selectedTermId}&classId=${selectedClassId}&studentId=${student.id}`}
                        className="fw-semibold"
                      >
                        <span>{student.fullName}</span><small>{student.studentCode}</small>
                      </Link>
                    </Td>
                  </tr>
                );
              })}
              {students.length === 0 ? (
                <tr>
                  <Td colSpan={2}>No enrolled students found for the selected term and class.</Td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </TableWrap>
        </div>
      </details>

      {!selectedTerm || !selectedClass || !resultSheet ? (
        <Card className="result-preview-empty" title="Result Preview">
          <p className="section-subtle mb-0">Choose a valid term, class, and student with saved scores to preview a result sheet.</p>
        </Card>
      ) : (
        <>
          <Card
            className="result-share-panel"
            title="Share Controls"
            subtitle="Use the status dropdown to move this result between draft, published, and unpublished."
          >
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <p className="small text-muted mb-1">Current state</p>
                <p className="mb-0 fw-semibold">{formatStatusLabel(resultSheet.publication?.status)}</p>
                {!selectedReadiness?.ready ? (
                  <p className="result-readiness-note mb-0 mt-2">
                    Complete all assigned subject scores before publishing this result.
                  </p>
                ) : null}
                {shareLink ? <p className="small text-muted mb-0 mt-2">{shareLink}</p> : null}
              </div>
              <div className="d-flex flex-wrap gap-2">
                <ResultStatusSelect
                  action={setResultPublicationStatusAction}
                  termId={resultSheet.term.id}
                  classId={resultSheet.class.id}
                  studentId={resultSheet.student.id}
                  value={resultSheet.publication?.status ?? "DRAFT"}
                  options={selectedStatusOptions}
                />
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

        <ResultSheet data={resultSheet} mode="admin" />
        </>
      )}
    </Section>
  );
}
