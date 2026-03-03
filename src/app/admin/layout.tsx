import { auth } from "@clerk/nextjs/server";
import { getCurrentProfile } from "@/lib/server/auth";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const profile = userId ? await getCurrentProfile(userId) : null;

  return (
    <AdminShell profileName={profile?.fullName} profileEmail={profile?.email}>
      {children}
    </AdminShell>
  );
}
