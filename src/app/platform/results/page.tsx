import Link from "next/link";
import { ResultPublicationStatus } from "@prisma/client";
import { BookOpenCheck, FileCheck2, Search } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

type PageProps = { searchParams: Promise<{ q?: string; status?: string }> };

export default async function PlatformResultsPage({ searchParams }: PageProps) {
  await requirePlatformAdmin();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = Object.values(ResultPublicationStatus).includes(params.status as ResultPublicationStatus) ? params.status as ResultPublicationStatus : undefined;
  const [results, total, published, schoolsPublishing] = await Promise.all([
    prisma.resultPublication.findMany({
      where: {
        status,
        ...(query ? { OR: [
          { student: { fullName: { contains: query, mode: "insensitive" } } },
          { school: { name: { contains: query, mode: "insensitive" } } },
          { class: { name: { contains: query, mode: "insensitive" } } },
        ] } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: { id: true, status: true, publishedAt: true, updatedAt: true, school: { select: { id: true, name: true, code: true } }, student: { select: { fullName: true, studentCode: true } }, class: { select: { name: true } }, term: { select: { sessionLabel: true, termLabel: true } }, publishedBy: { select: { fullName: true } } },
    }),
    prisma.resultPublication.count(),
    prisma.resultPublication.count({ where: { status: ResultPublicationStatus.PUBLISHED } }),
    prisma.resultPublication.groupBy({ by: ["schoolId"], where: { status: ResultPublicationStatus.PUBLISHED } }).then((rows) => rows.length),
  ]);

  return <>
    <section className="platform-page-heading"><div><p>Academic operations</p><h1>Result publications</h1><span>Track prepared, published and withdrawn student results across iweOS.</span></div><strong>{total.toLocaleString()} records</strong></section>
    <section className="platform-mini-stats">
      <article><FileCheck2 /><span>Published results<strong>{published.toLocaleString()}</strong></span></article>
      <article><BookOpenCheck /><span>Publishing schools<strong>{schoolsPublishing.toLocaleString()}</strong></span></article>
      <article><span className="platform-rate-mark">%</span><span>Publication rate<strong>{total ? Math.round((published / total) * 100) : 0}%</strong></span></article>
    </section>
    <form className="platform-filter-bar" method="get">
      <label><Search /><input type="search" name="q" defaultValue={query} placeholder="Search student, class or school" /></label>
      <select name="status" defaultValue={status ?? ""}><option value="">All statuses</option>{Object.values(ResultPublicationStatus).map((value) => <option value={value} key={value}>{value[0] + value.slice(1).toLowerCase()}</option>)}</select>
      <button type="submit">Apply filters</button>
      {(query || status) ? <Link href="/platform/results">Clear</Link> : null}
    </form>
    <section className="platform-panel platform-data-panel">
      <div className="platform-data-head platform-results-grid"><span>Student</span><span>School</span><span>Class / session</span><span>Status</span><span>Published by</span><span>Updated</span></div>
      <div className="platform-data-list">
        {results.map((result) => <Link className="platform-data-row platform-results-grid" href={`/platform/schools/${result.school.id}`} key={result.id}>
          <span className="platform-cell"><strong>{result.student.fullName}</strong><small>{result.student.studentCode}</small></span>
          <span className="platform-cell"><strong>{result.school.name}</strong><small>{result.school.code}</small></span>
          <span className="platform-cell"><strong>{result.class.name}</strong><small>{result.term.sessionLabel} · {result.term.termLabel}</small></span>
          <span><i className={`platform-status ${result.status.toLowerCase()}`}>{result.status.toLowerCase()}</i></span>
          <span className="platform-cell"><strong>{result.publishedBy?.fullName || "Not published"}</strong><small>{result.publishedAt ? result.publishedAt.toLocaleDateString("en-NG") : "Draft record"}</small></span>
          <span className="platform-date">{result.updatedAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</span>
        </Link>)}
        {!results.length ? <div className="platform-empty"><BookOpenCheck /><h2>No results found</h2><p>Adjust your filters and try again.</p></div> : null}
      </div>
    </section>
  </>;
}
