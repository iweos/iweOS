import Link from "next/link";
import DownloadPdfButton from "@/components/results/DownloadPdfButton";
import PrintButton from "@/components/results/PrintButton";
import ResultSheet from "@/components/results/ResultSheet";
import SharePdfButton from "@/components/results/SharePdfButton";
import { requireRole } from "@/lib/server/auth";
import { getStudentResultSheet } from "@/lib/server/results";
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

  const resultSheets = (
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

  if (resultSheets.length === 0) {
    return (
      <main className="container py-4">
        <p className="section-subtle mb-0">The selected result could not be generated.</p>
      </main>
    );
  }

  const exportTitle =
    resultSheets.length === 1
      ? `${resultSheets[0].student.fullName} ${resultSheets[0].term.termLabel} result`
      : `${resultSheets[0]?.class.name ?? "class"} ${resultSheets[0]?.term.termLabel ?? "result"} reports`;

  return (
    <main className="container py-4 py-md-5 d-grid gap-4">
      <section className="shared-result-shell admin-page-wrap">
        <div className="card border-0 shadow-sm shared-result-hero print-hidden">
          <div className="card-body p-4 p-md-5">
            <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
              <div>
                <p className="section-kicker">Result export</p>
                <h1 className="section-title mb-2">{resultSheets[0]?.school.name}</h1>
                <p className="section-subtle mb-0">
                  {exportTitle}. Download a real PDF file or print this clean document view.
                </p>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <Link
                  href={`/app/admin/grading/results?termId=${params.termId}&classId=${params.classId}${params.studentId ? `&studentId=${params.studentId}` : ""}`}
                  className="btn btn-secondary"
                >
                  Back to results
                </Link>
                <SharePdfButton fileName={exportTitle} />
                <DownloadPdfButton fileName={exportTitle} />
                <PrintButton />
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
          <ResultSheet data={resultSheet} mode="admin" chartMode="print" />
        </div>
      ))}
    </main>
  );
}
