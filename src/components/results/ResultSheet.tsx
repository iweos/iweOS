import type { ResultSheetData } from "@/lib/server/results";

function formatNumber(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : "-";
}

function formatStatusLabel(status?: string | null) {
  if (!status) {
    return "Draft";
  }

  return status.charAt(0) + status.slice(1).toLowerCase();
}

type ResultSheetProps = {
  data: ResultSheetData;
  mode?: "admin" | "public";
};

export default function ResultSheet({ data, mode = "admin" }: ResultSheetProps) {
  return (
    <div className={`d-grid gap-3 ${mode === "public" ? "result-sheet-public" : "result-sheet-admin"}`}>
      <section className="card card-body">
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
          <div>
            <p className="section-kicker mb-1">Result sheet</p>
            <h1 className="section-title mb-1">{data.school.name}</h1>
            <p className="section-subtle mb-0">
              {data.term.sessionLabel} · {data.term.termLabel}
            </p>
          </div>
          <div className="text-md-end">
            <p className="small text-muted mb-1">Student</p>
            <h2 className="h5 fw-bold mb-1">{data.student.fullName}</h2>
            <p className="small text-muted mb-0">
              {data.student.studentCode} {data.student.className ? `· ${data.student.className}` : ""}
            </p>
          </div>
        </div>
      </section>

      <section className="row g-3">
        <div className="col-12 col-md-6 col-xl-3">
          <article className="card card-body h-100">
            <p className="small text-muted mb-1">Average</p>
            <p className="h3 fw-bold mb-0">{formatNumber(data.summary.average)}</p>
          </article>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <article className="card card-body h-100">
            <p className="small text-muted mb-1">Grade</p>
            <p className="h3 fw-bold mb-0">{data.summary.grade}</p>
          </article>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <article className="card card-body h-100">
            <p className="small text-muted mb-1">Position</p>
            <p className="h3 fw-bold mb-0">{data.summary.position}</p>
          </article>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <article className="card card-body h-100">
            <p className="small text-muted mb-1">Subjects offered</p>
            <p className="h3 fw-bold mb-0">{data.summary.subjectsOffered}</p>
          </article>
        </div>
      </section>

      <section className="card card-body">
        <div className="d-flex flex-wrap gap-4">
          <div>
            <p className="small text-muted mb-1">Class average</p>
            <p className="fw-semibold mb-0">{formatNumber(data.summary.classAverage)}</p>
          </div>
          <div>
            <p className="small text-muted mb-1">Highest average</p>
            <p className="fw-semibold mb-0">{formatNumber(data.summary.highestAverage)}</p>
          </div>
          <div>
            <p className="small text-muted mb-1">Lowest average</p>
            <p className="fw-semibold mb-0">{formatNumber(data.summary.lowestAverage)}</p>
          </div>
          <div>
            <p className="small text-muted mb-1">Publication</p>
            <p className="fw-semibold mb-0">{formatStatusLabel(data.publication?.status)}</p>
          </div>
        </div>
      </section>

      <section className="card card-body">
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle">
            <thead>
              <tr>
                <th>Subject</th>
                {data.assessmentColumns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
                <th>Total</th>
                <th>Grade</th>
                <th>Subject position</th>
                <th>Class average</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.subjectId}>
                  <td>{row.subjectName}</td>
                  {data.assessmentColumns.map((column) => (
                    <td key={`${row.subjectId}-${column}`}>{formatNumber(row.values[column] ?? 0)}</td>
                  ))}
                  <td>{formatNumber(row.total)}</td>
                  <td>{row.grade}</td>
                  <td>{row.subjectPosition}</td>
                  <td>{formatNumber(row.classAverage)}</td>
                </tr>
              ))}
              {data.rows.length === 0 ? (
                <tr>
                  <td colSpan={data.assessmentColumns.length + 5}>No score rows available for this result yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="row g-3">
        <div className="col-12 col-lg-7">
          <article className="card card-body h-100">
            <p className="section-heading mb-3">Conduct</p>
            {data.conductSections.length === 0 ? (
              <p className="section-subtle mb-0">No conduct scores have been recorded yet.</p>
            ) : (
              <div className="d-grid gap-3">
                {data.conductSections.map((section) => (
                  <div key={section.sectionId} className="rounded border bg-white px-3 py-3">
                    <p className="fw-semibold mb-2">{section.sectionName}</p>
                    <div className="row g-2">
                      {section.items.map((item) => (
                        <div key={item.categoryId} className="col-12 col-md-6">
                          <div className="d-flex align-items-center justify-content-between rounded border px-3 py-2">
                            <span>{item.categoryName}</span>
                            <strong>
                              {formatNumber(item.score)} / {item.maxScore}
                            </strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>

        <div className="col-12 col-lg-5">
          <article className="card card-body h-100">
            <p className="section-heading mb-3">Sign-off</p>
            <div className="d-grid gap-4">
              <div>
                <p className="small text-muted mb-3">Class teacher comment</p>
                <div className="border-top pt-4" />
              </div>
              <div>
                <p className="small text-muted mb-3">Admin / principal comment</p>
                <div className="border-top pt-4" />
              </div>
              <div>
                <p className="small text-muted mb-1">Shared access</p>
                <p className="mb-0">
                  {data.publication?.status === "PUBLISHED"
                    ? `Published${data.publication.publishedAt ? ` on ${data.publication.publishedAt}` : ""}`
                    : `${formatStatusLabel(data.publication?.status)} result`}
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
