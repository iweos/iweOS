import Link from "next/link";
import { BookOpenCheck, Building2, CalendarDays, GraduationCap, LogOut } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { signOutAction } from "@/lib/server/auth-actions";
import { requireStudentPortal } from "@/lib/server/auth";

export default async function StudentPortalPage() {
  const { email, students } = await requireStudentPortal();
  const resultCount = students.reduce((total, student) => total + student.resultPublications.length, 0);

  return (
    <main className="student-portal-page">
      <header className="student-portal-header">
        <BrandLogo href="/student" variant="dark" className="student-portal-brand" textClassName="student-portal-brand-name" />
        <div><span>{email}</span><form action={signOutAction}><button type="submit"><LogOut /> Sign out</button></form></div>
      </header>

      <div className="student-portal-main">
        <section className="student-portal-hero">
          <div><p>Student Portal</p><h1>Your school records, in one place.</h1><span>Open any published result below. Public result links shared by your school will continue to work without signing in.</span></div>
          <GraduationCap aria-hidden="true" />
        </section>

        <section className="student-portal-stats" aria-label="Portal summary">
          <article><span><GraduationCap /></span><div><strong>{students.length}</strong><small>{students.length === 1 ? "Linked student" : "Linked students"}</small></div></article>
          <article><span><BookOpenCheck /></span><div><strong>{resultCount}</strong><small>Published results</small></div></article>
          <article><span><Building2 /></span><div><strong>{new Set(students.map((student) => student.schoolId)).size}</strong><small>{new Set(students.map((student) => student.schoolId)).size === 1 ? "School" : "Schools"}</small></div></article>
        </section>

        <section className="student-portal-list">
          <header><div><p>Academic records</p><h2>Students linked to your email</h2></div><span>{resultCount} published</span></header>
          <div>
            {students.map((student) => (
              <article className="student-record-card" key={student.id}>
                <div className="student-record-identity">
                  <span>{student.photoUrl ? <img src={student.photoUrl} alt="" /> : student.fullName.slice(0, 1).toUpperCase()}</span>
                  <div><h3>{student.fullName}</h3><p>{student.studentCode} · {student.school.name}</p></div>
                </div>
                <div className="student-result-list">
                  {student.resultPublications.length ? student.resultPublications.map((publication) => (
                    <Link href={`/results/${publication.shareToken}`} key={publication.id}>
                      <span><CalendarDays /></span>
                      <div><strong>{publication.term.sessionLabel} · {publication.term.termLabel}</strong><small>{publication.class.name}{publication.publishedAt ? ` · Published ${publication.publishedAt.toLocaleDateString("en-NG")}` : ""}</small></div>
                      <b>View result</b>
                    </Link>
                  )) : <p className="student-result-empty">No result has been published for this student yet.</p>}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
