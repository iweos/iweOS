import type { ResultSheetData } from "@/lib/server/results";

function formatNumber(value: number, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : "-";
}

function formatInteger(value: number) {
  return Number.isFinite(value) ? Math.round(value).toString() : "-";
}

function formatStatusLabel(status?: string | null) {
  if (!status) {
    return "Draft";
  }

  return status.charAt(0) + status.slice(1).toLowerCase();
}

function buildSchoolAddress(data: ResultSheetData["school"]) {
  return [data.addressLine1, data.addressLine2, data.city, data.state].filter(Boolean).join(", ");
}

function getGradeRemark(grade: string) {
  const normalized = grade.trim().toUpperCase();
  const map: Record<string, string> = {
    A: "Excellent",
    B: "Very good",
    C: "Good",
    D: "Fair",
    E: "Needs improvement",
    F: "Poor",
  };

  return map[normalized] ?? grade;
}

function getPositionOnly(position: string) {
  return position.includes("/") ? position.split("/")[0]?.trim() ?? position : position;
}

function getScoreTone(value: number) {
  if (!Number.isFinite(value)) {
    return "neutral";
  }
  if (value >= 70) {
    return "good";
  }
  if (value >= 50) {
    return "mid";
  }
  return "fail";
}

function getPositionTone(position: string) {
  const [rawRank, rawTotal] = position.split("/").map((item) => Number.parseInt(item?.trim() ?? "", 10));
  if (!Number.isFinite(rawRank) || !Number.isFinite(rawTotal) || rawRank <= 0 || rawTotal <= 0) {
    return "neutral";
  }

  const percentile = rawRank / rawTotal;
  if (percentile <= 0.33) {
    return "good";
  }
  if (percentile <= 0.66) {
    return "mid";
  }
  return "fail";
}

function toneClass(tone: string) {
  return `result-tone result-tone-${tone}`;
}

type ResultSheetProps = {
  data: ResultSheetData;
  mode?: "admin" | "public";
  variant?: "default" | "report-card";
};

