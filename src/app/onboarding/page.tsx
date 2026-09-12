import { Building2, Plus, ShieldCheck } from "lucide-react";
import { ProfileRole } from "@prisma/client";
import { redirect } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import WorkspaceOptionButton from "@/components/auth/WorkspaceOptionButton";
import { createSchoolFromOnboardingAction, selectWorkspaceAction, signOutAction } from "@/lib/server/auth-actions";
import { ensureProfileForAuthenticatedUser, getPendingInviteProfilesForAuthenticatedUser } from "@/lib/server/auth";
import { getAuthPortalPreference } from "@/lib/server/session";
import styles from "./onboarding.module.css";

type OnboardingSearchParams = {
  profileId?: string;
  error?: string;
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<OnboardingSearchParams>;
}) {
  const params = await searchParams;
  if (await getAuthPortalPreference() === "student") redirect("/student");
  const pendingProfiles = await getPendingInviteProfilesForAuthenticatedUser();

  if (pendingProfiles.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.glow} aria-hidden="true" />
        <section className={styles.modal} aria-labelledby="workspace-title">
          <header className={styles.header}>
            <BrandLogo href="/" variant="dark" className={styles.brand} textClassName={styles.brandName} />
            <span className={styles.secure}><ShieldCheck /> Secure access</span>
          </header>
          <div className={styles.intro}>
            <span className={styles.icon}><Building2 /></span>
            <p>School ownership</p>
            <h1 id="workspace-title">Create your school workspace</h1>
            <span>No school has assigned this account. Create a school only if you are setting up iweOS for the organisation.</span>
          </div>
          {params.error ? <div className={styles.error} role="alert">{params.error}</div> : null}
          <form action={createSchoolFromOnboardingAction} className={styles.setupForm}>
            <label htmlFor="school-name">School name</label>
            <input id="school-name" name="schoolName" placeholder="e.g. Greenwood Academy" minLength={2} maxLength={120} required autoFocus />
            <button type="submit"><Plus /> Create school workspace</button>
          </form>
          <footer className={styles.footer}>
            <span><ShieldCheck /> Teachers should ask their school administrator to add their email first.</span>
            <form action={signOutAction}><button type="submit">Use another account</button></form>
          </footer>
        </section>
      </main>
    );
  }

  if (pendingProfiles.length > 1 && !params.profileId) {
    return (
      <main className={styles.page}>
        <div className={styles.glow} aria-hidden="true" />
        <section className={styles.modal} aria-labelledby="workspace-title">
          <header className={styles.header}>
            <BrandLogo href="/" variant="dark" className={styles.brand} textClassName={styles.brandName} />
            <span className={styles.secure}><ShieldCheck /> Secure access</span>
          </header>

          <div className={styles.intro}>
            <span className={styles.icon}><Building2 /></span>
            <p>Choose a workspace</p>
            <h1 id="workspace-title">Where are you working today?</h1>
            <span>Your account belongs to more than one school. Choose the workspace and role you want to open.</span>
          </div>

          {params.error ? <div className={styles.error} role="alert">{params.error}</div> : null}
          <form action={selectWorkspaceAction} className={styles.list}>
            {pendingProfiles.map((profile) => (
              <WorkspaceOptionButton
                profileId={profile.id}
                schoolName={profile.schoolName}
                role={profile.role}
                key={profile.id}
              />
            ))}
          </form>

          <footer className={styles.footer}>
            <span><ShieldCheck /> Only workspaces assigned to your verified email are shown.</span>
            <form action={signOutAction}><button type="submit">Use another account</button></form>
          </footer>
        </section>
      </main>
    );
  }

  const profile = await ensureProfileForAuthenticatedUser(params.profileId ?? pendingProfiles[0]?.id);
  redirect(profile.role === ProfileRole.ADMIN ? "/app/admin/dashboard" : "/app/teacher/dashboard");
}
