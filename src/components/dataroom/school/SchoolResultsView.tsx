import Link from "next/link";
import { RESULT_STATES } from "@/lib/result-tracking";
import type { schoolResultTracking } from "@/lib/server/school-result-tracking";
type Term = { id: string; sessionLabel: string; termLabel: string; isActive: boolean };
export default function SchoolResultsView({schoolId, params, terms, classes, term, classId, tracking}: {schoolId: string; params: Record<string,string|undefined>; terms: Term[]; classes: {id:string; name:string}[]; term?:Term; classId?:string; tracking: Awaited<ReturnType<typeof schoolResultTracking>> | null}) {
  const query = (params.q ?? "").trim().toLowerCase();
  const rows = tracking?.rows.filter(row => (!query || `${row.name} ${row.code}`.toLowerCase().includes(query)) && (!params.state || row.state === params.state)) ?? [];
  const pages = Math.max(1, Math.ceil(rows.length / 25));
  const page = Math.min(pages, Math.max(1, Math.floor(Number(params.page)) || 1));
  const base = `/dataroom/schools/${schoolId}`;
  const url = (p: number) => `${base}?${new URLSearchParams({ tab: "results", termId: term?.id ?? "", classId: classId ?? "", q: params.q ?? "", state: params.state ?? "", page: String(p) })}`;
  return <><div className="sw-section-heading"><div><h2>Result readiness</h2><p>Active enrolled students, including those without a publication record. Readiness follows the existing school publication checks.</p></div></div>
    <form className="sw-filters"><input type="hidden" name="tab" value="results"/><label>Session / term<select name="termId" defaultValue={term?.id ?? ""}><option value="" disabled>Select a term</option>{terms.map(t => <option key={t.id} value={t.id}>{t.sessionLabel} · {t.termLabel}{t.isActive ? " (active)" : ""}</option>)}</select></label><label>Class<select name="classId" defaultValue={classId ?? ""}><option value="">All classes</option>{classes.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label><label>Student<input name="q" defaultValue={params.q} placeholder="Name or student code"/></label><label>State<select name="state" defaultValue={params.state ?? ""}><option value="">All states</option>{RESULT_STATES.map(state => <option key={state}>{state}</option>)}</select></label><button>Apply</button></form>
    <p className="sw-note">{term ? `${term.sessionLabel} · ${term.termLabel}` : "Select a valid session/term."} · {tracking?.total ?? 0} eligible students. Summary follows the selected term and class; search and state filters narrow the directory below.</p>
    <div className="sw-metrics">{RESULT_STATES.map(state => <article key={state}><span>{state}</span><strong>{tracking?.counts[state] ?? 0}</strong></article>)}</div>
    <div className="sw-list">{rows.slice((page - 1) * 25, page * 25).map(row => <article className="sw-row" key={row.id}><div><strong>{row.name}</strong><small>{row.code} · {row.classes.join(", ")}</small></div><span>{row.scored}/{row.expected} subjects recorded</span><span className="sw-badge">{row.state}</span></article>)}{!rows.length && <p className="sw-empty">No matching enrolled students. Check enrollment, student status and the selected term.</p>}</div>
    <nav className="sw-pagination" aria-label="Result pages"><span>{rows.length} matching students · Page {page} of {pages}</span>{page > 1 && <Link href={url(page - 1)}>Previous</Link>}{page < pages && <Link href={url(page + 1)}>Next</Link>}</nav></>;
}
