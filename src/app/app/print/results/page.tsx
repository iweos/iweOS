import Link from "next/link";
import DownloadPdfButton from "@/components/results/DownloadPdfButton";
import PrintButton from "@/components/results/PrintButton";
import ResultSheet from "@/components/results/ResultSheet";
import SharePdfButton from "@/components/results/SharePdfButton";
import { requireRole } from "@/lib/server/auth";
import { buildClassResultFileName, buildStudentResultFileName } from "@/lib/result-export-name";
import { getStudentResultSheet } from "@/lib/server/results";
import { getResultReadinessMap } from "@/lib/server/result-readiness";
import { prisma } from "@/lib/server/prisma";

type PrintResultsSearchParams = {
  termId?: string;
  classId?: string;
  studentId?: string;
};

export default async function AdminResultExportPage({
  searchParams,
}: {
  searchParams: Promise<PrintResultsSearchParams>;
}) {
  const profile = await requireRole("admin");
  const params = await searchParams;

  if (!params.termId || !params.classId) {
    return (
      <main className="container py-4">
        <p className="section-subtle mb-0">Select a term and class first before opening the export view.</p>
      </main>
    );
  }

  const studentIds = params.studentId
    ? [params.studentId]
    : (
        await prisma.enrollment.findMany({
          where: {
            schoolId: profile.schoolId,
            termId: params.termId,
            classId: params.classId,
          },
          orderBy: { student: { fullName: "asc" } },
          select: { studentId: true },
        })
      ).map((item) => item.studentId);

  const generatedSheets = (
    await Promise.all(
      studentIds.map((studentId) =>
        getStudentResultSheet({
          schoolId: profile.schoolId,
          termId: params.termId!,
          classId: params.classId!,
          studentId,
        }),
      ),
    )
  ).filter((sheet): sheet is NonNullable<typeof sheet> => Boolean(sheet));
  const readinessMap = params.studentId
    ? null
    : await getResultReadinessMap({
        schoolId: profile.schoolId,
        classId: params.classId,
        termId: params.termId,
        studentIds,
      });
  const resultSheets = generatedSheets.filter((sheet) => params.studentId || readinessMap?.get(sheet.student.id)?.ready);
  const skippedCount = generatedSheets.length - resultSheets.length;

  if (resultSheets.length === 0) {
    return (
      <main className="container py-4">
        <p className="section-subtle mb-0">No complete results are available for the selected class and term.</p>
      </main>
    );
  }

  const exportTitle =
    resultSheets.length === 1
      ? buildStudentResultFileName({
          studentName: resultSheets[0].student.fullName,
          className: resultSheets[0].class.name,
          sessionLabel: resultSheets[0].term.sessionLabel,
          termLabel: resultSheets[0].term.termLabel,
        })
      : buildClassResultFileName({
          className: resultSheets[0]?.class.name ?? "class",
          sessionLabel: resultSheets[0]?.term.sessionLabel ?? "session",
          termLabel: resultSheets[0]?.term.termLabel ?? "term",
        });
  const studentFileNames = resultSheets.map((resultSheet) =>
    buildStudentResultFileName({
      studentName: resultSheet.student.fullName,
      className: resultSheet.class.name,
      sessionLabel: resultSheet.term.sessionLabel,
      termLabel: resultSheet.term.termLabel,
    }),
  );
  const isBulkExport = resultSheets.length > 1;

  return (
    <main className="container py-4 py-md-5 d-grid gap-4">
      <section className="shared-result-shell admin-page-wrap">
        <div className="card border-0 shadow-sm shared-result-hero print-hidden">
          <div className="card-body p-3 p-md-4">
            <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
              <div>
                <p className="section-kicker">Result export</p>
                <h1 className="section-title mb-2">{resultSheets[0]?.school.name}</h1>
                <p className="section-subtle mb-0">
                  {isBulkExport ? `${resultSheets.length} student results` : resultSheets[0].student.fullName} · {resultSheets[0].class.name} · {resultSheets[0].term.sessionLabel} {resultSheets[0].term.termLabel}
                </p>
                {skippedCount > 0 ? <p className="result-export-warning mb-0">{skippedCount} incomplete result{skippedCount === 1 ? " was" : "s were"} excluded.</p> : null}
              </div>
              <div className="result-export-toolbar" role="group" aria-label="Result document actions">
                <Link
                  href={`/app/admin/grading/results?termId=${params.termId}&classId=${params.classId}${params.studentId ? `&studentId=${params.studentId}` : ""}`}
                  className="result-export-icon" aria-label="Back to results" title="Back to results"
                >
                  <i className="fas fa-arrow-left" aria-hidden="true" />
                </Link>
                {!isBulkExport ? <SharePdfButton fileName={exportTitle} iconOnly /> : null}
                <DownloadPdfButton
                  iconOnly
                  fileName={isBulkExport ? undefined : exportTitle}
                  fileNames={isBulkExport ? studentFileNames : undefined}
                  bundleName={isBulkExport ? exportTitle : undefined}
                />
                <PrintButton iconOnly />
              </div>
            </div>
          </div>
        </div>
      </section>
      {resultSheets.map((resultSheet, index) => (
        <div
          key={`${resultSheet.student.id}-${resultSheet.term.id}`}
          className={`result-print-preview ${index > 0 ? "result-print-page-break" : ""}`}
        >
          <ResultSheet data={resultSheet} mode="admin" chartMode={isBulkExport ? "bulk-print" : "print"} />
        </div>
      ))}
    </main>
  );
}
