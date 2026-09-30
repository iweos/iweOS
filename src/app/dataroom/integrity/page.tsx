import { AlertTriangle, Building2, CircleCheckBig, CopyCheck, ShieldAlert, UsersRound } from "lucide-react";
import IntegrityCleanupButton from "@/components/dataroom/IntegrityCleanupButton";
import { removeEmptyGeneratedSchoolAction } from "@/lib/server/dataroom-actions";
import { scanAccountIntegrity } from "@/lib/server/account-integrity";
import { requireDataroomAccess } from "@/lib/server/dataroom-access";

type IntegrityPageProps = {
  searchParams: Promise<{ status?: string; message?: string }>;
};

export default async function AccountIntegrityPage({ searchParams }: IntegrityPageProps) {
  await requireDataroomAccess("integrity");
  const [report, params] = await Promise.all([scanAccountIntegrity(), searchParams]);
  const noticeStatus = params.status === "success" || params.status === "error" ? params.status : null;

  return (
    <>
      <section className="platform-page-heading">
        <div>
          <p>Account governance</p>
          <h1>Account integrity</h1>
          <span>Review accidental workspaces and duplicate staff records without risking operational school data.</span>
        </div>
        <strong>Guarded cleanup</strong>
      </section>

      {noticeStatus && params.message ? (
        <div className={`platform-integrity-notice ${noticeStatus}`} role="status">{params.message}</div>
      ) : null}

      <section className="platform-stat-grid">
        <article className="platform-stat">
          <div><span>Safe candidates</span><strong>{report.removableGeneratedSchools.length}</strong><small>Empty generated workspaces only</small></div>
          <i><CircleCheckBig /></i>
        </article>
        <article className="platform-stat gold">
          <div><span>Protected records</span><strong>{report.protectedCrossRole.length}</strong><small>Operational data remains untouched</small></div>
          <i><ShieldAlert /></i>
        </article>
        <article className="platform-stat blue">
          <div><span>Duplicate groups</span><strong>{report.duplicateTeacherGroups.length}</strong><small>Manual review is required</small></div>
          <i><CopyCheck /></i>
        </article>
      </section>

      <div className="platform-integrity-stack">
        <section className="platform-panel">
          <div className="platform-panel-heading">
            <div><p>Safe cleanup</p><h2>Empty generated workspaces</h2></div>
            <span>{report.removableGeneratedSchools.length} candidates</span>
          </div>
          {report.removableGeneratedSchools.length ? (
            <div className="platform-integrity-list">
              {report.removableGeneratedSchools.map((candidate) => (
                <article key={candidate.schoolId}>
                  <span className="platform-integrity-icon safe"><Building2 /></span>
                  <div>
                    <strong>{candidate.schoolName}</strong>
                    <small>{candidate.email}</small>
                    <p>Active teacher at {candidate.teacherSchools.map((school) => school.name).join(", ")}</p>
                  </div>
                  <form action={removeEmptyGeneratedSchoolAction}>
                    <input type="hidden" name="schoolId" value={candidate.schoolId} />
                    <input type="hidden" name="profileId" value={candidate.profileId} />
                    <IntegrityCleanupButton />
                  </form>
                </article>
              ))}
            </div>
          ) : (
            <div className="platform-empty compact"><CircleCheckBig /><h2>No safe cleanup candidates</h2><p>No empty auto-generated school currently meets every removal rule.</p></div>
          )}
        </section>

        <section className="platform-panel">
          <div className="platform-panel-heading">
            <div><p>Protected</p><h2>Cross-role records with real data</h2></div>
            <span>{report.protectedCrossRole.length} protected</span>
          </div>
          {report.protectedCrossRole.length ? (
            <div className="platform-integrity-list">
              {report.protectedCrossRole.map((record) => (
                <article key={record.profileId}>
                  <span className="platform-integrity-icon warning"><ShieldAlert /></span>
                  <div><strong>{record.schoolName}</strong><small>{record.email}</small><p>{record.reasons.join(" · ")}</p></div>
                  <i className="platform-status pending">Review only</i>
                </article>
              ))}
            </div>
          ) : (
            <div className="platform-empty compact"><ShieldAlert /><h2>No protected conflicts</h2><p>No cross-role account requires review.</p></div>
          )}
        </section>

        <section className="platform-panel">
          <div className="platform-panel-heading">
            <div><p>Duplicates</p><h2>Teacher profiles requiring review</h2></div>
            <span>{report.duplicateTeacherGroups.length} groups</span>
          </div>
          {report.duplicateTeacherGroups.length ? (
            <div className="platform-integrity-list">
              {report.duplicateTeacherGroups.map((group) => (
                <article key={`${group.schoolId}:${group.email}`}>
                  <span className="platform-integrity-icon warning"><UsersRound /></span>
                  <div>
                    <strong>{group.schoolName}</strong><small>{group.email}</small>
                    <p>{group.profiles.map((profile) => `${profile.name}: ${profile.linked ? "linked" : "unlinked"}, ${profile.dependencies} dependencies`).join(" · ")}</p>
                  </div>
                  <i className="platform-status pending">Manual review</i>
                </article>
              ))}
            </div>
          ) : (
            <div className="platform-empty compact"><CopyCheck /><h2>No duplicate teacher profiles</h2><p>Teacher identities are unique within their schools.</p></div>
          )}
        </section>

        <aside className="platform-integrity-policy">
          <AlertTriangle />
          <div><strong>Operational data is never auto-merged or deleted.</strong><p>Assignments, scores, conduct, notifications, payments, and other school records always force manual review.</p></div>
        </aside>
      </div>
    </>
  );
}
