import { Building2, ChevronRight, ShieldCheck } from "lucide-react";
import { ProfileRole } from "@prisma/client";
import { redirect } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import { signOutAction } from "@/lib/server/auth-actions";
import { ensureProfileForAuthenticatedUser, getPendingInviteProfilesForAuthenticatedUser } from "@/lib/server/auth";
import styles from "./onboarding.module.css";

type OnboardingSearchParams = {
  profileId?: string;
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<OnboardingSearchParams>;
}) {
  const params = await searchParams;
  const pendingProfiles = await getPendingInviteProfilesForAuthenticatedUser();

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

          <form method="get" className={styles.list}>
            {pendingProfiles.map((profile) => (
              <button className={styles.option} type="submit" name="profileId" value={profile.id} key={profile.id}>
                <span className={styles.schoolMark}>{profile.schoolName.slice(0, 1).toUpperCase()}</span>
                <span className={styles.schoolCopy}>
                  <strong>{profile.schoolName}</strong>
                  <small>{profile.role === ProfileRole.ADMIN ? "School administration" : "Teacher workspace"}</small>
                </span>
                <i className={profile.role === ProfileRole.ADMIN ? styles.adminRole : styles.teacherRole}>
                  {profile.role === ProfileRole.ADMIN ? "Admin" : "Teacher"}
                </i>
                <ChevronRight className={styles.arrow} />
              </button>
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

  const profile = await ensureProfileForAuthenticatedUser(params.profileId);
  redirect(profile.role === ProfileRole.ADMIN ? "/app/admin/dashboard" : "/app/teacher/dashboard");
}
