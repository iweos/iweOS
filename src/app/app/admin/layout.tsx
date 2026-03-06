import { requireRole } from "@/lib/server/auth";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminAreaLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("admin");

  return (
    <>
      <link rel="stylesheet" href="/kaiadmin/assets/css/fonts.min.css" />
      <link rel="stylesheet" href="/kaiadmin/assets/css/bootstrap.min.css" />
      <link rel="stylesheet" href="/kaiadmin/assets/css/plugins.min.css" />
      <link rel="stylesheet" href="/kaiadmin/assets/css/kaiadmin.min.css" />
      <link rel="stylesheet" href="/kaiadmin/iweos-admin.css" />
      <AdminShell profileName={profile.fullName} profileEmail={profile.email}>
        {children}
      </AdminShell>
    </>
  );
}
