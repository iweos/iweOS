import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentStatus, ProfileRole, ResultPublicationStatus, SchoolStatus } from "@prisma/client";
import { ArrowLeft, BookOpenCheck, Building, CalendarDays, GraduationCap, Mail, MapPin, UsersRound, WalletCards } from "lucide-react";
import OpenSchoolPortalButton from "@/components/dataroom/OpenSchoolPortalButton";
import { requirePlatformAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { updateSchoolStatusAction } from "@/lib/server/dataroom-actions";

type PageProps = { params: Promise<{ schoolId: string }>; searchParams: Promise<{ updated?: string }> };

export default async function DataroomSchoolDetailPage({ params, searchParams }: PageProps) {
  const context = await requirePlatformAdmin();
  const { schoolId } = await params;
  const { updated } = await searchParams;
  const [school, admins, teachers, students, teacherCount, publishedResults, paymentSummary, activeTerm, auditLogs, ownAdminProfile] = await Promise.all([
    prisma.school.findUnique({ where: { id: schoolId }, include: { _count: { select: { students: true, classes: true, subjects: true, profiles: true } } } }),
    prisma.profile.findMany({ where: { schoolId, role: ProfileRole.ADMIN }, orderBy: { createdAt: "asc" }, select: { id: true, fullName: true, email: true, isActive: true } }),
    prisma.profile.findMany({
      where: { schoolId, role: ProfileRole.TEACHER },
      orderBy: { fullName: "asc" },
      take: 50,
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
        teacherClassAssignments: { orderBy: { class: { name: "asc" } }, select: { class: { select: { name: true } } } },
      },
    }),
    prisma.student.findMany({
      where: { schoolId },
      orderBy: [{ fullName: "asc" }, { studentCode: "asc" }],
      take: 50,
      select: { id: true, fullName: true, studentCode: true, className: true, gender: true, status: true },
    }),
    prisma.profile.count({ where: { schoolId, role: ProfileRole.TEACHER, isActive: true } }),
    prisma.resultPublication.count({ where: { schoolId, status: ResultPublicationStatus.PUBLISHED } }),
    prisma.payment.aggregate({ where: { schoolId, status: PaymentStatus.SUCCESS }, _sum: { amount: true }, _count: true }),
    prisma.term.findFirst({ where: { schoolId, isActive: true }, select: { sessionLabel: true, termLabel: true } }),
    prisma.auditLog.findMany({ where: { schoolId }, orderBy: { createdAt: "desc" }, take: 8, select: { id: true, action: true, createdAt: true } }),
    prisma.profile.findFirst({
      where: { schoolId, credentialId: context.credentialId, role: ProfileRole.ADMIN, isActive: true },
      select: { id: true },
    }),
  ]);
  if (!school) notFound();

  const location = [school.addressLine1, school.city, school.state, school.country].filter(Boolean).join(", ") || "Location not configured";
  const cards = [
    { label: "Students", value: school._count.students, icon: GraduationCap },
    { label: "Active teachers", value: teacherCount, icon: UsersRound },
    { label: "Classes", value: school._count.classes, icon: Building },
    { label: "Published results", value: publishedResults, icon: BookOpenCheck },
  ];

  return (
    <>
      <Link className="platform-back-link" href="/dataroom/schools"><ArrowLeft /> School directory</Link>
      {updated ? <div className="platform-success-notice">School status updated successfully.</div> : null}
      <section className="platform-school-hero">
        <div className="platform-school-identity"><span>{school.logoUrl ? (
          // School uploads may use data URLs or tenant-specific storage hosts.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={school.logoUrl} alt="" />
        ) : school.name.slice(0, 1).toUpperCase()}</span><div><p>{school.code}</p><h1>{school.name}</h1><small><MapPin /> {location}</small></div></div>
        <div className="platform-school-actions">
          <span className={`platform-status ${school.status.toLowerCase()}`}>{school.status.toLowerCase()}</span>
          {ownAdminProfile ? <OpenSchoolPortalButton profileId={ownAdminProfile.id} /> : <a className="platform-inspect-link" href="#teachers">Inspect school records</a>}
          <form action={updateSchoolStatusAction}>
            <input type="hidden" name="schoolId" value={school.id} />
            <select name="status" defaultValue={school.status}>{Object.values(SchoolStatus).map((value) => <option value={value} key={value}>{value[0] + value.slice(1).toLowerCase()}</option>)}</select>
            <button type="submit">Update status</button>
          </form>
        </div>
      </section>

      <section className="platform-detail-stats">{cards.map(({ icon: Icon, ...card }) => <article key={card.label}><i><Icon /></i><div><span>{card.label}</span><strong>{card.value.toLocaleString()}</strong></div></article>)}</section>

      <div className="platform-detail-grid">
        <section className="platform-panel">
          <div className="platform-panel-heading"><div><p>Access</p><h2>School administrators</h2></div><span>{admins.length} admins</span></div>
          {admins.length ? <div className="platform-admin-list">{admins.map((admin) => <div key={admin.id}><span>{admin.fullName.slice(0, 1).toUpperCase()}</span><div><strong>{admin.fullName}</strong><small><Mail /> {admin.email}</small></div><i className={`platform-status ${admin.isActive ? "active" : "archived"}`}>{admin.isActive ? "active" : "inactive"}</i></div>)}</div> : <p className="platform-muted">No school administrator is registered.</p>}
        </section>
        <aside className="platform-side-stack">
          <section className="platform-panel platform-school-facts"><div><CalendarDays /><span>Active session<strong>{activeTerm ? `${activeTerm.sessionLabel} · ${activeTerm.termLabel}` : "Not configured"}</strong></span></div><div><WalletCards /><span>Successful collections<strong>{new Intl.NumberFormat("en-NG", { style: "currency", currency: school.currency, maximumFractionDigits: 0 }).format(Number(paymentSummary._sum.amount ?? 0))}</strong><small>{paymentSummary._count} transactions</small></span></div></section>
        </aside>
      </div>

      <section className="platform-panel platform-roster-panel" id="teachers">
        <div className="platform-panel-heading"><div><p>People</p><h2>Teachers</h2></div><span>{teacherCount} active</span></div>
        <div className="platform-roster-scroll">
          <div className="platform-roster-head platform-teacher-roster"><span>Teacher</span><span>Email</span><span>Assigned classes</span><span>Status</span></div>
          {teachers.map((teacher) => <div className="platform-roster-row platform-teacher-roster" key={teacher.id}>
            <span className="platform-roster-person" data-label="Teacher"><i>{teacher.fullName.slice(0, 1).toUpperCase()}</i><strong>{teacher.fullName}</strong></span>
            <span data-label="Email">{teacher.email}</span>
            <span data-label="Assigned classes">{teacher.teacherClassAssignments.map((assignment) => assignment.class.name).join(", ") || "Not assigned"}</span>
            <span data-label="Status"><i className={`platform-status ${teacher.isActive ? "active" : "archived"}`}>{teacher.isActive ? "active" : "inactive"}</i></span>
          </div>)}
          {!teachers.length ? <p className="platform-muted">No teachers have been added.</p> : null}
        </div>
        {teachers.length === 50 ? <p className="platform-limit-note">Showing the first 50 teachers alphabetically.</p> : null}
      </section>

      <section className="platform-panel platform-roster-panel" id="students">
        <div className="platform-panel-heading"><div><p>Enrollment</p><h2>Students</h2></div><span>{school._count.students.toLocaleString()} records</span></div>
        <div className="platform-roster-scroll">
          <div className="platform-roster-head platform-student-roster"><span>Student</span><span>Student code</span><span>Class</span><span>Gender</span><span>Status</span></div>
          {students.map((student) => <div className="platform-roster-row platform-student-roster" key={student.id}>
            <strong data-label="Student">{student.fullName}</strong><span data-label="Student code">{student.studentCode}</span><span data-label="Class">{student.className || "Not assigned"}</span><span data-label="Gender">{student.gender || "Not set"}</span><span data-label="Status"><i className={`platform-status ${student.status.toLowerCase()}`}>{student.status}</i></span>
          </div>)}
          {!students.length ? <p className="platform-muted">No students have been added.</p> : null}
        </div>
        {school._count.students > 50 ? <p className="platform-limit-note">Showing the first 50 students alphabetically.</p> : null}
      </section>

      <section className="platform-panel platform-audit-panel">
        <div className="platform-panel-heading"><div><p>Governance</p><h2>Recent audit activity</h2></div></div>
        {auditLogs.length ? <div className="platform-audit-list">{auditLogs.map((log) => <div key={log.id}><i /><span><strong>{log.action.replaceAll(".", " ")}</strong><small>{log.createdAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</small></span></div>)}</div> : <p className="platform-muted">No audit activity recorded yet.</p>}
      </section>
    </>
  );
}
