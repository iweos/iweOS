import Link from "next/link";
import DownloadPdfButton from "@/components/results/DownloadPdfButton";
import PrintButton from "@/components/results/PrintButton";
import ResultSheet from "@/components/results/ResultSheet";
import SharePdfButton from "@/components/results/SharePdfButton";
import { buildStudentResultFileName } from "@/lib/result-export-name";
import { getPublishedResultSheetByToken } from "@/lib/server/results";

export default async function SharedResultPrintPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const resultSheet = await getPublishedResultSheetByToken(token);

  if (!resultSheet) {
    return (
      <main className="container py-5">
        <p className="section-subtle mb-0">This result link is invalid or the school has not published the result yet.</p>
      </main>
    );
  }

  const exportTitle = buildStudentResultFileName({
    studentName: resultSheet.student.fullName,
    className: resultSheet.class.name,
    sessionLabel: resultSheet.term.sessionLabel,
    termLabel: resultSheet.term.termLabel,
  });

  return (
    <main className="container py-4 py-md-5 d-grid gap-4">
      <section className="shared-result-shell admin-page-wrap">
        <div className="card border-0 shadow-sm shared-result-hero print-hidden">
          <div className="card-body p-4 p-md-5">
            <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
              <div>
                <p className="section-kicker">Shared result export</p>
                <h1 className="section-title mb-2">{resultSheet.school.name}</h1>
                <p className="section-subtle mb-0">
                  {resultSheet.student.fullName} · {resultSheet.term.sessionLabel} {resultSheet.term.termLabel}
                </p>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <Link href={`/results/${token}`} className="btn btn-secondary">
                  Back to result
                </Link>
                <SharePdfButton fileName={exportTitle} />
                <DownloadPdfButton fileName={exportTitle} />
                <PrintButton />
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="result-print-preview">
        <ResultSheet data={resultSheet} mode="public" chartMode="print" />
      </div>
    </main>
  );
}