function DefaultResultSheet({ data, mode }: { data: ResultSheetData; mode: "admin" | "public" }) {
  const averageTone = getScoreTone(data.summary.average);
  const positionTone = getPositionTone(data.summary.position);

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
            <p className={`h3 fw-bold mb-0 ${toneClass(averageTone)}`}>{formatNumber(data.summary.average)}</p>
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
            <p className={`h3 fw-bold mb-0 ${toneClass(positionTone)}`}>{data.summary.position}</p>
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
                  <td>
                    <span className={toneClass(getScoreTone(row.total))}>{formatNumber(row.total)}</span>
                  </td>
                  <td>{row.grade}</td>
                  <td>
                    <span className={toneClass(getPositionTone(row.subjectPosition))}>{row.subjectPosition}</span>
                  </td>
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

function ReportCardResultSheet({ data, mode }: { data: ResultSheetData; mode: "admin" | "public" }) {
  const schoolAddress = buildSchoolAddress(data.school);
  const assessmentColumnWidth = data.assessmentColumns.length > 0 ? 30 / data.assessmentColumns.length : 0;
  const overallAverageTone = getScoreTone(data.summary.average);
  const overallPositionTone = getPositionTone(data.summary.position);

  return (
    <div className={`result-report-card ${mode === "public" ? "result-sheet-public" : "result-sheet-admin"}`}>
      <section className="result-report-shell">
        <header className="result-report-header">
          <div className="result-report-brand">
            <div className="result-report-logo">
              {data.school.logoUrl ? <img src={data.school.logoUrl} alt={data.school.name} /> : <span>{data.school.name.slice(0, 2).toUpperCase()}</span>}
            </div>
            <div className="result-report-school">
              <h1>{data.school.name}</h1>
              {schoolAddress ? <p>{schoolAddress}</p> : null}
              <p>
                {data.school.phone ? `Telephone: ${data.school.phone}` : null}
                {data.school.phone && data.school.website ? " · " : null}
                {data.school.website ? `Website: ${data.school.website}` : null}
              </p>
              <h2>End of term report</h2>
              <h3>
                {data.term.sessionLabel} · {data.term.termLabel}
              </h3>
            </div>
          </div>
        </header>

        <section className="result-report-student-meta">
          <div className="result-report-student-photo-wrap">
            <div className="result-report-student-photo">
              {data.student.photoUrl ? (
                <img src={data.student.photoUrl} alt={data.student.fullName} />
              ) : (
                <span>{data.student.fullName.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
          </div>
          <div className="result-report-meta-grid">
            <div className="result-report-meta result-report-meta-name">
              <span className="label">Name</span>
              <strong>{data.student.fullName}</strong>
            </div>
            <div className="result-report-meta">
              <span className="label">Sex</span>
              <strong>{data.student.gender ?? "-"}</strong>
            </div>
            <div className="result-report-meta">
              <span className="label">Class</span>
              <strong>{data.class.name}</strong>
            </div>
            <div className="result-report-meta">
              <span className="label">No in class</span>
              <strong>{data.summary.classSize}</strong>
            </div>
            <div className="result-report-meta">
              <span className="label">Position</span>
              <strong className={toneClass(overallPositionTone)}>{getPositionOnly(data.summary.position)}</strong>
            </div>
            <div className="result-report-meta">
              <span className="label">Overall percentage</span>
              <strong className={toneClass(overallAverageTone)}>{formatNumber(data.summary.average, 2)}%</strong>
            </div>
            <div className="result-report-meta">
              <span className="label">Class average</span>
              <strong>{formatNumber(data.summary.classAverage, 2)}%</strong>
            </div>
            <div className="result-report-meta">
              <span className="label">No of subjects recorded</span>
              <strong>{data.summary.subjectsOffered}</strong>
            </div>
          </div>
        </section>

        <section className="result-report-main">
          <aside className="result-report-side">
            <article className="result-report-box">
              <div className="result-report-box-title">Attendance record</div>
              <table className="result-report-mini-table">
                <tbody>
                  <tr>
                    <th>Times school opened</th>
                    <td>-</td>
                  </tr>
                  <tr>
                    <th>Times present</th>
                    <td>-</td>
                  </tr>
                  <tr>
                    <th>Times absent</th>
                    <td>-</td>
                  </tr>
                </tbody>
              </table>
            </article>

            <article className="result-report-box">
              <div className="result-report-box-title">Observations on conduct</div>
              {data.conductSections.length === 0 ? (
                <div className="result-report-empty">No conduct scores recorded yet.</div>
              ) : (
                <div className="result-report-conduct-list">
                  {data.conductSections.map((section) => (
                    <div key={section.sectionId} className="result-report-conduct-section">
                      <div className="result-report-conduct-heading">{section.sectionName}</div>
                      <table className="result-report-mini-table">
                        <tbody>
                          {section.items.map((item) => (
                            <tr key={item.categoryId}>
                              <th>{item.categoryName}</th>
                              <td>
                                {formatNumber(item.score)} / {item.maxScore}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="result-report-box">
              <div className="result-report-box-title">Rating key</div>
              <ol className="result-report-rating-key">
                <li>5: Excellent display of the observed trait</li>
                <li>4: High level of the observed trait</li>
                <li>3: Acceptable level of the observed trait</li>
                <li>2: Minimal level of the observed trait</li>
                <li>1: Trait not yet demonstrated consistently</li>
              </ol>
            </article>

            <article className="result-report-overall-remark">
              <span className="label">Overall remark</span>
              <strong>{getGradeRemark(data.summary.overallRemark)}</strong>
            </article>
          </aside>

          <section className="result-report-academic">
            <div className="result-report-box-title">Academic report</div>
            <div className="result-report-table-wrap">
              <table className="result-report-table">
                <colgroup>
                  <col style={{ width: "26%" }} />
                  {data.assessmentColumns.map((column) => (
                    <col key={`col-${column}`} style={{ width: `${assessmentColumnWidth}%` }} />
                  ))}
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "7%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Subjects</th>
                    {data.assessmentColumns.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                    <th>Total</th>
                    <th>Class highest</th>
                    <th>Class lowest</th>
                    <th>Class average</th>
                    <th>Position</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.subjectId}>
                      <th>{row.subjectName}</th>
                      {data.assessmentColumns.map((column) => (
                        <td key={`${row.subjectId}-${column}`}>{formatNumber(row.values[column] ?? 0, 0)}</td>
                      ))}
                      <td className={toneClass(getScoreTone(row.total))}>{formatNumber(row.total, 0)}</td>
                      <td>{formatNumber(row.classHighest, 0)}</td>
                      <td>{formatNumber(row.classLowest, 0)}</td>
                      <td>{formatNumber(row.classAverage, 2)}</td>
                      <td className={toneClass(getPositionTone(row.subjectPosition))}>{row.subjectPosition}</td>
                      <td>{row.remark}</td>
                    </tr>
                  ))}
                  {data.rows.length === 0 ? (
                    <tr>
                      <td colSpan={data.assessmentColumns.length + 7}>No score rows available for this result yet.</td>
                    </tr>
                  ) : null}
                  <tr className="result-report-total-row">
                    <th>Total</th>
                    {data.assessmentColumns.map((column) => (
                      <td key={`total-${column}`} />
                    ))}
                    <td>{formatInteger(data.summary.grandTotal)}</td>
                    <td />
                    <td />
                    <td />
                    <td />
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </section>

        <section className="result-report-grade-key">
          <div className="result-report-box-title">Grade key</div>
          <div className="result-report-grade-grid">
            {data.gradeKey.length > 0 ? (
              data.gradeKey.map((item) => (
                <div key={item.letter} className="result-report-grade-item">
                  <strong>
                    {item.minScore}-{item.maxScore}
                  </strong>
                  <span>{item.letter}</span>
                  <small>{getGradeRemark(item.letter)}</small>
                </div>
              ))
            ) : (
              <div className="result-report-empty">No grade scale configured yet.</div>
            )}
          </div>
        </section>

        <section className="result-report-comments">
          <article className="result-report-comment-box">
            <span className="label">Class teacher&apos;s comment</span>
            <p>This student&apos;s report was generated from the scores currently recorded in the system.</p>
            <div className="signature-line">Signature &amp; date</div>
          </article>
          <article className="result-report-comment-box">
            <span className="label">Principal&apos;s comment</span>
            <p>Comment space reserved for final review and approval.</p>
            <div className="signature-line">Signature &amp; date</div>
          </article>
        </section>
      </section>
    </div>
  );
}

export default function ResultSheet({ data, mode = "admin", variant }: ResultSheetProps) {
  const resolvedVariant = variant ?? (data.resultTemplate === "classic_report" ? "report-card" : "default");

  if (resolvedVariant === "report-card") {
    return <ReportCardResultSheet data={data} mode={mode} />;
  }

  return <DefaultResultSheet data={data} mode={mode} />;
}
