import Link from "next/link";
import { PaymentStatus, ProfileRole, ResultPublicationStatus, SchoolStatus } from "@prisma/client";
import { ArrowUpRight, BookOpenCheck, Building2, GraduationCap, School, UsersRound, WalletCards } from "lucide-react";
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

  const stats = [
    { label: "Schools", value: schoolCount.toLocaleString(), detail: `${newSchools} added in 30 days`, icon: Building2, tone: "forest" },
    { label: "Students", value: studentCount.toLocaleString(), detail: "Across every workspace", icon: GraduationCap, tone: "blue" },
    { label: "Active teachers", value: teacherCount.toLocaleString(), detail: "Authorised teaching profiles", icon: UsersRound, tone: "gold" },
    { label: "Published results", value: publishedResults.toLocaleString(), detail: "Parent-ready records", icon: BookOpenCheck, tone: "ink" },
  ];

  return (
    <>
      <section className="platform-hero">
        <div><p>Control centre</p><h1>Every school, one clear operating view.</h1><span>Monitor adoption, activity and service health without entering a school workspace.</span></div>
        <Link href="/platform/schools">Explore schools <ArrowUpRight /></Link>
      </section>

      <section className="platform-stat-grid" aria-label="Platform statistics">
        {stats.map(({ icon: Icon, ...stat }) => <article className={`platform-stat ${stat.tone}`} key={stat.label}><div><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.detail}</small></div><i><Icon /></i></article>)}
      </section>

      <div className="platform-content-grid">
        <section className="platform-panel platform-schools-panel">
          <div className="platform-panel-heading"><div><p>Recently added</p><h2>School workspaces</h2></div><Link href="/platform/schools">View directory <ArrowUpRight /></Link></div>
          <div className="platform-school-list">
            {recentSchools.map((school) => (
              <Link href={`/platform/schools/${school.id}`} key={school.id}>
                <span className="platform-school-avatar"><School /></span>
                <span className="platform-school-primary"><strong>{school.name}</strong><small>{school.code} · Added {school.createdAt.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</small></span>
                <span className="platform-school-metric"><strong>{school._count.students}</strong><small>students</small></span>
                <span className={`platform-status ${school.status.toLowerCase()}`}>{school.status.toLowerCase()}</span>
                <ArrowUpRight className="platform-row-arrow" />
              </Link>
            ))}
          </div>
        </section>

        <aside className="platform-side-stack">
          <section className="platform-panel platform-health" id="system-health">
            <div className="platform-panel-heading"><div><p>Live status</p><h2>Workspace health</h2></div><span className="platform-live-dot">Operational</span></div>
            <div className="platform-health-row"><span>Active schools</span><strong>{activeSchools}</strong></div>
            <div className="platform-progress"><i style={{ width: `${schoolCount ? (activeSchools / schoolCount) * 100 : 0}%` }} /></div>
            <div className="platform-health-row"><span>Suspended</span><strong>{suspendedSchools}</strong></div>
          </section>
          <section className="platform-panel platform-revenue">
            <span><WalletCards /></span><p>Successful payment volume</p><strong>{formatMoney(Number(payments._sum.amount ?? 0))}</strong><small>{payments._count.toLocaleString()} completed transactions</small>
          </section>
        </aside>
      </div>
    </>
  );
}
