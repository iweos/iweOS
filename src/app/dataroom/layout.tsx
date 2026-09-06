import { ProfileRole } from "@prisma/client";
import DataroomShell from "@/components/dataroom/DataroomShell";
import { requirePlatformAdmin } from "@/lib/server/auth";
import "./dataroom.css";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const context = await requirePlatformAdmin();
  const schoolPortalHref = context.activeProfile
    ? context.activeProfile.role === ProfileRole.ADMIN
      ? "/app/admin/dashboard"
      : "/app/teacher/dashboard"
    : undefined;

  return <DataroomShell email={context.email} schoolPortalHref={schoolPortalHref}>{children}</DataroomShell>;
}
