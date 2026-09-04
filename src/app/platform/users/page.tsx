import Link from "next/link";
import { ProfileRole } from "@prisma/client";
import { Search, UserRound, UsersRound } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

type PageProps = { searchParams: Promise<{ q?: string; role?: string; state?: string }> };

export default async function PlatformUsersPage({ searchParams }: PageProps) {
  await requirePlatformAdmin();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const role = Object.values(ProfileRole).includes(params.role as ProfileRole) ? params.role as ProfileRole : undefined;
  const isActive = params.state === "active" ? true : params.state === "inactive" ? false : undefined;
  const [profiles, total, active, linked] = await Promise.all([
    prisma.profile.findMany({
      where: {
        role,
        isActive,
        ...(query ? { OR: [
          { fullName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { school: { name: { contains: query, mode: "insensitive" } } },
        ] } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, fullName: true, email: true, role: true, isActive: true, credentialId: true, createdAt: true, school: { select: { id: true, name: true, code: true } } },
    }),
    prisma.profile.count(),
    prisma.profile.count({ where: { isActive: true } }),
    prisma.profile.count({ where: { credentialId: { not: null } } }),
  ]);

  return <>
    <section className="platform-page-heading"><div><p>Accounts</p><h1>User directory</h1><span>Inspect administrators and teachers across every school workspace.</span></div><strong>{total.toLocaleString()} profiles</strong></section>
    <section className="platform-mini-stats">
      <article><UsersRound /><span>Active profiles<strong>{active.toLocaleString()}</strong></span></article>
      <article><UserRound /><span>Linked accounts<strong>{linked.toLocaleString()}</strong></span></article>
      <article><span className="platform-rate-mark">%</span><span>Account linkage<strong>{total ? Math.round((linked / total) * 100) : 0}%</strong></span></article>
    </section>
    <form className="platform-filter-bar" method="get">
      <label><Search /><input type="search" name="q" defaultValue={query} placeholder="Search name, email or school" /></label>
      <select name="role" defaultValue={role ?? ""}><option value="">All roles</option><option value="ADMIN">Administrators</option><option value="TEACHER">Teachers</option></select>
      <select name="state" defaultValue={params.state ?? ""}><option value="">All states</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
      <button type="submit">Apply filters</button>
      {(query || role || isActive !== undefined) ? <Link href="/platform/users">Clear</Link> : null}
    </form>
    <section className="platform-panel platform-data-panel">
      <div className="platform-data-head platform-users-grid"><span>User</span><span>School</span><span>Role</span><span>Account</span><span>Joined</span></div>
      <div className="platform-data-list">
        {profiles.map((profile) => <Link className="platform-data-row platform-users-grid" href={`/platform/schools/${profile.school.id}`} key={profile.id}>
          <span className="platform-person"><i>{profile.fullName.slice(0, 1).toUpperCase()}</i><span><strong>{profile.fullName}</strong><small>{profile.email}</small></span></span>
          <span className="platform-cell"><strong>{profile.school.name}</strong><small>{profile.school.code}</small></span>
          <span><i className="platform-role">{profile.role.toLowerCase()}</i></span>
          <span><i className={`platform-status ${profile.isActive ? "active" : "archived"}`}>{profile.isActive ? (profile.credentialId ? "linked" : "invited") : "inactive"}</i></span>
          <span className="platform-date">{profile.createdAt.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
        </Link>)}
        {!profiles.length ? <div className="platform-empty"><UsersRound /><h2>No users found</h2><p>Adjust your filters and try again.</p></div> : null}
      </div>
      {profiles.length === 100 ? <p className="platform-limit-note">Showing the latest 100 matching profiles. Refine the filters to narrow the result.</p> : null}
    </section>
  </>;
}
