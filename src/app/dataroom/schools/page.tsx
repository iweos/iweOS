import Link from "next/link";
import { SchoolStatus } from "@prisma/client";
import { ArrowUpRight, Search, School } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

type PageProps = { searchParams: Promise<{ q?: string; status?: string }> };

export default async function PlatformSchoolsPage({ searchParams }: PageProps) {
  await requirePlatformAdmin();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = Object.values(SchoolStatus).includes(params.status as SchoolStatus) ? params.status as SchoolStatus : undefined;
  const schools = await prisma.school.findMany({
    where: {
      status,
      ...(query ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { code: { contains: query, mode: "insensitive" } }] } : {}),
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true, country: true, city: true, status: true, createdAt: true, _count: { select: { students: true, profiles: true, classes: true, resultPublications: true } } },
  });

  return (
    <>
      <section className="platform-page-heading"><div><p>School intelligence</p><h1>School directory</h1><span>Search, inspect and manage every tenant from one protected workspace.</span></div><strong>{schools.length} shown</strong></section>
      <form className="platform-filter-bar" method="get">
        <label><Search /><input type="search" name="q" defaultValue={query} placeholder="Search by school name or code" /></label>
        <select name="status" defaultValue={status ?? ""}><option value="">All statuses</option>{Object.values(SchoolStatus).map((value) => <option value={value} key={value}>{value[0] + value.slice(1).toLowerCase()}</option>)}</select>
        <button type="submit">Apply filters</button>
        {(query || status) ? <Link href="/dataroom/schools">Clear</Link> : null}
      </form>
      <section className="platform-panel platform-directory-panel">
        <div className="platform-directory-head"><span>School</span><span>Usage</span><span>Status</span><span>Created</span><span>Open</span></div>
        <div className="platform-directory-list">
          {schools.map((school) => <Link href={`/dataroom/schools/${school.id}`} key={school.id}>
            <span className="platform-directory-school"><i><School /></i><span><strong>{school.name}</strong><small>{school.code} · {[school.city, school.country].filter(Boolean).join(", ") || "Location not set"}</small></span></span>
            <span className="platform-directory-usage"><strong>{school._count.students} students</strong><small>{school._count.classes} classes · {school._count.profiles} staff</small></span>
            <span><i className={`platform-status ${school.status.toLowerCase()}`}>{school.status.toLowerCase()}</i></span>
            <span className="platform-directory-date">{school.createdAt.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
            <span className="platform-open-label">Open <ArrowUpRight /></span>
          </Link>)}
          {schools.length === 0 ? <div className="platform-empty"><School /><h2>No schools found</h2><p>Adjust the search or status filter and try again.</p></div> : null}
        </div>
      </section>
    </>
  );
}
