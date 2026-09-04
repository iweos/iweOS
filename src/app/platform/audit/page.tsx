import Link from "next/link";
import { ClipboardList, Search, ShieldCheck } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

type PageProps = { searchParams: Promise<{ q?: string; school?: string }> };

function metadataPreview(value: unknown) {
  if (!value || typeof value !== "object") return "No additional context";
  const text = Object.entries(value as Record<string, unknown>).slice(0, 3).map(([key, item]) => `${key}: ${String(item)}`).join(" · ");
  return text || "No additional context";
}

export default async function PlatformAuditPage({ searchParams }: PageProps) {
  await requirePlatformAdmin();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const schoolId = params.school?.trim() ?? "";
  const [logs, schools, total, today] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        ...(schoolId ? { schoolId } : {}),
        ...(query ? { OR: [
          { action: { contains: query, mode: "insensitive" } },
          { entityType: { contains: query, mode: "insensitive" } },
          { school: { name: { contains: query, mode: "insensitive" } } },
        ] } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 150,
      select: { id: true, action: true, entityType: true, entityId: true, userId: true, metaJson: true, createdAt: true, school: { select: { id: true, name: true, code: true } } },
    }),
    prisma.school.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.auditLog.count(),
    prisma.auditLog.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
  ]);

  return <>
    <section className="platform-page-heading"><div><p>Governance</p><h1>Audit logs</h1><span>Review recent operational and administrative events across every workspace.</span></div><strong>{total.toLocaleString()} events</strong></section>
    <section className="platform-mini-stats">
      <article><ClipboardList /><span>Events today<strong>{today.toLocaleString()}</strong></span></article>
      <article><ShieldCheck /><span>Schools monitored<strong>{schools.length.toLocaleString()}</strong></span></article>
    </section>
    <form className="platform-filter-bar" method="get">
      <label><Search /><input type="search" name="q" defaultValue={query} placeholder="Search action, entity or school" /></label>
      <select name="school" defaultValue={schoolId}><option value="">All schools</option>{schools.map((school) => <option value={school.id} key={school.id}>{school.name}</option>)}</select>
      <button type="submit">Apply filters</button>
      {(query || schoolId) ? <Link href="/platform/audit">Clear</Link> : null}
    </form>
    <section className="platform-panel platform-data-panel">
      <div className="platform-data-head platform-audit-grid"><span>Event</span><span>School</span><span>Context</span><span>Actor</span><span>Date</span></div>
      <div className="platform-data-list">
        {logs.map((log) => <Link className="platform-data-row platform-audit-grid" href={`/platform/schools/${log.school.id}`} key={log.id}>
          <span className="platform-cell"><strong>{log.action.replaceAll(".", " ")}</strong><small>{log.entityType}{log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ""}</small></span>
          <span className="platform-cell"><strong>{log.school.name}</strong><small>{log.school.code}</small></span>
          <span className="platform-context">{metadataPreview(log.metaJson)}</span>
          <span className="platform-cell"><strong>{log.userId ? "School user" : "System"}</strong><small>{log.userId?.slice(0, 8) || "Automated"}</small></span>
          <span className="platform-date">{log.createdAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</span>
        </Link>)}
        {!logs.length ? <div className="platform-empty"><ClipboardList /><h2>No audit events found</h2><p>Adjust your filters and try again.</p></div> : null}
      </div>
      {logs.length === 150 ? <p className="platform-limit-note">Showing the latest 150 matching events. Refine the filters to narrow the result.</p> : null}
    </section>
  </>;
}
