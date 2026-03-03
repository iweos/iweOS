import { requireRole } from "@/lib/server/auth";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminAreaLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("admin");

  return (
    <AdminShell profileName={profile.fullName} profileEmail={profile.email}>
      {children}
    </AdminShell>
  );
}
