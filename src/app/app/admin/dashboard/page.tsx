import Link from "next/link";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { isDynamicServerError } from "next/dist/client/components/hooks-server-context";
import { ProfileRole } from "@prisma/client";
import { ArrowUpRight, BookOpen, CalendarDays, GraduationCap, LayoutGrid, Settings2, UsersRound } from "lucide-react";
import { WorkspaceContentGrid, WorkspaceHero, WorkspacePanel, WorkspaceStat, WorkspaceStatGrid } from "@/components/workspace/WorkspaceUI";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { isPrismaSchemaMismatchError, schemaSyncMessage } from "@/lib/server/prisma-errors";

export default async function AdminDashboardPage() {
  try {
    const profile = await requireRole("admin");
    let school: Awaited<ReturnType<typeof prisma.school.findUnique>> = null;
    let teacherCount = 0;
    let classCount = 0;
    let studentCount = 0;
    let subjectCount = 0;
    let activeTerm: Awaited<ReturnType<typeof prisma.term.findFirst>> = null;

    try {
      [school, teacherCount, classCount, studentCount, subjectCount, activeTerm] = await Promise.all([
        prisma.school.findUnique({ where: { id: profile.schoolId } }),
        prisma.profile.count({ where: { schoolId: profile.schoolId, role: ProfileRole.TEACHER, isActive: true } }),
        prisma.class.count({ where: { schoolId: profile.schoolId } }),
        prisma.student.count({ where: { schoolId: profile.schoolId } }),
        prisma.subject.count({ where: { schoolId: profile.schoolId } }),
        prisma.term.findFirst({ where: { schoolId: profile.schoolId, isActive: true } }),
      ]);
    } catch (error) {
      if (isPrismaSchemaMismatchError(error)) {
        return <WorkspacePanel eyebrow="Dashboard" title="Setup required"><p className="section-subtle">{schemaSyncMessage("Admin")}</p></WorkspacePanel>;
      }
      throw error;
    }

    if (!school) throw new Error("School not found.");

    const activeTermLabel = activeTerm ? `${activeTerm.sessionLabel} · ${activeTerm.termLabel}` : "No active term";
    const quickActions = [
      { href: "/app/admin/teachers", label: "Manage teachers", detail: "Invite, activate and assign staff", icon: UsersRound },
      { href: "/app/admin/classes", label: "Manage classes", detail: "Maintain the school class structure", icon: LayoutGrid },
      { href: "/app/admin/students/manage", label: "Manage students", detail: "Review records and enrollment", icon: GraduationCap },
      { href: "/app/admin/terms", label: "Manage sessions", detail: "Set the active academic period", icon: CalendarDays },
    ];

    return (
      <>
        <WorkspaceHero
          eyebrow="School command centre"
          title={school.name}
          description={`${school.country || "Country not set"} · ${activeTermLabel}. Review your school at a glance and continue the work that needs attention.`}
          action={<Link href="/app/admin/settings">School settings <Settings2 /></Link>}
        />

        <WorkspaceStatGrid>
          <WorkspaceStat label="Teachers" value={teacherCount} detail="Active teaching profiles" icon={<UsersRound />} />
          <WorkspaceStat label="Classes" value={classCount} detail="Configured class groups" icon={<LayoutGrid />} tone="gold" />
          <WorkspaceStat label="Students" value={studentCount} detail="School student records" icon={<GraduationCap />} tone="blue" />
          <WorkspaceStat label="Subjects" value={subjectCount} detail="Subjects in the catalogue" icon={<BookOpen />} tone="ink" />
        </WorkspaceStatGrid>

        <WorkspaceContentGrid>
          <WorkspacePanel eyebrow="Continue working" title="Quick actions" description="The most common school administration workflows, kept within one click." bodyClassName="workspace-panel-body-flush">
            <div className="workspace-action-list">
              {quickActions.map(({ href, label, detail, icon: Icon }) => (
                <Link href={href} key={href}>
                  <i><Icon /></i>
                  <span><strong>{label}</strong><small>{detail}</small></span>
                  <ArrowUpRight />
                </Link>
              ))}
            </div>
          </WorkspacePanel>

          <WorkspacePanel eyebrow="Academic context" title="Current workspace">
            <div className="workspace-fact-list">
              <div><span>Active session</span><strong>{activeTerm?.sessionLabel || "Not configured"}</strong></div>
              <div><span>Active term</span><strong>{activeTerm?.termLabel || "Not configured"}</strong></div>
              <div><span>School code</span><strong>{school.code}</strong></div>
            </div>
          </WorkspacePanel>
        </WorkspaceContentGrid>
      </>
    );
  } catch (error) {
    if (isRedirectError(error) || isDynamicServerError(error)) throw error;
    console.error("[dashboard][admin] Failed to render admin dashboard", error);
    const setupIssue = isPrismaSchemaMismatchError(error);
    return <WorkspacePanel eyebrow="Dashboard" title={setupIssue ? "Setup required" : "Admin dashboard temporarily unavailable"}><p className="section-subtle">{setupIssue ? schemaSyncMessage("Admin") : "We hit an unexpected issue while loading the dashboard. Refresh once; if it continues, the tagged server log will identify the failing operation."}</p></WorkspacePanel>;
  }
}
