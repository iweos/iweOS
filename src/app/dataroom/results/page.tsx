import Link from "next/link";
import { requireDataroomAccess } from "@/lib/server/dataroom-access";
import { prisma } from "@/lib/server/prisma";
import { schoolResultTracking } from "@/lib/server/school-result-tracking";
import "@/components/dataroom/school/school-workspace.css";
type Props = { searchParams: Promise<{ q?: string; page?: string }> };
export default async function PlatformResultsPage({ searchParams }: Props) {
  await requireDataroomAccess("results");
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const where = q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { code: { contains: q, mode: "insensitive" as const } }] } : {};
  const total = await prisma.school.count({ where });
  const pages = Math.max(1, Math.ceil(total / 10));
  const page = Math.min(pages, Math.max(1, Math.floor(Number(params.page) || 1)));
  const schools = await prisma.school.findMany({ where, orderBy: [{ name: "asc" }, { id: "asc" }], take: 10, skip: (page - 1) * 10, select: { id: true, name: true, code: true, terms: { where: { isActive: true }, take: 1, orderBy: { createdAt: "desc" }, select: { id: true, sessionLabel: true, termLabel: true } } } });
  const rows = [];
  for (const school of schools) {
    const term = school.terms[0];
    const tracking = term ? await schoolResultTracking(school.id, term.id) : null;
    rows.push({ school, term, tracking });
  }
  const href = (next: number) => `/dataroom/results?${new URLSearchParams({ q, page: String(next) })}`;
  return <div className="school-workspace"><header className="sw-header"><div><span>Cross-school reporting</span><h1>School result readiness</h1><p>Start with a school, then inspect its session, classes and students. Each row uses that school’s active term.</p></div></header><section className="sw-panel"><form className="sw-filters"><label>Find a school<input name="q" defaultValue={q} placeholder="School name or code"/></label><button>Search</button></form><p>Missing publication records are included through active student enrollment. “Ready” follows the school’s existing score-readiness checks, not the presence of student details.</p><div className="sw-list">{rows.map(({school, term, tracking}) => <article key={school.id} className="sw-row"><div><Link href={`/dataroom/schools/${school.id}?tab=results${term ? `&termId=${term.id}` : ""}`}><strong>{school.name}</strong></Link><small>{school.code} · {term ? `${term.sessionLabel} · ${term.termLabel}` : "No active term"}</small><small>{tracking ? `${tracking.total} eligible · ${tracking.counts["Not started"]} not started · ${tracking.counts["In progress"]} in progress · ${tracking.counts["Withdrawn"]} withdrawn` : "Choose a term inside the school workspace."}</small></div><span className="sw-badge">{tracking?.counts["Ready to publish"] ?? 0} ready</span><span className="sw-badge">{tracking?.counts.Published ?? 0} published</span></article>)}{!rows.length && <p className="sw-empty">No matching schools.</p>}</div><nav className="sw-pagination" aria-label="School result pages"><span>{total} schools · Page {page} of {pages}</span>{page > 1 && <Link href={href(page - 1)}>Previous</Link>}{page < pages && <Link href={href(page + 1)}>Next</Link>}</nav></section></div>;
}
