import { ProfileRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { ensureProfileForAuthenticatedUser, getPendingInviteProfilesForAuthenticatedUser } from "@/lib/server/auth";

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
      <section className="container py-5">
        <div className="card mx-auto" style={{ maxWidth: 620 }}>
          <div className="card-body p-4">
            <h1 className="h4 mb-2">Choose Your School</h1>
            <p className="text-muted mb-4">
              Your email is attached to multiple school profiles. Select the school where you should continue as admin.
            </p>
            <form method="get" className="d-grid gap-3">
              <label className="d-grid gap-1">
                <span className="field-label">School Profile</span>
                <select name="profileId" className="form-select" required defaultValue="">
                  <option value="" disabled>
                    Select a school profile
                  </option>
                  {pendingProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.schoolName} - {profile.role === ProfileRole.ADMIN ? "Admin" : "Teacher"}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="btn btn-primary">
                Continue
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  const profile = await ensureProfileForAuthenticatedUser(params.profileId);

  redirect(profile.role === ProfileRole.ADMIN ? "/app/admin/dashboard" : "/app/teacher/dashboard");
}
