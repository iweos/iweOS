import ResultSheet from "@/components/results/ResultSheet";
import PrintButton from "@/components/results/PrintButton";
import { getPublishedResultSheetByToken } from "@/lib/server/results";

export default async function SharedResultPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const resultSheet = await getPublishedResultSheetByToken(token);

  if (!resultSheet) {
    return (
      <main className="container py-5">
        <section className="shared-result-shell admin-page-wrap py-3">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4 p-md-5">
              <p className="section-kicker">Shared result</p>
              <h1 className="section-title">Result unavailable</h1>
              <p className="section-subtle mb-0">
                This result link is invalid or the school has not published the result yet.
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="container py-4 py-md-5">
      <section className="shared-result-shell admin-page-wrap">
        <div className="card border-0 shadow-sm shared-result-hero mb-4">
          <div className="card-body p-4 p-md-5">
            <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
              <div>
                <p className="section-kicker">Shared result</p>
                <h1 className="section-title mb-2">{resultSheet.school.name}</h1>
                <p className="section-subtle mb-0">
                  {resultSheet.student.fullName} · {resultSheet.term.sessionLabel} {resultSheet.term.termLabel}
                </p>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <PrintButton />
                <a href="/" className="btn btn-secondary">
                  Open iweOS
                </a>
              </div>
            </div>
          </div>
        </div>

        <ResultSheet data={resultSheet} mode="public" />
      </section>
    </main>
  );
}
