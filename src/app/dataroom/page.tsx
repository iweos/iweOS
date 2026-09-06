import Link from "next/link";
import { PaymentStatus, ProfileRole, ResultPublicationStatus, SchoolStatus } from "@prisma/client";
import { ArrowUpRight, BookOpenCheck, Building2, GraduationCap, School, UsersRound, WalletCards } from "lucide-react";
import { WorkspaceContentGrid, WorkspaceHero, WorkspacePanel, WorkspaceStat, WorkspaceStatGrid } from "@/components/workspace/WorkspaceUI";
import { requirePlatformAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
}

export default async function PlatformDashboardPage() {
  await requirePlatformAdmin();
  const monthStart = new Date();
  monthStart.setDate(monthStart.getDate() - 30);

  const [schoolCount, activeSchools, suspendedSchools, studentCount, teacherCount, publishedResults, payments, recentSchools, newSchools] = await Promise.all([
    prisma.school.count(),
    prisma.school.count({ where: { status: SchoolStatus.ACTIVE } }),
    prisma.school.count({ where: { status: SchoolStatus.SUSPENDED } }),
    prisma.student.count(),
    prisma.profile.count({ where: { role: ProfileRole.TEACHER, isActive: true } }),
    prisma.resultPublication.count({ where: { status: ResultPublicationStatus.PUBLISHED } }),
    prisma.payment.aggregate({ where: { status: PaymentStatus.SUCCESS }, _sum: { amount: true }, _count: true }),
    prisma.school.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, code: true, status: true, createdAt: true, _count: { select: { students: true, profiles: true, classes: true } } },
    }),
    prisma.school.count({ where: { createdAt: { gte: monthStart } } }),
  ]);

  return (
    <>
      <WorkspaceHero
        eyebrow="Control centre"
        title="Every school, one clear operating view."
        description="Monitor adoption, activity and service health without entering a school workspace."
        action={<Link href="/dataroom/schools">Explore schools <ArrowUpRight /></Link>}
      />

      <WorkspaceStatGrid>
        <WorkspaceStat label="Schools" value={schoolCount.toLocaleString()} detail={`${newSchools} added in 30 days`} icon={<Building2 />} />
        <WorkspaceStat label="Students" value={studentCount.toLocaleString()} detail="Across every workspace" icon={<GraduationCap />} tone="blue" />
        <WorkspaceStat label="Active teachers" value={teacherCount.toLocaleString()} detail="Authorised teaching profiles" icon={<UsersRound />} tone="gold" />
        <WorkspaceStat label="Published results" value={publishedResults.toLocaleString()} detail="Parent-ready records" icon={<BookOpenCheck />} tone="ink" />
      </WorkspaceStatGrid>

      <WorkspaceContentGrid>
        <WorkspacePanel
          eyebrow="Recently added"
          title="School workspaces"
          action={<Link className="workspace-text-link" href="/dataroom/schools">View directory <ArrowUpRight /></Link>}
          bodyClassName="workspace-panel-body-flush"
        >
          <div className="platform-school-list">
            {recentSchools.map((school) => (
              <Link href={`/dataroom/schools/${school.id}`} key={school.id}>
                <span className="platform-school-avatar"><School /></span>
                <span className="platform-school-primary"><strong>{school.name}</strong><small>{school.code} · Added {school.createdAt.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</small></span>
                <span className="platform-school-metric"><strong>{school._count.students}</strong><small>students</small></span>
                <span className={`platform-status ${school.status.toLowerCase()}`}>{school.status.toLowerCase()}</span>
                <ArrowUpRight className="platform-row-arrow" />
              </Link>
            ))}
          </div>
        </WorkspacePanel>

        <aside className="platform-side-stack">
          <WorkspacePanel eyebrow="Live status" title="Workspace health">
            <div className="platform-health-row"><span>Active schools</span><strong>{activeSchools}</strong></div>
            <div className="platform-progress"><i style={{ width: `${schoolCount ? (activeSchools / schoolCount) * 100 : 0}%` }} /></div>
            <div className="platform-health-row"><span>Suspended</span><strong>{suspendedSchools}</strong></div>
          </WorkspacePanel>
          <WorkspacePanel className="workspace-emphasis-panel">
            <span className="workspace-emphasis-icon"><WalletCards /></span>
            <p>Successful payment volume</p>
            <strong>{formatMoney(Number(payments._sum.amount ?? 0))}</strong>
            <small>{payments._count.toLocaleString()} completed transactions</small>
          </WorkspacePanel>
        </aside>
      </WorkspaceContentGrid>
    </>
  );
}
