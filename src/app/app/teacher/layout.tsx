import { ProfileRole } from "@prisma/client";
import AdminShell from "@/components/admin/AdminShell";
import { requireProfile } from "@/lib/server/auth";

export default async function TeacherAreaLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <>
      <link rel="stylesheet" href="/kaiadmin/assets/css/fonts.min.css" />
      <link rel="stylesheet" href="/kaiadmin/assets/css/bootstrap.min.css" />
      <link rel="stylesheet" href="/kaiadmin/assets/css/plugins.min.css" />
      <link rel="stylesheet" href="/kaiadmin/assets/css/kaiadmin.min.css" />
      <link rel="stylesheet" href="/kaiadmin/iweos-admin.css" />
      <AdminShell
        mode="teacher"
        homeHref="/app/teacher/dashboard"
        profileName={profile.fullName}
        profileEmail={profile.email}
        teacherPortalAdmin={profile.role === ProfileRole.ADMIN}
      >
        {children}
      </AdminShell>
    </>
  );
}
